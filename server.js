require("dotenv").config(); // Load environment variables

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const kuCoin = require("./kucoin/api");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// AMPL Manager state
let amplManagerEnabled = false;
let amplManagerInterval = null;
let lastAmplPrice = null;
let lastUsdtBalance = null;

// AMPL Manager configuration
const AMPL_BUY_LEVELS = [1.16, 1.12, 1.08, 1.04, 1.00, 0.96, 0.92, 0.85];
const AMPL_ORDER_SIZE = '10'; // 10 AMPL per order
const AMPL_SYMBOL = 'AMPL-USDT';
const PROFIT_MARGIN = 0.03; // 3% profit margin

// ===== AMPL BUY ORDER MANAGEMENT SYSTEM =====

// Check and place missing buy orders
async function checkAndPlaceBuyOrders() {
    try {
        console.log('Checking and placing AMPL buy orders...');
        
        // Get current active orders
        const activeOrders = await kuCoin.getActiveOrders(AMPL_SYMBOL);
        const activeBuyOrders = activeOrders.filter(order => order.side === 'buy');
        
        // Get current price to determine which levels to place
        const priceData = await kuCoin.getTickerPrice(AMPL_SYMBOL);
        const currentPrice = parseFloat(priceData.price);
        
        // Find missing buy order levels (only below current price)
        const missingLevels = [];
        for (const level of AMPL_BUY_LEVELS) {
            if (level < currentPrice) {
                const hasOrderAtLevel = activeBuyOrders.some(order => 
                    Math.abs(parseFloat(order.price) - level) < 0.01
                );
                
                if (!hasOrderAtLevel) {
                    missingLevels.push(level);
                }
            }
        }
        
        // Place missing buy orders
        for (const level of missingLevels) {
            try {
                const orderResult = await kuCoin.placeLimitOrder({
                    symbol: AMPL_SYMBOL,
                    side: 'buy',
                    size: AMPL_ORDER_SIZE,
                    price: level.toString()
                });
                
                if (orderResult.success) {
                    console.log(`AMPL missing buy order placed at level ${missingLevels.indexOf(level) + 1}: $${level}`);
                    
                    // Emit order update via Socket.io
                    io.emit('order_placed', {
                        symbol: AMPL_SYMBOL,
                        side: 'buy',
                        price: level,
                        size: AMPL_ORDER_SIZE,
                        level: missingLevels.indexOf(level) + 1
                    });
                } else {
                    console.error(`Failed to place buy order at $${level}:`, orderResult.error);
                }
                
                // Small delay between orders
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                console.error(`Error placing buy order at $${level}:`, error);
            }
        }
        
        return {
            currentPrice,
            activeBuyOrders: activeBuyOrders.length,
            missingLevels,
            ordersPlaced: missingLevels.length
        };
        
    } catch (error) {
        console.error('Error in checkAndPlaceBuyOrders:', error);
        return {
            error: error.message,
            activeBuyOrders: 0,
            missingLevels: [],
            ordersPlaced: 0
        };
    }
}

