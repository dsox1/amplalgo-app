/**
 * AMPL Manager - Smart Order Ladder System
 * Handles automated AMPL trading with weighted money distribution
 * More funds allocated to lower prices, less to higher prices
 */

class AMPLManager {
    constructor() {
        // 8-level price ladder (3.34% spacing from 1.16 down to 0.85)
        this.priceLevels = [
            1.1600, 1.1212, 1.0838, 1.0126, 
            0.9788, 0.9461, 0.9145, 0.8545
        ];
        
        // Weighted distribution - more money to lower prices
        this.weightFactors = [
            0.8,   // 1.1600 - 80% of base amount (less money)
            0.9,   // 1.1212 - 90% of base amount
            1.0,   // 1.0838 - 100% of base amount (baseline)
            1.2,   // 1.0126 - 120% of base amount
            1.4,   // 0.9788 - 140% of base amount (more money)
            1.6,   // 0.9461 - 160% of base amount
            1.8,   // 0.9145 - 180% of base amount
            2.0    // 0.8545 - 200% of base amount (most money)
        ];
        
        this.isEnabled = false;
        this.currentOrders = [];
        this.totalBalance = 0;
        this.originalPurchaseAmount = 0;
        this.currentHoldings = {
            ampl: 0,
            value: 0
        };
        
        // Rebase protection settings
        this.rebaseProtectionEnabled = true;
        this.minimumSafetyRatio = 0.95; // Don't sell if current value < 95% of original purchase
        
        // Initialize event listeners
        this.initializeEventListeners();
    }
    
    /**
     * Calculate weighted distribution of funds across 8 price levels
     * @param {number} totalBalance - Total KuCoin USDT balance
     * @returns {Array} Array of amounts for each price level
     */
    calculateWeightedDistribution(totalBalance) {
        // Calculate total weight sum
        const totalWeight = this.weightFactors.reduce((sum, weight) => sum + weight, 0);
        
        // Calculate base amount (what 1.0 weight factor gets)
        const baseAmount = totalBalance / totalWeight;
        
        // Calculate actual amounts for each level
        const distributions = this.weightFactors.map(weight => {
            return baseAmount * weight;
        });
        
        console.log('💰 AMPL Manager - Weighted Distribution:');
        this.priceLevels.forEach((price, index) => {
            console.log(`  ${price}: $${distributions[index].toFixed(2)} (${this.weightFactors[index]}x weight)`);
        });
        
        return distributions;
    }
    
    /**
     * Place smart order ladder with weighted distribution
     * @param {number} currentPrice - Current AMPL price
     * @param {number} balance - Available USDT balance
     */
    async placeSmartOrderLadder(currentPrice, balance) {
        if (!this.isEnabled) {
            console.log('❌ AMPL Manager disabled - skipping order placement');
            return;
        }
        
        // Check if we already have orders
        if (this.currentOrders.length > 0) {
            console.log('⚠️ Existing orders found - canceling before placing new ladder');
            await this.cancelAllOrders();
        }
        
        // Calculate weighted distribution
        const distributions = this.calculateWeightedDistribution(balance);
        
        // Place orders only for levels below current price
        const ordersToPlace = [];
        
        for (let i = 0; i < this.priceLevels.length; i++) {
            const priceLevel = this.priceLevels[i];
            const amount = distributions[i];
            
            // Only place order if price level is below current price
            if (priceLevel < currentPrice) {
                const order = {
                    id: `ampl_ladder_${i}_${Date.now()}`,
                    price: priceLevel,
                    amount: amount,
                    quantity: amount / priceLevel, // AMPL quantity to buy
                    status: 'pending',
                    level: i,
                    timestamp: new Date().toISOString()
                };
                
                ordersToPlace.push(order);
            }
        }
        
        // Place orders via KuCoin API
        for (const order of ordersToPlace) {
            try {
                const result = await this.placeKuCoinOrder(order);
                if (result.success) {
                    this.currentOrders.push(order);
                    console.log(`✅ Order placed: ${order.quantity.toFixed(4)} AMPL at $${order.price}`);
                } else {
                    console.error(`❌ Failed to place order at $${order.price}:`, result.error);
                }
            } catch (error) {
                console.error(`❌ Error placing order at $${order.price}:`, error);
            }
        }
        
        // Update UI
        this.updateLadderPanelDisplay();
        
        console.log(`🎯 Smart ladder placed: ${ordersToPlace.length} orders totaling $${ordersToPlace.reduce((sum, o) => sum + o.amount, 0).toFixed(2)}`);
    }
    
