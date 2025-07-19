/**
 * AMPL Profit-Taking Panel - Final Single Panel Version (Updated)
 * 
 * FEATURES:
 * - True single panel (no test controls)
 * - Dark grey/sepia header and outer border
 * - Blue theme with white text, orange/cyan titles
 * - Real KuCoin data integration
 * - Ready for main app integration
 */

class AMPLProfitPanelFinal {
    constructor() {
        this.isActive = false;
        this.isPaused = false;
        this.positions = new Map();
        this.activeOrders = new Map();
        
        // Persistent settings
        this.settings = {
            profitThreshold: this.loadSetting('profitThreshold', 5.5),
            isPaused: this.loadSetting('isPaused', false),
            autoStart: this.loadSetting('autoStart', false)
        };
        
        // Profit threshold options
        this.profitOptions = [1.25, 2.5, 5.5, 7.5, 10.0];
        
        // Supabase configuration (from existing app)
        this.supabaseConfig = {
            url: 'https://fbkcdirkshubectuvxzi.supabase.co',
            anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia2NkaXJrc2h1YmVjdHV2eHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjA1NzQ4NzIsImV4cCI6MjAzNjE1MDg3Mn0.8VKzqQOBhKlnJdWLNdJhQGGKGJNGGJNGGJNGGJNGGJN'
        };
        
        // Market data
        this.marketData = {
            currentPrice: null,
            lastUpdate: null,
            balance: null,
            openOrders: []
        };
        
        this.initialize();
    }

    /**
     * Initialize the panel
     */
    initialize() {
        console.log('🎯 AMPL Profit Panel Initializing...');
        this.createSinglePanel();
        this.restorePositions();
        
        // Start data updates
        this.startDataUpdates();
        
        if (this.settings.autoStart && !this.settings.isPaused) {
            this.start();
        }
        
        // Set up periodic saves
        setInterval(() => this.saveState(), 60000);
    }

    /**
     * Create single panel interface with dark grey/sepia header and border
     */
    createSinglePanel() {
        // Remove any existing panel
        const existingPanel = document.getElementById('amplProfitPanelFinal');
        if (existingPanel) {
            existingPanel.remove();
        }

        // Create main panel container
        const panel = document.createElement('div');
        panel.id = 'amplProfitPanelFinal';
        panel.className = 'ampl-profit-panel-final';
        
        panel.innerHTML = `
            <div class="panel-header">
                <h3>🎯 AMPL PROFIT SYSTEM</h3>
                <div class="header-controls">
                    <span id="systemStatus" class="status-indicator stopped">STOPPED</span>
                    <button id="pauseBtn" class="control-btn pause-btn">⏸️</button>
                    <button id="startBtn" class="control-btn start-btn">▶️</button>
                </div>
            </div>
            
            <div class="panel-content">
                <div class="status-section">
                    <div class="status-grid">
                        <div class="status-item">
                            <span class="label">KuCoin Price:</span>
                            <span id="currentPrice" class="value price-value">$0.000</span>
                        </div>
                        <div class="status-item">
                            <span class="label">Balance:</span>
                            <span id="usdtBalance" class="value balance-value">$0.00</span>
                        </div>
                        <div class="status-item">
                            <span class="label">Positions:</span>
                            <span id="activePositions" class="value positions-value">0</span>
                        </div>
                        <div class="status-item">
                            <span class="label">Orders:</span>
                            <span id="activeOrders" class="value orders-value">0</span>
                        </div>
                    </div>
                </div>
                
                <div class="controls-section">
                    <div class="profit-selector">
                        <label>Profit Target:</label>
                        <div class="profit-buttons">
                            ${this.profitOptions.map(pct => 
                                `<button class="profit-btn ${pct === this.settings.profitThreshold ? 'active' : ''}" data-profit="${pct}">${pct}%</button>`
                            ).join('')}
                        </div>
                    </div>
                    
                    <div class="status-info">
                        <div class="info-item">
                            <span class="info-label">Total Profit:</span>
                            <span id="totalProfit" class="info-value">$0.00</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Last Update:</span>
                            <span id="lastUpdate" class="info-value">Never</span>
                        </div>
                    </div>
                </div>
                
                <div class="positions-section">
                    <div class="section-header">
                        <span class="section-title">📊 Active Positions</span>
                        <span class="section-count" id="positionsCount">0</span>
                    </div>
                    <div id="positionsList" class="positions-list">
                        <div class="no-positions">No active positions</div>
                    </div>
                </div>
                
                <div class="console-section">
                    <div class="section-header">
                        <span class="section-title">📋 Activity Log</span>
                        <button id="clearLogBtn" class="clear-btn">🗑️</button>
                    </div>
                    <div id="consoleOutput" class="console-output"></div>
                </div>
            </div>
        `;

        // Add CSS styles with dark grey/sepia theme
        this.addUpdatedStyles();
        
        // Append to body (or specific container)
        document.body.appendChild(panel);
        
        // Set up event listeners
        this.setupEventListeners();
        
        console.log('✅ Single panel created with dark grey/sepia header');
    }