// Monitor filled orders and handle selling
async function monitorFilledOrders() {
    try {
        console.log('Monitoring AMPL filled orders...');
        
        // Get AMPL balance
        const amplBalance = await kuCoin.getBalance('AMPL');
        const availableAmpl = parseFloat(amplBalance.available);
        
        // Get current price
        const priceData = await kuCoin.getTickerPrice(AMPL_SYMBOL);
        const currentPrice = parseFloat(priceData.price);
        
        let ordersChecked = 0;
        let ordersFilled = 0;
        let sellOrdersPlaced = 0;
        let rebaseProtections = 0;
        let errors = [];
        let replacementOrders = 0;
        
        // Check if we have AMPL to sell (indicating filled buy orders)
        if (availableAmpl >= parseFloat(AMPL_ORDER_SIZE)) {
            const sellQuantity = Math.floor(availableAmpl / parseFloat(AMPL_ORDER_SIZE)) * parseFloat(AMPL_ORDER_SIZE);
            
            // AMPL Rebase Protection: Check if selling would result in loss
            const averageBuyPrice = 1.08; // Approximate average of buy levels
            const rebaseThreshold = averageBuyPrice * (1 - PROFIT_MARGIN);
            
            if (currentPrice > rebaseThreshold) {
                // Safe to sell - price is above rebase protection threshold
                const sellPrice = (currentPrice * (1 + PROFIT_MARGIN)).toFixed(4);
                
                try {
                    const sellResult = await kuCoin.placeLimitOrder({
                        symbol: AMPL_SYMBOL,
                        side: 'sell',
                        size: sellQuantity.toString(),
                        price: sellPrice
                    });
                    
                    if (sellResult.success) {
                        console.log(`AMPL sell order placed: ${sellQuantity} AMPL at $${sellPrice}`);
                        sellOrdersPlaced++;
                        
                        // Emit sell order update
                        io.emit('order_placed', {
                            symbol: AMPL_SYMBOL,
                            side: 'sell',
                            price: parseFloat(sellPrice),
                            size: sellQuantity,
                            profit_margin: PROFIT_MARGIN
                        });
                    } else {
                        errors.push(`Failed to place sell order: ${sellResult.error}`);
                    }
                } catch (error) {
                    errors.push(`Error placing sell order: ${error.message}`);
                }
            } else {
                // AMPL Rebase Protection activated
                console.log(`AMPL Rebase Protection: Holding ${sellQuantity} AMPL (price $${currentPrice} below threshold $${rebaseThreshold.toFixed(4)})`);
                rebaseProtections++;
                
                // Emit rebase protection notification
                io.emit('rebase_protection', {
                    symbol: AMPL_SYMBOL,
                    current_price: currentPrice,
                    threshold_price: rebaseThreshold,
                    protected_amount: sellQuantity
                });
            }
        }
        
        // Check and replace any missing buy orders
        const buyOrderResult = await checkAndPlaceBuyOrders();
        replacementOrders = buyOrderResult.ordersPlaced || 0;
        
        const result = {
            ordersChecked,
            ordersFilled,
            sellOrdersPlaced,
            rebaseProtections,
            errors,
            replacementOrders
        };
        
        console.log('AMPL Monitor Result:', result);
        
        // Emit monitoring update
        io.emit('ampl_monitor_update', {
            ...result,
            current_price: currentPrice,
            ampl_balance: availableAmpl,
            timestamp: new Date().toISOString()
        });
        
        return result;
        
    } catch (error) {
        console.error('Error in monitorFilledOrders:', error);
        return {
            ordersChecked: 0,
            ordersFilled: 0,
            sellOrdersPlaced: 0,
            rebaseProtections: 0,
            errors: [error.message],
            replacementOrders: 0
        };
    }
}

// Auto-detect existing AMPL orders
async function detectExistingAmplOrders() {
    try {
        console.log('Auto-detecting existing AMPL orders...');
        
        const activeOrders = await kuCoin.getActiveOrders(AMPL_SYMBOL);
        const buyOrders = activeOrders.filter(order => order.side === 'buy');
        
        const result = {
            systemDetected: buyOrders.length > 0,
            buyOrdersCount: buyOrders.length,
            buyOrders: buyOrders.map(order => ({
                price: parseFloat(order.price),
                size: parseFloat(order.size)
            })),
            missingLevels: [],
            enabled: buyOrders.length > 0
        };
        
        if (buyOrders.length > 0) {
            // Find missing levels
            const currentPrice = await kuCoin.getTickerPrice(AMPL_SYMBOL);
            const price = parseFloat(currentPrice.price);
            
            for (const level of AMPL_BUY_LEVELS) {
                if (level < price) {
                    const hasOrderAtLevel = buyOrders.some(order => 
                        Math.abs(parseFloat(order.price) - level) < 0.01
                    );
                    
                    if (!hasOrderAtLevel) {
                        result.missingLevels.push(level);
                    }
                }
            }
            
            // Auto-enable if orders detected
            amplManagerEnabled = true;
            console.log(`AMPL Manager auto-enabled with ${buyOrders.length} existing buy orders`);
        }
        
        console.log('AMPL order detection result:', result);
        
        // Emit auto-detection result
        io.emit('ampl_auto_detection', result);
        
        return result;
        
    } catch (error) {
        console.error('Error in detectExistingAmplOrders:', error);
        return {
            systemDetected: false,
            buyOrdersCount: 0,
            buyOrders: [],
            missingLevels: AMPL_BUY_LEVELS,
            enabled: false
        };
    }
}

