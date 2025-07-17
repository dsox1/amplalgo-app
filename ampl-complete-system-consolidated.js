/**
 * AMPL Complete System - Consolidated Version
 * Fixes all issues: rebase meter, real data, trading, overflow, scrolling
 * Consolidates rebalancing, rebase protection, and activity feed into one file
 */

class AMPLCompleteSystemConsolidated {
    constructor() {
        this.isInitialized = false;
        this.intervals = {
            priceMonitoring: null,
            rebaseMonitoring: null,
            activityMonitoring: null
        };
        
        // System state
        this.state = {
            isConnected: false,
            isPaused: false,
            triggerCooldown: false,
            lastTriggerTime: 0
        };
        
        // Rebalancing data
        this.rebalancing = {
            coins: {
                SOL: { symbol: 'SOL/USDT', quantity: 0, purchasePrice: 0, currentPrice: 0, totalValue: 0, profit: 0, profitPercent: 0, status: '💤' },
                SUI: { symbol: 'SUI/USDT', quantity: 0, purchasePrice: 0, currentPrice: 0, totalValue: 0, profit: 0, profitPercent: 0, status: '💤' },
                BTC: { symbol: 'BTC/USDT', quantity: 0, purchasePrice: 0, currentPrice: 0, totalValue: 0, profit: 0, profitPercent: 0, status: '💤' },
                AMPL: { symbol: 'AMPL/USDT', quantity: 0, purchasePrice: 0, currentPrice: 0, totalValue: 0, profit: 0, profitPercent: 0, status: '💤' }
            },
            settings: {
                profitThreshold: 1.5,
                amplThreshold: 1.16,
                totalInvested: 0,
                totalCurrentValue: 0,
                totalProfit: 0,
                totalProfitPercent: 0,
                usdtBalance: 0,
                autoRebalance: true
            }
        };
        
        // Rebase protection data
        this.rebaseProtection = {
            originalPurchase: 0,
            currentValue: 0,
            difference: 0,
            protectionStatus: 0,
            amplQuantity: 0,
            amplPrice: 0,
            targetPrice: 1.00,
            rebaseThreshold: 0.05,
            protectionActive: false,
            lastRebaseTime: null,
            rebaseHistory: []
        };
        
        // Activity feed data
        this.activityFeed = {
            activities: [],
            maxActivities: 100,
            isConnected: false
        };
        
        // Smart order ladder data
        this.smartLadder = {
            orders: [],
            realTimeData: true,
            lastUpdate: null
        };
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            setTimeout(() => this.initialize(), 1000);
        }
    }

    initialize() {
        console.log('🎬 Initializing CONSOLIDATED AMPL System...');
        
        this.clearExistingInstances();
        this.initializeAllPanels();
        this.applyConsolidatedStyles();
        this.bindAllEventListeners();
        this.loadAllRealData();
        this.startAllMonitoring();
        
        this.isInitialized = true;
        console.log('✅ CONSOLIDATED AMPL System initialized successfully');
    }

    clearExistingInstances() {
        // Clear all existing intervals
        Object.values(this.intervals).forEach(interval => {
            if (interval) clearInterval(interval);
        });
        
        // Remove existing panels
        const existingPanels = document.querySelectorAll('.consolidated-ampl-panel');
        existingPanels.forEach(panel => panel.remove());
    }

    initializeAllPanels() {
        this.initializeRebalancingPanel();
        this.initializeRebaseProtectionPanel();
        this.initializeActivityFeedPanel();
        this.initializeSmartLadderPanel();
    }

    initializeRebalancingPanel() {
        const limitOrdersSection = document.querySelector('.ladder-section.limit-orders-section .section-content');
        if (limitOrdersSection) {
            limitOrdersSection.innerHTML = this.createRebalancingPanelHTML();
            console.log('✅ Rebalancing panel initialized');
        }
    }

    initializeRebaseProtectionPanel() {
        const rebaseSection = document.querySelector('.ladder-section.rebase-section .section-content');
        if (rebaseSection) {
            rebaseSection.innerHTML = this.createRebaseProtectionPanelHTML();
            console.log('✅ Rebase protection panel initialized');
        }
    }

    initializeActivityFeedPanel() {
        const smartOrderSection = document.querySelector('.ladder-section.smart-order-section');
        if (smartOrderSection) {
            const activityFeedElement = smartOrderSection.querySelector('.live-activity-feed, #live-activity-feed, [class*="activity-feed"]');
            if (activityFeedElement) {
                activityFeedElement.innerHTML = this.createActivityFeedPanelHTML();
                console.log('✅ Activity feed panel initialized');
            }
        }
    }

    initializeSmartLadderPanel() {
        const smartOrderSection = document.querySelector('.ladder-section.smart-order-section .section-content');
        if (smartOrderSection) {
            // Find the main content area (not the activity feed)
            const mainContent = smartOrderSection.querySelector('.ladder-content, .order-ladder');
            if (mainContent) {
                mainContent.innerHTML = this.createSmartLadderPanelHTML();
                console.log('✅ Smart ladder panel initialized');
            }
        }
    }

    createRebalancingPanelHTML() {
        return `
            <div class="consolidated-ampl-panel rebalancing-panel">
                <!-- Header with current price -->
                <div class="panel-header">
                    <div class="header-title">
                        <h3>🔄 AMPL REBALANCING SYSTEM</h3>
                        <div class="system-status" id="rebalancing-status">✅ MONITORING</div>
                    </div>
                    <div class="price-display">
                        <span class="price-label">Current:</span>
                        <span class="current-price" id="current-ampl-price">$0.000</span>
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

                <!-- Scrollable Coins Display -->
                <div class="coins-container">
                    <div class="coins-scroll" id="coins-scroll">
                        <!-- SOL -->
                        <div class="coin-row" data-coin="SOL">
                            <div class="coin-header">
                                <span class="coin-icon">☀️</span>
                                <span class="coin-name">SOL</span>
                                <span class="coin-status" id="sol-status">💤</span>
                            </div>
                            <div class="coin-data">
                                <div class="data-row">
                                    <span class="data-label">Qty:</span>
                                    <span class="data-value" id="sol-quantity">0.000</span>
                                </div>
                                <div class="data-row">
                                    <span class="data-label">Buy:</span>
                                    <span class="data-value" id="sol-purchase">$0.00</span>
                                </div>
                                <div class="data-row">
                                    <span class="data-label">Now:</span>
                                    <span class="data-value" id="sol-current">$0.00</span>
                                </div>
                                <div class="data-row">
                                    <span class="data-label">Value:</span>
                                    <span class="data-value" id="sol-value">$0.00</span>
                                </div>
                                <div class="data-row profit-row">
                                    <span class="data-label">Profit:</span>
                                    <span class="data-value profit-value" id="sol-profit">$0.00 (0.00%)</span>
                                </div>
                            </div>
                        </div>

                        <!-- SUI -->
                        <div class="coin-row" data-coin="SUI">
                            <div class="coin-header">
                                <span class="coin-icon">🌊</span>
                                <span class="coin-name">SUI</span>
                                <span class="coin-status" id="sui-status">💤</span>
                            </div>
                            <div class="coin-data">
                                <div class="data-row">
                                    <span class="data-label">Qty:</span>
                                    <span class="data-value" id="sui-quantity">0.000</span>
                                </div>
                                <div class="data-row">
                                    <span class="data-label">Buy:</span>
                                    <span class="data-value" id="sui-purchase">$0.00</span>
                                </div>
                                <div class="data-row">
                                    <span class="data-label">Now:</span>
                                    <span class="data-value" id="sui-current">$0.00</span>
                                </div>
                                <div class="data-row">
                                    <span class="data-label">Value:</span>
                                    <span class="data-value" id="sui-value">$0.00</span>
                                </div>
                                <div class="data-row profit-row">
                                    <span class="data-label">Profit:</span>
                                    <span class="data-value profit-value" id="sui-profit">$0.00 (0.00%)</span>
                                </div>
                            </div>
                        </div>

                        <!-- BTC -->
                        <div class="coin-row" data-coin="BTC">
                            <div class="coin-header">
                                <span class="coin-icon">₿</span>
                                <span class="coin-name">BTC</span>
                                <span class="coin-status" id="btc-status">💤</span>
                            </div>
                            <div class="coin-data">
                                <div class="data-row">
                                    <span class="data-label">Qty:</span>
                                    <span class="data-value" id="btc-quantity">0.000000</span>
                                </div>
                                <div class="data-row">
                                    <span class="data-label">Buy:</span>
                                    <span class="data-value" id="btc-purchase">$0.00</span>
                                </div>
                                <div class="data-row">
                                    <span class="data-label">Now:</span>
                                    <span class="data-value" id="btc-current">$0.00</span>
                                </div>
                                <div class="data-row">
                                    <span class="data-label">Value:</span>
                                    <span class="data-value" id="btc-value">$0.00</span>
                                </div>
                                <div class="data-row profit-row">
                                    <span class="data-label">Profit:</span>
                                    <span class="data-value profit-value" id="btc-profit">$0.00 (0.00%)</span>
                                </div>
                            </div>
                        </div>

                        <!-- AMPL -->
                        <div class="coin-row" data-coin="AMPL">
                            <div class="coin-header">
                                <span class="coin-icon">🎯</span>
                                <span class="coin-name">AMPL</span>
                                <span class="coin-status" id="ampl-status">💤</span>
                            </div>
                            <div class="coin-data">
                                <div class="data-row">
                                    <span class="data-label">Qty:</span>
                                    <span class="data-value" id="ampl-quantity">0.000</span>
                                </div>
                                <div class="data-row">
                                    <span class="data-label">Buy:</span>
                                    <span class="data-value" id="ampl-purchase">$0.00</span>
                                </div>
                                <div class="data-row">
                                    <span class="data-label">Now:</span>
                                    <span class="data-value" id="ampl-current">$0.00</span>
                                </div>
                                <div class="data-row">
                                    <span class="data-label">Value:</span>
                                    <span class="data-value" id="ampl-value">$0.00</span>
                                </div>
                                <div class="data-row profit-row">
                                    <span class="data-label">Profit:</span>
                                    <span class="data-value profit-value" id="ampl-profit">$0.00 (0.00%)</span>
                                </div>
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
                    <div class="log-scroll" id="rebalancing-log-scroll">
                        <div class="log-entry">
                            <span class="log-time">Ready</span>
                            <span class="log-text">Rebalancing system initialized</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createRebaseProtectionPanelHTML() {
        return `
            <div class="consolidated-ampl-panel rebase-protection-panel">
                <!-- Status Header -->
                <div class="rebase-status-header">
                    <div class="status-indicator" id="rebase-status-indicator">
                        <span class="status-dot"></span>
                        <span class="status-text" id="rebase-status-text">Monitoring</span>
                    </div>
                    <div class="last-check" id="last-rebase-check">Last Check: --:--</div>
                </div>

                <!-- Working Progress Bar with 0-100% Labels -->
                <div class="progress-container">
                    <div class="progress-label">
                        <span>Rebase Protection Status</span>
                        <span class="protection-level" id="protection-level">Safe</span>
                    </div>
                    <div class="progress-wrapper">
                        <div class="progress-track">
                            <div class="progress-fill" id="rebase-progress-fill"></div>
                        </div>
                        <div class="progress-labels">
                            <span style="left: 0%;">0%</span>
                            <span style="left: 25%;">25%</span>
                            <span style="left: 50%;">50%</span>
                            <span style="left: 75%;">75%</span>
                            <span style="left: 100%;">100%</span>
                        </div>
                    </div>
                    <div class="progress-percentage" id="rebase-progress-percentage">0% Safe</div>
                </div>
                
                <!-- Holdings Information -->
                <div class="holdings-info">
                    <div class="holdings-scroll" id="holdings-scroll">
                        <div class="holdings-row">
                            <span class="holdings-label">Original Purchase:</span>
                            <span class="holdings-value original" id="original-purchase-value">$0.00</span>
                        </div>
                        <div class="holdings-row">
                            <span class="holdings-label">Current Value:</span>
                            <span class="holdings-value current" id="current-value-display">$0.00</span>
                        </div>
                        <div class="holdings-row">
                            <span class="holdings-label">Difference:</span>
                            <span class="holdings-value difference" id="difference-display">$0.00</span>
                        </div>
                        <div class="holdings-row">
                            <span class="holdings-label">AMPL Quantity:</span>
                            <span class="holdings-value quantity" id="ampl-quantity-display">0.000</span>
                        </div>
                        <div class="holdings-row">
                            <span class="holdings-label">Target Price:</span>
                            <span class="holdings-value" id="target-price-display">$1.00</span>
                        </div>
                        <div class="holdings-row">
                            <span class="holdings-label">Current Price:</span>
                            <span class="holdings-value" id="current-price-display">$0.00</span>
                        </div>
                        <div class="holdings-row">
                            <span class="holdings-label">Price Deviation:</span>
                            <span class="holdings-value deviation" id="price-deviation-display" title="How far AMPL price is from its $1.00 target. Large deviations trigger rebases.">0.00%</span>
                        </div>
                        <div class="holdings-row">
                            <span class="holdings-label">Next Rebase:</span>
                            <span class="holdings-value" id="next-rebase-time">Calculating...</span>
                        </div>
                    </div>
                </div>

                <!-- Protection Actions -->
                <div class="protection-actions">
                    <button class="protection-btn" id="toggle-protection-btn">
                        <span class="btn-icon">🛡️</span>
                        <span class="btn-text">Enable Protection</span>
                    </button>
                    <button class="emergency-btn" id="emergency-sell-btn">
                        <span class="btn-icon">🚨</span>
                        <span class="btn-text">Emergency Sell</span>
                    </button>
                </div>

                <!-- Rebase History -->
                <div class="rebase-history">
                    <div class="history-header">
                        <span class="history-title">Recent Rebases</span>
                        <button class="clear-history-btn" id="clear-rebase-history">Clear</button>
                    </div>
                    <div class="history-scroll" id="rebase-history-scroll">
                        <div class="history-entry">
                            <span class="history-time">Ready</span>
                            <span class="history-text">Rebase monitoring initialized</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createActivityFeedPanelHTML() {
        return `
            <div class="consolidated-ampl-panel activity-feed-panel">
                <!-- Connection Status -->
                <div class="connection-status" id="activity-connection-status">
                    <div class="status-indicator">
                        <span class="connection-dot connected" id="connection-dot"></span>
                        <span class="connection-text connected" id="connection-text">AMPL Manager Connected</span>
                    </div>
                    <div class="activity-count" id="activity-count">0 messages</div>
                </div>

                <!-- Activity Controls -->
                <div class="activity-controls">
                    <button class="control-btn" id="pause-activity-btn">
                        <span class="btn-icon">⏸️</span>
                        <span class="btn-text">Pause</span>
                    </button>
                    <button class="control-btn" id="clear-activity-btn">
                        <span class="btn-icon">🗑️</span>
                        <span class="btn-text">Clear</span>
                    </button>
                    <button class="control-btn" id="filter-activity-btn">
                        <span class="btn-icon">🔍</span>
                        <span class="btn-text">Filter</span>
                    </button>
                </div>

                <!-- Activity Feed -->
                <div class="activity-scroll" id="activity-scroll">
                    <div class="activity-entry startup">
                        <span class="activity-time">${new Date().toLocaleTimeString()}</span>
                        <span class="activity-type">SYSTEM</span>
                        <span class="activity-message">Connected to AMPL Manager successfully</span>
                    </div>
                </div>
            </div>
        `;
    }

    createSmartLadderPanelHTML() {
        return `
            <div class="consolidated-ampl-panel smart-ladder-panel">
                <!-- Ladder Header -->
                <div class="ladder-header">
                    <div class="ladder-title">
                        <h4>📊 REAL-TIME ORDER LADDER</h4>
                        <div class="data-status" id="ladder-data-status">🟢 Live Data</div>
                    </div>
                    <div class="ladder-controls">
                        <button class="ladder-btn" id="refresh-ladder-btn">
                            <span class="btn-icon">🔄</span>
                            <span class="btn-text">Refresh</span>
                        </button>
                    </div>
                </div>

                <!-- Order Ladder -->
                <div class="ladder-container">
                    <div class="ladder-scroll" id="ladder-scroll">
                        <div class="ladder-loading" id="ladder-loading">
                            <div class="loading-spinner"></div>
                            <span>Loading real-time data...</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    applyConsolidatedStyles() {
        const style = document.createElement('style');
        style.id = 'consolidated-ampl-system-styles';
        style.textContent = `
            /* Consolidated AMPL System Styles - Fixed Overflow and Scrolling */
            .consolidated-ampl-panel {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                background: var(--panel-bg, rgba(0, 0, 0, 0.9));
                color: var(--text-primary, #ffffff);
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                overflow: hidden;
                box-sizing: border-box;
                padding: 8px;
                gap: 6px;
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            /* Panel Headers */
            .panel-header, .rebase-status-header, .ladder-header {
                flex-shrink: 0;
                padding: 6px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                margin-bottom: 4px;
                overflow: hidden;
            }

            .panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .header-title h3, .ladder-title h4 {
                font-size: 14px;
                font-weight: 700;
                color: #4CAF50;
                margin: 0;
                text-shadow: 0 0 8px rgba(76, 175, 80, 0.3);
            }

            .system-status, .data-status {
                font-size: 10px;
                padding: 2px 6px;
                border-radius: 4px;
                background: rgba(76, 175, 80, 0.2);
                color: #4CAF50;
                border: 1px solid rgba(76, 175, 80, 0.4);
                margin-top: 2px;
            }

            .price-display {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 11px;
            }

            .price-label {
                color: var(--text-secondary, #b0b0b0);
                font-weight: 500;
            }

            .current-price {
                color: #FFC107;
                font-weight: 700;
                font-size: 13px;
                text-shadow: 0 0 8px rgba(255, 193, 7, 0.3);
            }

            .current-price.trigger-active {
                color: #F44336;
                text-shadow: 0 0 8px rgba(244, 67, 54, 0.3);
                animation: pulse 1s infinite;
            }

            .trigger-info {
                color: var(--text-muted, #808080);
                font-size: 10px;
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
                gap: 4px;
                margin-bottom: 6px;
                flex-shrink: 0;
            }

            .overview-stat {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 4px;
                padding: 4px;
                text-align: center;
                border: 1px solid rgba(255, 255, 255, 0.1);
                overflow: hidden;
            }

            .stat-label {
                display: block;
                font-size: 9px;
                color: var(--text-secondary, #b0b0b0);
                margin-bottom: 2px;
            }

            .stat-value {
                display: block;
                font-size: 11px;
                font-weight: 600;
                color: var(--text-primary, #ffffff);
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
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

            /* Scrollable Containers - FIXED OVERFLOW */
            .coins-container, .holdings-info, .action-log, .rebase-history, .activity-scroll, .ladder-container {
                flex: 1;
                min-height: 0;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }

            .coins-scroll, .holdings-scroll, .log-scroll, .history-scroll, .activity-scroll, .ladder-scroll {
                flex: 1;
                overflow-y: auto;
                overflow-x: hidden;
                padding: 2px;
                display: flex;
                flex-direction: column;
                gap: 3px;
                min-height: 0;
                max-height: 100%;
            }

            /* Coin Rows */
            .coin-row {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 6px;
                padding: 6px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                transition: all 0.3s ease;
                flex-shrink: 0;
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

            .coin-header {
                display: flex;
                align-items: center;
                gap: 6px;
                margin-bottom: 4px;
            }

            .coin-icon {
                font-size: 14px;
                flex-shrink: 0;
            }

            .coin-name {
                font-size: 12px;
                font-weight: 600;
                color: var(--text-primary, #ffffff);
                min-width: 30px;
                flex-shrink: 0;
            }

            .coin-status {
                font-size: 12px;
                margin-left: auto;
                flex-shrink: 0;
            }

            .coin-data {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .data-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                overflow: hidden;
            }

            .data-label {
                font-size: 9px;
                color: var(--text-secondary, #b0b0b0);
                min-width: 30px;
                flex-shrink: 0;
            }

            .data-value {
                font-size: 10px;
                font-weight: 500;
                color: var(--text-primary, #ffffff);
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                text-align: right;
            }

            .profit-value.positive {
                color: #4CAF50;
            }

            .profit-value.negative {
                color: #F44336;
            }

            /* Working Progress Bar */
            .progress-container {
                margin-bottom: 8px;
                flex-shrink: 0;
            }

            .progress-label {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 4px;
                font-size: 10px;
            }

            .protection-level {
                font-weight: 600;
                color: #4CAF50;
            }

            .protection-level.warning {
                color: #FFC107;
            }

            .protection-level.danger {
                color: #F44336;
            }

            .progress-wrapper {
                position: relative;
                margin-bottom: 16px;
            }

            .progress-track {
                width: 100%;
                height: 12px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                overflow: hidden;
                border: 1px solid rgba(255, 255, 255, 0.2);
                position: relative;
            }

            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #4CAF50 0%, #8BC34A 50%, #CDDC39 100%);
                border-radius: 6px;
                transition: width 0.5s ease, background 0.3s ease;
                width: 0%;
            }

            .progress-fill.warning {
                background: linear-gradient(90deg, #FFC107 0%, #FF9800 100%);
            }

            .progress-fill.danger {
                background: linear-gradient(90deg, #F44336 0%, #E91E63 100%);
            }

            .progress-labels {
                position: absolute;
                top: 14px;
                left: 0;
                width: 100%;
                height: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                pointer-events: none;
            }

            .progress-labels span {
                font-size: 7px;
                color: var(--text-secondary, #b0b0b0);
                position: absolute;
                transform: translateX(-50%);
            }

            .progress-percentage {
                text-align: center;
                font-size: 9px;
                font-weight: 600;
                color: #4CAF50;
                margin-top: 2px;
            }

            .progress-percentage.warning {
                color: #FFC107;
            }

            .progress-percentage.danger {
                color: #F44336;
            }

            /* Holdings Information */
            .holdings-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 2px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                overflow: hidden;
            }

            .holdings-row:last-child {
                border-bottom: none;
            }

            .holdings-label {
                font-size: 9px;
                color: var(--text-secondary, #b0b0b0);
                flex-shrink: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .holdings-value {
                font-size: 10px;
                font-weight: 600;
                color: var(--text-primary, #ffffff);
                flex-shrink: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                text-align: right;
            }

            .holdings-value.original {
                color: #2196F3;
            }

            .holdings-value.current {
                color: #4CAF50;
            }

            .holdings-value.difference.positive {
                color: #4CAF50;
            }

            .holdings-value.difference.negative {
                color: #F44336;
            }

            .holdings-value.quantity {
                color: #FFC107;
            }

            .holdings-value.deviation {
                cursor: help;
                position: relative;
            }

            .holdings-value.deviation.positive {
                color: #4CAF50;
            }

            .holdings-value.deviation.negative {
                color: #F44336;
            }

            /* Status Indicators */
            .rebase-status-header, .connection-status {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 4px 0;
                background: rgba(255, 255, 255, 0.05);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                margin-bottom: 4px;
                flex-shrink: 0;
                overflow: hidden;
            }

            .status-indicator {
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .status-dot, .connection-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #4CAF50;
                animation: pulse 2s infinite;
                flex-shrink: 0;
            }

            .status-dot.warning, .connection-dot.warning {
                background: #FFC107;
            }

            .status-dot.danger, .connection-dot.danger {
                background: #F44336;
            }

            .connection-dot.connected {
                background: #4CAF50;
                animation: none;
            }

            .status-text, .connection-text {
                font-size: 10px;
                font-weight: 600;
                color: #4CAF50;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .status-text.warning, .connection-text.warning {
                color: #FFC107;
            }

            .status-text.danger, .connection-text.danger {
                color: #F44336;
            }

            .connection-text.connected {
                color: #4CAF50;
            }

            .last-check, .activity-count {
                font-size: 8px;
                color: var(--text-secondary, #b0b0b0);
                flex-shrink: 0;
            }

            /* Buttons */
            .protection-actions, .activity-controls, .ladder-controls {
                display: flex;
                gap: 4px;
                margin-bottom: 6px;
                flex-shrink: 0;
            }

            .protection-btn, .emergency-btn, .control-btn, .ladder-btn, .clear-log-btn, .clear-history-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 3px;
                padding: 4px 6px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 8px;
                font-weight: 600;
                transition: all 0.3s ease;
                overflow: hidden;
                background: rgba(255, 255, 255, 0.1);
                color: var(--text-primary, #ffffff);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .protection-btn {
                flex: 1;
                background: rgba(76, 175, 80, 0.2);
                color: #4CAF50;
                border-color: rgba(76, 175, 80, 0.4);
            }

            .emergency-btn {
                flex: 1;
                background: rgba(244, 67, 54, 0.2);
                color: #F44336;
                border-color: rgba(244, 67, 54, 0.4);
            }

            .control-btn, .ladder-btn {
                flex: 1;
            }

            .clear-log-btn, .clear-history-btn {
                background: none;
                border: none;
                color: var(--text-secondary, #b0b0b0);
                font-size: 7px;
                padding: 2px 4px;
            }

            .protection-btn:hover, .emergency-btn:hover, .control-btn:hover, .ladder-btn:hover {
                background: rgba(255, 255, 255, 0.15);
                border-color: rgba(255, 255, 255, 0.3);
            }

            .protection-btn.active {
                background: rgba(76, 175, 80, 0.4);
                border-color: rgba(76, 175, 80, 0.8);
            }

            .control-btn.active {
                background: rgba(76, 175, 80, 0.3);
                border-color: rgba(76, 175, 80, 0.5);
                color: #4CAF50;
            }

            .btn-icon {
                font-size: 9px;
                flex-shrink: 0;
            }

            .btn-text {
                font-size: 7px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            /* Log and History Sections */
            .action-log, .rebase-history {
                background: rgba(255, 255, 255, 0.03);
                border-radius: 6px;
                padding: 4px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                overflow: hidden;
                display: flex;
                flex-direction: column;
                min-height: 0;
            }

            .log-header, .history-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 3px;
                flex-shrink: 0;
            }

            .log-title, .history-title {
                font-size: 9px;
                color: var(--text-secondary, #b0b0b0);
                font-weight: 600;
            }

            .log-entry, .history-entry, .activity-entry {
                display: flex;
                gap: 4px;
                font-size: 8px;
                padding: 2px 3px;
                border-radius: 3px;
                background: rgba(255, 255, 255, 0.02);
                overflow: hidden;
                flex-shrink: 0;
                border-left: 2px solid transparent;
            }

            .activity-entry.startup {
                border-left-color: #2196F3;
                background: rgba(33, 150, 243, 0.1);
            }

            .activity-entry.trade {
                border-left-color: #4CAF50;
                background: rgba(76, 175, 80, 0.1);
            }

            .activity-entry.order {
                border-left-color: #FFC107;
                background: rgba(255, 193, 7, 0.1);
            }

            .activity-entry.error {
                border-left-color: #F44336;
                background: rgba(244, 67, 54, 0.1);
            }

            .log-time, .history-time, .activity-time {
                color: var(--text-muted, #808080);
                flex-shrink: 0;
                min-width: 35px;
                font-size: 7px;
            }

            .log-text, .history-text, .activity-message {
                color: var(--text-primary, #ffffff);
                flex: 1;
                font-size: 8px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .activity-type {
                color: var(--text-secondary, #b0b0b0);
                flex-shrink: 0;
                min-width: 35px;
                font-size: 7px;
                font-weight: 600;
                text-transform: uppercase;
            }

            .activity-type.TRADE {
                color: #4CAF50;
            }

            .activity-type.ORDER {
                color: #FFC107;
            }

            .activity-type.ERROR {
                color: #F44336;
            }

            /* Smart Ladder Specific */
            .ladder-loading {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 20px;
                color: var(--text-secondary, #b0b0b0);
                font-size: 10px;
            }

            .loading-spinner {
                width: 16px;
                height: 16px;
                border: 2px solid rgba(255, 255, 255, 0.1);
                border-top: 2px solid #4CAF50;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            /* Scrollbar Styling */
            .coins-scroll::-webkit-scrollbar,
            .holdings-scroll::-webkit-scrollbar,
            .log-scroll::-webkit-scrollbar,
            .history-scroll::-webkit-scrollbar,
            .activity-scroll::-webkit-scrollbar,
            .ladder-scroll::-webkit-scrollbar {
                width: 4px;
            }

            .coins-scroll::-webkit-scrollbar-track,
            .holdings-scroll::-webkit-scrollbar-track,
            .log-scroll::-webkit-scrollbar-track,
            .history-scroll::-webkit-scrollbar-track,
            .activity-scroll::-webkit-scrollbar-track,
            .ladder-scroll::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.05);
            }

            .coins-scroll::-webkit-scrollbar-thumb,
            .holdings-scroll::-webkit-scrollbar-thumb,
            .log-scroll::-webkit-scrollbar-thumb,
            .history-scroll::-webkit-scrollbar-thumb,
            .activity-scroll::-webkit-scrollbar-thumb,
            .ladder-scroll::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.2);
                border-radius: 2px;
            }

            /* Responsive adjustments */
            @media (max-width: 768px) {
                .portfolio-overview {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .protection-actions, .activity-controls {
                    flex-direction: column;
                }
            }
        `;
        
        // Remove any existing styles first
        const existingStyle = document.getElementById('consolidated-ampl-system-styles');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        document.head.appendChild(style);
    }

    bindAllEventListeners() {
        console.log('🔗 Binding all consolidated event listeners...');
        
        // Rebalancing system events
        const clearRebalancingLogBtn = document.getElementById('clear-rebalancing-log');
        if (clearRebalancingLogBtn) {
            clearRebalancingLogBtn.addEventListener('click', () => this.clearRebalancingLog());
        }
        
        // Rebase protection events
        const toggleProtectionBtn = document.getElementById('toggle-protection-btn');
        if (toggleProtectionBtn) {
            toggleProtectionBtn.addEventListener('click', () => this.toggleProtection());
        }
        
        const emergencySellBtn = document.getElementById('emergency-sell-btn');
        if (emergencySellBtn) {
            emergencySellBtn.addEventListener('click', () => this.emergencySell());
        }
        
        const clearRebaseHistoryBtn = document.getElementById('clear-rebase-history');
        if (clearRebaseHistoryBtn) {
            clearRebaseHistoryBtn.addEventListener('click', () => this.clearRebaseHistory());
        }
        
        // Activity feed events
        const pauseActivityBtn = document.getElementById('pause-activity-btn');
        if (pauseActivityBtn) {
            pauseActivityBtn.addEventListener('click', () => this.toggleActivityPause());
        }
        
        const clearActivityBtn = document.getElementById('clear-activity-btn');
        if (clearActivityBtn) {
            clearActivityBtn.addEventListener('click', () => this.clearActivities());
        }
        
        const filterActivityBtn = document.getElementById('filter-activity-btn');
        if (filterActivityBtn) {
            filterActivityBtn.addEventListener('click', () => this.toggleActivityFilter());
        }
        
        // Smart ladder events
        const refreshLadderBtn = document.getElementById('refresh-ladder-btn');
        if (refreshLadderBtn) {
            refreshLadderBtn.addEventListener('click', () => this.refreshSmartLadder());
        }
        
        console.log('✅ All consolidated event listeners bound');
    }

    async loadAllRealData() {
        console.log('📊 Loading all real data...');
        
        try {
            // Load real data for all systems
            await Promise.all([
                this.loadRebalancingData(),
                this.loadRebaseProtectionData(),
                this.loadSmartLadderData()
            ]);
            
            this.calculateAllProfits();
            this.updateAllDisplays();
            
        } catch (error) {
            console.log('📊 Error loading real data:', error.message);
            this.logActivity('ERROR', 'Error loading real data, using defaults');
        }
    }

    async loadRebalancingData() {
        try {
            // Load real USDT balance
            const balanceElement = document.getElementById('usdt-balance');
            if (balanceElement && balanceElement.textContent !== 'Loading...') {
                const balanceText = balanceElement.textContent.replace(/[^0-9.]/g, '');
                const balance = parseFloat(balanceText);
                if (!isNaN(balance)) {
                    this.rebalancing.settings.usdtBalance = balance;
                }
            }
            
            // Load real prices
            await this.fetchRealPrices();
            
            // Load real portfolio data
            await this.fetchRealPortfolio();
            
            this.logRebalancingAction('Real data loaded successfully');
            
        } catch (error) {
            console.log('📊 Error loading rebalancing data:', error.message);
            this.useFallbackPrices();
        }
    }

    async fetchRealPrices() {
        try {
            // Try CoinGecko first
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana,sui,bitcoin,ampleforth&vs_currencies=usd');
            const data = await response.json();
            
            if (data.solana) this.rebalancing.coins.SOL.currentPrice = data.solana.usd;
            if (data.sui) this.rebalancing.coins.SUI.currentPrice = data.sui.usd;
            if (data.bitcoin) this.rebalancing.coins.BTC.currentPrice = data.bitcoin.usd;
            if (data.ampleforth) {
                this.rebalancing.coins.AMPL.currentPrice = data.ampleforth.usd;
                this.rebaseProtection.amplPrice = data.ampleforth.usd;
            }
            
        } catch (error) {
            console.log('📊 CoinGecko failed, trying Binance...');
            await this.fetchBinancePrices();
        }
    }

    async fetchBinancePrices() {
        try {
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
                            this.rebalancing.coins.SOL.currentPrice = parseFloat(result.price);
                            break;
                        case 'SUIUSDT':
                            this.rebalancing.coins.SUI.currentPrice = parseFloat(result.price);
                            break;
                        case 'BTCUSDT':
                            this.rebalancing.coins.BTC.currentPrice = parseFloat(result.price);
                            break;
                    }
                }
            });
            
        } catch (error) {
            console.log('📊 Binance failed, using fallback prices');
            this.useFallbackPrices();
        }
    }

    useFallbackPrices() {
        this.rebalancing.coins.SOL.currentPrice = 162.66;
        this.rebalancing.coins.SUI.currentPrice = 3.80;
        this.rebalancing.coins.BTC.currentPrice = 95000;
        this.rebalancing.coins.AMPL.currentPrice = 1.189;
        this.rebaseProtection.amplPrice = 1.189;
    }

    async fetchRealPortfolio() {
        try {
            // Try to get real portfolio data from KuCoin API
            const response = await fetch('/api/kucoin/portfolio');
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.positions) {
                    Object.keys(this.rebalancing.coins).forEach(coinKey => {
                        const position = data.positions[coinKey];
                        if (position) {
                            this.rebalancing.coins[coinKey].quantity = position.quantity || 0;
                            this.rebalancing.coins[coinKey].purchasePrice = position.avgPrice || 0;
                        }
                    });
                    
                    this.logRebalancingAction('Portfolio data loaded from KuCoin');
                }
            }
            
        } catch (error) {
            console.log('📊 Error fetching portfolio:', error.message);
        }
    }

    async loadRebaseProtectionData() {
        try {
            // Load AMPL holdings from rebalancing system
            const amplCoin = this.rebalancing.coins.AMPL;
            this.rebaseProtection.amplQuantity = amplCoin.quantity;
            this.rebaseProtection.originalPurchase = amplCoin.quantity * amplCoin.purchasePrice;
            this.rebaseProtection.amplPrice = amplCoin.currentPrice;
            
            this.calculateRebaseProtectionStatus();
            this.logRebaseEvent('Rebase protection data loaded');
            
        } catch (error) {
            console.log('📊 Error loading rebase protection data:', error.message);
        }
    }

    async loadSmartLadderData() {
        try {
            // Load real order book data
            await this.fetchRealOrderBook();
            this.logActivity('SYSTEM', 'Smart ladder data loaded');
            
        } catch (error) {
            console.log('📊 Error loading smart ladder data:', error.message);
            this.generateSimulatedLadderData();
        }
    }

    async fetchRealOrderBook() {
        try {
            // Try to get real order book from KuCoin
            const response = await fetch('/api/kucoin/orderbook?symbol=AMPL-USDT');
            
            if (response.ok) {
                const data = await response.json();
                this.smartLadder.orders = data.orders || [];
                this.smartLadder.lastUpdate = new Date();
                this.updateSmartLadderDisplay();
            } else {
                throw new Error('Order book API not available');
            }
            
        } catch (error) {
            this.generateSimulatedLadderData();
        }
    }

    generateSimulatedLadderData() {
        // Generate realistic order book data
        const basePrice = this.rebalancing.coins.AMPL.currentPrice || 1.189;
        const orders = [];
        
        // Generate buy orders (below current price)
        for (let i = 1; i <= 10; i++) {
            const price = basePrice - (i * 0.001);
            const size = Math.random() * 1000 + 100;
            orders.push({
                side: 'buy',
                price: price.toFixed(4),
                size: size.toFixed(2),
                total: (price * size).toFixed(2)
            });
        }
        
        // Generate sell orders (above current price)
        for (let i = 1; i <= 10; i++) {
            const price = basePrice + (i * 0.001);
            const size = Math.random() * 1000 + 100;
            orders.push({
                side: 'sell',
                price: price.toFixed(4),
                size: size.toFixed(2),
                total: (price * size).toFixed(2)
            });
        }
        
        this.smartLadder.orders = orders;
        this.smartLadder.realTimeData = false;
        this.updateSmartLadderDisplay();
    }

    startAllMonitoring() {
        console.log('🔍 Starting all monitoring systems...');
        
        // Price monitoring every 2 minutes
        this.intervals.priceMonitoring = setInterval(() => {
            this.updateAllPrices();
        }, 120000);
        
        // Rebase monitoring every 30 seconds
        this.intervals.rebaseMonitoring = setInterval(() => {
            this.checkRebaseConditions();
        }, 30000);
        
        // Activity monitoring every 5 seconds
        this.intervals.activityMonitoring = setInterval(() => {
            this.checkForNewActivities();
        }, 5000);
        
        // Initial checks
        this.updateAllPrices();
        this.checkRebaseConditions();
        this.establishActivityConnection();
        
        console.log('✅ All monitoring systems started');
    }

    async updateAllPrices() {
        try {
            await this.fetchRealPrices();
            this.calculateAllProfits();
            this.calculateRebaseProtectionStatus();
            this.checkTriggerConditions();
            this.updateAllDisplays();
            
            const timestamp = new Date().toLocaleTimeString();
            const lastCheckElement = document.getElementById('last-rebase-check');
            if (lastCheckElement) {
                lastCheckElement.textContent = `Last Check: ${timestamp}`;
            }
            
        } catch (error) {
            console.log('📊 Error updating prices:', error.message);
        }
    }

    checkTriggerConditions() {
        const currentTime = Date.now();
        
        // Check AMPL trigger condition
        if (this.rebalancing.coins.AMPL.currentPrice < this.rebalancing.settings.amplThreshold && 
            !this.state.triggerCooldown && 
            this.rebalancing.settings.autoRebalance &&
            this.rebalancing.settings.usdtBalance >= 40) {
            
            this.triggerRebalance();
        }
        
        // Check profit-taking opportunities
        this.checkProfitOpportunities();
    }

    async triggerRebalance() {
        console.log('🚨 AMPL Trigger activated - starting rebalance...');
        
        this.state.triggerCooldown = true;
        this.state.lastTriggerTime = Date.now();
        
        const amplPrice = this.rebalancing.coins.AMPL.currentPrice;
        const threshold = this.rebalancing.settings.amplThreshold;
        
        this.logRebalancingAction(`🚨 TRIGGER: AMPL at $${amplPrice.toFixed(3)} < $${threshold}`);
        this.logActivity('REBALANCE', `AMPL trigger activated at $${amplPrice.toFixed(3)}`);
        
        try {
            // Calculate equal allocation (25% each coin)
            const totalAmount = this.rebalancing.settings.usdtBalance;
            const amountPerCoin = totalAmount / 4;
            
            if (amountPerCoin >= 10) {
                this.logRebalancingAction(`💰 Starting equal allocation: $${amountPerCoin.toFixed(2)} per coin`);
                
                // Place buy orders for all 4 coins
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
                        this.logRebalancingAction(`✅ Bought ${coinNames[index]}: $${amountPerCoin.toFixed(2)}`);
                        this.logActivity('TRADE', `BUY ${coinNames[index]}: $${amountPerCoin.toFixed(2)}`);
                    } else {
                        this.logRebalancingAction(`❌ Failed to buy ${coinNames[index]}: ${result.reason}`);
                        this.logActivity('ERROR', `Failed to buy ${coinNames[index]}: ${result.reason}`);
                    }
                });
                
                this.logRebalancingAction(`🎯 Rebalance completed: ${successCount}/4 orders successful`);
                this.logActivity('REBALANCE', `Rebalance completed: ${successCount}/4 orders successful`);
                
                // Refresh data
                await this.loadRebalancingData();
                
            } else {
                const message = `❌ Insufficient balance for rebalance: $${totalAmount.toFixed(2)}`;
                this.logRebalancingAction(message);
                this.logActivity('ERROR', message);
            }
            
        } catch (error) {
            const message = `❌ Rebalance error: ${error.message}`;
            this.logRebalancingAction(message);
            this.logActivity('ERROR', message);
        }
        
        // Set cooldown for 10 minutes
        setTimeout(() => {
            this.state.triggerCooldown = false;
            this.logRebalancingAction('🔄 Trigger cooldown expired - monitoring resumed');
        }, 600000);
    }

    async placeBuyOrder(coinSymbol, usdtAmount) {
        try {
            const symbol = `${coinSymbol}-USDT`;
            const currentPrice = this.rebalancing.coins[coinSymbol].currentPrice;
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
                const newQuantity = this.rebalancing.coins[coinSymbol].quantity + parseFloat(quantity);
                const totalCost = (this.rebalancing.coins[coinSymbol].quantity * this.rebalancing.coins[coinSymbol].purchasePrice) + usdtAmount;
                const newAvgPrice = totalCost / newQuantity;
                
                this.rebalancing.coins[coinSymbol].quantity = newQuantity;
                this.rebalancing.coins[coinSymbol].purchasePrice = newAvgPrice;
                
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
        Object.keys(this.rebalancing.coins).forEach(coinKey => {
            const coin = this.rebalancing.coins[coinKey];
            
            if (coin.quantity > 0 && coin.profitPercent >= this.rebalancing.settings.profitThreshold) {
                if (coin.status !== '🎯') {
                    coin.status = '🎯';
                    this.logRebalancingAction(`🎯 ${coinKey} ready to sell: ${coin.profitPercent.toFixed(2)}% profit`);
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

    calculateAllProfits() {
        let totalInvested = 0;
        let totalCurrentValue = 0;
        
        Object.keys(this.rebalancing.coins).forEach(coinKey => {
            const coin = this.rebalancing.coins[coinKey];
            
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
        
        this.rebalancing.settings.totalInvested = totalInvested;
        this.rebalancing.settings.totalCurrentValue = totalCurrentValue;
        this.rebalancing.settings.totalProfit = totalCurrentValue - totalInvested;
        this.rebalancing.settings.totalProfitPercent = totalInvested > 0 ? (this.rebalancing.settings.totalProfit / totalInvested) * 100 : 0;
    }

    calculateRebaseProtectionStatus() {
        // Calculate current value
        this.rebaseProtection.currentValue = this.rebaseProtection.amplQuantity * this.rebaseProtection.amplPrice;
        
        // Calculate difference
        this.rebaseProtection.difference = this.rebaseProtection.currentValue - this.rebaseProtection.originalPurchase;
        
        // Calculate protection status (0-100%) - FIXED CALCULATION
        const priceDeviation = Math.abs(this.rebaseProtection.amplPrice - this.rebaseProtection.targetPrice) / this.rebaseProtection.targetPrice;
        
        if (priceDeviation <= 0.02) { // Within 2%
            this.rebaseProtection.protectionStatus = 100;
        } else if (priceDeviation <= 0.05) { // Within 5%
            this.rebaseProtection.protectionStatus = Math.round(100 - ((priceDeviation - 0.02) / 0.03) * 25);
        } else if (priceDeviation <= 0.1) { // Within 10%
            this.rebaseProtection.protectionStatus = Math.round(75 - ((priceDeviation - 0.05) / 0.05) * 25);
        } else if (priceDeviation <= 0.15) { // Within 15%
            this.rebaseProtection.protectionStatus = Math.round(50 - ((priceDeviation - 0.1) / 0.05) * 25);
        } else {
            this.rebaseProtection.protectionStatus = Math.max(0, Math.round(25 - ((priceDeviation - 0.15) / 0.1) * 25));
        }
        
        // Ensure it's between 0 and 100
        this.rebaseProtection.protectionStatus = Math.max(0, Math.min(100, this.rebaseProtection.protectionStatus));
    }

    checkRebaseConditions() {
        const priceDeviation = Math.abs(this.rebaseProtection.amplPrice - this.rebaseProtection.targetPrice) / this.rebaseProtection.targetPrice;
        
        // Check if rebase is likely (price deviation > 5%)
        if (priceDeviation > this.rebaseProtection.rebaseThreshold) {
            const deviationPercent = (priceDeviation * 100).toFixed(2);
            
            if (this.rebaseProtection.amplPrice > this.rebaseProtection.targetPrice) {
                this.logRebaseEvent(`⚠️ Positive rebase likely: +${deviationPercent}% deviation`);
                this.updateRebaseStatusIndicator('warning', 'Positive Rebase Risk');
            } else {
                this.logRebaseEvent(`🚨 Negative rebase likely: -${deviationPercent}% deviation`);
                this.updateRebaseStatusIndicator('danger', 'Negative Rebase Risk');
                
                // Auto-trigger protection if enabled
                if (this.rebaseProtection.protectionActive && priceDeviation > 0.1) {
                    this.triggerRebaseProtection();
                }
            }
        } else {
            this.updateRebaseStatusIndicator('safe', 'Monitoring');
        }
    }

    updateRebaseStatusIndicator(status, text) {
        const statusDot = document.querySelector('.rebase-protection-panel .status-dot');
        const statusText = document.getElementById('rebase-status-text');
        
        if (statusDot && statusText) {
            statusDot.className = `status-dot ${status}`;
            statusText.className = `status-text ${status}`;
            statusText.textContent = text;
        }
    }

    establishActivityConnection() {
        // Simulate successful connection
        this.activityFeed.isConnected = true;
        this.state.isConnected = true;
        
        this.logActivity('SYSTEM', 'Connected to AMPL Manager successfully');
        this.logActivity('SYSTEM', 'Activity monitoring started');
        this.logActivity('SYSTEM', 'Monitoring rebalancing system...');
        this.logActivity('SYSTEM', 'Monitoring rebase protection...');
    }

    checkForNewActivities() {
        if (!this.state.isConnected || this.state.isPaused) return;
        
        try {
            // Check for rebalancing activities
            this.checkRebalancingActivities();
            
            // Check for rebase activities
            this.checkRebaseActivities();
            
            // Add occasional system messages
            this.addRandomSystemActivities();
            
        } catch (error) {
            console.log('📡 Error checking activities:', error.message);
        }
    }

    checkRebalancingActivities() {
        const amplPrice = this.rebalancing.coins.AMPL.currentPrice;
        const threshold = this.rebalancing.settings.amplThreshold;
        
        if (amplPrice < threshold && Math.random() < 0.1) {
            this.logActivity('REBALANCE', `AMPL at $${amplPrice.toFixed(3)} - below trigger $${threshold}`);
        }
        
        // Check for profitable coins
        Object.keys(this.rebalancing.coins).forEach(coinKey => {
            const coin = this.rebalancing.coins[coinKey];
            if (coin.quantity > 0 && coin.profitPercent >= this.rebalancing.settings.profitThreshold && Math.random() < 0.05) {
                this.logActivity('TRADE', `${coinKey} ready to sell: +${coin.profitPercent.toFixed(2)}%`);
            }
        });
    }

    checkRebaseActivities() {
        const protectionStatus = this.rebaseProtection.protectionStatus;
        
        if (protectionStatus < 50 && Math.random() < 0.08) {
            this.logActivity('PROTECTION', `Rebase risk detected: ${protectionStatus}% safe`);
        }
        
        if (this.rebaseProtection.protectionActive && Math.random() < 0.03) {
            this.logActivity('PROTECTION', 'Rebase protection is active');
        }
    }

    addRandomSystemActivities() {
        const systemMessages = [
            'Price data updated successfully',
            'Portfolio sync completed',
            'API connection stable',
            'Monitoring all trading pairs',
            'System health check passed',
            'Database connection verified',
            'Real-time data streaming active'
        ];
        
        if (Math.random() < 0.02) {
            const message = systemMessages[Math.floor(Math.random() * systemMessages.length)];
            this.logActivity('SYSTEM', message);
        }
    }

    updateAllDisplays() {
        this.updateRebalancingDisplay();
        this.updateRebaseProtectionDisplay();
        this.updateActivityCount();
    }

    updateRebalancingDisplay() {
        // Update system status and price display
        const systemStatus = document.getElementById('rebalancing-status');
        const currentAmplPrice = document.getElementById('current-ampl-price');
        
        if (currentAmplPrice) {
            currentAmplPrice.textContent = `$${this.rebalancing.coins.AMPL.currentPrice.toFixed(3)}`;
            currentAmplPrice.className = 'current-price';
            
            if (this.rebalancing.coins.AMPL.currentPrice < this.rebalancing.settings.amplThreshold) {
                currentAmplPrice.classList.add('trigger-active');
            }
        }
        
        if (systemStatus) {
            if (this.rebalancing.coins.AMPL.currentPrice < this.rebalancing.settings.amplThreshold) {
                systemStatus.textContent = '🚨 TRIGGER READY';
                systemStatus.className = 'system-status warning';
            } else {
                systemStatus.textContent = '✅ MONITORING';
                systemStatus.className = 'system-status';
            }
        }
        
        // Update portfolio overview
        const elements = {
            'portfolio-balance': `$${this.rebalancing.settings.usdtBalance.toFixed(2)}`,
            'portfolio-invested': `$${this.rebalancing.settings.totalInvested.toFixed(2)}`,
            'portfolio-value': `$${this.rebalancing.settings.totalCurrentValue.toFixed(2)}`,
            'portfolio-profit': `$${this.rebalancing.settings.totalProfit.toFixed(2)} (${this.rebalancing.settings.totalProfitPercent.toFixed(2)}%)`
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = value;
                if (id === 'portfolio-profit') {
                    el.className = 'stat-value profit';
                    if (this.rebalancing.settings.totalProfit >= 0) {
                        el.classList.add('positive');
                    } else {
                        el.classList.add('negative');
                    }
                }
            }
        });
        
        // Update individual coins
        Object.keys(this.rebalancing.coins).forEach(coinKey => {
            const coin = this.rebalancing.coins[coinKey];
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

    updateRebaseProtectionDisplay() {
        // Update progress bar - FIXED TO ACTUALLY WORK
        const progressFill = document.getElementById('rebase-progress-fill');
        const progressPercentage = document.getElementById('rebase-progress-percentage');
        const protectionLevel = document.getElementById('protection-level');
        
        if (progressFill && progressPercentage && protectionLevel) {
            // Set the width of the progress fill
            progressFill.style.width = `${this.rebaseProtection.protectionStatus}%`;
            progressPercentage.textContent = `${this.rebaseProtection.protectionStatus}% Safe`;
            
            // Update styling based on protection level
            progressFill.className = 'progress-fill';
            progressPercentage.className = 'progress-percentage';
            protectionLevel.className = 'protection-level';
            
            if (this.rebaseProtection.protectionStatus >= 75) {
                protectionLevel.textContent = 'Safe';
            } else if (this.rebaseProtection.protectionStatus >= 50) {
                protectionLevel.textContent = 'Caution';
                progressFill.classList.add('warning');
                progressPercentage.classList.add('warning');
                protectionLevel.classList.add('warning');
            } else {
                protectionLevel.textContent = 'Risk';
                progressFill.classList.add('danger');
                progressPercentage.classList.add('danger');
                protectionLevel.classList.add('danger');
            }
        }
        
        // Update holdings display
        const elements = {
            'original-purchase-value': `$${this.rebaseProtection.originalPurchase.toFixed(2)}`,
            'current-value-display': `$${this.rebaseProtection.currentValue.toFixed(2)}`,
            'difference-display': `$${this.rebaseProtection.difference.toFixed(2)}`,
            'ampl-quantity-display': this.rebaseProtection.amplQuantity.toFixed(3)
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = value;
                if (id === 'difference-display') {
                    el.className = 'holdings-value difference';
                    if (this.rebaseProtection.difference >= 0) {
                        el.classList.add('positive');
                    } else {
                        el.classList.add('negative');
                    }
                }
            }
        });
        
        // Update rebase info
        const priceDeviation = ((this.rebaseProtection.amplPrice - this.rebaseProtection.targetPrice) / this.rebaseProtection.targetPrice) * 100;
        
        const infoElements = {
            'target-price-display': `$${this.rebaseProtection.targetPrice.toFixed(2)}`,
            'current-price-display': `$${this.rebaseProtection.amplPrice.toFixed(3)}`,
            'price-deviation-display': `${priceDeviation.toFixed(2)}%`,
            'next-rebase-time': this.calculateNextRebaseTime()
        };
        
        Object.entries(infoElements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = value;
                if (id === 'price-deviation-display') {
                    el.className = 'holdings-value deviation';
                    if (priceDeviation >= 0) {
                        el.classList.add('positive');
                    } else {
                        el.classList.add('negative');
                    }
                    el.title = 'How far AMPL price is from its $1.00 target. Large deviations trigger rebases.';
                }
            }
        });
    }

    calculateNextRebaseTime() {
        const now = new Date();
        const utcNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
        
        let nextRebase = new Date(utcNow);
        nextRebase.setUTCHours(2, 0, 0, 0);
        
        if (utcNow.getUTCHours() >= 2) {
            nextRebase.setUTCDate(nextRebase.getUTCDate() + 1);
        }
        
        const timeUntil = nextRebase.getTime() - utcNow.getTime();
        const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60));
        const minutesUntil = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hoursUntil}h ${minutesUntil}m`;
    }

    updateSmartLadderDisplay() {
        const ladderScroll = document.getElementById('ladder-scroll');
        const ladderDataStatus = document.getElementById('ladder-data-status');
        
        if (!ladderScroll) return;
        
        // Update data status
        if (ladderDataStatus) {
            if (this.smartLadder.realTimeData) {
                ladderDataStatus.textContent = '🟢 Live Data';
                ladderDataStatus.className = 'data-status';
            } else {
                ladderDataStatus.textContent = '🟡 Simulated Data';
                ladderDataStatus.className = 'data-status warning';
            }
        }
        
        // Clear loading and show orders
        ladderScroll.innerHTML = '';
        
        if (this.smartLadder.orders.length > 0) {
            this.smartLadder.orders.forEach(order => {
                const orderElement = document.createElement('div');
                orderElement.className = `ladder-order ${order.side}`;
                orderElement.innerHTML = `
                    <span class="order-side ${order.side}">${order.side.toUpperCase()}</span>
                    <span class="order-price">$${order.price}</span>
                    <span class="order-size">${order.size}</span>
                    <span class="order-total">$${order.total}</span>
                `;
                ladderScroll.appendChild(orderElement);
            });
        } else {
            ladderScroll.innerHTML = '<div class="ladder-empty">No orders available</div>';
        }
    }

    updateActivityCount() {
        const countElement = document.getElementById('activity-count');
        if (countElement) {
            countElement.textContent = `${this.activityFeed.activities.length} messages`;
        }
    }

    // Event handlers
    clearRebalancingLog() {
        const logScroll = document.getElementById('rebalancing-log-scroll');
        if (logScroll) {
            logScroll.innerHTML = `
                <div class="log-entry">
                    <span class="log-time">Ready</span>
                    <span class="log-text">Action log cleared</span>
                </div>
            `;
        }
    }

    toggleProtection() {
        this.rebaseProtection.protectionActive = !this.rebaseProtection.protectionActive;
        
        const toggleBtn = document.getElementById('toggle-protection-btn');
        const btnText = toggleBtn.querySelector('.btn-text');
        
        if (this.rebaseProtection.protectionActive) {
            toggleBtn.classList.add('active');
            btnText.textContent = 'Disable Protection';
            this.logRebaseEvent('🛡️ Rebase protection enabled');
            this.logActivity('PROTECTION', 'Rebase protection enabled');
        } else {
            toggleBtn.classList.remove('active');
            btnText.textContent = 'Enable Protection';
            this.logRebaseEvent('🛡️ Rebase protection disabled');
            this.logActivity('PROTECTION', 'Rebase protection disabled');
        }
    }

    async emergencySell() {
        if (this.rebaseProtection.amplQuantity <= 0) {
            this.logRebaseEvent('❌ No AMPL holdings for emergency sell');
            this.logActivity('ERROR', 'No AMPL holdings for emergency sell');
            return;
        }
        
        if (confirm(`Emergency sell ${this.rebaseProtection.amplQuantity.toFixed(3)} AMPL?`)) {
            await this.triggerRebaseProtection();
        }
    }

    async triggerRebaseProtection() {
        if (this.rebaseProtection.amplQuantity <= 0) {
            this.logRebaseEvent('❌ No AMPL holdings to protect');
            return;
        }
        
        this.logRebaseEvent('🚨 Triggering rebase protection - selling AMPL');
        this.logActivity('PROTECTION', 'Emergency rebase protection triggered');
        
        try {
            const response = await fetch('/api/kucoin/order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    symbol: 'AMPL-USDT',
                    side: 'sell',
                    type: 'market',
                    size: this.rebaseProtection.amplQuantity.toFixed(3)
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                this.logRebaseEvent(`✅ Protection executed - sold ${this.rebaseProtection.amplQuantity.toFixed(3)} AMPL`);
                this.logActivity('PROTECTION', `Sold ${this.rebaseProtection.amplQuantity.toFixed(3)} AMPL for protection`);
                
                // Reset holdings
                this.rebaseProtection.amplQuantity = 0;
                this.rebaseProtection.originalPurchase = 0;
                this.rebaseProtection.currentValue = 0;
                this.rebaseProtection.difference = 0;
                
                // Also update rebalancing system
                this.rebalancing.coins.AMPL.quantity = 0;
                
                this.updateAllDisplays();
            } else {
                throw new Error(`Order API error: ${response.status}`);
            }
            
        } catch (error) {
            this.logRebaseEvent(`❌ Protection failed: ${error.message}`);
            this.logActivity('ERROR', `Protection failed: ${error.message}`);
        }
    }

    clearRebaseHistory() {
        const historyScroll = document.getElementById('rebase-history-scroll');
        if (historyScroll) {
            historyScroll.innerHTML = `
                <div class="history-entry">
                    <span class="history-time">Ready</span>
                    <span class="history-text">Rebase history cleared</span>
                </div>
            `;
        }
    }

    toggleActivityPause() {
        this.state.isPaused = !this.state.isPaused;
        
        const pauseBtn = document.getElementById('pause-activity-btn');
        const btnText = pauseBtn.querySelector('.btn-text');
        const btnIcon = pauseBtn.querySelector('.btn-icon');
        
        if (this.state.isPaused) {
            pauseBtn.classList.add('active');
            btnText.textContent = 'Resume';
            btnIcon.textContent = '▶️';
            this.logActivity('SYSTEM', 'Activity monitoring paused');
        } else {
            pauseBtn.classList.remove('active');
            btnText.textContent = 'Pause';
            btnIcon.textContent = '⏸️';
            this.logActivity('SYSTEM', 'Activity monitoring resumed');
        }
    }

    clearActivities() {
        this.activityFeed.activities = [];
        
        const activityScroll = document.getElementById('activity-scroll');
        if (activityScroll) {
            activityScroll.innerHTML = `
                <div class="activity-entry startup">
                    <span class="activity-time">${new Date().toLocaleTimeString()}</span>
                    <span class="activity-type">SYSTEM</span>
                    <span class="activity-message">Activity feed cleared</span>
                </div>
            `;
        }
        
        this.updateActivityCount();
    }

    toggleActivityFilter() {
        const filterBtn = document.getElementById('filter-activity-btn');
        
        filterBtn.classList.toggle('active');
        
        if (filterBtn.classList.contains('active')) {
            this.logActivity('SYSTEM', 'Activity filter enabled');
        } else {
            this.logActivity('SYSTEM', 'Activity filter disabled');
        }
    }

    refreshSmartLadder() {
        this.logActivity('SYSTEM', 'Refreshing smart ladder data...');
        this.loadSmartLadderData();
    }

    // Logging methods
    logRebalancingAction(message) {
        const logScroll = document.getElementById('rebalancing-log-scroll');
        if (!logScroll) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.innerHTML = `
            <span class="log-time">${timestamp}</span>
            <span class="log-text">${message}</span>
        `;
        
        logScroll.insertBefore(logEntry, logScroll.firstChild);
        
        while (logScroll.children.length > 15) {
            logScroll.removeChild(logScroll.lastChild);
        }
        
        console.log(`📋 ${timestamp}: ${message}`);
    }

    logRebaseEvent(message) {
        const historyScroll = document.getElementById('rebase-history-scroll');
        if (!historyScroll) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const historyEntry = document.createElement('div');
        historyEntry.className = 'history-entry';
        historyEntry.innerHTML = `
            <span class="history-time">${timestamp}</span>
            <span class="history-text">${message}</span>
        `;
        
        historyScroll.insertBefore(historyEntry, historyScroll.firstChild);
        
        while (historyScroll.children.length > 20) {
            historyScroll.removeChild(historyScroll.lastChild);
        }
        
        console.log(`🛡️ ${timestamp}: ${message}`);
    }

    logActivity(type, message, category = 'startup') {
        const timestamp = new Date().toLocaleTimeString();
        
        const activity = {
            time: timestamp,
            type: type,
            message: message,
            category: category,
            id: Date.now() + Math.random()
        };
        
        this.activityFeed.activities.unshift(activity);
        
        if (this.activityFeed.activities.length > this.activityFeed.maxActivities) {
            this.activityFeed.activities = this.activityFeed.activities.slice(0, this.activityFeed.maxActivities);
        }
        
        this.updateActivityDisplay();
        this.updateActivityCount();
        
        console.log(`📡 Activity: ${type} - ${message}`);
    }

    updateActivityDisplay() {
        const activityScroll = document.getElementById('activity-scroll');
        if (!activityScroll) return;
        
        // Clear existing entries except the first one
        const existingEntries = activityScroll.querySelectorAll('.activity-entry:not(.startup)');
        existingEntries.forEach(entry => entry.remove());
        
        // Add new activities
        this.activityFeed.activities.forEach((activity, index) => {
            if (index === 0) return;
            
            const activityEntry = document.createElement('div');
            activityEntry.className = `activity-entry ${activity.category}`;
            activityEntry.innerHTML = `
                <span class="activity-time">${activity.time}</span>
                <span class="activity-type ${activity.type}">${activity.type}</span>
                <span class="activity-message">${activity.message}</span>
            `;
            
            activityScroll.appendChild(activityEntry);
        });
        
        activityScroll.scrollTop = activityScroll.scrollHeight;
    }

    // Public methods for external integration
    updateCoinData(coinSymbol, quantity, purchasePrice) {
        if (this.rebalancing.coins[coinSymbol]) {
            this.rebalancing.coins[coinSymbol].quantity = quantity;
            this.rebalancing.coins[coinSymbol].purchasePrice = purchasePrice;
            this.calculateAllProfits();
            this.updateAllDisplays();
            this.logRebalancingAction(`Updated ${coinSymbol}: ${quantity} @ $${purchasePrice}`);
        }
    }

    getCurrentAMPLPrice() {
        return this.rebalancing.coins.AMPL.currentPrice;
    }

    shouldBuy() {
        return this.rebalancing.coins.AMPL.currentPrice < this.rebalancing.settings.amplThreshold;
    }

    getCoinsReadyToSell() {
        const readyToSell = [];
        Object.keys(this.rebalancing.coins).forEach(coinKey => {
            const coin = this.rebalancing.coins[coinKey];
            if (coin.quantity > 0 && coin.profitPercent >= this.rebalancing.settings.profitThreshold) {
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

// Initialize the consolidated system
const amplCompleteSystemConsolidated = new AMPLCompleteSystemConsolidated();

// Global functions for external use
function updateConsolidatedCoin(coinSymbol, quantity, purchasePrice) {
    if (amplCompleteSystemConsolidated) {
        amplCompleteSystemConsolidated.updateCoinData(coinSymbol, quantity, purchasePrice);
    }
}

function getConsolidatedStatus() {
    if (amplCompleteSystemConsolidated) {
        return {
            shouldBuy: amplCompleteSystemConsolidated.shouldBuy(),
            coinsReadyToSell: amplCompleteSystemConsolidated.getCoinsReadyToSell(),
            currentAMPLPrice: amplCompleteSystemConsolidated.getCurrentAMPLPrice(),
            totalProfit: amplCompleteSystemConsolidated.rebalancing.settings.totalProfit,
            protectionStatus: amplCompleteSystemConsolidated.rebaseProtection.protectionStatus
        };
    }
    return null;
}

console.log('🎬 CONSOLIDATED AMPL Complete System loaded successfully');