    /**
     * Add CSS styles with dark grey/sepia header and border, blue content theme
     */
    addUpdatedStyles() {
        const styleId = 'amplProfitPanelFinalStyles';
        if (document.getElementById(styleId)) {
            document.getElementById(styleId).remove();
        }

        const styles = document.createElement('style');
        styles.id = styleId;
        styles.textContent = `
            .ampl-profit-panel-final {
                width: 100%;
                max-width: 1200px;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 2px solid rgba(64, 64, 64, 0.7);
                border-radius: 12px;
                margin: 20px auto;
                font-family: 'Courier New', monospace;
                color: #ffffff;
                box-shadow: 0 0 20px rgba(64, 64, 64, 0.3);
                overflow: hidden;
            }
            
            .panel-header {
                background: linear-gradient(90deg, #2a2a2a 0%, #3a3a3a 100%);
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(64, 64, 64, 0.7);
            }
            
            .panel-header h3 {
                margin: 0;
                color: #00ffff;
                font-size: 18px;
                text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
            }
            
            .header-controls {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .status-indicator {
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
                border: 1px solid rgba(255, 255, 255, 0.7);
            }
            
            .status-indicator.active {
                background: rgba(0, 255, 0, 0.2);
                color: #00ff00;
                border-color: rgba(0, 255, 0, 0.7);
            }
            
            .status-indicator.paused {
                background: rgba(255, 165, 0, 0.2);
                color: #ffa500;
                border-color: rgba(255, 165, 0, 0.7);
            }
            
            .status-indicator.stopped {
                background: rgba(255, 69, 0, 0.2);
                color: #ff4500;
                border-color: rgba(255, 69, 0, 0.7);
            }
            
            .control-btn {
                background: rgba(64, 64, 64, 0.3);
                border: 1px solid rgba(128, 128, 128, 0.7);
                color: #cccccc;
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-family: inherit;
                font-size: 14px;
                transition: all 0.3s ease;
            }
            
            .control-btn:hover {
                background: rgba(64, 64, 64, 0.5);
                box-shadow: 0 0 10px rgba(128, 128, 128, 0.5);
            }
            
            .control-btn.active {
                background: rgba(0, 123, 255, 0.5);
                color: #ffffff;
                border-color: rgba(0, 123, 255, 0.7);
            }
            
            .panel-content {
                padding: 20px;
            }
            
            .status-section {
                margin-bottom: 20px;
            }
            
            .status-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 15px;
                background: rgba(0, 0, 0, 0.3);
                padding: 15px;
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .status-item {
                text-align: center;
            }
            
            .status-item .label {
                display: block;
                color: #00ffff;
                font-size: 12px;
                margin-bottom: 5px;
            }
            
            .status-item .value {
                display: block;
                font-size: 16px;
                font-weight: bold;
                color: #ffffff;
            }
            
            .price-value { color: #ffa500; }
            .balance-value { color: #00ffff; }
            .positions-value { color: #ffffff; }
            .orders-value { color: #ffa500; }
            
            .controls-section {
                display: grid;
                grid-template-columns: 2fr 1fr;
                gap: 20px;
                margin-bottom: 20px;
            }
            
            .profit-selector label {
                display: block;
                color: #00ffff;
                margin-bottom: 8px;
                font-size: 14px;
            }
            
            .profit-buttons {
                display: flex;
                gap: 5px;
                flex-wrap: wrap;
            }
            
            .profit-btn {
                background: rgba(0, 123, 255, 0.2);
                border: 1px solid rgba(0, 123, 255, 0.7);
                color: #ffffff;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-family: inherit;
                font-size: 12px;
                transition: all 0.3s ease;
            }
            
            .profit-btn:hover {
                background: rgba(0, 123, 255, 0.3);
            }
            
            .profit-btn.active {
                background: rgba(0, 123, 255, 0.5);
                color: #ffffff;
                border-color: rgba(0, 123, 255, 1);
            }
            
            .status-info {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .info-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .info-label {
                color: #00ffff;
                font-size: 12px;
            }
            
            .info-value {
                color: #ffffff;
                font-weight: bold;
                font-size: 12px;
            }
            
            .positions-section, .console-section {
                margin-bottom: 20px;
            }
            
            .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
                padding-bottom: 5px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .section-title {
                color: #ffa500;
                font-size: 14px;
                font-weight: bold;
            }
            
            .section-count {
                color: #00ffff;
                font-size: 12px;
            }
            
            .clear-btn {
                background: rgba(255, 69, 0, 0.2);
                border: 1px solid rgba(255, 69, 0, 0.7);
                color: #ff4500;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-family: inherit;
                font-size: 10px;
            }
            
            .clear-btn:hover {
                background: rgba(255, 69, 0, 0.3);
            }
            
            .positions-list {
                max-height: 150px;
                overflow-y: auto;
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 6px;
                padding: 10px;
            }
            
            .no-positions {
                text-align: center;
                color: #888;
                font-style: italic;
                padding: 20px;
            }
            
            .position-item {
                background: rgba(0, 123, 255, 0.1);
                border: 1px solid rgba(0, 123, 255, 0.3);
                border-radius: 4px;
                padding: 8px;
                margin-bottom: 8px;
                font-size: 11px;
            }
            
            .position-header {
                color: #00ffff;
                font-weight: bold;
                margin-bottom: 4px;
            }
            
            .position-details {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 5px;
            }
            
            .position-detail {
                color: #ffffff;
            }
            
            .profit-positive { color: #00ff00; }
            .profit-negative { color: #ff4500; }
            
            .console-output {
                height: 120px;
                overflow-y: auto;
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 6px;
                padding: 10px;
                font-size: 11px;
                white-space: pre-wrap;
                color: #ffffff;
            }
            
            .console-output::-webkit-scrollbar {
                width: 6px;
            }
            
            .console-output::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.3);
            }
            
            .console-output::-webkit-scrollbar-thumb {
                background: rgba(0, 123, 255, 0.7);
                border-radius: 3px;
            }
            
            @media (max-width: 768px) {
                .status-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .controls-section {
                    grid-template-columns: 1fr;
                }
                
                .position-details {
                    grid-template-columns: 1fr;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Start/Pause buttons
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        
        // Profit threshold buttons
        document.querySelectorAll('.profit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const profit = parseFloat(e.target.dataset.profit);
                this.setProfitThreshold(profit);
            });
        });
        
        // Clear log button
        document.getElementById('clearLogBtn').addEventListener('click', () => this.clearConsole());
        
        console.log('✅ Event listeners setup complete');
    }

    /**
     * Start real data updates from KuCoin via Supabase
     */
    startDataUpdates() {
        // Update price every 10 seconds
        this.priceUpdateInterval = setInterval(() => {
            this.updatePriceFromKuCoin();
        }, 10000);
        
        // Update balance every 30 seconds
        this.balanceUpdateInterval = setInterval(() => {
            this.updateBalanceFromKuCoin();
        }, 30000);
        
        // Update orders every 15 seconds
        this.ordersUpdateInterval = setInterval(() => {
            this.updateOrdersFromKuCoin();
        }, 15000);
        
        // Initial updates
        this.updatePriceFromKuCoin();
        this.updateBalanceFromKuCoin();
        this.updateOrdersFromKuCoin();
        
        console.log('✅ Real data updates started');
    }

    /**
     * Update AMPL price from KuCoin via Supabase
     */
    async updatePriceFromKuCoin() {
        try {
            const response = await fetch(`${this.supabaseConfig.url}/functions/v1/get-ampl-price`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.supabaseConfig.anonKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.price) {
                    this.updatePrice(parseFloat(data.price));
                }
            }
            
        } catch (error) {
            // Fail silently in production, log for debugging
            console.debug('Price update error:', error.message);
        }
    }

    /**
     * Update USDT balance from KuCoin via Supabase
     */
    async updateBalanceFromKuCoin() {
        try {
            const response = await fetch(`${this.supabaseConfig.url}/functions/v1/get-kucoin-balance`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.supabaseConfig.anonKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ currency: 'USDT' })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.balance) {
                    this.marketData.balance = parseFloat(data.balance);
                    document.getElementById('usdtBalance').textContent = '$' + this.marketData.balance.toFixed(2);
                }
            }
            
        } catch (error) {
            console.debug('Balance update error:', error.message);
        }
    }

    /**
     * Update open orders from KuCoin via Supabase
     */
    async updateOrdersFromKuCoin() {
        try {
            const response = await fetch(`${this.supabaseConfig.url}/functions/v1/get-kucoin-orders`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.supabaseConfig.anonKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ symbol: 'AMPL-USDT', status: 'active' })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.orders) {
                    this.marketData.openOrders = data.orders;
                    document.getElementById('activeOrders').textContent = data.orders.length;
                    
                    // Check for filled orders
                    this.checkOrderStatus();
                }
            }
            
        } catch (error) {
            console.debug('Orders update error:', error.message);
        }
    }

    /**
     * Update price and trigger calculations
     */
    updatePrice(newPrice) {
        const oldPrice = this.marketData.currentPrice;
        this.marketData.currentPrice = newPrice;
        this.marketData.lastUpdate = new Date();
        
        // Update display
        document.getElementById('currentPrice').textContent = '$' + newPrice.toFixed(3);
        document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
        
        if (oldPrice !== null && Math.abs(newPrice - oldPrice) > 0.001) {
            const change = newPrice - oldPrice;
            const changePercent = (change / oldPrice) * 100;
            
            this.log(`💰 Price: $${oldPrice.toFixed(3)} → $${newPrice.toFixed(3)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`);
        }
        
        // Check positions for profit-taking
        if (!this.isPaused && this.isActive) {
            this.checkAllPositions();
        }
        
        this.updatePositionsDisplay();
    }

    /**
     * Add position to track (called from main app)
     */
    addPosition(positionId, amplQuantity, purchasePrice, totalUSDInvested) {
        const position = {
            id: positionId,
            amplQuantity: amplQuantity,
            purchasePrice: purchasePrice,
            totalUSDInvested: totalUSDInvested,
            purchaseTime: new Date(),
            sellOrderId: null,
            sellOrderPlaced: false,
            profitThreshold: this.settings.profitThreshold
        };
        
        this.positions.set(positionId, position);
        this.savePositions();
        
        this.log(`✅ Position Added: ${positionId}`);
        this.log(`   📊 ${amplQuantity.toFixed(3)} AMPL at $${purchasePrice.toFixed(3)}`);
        this.log(`   💵 Total: $${totalUSDInvested.toFixed(2)}`);
        
        this.updatePositionsDisplay();
        return position;
    }

    /**
     * Check all positions for profit-taking
     */
    async checkAllPositions() {
        if (this.positions.size === 0 || !this.marketData.currentPrice) return;
        
        for (const [positionId, position] of this.positions) {
            if (!position.sellOrderPlaced) {
                const profit = this.calculateProfit(position);
                
                if (profit.shouldSell) {
                    await this.placeSellOrder(positionId, profit);
                }
            }
        }
    }

    /**
     * Calculate profit for position
     */
    calculateProfit(position) {
        const currentPrice = this.marketData.currentPrice;
        const currentTotalValue = position.amplQuantity * currentPrice;
        const profitUSD = currentTotalValue - position.totalUSDInvested;
        const profitPercentage = (profitUSD / position.totalUSDInvested) * 100;
        
        return {
            currentPrice: currentPrice,
            currentTotalValue: currentTotalValue,
            profitUSD: profitUSD,
            profitPercentage: profitPercentage,
            shouldSell: profitPercentage >= position.profitThreshold
        };
    }

    /**
     * Place sell order via Supabase Edge Function
     */
    async placeSellOrder(positionId, profit) {
        const position = this.positions.get(positionId);
        if (!position) return;
        
        try {
            this.log(`🎯 PROFIT TARGET REACHED: ${positionId}`);
            this.log(`   💰 Profit: ${profit.profitPercentage.toFixed(2)}% (Target: ${position.profitThreshold}%)`);
            
            const orderData = {
                symbol: 'AMPL-USDT',
                side: 'sell',
                type: 'limit',
                size: Math.floor(position.amplQuantity).toString(),
                price: (this.marketData.currentPrice * 0.999).toFixed(3),
                clientOid: `profit_${positionId}_${Date.now()}`
            };
            
            const response = await fetch(`${this.supabaseConfig.url}/functions/v1/place-kucoin-order`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.supabaseConfig.anonKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });
            
            if (response.ok) {
                const result = await response.json();
                
                if (result.success && result.orderId) {
                    position.sellOrderId = result.orderId;
                    position.sellOrderPlaced = true;
                    position.sellOrderTime = new Date();
                    
                    this.log(`✅ Sell order placed: ${result.orderId}`);
                    this.log(`   📊 ${orderData.size} AMPL at $${orderData.price}`);
                    
                    this.savePositions();
                    this.updatePositionsDisplay();
                    
                } else {
                    this.log(`❌ Order placement failed: ${result.error || 'Unknown error'}`);
                }
                
            } else {
                this.log(`❌ API call failed: ${response.status}`);
            }
            
        } catch (error) {
            this.log(`❌ Sell order error: ${error.message}`);
        }
    }

    /**
     * Check order status for filled orders
     */
    checkOrderStatus() {
        for (const [positionId, position] of this.positions) {
            if (position.sellOrderPlaced && position.sellOrderId) {
                const order = this.marketData.openOrders.find(o => o.id === position.sellOrderId);
                
                if (!order) {
                    // Order not in active orders - likely filled or cancelled
                    this.log(`✅ Order completed: ${positionId}`);
                    this.positions.delete(positionId);
                    this.savePositions();
                    this.updatePositionsDisplay();
                }
            }
        }
    }

    /**
     * Start the system
     */
    start() {
        this.isActive = true;
        this.isPaused = false;
        this.saveSetting('isPaused', false);
        
        // Update UI
        const statusEl = document.getElementById('systemStatus');
        statusEl.textContent = 'ACTIVE';
        statusEl.className = 'status-indicator active';
        
        document.getElementById('startBtn').classList.add('active');
        document.getElementById('pauseBtn').classList.remove('active');
        
        this.log('▶️ AMPL Profit System STARTED');
    }

    /**
     * Toggle pause state
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        this.saveSetting('isPaused', this.isPaused);
        
        const statusEl = document.getElementById('systemStatus');
        
        if (this.isPaused) {
            statusEl.textContent = 'PAUSED';
            statusEl.className = 'status-indicator paused';
            document.getElementById('pauseBtn').classList.add('active');
            this.log('⏸️ System PAUSED');
        } else {
            statusEl.textContent = 'ACTIVE';
            statusEl.className = 'status-indicator active';
            document.getElementById('pauseBtn').classList.remove('active');
            this.log('▶️ System RESUMED');
        }
    }

    /**
     * Set profit threshold
     */
    setProfitThreshold(percentage) {
        this.settings.profitThreshold = percentage;
        this.saveSetting('profitThreshold', percentage);
        
        // Update button states
        document.querySelectorAll('.profit-btn').forEach(btn => {
            btn.classList.remove('active');
            if (parseFloat(btn.dataset.profit) === percentage) {
                btn.classList.add('active');
            }
        });
        
        // Update existing positions
        for (const position of this.positions.values()) {
            position.profitThreshold = percentage;
        }
        
        this.log(`🎯 Profit threshold set to ${percentage}%`);
        this.savePositions();
        this.updatePositionsDisplay();
    }

    /**
     * Update positions display
     */
    updatePositionsDisplay() {
        const positionsListEl = document.getElementById('positionsList');
        const activePositionsEl = document.getElementById('activePositions');
        const totalProfitEl = document.getElementById('totalProfit');
        const positionsCountEl = document.getElementById('positionsCount');
        
        activePositionsEl.textContent = this.positions.size;
        positionsCountEl.textContent = this.positions.size;
        
        if (this.positions.size === 0) {
            positionsListEl.innerHTML = '<div class="no-positions">No active positions</div>';
            totalProfitEl.textContent = '$0.00';
            totalProfitEl.className = 'info-value';
            return;
        }
        
        let html = '';
        let totalProfit = 0;
        
        for (const [positionId, position] of this.positions) {
            const profit = this.calculateProfit(position);
            totalProfit += profit.profitUSD;
            
            const profitClass = profit.profitPercentage >= 0 ? 'profit-positive' : 'profit-negative';
            
            html += `
                <div class="position-item">
                    <div class="position-header">${positionId}</div>
                    <div class="position-details">
                        <div class="position-detail">📊 ${position.amplQuantity.toFixed(3)} AMPL</div>
                        <div class="position-detail">💰 $${position.purchasePrice.toFixed(3)}</div>
                        <div class="position-detail ${profitClass}">📈 ${profit.profitPercentage.toFixed(2)}%</div>
                    </div>
                    ${position.sellOrderPlaced ? '<div style="color: #ffa500; font-size: 10px;">📤 Sell order placed</div>' : ''}
                </div>
            `;
        }
        
        positionsListEl.innerHTML = html;
        
        // Update total profit
        totalProfitEl.textContent = '$' + totalProfit.toFixed(2);
        totalProfitEl.className = totalProfit >= 0 ? 'info-value profit-positive' : 'info-value profit-negative';
    }

    /**
     * Log message to console
     */
    log(message) {
        const consoleEl = document.getElementById('consoleOutput');
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}\n`;
        
        consoleEl.textContent += logMessage;
        consoleEl.scrollTop = consoleEl.scrollHeight;
        
        // Keep only last 100 lines
        const lines = consoleEl.textContent.split('\n');
        if (lines.length > 100) {
            consoleEl.textContent = lines.slice(-100).join('\n');
        }
    }

    /**
     * Clear console
     */
    clearConsole() {
        document.getElementById('consoleOutput').textContent = '';
        this.log('Console cleared');
    }

    /**
     * Persistent storage methods
     */
    loadSetting(key, defaultValue = null) {
        if (typeof localStorage !== 'undefined') {
            const value = localStorage.getItem(`amplProfitPanelFinal_${key}`);
            return value !== null ? JSON.parse(value) : defaultValue;
        }
        return defaultValue;
    }

    saveSetting(key, value) {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(`amplProfitPanelFinal_${key}`, JSON.stringify(value));
        }
    }