// Get AMPL Manager status
async function getAmplManagerStatus() {
    try {
        const amplBalance = await kuCoin.getBalance('AMPL');
        const activeOrders = await kuCoin.getActiveOrders(AMPL_SYMBOL);
        const buyOrders = activeOrders.filter(order => order.side === 'buy');
        const sellOrders = activeOrders.filter(order => order.side === 'sell');
        
        return {
            enabled: amplManagerEnabled,
            ampl_balance: parseFloat(amplBalance.available),
            active_trades: sellOrders.length,
            pending_trades: buyOrders.length,
            buy_orders_total: buyOrders.reduce((sum, order) => sum + (parseFloat(order.price) * parseFloat(order.size)), 0),
            current_value: parseFloat(amplBalance.available) * (lastAmplPrice || 1.15),
            last_update: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error getting AMPL Manager status:', error);
        return {
            enabled: amplManagerEnabled,
            ampl_balance: 0,
            active_trades: 0,
            pending_trades: 0,
            buy_orders_total: 0,
            current_value: 0,
            last_update: new Date().toISOString(),
            error: error.message
        };
    }
}

// Start AMPL Manager monitoring
function startAmplManager() {
    if (amplManagerInterval) {
        clearInterval(amplManagerInterval);
    }
    
    amplManagerEnabled = true;
    
    // Initial setup
    checkAndPlaceBuyOrders();
    
    // Monitor every 30 seconds
    amplManagerInterval = setInterval(() => {
        if (amplManagerEnabled) {
            monitorFilledOrders();
        }
    }, 30000);
    
    console.log('AMPL Manager started - monitoring every 30 seconds');
}

// Stop AMPL Manager monitoring
function stopAmplManager() {
    amplManagerEnabled = false;
    
    if (amplManagerInterval) {
        clearInterval(amplManagerInterval);
        amplManagerInterval = null;
    }
    
    console.log('AMPL Manager stopped');
}

// ===== PRICE AND BALANCE MONITORING =====

// Fetch KuCoin balance
async function fetchKuCoinBalance() {
    try {
        const balance = await kuCoin.getBalance('USDT');
        const balanceValue = parseFloat(balance.available);
        
        if (balanceValue !== lastUsdtBalance) {
            lastUsdtBalance = balanceValue;
            console.log(`KuCoin USDT balance updated: ${balanceValue.toFixed(2)}`);
            
            // Emit balance update to all connected clients
            io.emit('balance_update', {
                currency: 'USDT',
                balance: balanceValue.toFixed(2),
                timestamp: new Date().toISOString()
            });
        }
        
        return balanceValue;
    } catch (error) {
        console.error('Error fetching KuCoin balance:', error);
        return lastUsdtBalance || 1000.00; // Fallback value
    }
}

// Fetch AMPL price
async function fetchAmplPrice() {
    try {
        const priceData = await kuCoin.getTickerPrice(AMPL_SYMBOL);
        const price = parseFloat(priceData.price);
        
        if (price !== lastAmplPrice) {
            lastAmplPrice = price;
            console.log(`AMPL price updated: ${price}`);
            
            // Update sell price threshold
            kuCoin.setSellPriceThreshold(price * 1.25);
            
            // Emit price update to all connected clients
            io.emit('price_update', {
                symbol: AMPL_SYMBOL,
                price: price,
                timestamp: new Date().toISOString()
            });
        }
        
        return price;
    } catch (error) {
        console.error('Error fetching AMPL price:', error);
        return lastAmplPrice || 1.15; // Fallback value
    }
}

// ===== API ROUTES =====

// AMPL Manager API routes
app.post('/api/ampl/toggle', async (req, res) => {
    try {
        const { enable } = req.body;
        
        if (enable) {
            startAmplManager();
        } else {
            stopAmplManager();
        }
        
        const status = await getAmplManagerStatus();
        
        res.json({
            success: true,
            enabled: amplManagerEnabled,
            message: `AMPL Manager ${enable ? 'enabled' : 'disabled'}`,
            status: status
        });
        
    } catch (error) {
        console.error('Error toggling AMPL Manager:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/ampl/status', async (req, res) => {
    try {
        const status = await getAmplManagerStatus();
        res.json(status);
    } catch (error) {
        console.error('Error getting AMPL Manager status:', error);
        res.status(500).json({
            error: error.message
        });
    }
});

app.post('/api/ampl/detect', async (req, res) => {
    try {
        const result = await detectExistingAmplOrders();
        res.json(result);
    } catch (error) {
        console.error('Error detecting AMPL orders:', error);
        res.status(500).json({
            error: error.message
        });
    }
});

app.post('/api/ampl/monitor', async (req, res) => {
    try {
        const result = await monitorFilledOrders();
        res.json(result);
    } catch (error) {
        console.error('Error monitoring AMPL orders:', error);
        res.status(500).json({
            error: error.message
        });
    }
});

// Webhook endpoint
app.post("/webhook", (req, res) => {
    console.log("Webhook received:", req.body);
    
    // Emit webhook data to all connected clients
    io.emit("webhook_data", {
        data: req.body,
        timestamp: new Date().toISOString()
    });
    
    res.status(200).json({ message: "Webhook received successfully" });
});

// Serve the main page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// ===== SOCKET.IO EVENTS =====

io.on("connection", (socket) => {
    console.log("Client connected");
    
    // Send initial data
    socket.emit('balance_update', {
        currency: 'USDT',
        balance: lastUsdtBalance || '0.00',
        timestamp: new Date().toISOString()
    });
    
    socket.emit('price_update', {
        symbol: AMPL_SYMBOL,
        price: lastAmplPrice || 0,
        timestamp: new Date().toISOString()
    });
    
    // AMPL Manager events
    socket.on('toggle_ampl_manager', async (data) => {
        try {
            const { enable } = data;
            
            if (enable) {
                startAmplManager();
            } else {
                stopAmplManager();
            }
            
            const status = await getAmplManagerStatus();
            
            socket.emit('ampl_manager_toggle_result', {
                success: true,
                enabled: amplManagerEnabled,
                message: `AMPL Manager ${enable ? 'enabled' : 'disabled'}`,
                status: status
            });
            
        } catch (error) {
            console.error('Error toggling AMPL Manager via Socket.io:', error);
            socket.emit('ampl_manager_toggle_result', {
                success: false,
                error: error.message
            });
        }
    });
    
    socket.on('get_ampl_manager_status', async () => {
        try {
            const status = await getAmplManagerStatus();
            socket.emit('ampl_manager_status', status);
        } catch (error) {
            console.error('Error getting AMPL Manager status via Socket.io:', error);
            socket.emit('ampl_manager_status', {
                enabled: false,
                error: error.message
            });
        }
    });
    
    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // Set sell price threshold
    kuCoin.setSellPriceThreshold(1.25);
    
    // Start price and balance monitoring
    fetchAmplPrice();
    fetchKuCoinBalance();
    
    // Update price and balance every 10 seconds
    setInterval(fetchAmplPrice, 10000);
    setInterval(fetchKuCoinBalance, 30000);
    
    // Auto-detect existing AMPL orders after 5 seconds
    setTimeout(detectExistingAmplOrders, 5000);
});

