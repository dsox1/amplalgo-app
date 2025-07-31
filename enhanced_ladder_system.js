/**
 * enhanced_ladder_system.js
 * Enhanced ladder system with proper staggered orders and increasing sizes for lower prices
 * Integrates with existing AMPL system design and style
 */

class EnhancedAMPLLadder {
    constructor() {
        this.ladderConfig = {
            startPrice: 1.16,
            endPrice: 0.85,
            levels: 8,
            totalBalance: 0,
            orders: []
        };
        
        this.targetSellConfig = {
            conservative: 0.015,  // 1.5%
            moderate: 0.05,       // 5%
            aggressive: 0.13      // 13%
        };
        
        this.currentTargetMode = 'moderate'; // Default to 5%
        this.activeOrders = new Map(); // Track buy orders and their sell targets
        
        this.init();
    }

    init() {
        console.log('🎬 Initializing Enhanced AMPL Ladder System...');
        this.setupUI();
        this.loadSettings();
        console.log('✅ Enhanced AMPL Ladder System initialized');
    }

    /**
     * Calculate ladder prices with proper distribution from 1.16 to 0.85
     */
    calculateLadderPrices() {
        const { startPrice, endPrice, levels } = this.ladderConfig;
        const prices = [];
        
        // Calculate the ratio for geometric progression
        const ratio = Math.pow(endPrice / startPrice, 1 / (levels - 1));
        
        for (let i = 0; i < levels; i++) {
            const price = startPrice * Math.pow(ratio, i);
            prices.push(parseFloat(price.toFixed(4)));
        }
        
        return prices;
    }

    /**
     * Calculate order sizes with increasing amounts for lower prices
     * Lower prices get larger allocations (inverse relationship)
     */
    calculateOrderSizes(totalBalance) {
        const levels = this.ladderConfig.levels;
        const sizes = [];
        
        // Create weights that increase for lower price levels
        // Level 1 (highest price) gets weight 1, Level 8 (lowest price) gets weight 3
        const weights = [];
        for (let i = 0; i < levels; i++) {
            // Linear increase: weight = 1 + (2 * i / (levels - 1))
            // This gives weights from 1.0 to 3.0
            const weight = 1 + (2 * i / (levels - 1));
            weights.push(weight);
        }
        
        // Calculate total weight
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        
        // Calculate individual order sizes
        for (let i = 0; i < levels; i++) {
            const orderSize = (totalBalance * weights[i]) / totalWeight;
            sizes.push(parseFloat(orderSize.toFixed(2)));
        }
        
        return sizes;
    }

    /**
     * Deploy the enhanced ladder with proper sizing
     */
    async deployEnhancedLadder(totalBalance) {
        try {
            console.log(`🚀 Deploying Enhanced Ladder with $${totalBalance} total balance`);
            
            // Cancel existing orders first
            await this.cancelAllOrders();
            
            // Calculate prices and sizes
            const prices = this.calculateLadderPrices();
            const sizes = this.calculateOrderSizes(totalBalance);
            
            this.ladderConfig.orders = [];
            
            // Create and place orders
            for (let i = 0; i < prices.length; i++) {
                const order = {
                    level: i + 1,
                    price: prices[i],
                    size: sizes[i],
                    status: 'pending',
                    orderId: null,
                    targetSellPrice: this.calculateTargetSellPrice(prices[i]),
                    targetSellMode: this.currentTargetMode,
                    timestamp: new Date().toISOString()
                };
                
                this.ladderConfig.orders.push(order);
                
                // Place the order with delay to avoid rate limiting
                setTimeout(async () => {
                    await this.placeLimitBuyOrder(order);
                }, i * 500);
            }
            
            // Update UI
            this.updateLadderDisplay();
            this.saveSettings();
            
            console.log('✅ Enhanced ladder deployed successfully');
            console.table(this.ladderConfig.orders.map(o => ({
                Level: o.level,
                Price: `$${o.price}`,
                Size: `$${o.size}`,
                'Target Sell': `$${o.targetSellPrice}`,
                'Profit %': `${(((o.targetSellPrice / o.price) - 1) * 100).toFixed(2)}%`
            })));
            
        } catch (error) {
            console.error('❌ Error deploying enhanced ladder:', error);
            this.logError(`Failed to deploy ladder: ${error.message}`);
        }
    }