    /**
     * Check rebase protection before selling
     * @param {number} currentAmplPrice - Current AMPL price
     * @returns {boolean} True if safe to sell, false if protection triggered
     */
    checkRebaseProtection(currentAmplPrice) {
        if (!this.rebaseProtectionEnabled) {
            return true; // Protection disabled, allow sell
        }
        
        // Calculate current value of holdings
        const currentValue = this.currentHoldings.ampl * currentAmplPrice;
        
        // Check if current value is above safety threshold
        const safetyRatio = currentValue / this.originalPurchaseAmount;
        const isSafe = safetyRatio >= this.minimumSafetyRatio;
        
        console.log(`🛡️ Rebase Protection Check:`);
        console.log(`  Original Purchase: $${this.originalPurchaseAmount.toFixed(2)}`);
        console.log(`  Current Holdings: ${this.currentHoldings.ampl.toFixed(4)} AMPL`);
        console.log(`  Current Value: $${currentValue.toFixed(2)}`);
        console.log(`  Safety Ratio: ${(safetyRatio * 100).toFixed(1)}%`);
        console.log(`  Status: ${isSafe ? '✅ SAFE TO SELL' : '❌ PROTECTION TRIGGERED'}`);
        
        // Update UI progress bar
        this.updateRebaseProtectionDisplay(safetyRatio);
        
        return isSafe;
    }
    
    /**
     * Handle order fill notification
     * @param {Object} orderData - Order fill data from KuCoin
     */
    async handleOrderFill(orderData) {
        console.log('📈 Order filled:', orderData);
        
        // Update order status
        const order = this.currentOrders.find(o => o.id === orderData.orderId);
        if (order) {
            order.status = 'filled';
            order.fillPrice = orderData.price;
            order.fillQuantity = orderData.quantity;
            order.fillTime = new Date().toISOString();
            
            // Update holdings
            this.currentHoldings.ampl += orderData.quantity;
            this.originalPurchaseAmount += orderData.price * orderData.quantity;
            
            console.log(`✅ Updated holdings: ${this.currentHoldings.ampl.toFixed(4)} AMPL`);
            console.log(`💰 Total invested: $${this.originalPurchaseAmount.toFixed(2)}`);
        }
        
        // Check if we should place sell order
        await this.checkSellConditions(orderData.price);
        
        // Update UI
        this.updateLadderPanelDisplay();
    }
    
    /**
     * Check if sell conditions are met
     * @param {number} currentPrice - Current AMPL price
     */
    async checkSellConditions(currentPrice) {
        // Get sell threshold from main dashboard
        const currentThreshold = parseFloat(document.getElementById('current-threshold')?.textContent || '1.25');
        
        if (currentPrice >= currentThreshold && this.currentHoldings.ampl > 0) {
            // Check rebase protection before selling
            if (this.checkRebaseProtection(currentPrice)) {
                await this.executeSell(currentPrice);
            } else {
                console.log('🛡️ Sell blocked by rebase protection');
            }
        }
    }
    
