/**
 * AMPL Rebalancing System - Enhanced with Hover Effects
 * Perfect positioning with mouseover readability enhancement
 */

class AMPLRebalancingSystemEnhanced {
    constructor() {
        this.targetPanel = null;
        this.isInitialized = false;
        this.monitoringInterval = null;
        
        // Rebalancing system data
        this.coins = {
            SOL: { symbol: 'SOL/USDT', quantity: 0, purchasePrice: 0, currentPrice: 0, totalValue: 0, profit: 0, profitPercent: 0 },
            SUI: { symbol: 'SUI/USDT', quantity: 0, purchasePrice: 0, currentPrice: 0, totalValue: 0, profit: 0, profitPercent: 0 },
            BTC: { symbol: 'BTC/USDT', quantity: 0, purchasePrice: 0, currentPrice: 0, totalValue: 0, profit: 0, profitPercent: 0 },
            AMPL: { symbol: 'AMPL/USDT', quantity: 0, purchasePrice: 0, currentPrice: 0, totalValue: 0, profit: 0, profitPercent: 0 }
        };
        
        this.settings = {
            profitThreshold: 5, // Default 5%
            selectedExchange: 'kucoin', // kucoin, binance, both
            amplThreshold: 1.16,
            totalInvested: 0,
            totalCurrentValue: 0,
            totalProfit: 0,
            totalProfitPercent: 0
        };
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            setTimeout(() => this.initialize(), 500);
        }
    }

    initialize() {
        console.log('🎬 Initializing AMPL Rebalancing System (Enhanced with Hover)...');
        
        // DON'T auto-enable the ladder panel - let user control it
        // this.ensureLadderPanelVisible();
        
        // Find the Limit Orders panel
        this.findLimitOrdersPanel();
        
        if (this.targetPanel) {
            this.replaceWithRebalancingSystem();
            this.applyStyles();
            this.bindEventListeners();
            this.startPriceMonitoring();
            this.loadSampleData();
            this.isInitialized = true;
            console.log('✅ AMPL Rebalancing System replaced Limit Orders panel successfully');
        } else {
            console.log('❌ Limit Orders panel not found - waiting for user to enable ladder panel...');
            // Set up observer to watch for ladder panel activation
            this.watchForLadderPanel();
        }
    }

    watchForLadderPanel() {
        // Watch for the ladder panel to become available
        const observer = new MutationObserver(() => {
            if (!this.isInitialized) {
                this.findLimitOrdersPanel();
                if (this.targetPanel) {
                    this.replaceWithRebalancingSystem();
                    this.applyStyles();
                    this.bindEventListeners();
                    this.startPriceMonitoring();
                    this.loadSampleData();
                    this.isInitialized = true;
                    console.log('✅ AMPL Rebalancing System initialized after ladder panel activation');
                    observer.disconnect();
                }
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });
        
        console.log('👀 Watching for ladder panel activation...');
    }

    findLimitOrdersPanel() {
        console.log('🔍 Looking for Limit Orders panel...');
        
        // Method 1: Target the exact structure from the HTML
        const limitOrdersSection = document.querySelector('.ladder-section.limit-orders-section');
        if (limitOrdersSection) {
            this.targetPanel = limitOrdersSection.querySelector('.section-content');
            if (this.targetPanel) {
                console.log('✅ Found Limit Orders panel via exact class selector');
                return;
            }
        }
        
        // Method 2: Look for section header with "Limit Orders" text
        const sectionHeaders = document.querySelectorAll('.section-header h3');
        for (const header of sectionHeaders) {
            if (header.textContent.includes('Limit Orders')) {
                const section = header.closest('.ladder-section');
                if (section) {
                    this.targetPanel = section.querySelector('.section-content');
                    if (this.targetPanel) {
                        console.log('✅ Found Limit Orders panel via section header text');
                        return;
                    }
                }
            }
        }
        
        console.log('❌ Could not find Limit Orders panel');
    }

    replaceWithRebalancingSystem() {
        if (!this.targetPanel) return;

        console.log('🔄 Replacing Limit Orders content with Enhanced Rebalancing System...');

        // Store original content for potential restoration
        this.originalContent = this.targetPanel.innerHTML;

        // Completely replace the content with rebalancing system
        const rebalancingHTML = `
            <div class="rebalancing-container">
                <!-- Header with title and controls -->
                <div class="rebalancing-header">
                    <div class="rebalancing-title">
                        <i class="fas fa-balance-scale"></i>
                        <span>REBALANCING SYSTEM</span>
                        <span class="system-status" id="system-status">🟢 Active</span>
                    </div>
                    <div class="rebalancing-controls">
                        <button class="rebalancing-btn settings-btn" id="show-settings" title="Settings">
                            <i class="fas fa-cog"></i>
                        </button>
                        <button class="rebalancing-btn refresh-btn" id="refresh-prices" title="Refresh">
                            <i class="fas fa-sync"></i>
                        </button>
                        <button class="rebalancing-btn restore-btn" id="restore-original" title="Restore">
                            <i class="fas fa-undo"></i>
                        </button>
                    </div>
                </div>

                <!-- Settings Panel -->
                <div class="settings-panel" id="settings-panel">
                    <div class="settings-row">
                        <label>Profit Threshold:</label>
                        <select id="profit-threshold">
                            <option value="1.5">1.5%</option>
                            <option value="5" selected>5%</option>
                            <option value="10">10%</option>
                            <option value="20">20%</option>
                        </select>
                    </div>
                    <div class="settings-row">
                        <label>Exchange:</label>
                        <select id="exchange-select">
                            <option value="kucoin" selected>KuCoin</option>
                            <option value="binance">Binance</option>
                            <option value="both">Both</option>
                        </select>
                    </div>
                    <div class="settings-row">
                        <label>AMPL Threshold:</label>
                        <span class="threshold-value">$1.16</span>
                        <span class="current-ampl-price" id="current-ampl-price">Current: $1.189</span>
                    </div>
                </div>

                <!-- Overall Stats -->
                <div class="overall-stats">
                    <div class="stat-item" title="Total amount invested across all coins">
                        <span class="stat-label">Total Invested</span>
                        <span class="stat-value" id="total-invested">$0.00</span>
                    </div>
                    <div class="stat-item" title="Current total value of all holdings">
                        <span class="stat-label">Current Value</span>
                        <span class="stat-value" id="total-current-value">$0.00</span>
                    </div>
                    <div class="stat-item" title="Total profit/loss across all positions">
                        <span class="stat-label">Total Profit</span>
                        <span class="stat-value profit" id="total-profit">$0.00</span>
                    </div>
                    <div class="stat-item" title="Total profit percentage">
                        <span class="stat-label">Profit %</span>
                        <span class="stat-value profit-percent" id="total-profit-percent">0.00%</span>
                    </div>
                </div>

                <!-- Coins Grid -->
                <div class="coins-grid">
                    <div class="coin-card" data-coin="SOL" title="Solana (SOL) position details">
                        <div class="coin-header">
                            <div class="coin-symbol">
                                <i class="coin-icon">☀️</i>
                                <span>SOL</span>
                            </div>
                            <div class="coin-status" id="sol-status">💤</div>
                        </div>
                        <div class="coin-stats">
                            <div class="stat-row">
                                <span>Quantity:</span>
                                <span id="sol-quantity">0.000</span>
                            </div>
                            <div class="stat-row">
                                <span>Purchase:</span>
                                <span id="sol-purchase-price">$0.00</span>
                            </div>
                            <div class="stat-row">
                                <span>Current:</span>
                                <span id="sol-current-price">$0.00</span>
                            </div>
                            <div class="stat-row">
                                <span>Value:</span>
                                <span id="sol-total-value">$0.00</span>
                            </div>
                            <div class="stat-row profit-row">
                                <span>Profit:</span>
                                <span id="sol-profit" class="profit-value">$0.00 (0.00%)</span>
                            </div>
                        </div>
                    </div>

                    <div class="coin-card" data-coin="SUI" title="Sui (SUI) position details">
                        <div class="coin-header">
                            <div class="coin-symbol">
                                <i class="coin-icon">🌊</i>
                                <span>SUI</span>
                            </div>
                            <div class="coin-status" id="sui-status">💤</div>
                        </div>
                        <div class="coin-stats">
                            <div class="stat-row">
                                <span>Quantity:</span>
                                <span id="sui-quantity">0.000</span>
                            </div>
                            <div class="stat-row">
                                <span>Purchase:</span>
                                <span id="sui-purchase-price">$0.00</span>
                            </div>
                            <div class="stat-row">
                                <span>Current:</span>
                                <span id="sui-current-price">$0.00</span>
                            </div>
                            <div class="stat-row">
                                <span>Value:</span>
                                <span id="sui-total-value">$0.00</span>
                            </div>
                            <div class="stat-row profit-row">
                                <span>Profit:</span>
                                <span id="sui-profit" class="profit-value">$0.00 (0.00%)</span>
                            </div>
                        </div>
                    </div>

                    <div class="coin-card" data-coin="BTC" title="Bitcoin (BTC) position details">
                        <div class="coin-header">
                            <div class="coin-symbol">
                                <i class="coin-icon">₿</i>
                                <span>BTC</span>
                            </div>
                            <div class="coin-status" id="btc-status">💤</div>
                        </div>
                        <div class="coin-stats">
                            <div class="stat-row">
                                <span>Quantity:</span>
                                <span id="btc-quantity">0.000000</span>
                            </div>
                            <div class="stat-row">
                                <span>Purchase:</span>
                                <span id="btc-purchase-price">$0.00</span>
                            </div>
                            <div class="stat-row">
                                <span>Current:</span>
                                <span id="btc-current-price">$0.00</span>
                            </div>
                            <div class="stat-row">
                                <span>Value:</span>
                                <span id="btc-total-value">$0.00</span>
                            </div>
                            <div class="stat-row profit-row">
                                <span>Profit:</span>
                                <span id="btc-profit" class="profit-value">$0.00 (0.00%)</span>
                            </div>
                        </div>
                    </div>

                    <div class="coin-card" data-coin="AMPL" title="Ampleforth (AMPL) position details">
                        <div class="coin-header">
                            <div class="coin-symbol">
                                <i class="coin-icon">🎯</i>
                                <span>AMPL</span>
                            </div>
                            <div class="coin-status" id="ampl-status">💤</div>
                        </div>
                        <div class="coin-stats">
                            <div class="stat-row">
                                <span>Quantity:</span>
                                <span id="ampl-quantity">0.000</span>
                            </div>
                            <div class="stat-row">
                                <span>Purchase:</span>
                                <span id="ampl-purchase-price">$0.00</span>
                            </div>
                            <div class="stat-row">
                                <span>Current:</span>
                                <span id="ampl-current-price">$0.00</span>
                            </div>
                            <div class="stat-row">
                                <span>Value:</span>
                                <span id="ampl-total-value">$0.00</span>
                            </div>
                            <div class="stat-row profit-row">
                                <span>Profit:</span>
                                <span id="ampl-profit" class="profit-value">$0.00 (0.00%)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Action Log -->
                <div class="action-log">
                    <div class="log-header">
                        <span>Recent Actions</span>
                        <button class="clear-log-btn" id="clear-log">Clear</button>
                    </div>
                    <div class="log-messages" id="log-messages">
                        <div class="log-message">
                            <span class="log-time">Ready</span>
                            <span class="log-text">Rebalancing system initialized</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Replace the entire content
        this.targetPanel.innerHTML = rebalancingHTML;
        console.log('✅ Limit Orders panel content replaced with Enhanced Rebalancing System');
    }

    applyStyles() {
        const style = document.createElement('style');
        style.id = 'ampl-rebalancing-enhanced-styles';
        style.textContent = `
            /* Rebalancing System Styles - Enhanced with Hover Effects */
            .rebalancing-container {
                width: 100%;
                height: 100%;
                max-height: 100%;
                display: flex;
                flex-direction: column;
                background: var(--panel-bw, #000000);
                color: var(--text-primary, #ffffff);
                border-radius: var(--border-radius, 6px);
                overflow: hidden;
                padding: 8px;
                gap: 6px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                box-sizing: border-box;
                position: relative;
                transition: all 0.3s ease;
            }

            /* HOVER ENHANCEMENT: Container scales slightly on hover */
            .rebalancing-container:hover {
                transform: scale(1.02);
                z-index: 1000;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
                border: 2px solid rgba(76, 175, 80, 0.3);
            }

            .rebalancing-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 6px 8px;
                background: rgba(255, 255, 255, 0.06);
                border-radius: 4px;
                flex-shrink: 0;
                border: 1px solid rgba(255, 255, 255, 0.12);
                box-sizing: border-box;
                transition: all 0.3s ease;
            }

            /* HOVER ENHANCEMENT: Header becomes more prominent */
            .rebalancing-container:hover .rebalancing-header {
                background: rgba(76, 175, 80, 0.15);
                border-color: rgba(76, 175, 80, 0.4);
            }

            .rebalancing-title {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 11px;
                font-weight: 600;
                color: var(--text-primary, #ffffff);
                letter-spacing: 0.3px;
                transition: all 0.3s ease;
            }

            /* HOVER ENHANCEMENT: Title text becomes larger and more readable */
            .rebalancing-container:hover .rebalancing-title {
                font-size: 14px;
                font-weight: 700;
                text-shadow: 0 0 8px rgba(76, 175, 80, 0.5);
            }

            .rebalancing-title i {
                color: #4CAF50;
                font-size: 12px;
                transition: all 0.3s ease;
            }

            .rebalancing-container:hover .rebalancing-title i {
                font-size: 16px;
                text-shadow: 0 0 12px rgba(76, 175, 80, 0.8);
            }

            .system-status {
                font-size: 9px;
                padding: 2px 6px;
                border-radius: 3px;
                background: rgba(76, 175, 80, 0.2);
                color: #4CAF50;
                border: 1px solid rgba(76, 175, 80, 0.3);
                font-weight: 500;
                transition: all 0.3s ease;
            }

            .rebalancing-container:hover .system-status {
                font-size: 11px;
                padding: 4px 8px;
                background: rgba(76, 175, 80, 0.3);
                border-color: rgba(76, 175, 80, 0.6);
                text-shadow: 0 0 6px rgba(76, 175, 80, 0.8);
            }

            .rebalancing-controls {
                display: flex;
                gap: 4px;
            }

            .rebalancing-btn {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: var(--text-primary, #ffffff);
                padding: 4px 6px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 9px;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 3px;
                font-weight: 500;
                box-sizing: border-box;
            }

            .rebalancing-btn:hover,
            .rebalancing-container:hover .rebalancing-btn {
                background: rgba(255, 255, 255, 0.2);
                border-color: rgba(255, 255, 255, 0.4);
                font-size: 11px;
                padding: 6px 8px;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            }

            .rebalancing-btn i {
                font-size: 10px;
                transition: all 0.3s ease;
            }

            .rebalancing-container:hover .rebalancing-btn i {
                font-size: 12px;
            }

            /* Settings Panel */
            .settings-panel {
                background: rgba(255, 255, 255, 0.04);
                border-radius: 4px;
                padding: 6px;
                display: none;
                flex-shrink: 0;
                border: 1px solid rgba(255, 255, 255, 0.08);
                box-sizing: border-box;
                transition: all 0.3s ease;
            }

            .settings-panel.visible {
                display: block;
            }

            .rebalancing-container:hover .settings-panel.visible {
                background: rgba(255, 255, 255, 0.08);
                border-color: rgba(255, 255, 255, 0.2);
                padding: 10px;
            }

            .settings-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 4px;
                font-size: 10px;
                transition: all 0.3s ease;
            }

            .rebalancing-container:hover .settings-row {
                font-size: 12px;
                margin-bottom: 6px;
            }

            .settings-row:last-child {
                margin-bottom: 0;
            }

            .settings-row label {
                color: var(--text-secondary, #b0b0b0);
                font-weight: 500;
            }

            .settings-row select {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: var(--text-primary, #ffffff);
                padding: 2px 4px;
                border-radius: 3px;
                font-size: 9px;
                min-width: 60px;
                font-weight: 500;
                box-sizing: border-box;
                transition: all 0.3s ease;
            }

            .rebalancing-container:hover .settings-row select {
                font-size: 11px;
                padding: 4px 6px;
                min-width: 80px;
            }

            .threshold-value {
                color: #FFC107;
                font-weight: 600;
                font-size: 10px;
                transition: all 0.3s ease;
            }

            .rebalancing-container:hover .threshold-value {
                font-size: 12px;
                text-shadow: 0 0 6px rgba(255, 193, 7, 0.6);
            }

            .current-ampl-price {
                color: var(--text-secondary, #b0b0b0);
                font-size: 9px;
                font-weight: 500;
                transition: all 0.3s ease;
            }

            .rebalancing-container:hover .current-ampl-price {
                font-size: 11px;
            }

            /* Overall Stats */
            .overall-stats {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 4px;
                flex-shrink: 0;
            }

            .stat-item {
                background: rgba(255, 255, 255, 0.04);
                border-radius: 4px;
                padding: 4px;
                text-align: center;
                border: 1px solid rgba(255, 255, 255, 0.1);
                transition: all 0.3s ease;
                box-sizing: border-box;
                cursor: help;
            }

            .stat-item:hover,
            .rebalancing-container:hover .stat-item {
                background: rgba(255, 255, 255, 0.08);
                border-color: rgba(255, 255, 255, 0.25);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                padding: 6px;
            }

            .stat-label {
                display: block;
                font-size: 8px;
                color: var(--text-secondary, #b0b0b0);
                margin-bottom: 2px;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.3px;
                transition: all 0.3s ease;
            }

            .rebalancing-container:hover .stat-label {
                font-size: 10px;
                margin-bottom: 4px;
            }

            .stat-value {
                display: block;
                font-size: 10px;
                font-weight: 600;
                color: var(--text-primary, #ffffff);
                transition: all 0.3s ease;
            }

            .rebalancing-container:hover .stat-value {
                font-size: 13px;
                font-weight: 700;
            }

            .stat-value.profit {
                color: #4CAF50;
            }

            .rebalancing-container:hover .stat-value.profit {
                text-shadow: 0 0 8px rgba(76, 175, 80, 0.6);
            }

            .stat-value.loss {
                color: #F44336;
            }

            .rebalancing-container:hover .stat-value.loss {
                text-shadow: 0 0 8px rgba(244, 67, 54, 0.6);
            }

            /* Coins Grid */
            .coins-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 4px;
                flex: 1;
                min-height: 0;
                overflow: hidden;
            }

            .coin-card {
                background: rgba(255, 255, 255, 0.04);
                border-radius: 4px;
                padding: 6px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                transition: all 0.3s ease;
                display: flex;
                flex-direction: column;
                gap: 4px;
                box-sizing: border-box;
                overflow: hidden;
                cursor: help;
            }

            .coin-card:hover,
            .rebalancing-container:hover .coin-card {
                border-color: rgba(255, 255, 255, 0.25);
                background: rgba(255, 255, 255, 0.08);
                transform: translateY(-3px);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
                padding: 8px;
                gap: 6px;
            }

            .coin-card.profitable {
                border-color: rgba(76, 175, 80, 0.4);
                background: rgba(76, 175, 80, 0.06);
            }

            .coin-card.profitable:hover,
            .rebalancing-container:hover .coin-card.profitable {
                border-color: rgba(76, 175, 80, 0.8);
                background: rgba(76, 175, 80, 0.15);
                box-shadow: 0 6px 20px rgba(76, 175, 80, 0.3);
            }

            .coin-card.loss {
                border-color: rgba(244, 67, 54, 0.4);
                background: rgba(244, 67, 54, 0.06);
            }

            .coin-card.loss:hover,
            .rebalancing-container:hover .coin-card.loss {
                border-color: rgba(244, 67, 54, 0.8);
                background: rgba(244, 67, 54, 0.15);
                box-shadow: 0 6px 20px rgba(244, 67, 54, 0.3);
            }

            .coin-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-shrink: 0;
            }

            .coin-symbol {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 11px;
                font-weight: 600;
                color: var(--text-primary, #ffffff);
                transition: all 0.3s ease;
            }

            .rebalancing-container:hover .coin-symbol {
                font-size: 14px;
                font-weight: 700;
                gap: 6px;
            }

            .coin-icon {
                font-size: 12px;
                transition: all 0.3s ease;
            }

            .rebalancing-container:hover .coin-icon {
                font-size: 16px;
            }

            .coin-status {
                font-size: 11px;
                transition: all 0.3s ease;
            }

            .rebalancing-container:hover .coin-status {
                font-size: 14px;
            }

            .coin-stats {
                display: flex;
                flex-direction: column;
                gap: 2px;
                flex: 1;
                min-height: 0;
            }

            .rebalancing-container:hover .coin-stats {
                gap: 4px;
            }

            .stat-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 9px;
                transition: all 0.3s ease;
            }

            .rebalancing-container:hover .stat-row {
                font-size: 11px;
            }

            .stat-row span:first-child {
                color: var(--text-secondary, #b0b0b0);
                font-weight: 500;
            }

            .stat-row span:last-child {
                color: var(--text-primary, #ffffff);
                font-weight: 600;
            }

            .rebalancing-container:hover .stat-row span:last-child {
                font-weight: 700;
            }

            .profit-row .profit-value.positive {
                color: #4CAF50;
            }

            .rebalancing-container:hover .profit-row .profit-value.positive {
                text-shadow: 0 0 6px rgba(76, 175, 80, 0.6);
            }

            .profit-row .profit-value.negative {
                color: #F44336;
            }

            .rebalancing-container:hover .profit-row .profit-value.negative {
                text-shadow: 0 0 6px rgba(244, 67, 54, 0.6);
            }

            /* Action Log */
            .action-log {
                background: rgba(255, 255, 255, 0.04);
                border-radius: 4px;
                padding: 4px;
                flex-shrink: 0;
                max-height: 60px;
                overflow: hidden;
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-sizing: border-box;
                transition: all 0.3s ease;
            }

            .rebalancing-container:hover .action-log {
                background: rgba(255, 255, 255, 0.08);
                border-color: rgba(255, 255, 255, 0.2);
                padding: 6px;
                max-height: 80px;
            }

            .log-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 3px;
                font-size: 9px;
                color: var(--text-secondary, #b0b0b0);
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.3px;
                transition: all 0.3s ease;
            }

            .rebalancing-container:hover .log-header {
                font-size: 11px;
                margin-bottom: 5px;
            }

            .clear-log-btn {
                background: none;
                border: none;
                color: var(--text-secondary, #b0b0b0);
                cursor: pointer;
                font-size: 8px;
                padding: 2px 4px;
                border-radius: 2px;
                transition: all 0.3s ease;
                font-weight: 500;
            }

            .clear-log-btn:hover,
            .rebalancing-container:hover .clear-log-btn {
                background: rgba(255, 255, 255, 0.15);
                color: var(--text-primary, #ffffff);
                font-size: 10px;
                padding: 4px 6px;
            }

            .log-messages {
                max-height: 40px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 2px;
                transition: all 0.3s ease;
            }

            .rebalancing-container:hover .log-messages {
                max-height: 60px;
                gap: 3px;
            }

            .log-messages::-webkit-scrollbar {
                width: 3px;
            }

            .log-messages::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 2px;
            }

            .log-messages::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.15);
                border-radius: 2px;
            }

            .log-message {
                display: flex;
                gap: 4px;
                font-size: 8px;
                padding: 2px 3px;
                border-radius: 2px;
                background: rgba(255, 255, 255, 0.02);
                border: 1px solid rgba(255, 255, 255, 0.05);
                box-sizing: border-box;
                transition: all 0.3s ease;
            }

            .rebalancing-container:hover .log-message {
                font-size: 10px;
                padding: 3px 5px;
                gap: 6px;
            }

            .log-time {
                color: var(--text-muted, #808080);
                flex-shrink: 0;
                min-width: 35px;
                font-weight: 500;
                transition: all 0.3s ease;
            }

            .rebalancing-container:hover .log-time {
                min-width: 50px;
            }

            .log-text {
                color: var(--text-primary, #ffffff);
                flex: 1;
                font-weight: 500;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            /* Tooltip Enhancement */
            [title]:hover::after {
                content: attr(title);
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                white-space: nowrap;
                z-index: 1001;
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            }
        `;
        
        // Remove any existing styles first
        const existingStyles = document.querySelectorAll('#ampl-rebalancing-enhanced-styles, #ampl-rebalancing-positioned-styles, #ampl-rebalancing-fixed-styles, #ampl-rebalancing-direct-styles');
        existingStyles.forEach(style => style.remove());
        
        document.head.appendChild(style);
    }

    bindEventListeners() {
        console.log('🔗 Binding enhanced rebalancing system event listeners...');
        
        // Use event delegation on the target panel
        this.targetPanel.addEventListener('click', (event) => {
            const target = event.target.closest('button');
            if (!target) return;
            
            const buttonId = target.id;
            console.log(`🔘 Rebalancing button clicked: ${buttonId}`);
            
            switch (buttonId) {
                case 'show-settings':
                    this.toggleSettings();
                    break;
                case 'refresh-prices':
                    this.updatePrices();
                    this.logAction('Prices refreshed manually');
                    break;
                case 'clear-log':
                    this.clearActionLog();
                    break;
                case 'restore-original':
                    this.restoreOriginal();
                    break;
            }
        });

        // Settings change listeners
        this.targetPanel.addEventListener('change', (event) => {
            const target = event.target;
            
            switch (target.id) {
                case 'profit-threshold':
                    this.settings.profitThreshold = parseFloat(target.value);
                    this.logAction(`Profit threshold set to ${target.value}%`);
                    break;
                case 'exchange-select':
                    this.settings.selectedExchange = target.value;
                    this.logAction(`Exchange set to ${target.value}`);
                    break;
            }
        });
        
        console.log('✅ Enhanced rebalancing event listeners bound');
    }

    toggleSettings() {
        const settingsPanel = document.getElementById('settings-panel');
        if (settingsPanel) {
            settingsPanel.classList.toggle('visible');
            const isVisible = settingsPanel.classList.contains('visible');
            this.logAction(isVisible ? 'Settings panel opened' : 'Settings panel closed');
        }
    }

    restoreOriginal() {
        if (this.targetPanel && this.originalContent) {
            this.targetPanel.innerHTML = this.originalContent;
            this.logAction('Restored original Limit Orders panel');
            console.log('✅ Restored original Limit Orders panel');
        }
    }

    startPriceMonitoring() {
        console.log('🔍 Starting price monitoring...');
        
        // Clear any existing interval
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        // Immediate check
        this.updatePrices();
        
        // Regular monitoring every 10 seconds
        this.monitoringInterval = setInterval(() => {
            this.updatePrices();
        }, 10000);
        
        console.log('✅ Price monitoring started (10-second intervals)');
    }

    async updatePrices() {
        try {
            // Simulate realistic price updates (replace with real API calls)
            this.coins.SOL.currentPrice = 180 + (Math.random() - 0.5) * 20;
            this.coins.SUI.currentPrice = 3.5 + (Math.random() - 0.5) * 0.5;
            this.coins.BTC.currentPrice = 95000 + (Math.random() - 0.5) * 5000;
            this.coins.AMPL.currentPrice = 1.189 + (Math.random() - 0.5) * 0.1;
            
            // Update current AMPL price display
            const amplPriceEl = document.getElementById('current-ampl-price');
            if (amplPriceEl) {
                amplPriceEl.textContent = `Current: $${this.coins.AMPL.currentPrice.toFixed(3)}`;
            }
            
            this.calculateProfits();
            this.updateDisplay();
            
        } catch (error) {
            console.log('📊 Error updating prices:', error.message);
        }
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
            }
        });
        
        this.settings.totalInvested = totalInvested;
        this.settings.totalCurrentValue = totalCurrentValue;
        this.settings.totalProfit = totalCurrentValue - totalInvested;
        this.settings.totalProfitPercent = totalInvested > 0 ? (this.settings.totalProfit / totalInvested) * 100 : 0;
    }

    updateDisplay() {
        // Update overall stats
        const totalInvestedEl = document.getElementById('total-invested');
        const totalCurrentValueEl = document.getElementById('total-current-value');
        const totalProfitEl = document.getElementById('total-profit');
        const totalProfitPercentEl = document.getElementById('total-profit-percent');
        
        if (totalInvestedEl) totalInvestedEl.textContent = `$${this.settings.totalInvested.toFixed(2)}`;
        if (totalCurrentValueEl) totalCurrentValueEl.textContent = `$${this.settings.totalCurrentValue.toFixed(2)}`;
        if (totalProfitEl) totalProfitEl.textContent = `$${this.settings.totalProfit.toFixed(2)}`;
        if (totalProfitPercentEl) totalProfitPercentEl.textContent = `${this.settings.totalProfitPercent.toFixed(2)}%`;
        
        // Update profit colors
        if (totalProfitEl && totalProfitPercentEl) {
            if (this.settings.totalProfit >= 0) {
                totalProfitEl.className = 'stat-value profit';
                totalProfitPercentEl.className = 'stat-value profit';
            } else {
                totalProfitEl.className = 'stat-value loss';
                totalProfitPercentEl.className = 'stat-value loss';
            }
        }
        
        // Update individual coins
        Object.keys(this.coins).forEach(coinKey => {
            const coin = this.coins[coinKey];
            const coinLower = coinKey.toLowerCase();
            
            const quantityEl = document.getElementById(`${coinLower}-quantity`);
            const purchasePriceEl = document.getElementById(`${coinLower}-purchase-price`);
            const currentPriceEl = document.getElementById(`${coinLower}-current-price`);
            const totalValueEl = document.getElementById(`${coinLower}-total-value`);
            const profitEl = document.getElementById(`${coinLower}-profit`);
            const statusEl = document.getElementById(`${coinLower}-status`);
            
            if (quantityEl) quantityEl.textContent = coin.quantity.toFixed(coinKey === 'BTC' ? 6 : 3);
            if (purchasePriceEl) purchasePriceEl.textContent = `$${coin.purchasePrice.toFixed(2)}`;
            if (currentPriceEl) currentPriceEl.textContent = `$${coin.currentPrice.toFixed(2)}`;
            if (totalValueEl) totalValueEl.textContent = `$${coin.totalValue.toFixed(2)}`;
            
            if (profitEl) {
                const profitText = `$${coin.profit.toFixed(2)} (${coin.profitPercent.toFixed(2)}%)`;
                profitEl.textContent = profitText;
                
                if (coin.profit >= 0) {
                    profitEl.className = 'profit-value positive';
                } else {
                    profitEl.className = 'profit-value negative';
                }
            }
            
            // Update coin card styling
            const coinCard = document.querySelector(`[data-coin="${coinKey}"]`);
            if (coinCard) {
                coinCard.className = 'coin-card';
                if (coin.profit > 0) {
                    coinCard.classList.add('profitable');
                } else if (coin.profit < 0) {
                    coinCard.classList.add('loss');
                }
            }
            
            // Update status
            if (statusEl) {
                if (coin.quantity > 0) {
                    if (coin.profitPercent >= this.settings.profitThreshold) {
                        statusEl.textContent = '🎯'; // Ready to sell
                    } else if (coin.profit > 0) {
                        statusEl.textContent = '📈'; // Profitable
                    } else {
                        statusEl.textContent = '📊'; // Holding
                    }
                } else {
                    statusEl.textContent = '💤'; // No position
                }
            }
        });
    }

    loadSampleData() {
        // Load sample data for demonstration
        this.coins.SOL.quantity = 0.5;
        this.coins.SOL.purchasePrice = 175.00;
        
        this.coins.SUI.quantity = 25.0;
        this.coins.SUI.purchasePrice = 3.20;
        
        this.coins.BTC.quantity = 0.001;
        this.coins.BTC.purchasePrice = 92000;
        
        this.coins.AMPL.quantity = 100.0;
        this.coins.AMPL.purchasePrice = 1.15;
        
        this.logAction('Sample data loaded for demonstration');
        this.calculateProfits();
        this.updateDisplay();
    }

    logAction(message) {
        const logMessages = document.getElementById('log-messages');
        if (!logMessages) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = 'log-message';
        logEntry.innerHTML = `
            <span class="log-time">${timestamp}</span>
            <span class="log-text">${message}</span>
        `;
        
        logMessages.insertBefore(logEntry, logMessages.firstChild);
        
        // Keep only last 10 messages
        while (logMessages.children.length > 10) {
            logMessages.removeChild(logMessages.lastChild);
        }
    }

    clearActionLog() {
        const logMessages = document.getElementById('log-messages');
        if (logMessages) {
            logMessages.innerHTML = `
                <div class="log-message">
                    <span class="log-time">Ready</span>
                    <span class="log-text">Action log cleared</span>
                </div>
            `;
        }
        this.logAction('Action log cleared');
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

// Initialize the rebalancing system
const amplRebalancingSystemEnhanced = new AMPLRebalancingSystemEnhanced();

// Global functions for external use
function updateRebalancingCoin(coinSymbol, quantity, purchasePrice) {
    if (amplRebalancingSystemEnhanced) {
        amplRebalancingSystemEnhanced.updateCoinData(coinSymbol, quantity, purchasePrice);
    }
}

function getRebalancingStatus() {
    if (amplRebalancingSystemEnhanced) {
        return {
            shouldBuy: amplRebalancingSystemEnhanced.shouldBuy(),
            coinsReadyToSell: amplRebalancingSystemEnhanced.getCoinsReadyToSell(),
            currentAMPLPrice: amplRebalancingSystemEnhanced.getCurrentAMPLPrice(),
            totalProfit: amplRebalancingSystemEnhanced.settings.totalProfit
        };
    }
    return null;
}

console.log('🎬 AMPL Rebalancing System (Enhanced with Hover Effects) loaded successfully');