    /**
     * Calculate target sell price based on current mode
     */
    calculateTargetSellPrice(buyPrice) {
        const profitMargin = this.targetSellConfig[this.currentTargetMode];
        return parseFloat((buyPrice * (1 + profitMargin)).toFixed(4));
    }

    /**
     * Place a limit buy order (integrates with existing KuCoin API when available)
     */
    async placeLimitBuyOrder(order) {
        try {
            console.log(`📬 Placing buy order: Level ${order.level} at $${order.price} for $${order.size}`);
            
            // Check if KuCoin API is available
            if (window.kucoinAPI && typeof window.kucoinAPI.placeOrder === 'function') {
                const result = await window.kucoinAPI.placeOrder({
                    symbol: 'AMPL-USDT',
                    side: 'buy',
                    type: 'limit',
                    price: order.price.toString(),
                    size: (order.size / order.price).toFixed(6), // Convert USD to AMPL quantity
                    timeInForce: 'GTC'
                });
                
                order.orderId = result.orderId;
                order.status = 'active';
                
                // Store the order for sell target tracking
                this.activeOrders.set(result.orderId, order);
                
                console.log(`✅ Buy order placed successfully: ${result.orderId}`);
                this.logSystem(`Buy order placed: Level ${order.level} at $${order.price}`);
                
            } else {
                // Fallback to simulation mode
                order.orderId = `sim_${Date.now()}_${order.level}`;
                order.status = 'simulated';
                
                console.log(`🎭 Simulated buy order: ${order.orderId}`);
                this.logSystem(`Simulated buy order: Level ${order.level} at $${order.price}`);
            }
            
        } catch (error) {
            console.error(`❌ Error placing buy order for level ${order.level}:`, error);
            order.status = 'failed';
            this.logError(`Buy order failed: Level ${order.level} - ${error.message}`);
        }
    }

    /**
     * Monitor for filled buy orders and place corresponding sell orders
     */
    async monitorAndPlaceSellOrders() {
        for (const [orderId, order] of this.activeOrders) {
            try {
                // Check order status
                const orderStatus = await this.checkOrderStatus(orderId);
                
                if (orderStatus === 'filled' && order.status !== 'sell_placed') {
                    await this.placeSellOrder(order);
                    order.status = 'sell_placed';
                }
                
            } catch (error) {
                console.error(`Error monitoring order ${orderId}:`, error);
            }
        }
    }

    /**
     * Place sell order for a filled buy order
     */
    async placeSellOrder(buyOrder) {
        try {
            console.log(`📤 Placing sell order for buy order ${buyOrder.orderId} at target $${buyOrder.targetSellPrice}`);
            
            if (window.kucoinAPI && typeof window.kucoinAPI.placeOrder === 'function') {
                const sellQuantity = (buyOrder.size / buyOrder.price).toFixed(6);
                
                const result = await window.kucoinAPI.placeOrder({
                    symbol: 'AMPL-USDT',
                    side: 'sell',
                    type: 'limit',
                    price: buyOrder.targetSellPrice.toString(),
                    size: sellQuantity,
                    timeInForce: 'GTC'
                });
                
                buyOrder.sellOrderId = result.orderId;
                
                console.log(`✅ Sell order placed: ${result.orderId} at $${buyOrder.targetSellPrice}`);
                this.logSell(`Sell order placed: $${buyOrder.targetSellPrice} (${buyOrder.targetSellMode} target)`);
                
            } else {
                // Simulation mode
                buyOrder.sellOrderId = `sim_sell_${Date.now()}`;
                console.log(`🎭 Simulated sell order: ${buyOrder.sellOrderId}`);
                this.logSell(`Simulated sell order: $${buyOrder.targetSellPrice} (${buyOrder.targetSellMode} target)`);
            }
            
        } catch (error) {
            console.error(`❌ Error placing sell order:`, error);
            this.logError(`Sell order failed: ${error.message}`);
        }
    }

