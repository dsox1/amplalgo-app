/**
 * AMPL Rebalancing System - Fixed Version
 * Fixes API integration, removes trigger box, adds proper price labeling
 */

class AMPLRebalancingSystemFixed {
    constructor() {
        this.targetPanel = null;
        this.isInitialized = false;
        this.monitoringInterval = null;
        this.triggerCooldown = false;
        this.lastTriggerTime = 0;
        
        // Rebalancing system data - start with zeros as requested
        this.coins = {
            SOL: { 
                symbol: 'SOL/USDT', 
                quantity: 0, 
                purchasePrice: 0, 
                currentPrice: 0, 
                totalValue: 0, 
                profit: 0, 
                profitPercent: 0,
                status: '💤'
            },
            SUI: { 
                symbol: 'SUI/USDT', 
                quantity: 0, 
                purchasePrice: 0, 
                currentPrice: 0, 
                totalValue: 0, 
                profit: 0, 
                profitPercent: 0,
                status: '💤'
            },
            BTC: { 
                symbol: 'BTC/USDT', 
                quantity: 0, 
                purchasePrice: 0, 
                currentPrice: 0, 
                totalValue: 0, 
                profit: 0, 
                profitPercent: 0,
                status: '💤'
            },
            AMPL: { 
                symbol: 'AMPL/USDT', 
                quantity: 0, 
                purchasePrice: 0, 
                currentPrice: 0, 
                totalValue: 0, 
                profit: 0, 
                profitPercent: 0,
                status: '💤'
            }
        };
        
        this.settings = {
            profitThreshold: 1.5, // 1.5% as requested
            amplThreshold: 1.16,
            totalInvested: 0,
            totalCurrentValue: 0,
            totalProfit: 0,
            totalProfitPercent: 0,
            usdtBalance: 0,
            autoRebalance: true
        };
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            setTimeout(() => this.initialize(), 1000);
        }
    }

    initialize() {
        console.log('🎬 Initializing FIXED AMPL Rebalancing System...');
        
        // Clear any existing instances
        this.clearExistingInstances();
        
        // Find the exact target panel using known structure
        this.findTargetPanel();
        
        if (this.targetPanel) {
            this.createCleanRebalancingPanel();
            this.applyStyles();
            this.bindEventListeners();
            this.loadRealData();
            this.startPriceMonitoring();
            this.isInitialized = true;
            console.log('✅ FIXED AMPL Rebalancing System integrated successfully');
        } else {
            console.log('❌ Target panel not found');
        }
    }

    clearExistingInstances() {
        // Remove any existing rebalancing panels
        const existingPanels = document.querySelectorAll('.fixed-rebalancing-panel');
        existingPanels.forEach(panel => panel.remove());
        
        // Clear intervals
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }

    findTargetPanel() {
        // Use exact known structure from HTML - target the Limit Orders section content
        const limitOrdersSection = document.querySelector('.ladder-section.limit-orders-section');
        if (limitOrdersSection) {
            this.targetPanel = limitOrdersSection.querySelector('.section-content');
            console.log('✅ Found target panel using exact structure');
        } else {
            console.log('❌ Limit Orders section not found');
        }
    }

    createCleanRebalancingPanel() {
        if (!this.targetPanel) return;

        // Create the clean rebalancing panel - NO trigger box, proper labeling
        const rebalancingHTML = `
            <div class="fixed-rebalancing-panel" id="fixed-rebalancing-panel">
                <!-- Clean Header Section -->
                <div class="rebalancing-header">
                    <div class="header-title">
                        <h3>🔄 AMPL REBALANCING SYSTEM</h3>
                        <div class="system-status" id="system-status">✅ MONITORING</div>
                    </div>
                    <div class="price-display">
                        <span class="price-label">Current:</span>
                        <span class="current-price" id="current-ampl-display">$0.000</span>
                        <span class="trigger-info">Trigger: $1.16</span>
                    </div>
                </div>

                <!-- Portfolio Overview -->
                <div class="portfolio-overview">
                    <div class="overview-stat">
                        <span class="stat-label">Balance:</span>
                        <span class="stat-value balance" id="portfolio-balance">$0.00</span>
                    </div>
                    <div class="overview-stat">
                        <span class="stat-label">Invested:</span>
                        <span class="stat-value invested" id="portfolio-invested">$0.00</span>
                    </div>
                    <div class="overview-stat">
                        <span class="stat-label">Value:</span>
                        <span class="stat-value current" id="portfolio-value">$0.00</span>
                    </div>
                    <div class="overview-stat">
                        <span class="stat-label">Profit:</span>
                        <span class="stat-value profit" id="portfolio-profit">$0.00 (0.00%)</span>
                    </div>
                </div>

                <!-- Coins Display - Each coin on separate row for readability -->
                <div class="coins-display">
                    <!-- SOL Row -->
                    <div class="coin-row" data-coin="SOL">
                        <div class="coin-info">
                            <div class="coin-header">
                                <span class="coin-icon">☀️</span>
                                <span class="coin-name">SOL</span>
                                <span class="coin-status" id="sol-status">💤</span>
                            </div>
                            <div class="coin-data">
                                <span class="data-item">
                                    <span class="data-label">Qty:</span>
                                    <span class="data-value" id="sol-quantity">0.000</span>
                                </span>
                                <span class="data-item">
                                    <span class="data-label">Buy:</span>
                                    <span class="data-value" id="sol-purchase">$0.00</span>
                                </span>
                                <span class="data-item">
                                    <span class="data-label">Now:</span>
                                    <span class="data-value" id="sol-current">$0.00</span>
                                </span>
                                <span class="data-item">
                                    <span class="data-label">Value:</span>
                                    <span class="data-value" id="sol-value">$0.00</span>
                                </span>
                                <span class="data-item profit-item">
                                    <span class="data-label">Profit:</span>
                                    <span class="data-value profit-value" id="sol-profit">$0.00 (0.00%)</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- SUI Row -->
                    <div class="coin-row" data-coin="SUI">
                        <div class="coin-info">
                            <div class="coin-header">
                                <span class="coin-icon">🌊</span>
                                <span class="coin-name">SUI</span>
                                <span class="coin-status" id="sui-status">💤</span>
                            </div>
                            <div class="coin-data">
                                <span class="data-item">
                                    <span class="data-label">Qty:</span>
                                    <span class="data-value" id="sui-quantity">0.000</span>
                                </span>
                                <span class="data-item">
                                    <span class="data-label">Buy:</span>
                                    <span class="data-value" id="sui-purchase">$0.00</span>
                                </span>
                                <span class="data-item">
                                    <span class="data-label">Now:</span>
                                    <span class="data-value" id="sui-current">$0.00</span>
                                </span>
                                <span class="data-item">
                                    <span class="data-label">Value:</span>
                                    <span class="data-value" id="sui-value">$0.00</span>
                                </span>
                                <span class="data-item profit-item">
                                    <span class="data-label">Profit:</span>
                                    <span class="data-value profit-value" id="sui-profit">$0.00 (0.00%)</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- BTC Row -->
                    <div class="coin-row" data-coin="BTC">
                        <div class="coin-info">
                            <div class="coin-header">
                                <span class="coin-icon">₿</span>
                                <span class="coin-name">BTC</span>
                                <span class="coin-status" id="btc-status">💤</span>
                            </div>
                            <div class="coin-data">
                                <span class="data-item">
                                    <span class="data-label">Qty:</span>
                                    <span class="data-value" id="btc-quantity">0.000000</span>
                                </span>
                                <span class="data-item">
                                    <span class="data-label">Buy:</span>
                                    <span class="data-value" id="btc-purchase">$0.00</span>
                                </span>
                                <span class="data-item">
                                    <span class="data-label">Now:</span>
                                    <span class="data-value" id="btc-current">$0.00</span>
                                </span>
                                <span class="data-item">
                                    <span class="data-label">Value:</span>
                                    <span class="data-value" id="btc-value">$0.00</span>
                                </span>
                                <span class="data-item profit-item">
                                    <span class="data-label">Profit:</span>
                                    <span class="data-value profit-value" id="btc-profit">$0.00 (0.00%)</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- AMPL Row -->
                    <div class="coin-row" data-coin="AMPL">
                        <div class="coin-info">
                            <div class="coin-header">
                                <span class="coin-icon">🎯</span>
                                <span class="coin-name">AMPL</span>
                                <span class="coin-status" id="ampl-status">💤</span>
                            </div>
                            <div class="coin-data">
                                <span class="data-item">
                                    <span class="data-label">Qty:</span>
                                    <span class="data-value" id="ampl-quantity">0.000</span>
                                </span>
                                <span class="data-item">
                                    <span class="data-label">Buy:</span>
                                    <span class="data-value" id="ampl-purchase">$0.00</span>
                                </span>
                                <span class="data-item">
                                    <span class="data-label">Now:</span>
                                    <span class="data-value" id="ampl-current">$0.00</span>
                                </span>
                                <span class="data-item">
                                    <span class="data-label">Value:</span>
                                    <span class="data-value" id="ampl-value">$0.00</span>
                                </span>
                                <span class="data-item profit-item">
                                    <span class="data-label">Profit:</span>
                                    <span class="data-value profit-value" id="ampl-profit">$0.00 (0.00%)</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Action Log -->
                <div class="action-log">
                    <div class="log-header">
                        <span class="log-title">Recent Actions</span>
                        <button class="clear-log-btn" id="clear-rebalancing-log">Clear</button>
                    </div>
                    <div class="log-messages" id="rebalancing-log-messages">
                        <div class="log-entry">
                            <span class="log-time">Ready</span>
                            <span class="log-text">Rebalancing system initialized</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Replace the panel content completely - eliminate the old limit order system
        this.targetPanel.innerHTML = rebalancingHTML;
    }

    applyStyles() {
        const style = document.createElement('style');
        style.id = 'fixed-ampl-rebalancing-styles';
        style.textContent = `
            /* Fixed Rebalancing Panel - Clean Design */
            .fixed-rebalancing-panel {
                width: 100%;
                height: 100%;
                background: var(--panel-bg, rgba(0, 0, 0, 0.9));
                border: 2px solid rgba(76, 175, 80, 0.4);
                border-radius: 12px;
                padding: 16px;
                color: var(--text-primary, #ffffff);
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 12px;
                box-sizing: border-box;
            }

            /* Clean Header Section */
            .rebalancing-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid rgba(76, 175, 80, 0.3);
                margin-bottom: 8px;
            }

            .header-title h3 {
                font-size: 18px;
                font-weight: 700;
                color: #4CAF50;
                margin: 0;
                text-shadow: 0 0 8px rgba(76, 175, 80, 0.3);
            }

            .system-status {
                font-size: 14px;
                padding: 4px 8px;
                border-radius: 6px;
                background: rgba(76, 175, 80, 0.2);
                color: #4CAF50;
                border: 1px solid rgba(76, 175, 80, 0.4);
                margin-top: 4px;
            }

            .system-status.warning {
                background: rgba(255, 193, 7, 0.2);
                color: #FFC107;
                border-color: rgba(255, 193, 7, 0.4);
            }

            /* Price Display - Clean and Labeled */
            .price-display {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
            }

            .price-label {
                color: var(--text-secondary, #b0b0b0);
                font-weight: 500;
            }

            .current-price {
                color: #FFC107;
                font-weight: 700;
                font-size: 16px;
                text-shadow: 0 0 8px rgba(255, 193, 7, 0.3);
            }

            .current-price.trigger-active {
                color: #F44336;
                text-shadow: 0 0 8px rgba(244, 67, 54, 0.3);
                animation: pulse 1s infinite;
            }

            .trigger-info {
                color: var(--text-muted, #808080);
                font-size: 12px;
            }

            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.7; }
                100% { opacity: 1; }
            }

            /* Portfolio Overview */
            .portfolio-overview {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 8px;
                margin-bottom: 12px;
            }

            .overview-stat {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                padding: 8px;
                text-align: center;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .stat-label {
                display: block;
                font-size: 11px;
                color: var(--text-secondary, #b0b0b0);
                margin-bottom: 4px;
            }

            .stat-value {
                display: block;
                font-size: 14px;
                font-weight: 600;
                color: var(--text-primary, #ffffff);
            }

            .stat-value.balance {
                color: #FFC107;
            }

            .stat-value.profit.positive {
                color: #4CAF50;
            }

            .stat-value.profit.negative {
                color: #F44336;
            }

            /* Coins Display - Each coin on separate row */
            .coins-display {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-bottom: 12px;
                overflow: hidden;
            }

            .coin-row {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                padding: 12px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                transition: all 0.3s ease;
                overflow: hidden;
            }

            .coin-row:hover {
                border-color: rgba(255, 255, 255, 0.2);
                background: rgba(255, 255, 255, 0.08);
            }

            .coin-row.profitable {
                border-color: rgba(76, 175, 80, 0.5);
                background: rgba(76, 175, 80, 0.05);
            }

            .coin-row.loss {
                border-color: rgba(244, 67, 54, 0.5);
                background: rgba(244, 67, 54, 0.05);
            }

            .coin-info {
                width: 100%;
                overflow: hidden;
            }

            .coin-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
            }

            .coin-icon {
                font-size: 18px;
            }

            .coin-name {
                font-size: 16px;
                font-weight: 600;
                color: var(--text-primary, #ffffff);
                min-width: 40px;
            }

            .coin-status {
                font-size: 16px;
                margin-left: auto;
            }

            .coin-data {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
                align-items: center;
                overflow: hidden;
            }

            .data-item {
                display: flex;
                align-items: center;
                gap: 4px;
                min-width: 80px;
                overflow: hidden;
            }

            .data-label {
                font-size: 12px;
                color: var(--text-secondary, #b0b0b0);
                min-width: 35px;
                flex-shrink: 0;
            }

            .data-value {
                font-size: 13px;
                font-weight: 500;
                color: var(--text-primary, #ffffff);
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .profit-item .profit-value.positive {
                color: #4CAF50;
            }

            .profit-item .profit-value.negative {
                color: #F44336;
            }

            /* Action Log */
            .action-log {
                background: rgba(255, 255, 255, 0.03);
                border-radius: 8px;
                padding: 8px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                max-height: 100px;
                overflow: hidden;
            }

            .log-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 6px;
            }

            .log-title {
                font-size: 12px;
                color: var(--text-secondary, #b0b0b0);
                font-weight: 600;
            }

            .clear-log-btn {
                background: none;
                border: none;
                color: var(--text-secondary, #b0b0b0);
                cursor: pointer;
                font-size: 10px;
                padding: 2px 6px;
                border-radius: 4px;
                transition: all 0.2s ease;
            }

            .clear-log-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                color: var(--text-primary, #ffffff);
            }

            .log-messages {
                max-height: 60px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .log-entry {
                display: flex;
                gap: 8px;
                font-size: 11px;
                padding: 2px 4px;
                border-radius: 4px;
                background: rgba(255, 255, 255, 0.02);
                overflow: hidden;
            }

            .log-time {
                color: var(--text-muted, #808080);
                flex-shrink: 0;
                min-width: 50px;
                font-size: 10px;
            }

            .log-text {
                color: var(--text-primary, #ffffff);
                flex: 1;
                font-size: 11px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            /* Scrollbar Styling */
            .log-messages::-webkit-scrollbar {
                width: 4px;
            }

            .log-messages::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.05);
            }

            .log-messages::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.2);
                border-radius: 2px;
            }

            .fixed-rebalancing-panel::-webkit-scrollbar {
                width: 6px;
            }

            .fixed-rebalancing-panel::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.05);
            }

            .fixed-rebalancing-panel::-webkit-scrollbar-thumb {
                background: rgba(76, 175, 80, 0.3);
                border-radius: 3px;
            }

            /* Responsive adjustments */
            @media (max-width: 768px) {
                .portfolio-overview {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .coin-data {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 6px;
                }
                
                .data-item {
                    min-width: auto;
                }
            }
        `;
        
        // Remove any existing styles first
        const existingStyle = document.getElementById('fixed-ampl-rebalancing-styles');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        document.head.appendChild(style);
    }

    bindEventListeners() {
        console.log('🔗 Binding fixed rebalancing system event listeners...');
        
        // Clear log button
        const clearLogBtn = document.getElementById('clear-rebalancing-log');
        if (clearLogBtn) {
            clearLogBtn.addEventListener('click', () => {
                this.clearActionLog();
            });
        }
        
        console.log('✅ Event listeners bound');
    }

    async loadRealData() {
        console.log('📊 Loading real data...');
        
        try {
            // Load real USDT balance
            await this.fetchRealBalance();
            
            // Load real portfolio data
            await this.fetchRealPortfolio();
            
            // Load real prices
            await this.fetchRealPrices();
            
            this.calculateProfits();
            this.updateDisplay();
            
        } catch (error) {
            console.log('📊 Error loading real data:', error.message);
            this.logAction('Error loading real data, using defaults');
        }
    }

    async fetchRealBalance() {
        try {
            // Get balance from KuCoin via the existing balance display
            const balanceElement = document.getElementById('usdt-balance');
            if (balanceElement && balanceElement.textContent !== 'Loading...') {
                const balanceText = balanceElement.textContent.replace(/[^0-9.]/g, '');
                const balance = parseFloat(balanceText);
                if (!isNaN(balance)) {
                    this.settings.usdtBalance = balance;
                    this.logAction(`Balance loaded: $${balance.toFixed(2)}`);
                    return;
                }
            }
            
            // Fallback: try direct API call
            const response = await fetch('/api/kucoin/balance');
            if (response.ok) {
                const data = await response.json();
                if (data.usdt && data.usdt.balance) {
                    this.settings.usdtBalance = data.usdt.balance;
                    this.logAction(`Balance loaded: $${data.usdt.balance.toFixed(2)}`);
                }
            }
            
        } catch (error) {
            console.log('📊 Error fetching balance:', error.message);
            this.settings.usdtBalance = 0; // Default to 0 as requested
        }
    }

    async fetchRealPortfolio() {
        try {
            // Try to get real portfolio data from KuCoin
            const response = await fetch('/api/kucoin/portfolio');
            
            if (response.ok) {
                const data = await response.json();
                
                // Update coin quantities and purchase prices from real data
                if (data.positions) {
                    Object.keys(this.coins).forEach(coinKey => {
                        const position = data.positions[coinKey];
                        if (position) {
                            this.coins[coinKey].quantity = position.quantity || 0;
                            this.coins[coinKey].purchasePrice = position.avgPrice || 0;
                        }
                    });
                    
                    this.logAction('Portfolio data loaded from KuCoin');
                }
            }
            
        } catch (error) {
            console.log('📊 Error fetching portfolio:', error.message);
            // Keep all coins at 0 as requested
        }
    }

    async fetchRealPrices() {
        try {
            // Try multiple price sources for reliability
            await Promise.race([
                this.fetchCoinGeckoPrices(),
                this.fetchBinancePrices(),
                this.fetchKuCoinPrices()
            ]);
            
        } catch (error) {
            console.log('📊 All price APIs failed, using fallback');
            this.useFallbackPrices();
        }
    }

    async fetchCoinGeckoPrices() {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana,sui,bitcoin,ampleforth&vs_currencies=usd');
        const data = await response.json();
        
        if (data.solana) this.coins.SOL.currentPrice = data.solana.usd;
        if (data.sui) this.coins.SUI.currentPrice = data.sui.usd;
        if (data.bitcoin) this.coins.BTC.currentPrice = data.bitcoin.usd;
        if (data.ampleforth) this.coins.AMPL.currentPrice = data.ampleforth.usd;
    }

    async fetchBinancePrices() {
        const symbols = ['SOLUSDT', 'SUIUSDT', 'BTCUSDT'];
        const promises = symbols.map(symbol => 
            fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`)
                .then(res => res.json())
        );
        
        const results = await Promise.all(promises);
        
        results.forEach((result, index) => {
            if (result.price) {
                switch (symbols[index]) {
                    case 'SOLUSDT':
                        this.coins.SOL.currentPrice = parseFloat(result.price);
                        break;
                    case 'SUIUSDT':
                        this.coins.SUI.currentPrice = parseFloat(result.price);
                        break;
                    case 'BTCUSDT':
                        this.coins.BTC.currentPrice = parseFloat(result.price);
                        break;
                }
            }
        });
    }

    async fetchKuCoinPrices() {
        try {
            const response = await fetch('/api/kucoin/prices');
            if (response.ok) {
                const data = await response.json();
                if (data.prices) {
                    Object.keys(this.coins).forEach(coinKey => {
                        if (data.prices[coinKey]) {
                            this.coins[coinKey].currentPrice = data.prices[coinKey];
                        }
                    });
                }
            }
        } catch (error) {
            throw new Error('KuCoin prices not available');
        }
    }

    useFallbackPrices() {
        // Use realistic fallback prices
        this.coins.SOL.currentPrice = 162.66;
        this.coins.SUI.currentPrice = 3.80;
        this.coins.BTC.currentPrice = 95000;
        this.coins.AMPL.currentPrice = 1.189;
    }

    startPriceMonitoring() {
        console.log('🔍 Starting price monitoring...');
        
        // Clear any existing interval
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        // Immediate check
        this.updatePrices();
        
        // Regular monitoring every 2 minutes
        this.monitoringInterval = setInterval(() => {
            this.updatePrices();
        }, 120000);
        
        console.log('✅ Price monitoring started (2-minute intervals)');
    }

    async updatePrices() {
        try {
            await this.fetchRealPrices();
            this.calculateProfits();
            this.checkTriggerConditions();
            this.updateDisplay();
            
        } catch (error) {
            console.log('📊 Error updating prices:', error.message);
        }
    }

    checkTriggerConditions() {
        const currentTime = Date.now();
        
        // Check AMPL trigger condition
        if (this.coins.AMPL.currentPrice < this.settings.amplThreshold && 
            !this.triggerCooldown && 
            this.settings.autoRebalance &&
            this.settings.usdtBalance >= 40) { // Minimum $40 for $10 per coin
            
            this.triggerRebalance();
        }
        
        // Check profit-taking opportunities
        this.checkProfitOpportunities();
    }

    async triggerRebalance() {
        console.log('🚨 AMPL Trigger activated - starting rebalance...');
        
        this.triggerCooldown = true;
        this.lastTriggerTime = Date.now();
        
        this.logAction(`🚨 TRIGGER: AMPL at $${this.coins.AMPL.currentPrice.toFixed(3)} < $${this.settings.amplThreshold}`);
        
        try {
            // Calculate equal allocation (25% each coin)
            const totalAmount = this.settings.usdtBalance;
            const amountPerCoin = totalAmount / 4;
            
            if (amountPerCoin >= 10) { // Minimum $10 per coin
                this.logAction(`💰 Starting equal allocation: $${amountPerCoin.toFixed(2)} per coin`);
                
                // Place buy orders for all 4 coins using the working API
                const buyPromises = [
                    this.placeBuyOrder('SOL', amountPerCoin),
                    this.placeBuyOrder('SUI', amountPerCoin),
                    this.placeBuyOrder('BTC', amountPerCoin),
                    this.placeBuyOrder('AMPL', amountPerCoin)
                ];
                
                const results = await Promise.allSettled(buyPromises);
                
                let successCount = 0;
                results.forEach((result, index) => {
                    const coinNames = ['SOL', 'SUI', 'BTC', 'AMPL'];
                    if (result.status === 'fulfilled') {
                        successCount++;
                        this.logAction(`✅ Bought ${coinNames[index]}: $${amountPerCoin.toFixed(2)}`);
                    } else {
                        this.logAction(`❌ Failed to buy ${coinNames[index]}: ${result.reason}`);
                    }
                });
                
                this.logAction(`🎯 Rebalance completed: ${successCount}/4 orders successful`);
                
                // Refresh portfolio data
                await this.fetchRealPortfolio();
                await this.fetchRealBalance();
                
            } else {
                this.logAction(`❌ Insufficient balance for rebalance: $${totalAmount.toFixed(2)}`);
            }
            
        } catch (error) {
            this.logAction(`❌ Rebalance error: ${error.message}`);
        }
        
        // Set cooldown for 10 minutes
        setTimeout(() => {
            this.triggerCooldown = false;
            this.logAction('🔄 Trigger cooldown expired - monitoring resumed');
        }, 600000);
    }

    async placeBuyOrder(coinSymbol, usdtAmount) {
        try {
            const symbol = `${coinSymbol}-USDT`;
            const currentPrice = this.coins[coinSymbol].currentPrice;
            const quantity = (usdtAmount / currentPrice).toFixed(coinSymbol === 'BTC' ? 6 : 3);
            
            // Use the working KuCoin API endpoint
            const response = await fetch('/api/kucoin/order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    symbol: symbol,
                    side: 'buy',
                    type: 'market',
                    funds: usdtAmount.toFixed(2)
                })
            });
            
            if (!response.ok) {
                throw new Error(`Order API error: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.orderId) {
                // Update local portfolio data
                const newQuantity = this.coins[coinSymbol].quantity + parseFloat(quantity);
                const totalCost = (this.coins[coinSymbol].quantity * this.coins[coinSymbol].purchasePrice) + usdtAmount;
                const newAvgPrice = totalCost / newQuantity;
                
                this.coins[coinSymbol].quantity = newQuantity;
                this.coins[coinSymbol].purchasePrice = newAvgPrice;
                
                return result;
            } else {
                throw new Error('No order ID returned');
            }
            
        } catch (error) {
            console.log(`📊 Error placing ${coinSymbol} order:`, error.message);
            throw error;
        }
    }

    checkProfitOpportunities() {
        Object.keys(this.coins).forEach(coinKey => {
            const coin = this.coins[coinKey];
            
            if (coin.quantity > 0 && coin.profitPercent >= this.settings.profitThreshold) {
                if (coin.status !== '🎯') {
                    coin.status = '🎯';
                    this.logAction(`🎯 ${coinKey} ready to sell: ${coin.profitPercent.toFixed(2)}% profit`);
                }
            } else if (coin.quantity > 0) {
                if (coin.profit > 0) {
                    coin.status = '📈';
                } else {
                    coin.status = '📊';
                }
            } else {
                coin.status = '💤';
            }
        });
    }

    calculateProfits() {
        let totalInvested = 0;
        let totalCurrentValue = 0;
        
        Object.keys(this.coins).forEach(coinKey => {
            const coin = this.coins[coinKey];
            
            if (coin.quantity > 0) {
                const invested = coin.quantity * coin.purchasePrice;
                const currentValue = coin.quantity * coin.currentPrice;
                
                coin.totalValue = currentValue;
                coin.profit = currentValue - invested;
                coin.profitPercent = invested > 0 ? (coin.profit / invested) * 100 : 0;
                
                totalInvested += invested;
                totalCurrentValue += currentValue;
            } else {
                coin.totalValue = 0;
                coin.profit = 0;
                coin.profitPercent = 0;
            }
        });
        
        this.settings.totalInvested = totalInvested;
        this.settings.totalCurrentValue = totalCurrentValue;
        this.settings.totalProfit = totalCurrentValue - totalInvested;
        this.settings.totalProfitPercent = totalInvested > 0 ? (this.settings.totalProfit / totalInvested) * 100 : 0;
    }

    updateDisplay() {
        // Update system status and price display
        const systemStatus = document.getElementById('system-status');
        const currentAmplDisplay = document.getElementById('current-ampl-display');
        
        if (currentAmplDisplay) {
            currentAmplDisplay.textContent = `$${this.coins.AMPL.currentPrice.toFixed(3)}`;
            currentAmplDisplay.className = 'current-price';
            
            if (this.coins.AMPL.currentPrice < this.settings.amplThreshold) {
                currentAmplDisplay.classList.add('trigger-active');
            }
        }
        
        if (systemStatus) {
            if (this.coins.AMPL.currentPrice < this.settings.amplThreshold) {
                systemStatus.textContent = '🚨 TRIGGER READY';
                systemStatus.className = 'system-status warning';
            } else {
                systemStatus.textContent = '✅ MONITORING';
                systemStatus.className = 'system-status';
            }
        }
        
        // Update portfolio overview
        const elements = {
            'portfolio-balance': `$${this.settings.usdtBalance.toFixed(2)}`,
            'portfolio-invested': `$${this.settings.totalInvested.toFixed(2)}`,
            'portfolio-value': `$${this.settings.totalCurrentValue.toFixed(2)}`,
            'portfolio-profit': `$${this.settings.totalProfit.toFixed(2)} (${this.settings.totalProfitPercent.toFixed(2)}%)`
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = value;
                if (id === 'portfolio-profit') {
                    el.className = 'stat-value profit';
                    if (this.settings.totalProfit >= 0) {
                        el.classList.add('positive');
                    } else {
                        el.classList.add('negative');
                    }
                }
            }
        });
        
        // Update individual coins
        Object.keys(this.coins).forEach(coinKey => {
            const coin = this.coins[coinKey];
            const coinLower = coinKey.toLowerCase();
            
            const coinElements = {
                [`${coinLower}-quantity`]: coin.quantity.toFixed(coinKey === 'BTC' ? 6 : 3),
                [`${coinLower}-purchase`]: `$${coin.purchasePrice.toFixed(2)}`,
                [`${coinLower}-current`]: `$${coin.currentPrice.toFixed(2)}`,
                [`${coinLower}-value`]: `$${coin.totalValue.toFixed(2)}`,
                [`${coinLower}-profit`]: `$${coin.profit.toFixed(2)} (${coin.profitPercent.toFixed(2)}%)`,
                [`${coinLower}-status`]: coin.status
            };
            
            Object.entries(coinElements).forEach(([id, value]) => {
                const el = document.getElementById(id);
                if (el) {
                    el.textContent = value;
                    if (id.includes('profit')) {
                        el.className = 'data-value profit-value';
                        if (coin.profit >= 0) {
                            el.classList.add('positive');
                        } else {
                            el.classList.add('negative');
                        }
                    }
                }
            });
            
            // Update coin row styling
            const coinRow = document.querySelector(`[data-coin="${coinKey}"]`);
            if (coinRow) {
                coinRow.className = 'coin-row';
                if (coin.profit > 0) {
                    coinRow.classList.add('profitable');
                } else if (coin.profit < 0) {
                    coinRow.classList.add('loss');
                }
            }
        });
    }

    logAction(message) {
        const logMessages = document.getElementById('rebalancing-log-messages');
        if (!logMessages) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.innerHTML = `
            <span class="log-time">${timestamp}</span>
            <span class="log-text">${message}</span>
        `;
        
        logMessages.insertBefore(logEntry, logMessages.firstChild);
        
        // Keep only last 15 messages
        while (logMessages.children.length > 15) {
            logMessages.removeChild(logMessages.lastChild);
        }
        
        console.log(`📋 ${timestamp}: ${message}`);
    }

    clearActionLog() {
        const logMessages = document.getElementById('rebalancing-log-messages');
        if (logMessages) {
            logMessages.innerHTML = `
                <div class="log-entry">
                    <span class="log-time">Ready</span>
                    <span class="log-text">Action log cleared</span>
                </div>
            `;
        }
    }

    // Public methods for external integration
    updateCoinData(coinSymbol, quantity, purchasePrice) {
        if (this.coins[coinSymbol]) {
            this.coins[coinSymbol].quantity = quantity;
            this.coins[coinSymbol].purchasePrice = purchasePrice;
            this.calculateProfits();
            this.updateDisplay();
            this.logAction(`Updated ${coinSymbol}: ${quantity} @ $${purchasePrice}`);
        }
    }

    getCurrentAMPLPrice() {
        return this.coins.AMPL.currentPrice;
    }

    shouldBuy() {
        return this.coins.AMPL.currentPrice < this.settings.amplThreshold;
    }

    getCoinsReadyToSell() {
        const readyToSell = [];
        Object.keys(this.coins).forEach(coinKey => {
            const coin = this.coins[coinKey];
            if (coin.quantity > 0 && coin.profitPercent >= this.settings.profitThreshold) {
                readyToSell.push({
                    symbol: coinKey,
                    quantity: coin.quantity,
                    profit: coin.profit,
                    profitPercent: coin.profitPercent
                });
            }
        });
        return readyToSell;
    }
}

// Initialize the fixed rebalancing system
const amplRebalancingSystemFixed = new AMPLRebalancingSystemFixed();

// Global functions for external use
function updateRebalancingCoin(coinSymbol, quantity, purchasePrice) {
    if (amplRebalancingSystemFixed) {
        amplRebalancingSystemFixed.updateCoinData(coinSymbol, quantity, purchasePrice);
    }
}

function getRebalancingStatus() {
    if (amplRebalancingSystemFixed) {
        return {
            shouldBuy: amplRebalancingSystemFixed.shouldBuy(),
            coinsReadyToSell: amplRebalancingSystemFixed.getCoinsReadyToSell(),
            currentAMPLPrice: amplRebalancingSystemFixed.getCurrentAMPLPrice(),
            totalProfit: amplRebalancingSystemFixed.settings.totalProfit
        };
    }
    return null;
}

console.log('🎬 FIXED AMPL Rebalancing System loaded successfully');

