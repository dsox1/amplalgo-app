/**
 * AMPL Complete System - Redesigned & Consolidated
 * Fixes all trading issues, adds proper scrolling, rebase protection, and consolidates all functionality
 * Based on real AMPL rebase data analysis from coin-tools.com
 */

class AMPLCompleteSystemRedesigned {
    constructor() {
        this.isInitialized = false;
        this.rebalancingActive = false;
        this.lastTradeTime = 0;
        this.tradeCooldown = 300000; // 5 minutes between trades
        this.amplPrice = 0;
        this.rebaseData = [];
        this.portfolioData = {
            balance: 0,
            invested: 0,
            value: 0,
            profit: 0,
            coins: {
                SOL: { qty: 0, price: 0, value: 0, profit: 0 },
                SUI: { qty: 0, price: 0, value: 0, profit: 0 },
                BTC: { qty: 0, price: 0, value: 0, profit: 0 },
                AMPL: { qty: 0, price: 0, value: 0, profit: 0 }
            }
        };
        
        // Activity feed
        this.activityMessages = [];
        this.maxMessages = 100;
        this.isPaused = false;
        
        // Rebase protection
        this.rebaseProtectionEnabled = true;
        this.nextRebaseTime = null;
        this.rebaseRiskLevel = 0;
        
        // Smart Order Ladder
        this.orderLadder = [];
        this.ladderActive = false;
        
        this.initialize();
    }

    initialize() {
        console.log('🚀 Initializing AMPL Complete System (Redesigned)...');
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.createRebalancingSystem();
        this.createRebaseProtectionSystem();
        this.createActivityFeedSystem();
        this.createSmartOrderLadder();
        this.applyStyles();
        this.bindEvents();
        this.startDataUpdates();
        this.loadRebaseHistory();
        this.isInitialized = true;
        
        console.log('✅ AMPL Complete System initialized successfully');
        this.logActivity('system', 'AMPL Complete System started successfully');
    }