    savePositions() {
        const positionsArray = Array.from(this.positions.entries());
        this.saveSetting('positions', positionsArray);
    }

    restorePositions() {
        const positionsArray = this.loadSetting('positions', []);
        this.positions = new Map(positionsArray);
        
        if (this.positions.size > 0) {
            this.log(`📊 Restored ${this.positions.size} positions from storage`);
            this.updatePositionsDisplay();
        }
    }

    saveState() {
        this.savePositions();
        this.saveSetting('lastSave', new Date().toISOString());
    }

    /**
     * Public API for integration with main app
     */
    static create() {
        return new AMPLProfitPanelFinal();
    }

    // Method to be called from main app when buy order fills
    onBuyOrderFilled(orderId, amplQuantity, purchasePrice, totalUSDInvested) {
        this.addPosition(orderId, amplQuantity, purchasePrice, totalUSDInvested);
    }

    // Method to be called from control panel
    show() {
        const panel = document.getElementById('amplProfitPanelFinal');
        if (panel) {
            panel.style.display = 'block';
        }
    }

    hide() {
        const panel = document.getElementById('amplProfitPanelFinal');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    // Cleanup method
    destroy() {
        if (this.priceUpdateInterval) clearInterval(this.priceUpdateInterval);
        if (this.balanceUpdateInterval) clearInterval(this.balanceUpdateInterval);
        if (this.ordersUpdateInterval) clearInterval(this.ordersUpdateInterval);
        
        const panel = document.getElementById('amplProfitPanelFinal');
        if (panel) panel.remove();
        
        const styles = document.getElementById('amplProfitPanelFinalStyles');
        if (styles) styles.remove();
    }
}

// Create global instance
const amplProfitPanelFinal = AMPLProfitPanelFinal.create();

// Make it globally available
if (typeof window !== 'undefined') {
    window.amplProfitPanelFinal = amplProfitPanelFinal;
}

console.log('🎯 AMPL Profit Panel Final (Updated) Loaded!');

/**
 * INTEGRATION INSTRUCTIONS:
 * 
 * 1. MAIN APP INTEGRATION:
 *    - Include this script in main app
 *    - Call amplProfitPanelFinal.show() from control panel
 *    - Call amplProfitPanelFinal.onBuyOrderFilled() when buy orders fill
 * 
 * 2. REAL DATA INTEGRATION:
 *    - Uses existing Supabase functions for KuCoin data
 *    - Automatic price, balance, and order updates
 *    - No manual test controls needed
 * 
 * 3. STYLING:
 *    - Dark grey/sepia header and outer border
 *    - Blue theme with white text for content
 *    - Orange/cyan titles and accents
 *    - Single panel layout
 */

