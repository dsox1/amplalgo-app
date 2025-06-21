require("dotenv").config(); // Load environment variables

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const bodyParser = require("body-parser");
const kuCoin = require("./kucoin/api"); // Import directly without 'new'

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Global variables
let currentThreshold = 1.25; // Default threshold
let waitForWebhook = true; // Default to wait for webhook
let sellOnThreshold = false; // Default not to sell on threshold
let currentAmplPrice = 0; // Current AMPL price

// Unique order tracking
const processedOrderIds = new Set(); // Track already processed order IDs
const ORDER_ID_EXPIRATION = 60 * 60 * 1000; // Expire order IDs after 1 hour

// Timing intervals
const BALANCE_FETCH_INTERVAL = 280000; // Fetch balance every 280 seconds
const AMPL_PRICE_FETCH_INTERVAL = 180000; // Fetch AMPL price every 180 seconds

// Routes
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Webhook endpoint
app.post("/webhook", (req, res) => {
    console.log("Webhook received:", req.body);
    
    // Emit webhook data to all connected clients
    io.emit("new_webhook", req.body);
    
    // Process webhook data if it contains trading signals
    processWebhook(req.body);
    
    // Send response
    res.status(200).json({ status: "success", message: "Webhook received" });
});

// Socket.IO connection handling
io.on("connection", (socket) => {
    console.log("Client connected");
    
    // Send current threshold to newly connected client
    socket.emit("threshold", { threshold: currentThreshold });
    
    // Send current sell behavior to newly connected client
    socket.emit("sell_behavior", { 
        waitForWebhook: waitForWebhook, 
        sellOnThreshold: sellOnThreshold 
    });
    
    // Send current AMPL price to newly connected client
    if (currentAmplPrice > 0) {
        socket.emit("ampl_price_update", { price: currentAmplPrice });
    }
    
    // Handle threshold updates from client
    socket.on("update_threshold", (data) => {
        if (data.threshold) {
            const newThreshold = parseFloat(data.threshold);
            
            // Only update if the threshold actually changed
            if (newThreshold !== currentThreshold) {
                currentThreshold = newThreshold;
                console.log("Threshold updated to:", currentThreshold);
                
                // Broadcast updated threshold to all clients
                io.emit("threshold", { threshold: currentThreshold });
                
                // Generate a unique order ID for this threshold update
                const orderId = `threshold_update_${Date.now()}`;
                
                // If sell on threshold is enabled, place a limit order at the new threshold
                if (sellOnThreshold && currentAmplPrice > 0) {
                    placeLimitOrderOnce("AMPL-USDT", currentThreshold, orderId);
                }
            }
        }
    });
    
    // Handle sell behavior updates from client
    socket.on("update_sell_behavior", (data) => {
        if (data.waitForWebhook !== undefined && data.sellOnThreshold !== undefined) {
            const previousSellOnThreshold = sellOnThreshold;
            waitForWebhook = data.waitForWebhook;
            sellOnThreshold = data.sellOnThreshold;
            
            console.log("Sell behavior updated:", { waitForWebhook, sellOnThreshold });
            
            // Broadcast updated sell behavior to all clients
            io.emit("sell_behavior", { waitForWebhook, sellOnThreshold });
            
            // Generate a unique order ID for this behavior update
            const orderId = `behavior_update_${Date.now()}`;
            
            // Only place a limit order if sell on threshold was just enabled (changed from false to true)
            if (sellOnThreshold && !previousSellOnThreshold && currentAmplPrice > 0 && currentThreshold > 0) {
                console.log("Sell threshold was just enabled, placing limit order");
                placeLimitOrderOnce("AMPL-USDT", currentThreshold, orderId);
            }
        }
    });
    
    // Handle client requests for current threshold
    socket.on("get_threshold", () => {
        socket.emit("threshold", { threshold: currentThreshold });
    });
    
    // Handle client requests for current sell behavior
    socket.on("get_sell_behavior", () => {
        socket.emit("sell_behavior", { 
            waitForWebhook: waitForWebhook, 
            sellOnThreshold: sellOnThreshold 
        });
    });
    
    // Handle client requests for current AMPL price
    socket.on("get_ampl_price", () => {
        if (currentAmplPrice > 0) {
            socket.emit("ampl_price_update", { price: currentAmplPrice });
        } else {
            fetchAmplPrice();
        }
    });
    
    // Handle limit order placement requests
    socket.on("place_limit_order", (data) => {
        if (data.price && data.symbol) {
            const price = parseFloat(data.price);
            const symbol = data.symbol;
            
            // Generate a unique order ID for this manual order
            const orderId = `manual_order_${Date.now()}`;
            
            placeLimitOrderOnce(symbol, price, orderId);
        }
    });
    
    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});