    /**
     * Check order status (integrates with KuCoin API)
     */
    async checkOrderStatus(orderId) {
        try {
            if (window.kucoinAPI && typeof window.kucoinAPI.getOrder === 'function') {
                const orderInfo = await window.kucoinAPI.getOrder(orderId);
                return orderInfo.status;
            } else {
                // Simulation: randomly return filled status for testing
                return Math.random() > 0.8 ? 'filled' : 'active';
            }
        } catch (error) {
            console.error(`Error checking order status for ${orderId}:`, error);
            return 'unknown';
        }
    }

    /**
     * Cancel all active orders
     */
    async cancelAllOrders() {
        try {
            console.log('🗑️ Cancelling all active orders...');
            
            for (const order of this.ladderConfig.orders) {
                if (order.orderId && order.status === 'active') {
                    if (window.kucoinAPI && typeof window.kucoinAPI.cancelOrder === 'function') {
                        await window.kucoinAPI.cancelOrder(order.orderId);
                        console.log(`✅ Cancelled order: ${order.orderId}`);
                    }
                    order.status = 'cancelled';
                }
            }
            
            this.activeOrders.clear();
            this.ladderConfig.orders = [];
            
            console.log('✅ All orders cancelled');
            this.logSystem('All ladder orders cancelled');
            
        } catch (error) {
            console.error('❌ Error cancelling orders:', error);
            this.logError(`Error cancelling orders: ${error.message}`);
        }
    }

    /**
     * Set target sell mode (1.5%, 5%, or 13%)
     */
    setTargetSellMode(mode) {
        if (this.targetSellConfig[mode]) {
            this.currentTargetMode = mode;
            console.log(`🎯 Target sell mode set to: ${mode} (${(this.targetSellConfig[mode] * 100).toFixed(1)}%)`);
            this.saveSettings();
            this.updateTargetModeDisplay();
        }
    }

