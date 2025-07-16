/**
 * AMPL Rebase Protection Monitor - Clean Version
 * Removes duplicate data, adds proper labeling, fixes overflow issues
 */

class AMPLRebaseProtectionClean {
    constructor() {
        this.targetPanel = null;
        this.isInitialized = false;
        this.monitoringInterval = null;
        this.rebaseCheckInterval = null;
        
        // Rebase protection data
        this.rebaseData = {
            originalPurchase: 0,
            currentValue: 0,
            difference: 0,
            protectionStatus: 0, // 0-100%
            lastRebaseTime: null,
            rebaseHistory: [],
            amplQuantity: 0,
            amplPrice: 0,
            targetPrice: 1.00, // AMPL target price
            rebaseThreshold: 0.05, // 5% deviation triggers protection
            protectionActive: false
        };
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            setTimeout(() => this.initialize(), 1500);
        }
    }

    initialize() {
        console.log('🛡️ Initializing CLEAN AMPL Rebase Protection Monitor...');
        
        // Clear any existing instances
        this.clearExistingInstances();
        
        // Find the rebase protection panel
        this.findRebasePanel();
        
        if (this.targetPanel) {
            this.createCleanRebasePanel();
            this.applyStyles();
            this.bindEventListeners();
            this.loadRebaseData();
            this.startRebaseMonitoring();
            this.isInitialized = true;
            console.log('✅ CLEAN AMPL Rebase Protection Monitor initialized successfully');
        } else {
            console.log('❌ Rebase protection panel not found');
        }
    }

    clearExistingInstances() {
        // Clear intervals
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        if (this.rebaseCheckInterval) {
            clearInterval(this.rebaseCheckInterval);
            this.rebaseCheckInterval = null;
        }
    }

    findRebasePanel() {
        // Find the AMPL Rebase Protection section using exact structure
        const rebaseSection = document.querySelector('.ladder-section.rebase-section');
        if (rebaseSection) {
            this.targetPanel = rebaseSection.querySelector('.section-content');
            console.log('✅ Found rebase protection panel');
        } else {
            console.log('❌ Rebase protection section not found');
        }
    }

    createCleanRebasePanel() {
        if (!this.targetPanel) return;

        // Clean rebase protection panel - NO duplicate data sections
        const rebaseHTML = `
            <div class="clean-rebase-content">
                <!-- Real-time Status Display -->
                <div class="rebase-status-header">
                    <div class="status-indicator" id="rebase-status-indicator">
                        <span class="status-dot"></span>
                        <span class="status-text" id="rebase-status-text">Monitoring</span>
                    </div>
                    <div class="last-check" id="last-rebase-check">
                        Last Check: --:--
                    </div>
                </div>

                <!-- Enhanced Progress Bar with 0-100% Labels -->
                <div class="progress-container">
                    <div class="progress-label">
                        <span>Rebase Protection Status</span>
                        <span class="protection-level" id="protection-level">Safe</span>
                    </div>
                    <div class="progress-bar-wrapper">
                        <div class="progress-bar-container">
                            <div class="progress-bar" id="rebase-progress-bar" style="width: 0%;"></div>
                        </div>
                        <div class="progress-labels">
                            <span class="progress-label-item" style="left: 0%;">0%</span>
                            <span class="progress-label-item" style="left: 25%;">25%</span>
                            <span class="progress-label-item" style="left: 50%;">50%</span>
                            <span class="progress-label-item" style="left: 75%;">75%</span>
                            <span class="progress-label-item" style="left: 100%;">100%</span>
                        </div>
                    </div>
                    <div class="progress-percentage" id="rebase-progress-percentage">0% Safe</div>
                </div>
                
                <!-- Holdings Tracker - Single Section Only -->
                <div class="holdings-tracker">
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
                </div>

                <!-- Rebase Information with Price Deviation Explanation -->
                <div class="rebase-info">
                    <div class="info-row">
                        <span class="info-label">Target Price:</span>
                        <span class="info-value" id="target-price-display">$1.00</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Current Price:</span>
                        <span class="info-value" id="current-price-display">$0.00</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Price Deviation:</span>
                        <span class="info-value deviation" id="price-deviation-display" title="How far AMPL price is from its $1.00 target. Large deviations trigger rebases.">0.00%</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Next Rebase:</span>
                        <span class="info-value" id="next-rebase-time">Calculating...</span>
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

                <!-- Recent Rebase History -->
                <div class="rebase-history">
                    <div class="history-header">
                        <span class="history-title">Recent Rebases</span>
                        <button class="clear-history-btn" id="clear-rebase-history">Clear</button>
                    </div>
                    <div class="history-list" id="rebase-history-list">
                        <div class="history-entry">
                            <span class="history-time">Ready</span>
                            <span class="history-text">Rebase monitoring initialized</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Replace the panel content
        this.targetPanel.innerHTML = rebaseHTML;
    }

    applyStyles() {
        const style = document.createElement('style');
        style.id = 'clean-ampl-rebase-protection-styles';
        style.textContent = `
            /* Clean Rebase Protection Styles - No Overflow Issues */
            .clean-rebase-content {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                gap: 10px;
                color: var(--text-primary, #ffffff);
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                overflow: hidden;
                box-sizing: border-box;
                padding: 4px;
            }

            /* Status Header */
            .rebase-status-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 6px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                margin-bottom: 6px;
                overflow: hidden;
            }

            .status-indicator {
                display: flex;
                align-items: center;
                gap: 6px;
                overflow: hidden;
            }

            .status-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: #4CAF50;
                animation: pulse 2s infinite;
                flex-shrink: 0;
            }

            .status-dot.warning {
                background: #FFC107;
            }

            .status-dot.danger {
                background: #F44336;
            }

            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }

            .status-text {
                font-size: 12px;
                font-weight: 600;
                color: #4CAF50;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .status-text.warning {
                color: #FFC107;
            }

            .status-text.danger {
                color: #F44336;
            }

            .last-check {
                font-size: 10px;
                color: var(--text-secondary, #b0b0b0);
                flex-shrink: 0;
            }

            /* Enhanced Progress Bar with Labels */
            .progress-container {
                margin-bottom: 10px;
                overflow: hidden;
            }

            .progress-label {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 6px;
                font-size: 11px;
                overflow: hidden;
            }

            .protection-level {
                font-weight: 600;
                color: #4CAF50;
                flex-shrink: 0;
            }

            .protection-level.warning {
                color: #FFC107;
            }

            .protection-level.danger {
                color: #F44336;
            }

            .progress-bar-wrapper {
                position: relative;
                margin-bottom: 4px;
            }

            .progress-bar-container {
                position: relative;
                width: 100%;
                height: 16px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                overflow: hidden;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #4CAF50 0%, #8BC34A 50%, #CDDC39 100%);
                border-radius: 8px;
                transition: width 0.5s ease, background 0.3s ease;
                position: relative;
            }

            .progress-bar.warning {
                background: linear-gradient(90deg, #FFC107 0%, #FF9800 100%);
            }

            .progress-bar.danger {
                background: linear-gradient(90deg, #F44336 0%, #E91E63 100%);
            }

            /* Progress Labels - 0% to 100% */
            .progress-labels {
                position: absolute;
                top: 18px;
                left: 0;
                width: 100%;
                height: 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                pointer-events: none;
            }

            .progress-label-item {
                font-size: 8px;
                color: var(--text-secondary, #b0b0b0);
                position: absolute;
                transform: translateX(-50%);
                white-space: nowrap;
            }

            .progress-percentage {
                text-align: center;
                margin-top: 16px;
                font-size: 10px;
                font-weight: 600;
                color: #4CAF50;
            }

            .progress-percentage.warning {
                color: #FFC107;
            }

            .progress-percentage.danger {
                color: #F44336;
            }

            /* Holdings Tracker - Single Section Only */
            .holdings-tracker {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 6px;
                padding: 8px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                margin-bottom: 8px;
                overflow: hidden;
            }

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
                font-size: 10px;
                color: var(--text-secondary, #b0b0b0);
                flex-shrink: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .holdings-value {
                font-size: 11px;
                font-weight: 600;
                color: var(--text-primary, #ffffff);
                flex-shrink: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
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

            /* Rebase Information with Tooltip */
            .rebase-info {
                background: rgba(255, 255, 255, 0.03);
                border-radius: 6px;
                padding: 6px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                margin-bottom: 8px;
                overflow: hidden;
            }

            .info-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 2px 0;
                font-size: 10px;
                overflow: hidden;
            }

            .info-label {
                color: var(--text-secondary, #b0b0b0);
                flex-shrink: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .info-value {
                font-weight: 600;
                color: var(--text-primary, #ffffff);
                flex-shrink: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .info-value.deviation {
                cursor: help;
                position: relative;
            }

            .info-value.deviation.positive {
                color: #4CAF50;
            }

            .info-value.deviation.negative {
                color: #F44336;
            }

            /* Tooltip for Price Deviation */
            .info-value.deviation:hover::after {
                content: attr(title);
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.9);
                color: #ffffff;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 9px;
                white-space: nowrap;
                z-index: 1000;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            /* Protection Actions */
            .protection-actions {
                display: flex;
                gap: 6px;
                margin-bottom: 8px;
                overflow: hidden;
            }

            .protection-btn, .emergency-btn {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
                padding: 6px 8px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 10px;
                font-weight: 600;
                transition: all 0.3s ease;
                overflow: hidden;
            }

            .protection-btn {
                background: rgba(76, 175, 80, 0.2);
                color: #4CAF50;
                border: 1px solid rgba(76, 175, 80, 0.4);
            }

            .protection-btn:hover {
                background: rgba(76, 175, 80, 0.3);
                border-color: rgba(76, 175, 80, 0.6);
            }

            .protection-btn.active {
                background: rgba(76, 175, 80, 0.4);
                border-color: rgba(76, 175, 80, 0.8);
            }

            .emergency-btn {
                background: rgba(244, 67, 54, 0.2);
                color: #F44336;
                border: 1px solid rgba(244, 67, 54, 0.4);
            }

            .emergency-btn:hover {
                background: rgba(244, 67, 54, 0.3);
                border-color: rgba(244, 67, 54, 0.6);
            }

            .btn-icon {
                font-size: 12px;
                flex-shrink: 0;
            }

            .btn-text {
                font-size: 9px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            /* Rebase History */
            .rebase-history {
                flex: 1;
                background: rgba(255, 255, 255, 0.03);
                border-radius: 6px;
                padding: 6px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                overflow: hidden;
                display: flex;
                flex-direction: column;
                min-height: 0;
            }

            .history-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 4px;
                flex-shrink: 0;
            }

            .history-title {
                font-size: 10px;
                color: var(--text-secondary, #b0b0b0);
                font-weight: 600;
            }

            .clear-history-btn {
                background: none;
                border: none;
                color: var(--text-secondary, #b0b0b0);
                cursor: pointer;
                font-size: 8px;
                padding: 2px 4px;
                border-radius: 3px;
                transition: all 0.2s ease;
            }

            .clear-history-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                color: var(--text-primary, #ffffff);
            }

            .history-list {
                flex: 1;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 1px;
                min-height: 0;
            }

            .history-entry {
                display: flex;
                gap: 6px;
                font-size: 9px;
                padding: 2px 3px;
                border-radius: 3px;
                background: rgba(255, 255, 255, 0.02);
                overflow: hidden;
                flex-shrink: 0;
            }

            .history-time {
                color: var(--text-muted, #808080);
                flex-shrink: 0;
                min-width: 40px;
                font-size: 8px;
            }

            .history-text {
                color: var(--text-primary, #ffffff);
                flex: 1;
                font-size: 9px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            /* Scrollbar Styling */
            .history-list::-webkit-scrollbar {
                width: 3px;
            }

            .history-list::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.05);
            }

            .history-list::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.2);
                border-radius: 2px;
            }

            /* Responsive adjustments */
            @media (max-width: 768px) {
                .clean-rebase-content {
                    gap: 8px;
                }
                
                .protection-actions {
                    flex-direction: column;
                }
                
                .progress-labels {
                    display: none;
                }
            }
        `;
        
        // Remove any existing styles first
        const existingStyle = document.getElementById('clean-ampl-rebase-protection-styles');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        document.head.appendChild(style);
    }

    bindEventListeners() {
        console.log('🔗 Binding clean rebase protection event listeners...');
        
        // Toggle protection button
        const toggleBtn = document.getElementById('toggle-protection-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleProtection();
            });
        }
        
        // Emergency sell button
        const emergencyBtn = document.getElementById('emergency-sell-btn');
        if (emergencyBtn) {
            emergencyBtn.addEventListener('click', () => {
                this.emergencySell();
            });
        }
        
        // Clear history button
        const clearHistoryBtn = document.getElementById('clear-rebase-history');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                this.clearRebaseHistory();
            });
        }
        
        console.log('✅ Clean rebase protection event listeners bound');
    }

    async loadRebaseData() {
        console.log('📊 Loading rebase data...');
        
        try {
            // Load AMPL holdings from the rebalancing system
            await this.fetchAMPLHoldings();
            
            // Load current AMPL price
            await this.fetchAMPLPrice();
            
            // Calculate protection status
            this.calculateProtectionStatus();
            
            // Update display
            this.updateDisplay();
            
        } catch (error) {
            console.log('📊 Error loading rebase data:', error.message);
            this.logRebaseEvent('Error loading rebase data');
        }
    }

    async fetchAMPLHoldings() {
        try {
            // Try to get AMPL holdings from the rebalancing system
            if (window.amplRebalancingSystemFixed && window.amplRebalancingSystemFixed.coins) {
                const amplCoin = window.amplRebalancingSystemFixed.coins.AMPL;
                if (amplCoin) {
                    this.rebaseData.amplQuantity = amplCoin.quantity;
                    this.rebaseData.originalPurchase = amplCoin.quantity * amplCoin.purchasePrice;
                    this.logRebaseEvent(`Loaded AMPL holdings: ${amplCoin.quantity.toFixed(3)} AMPL`);
                }
            }
            
        } catch (error) {
            console.log('📊 Error fetching AMPL holdings:', error.message);
        }
    }

    async fetchAMPLPrice() {
        try {
            // Try to get AMPL price from the rebalancing system first
            if (window.amplRebalancingSystemFixed && window.amplRebalancingSystemFixed.coins) {
                const amplCoin = window.amplRebalancingSystemFixed.coins.AMPL;
                if (amplCoin && amplCoin.currentPrice > 0) {
                    this.rebaseData.amplPrice = amplCoin.currentPrice;
                    return;
                }
            }
            
            // Fallback: try CoinGecko
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ampleforth&vs_currencies=usd');
            const data = await response.json();
            
            if (data.ampleforth && data.ampleforth.usd) {
                this.rebaseData.amplPrice = data.ampleforth.usd;
            } else {
                // Final fallback
                this.rebaseData.amplPrice = 1.189;
            }
            
        } catch (error) {
            console.log('📊 Error fetching AMPL price:', error.message);
            this.rebaseData.amplPrice = 1.189;
        }
    }

    startRebaseMonitoring() {
        console.log('🔍 Starting rebase monitoring...');
        
        // Clear any existing intervals
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        if (this.rebaseCheckInterval) {
            clearInterval(this.rebaseCheckInterval);
        }
        
        // Immediate check
        this.checkRebaseConditions();
        
        // Regular price monitoring every 2 minutes
        this.monitoringInterval = setInterval(() => {
            this.updateRebaseData();
        }, 120000);
        
        // Frequent rebase condition checks every 30 seconds
        this.rebaseCheckInterval = setInterval(() => {
            this.checkRebaseConditions();
        }, 30000);
        
        console.log('✅ Rebase monitoring started');
    }

    async updateRebaseData() {
        try {
            await this.fetchAMPLHoldings();
            await this.fetchAMPLPrice();
            this.calculateProtectionStatus();
            this.updateDisplay();
            
            const timestamp = new Date().toLocaleTimeString();
            document.getElementById('last-rebase-check').textContent = `Last Check: ${timestamp}`;
            
        } catch (error) {
            console.log('📊 Error updating rebase data:', error.message);
        }
    }

    checkRebaseConditions() {
        const priceDeviation = Math.abs(this.rebaseData.amplPrice - this.rebaseData.targetPrice) / this.rebaseData.targetPrice;
        
        // Check if rebase is likely (price deviation > 5%)
        if (priceDeviation > this.rebaseData.rebaseThreshold) {
            const deviationPercent = (priceDeviation * 100).toFixed(2);
            
            if (this.rebaseData.amplPrice > this.rebaseData.targetPrice) {
                this.logRebaseEvent(`⚠️ Positive rebase likely: +${deviationPercent}% deviation`);
                this.updateStatusIndicator('warning', 'Positive Rebase Risk');
            } else {
                this.logRebaseEvent(`🚨 Negative rebase likely: -${deviationPercent}% deviation`);
                this.updateStatusIndicator('danger', 'Negative Rebase Risk');
                
                // Auto-trigger protection if enabled
                if (this.rebaseData.protectionActive && priceDeviation > 0.1) { // 10% deviation
                    this.triggerProtection();
                }
            }
        } else {
            this.updateStatusIndicator('safe', 'Monitoring');
        }
    }

    calculateProtectionStatus() {
        // Calculate current value
        this.rebaseData.currentValue = this.rebaseData.amplQuantity * this.rebaseData.amplPrice;
        
        // Calculate difference
        this.rebaseData.difference = this.rebaseData.currentValue - this.rebaseData.originalPurchase;
        
        // Calculate protection status (0-100%)
        const priceDeviation = Math.abs(this.rebaseData.amplPrice - this.rebaseData.targetPrice) / this.rebaseData.targetPrice;
        
        if (priceDeviation <= 0.02) { // Within 2%
            this.rebaseData.protectionStatus = 100;
        } else if (priceDeviation <= 0.05) { // Within 5%
            this.rebaseData.protectionStatus = 75;
        } else if (priceDeviation <= 0.1) { // Within 10%
            this.rebaseData.protectionStatus = 50;
        } else if (priceDeviation <= 0.15) { // Within 15%
            this.rebaseData.protectionStatus = 25;
        } else {
            this.rebaseData.protectionStatus = 0;
        }
    }

    updateDisplay() {
        // Update progress bar
        const progressBar = document.getElementById('rebase-progress-bar');
        const progressPercentage = document.getElementById('rebase-progress-percentage');
        const protectionLevel = document.getElementById('protection-level');
        
        if (progressBar && progressPercentage && protectionLevel) {
            progressBar.style.width = `${this.rebaseData.protectionStatus}%`;
            progressPercentage.textContent = `${this.rebaseData.protectionStatus}% Safe`;
            
            // Update styling based on protection level
            progressBar.className = 'progress-bar';
            progressPercentage.className = 'progress-percentage';
            protectionLevel.className = 'protection-level';
            
            if (this.rebaseData.protectionStatus >= 75) {
                protectionLevel.textContent = 'Safe';
            } else if (this.rebaseData.protectionStatus >= 50) {
                protectionLevel.textContent = 'Caution';
                progressBar.classList.add('warning');
                progressPercentage.classList.add('warning');
                protectionLevel.classList.add('warning');
            } else {
                protectionLevel.textContent = 'Risk';
                progressBar.classList.add('danger');
                progressPercentage.classList.add('danger');
                protectionLevel.classList.add('danger');
            }
        }
        
        // Update holdings display
        const elements = {
            'original-purchase-value': `$${this.rebaseData.originalPurchase.toFixed(2)}`,
            'current-value-display': `$${this.rebaseData.currentValue.toFixed(2)}`,
            'difference-display': `$${this.rebaseData.difference.toFixed(2)}`,
            'ampl-quantity-display': this.rebaseData.amplQuantity.toFixed(3)
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = value;
                if (id === 'difference-display') {
                    el.className = 'holdings-value difference';
                    if (this.rebaseData.difference >= 0) {
                        el.classList.add('positive');
                    } else {
                        el.classList.add('negative');
                    }
                }
            }
        });
        
        // Update rebase info with Price Deviation explanation
        const priceDeviation = ((this.rebaseData.amplPrice - this.rebaseData.targetPrice) / this.rebaseData.targetPrice) * 100;
        
        const infoElements = {
            'target-price-display': `$${this.rebaseData.targetPrice.toFixed(2)}`,
            'current-price-display': `$${this.rebaseData.amplPrice.toFixed(3)}`,
            'price-deviation-display': `${priceDeviation.toFixed(2)}%`,
            'next-rebase-time': this.calculateNextRebaseTime()
        };
        
        Object.entries(infoElements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = value;
                if (id === 'price-deviation-display') {
                    el.className = 'info-value deviation';
                    if (priceDeviation >= 0) {
                        el.classList.add('positive');
                    } else {
                        el.classList.add('negative');
                    }
                    // Add tooltip explaining Price Deviation
                    el.title = 'How far AMPL price is from its $1.00 target. Large deviations trigger rebases.';
                }
            }
        });
    }

    calculateNextRebaseTime() {
        // AMPL rebases daily at 2:00 AM UTC
        const now = new Date();
        const utcNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
        
        let nextRebase = new Date(utcNow);
        nextRebase.setUTCHours(2, 0, 0, 0);
        
        // If it's past 2 AM UTC today, set for tomorrow
        if (utcNow.getUTCHours() >= 2) {
            nextRebase.setUTCDate(nextRebase.getUTCDate() + 1);
        }
        
        const timeUntil = nextRebase.getTime() - utcNow.getTime();
        const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60));
        const minutesUntil = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hoursUntil}h ${minutesUntil}m`;
    }

    updateStatusIndicator(status, text) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.getElementById('rebase-status-text');
        
        if (statusDot && statusText) {
            statusDot.className = `status-dot ${status}`;
            statusText.className = `status-text ${status}`;
            statusText.textContent = text;
        }
    }

    toggleProtection() {
        this.rebaseData.protectionActive = !this.rebaseData.protectionActive;
        
        const toggleBtn = document.getElementById('toggle-protection-btn');
        const btnText = toggleBtn.querySelector('.btn-text');
        
        if (this.rebaseData.protectionActive) {
            toggleBtn.classList.add('active');
            btnText.textContent = 'Disable Protection';
            this.logRebaseEvent('🛡️ Rebase protection enabled');
        } else {
            toggleBtn.classList.remove('active');
            btnText.textContent = 'Enable Protection';
            this.logRebaseEvent('🛡️ Rebase protection disabled');
        }
    }

    async triggerProtection() {
        if (this.rebaseData.amplQuantity <= 0) {
            this.logRebaseEvent('❌ No AMPL holdings to protect');
            return;
        }
        
        this.logRebaseEvent('🚨 Triggering rebase protection - selling AMPL');
        
        try {
            // Use the working KuCoin API endpoint
            const response = await fetch('/api/kucoin/order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    symbol: 'AMPL-USDT',
                    side: 'sell',
                    type: 'market',
                    size: this.rebaseData.amplQuantity.toFixed(3)
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                this.logRebaseEvent(`✅ Protection executed - sold ${this.rebaseData.amplQuantity.toFixed(3)} AMPL`);
                
                // Reset holdings
                this.rebaseData.amplQuantity = 0;
                this.rebaseData.originalPurchase = 0;
                this.rebaseData.currentValue = 0;
                this.rebaseData.difference = 0;
                
                this.updateDisplay();
            } else {
                throw new Error(`Order API error: ${response.status}`);
            }
            
        } catch (error) {
            this.logRebaseEvent(`❌ Protection failed: ${error.message}`);
        }
    }

    async emergencySell() {
        if (this.rebaseData.amplQuantity <= 0) {
            this.logRebaseEvent('❌ No AMPL holdings for emergency sell');
            return;
        }
        
        // Confirm emergency sell
        if (confirm(`Emergency sell ${this.rebaseData.amplQuantity.toFixed(3)} AMPL?`)) {
            await this.triggerProtection();
        }
    }

    logRebaseEvent(message) {
        const historyList = document.getElementById('rebase-history-list');
        if (!historyList) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const historyEntry = document.createElement('div');
        historyEntry.className = 'history-entry';
        historyEntry.innerHTML = `
            <span class="history-time">${timestamp}</span>
            <span class="history-text">${message}</span>
        `;
        
        historyList.insertBefore(historyEntry, historyList.firstChild);
        
        // Keep only last 20 entries
        while (historyList.children.length > 20) {
            historyList.removeChild(historyList.lastChild);
        }
        
        console.log(`🛡️ ${timestamp}: ${message}`);
    }

    clearRebaseHistory() {
        const historyList = document.getElementById('rebase-history-list');
        if (historyList) {
            historyList.innerHTML = `
                <div class="history-entry">
                    <span class="history-time">Ready</span>
                    <span class="history-text">Rebase history cleared</span>
                </div>
            `;
        }
    }
}

// Initialize the clean rebase protection monitor
const amplRebaseProtectionClean = new AMPLRebaseProtectionClean();

console.log('🛡️ CLEAN AMPL Rebase Protection Monitor loaded successfully');