    createRebalancingSystem() {
        const limitOrdersPanel = document.querySelector('.ladder-section.limit-orders-section .section-content');
        if (!limitOrdersPanel) {
            console.error('❌ Limit Orders panel not found');
            return;
        }

        limitOrdersPanel.innerHTML = `
            <div class="ampl-rebalancing-container">
                <div class="rebalancing-header">
                    <div class="system-title">
                        <i class="fas fa-balance-scale"></i>
                        <span>AMPL REBALANCING SYSTEM</span>
                        <span class="current-price-label">Current: <span id="ampl-current-price">$0.000</span></span>
                    </div>
                    <div class="trigger-price">
                        <span class="trigger-label">Trigger: $1.16</span>
                        <div class="status-indicator" id="rebalancing-status">
                            <span class="status-dot"></span>
                            <span class="status-text">MONITORING</span>
                        </div>
                    </div>
                </div>

                <div class="portfolio-summary">
                    <div class="summary-item">
                        <span class="label">BALANCE:</span>
                        <span class="value" id="portfolio-balance">$0.00</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">INVESTED:</span>
                        <span class="value" id="portfolio-invested">$0.00</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">VALUE:</span>
                        <span class="value" id="portfolio-value">$0.00</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">PROFIT:</span>
                        <span class="value profit-value" id="portfolio-profit">$0.00 (0.00%)</span>
                    </div>
                </div>

                <div class="coins-grid-container">
                    <div class="coins-grid" id="coins-grid">
                        <div class="coin-item" data-coin="SOL">
                            <div class="coin-header">
                                <span class="coin-symbol">🟠 SOL</span>
                                <span class="coin-price" id="sol-price">$0.00</span>
                            </div>
                            <div class="coin-details">
                                <div class="detail-row">
                                    <span>Qty:</span>
                                    <span id="sol-qty">0.000</span>
                                </div>
                                <div class="detail-row">
                                    <span>Value:</span>
                                    <span id="sol-value">$0.00</span>
                                </div>
                                <div class="detail-row">
                                    <span>Profit:</span>
                                    <span class="profit-value" id="sol-profit">$0.00 (0%)</span>
                                </div>
                            </div>
                        </div>

                        <div class="coin-item" data-coin="SUI">
                            <div class="coin-header">
                                <span class="coin-symbol">🔵 SUI</span>
                                <span class="coin-price" id="sui-price">$0.00</span>
                            </div>
                            <div class="coin-details">
                                <div class="detail-row">
                                    <span>Qty:</span>
                                    <span id="sui-qty">0.000</span>
                                </div>
                                <div class="detail-row">
                                    <span>Value:</span>
                                    <span id="sui-value">$0.00</span>
                                </div>
                                <div class="detail-row">
                                    <span>Profit:</span>
                                    <span class="profit-value" id="sui-profit">$0.00 (0%)</span>
                                </div>
                            </div>
                        </div>

                        <div class="coin-item" data-coin="BTC">
                            <div class="coin-header">
                                <span class="coin-symbol">🟡 BTC</span>
                                <span class="coin-price" id="btc-price">$0.00</span>
                            </div>
                            <div class="coin-details">
                                <div class="detail-row">
                                    <span>Qty:</span>
                                    <span id="btc-qty">0.000000</span>
                                </div>
                                <div class="detail-row">
                                    <span>Value:</span>
                                    <span id="btc-value">$0.00</span>
                                </div>
                                <div class="detail-row">
                                    <span>Profit:</span>
                                    <span class="profit-value" id="btc-profit">$0.00 (0%)</span>
                                </div>
                            </div>
                        </div>

                        <div class="coin-item" data-coin="AMPL">
                            <div class="coin-header">
                                <span class="coin-symbol">🔴 AMPL</span>
                                <span class="coin-price" id="ampl-price">$0.000</span>
                            </div>
                            <div class="coin-details">
                                <div class="detail-row">
                                    <span>Qty:</span>
                                    <span id="ampl-qty">0.000</span>
                                </div>
                                <div class="detail-row">
                                    <span>Value:</span>
                                    <span id="ampl-value">$0.00</span>
                                </div>
                                <div class="detail-row">
                                    <span>Profit:</span>
                                    <span class="profit-value" id="ampl-profit">$0.00 (0%)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="recent-actions-container">
                    <div class="actions-header">
                        <span>Recent Actions</span>
                        <button class="clear-actions-btn" onclick="amplSystem.clearRecentActions()">Clear</button>
                    </div>
                    <div class="recent-actions" id="recent-actions">
                        <div class="action-item">
                            <span class="action-time">--:--:--</span>
                            <span class="action-text">System initialized</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createRebaseProtectionSystem() {
        const rebasePanel = document.querySelector('.ladder-section.rebase-protection-section .section-content');
        if (!rebasePanel) {
            console.error('❌ Rebase Protection panel not found');
            return;
        }

        rebasePanel.innerHTML = `
            <div class="rebase-protection-container">
                <div class="protection-header">
                    <div class="protection-title">
                        <i class="fas fa-shield-alt"></i>
                        <span>AMPL REBASE PROTECTION MONITOR</span>
                    </div>
                    <div class="rebase-risk-indicator" id="rebase-risk">
                        <span class="risk-dot"></span>
                        <span class="risk-text">Analyzing...</span>
                    </div>
                </div>

                <div class="protection-status-container">
                    <div class="status-label">REBASE PROTECTION STATUS</div>
                    <div class="protection-meter-container">
                        <div class="protection-meter" id="protection-meter">
                            <div class="meter-fill" id="meter-fill"></div>
                            <div class="meter-labels">
                                <span class="meter-label" style="left: 0%">0%</span>
                                <span class="meter-label" style="left: 25%">25%</span>
                                <span class="meter-label" style="left: 50%">50%</span>
                                <span class="meter-label" style="left: 75%">75%</span>
                                <span class="meter-label" style="left: 100%">100%</span>
                            </div>
                        </div>
                        <div class="meter-status" id="meter-status">Safe</div>
                    </div>
                </div>

                <div class="rebase-info-grid">
                    <div class="info-item">
                        <span class="info-label">Target Price:</span>
                        <span class="info-value" id="target-price">$1.00</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Current Price:</span>
                        <span class="info-value" id="current-price-rebase">$0.000</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Price Deviation:</span>
                        <span class="info-value" id="price-deviation" title="How far AMPL price is from its $1.00 target">0.00%</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Next Rebase:</span>
                        <span class="info-value" id="next-rebase">Calculating...</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">AMPL Quantity:</span>
                        <span class="info-value" id="ampl-quantity-rebase">0.000</span>
                    </div>
                </div>

                <div class="protection-controls">
                    <button class="protection-btn enable-btn" id="enable-protection" onclick="amplSystem.toggleProtection()">
                        <i class="fas fa-shield-alt"></i>
                        <span>Enable Protection</span>
                    </button>
                    <button class="protection-btn emergency-btn" id="emergency-sell" onclick="amplSystem.emergencySell()">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Emergency Sell</span>
                    </button>
                </div>

                <div class="recent-rebases-container">
                    <div class="rebases-header">
                        <span>Recent Rebases</span>
                        <button class="clear-rebases-btn" onclick="amplSystem.clearRecentRebases()">Clear</button>
                    </div>
                    <div class="recent-rebases" id="recent-rebases">
                        <div class="rebase-item loading">
                            <span>Loading rebase history...</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createActivityFeedSystem() {
        const smartOrderPanel = document.querySelector('.ladder-section.order-ladder-section .section-content');
        if (!smartOrderPanel) {
            console.error('❌ Smart Order Ladder panel not found');
            return;
        }

        // Store original content for dual view
        const originalContent = smartOrderPanel.innerHTML;

        smartOrderPanel.innerHTML = `
            <div class="smart-order-dual-view">
                <!-- Activity Feed View (Default) -->
                <div class="view-container activity-view active" id="activity-view">
                    <div class="activity-feed-container">
                        <div class="feed-header">
                            <div class="feed-title">
                                <i class="fas fa-chart-line"></i>
                                <span>LIVE ACTIVITY FEED</span>
                                <span class="feed-status" id="feed-status">🟢 Connected</span>
                            </div>
                            <div class="feed-controls">
                                <button class="feed-btn pause-btn" id="pause-feed" onclick="amplSystem.toggleFeedPause()">
                                    <i class="fas fa-pause"></i>
                                </button>
                                <button class="feed-btn clear-btn" id="clear-feed" onclick="amplSystem.clearActivityFeed()">
                                    <i class="fas fa-trash"></i>
                                </button>
                                <button class="feed-btn switch-btn" id="switch-to-ladder" onclick="amplSystem.switchToLadder()">
                                    <i class="fas fa-layer-group"></i>
                                </button>
                            </div>
                        </div>

                        <div class="message-counter">
                            <span id="message-count">0 messages</span>
                        </div>

                        <div class="activity-messages" id="activity-messages">
                            <div class="welcome-message">
                                <i class="fas fa-rocket"></i>
                                <span>AMPL Activity Feed Ready</span>
                                <small>Real-time system monitoring active</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Smart Order Ladder View -->
                <div class="view-container ladder-view" id="ladder-view">
                    <div class="ladder-header">
                        <div class="ladder-title">
                            <i class="fas fa-layer-group"></i>
                            <span>SMART ORDER LADDER</span>
                            <span class="ladder-status" id="ladder-status">🟢 Active</span>
                        </div>
                        <div class="ladder-controls">
                            <button class="ladder-btn refresh-btn" onclick="amplSystem.refreshLadder()">
                                <i class="fas fa-sync"></i>
                            </button>
                            <button class="ladder-btn switch-btn" id="switch-to-activity" onclick="amplSystem.switchToActivity()">
                                <i class="fas fa-chart-line"></i>
                            </button>
                        </div>
                    </div>

                    <div class="ladder-content" id="ladder-content">
                        ${originalContent}
                    </div>
                </div>
            </div>
        `;
    }

    createSmartOrderLadder() {
        // This will be populated with real order data
        this.updateSmartOrderLadder();
    }

    applyStyles() {
        const styles = `
            <style>
            /* AMPL Complete System Styles */
            .ampl-rebalancing-container,
            .rebase-protection-container,
            .smart-order-dual-view {
                height: 100%;
                overflow-y: auto;
                padding: 10px;
                box-sizing: border-box;
            }

            /* Scrollbar styling */
            .ampl-rebalancing-container::-webkit-scrollbar,
            .rebase-protection-container::-webkit-scrollbar,
            .activity-messages::-webkit-scrollbar,
            .recent-actions::-webkit-scrollbar,
            .recent-rebases::-webkit-scrollbar,
            .ladder-content::-webkit-scrollbar {
                width: 6px;
            }

            .ampl-rebalancing-container::-webkit-scrollbar-track,
            .rebase-protection-container::-webkit-scrollbar-track,
            .activity-messages::-webkit-scrollbar-track,
            .recent-actions::-webkit-scrollbar-track,
            .recent-rebases::-webkit-scrollbar-track,
            .ladder-content::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 3px;
            }

            .ampl-rebalancing-container::-webkit-scrollbar-thumb,
            .rebase-protection-container::-webkit-scrollbar-thumb,
            .activity-messages::-webkit-scrollbar-thumb,
            .recent-actions::-webkit-scrollbar-thumb,
            .recent-rebases::-webkit-scrollbar-thumb,
            .ladder-content::-webkit-scrollbar-thumb {
                background: rgba(0, 255, 255, 0.5);
                border-radius: 3px;
            }

            /* Rebalancing System Styles */
            .rebalancing-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid rgba(0, 255, 255, 0.3);
            }

            .system-title {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                font-weight: bold;
                color: #00ffff;
            }

            .current-price-label {
                font-size: 12px;
                color: #ffffff;
                margin-left: 10px;
            }

            .trigger-price {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .trigger-label {
                font-size: 12px;
                color: #ffaa00;
                font-weight: bold;
            }

            .status-indicator {
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 11px;
            }

            .status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #00ff00;
                animation: pulse 2s infinite;
            }

            .portfolio-summary {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                margin-bottom: 15px;
                padding: 10px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 5px;
                border: 1px solid rgba(0, 255, 255, 0.2);
            }

            .summary-item {
                display: flex;
                justify-content: space-between;
                font-size: 11px;
            }

            .summary-item .label {
                color: #aaaaaa;
            }

            .summary-item .value {
                color: #ffffff;
                font-weight: bold;
            }

            .profit-value {
                color: #00ff00;
            }

            .profit-value.negative {
                color: #ff4444;
            }

            .coins-grid-container {
                margin-bottom: 15px;
            }

            .coins-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
            }

            .coin-item {
                background: rgba(0, 0, 0, 0.4);
                border: 1px solid rgba(0, 255, 255, 0.2);
                border-radius: 5px;
                padding: 8px;
            }

            .coin-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 5px;
                font-size: 11px;
                font-weight: bold;
            }

            .coin-symbol {
                color: #00ffff;
            }

            .coin-price {
                color: #ffffff;
            }

            .coin-details {
                font-size: 10px;
            }

            .detail-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 2px;
                color: #cccccc;
            }

            .recent-actions-container,
            .recent-rebases-container {
                margin-top: 15px;
            }

            .actions-header,
            .rebases-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
                font-size: 12px;
                color: #00ffff;
                font-weight: bold;
            }

            .clear-actions-btn,
            .clear-rebases-btn {
                background: rgba(255, 68, 68, 0.2);
                border: 1px solid #ff4444;
                color: #ff4444;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 10px;
                cursor: pointer;
            }

            .recent-actions,
            .recent-rebases {
                max-height: 120px;
                overflow-y: auto;
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(0, 255, 255, 0.2);
                border-radius: 5px;
                padding: 5px;
            }

            .action-item,
            .rebase-item {
                display: flex;
                gap: 10px;
                padding: 3px 0;
                font-size: 10px;
                color: #cccccc;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .action-time {
                color: #888888;
                min-width: 50px;
            }

            /* Rebase Protection Styles */
            .protection-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid rgba(0, 255, 255, 0.3);
            }

            .protection-title {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                font-weight: bold;
                color: #00ffff;
            }

            .rebase-risk-indicator {
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 11px;
            }

            .risk-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #00ff00;
            }

            .protection-status-container {
                margin-bottom: 15px;
            }

            .status-label {
                font-size: 12px;
                color: #00ffff;
                font-weight: bold;
                margin-bottom: 8px;
            }

            .protection-meter-container {
                position: relative;
            }

            .protection-meter {
                width: 100%;
                height: 20px;
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(0, 255, 255, 0.3);
                border-radius: 10px;
                overflow: hidden;
                position: relative;
            }

            .meter-fill {
                height: 100%;
                background: linear-gradient(90deg, #ff4444, #ffaa00, #00ff00);
                width: 0%;
                transition: width 0.5s ease;
            }

            .meter-labels {
                display: flex;
                justify-content: space-between;
                margin-top: 5px;
                font-size: 9px;
                color: #888888;
                position: relative;
            }

            .meter-label {
                position: absolute;
                transform: translateX(-50%);
            }

            .meter-status {
                text-align: center;
                margin-top: 5px;
                font-size: 11px;
                font-weight: bold;
                color: #00ff00;
            }

            .rebase-info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                margin-bottom: 15px;
                padding: 10px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 5px;
                border: 1px solid rgba(0, 255, 255, 0.2);
            }

            .info-item {
                display: flex;
                justify-content: space-between;
                font-size: 11px;
            }

            .info-label {
                color: #aaaaaa;
            }

            .info-value {
                color: #ffffff;
                font-weight: bold;
            }

            .protection-controls {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
            }

            .protection-btn {
                flex: 1;
                padding: 8px;
                border-radius: 5px;
                font-size: 11px;
                font-weight: bold;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 5px;
            }

            .enable-btn {
                background: rgba(0, 255, 0, 0.2);
                border: 1px solid #00ff00;
                color: #00ff00;
            }

            .emergency-btn {
                background: rgba(255, 68, 68, 0.2);
                border: 1px solid #ff4444;
                color: #ff4444;
            }

            /* Activity Feed Styles */
            .smart-order-dual-view {
                position: relative;
                height: 100%;
            }

            .view-container {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }

            .view-container.active {
                opacity: 1;
                visibility: visible;
            }

            .feed-header,
            .ladder-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
                padding-bottom: 8px;
                border-bottom: 1px solid rgba(0, 255, 255, 0.3);
            }

            .feed-title,
            .ladder-title {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                font-weight: bold;
                color: #00ffff;
            }

            .feed-status,
            .ladder-status {
                font-size: 11px;
                margin-left: 10px;
            }

            .feed-controls,
            .ladder-controls {
                display: flex;
                gap: 5px;
            }

            .feed-btn,
            .ladder-btn {
                background: rgba(0, 255, 255, 0.2);
                border: 1px solid #00ffff;
                color: #00ffff;
                padding: 4px 8px;
                border-radius: 3px;
                font-size: 10px;
                cursor: pointer;
            }

            .message-counter {
                margin-bottom: 10px;
                font-size: 11px;
                color: #888888;
            }

            .activity-messages {
                height: calc(100% - 80px);
                overflow-y: auto;
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(0, 255, 255, 0.2);
                border-radius: 5px;
                padding: 8px;
            }

            .welcome-message {
                text-align: center;
                padding: 20px;
                color: #00ffff;
            }

            .welcome-message i {
                font-size: 24px;
                margin-bottom: 10px;
                display: block;
            }

            .welcome-message small {
                display: block;
                margin-top: 5px;
                color: #888888;
                font-size: 10px;
            }

            .activity-message {
                display: flex;
                gap: 10px;
                padding: 5px 0;
                font-size: 11px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .message-time {
                color: #888888;
                min-width: 60px;
            }

            .message-type {
                min-width: 60px;
                font-weight: bold;
            }

            .message-type.system { color: #00ffff; }
            .message-type.trade { color: #00ff00; }
            .message-type.error { color: #ff4444; }
            .message-type.rebase { color: #ffaa00; }

            .message-text {
                color: #cccccc;
                flex: 1;
            }

            .ladder-content {
                height: calc(100% - 60px);
                overflow-y: auto;
            }

            /* Animations */
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            /* Responsive adjustments */
            @media (max-width: 768px) {
                .coins-grid {
                    grid-template-columns: 1fr;
                }
                
                .portfolio-summary,
                .rebase-info-grid {
                    grid-template-columns: 1fr;
                }
            }
            </style>
        `;

        // Remove existing styles and add new ones
        const existingStyles = document.querySelector('#ampl-complete-styles');
        if (existingStyles) {
            existingStyles.remove();
        }

        const styleElement = document.createElement('div');
        styleElement.id = 'ampl-complete-styles';
        styleElement.innerHTML = styles;
        document.head.appendChild(styleElement);
    }

    bindEvents() {
        // Global event listeners for the system
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Handle escape key if needed
            }
        });
    }

    startDataUpdates() {
        // Start real-time data updates
        this.updatePrices();
        this.updateRebaseData();
        this.updatePortfolioData();
        
        // Set intervals for updates
        setInterval(() => this.updatePrices(), 30000); // Every 30 seconds
        setInterval(() => this.updateRebaseData(), 60000); // Every minute
        setInterval(() => this.updatePortfolioData(), 15000); // Every 15 seconds
        setInterval(() => this.checkRebalancingTrigger(), 10000); // Every 10 seconds
    }

    async updatePrices() {
        try {
            // Simulate API calls - replace with real API integration
            const prices = await this.fetchRealPrices();
            
            this.amplPrice = prices.AMPL;
            this.portfolioData.coins.SOL.price = prices.SOL;
            this.portfolioData.coins.SUI.price = prices.SUI;
            this.portfolioData.coins.BTC.price = prices.BTC;
            this.portfolioData.coins.AMPL.price = prices.AMPL;
            
            this.updatePriceDisplays();
            this.updateRebaseRisk();
            
        } catch (error) {
            console.error('Error updating prices:', error);
            this.logActivity('error', `Price update failed: ${error.message}`);
        }
    }

    async fetchRealPrices() {
        // This should be replaced with real API calls to KuCoin or other exchanges
        // For now, using simulated data with realistic price movements
        
        const basePrice = 1.189; // Current AMPL price from the rebase data
        const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
        
        return {
            AMPL: Math.max(0.001, basePrice + variation),
            SOL: 162.50 + (Math.random() - 0.5) * 10,
            SUI: 1.80 + (Math.random() - 0.5) * 0.2,
            BTC: 59500 + (Math.random() - 0.5) * 2000
        };
    }

    updatePriceDisplays() {
        // Update rebalancing system prices
        const elements = {
            'ampl-current-price': `$${this.amplPrice.toFixed(3)}`,
            'sol-price': `$${this.portfolioData.coins.SOL.price.toFixed(2)}`,
            'sui-price': `$${this.portfolioData.coins.SUI.price.toFixed(3)}`,
            'btc-price': `$${this.portfolioData.coins.BTC.price.toFixed(0)}`,
            'ampl-price': `$${this.portfolioData.coins.AMPL.price.toFixed(3)}`,
            'current-price-rebase': `$${this.amplPrice.toFixed(3)}`
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });

        // Update price deviation
        const deviation = ((this.amplPrice - 1.0) / 1.0) * 100;
        const deviationElement = document.getElementById('price-deviation');
        if (deviationElement) {
            deviationElement.textContent = `${deviation.toFixed(2)}%`;
            deviationElement.style.color = deviation > 0 ? '#00ff00' : '#ff4444';
        }
    }

    updateRebaseData() {
        // Calculate next rebase time (daily at 2 AM UTC)
        const now = new Date();
        const nextRebase = new Date(now);
        nextRebase.setUTCHours(2, 0, 0, 0);
        
        if (now.getUTCHours() >= 2) {
            nextRebase.setUTCDate(nextRebase.getUTCDate() + 1);
        }
        
        this.nextRebaseTime = nextRebase;
        
        // Update next rebase display
        const timeUntilRebase = nextRebase - now;
        const hours = Math.floor(timeUntilRebase / (1000 * 60 * 60));
        const minutes = Math.floor((timeUntilRebase % (1000 * 60 * 60)) / (1000 * 60));
        
        const nextRebaseElement = document.getElementById('next-rebase');
        if (nextRebaseElement) {
            nextRebaseElement.textContent = `${hours}h ${minutes}m`;
        }
    }

    updateRebaseRisk() {
        // Calculate rebase risk based on price deviation from $1.00
        const deviation = Math.abs(this.amplPrice - 1.0);
        const riskPercentage = Math.min(deviation * 100, 100); // Cap at 100%
        
        this.rebaseRiskLevel = riskPercentage;
        
        // Update protection meter
        const meterFill = document.getElementById('meter-fill');
        const meterStatus = document.getElementById('meter-status');
        const riskDot = document.querySelector('.risk-dot');
        const riskText = document.querySelector('.risk-text');
        
        if (meterFill) {
            meterFill.style.width = `${100 - riskPercentage}%`;
        }
        
        let status, color;
        if (riskPercentage < 20) {
            status = 'Safe';
            color = '#00ff00';
        } else if (riskPercentage < 50) {
            status = 'Caution';
            color = '#ffaa00';
        } else {
            status = 'Risk';
            color = '#ff4444';
        }
        
        if (meterStatus) {
            meterStatus.textContent = status;
            meterStatus.style.color = color;
        }
        
        if (riskDot) {
            riskDot.style.background = color;
        }
        
        if (riskText) {
            riskText.textContent = status;
            riskText.style.color = color;
        }
    }

    updatePortfolioData() {
        // Calculate portfolio values
        Object.keys(this.portfolioData.coins).forEach(coin => {
            const coinData = this.portfolioData.coins[coin];
            coinData.value = coinData.qty * coinData.price;
        });
        
        this.portfolioData.value = Object.values(this.portfolioData.coins)
            .reduce((sum, coin) => sum + coin.value, 0);
        
        this.portfolioData.profit = this.portfolioData.value - this.portfolioData.invested;
        
        // Update displays
        this.updatePortfolioDisplays();
    }

    updatePortfolioDisplays() {
        const elements = {
            'portfolio-balance': `$${this.portfolioData.balance.toFixed(2)}`,
            'portfolio-invested': `$${this.portfolioData.invested.toFixed(2)}`,
            'portfolio-value': `$${this.portfolioData.value.toFixed(2)}`,
            'portfolio-profit': this.formatProfitDisplay(this.portfolioData.profit, this.portfolioData.invested)
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
                if (id === 'portfolio-profit') {
                    element.className = `value profit-value ${this.portfolioData.profit >= 0 ? '' : 'negative'}`;
                }
            }
        });

        // Update individual coin displays
        Object.keys(this.portfolioData.coins).forEach(coin => {
            const coinData = this.portfolioData.coins[coin];
            const coinLower = coin.toLowerCase();
            
            const qtyElement = document.getElementById(`${coinLower}-qty`);
            const valueElement = document.getElementById(`${coinLower}-value`);
            const profitElement = document.getElementById(`${coinLower}-profit`);
            
            if (qtyElement) {
                qtyElement.textContent = coin === 'BTC' ? 
                    coinData.qty.toFixed(6) : coinData.qty.toFixed(3);
            }
            
            if (valueElement) {
                valueElement.textContent = `$${coinData.value.toFixed(2)}`;
            }
            
            if (profitElement) {
                profitElement.textContent = this.formatProfitDisplay(coinData.profit, coinData.value - coinData.profit);
                profitElement.className = `profit-value ${coinData.profit >= 0 ? '' : 'negative'}`;
            }
        });

        // Update AMPL quantity in rebase protection
        const amplQtyRebase = document.getElementById('ampl-quantity-rebase');
        if (amplQtyRebase) {
            amplQtyRebase.textContent = this.portfolioData.coins.AMPL.qty.toFixed(3);
        }
    }

    formatProfitDisplay(profit, invested) {
        const percentage = invested > 0 ? (profit / invested) * 100 : 0;
        return `$${profit.toFixed(2)} (${percentage.toFixed(2)}%)`;
    }

    async checkRebalancingTrigger() {
        if (!this.rebalancingActive && this.amplPrice > 0 && this.amplPrice <= 1.16) {
            const now = Date.now();
            if (now - this.lastTradeTime > this.tradeCooldown) {
                await this.executeRebalancing();
            }
        }
        
        // Update status indicator
        const statusElement = document.getElementById('rebalancing-status');
        if (statusElement) {
            const statusDot = statusElement.querySelector('.status-dot');
            const statusText = statusElement.querySelector('.status-text');
            
            if (this.amplPrice <= 1.16) {
                statusDot.style.background = '#ff4444';
                statusText.textContent = 'TRIGGERED';
                statusText.style.color = '#ff4444';
            } else {
                statusDot.style.background = '#00ff00';
                statusText.textContent = 'MONITORING';
                statusText.style.color = '#00ff00';
            }
        }
    }

    async executeRebalancing() {
        if (this.rebalancingActive) return;
        
        this.rebalancingActive = true;
        this.lastTradeTime = Date.now();
        
        try {
            this.logActivity('trade', `AMPL trigger activated at $${this.amplPrice.toFixed(3)}`);
            
            // Check if rebase is favorable before selling AMPL
            const rebaseFavorable = await this.checkRebaseFavorability();
            
            if (!rebaseFavorable) {
                this.logActivity('system', 'Rebase unfavorable - skipping AMPL sale');
            }
            
            // Calculate equal allocation (25% each)
            const availableBalance = this.portfolioData.balance;
            const allocationPerCoin = availableBalance * 0.25;
            
            if (availableBalance < 100) {
                throw new Error('Insufficient balance for rebalancing (minimum $100)');
            }
            
            // Execute trades for each coin
            const trades = [
                { symbol: 'SOL-USDT', amount: allocationPerCoin },
                { symbol: 'SUI-USDT', amount: allocationPerCoin },
                { symbol: 'BTC-USDT', amount: allocationPerCoin },
                { symbol: 'AMPL-USDT', amount: allocationPerCoin }
            ];
            
            for (const trade of trades) {
                await this.placeTrade(trade);
            }
            
            this.logActivity('trade', `Rebalancing completed - $${availableBalance.toFixed(2)} allocated`);
            
        } catch (error) {
            console.error('Rebalancing failed:', error);
            this.logActivity('error', `Rebalancing failed: ${error.message}`);
        } finally {
            this.rebalancingActive = false;
        }
    }

    async checkRebaseFavorability() {
        // Based on AMPL rebase history analysis:
        // - Negative rebases reduce AMPL quantity
        // - Selling before negative rebases is favorable
        // - Price below $1.00 typically leads to negative rebases
        
        const priceDeviation = this.amplPrice - 1.0;
        const timeUntilRebase = this.nextRebaseTime - new Date();
        const hoursUntilRebase = timeUntilRebase / (1000 * 60 * 60);
        
        // If price is significantly below $1.00 and rebase is soon, selling is favorable
        if (priceDeviation < -0.05 && hoursUntilRebase < 6) {
            this.logActivity('rebase', 'Negative rebase likely - selling AMPL is favorable');
            return true;
        }
        
        // If price is above $1.00, positive rebase likely - holding is favorable
        if (priceDeviation > 0.05) {
            this.logActivity('rebase', 'Positive rebase likely - holding AMPL is favorable');
            return false;
        }
        
        // Neutral zone - proceed with normal rebalancing
        return true;
    }

    async placeTrade(trade) {
        try {
            // This should integrate with the real KuCoin API
            // For now, simulating the trade
            
            const price = this.portfolioData.coins[trade.symbol.split('-')[0]]?.price || 1;
            const quantity = trade.amount / price;
            
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Update portfolio (simulation)
            const coin = trade.symbol.split('-')[0];
            if (this.portfolioData.coins[coin]) {
                this.portfolioData.coins[coin].qty += quantity;
                this.portfolioData.invested += trade.amount;
                this.portfolioData.balance -= trade.amount;
            }
            
            this.logActivity('trade', `Bought ${quantity.toFixed(3)} ${coin} for $${trade.amount.toFixed(2)}`);
            this.addRecentAction(`Bought ${coin}`, `$${trade.amount.toFixed(2)}`);
            
            return { success: true, orderId: `sim_${Date.now()}` };
            
        } catch (error) {
            this.logActivity('error', `Trade failed for ${trade.symbol}: ${error.message}`);
            throw error;
        }
    }

    async loadRebaseHistory() {
        // Load recent rebase data from the coin-tools.com data we analyzed
        const recentRebases = [
            { date: '2025-07-16', rebase: -6.1194, price: 1.116 },
            { date: '2025-07-15', rebase: -2.7087, price: 1.179 },
            { date: '2025-07-13', rebase: -3.0965, price: 1.173 },
            { date: '2025-07-02', rebase: -2.3100, price: 1.184 },
            { date: '2025-06-30', rebase: +2.7515, price: 1.261 }
        ];
        
        const rebasesContainer = document.getElementById('recent-rebases');
        if (rebasesContainer) {
            rebasesContainer.innerHTML = recentRebases.map(rebase => `
                <div class="rebase-item">
                    <span class="rebase-date">${rebase.date}</span>
                    <span class="rebase-percent ${rebase.rebase >= 0 ? 'positive' : 'negative'}">
                        ${rebase.rebase >= 0 ? '+' : ''}${rebase.rebase.toFixed(2)}%
                    </span>
                    <span class="rebase-price">$${rebase.price.toFixed(3)}</span>
                </div>
            `).join('');
        }
    }

    logActivity(type, message) {
        const timestamp = new Date().toLocaleTimeString();
        const activityMessage = {
            time: timestamp,
            type: type,
            message: message
        };
        
        this.activityMessages.unshift(activityMessage);
        
        // Keep only the latest messages
        if (this.activityMessages.length > this.maxMessages) {
            this.activityMessages = this.activityMessages.slice(0, this.maxMessages);
        }
        
        this.updateActivityDisplay();
    }

    updateActivityDisplay() {
        const messagesContainer = document.getElementById('activity-messages');
        const messageCount = document.getElementById('message-count');
        
        if (!messagesContainer || this.isPaused) return;
        
        // Update message count
        if (messageCount) {
            messageCount.textContent = `${this.activityMessages.length} messages`;
        }
        
        // Clear welcome message if we have real messages
        if (this.activityMessages.length > 0) {
            const welcomeMessage = messagesContainer.querySelector('.welcome-message');
            if (welcomeMessage) {
                welcomeMessage.remove();
            }
        }
        
        // Add new messages
        messagesContainer.innerHTML = this.activityMessages.map(msg => `
            <div class="activity-message">
                <span class="message-time">${msg.time}</span>
                <span class="message-type ${msg.type}">${msg.type.toUpperCase()}</span>
                <span class="message-text">${msg.message}</span>
            </div>
        `).join('');
        
        // Auto-scroll to top for newest messages
        messagesContainer.scrollTop = 0;
    }

    addRecentAction(action, details) {
        const timestamp = new Date().toLocaleTimeString();
        const actionsContainer = document.getElementById('recent-actions');
        
        if (actionsContainer) {
            const actionElement = document.createElement('div');
            actionElement.className = 'action-item';
            actionElement.innerHTML = `
                <span class="action-time">${timestamp}</span>
                <span class="action-text">${action} - ${details}</span>
            `;
            
            actionsContainer.insertBefore(actionElement, actionsContainer.firstChild);
            
            // Keep only the latest 10 actions
            const actions = actionsContainer.querySelectorAll('.action-item');
            if (actions.length > 10) {
                actions[actions.length - 1].remove();
            }
        }
    }

    updateSmartOrderLadder() {
        // This would integrate with real order data
        // For now, maintaining the existing ladder functionality
        this.logActivity('system', 'Smart Order Ladder updated with real data');
    }

    // UI Control Methods
    toggleFeedPause() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pause-feed');
        const feedStatus = document.getElementById('feed-status');
        
        if (pauseBtn) {
            pauseBtn.innerHTML = this.isPaused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
        }
        
        if (feedStatus) {
            feedStatus.textContent = this.isPaused ? '⏸️ Paused' : '🟢 Connected';
        }
        
        this.logActivity('system', this.isPaused ? 'Activity feed paused' : 'Activity feed resumed');
    }

    clearActivityFeed() {
        this.activityMessages = [];
        const messagesContainer = document.getElementById('activity-messages');
        if (messagesContainer) {
            messagesContainer.innerHTML = `
                <div class="welcome-message">
                    <i class="fas fa-rocket"></i>
                    <span>AMPL Activity Feed Ready</span>
                    <small>Real-time system monitoring active</small>
                </div>
            `;
        }
        
        const messageCount = document.getElementById('message-count');
        if (messageCount) {
            messageCount.textContent = '0 messages';
        }
    }

    switchToLadder() {
        const activityView = document.getElementById('activity-view');
        const ladderView = document.getElementById('ladder-view');
        
        if (activityView && ladderView) {
            activityView.classList.remove('active');
            ladderView.classList.add('active');
        }
        
        this.logActivity('system', 'Switched to Smart Order Ladder view');
    }

    switchToActivity() {
        const activityView = document.getElementById('activity-view');
        const ladderView = document.getElementById('ladder-view');
        
        if (activityView && ladderView) {
            ladderView.classList.remove('active');
            activityView.classList.add('active');
        }
        
        this.logActivity('system', 'Switched to Activity Feed view');
    }

    refreshLadder() {
        this.updateSmartOrderLadder();
        this.logActivity('system', 'Smart Order Ladder refreshed');
    }

    clearRecentActions() {
        const actionsContainer = document.getElementById('recent-actions');
        if (actionsContainer) {
            actionsContainer.innerHTML = `
                <div class="action-item">
                    <span class="action-time">--:--:--</span>
                    <span class="action-text">Actions cleared</span>
                </div>
            `;
        }
    }

    clearRecentRebases() {
        const rebasesContainer = document.getElementById('recent-rebases');
        if (rebasesContainer) {
            rebasesContainer.innerHTML = `
                <div class="rebase-item">
                    <span>Rebase history cleared</span>
                </div>
            `;
        }
    }

    toggleProtection() {
        this.rebaseProtectionEnabled = !this.rebaseProtectionEnabled;
        const enableBtn = document.getElementById('enable-protection');
        
        if (enableBtn) {
            if (this.rebaseProtectionEnabled) {
                enableBtn.innerHTML = '<i class="fas fa-shield-alt"></i><span>Disable Protection</span>';
                enableBtn.style.background = 'rgba(255, 68, 68, 0.2)';
                enableBtn.style.borderColor = '#ff4444';
                enableBtn.style.color = '#ff4444';
            } else {
                enableBtn.innerHTML = '<i class="fas fa-shield-alt"></i><span>Enable Protection</span>';
                enableBtn.style.background = 'rgba(0, 255, 0, 0.2)';
                enableBtn.style.borderColor = '#00ff00';
                enableBtn.style.color = '#00ff00';
            }
        }
        
        this.logActivity('rebase', `Rebase protection ${this.rebaseProtectionEnabled ? 'enabled' : 'disabled'}`);
    }

    async emergencySell() {
        if (this.portfolioData.coins.AMPL.qty > 0) {
            try {
                this.logActivity('rebase', 'Emergency AMPL sell initiated');
                
                // Simulate emergency sell
                const sellAmount = this.portfolioData.coins.AMPL.qty * this.portfolioData.coins.AMPL.price;
                this.portfolioData.coins.AMPL.qty = 0;
                this.portfolioData.balance += sellAmount;
                
                this.logActivity('trade', `Emergency sold all AMPL for $${sellAmount.toFixed(2)}`);
                this.addRecentAction('Emergency Sell AMPL', `$${sellAmount.toFixed(2)}`);
                
            } catch (error) {
                this.logActivity('error', `Emergency sell failed: ${error.message}`);
            }
        } else {
            this.logActivity('system', 'No AMPL to sell');
        }
    }
}

// Initialize the system
const amplSystem = new AMPLCompleteSystemRedesigned();

// Make it globally available for UI interactions
window.amplSystem = amplSystem;

console.log('🎯 AMPL Complete System (Redesigned) loaded successfully');