    /**
     * Setup UI elements for the enhanced system
     */
    setupUI() {
        // Add target mode selector to existing UI
        const targetModeHTML = `
            <div class="target-mode-selector" style="margin: 10px 0;">
                <label style="color: var(--text-primary, #ffffff); font-size: 12px; margin-bottom: 5px; display: block;">
                    Target Sell Mode:
                </label>
                <div class="target-mode-buttons" style="display: flex; gap: 5px;">
                    <button class="target-mode-btn" data-mode="conservative" style="
                        background: rgba(76, 175, 80, 0.2);
                        border: 1px solid rgba(76, 175, 80, 0.4);
                        color: #4CAF50;
                        padding: 4px 8px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 11px;
                    ">1.5%</button>
                    <button class="target-mode-btn active" data-mode="moderate" style="
                        background: rgba(33, 150, 243, 0.4);
                        border: 1px solid rgba(33, 150, 243, 0.7);
                        color: #2196F3;
                        padding: 4px 8px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 11px;
                    ">5%</button>
                    <button class="target-mode-btn" data-mode="aggressive" style="
                        background: rgba(255, 193, 7, 0.2);
                        border: 1px solid rgba(255, 193, 7, 0.4);
                        color: #FFC107;
                        padding: 4px 8px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 11px;
                    ">13%</button>
                </div>
            </div>
        `;
        
        // Try to inject into existing ladder controls
        setTimeout(() => {
            const ladderControls = document.querySelector('.ladder-controls') || 
                                 document.querySelector('.section-content');
            
            if (ladderControls) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = targetModeHTML;
                ladderControls.appendChild(tempDiv.firstElementChild);
                
                // Bind event listeners
                this.bindTargetModeEvents();
            }
        }, 1000);
    }

    /**
     * Bind events for target mode buttons
     */
    bindTargetModeEvents() {
        const targetModeButtons = document.querySelectorAll('.target-mode-btn');
        
        targetModeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const mode = button.getAttribute('data-mode');
                this.setTargetSellMode(mode);
                
                // Update button states
                targetModeButtons.forEach(btn => {
                    btn.classList.remove('active');
                    btn.style.background = btn.getAttribute('data-mode') === 'conservative' ? 
                        'rgba(76, 175, 80, 0.2)' : 
                        btn.getAttribute('data-mode') === 'moderate' ? 
                        'rgba(33, 150, 243, 0.2)' : 
                        'rgba(255, 193, 7, 0.2)';
                });
                
                button.classList.add('active');
                button.style.background = button.getAttribute('data-mode') === 'conservative' ? 
                    'rgba(76, 175, 80, 0.4)' : 
                    button.getAttribute('data-mode') === 'moderate' ? 
                    'rgba(33, 150, 243, 0.4)' : 
                    'rgba(255, 193, 7, 0.4)';
            });
        });
    }

    /**
     * Update ladder display in UI
     */
    updateLadderDisplay() {
        // Integration with existing UI update functions
        if (typeof updateLargeDigits === 'function') {
            updateLargeDigits();
        }
        
        if (typeof updateOrderIndicators === 'function') {
            updateOrderIndicators(this.ladderConfig.orders, []);
        }
    }

    /**
     * Update target mode display
     */
    updateTargetModeDisplay() {
        const modeText = `${(this.targetSellConfig[this.currentTargetMode] * 100).toFixed(1)}%`;
        console.log(`🎯 Current target mode: ${this.currentTargetMode} (${modeText})`);
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('enhancedLadderConfig', JSON.stringify({
                targetMode: this.currentTargetMode,
                orders: this.ladderConfig.orders
            }));
        } catch (error) {
            console.error('Error saving enhanced ladder settings:', error);
        }
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('enhancedLadderConfig');
            if (saved) {
                const config = JSON.parse(saved);
                this.currentTargetMode = config.targetMode || 'moderate';
                this.ladderConfig.orders = config.orders || [];
                
                // Restore active orders map
                this.ladderConfig.orders.forEach(order => {
                    if (order.orderId && order.status === 'active') {
                        this.activeOrders.set(order.orderId, order);
                    }
                });
            }
        } catch (error) {
            console.error('Error loading enhanced ladder settings:', error);
        }
    }

    /**
     * Start monitoring loop
     */
    startMonitoring() {
        // Monitor every 30 seconds
        setInterval(() => {
            this.monitorAndPlaceSellOrders();
        }, 30000);
        
        console.log('👀 Enhanced ladder monitoring started');
    }

    // Logging methods (integrate with existing activity feed)
    logSystem(message) {
        if (typeof logSystem === 'function') {
            logSystem(message);
        } else {
            console.log(`📊 ${message}`);
        }
    }

    logSell(message) {
        if (typeof logSell === 'function') {
            logSell(message);
        } else {
            console.log(`💸 ${message}`);
        }
    }

    logError(message) {
        if (typeof logError === 'function') {
            logError(message);
        } else {
            console.error(`❌ ${message}`);
        }
    }
}

// Initialize the enhanced ladder system
document.addEventListener('DOMContentLoaded', () => {
    window.enhancedAMPLLadder = new EnhancedAMPLLadder();
    
    // Start monitoring after initialization
    setTimeout(() => {
        window.enhancedAMPLLadder.startMonitoring();
    }, 5000);
});

// Global functions for external use
window.deployEnhancedLadder = function(totalBalance) {
    if (window.enhancedAMPLLadder) {
        return window.enhancedAMPLLadder.deployEnhancedLadder(totalBalance);
    }
};

window.setTargetSellMode = function(mode) {
    if (window.enhancedAMPLLadder) {
        return window.enhancedAMPLLadder.setTargetSellMode(mode);
    }
};

window.cancelEnhancedLadder = function() {
    if (window.enhancedAMPLLadder) {
        return window.enhancedAMPLLadder.cancelAllOrders();
    }
};

console.log('🎬 Enhanced AMPL Ladder System loaded successfully');