// Clean up expired order IDs periodically
setInterval(() => {
    const now = Date.now();
    const expiredIds = [];
    
    // Find expired order IDs (older than ORDER_ID_EXPIRATION)
    processedOrderIds.forEach(entry => {
        const [id, timestamp] = entry.split('|');
        if (now - parseInt(timestamp) > ORDER_ID_EXPIRATION) {
            expiredIds.push(entry);
        }
    });
    
    // Remove expired order IDs
    expiredIds.forEach(id => {
        processedOrderIds.delete(id);
    });
    
    if (expiredIds.length > 0) {
        console.log(`Cleaned up ${expiredIds.length} expired order IDs. Remaining: ${processedOrderIds.size}`);
    }
}, 30 * 60 * 1000); // Run every 30 minutes

// Process webhook data
async function processWebhook(data) {
    try {
        // Extract action (buy/sell)
        const action = data.action || data.side || "";
        
        // Extract symbol
        let symbol = data.ticker || data.symbol || "";
        
        // Convert symbol format if needed (e.g., AMPLUSDT -> AMPL-USDT)
        symbol = formatSymbol(symbol);
        
        // Extract price
        const price = parseFloat(data.price || data.entry || 0);
        
        // Extract amount/size
        let amount = 0;
        
        // Try to extract amount from various possible fields
        if (data.amount) {
            amount = parseFloat(data.amount);
        } else if (data.position && data.position.size) {
            amount = parseFloat(data.position.size);
        } else if (data.new_trade_size) {
            // Handle expressions like "47.103 * 1.01"
            const sizeStr = data.new_trade_size.toString();
            if (sizeStr.includes("*")) {
                const parts = sizeStr.split("*").map(p => parseFloat(p.trim()));
                if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                    amount = parts[0] * parts[1];
                } else {
                    amount = parseFloat(sizeStr);
                }
            } else {
                amount = parseFloat(sizeStr);
            }
        }
        
        // Update AMPL price if available
        if (price > 0 && symbol === "AMPL-USDT") {
            currentAmplPrice = price;
            io.emit("ampl_price_update", { price });
        }
        
        // Generate a unique order ID for this webhook
        const orderId = `webhook_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        
        // Process order based on action and settings
        if (action.toLowerCase() === "buy") {
            // For buy orders, always process if waitForWebhook is true
            if (waitForWebhook) {
                console.log(`Processing buy order for ${symbol} at ${price}`);
                await placeOrderOnce(symbol, "buy", price, amount, orderId);
            } else {
                console.log("Webhook received but not processing order - waiting for threshold only.");
            }
        } else if (action.toLowerCase() === "sell") {
            // For sell orders, process if waitForWebhook is true
            if (waitForWebhook) {
                console.log(`Processing sell order for ${symbol} at ${price}`);
                await placeOrderOnce(symbol, "sell", price, amount, orderId);
            } else {
                console.log("Webhook received but not processing order - waiting for threshold only.");
            }
        } else {
            console.log("Webhook does not contain valid action (buy/sell)");
        }
    } catch (error) {
        console.error("Error processing webhook:", error);
    }
}

// Format symbol to KuCoin format
function formatSymbol(symbol) {
    if (!symbol) return "AMPL-USDT"; // Default
    
    // Remove any non-alphanumeric characters
    const cleanSymbol = symbol.replace(/[^a-zA-Z0-9]/g, "");
    
    // Check if it contains AMPL and USDT
    if (cleanSymbol.includes("AMPL") && cleanSymbol.includes("USDT")) {
        return "AMPL-USDT";
    }
    
    return symbol;
}

// Check if an order ID has been processed before
function isOrderProcessed(orderId) {
    const orderKey = `${orderId}|${Date.now()}`;
    
    // Check if this order ID has been processed before
    if (processedOrderIds.has(orderId)) {
        console.log(`Order ${orderId} has already been processed. Skipping.`);
        return true;
    }
    
    // Mark this order ID as processed
    processedOrderIds.add(orderKey);
    console.log(`Marked order ${orderId} as processed. Total processed orders: ${processedOrderIds.size}`);
    return false;
}

// Place order on KuCoin with duplicate prevention
async function placeOrderOnce(symbol, side, price, amount, orderId) {
    // Skip if this order ID has been processed before
    if (isOrderProcessed(orderId)) {
        return null;
    }
    
    try {
        // Validate inputs
        if (!symbol || !side || !price || !amount) {
            throw new Error("Missing required parameters for order placement");
        }
        
        // Format symbol to KuCoin format
        const kucoinSymbol = formatSymbol(symbol);
        
        // Determine order type based on side and settings
        let orderType = "market";
        if (side.toLowerCase() === "sell" && sellOnThreshold) {
            orderType = "limit";
        }
        
        // Place order
        const orderParams = {
            symbol: kucoinSymbol,
            side: side.toLowerCase(),
            price: price,
            size: amount,
            type: orderType
        };
        
        console.log(`Placing ${orderType} ${side} order for ${kucoinSymbol}:`, orderParams);
        
        let result;
        
        // Place order on KuCoin based on order type
        if (orderType === "market") {
            result = await kuCoin.placeMarketOrder(orderParams);
        } else if (orderType === "limit") {
            result = await kuCoin.placeLimitOrder(orderParams);
        }
        
        // Emit order result to clients
        io.emit("order", {
            success: true,
            status: "Order Placed",
            message: `${orderType.toUpperCase()} ${side.toUpperCase()} order placed for ${kucoinSymbol}`,
            details: result
        });
        
        return result;
    } catch (error) {
        console.error(`Error placing ${side} order:`, error);
        
        // Emit error to clients
        io.emit("order", {
            success: false,
            status: "Order Failed",
            message: `Failed to place order: ${error.message}`,
            details: error
        });
        
        throw error;
    }
}

// Place limit order directly with duplicate prevention
async function placeLimitOrderOnce(symbol, price, orderId) {
    // Skip if this order ID has been processed before
    if (isOrderProcessed(orderId)) {
        return null;
    }
    
    try {
        // Format symbol to KuCoin format
        const kucoinSymbol = formatSymbol(symbol);
        
        console.log(`Placing limit sell order for ${kucoinSymbol} at price ${price} with order ID ${orderId}`);
        
        // Get available AMPL balance
        const amount = await getAvailableAmplBalance();
        
        if (amount <= 0) {
            console.log("No AMPL balance available for limit sell order");
            io.emit("order", {
                success: false,
                status: "Order Failed",
                message: "No AMPL balance available for limit sell order"
            });
            return;
        }
        
        // Place limit sell order directly using kuCoin.placeLimitOrder
        const orderParams = {
            symbol: kucoinSymbol,
            side: "sell",
            price: price,
            size: amount
        };
        
        console.log(`Directly calling kuCoin.placeLimitOrder with params:`, orderParams);
        const result = await kuCoin.placeLimitOrder(orderParams);
        
        console.log(`Limit sell order placed for ${kucoinSymbol} at price ${price}, amount ${amount}`);
        
        // Emit order result to clients
        io.emit("order", {
            success: true,
            status: "Order Placed",
            message: `LIMIT SELL order placed for ${kucoinSymbol} at price ${price}`,
            details: result
        });
        
        return result;
    } catch (error) {
        console.error(`Error placing limit sell order:`, error);
        
        // Emit error to clients
        io.emit("order", {
            success: false,
            status: "Order Failed",
            message: `Failed to place limit sell order: ${error.message}`
        });
    }
}

// Get available AMPL balance
async function getAvailableAmplBalance() {
    try {
        const balance = await kuCoin.getBalance("AMPL");
        if (balance && balance.available) {
            return parseFloat(balance.available);
        } else {
            return 0;
        }
    } catch (error) {
        console.error("Error fetching AMPL balance:", error);
        return 0;
    }
}

// Fetch AMPL price
async function fetchAmplPrice() {
    try {
        const ticker = await kuCoin.getTickerPrice("AMPL-USDT");
        if (ticker && (ticker.price || ticker.last)) {
            const price = parseFloat(ticker.price || ticker.last);
            if (!isNaN(price) && price > 0) {
                currentAmplPrice = price;
                io.emit("ampl_price_update", { price });
                console.log("AMPL price updated:", price);
                
                // Update KuCoin API threshold
                kuCoin.setSellPriceThreshold(currentThreshold);
            }
        }
    } catch (error) {
        console.error("Error fetching AMPL price:", error);
    }
}

// Fetch KuCoin USDT balance
async function fetchKuCoinBalance() {
    try {
        const balance = await kuCoin.getBalance("USDT");
        if (balance) {
            const usdtBalance = parseFloat(balance.total || 0).toFixed(2);
            io.emit("kucoin_balance", { balance: usdtBalance });
            console.log("KuCoin USDT balance updated:", usdtBalance);
        } else {
            console.error("Error fetching KuCoin USDT balance: No balance data returned");
            // Send error to frontend to prevent stuck loading state
            io.emit("kucoin_balance", { balance: "Error", error: "Could not retrieve balance" });
        }
    } catch (error) {
        console.error("Error fetching KuCoin USDT balance:", error);
        // Send error to frontend to prevent stuck loading state
        io.emit("kucoin_balance", { balance: "Error", error: error.message || "Unknown error" });
    }
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // Set initial threshold in KuCoin API
    kuCoin.setSellPriceThreshold(currentThreshold);
    
    // Fetch initial data
    fetchAmplPrice();
    fetchKuCoinBalance();
    
    // Set up periodic data fetching
    setInterval(fetchAmplPrice, AMPL_PRICE_FETCH_INTERVAL);
    setInterval(fetchKuCoinBalance, BALANCE_FETCH_INTERVAL);
});