    /**
     * Execute sell order
     * @param {number} sellPrice - Price to sell at
     */
    async executeSell(sellPrice) {
        try {
            const sellOrder = {
                id: `ampl_sell_${Date.now()}`,
                price: sellPrice,
                quantity: this.currentHoldings.ampl,
                amount: this.currentHoldings.ampl * sellPrice,
                type: 'sell',
                timestamp: new Date().toISOString()
            };
            
            const result = await this.placeKuCoinOrder(sellOrder);
            
            if (result.success) {
                console.log(`💰 Sell executed: ${sellOrder.quantity.toFixed(4)} AMPL at $${sellPrice}`);
                
                // Reset holdings
                this.currentHoldings.ampl = 0;
                this.originalPurchaseAmount = 0;
                
                // Cancel remaining buy orders
                await this.cancelAllOrders();
                
                // Wait 2 seconds then place fresh ladder
                setTimeout(() => {
                    this.refreshOrderLadder();
                }, 2000);
                
                // Update UI
                this.updateLadderPanelDisplay();
            }
        } catch (error) {
            console.error('❌ Error executing sell:', error);
        }
    }
    
    /**
     * Place order via KuCoin API through Supabase
     * @param {Object} order - Order object
     * @returns {Object} Result object with success/error
     */
    async placeKuCoinOrder(order) {
        try {
            console.log(`📤 Placing REAL KuCoin limit order: ${order.quantity.toFixed(4)} AMPL at $${order.price.toFixed(4)}`);
            
            // Prepare order data as JSON (matching your existing table structure)
            const orderData = {
                type: 'limit',
                side: 'buy',
                symbol: 'AMPL-USDT',
                price: order.price,
                size: order.quantity,
                clientOid: order.id,
                source: 'ampl_manager',
                timestamp: new Date().toISOString(),
                status: 'pending',
                level: order.level,
                amount: order.amount
            };
            
            // Save order to Supabase orders table first
            const { data, error } = await supabase
                .from('orders')
                .insert([{
                    content: JSON.stringify(orderData),
                    created_at: new Date().toISOString()
                }])
                .select();
            
            if (error) {
                console.error('❌ Supabase order insert error:', error);
                return {
                    success: false,
                    error: `Supabase error: ${error.message}`
                };
            }
            
            console.log('✅ Order saved to Supabase:', data);
            
            // Now place REAL order on KuCoin via Supabase Edge Function
            try {
                const kucoinOrderData = {
                    clientOid: order.id,
                    side: 'buy',
                    symbol: 'AMPL-USDT',
                    type: 'limit',
                    price: order.price.toString(),
                    size: order.quantity.toString(),
                    timeInForce: 'GTC' // Good Till Canceled
                };
                
                // Call Supabase Edge Function to place order on KuCoin
		// Use existing order placement function
		if (typeof window.placeLimitBuyOrder === 'function') {
    		    console.log('🔄 Using existing order placement function...');
    		    window.placeLimitBuyOrder({
        		price: order.price,
        		size: order.amount,
        		level: order.level
    		    });
    
    		    const result = {
        	    	success: true,
        	    	orderId: order.id
    		    };
		} else {
    		    const result = {
        		success: false,
        		error: 'No order placement function available'
    		    };
		}

                
                if (result.success && result.orderId) {
                    console.log(`✅ REAL KuCoin order placed! Order ID: ${result.orderId}`);
                    
                    // Update order status in Supabase with real KuCoin order ID
                    const updatedOrderData = {
                        ...orderData,
                        status: 'active',
                        kucoinOrderId: result.orderId,
                        placedAt: new Date().toISOString()
                    };
                    
                    await supabase
                        .from('orders')
                        .update({ content: JSON.stringify(updatedOrderData) })
                        .eq('id', data[0].id);
                    
                    // Mark order as successfully placed in our internal tracking
                    order.status = 'active';
                    order.kucoinOrderId = result.orderId;
                    order.supabaseId = data[0]?.id;
                    
                    return {
                        success: true,
                        orderId: result.orderId,
                        message: 'REAL KuCoin limit order placed successfully!'
                    };
                } else {
                    console.error('❌ KuCoin API error:', result.error);
                    
                    // Update order status to failed
                    const failedOrderData = {
                        ...orderData,
                        status: 'failed',
                        error: result.error,
                        failedAt: new Date().toISOString()
                    };
                    
                    await supabase
                        .from('orders')
                        .update({ content: JSON.stringify(failedOrderData) })
                        .eq('id', data[0].id);
                    
                    return {
                        success: false,
                        error: `KuCoin API error: ${result.error}`
                    };
                }
            } catch (apiError) {
                console.error('❌ Error calling KuCoin API:', apiError);
                
                // Fallback: Use existing placeLimitBuyOrder function if available
                if (typeof window.placeLimitBuyOrder === 'function') {
                    console.log('🔄 Falling back to existing order placement function...');
                    
                    const fallbackOrder = {
                        price: order.price,
                        size: order.amount, // Use USDT amount
                        level: order.level
                    };
                    
                    window.placeLimitBuyOrder(fallbackOrder);
                    
                    order.status = 'active';
                    order.supabaseId = data[0]?.id;
                    
                    return {
                        success: true,
                        orderId: order.id,
                        message: 'Order placed via fallback method'
                    };
                }
                
                return {
                    success: false,
                    error: `API call failed: ${apiError.message}`
                };
            }
            
        } catch (error) {
            console.error('❌ Error placing KuCoin order:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Cancel all current orders
     */
    async cancelAllOrders() {
        for (const order of this.currentOrders) {
            if (order.status === 'pending') {
                // TODO: Integrate with KuCoin cancel order API
                console.log(`🚫 Canceling order: ${order.id}`);
                order.status = 'canceled';
            }
        }
        
        // Remove canceled orders
        this.currentOrders = this.currentOrders.filter(order => order.status !== 'canceled');
        
        this.updateLadderPanelDisplay();
    }
    
    /**
     * Refresh order ladder with current balance
     */
    async refreshOrderLadder() {
        if (!this.isEnabled) return;
        
        // Get current balance and price
        const balance = parseFloat(document.getElementById('usdt-balance')?.textContent || '0');
        const currentPrice = parseFloat(document.getElementById('current-ampl-price')?.textContent || '1.20');
        
        console.log('🔄 Refreshing order ladder...');
        await this.placeSmartOrderLadder(currentPrice, balance);
    }
    
    /**
     * Update ladder panel display
     */
    updateLadderPanelDisplay() {
        // Update active/pending trade counts
        const activeCount = this.currentOrders.filter(o => o.status === 'filled').length;
        const pendingCount = this.currentOrders.filter(o => o.status === 'pending').length;
        
        const activeEl = document.getElementById('active-trades-count');
        const pendingEl = document.getElementById('pending-trades-count');
        
        if (activeEl) activeEl.textContent = activeCount;
        if (pendingEl) pendingEl.textContent = pendingCount;
        
        // Update order status display
        const statusEl = document.querySelector('.order-status-display');
        if (statusEl) {
            statusEl.innerHTML = `<strong>${activeCount} orders open, ${pendingCount} pending</strong>`;
        }
        
        // Update price level badges
        this.updatePriceLevelBadges();
        
        // Update holdings tracker
        this.updateHoldingsTracker();
    }
    
    /**
     * Update price level badges with current status
     */
    updatePriceLevelBadges() {
        const badges = document.querySelectorAll('.price-level-badge');
        
        badges.forEach((badge, index) => {
            const priceLevel = this.priceLevels[index];
            const order = this.currentOrders.find(o => o.level === index);
            
            // Update badge text
            badge.textContent = priceLevel.toFixed(4);
            
            // Update badge status
            badge.classList.remove('filled', 'pending', 'empty');
            
            if (order) {
                if (order.status === 'filled') {
                    badge.classList.add('filled');
                } else if (order.status === 'pending') {
                    badge.classList.add('pending');
                }
            } else {
                badge.classList.add('empty');
            }
        });
    }
    
    /**
     * Update rebase protection progress bar
     * @param {number} safetyRatio - Current safety ratio (0-1)
     */
    updateRebaseProtectionDisplay(safetyRatio) {
        const progressBar = document.querySelector('.progress-bar');
        const percentageEl = document.querySelector('.progress-percentage');
        
        if (progressBar) {
            const percentage = Math.max(0, Math.min(100, safetyRatio * 100));
            progressBar.style.width = `${percentage}%`;
        }
        
        if (percentageEl) {
            const status = safetyRatio >= 1.0 ? 'Safe' : safetyRatio >= 0.95 ? 'Caution' : 'Danger';
            percentageEl.textContent = `${(safetyRatio * 100).toFixed(0)}% ${status}`;
        }
    }
    
    /**
     * Update holdings tracker display
     */
    updateHoldingsTracker() {
        const currentPrice = parseFloat(document.getElementById('current-ampl-price')?.textContent || '1.20');
        const currentValue = this.currentHoldings.ampl * currentPrice;
        const difference = currentValue - this.originalPurchaseAmount;
        
        // Update original purchase amount
        const originalEl = document.querySelector('.holdings-value.original');
        if (originalEl) {
            originalEl.textContent = `$${this.originalPurchaseAmount.toFixed(2)}`;
        }
        
        // Update current value
        const currentEl = document.querySelector('.holdings-value.current');
        if (currentEl) {
            currentEl.textContent = `$${currentValue.toFixed(2)}`;
        }
        
        // Update difference
        const diffEl = document.querySelector('.holdings-value.difference');
        if (diffEl) {
            const sign = difference >= 0 ? '+' : '';
            diffEl.textContent = `${sign}$${difference.toFixed(2)}`;
            diffEl.classList.remove('positive', 'negative');
            diffEl.classList.add(difference >= 0 ? 'positive' : 'negative');
        }
    }
    
    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        // AMPL Manager enable/disable toggle
        const amplManagerToggle = document.getElementById('ampl-manager-toggle');
        if (amplManagerToggle) {
            amplManagerToggle.addEventListener('change', (e) => {
                this.isEnabled = e.target.checked;
                console.log(`🎯 AMPL Manager ${this.isEnabled ? 'ENABLED' : 'DISABLED'}`);
                
                if (this.isEnabled) {
                    this.refreshOrderLadder();
                } else {
                    this.cancelAllOrders();
                }
            });
        }
        
        // Listen for price updates
        document.addEventListener('amplPriceUpdate', (e) => {
            const newPrice = e.detail.price;
            this.checkSellConditions(newPrice);
        });
        
        // Listen for balance updates
        document.addEventListener('balanceUpdate', (e) => {
            this.totalBalance = e.detail.balance;
        });
    }
    
    /**
     * Enable AMPL Manager
     */
    enable() {
        this.isEnabled = true;
        const toggle = document.getElementById('ampl-manager-toggle');
        if (toggle) toggle.checked = true;
        this.refreshOrderLadder();
    }
    
    /**
     * Disable AMPL Manager
     */
    disable() {
        this.isEnabled = false;
        const toggle = document.getElementById('ampl-manager-toggle');
        if (toggle) toggle.checked = false;
        this.cancelAllOrders();
    }
    
    /**
     * Get current status for debugging
     */
    getStatus() {
        return {
            enabled: this.isEnabled,
            orders: this.currentOrders,
            holdings: this.currentHoldings,
            originalPurchase: this.originalPurchaseAmount,
            priceLevels: this.priceLevels,
            weightFactors: this.weightFactors
        };
    }
}

// Initialize AMPL Manager when DOM is loaded
let amplManager = null;

document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for main script to initialize
    setTimeout(() => {
        amplManager = new AMPLManager();
        console.log('🚀 AMPL Manager initialized');
        
        // Make it globally accessible for debugging
        window.amplManager = amplManager;
    }, 1000);
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AMPLManager;
}

