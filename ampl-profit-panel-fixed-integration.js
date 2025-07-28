/**
 * AMPL Profit-Taking Panel - Fixed Integration Version
 * 
 * FIXES:
 * - Proper width alignment with top 2 rows
 * - Live AMPL price updates from existing system
 * - Correct price labeling
 * - Integration with existing data feeds
 */

class AMPLProfitPanelFixed {
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
        console.log('🎯 AMPL Profit Panel (Fixed Integration) Initializing...');
        this.createFixedPanel();
        this.restorePositions();
        
        // Connect to existing price feeds
        this.connectToExistingDataFeeds();
        
        if (this.settings.autoStart && !this.settings.isPaused) {
            this.start();
        }
        
        // Set up periodic saves
        setInterval(() => this.saveState(), 60000);
    }

    /**
     * Create panel with proper width alignment
     */
    createFixedPanel() {
        // Remove any existing panel
        const existingPanel = document.getElementById('amplProfitPanelFixed');
        if (existingPanel) {
            existingPanel.remove();
        }

        // Find the container where other panels are located
        const targetContainer = document.querySelector('.main-content') || 
                               document.querySelector('.panels-container') || 
                               document.body;

        // Create main panel container with proper width
        const panel = document.createElement('div');
        panel.id = 'amplProfitPanelFixed';
        panel.className = 'ampl-profit-panel-fixed';
        
        panel.innerHTML = `
            <div class="panel-header">
                <div class="header-icon">🎯</div>
                <div class="header-title">AMPL PROFIT SYSTEM</div>
                <div class="header-controls">
                    <span id="systemStatus" class="status-indicator stopped">STOPPED</span>
                    <button id="pauseBtn" class="control-btn pause-btn">⏸️</button>
                    <button id="startBtn" class="control-btn start-btn">▶️</button>
                </div>
            </div>
            
            <div class="panel-body">
                <div class="status-row">
                    <div class="status-item">
                        <div class="status-label">KuCoin AMPL Price</div>
                        <div id="currentPrice" class="status-value price-value">$0.000</div>
                    </div>
                    <div class="status-item">
                        <div class="status-label">USDT Balance</div>
                        <div id="usdtBalance" class="status-value balance-value">$0.00</div>
                    </div>
                    <div class="status-item">
                        <div class="status-label">Active Positions</div>
                        <div id="activePositions" class="status-value">0</div>
                    </div>
                    <div class="status-item">
                        <div class="status-label">Sell Orders</div>
                        <div id="activeOrders" class="status-value">0</div>
                    </div>
                </div>
                
                <div class="controls-row">
                    <div class="profit-section">
                        <div class="section-label">Profit Target:</div>
                        <div class="profit-buttons">
                            ${this.profitOptions.map(pct => 
                                `<button class="profit-btn ${pct === this.settings.profitThreshold ? 'active' : ''}" data-profit="${pct}">${pct}%</button>`
                            ).join('')}
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <div class="info-row">
                            <span class="info-label">Total Profit:</span>
                            <span id="totalProfit" class="info-value">$0.00</span>
                        </div>
                        <div class="info-row">
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
                    <div id="positionsList" class="positions-container">
                        <div class="no-data">No active positions</div>
                    </div>
                </div>
                
                <div class="console-section">
                    <div class="section-header">
                        <span class="section-title">📋 Activity Log</span>
                        <button id="clearLogBtn" class="clear-btn">Clear</button>
                    </div>
                    <div id="consoleOutput" class="console-container"></div>
                </div>
            </div>
        `;

        // Add fixed integration styles
        this.addFixedIntegrationStyles();
        
        // Append to target container
        targetContainer.appendChild(panel);
        
        // Set up event listeners
        this.setupEventListeners();
        
        console.log('✅ Fixed integration panel created with proper width alignment');
    }

    /**
     * Add CSS styles with proper width alignment
     */
    addFixedIntegrationStyles() {
        const styleId = 'amplProfitPanelFixedStyles';
        if (document.getElementById(styleId)) {
            document.getElementById(styleId).remove();
        }

        const styles = document.createElement('style');
        styles.id = styleId;
        styles.textContent = `
            .ampl-profit-panel-fixed {
                /* Match exact width of top 2 rows */
                width: calc(100vw - 320px); /* Adjust based on your sidebar width */
                max-width: 1200px;
                margin: 10px auto;
                background: #1a1a1a;
                border: 1px solid rgba(51, 51, 51, 0.7);
                border-radius: 8px;
                font-family: 'Courier New', monospace;
                color: #ffffff;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
                position: relative;
                z-index: 10;
            }
            
            /* Responsive width adjustments */
            @media (max-width: 1400px) {
                .ampl-profit-panel-fixed {
                    width: calc(100vw - 280px);
                }
            }
            
            @media (max-width: 1200px) {
                .ampl-profit-panel-fixed {
                    width: calc(100vw - 240px);
                }
            }
            
            @media (max-width: 768px) {
                .ampl-profit-panel-fixed {
                    width: calc(100vw - 40px);
                    margin: 10px 20px;
                }
            }
            
            .panel-header {
                background: linear-gradient(90deg, #2a2a2a 0%, #333333 100%);
                padding: 12px 16px;
                display: flex;
                align-items: center;
                border-bottom: 1px solid #444444;
                gap: 10px;
            }
            
            .header-icon {
                color: #00ffff;
                font-size: 16px;
            }
            
            .header-title {
                color: #00ffff;
                font-size: 14px;
                font-weight: bold;
                flex: 1;
            }
            
            .header-controls {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .status-indicator {
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 10px;
                font-weight: bold;
                text-transform: uppercase;
                border: 1px solid;
            }
            
            .status-indicator.active {
                background: rgba(0, 255, 0, 0.1);
                color: #00ff00;
                border-color: #00ff00;
            }
            
            .status-indicator.paused {
                background: rgba(255, 165, 0, 0.1);
                color: #ffa500;
                border-color: #ffa500;
            }
            
            .status-indicator.stopped {
                background: rgba(255, 69, 0, 0.1);
                color: #ff4500;
                border-color: #ff4500;
            }
            
            .control-btn {
                background: #333333;
                border: 1px solid #555555;
                color: #cccccc;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-family: inherit;
                font-size: 12px;
                transition: all 0.2s ease;
            }
            
            .control-btn:hover {
                background: #444444;
                border-color: #666666;
            }
            
            .control-btn.active {
                background: #00ffff;
                color: #000000;
                border-color: #00ffff;
            }
            
            .panel-body {
                padding: 16px;
                background: #1a1a1a;
            }
            
            .status-row {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 12px;
                margin-bottom: 16px;
                padding: 12px;
                background: #222222;
                border: 1px solid rgba(51, 51, 51, 0.7);
                border-radius: 6px;
            }
            
            .status-item {
                text-align: center;
            }
            
            .status-label {
                color: #888888;
                font-size: 11px;
                margin-bottom: 4px;
                text-transform: uppercase;
            }
            
            .status-value {
                color: #ffffff;
                font-size: 14px;
                font-weight: bold;
            }
            
            .price-value { 
                color: #ffa500; 
                font-size: 16px;
            }
            .balance-value { color: #00ffff; }
            
            .controls-row {
                display: grid;
                grid-template-columns: 2fr 1fr;
                gap: 16px;
                margin-bottom: 16px;
            }
            
            .profit-section {
                background: #222222;
                border: 1px solid rgba(51, 51, 51, 0.7);
                border-radius: 6px;
                padding: 12px;
            }
            
            .section-label {
                color: #00ffff;
                font-size: 12px;
                margin-bottom: 8px;
                font-weight: bold;
            }
            
            .profit-buttons {
                display: flex;
                gap: 4px;
                flex-wrap: wrap;
            }
            
            .profit-btn {
                background: #333333;
                border: 1px solid #555555;
                color: #ffffff;
                padding: 4px 8px;
                border-radius: 3px;
                cursor: pointer;
                font-family: inherit;
                font-size: 11px;
                transition: all 0.2s ease;
            }
            
            .profit-btn:hover {
                background: #444444;
                border-color: #666666;
            }
            
            .profit-btn.active {
                background: #00ffff;
                color: #000000;
                border-color: #00ffff;
            }
            
            .info-section {
                background: #222222;
                border: 1px solid rgba(51, 51, 51, 0.7);
                border-radius: 6px;
                padding: 12px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .info-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .info-label {
                color: #888888;
                font-size: 11px;
            }
            
            .info-value {
                color: #ffffff;
                font-size: 11px;
                font-weight: bold;
            }
            
            .positions-section, .console-section {
                margin-bottom: 16px;
            }
            
            .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
                padding-bottom: 4px;
                border-bottom: 1px solid #333333;
            }
            
            .section-title {
                color: #ffa500;
                font-size: 12px;
                font-weight: bold;
            }
            
            .section-count {
                color: #00ffff;
                font-size: 11px;
            }
            
            .clear-btn {
                background: #333333;
                border: 1px solid #555555;
                color: #ff4500;
                padding: 2px 6px;
                border-radius: 3px;
                cursor: pointer;
                font-family: inherit;
                font-size: 10px;
            }
            
            .clear-btn:hover {
                background: #444444;
            }
            
            .positions-container {
                max-height: 120px;
                overflow-y: auto;
                background: #222222;
                border: 1px solid rgba(51, 51, 51, 0.7);
                border-radius: 6px;
                padding: 8px;
            }
            
            .no-data {
                text-align: center;
                color: #666666;
                font-style: italic;
                padding: 16px;
                font-size: 12px;
            }
            
            .position-item {
                background: #2a2a2a;
                border: 1px solid #444444;
                border-radius: 4px;
                padding: 8px;
                margin-bottom: 6px;
                font-size: 11px;
            }
            
            .position-header {
                color: #00ffff;
                font-weight: bold;
                margin-bottom: 4px;
                font-size: 10px;
            }
            
            .position-details {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 4px;
            }
            
            .position-detail {
                color: #cccccc;
                font-size: 10px;
            }
            
            .profit-positive { color: #00ff00; }
            .profit-negative { color: #ff4500; }
            
            .console-container {
                height: 100px;
                overflow-y: auto;
                background: #000000;
                border: 1px solid rgba(51, 51, 51, 0.7);
                border-radius: 6px;
                padding: 8px;
                font-size: 10px;
                white-space: pre-wrap;
                color: #cccccc;
                font-family: 'Courier New', monospace;
            }
            
            .console-container::-webkit-scrollbar {
                width: 4px;
            }
            
            .console-container::-webkit-scrollbar-track {
                background: #222222;
            }
            
            .console-container::-webkit-scrollbar-thumb {
                background: #555555;
                border-radius: 2px;
            }
            
            .positions-container::-webkit-scrollbar {
                width: 4px;
            }
            
            .positions-container::-webkit-scrollbar-track {
                background: #222222;
            }
            
            .positions-container::-webkit-scrollbar-thumb {
                background: #555555;
                border-radius: 2px;
            }
        `;
        
        document.head.appendChild(styles);
    }

    /**
     * Connect to existing data feeds in the main app
     */
    connectToExistingDataFeeds() {
        // Try to connect to existing AMPL price updates
        this.connectToAMPLPrice();
        
        // Try to connect to existing balance updates
        this.connectToBalanceUpdates();
        
        // Try to connect to existing order updates
        this.connectToOrderUpdates();
        
        // Fallback: start our own updates if no existing feeds found
        setTimeout(() => {
            if (!this.marketData.currentPrice) {
                this.startFallbackUpdates();
            }
        }, 5000);
    }

    /**
     * Connect to existing AMPL price feed
     */
    connectToAMPLPrice() {
        // Look for existing price display elements
        const priceElements = [
            document.querySelector('#current-ampl-price'),
            document.querySelector('.ampl-price'),
            document.querySelector('[data-price="AMPL"]'),
            document.getElementById('amplPrice')
        ];
        
        for (const element of priceElements) {
            if (element) {
                // Set up observer to watch for price changes
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'childList' || mutation.type === 'characterData') {
                            const priceText = element.textContent || element.innerText;
                            const priceMatch = priceText.match(/\$?(\d+\.?\d*)/);
                            if (priceMatch) {
                                const price = parseFloat(priceMatch[1]);
                                if (price > 0 && price !== this.marketData.currentPrice) {
                                    this.updatePrice(price);
                                }
                            }
                        }
                    });
                });
                
                observer.observe(element, {
                    childList: true,
                    subtree: true,
                    characterData: true
                });
                
                // Get initial price
                const initialPriceText = element.textContent || element.innerText;
                const initialPriceMatch = initialPriceText.match(/\$?(\d+\.?\d*)/);
                if (initialPriceMatch) {
                    const initialPrice = parseFloat(initialPriceMatch[1]);
                    if (initialPrice > 0) {
                        this.updatePrice(initialPrice);
                    }
                }
                
                console.log('✅ Connected to existing AMPL price feed');
                return;
            }
        }
        
        // Try to hook into existing price update functions
        if (window.updateAMPLPrice) {
            const originalUpdate = window.updateAMPLPrice;
            window.updateAMPLPrice = (price) => {
                originalUpdate(price);
                this.updatePrice(price);
            };
            console.log('✅ Hooked into existing updateAMPLPrice function');
        }
        
        // Look for global price variables
        if (window.amplPrice && window.amplPrice > 0) {
            this.updatePrice(window.amplPrice);
            console.log('✅ Found existing AMPL price variable');
        }
    }

    /**
     * Connect to existing balance updates
     */
    connectToBalanceUpdates() {
        // Look for existing balance display
        const balanceElements = [
            document.querySelector('#kucoin-balance'),
            document.querySelector('.usdt-balance'),
            document.querySelector('[data-currency="USDT"]')
        ];
        
        for (const element of balanceElements) {
            if (element) {
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'childList' || mutation.type === 'characterData') {
                            const balanceText = element.textContent || element.innerText;
                            const balanceMatch = balanceText.match(/\$?(\d+\.?\d*)/);
                            if (balanceMatch) {
                                const balance = parseFloat(balanceMatch[1]);
                                if (balance >= 0) {
                                    this.marketData.balance = balance;
                                    document.getElementById('usdtBalance').textContent = '$' + balance.toFixed(2);
                                }
                            }
                        }
                    });
                });
                
                observer.observe(element, {
                    childList: true,
                    subtree: true,
                    characterData: true
                });
                
                console.log('✅ Connected to existing balance feed');
                return;
            }
        }
    }

    /**
     * Connect to existing order updates
     */
    connectToOrderUpdates() {
        // Hook into existing order management functions
        if (window.updateOrders) {
            const originalUpdate = window.updateOrders;
            window.updateOrders = (orders) => {
                originalUpdate(orders);
                if (Array.isArray(orders)) {
                    this.marketData.openOrders = orders;
                    document.getElementById('activeOrders').textContent = orders.length;
                    this.checkOrderStatus();
                }
            };
            console.log('✅ Hooked into existing order updates');
        }
    }

    /**
     * Start fallback updates if no existing feeds found
     */
    startFallbackUpdates() {
        console.log('⚠️ No existing data feeds found, starting fallback updates');
        
        // Fallback price updates
        this.priceUpdateInterval = setInterval(() => {
            this.fetchAMPLPriceDirectly();
        }, 20000);
        
        // Fallback balance updates
        this.balanceUpdateInterval = setInterval(() => {
            this.fetchBalanceDirectly();
        }, 30000);
        
        // Initial updates
        this.fetchAMPLPriceDirectly();
        this.fetchBalanceDirectly();
    }

    /**
     * Fetch AMPL price directly (fallback)
     */
    async fetchAMPLPriceDirectly() {
        try {
            // Try multiple price sources
            const sources = [
                'https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=AMPL-USDT',
                'https://api.coingecko.com/api/v3/simple/price?ids=ampleforth&vs_currencies=usd'
            ];
            
            for (const source of sources) {
                try {
                    const response = await fetch(source);
                    if (response.ok) {
                        const data = await response.json();
                        
                        let price = null;
                        if (data.data && data.data.price) {
                            price = parseFloat(data.data.price);
                        } else if (data.ampleforth && data.ampleforth.usd) {
                            price = parseFloat(data.ampleforth.usd);
                        }
                        
                        if (price && price > 0) {
                            this.updatePrice(price);
                            return;
                        }
                    }
                } catch (error) {
                    console.debug('Price source failed:', source, error.message);
                }
            }
            
        } catch (error) {
            console.debug('All price sources failed:', error.message);
        }
    }

    /**
     * Fetch balance directly (fallback)
     */
    async fetchBalanceDirectly() {
        // This would need proper API credentials
        // For now, just show a placeholder
        if (!this.marketData.balance) {
            this.marketData.balance = 0;
            document.getElementById('usdtBalance').textContent = '$0.00';
        }
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
            
            this.log(`Price: $${oldPrice.toFixed(3)} → $${newPrice.toFixed(3)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`);
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
        
        this.log(`Position Added: ${positionId}`);
        this.log(`${amplQuantity.toFixed(3)} AMPL at $${purchasePrice.toFixed(3)} = $${totalUSDInvested.toFixed(2)}`);
        
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
     * Place sell order (integrate with existing order system)
     */
    async placeSellOrder(positionId, profit) {
        const position = this.positions.get(positionId);
        if (!position) return;
        
        try {
            this.log(`PROFIT TARGET REACHED: ${positionId}`);
            this.log(`Profit: ${profit.profitPercentage.toFixed(2)}% (Target: ${position.profitThreshold}%)`);
            
            // Try to use existing order placement function
            if (window.placeKuCoinOrder) {
                const orderData = {
                    symbol: 'AMPL-USDT',
                    side: 'sell',
                    type: 'limit',
                    size: Math.floor(position.amplQuantity).toString(),
                    price: (this.marketData.currentPrice * 0.999).toFixed(3),
                    clientOid: `profit_${positionId}_${Date.now()}`
                };
                
                const result = await window.placeKuCoinOrder(orderData);
                
                if (result && result.success && result.orderId) {
                    position.sellOrderId = result.orderId;
                    position.sellOrderPlaced = true;
                    position.sellOrderTime = new Date();
                    
                    this.log(`Sell order placed: ${result.orderId}`);
                    this.log(`${orderData.size} AMPL at $${orderData.price}`);
                    
                    this.savePositions();
                    this.updatePositionsDisplay();
                    
                } else {
                    this.log(`Order placement failed: ${result?.error || 'Unknown error'}`);
                }
            } else {
                this.log(`No order placement function available`);
            }
            
        } catch (error) {
            this.log(`Sell order error: ${error.message}`);
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
                    this.log(`Order completed: ${positionId}`);
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
        
        this.log('AMPL Profit System STARTED');
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
            this.log('System PAUSED');
        } else {
            statusEl.textContent = 'ACTIVE';
            statusEl.className = 'status-indicator active';
            document.getElementById('pauseBtn').classList.remove('active');
            this.log('System RESUMED');
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
        
        this.log(`Profit threshold set to ${percentage}%`);
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
            positionsListEl.innerHTML = '<div class="no-data">No active positions</div>';
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
                        <div class="position-detail">${position.amplQuantity.toFixed(3)} AMPL</div>
                        <div class="position-detail">$${position.purchasePrice.toFixed(3)}</div>
                        <div class="position-detail ${profitClass}">${profit.profitPercentage.toFixed(2)}%</div>
                    </div>
                    ${position.sellOrderPlaced ? '<div style="color: #ffa500; font-size: 9px;">Sell order placed</div>' : ''}
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
        
        // Keep only last 50 lines
        const lines = consoleEl.textContent.split('\n');
        if (lines.length > 50) {
            consoleEl.textContent = lines.slice(-50).join('\n');
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
            const value = localStorage.getItem(`amplProfitPanelFixed_${key}`);
            return value !== null ? JSON.parse(value) : defaultValue;
        }
        return defaultValue;
    }

    saveSetting(key, value) {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(`amplProfitPanelFixed_${key}`, JSON.stringify(value));
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
            this.log(`Restored ${this.positions.size} positions from storage`);
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
        return new AMPLProfitPanelFixed();
    }

    // Method to be called from main app when buy order fills
    onBuyOrderFilled(orderId, amplQuantity, purchasePrice, totalUSDInvested) {
        this.addPosition(orderId, amplQuantity, purchasePrice, totalUSDInvested);
    }

    // Method to be called from control panel
    show() {
        const panel = document.getElementById('amplProfitPanelFixed');
        if (panel) {
            panel.style.display = 'block';
        }
    }

    hide() {
        const panel = document.getElementById('amplProfitPanelFixed');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    // Cleanup method
    destroy() {
        if (this.priceUpdateInterval) clearInterval(this.priceUpdateInterval);
        if (this.balanceUpdateInterval) clearInterval(this.balanceUpdateInterval);
        if (this.ordersUpdateInterval) clearInterval(this.ordersUpdateInterval);
        
        const panel = document.getElementById('amplProfitPanelFixed');
        if (panel) panel.remove();
        
        const styles = document.getElementById('amplProfitPanelFixedStyles');
        if (styles) styles.remove();
    }
}

// Create global instance
const amplProfitPanelFixed = AMPLProfitPanelFixed.create();

// Make it globally available
if (typeof window !== 'undefined') {
    window.amplProfitPanelFixed = amplProfitPanelFixed;
}

console.log('🎯 AMPL Profit Panel (Fixed Integration) Loaded!');

