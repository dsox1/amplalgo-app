/**
 * AMPL Live Activity Feed - Fixed Toggle Version
 * Moves toggle button to bottom right and fixes functionality conflicts
 */

class AMPLActivityFeedIntegrated {
    constructor() {
        this.messages = [];
        this.maxMessages = 50;
        this.isPaused = false;
        this.originalContent = null;
        this.targetPanel = null;
        this.isInitialized = false;
        this.isShowingActivityFeed = false;
        this.activeOrders = [];
        this.executedOrders = [];
        this.monitoringInterval = null;
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        console.log('🎬 Initializing AMPL Activity Feed (Fixed Toggle)...');
        
        // Find the EXACT Smart Order Ladder panel we know exists
        this.findSmartOrderLadderPanel();
        
        if (this.targetPanel) {
            this.replaceContent();
            this.interceptConsoleMessages();
            this.connectToAMPLManager();
            this.isInitialized = true;
            this.isShowingActivityFeed = true;
            console.log('✅ AMPL Activity Feed integrated successfully');
        } else {
            console.log('❌ Smart Order Ladder panel not found');
        }
    }

    findSmartOrderLadderPanel() {
        // We KNOW the exact structure: .ladder-section.order-ladder-section
        const smartOrderLadder = document.querySelector('.ladder-section.order-ladder-section');
        if (smartOrderLadder) {
            this.targetPanel = smartOrderLadder.querySelector('.section-content');
            console.log('✅ Found Smart Order Ladder using exact known selector');
            return;
        }
        
        console.log('❌ Smart Order Ladder not found with known selector');
    }

    replaceContent() {
        if (!this.targetPanel) return;

        // Store original content for restoration
        this.originalContent = this.targetPanel.innerHTML;

        // Create the new activity feed content
        const feedHTML = `
            <div class="ampl-activity-feed-container">
                <!-- Header with controls -->
                <div class="activity-feed-header">
                    <div class="feed-title">
                        <i class="fas fa-chart-line"></i>
                        <span>LIVE ACTIVITY FEED</span>
                        <span class="feed-status" id="feed-status">🟢 Active</span>
                    </div>
                    <div class="feed-controls">
                        <button class="feed-btn pause-btn" id="pause-feed" title="Pause/Resume">
                            <i class="fas fa-pause"></i>
                        </button>
                        <button class="feed-btn clear-btn" id="clear-feed" title="Clear Messages">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="feed-btn restore-btn" id="restore-ladder" title="Show Smart Order Ladder">
                            <i class="fas fa-layer-group"></i>
                        </button>
                    </div>
                </div>

                <!-- Message counter -->
                <div class="message-counter">
                    <span id="message-count">0 messages</span>
                </div>

                <!-- Messages container -->
                <div class="activity-messages" id="activity-messages">
                    <div class="welcome-message">
                        <i class="fas fa-rocket"></i>
                        <span>AMPL Activity Feed Ready</span>
                        <small>Monitoring system activity...</small>
                    </div>
                </div>
            </div>
        `;

        // Replace content
        this.targetPanel.innerHTML = feedHTML;

        // Apply improved styling
        this.applyImprovedStyling();

        // Bind event listeners
        this.bindEventListeners();
    }

    applyImprovedStyling() {
        const style = document.createElement('style');
        style.textContent = `
            .ampl-activity-feed-container {
                height: 100%;
                display: flex;
                flex-direction: column;
                background: var(--panel-bw, #000000);
                color: var(--text-primary, #ffffff);
                border-radius: var(--border-radius, 12px);
                overflow: hidden;
            }

            .activity-feed-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 12px;
                background: rgba(255, 255, 255, 0.05);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                flex-shrink: 0;
            }

            .feed-title {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 13px;
                font-weight: 600;
                color: var(--text-primary, #ffffff);
            }

            .feed-title i {
                color: var(--accent-primary, #2196F3);
            }

            .feed-status {
                font-size: 11px;
                padding: 2px 6px;
                border-radius: 4px;
                background: rgba(76, 175, 80, 0.2);
                color: #4CAF50;
            }

            .feed-controls {
                display: flex;
                gap: 4px;
            }

            .feed-btn {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: var(--text-primary, #ffffff);
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 11px;
                transition: all 0.2s ease;
            }

            .feed-btn:hover {
                background: rgba(255, 255, 255, 0.2);
                border-color: rgba(255, 255, 255, 0.3);
            }

            .feed-btn.paused {
                background: rgba(255, 193, 7, 0.2);
                color: #FFC107;
            }

            .message-counter {
                padding: 4px 12px;
                font-size: 12px;
                color: var(--text-secondary, #b0b0b0);
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                flex-shrink: 0;
            }

            .activity-messages {
                flex: 1;
                overflow-y: auto;
                padding: 8px;
                display: flex;
                flex-direction: column;
                gap: 4px;
                max-height: 200px;
            }

            .activity-messages::-webkit-scrollbar {
                width: 4px;
            }

            .activity-messages::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.05);
            }

            .activity-messages::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.2);
                border-radius: 2px;
            }

            .activity-message {
                display: flex;
                align-items: flex-start;
                gap: 8px;
                padding: 6px 8px;
                border-radius: 6px;
                font-size: 13px;
                line-height: 1.4;
                border-left: 3px solid transparent;
                background: rgba(255, 255, 255, 0.02);
                animation: slideIn 0.3s ease;
                word-wrap: break-word;
                overflow-wrap: break-word;
                hyphens: auto;
            }

            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .activity-message.profit {
                border-left-color: var(--accent-success, #4CAF50);
                background: rgba(76, 175, 80, 0.05);
            }

            .activity-message.sell {
                border-left-color: var(--accent-primary, #2196F3);
                background: rgba(33, 150, 243, 0.05);
            }

            .activity-message.replace {
                border-left-color: var(--accent-warning, #FFC107);
                background: rgba(255, 193, 7, 0.05);
            }

            .activity-message.system {
                border-left-color: var(--text-secondary, #b0b0b0);
                background: rgba(176, 176, 176, 0.05);
            }

            .activity-message.error {
                border-left-color: var(--accent-danger, #F44336);
                background: rgba(244, 67, 54, 0.05);
            }

            .message-icon {
                flex-shrink: 0;
                width: 15px;
                text-align: center;
                margin-top: 1px;
                font-size: 13px;
            }

            .message-content {
                flex: 1;
                min-width: 0;
            }

            .message-text {
                color: var(--text-primary, #ffffff);
                margin-bottom: 2px;
                word-wrap: break-word;
                overflow-wrap: break-word;
                hyphens: auto;
                line-height: 1.4;
            }

            .message-time {
                color: var(--text-muted, #808080);
                font-size: 10px;
                white-space: nowrap;
            }

            .welcome-message {
                text-align: center;
                padding: 20px;
                color: var(--text-secondary, #b0b0b0);
            }

            .welcome-message i {
                display: block;
                font-size: 25px;
                margin-bottom: 8px;
                color: var(--accent-primary, #2196F3);
            }

            .welcome-message span {
                display: block;
                font-weight: 600;
                margin-bottom: 4px;
                font-size: 13px;
            }

            .welcome-message small {
                font-size: 11px;
                opacity: 0.7;
            }

            /* Smart Order Ladder Enhanced Container */
            .smart-order-ladder-enhanced {
                position: relative;
                height: 100%;
            }

            /* Toggle button positioned at BOTTOM RIGHT of price panels */
            .toggle-activity-feed-btn {
                position: absolute;
                bottom: 8px;
                right: 8px;
                background: rgba(33, 150, 243, 0.2);
                border: 2px solid rgba(33, 150, 243, 0.4);
                color: #2196F3;
                padding: 8px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s ease;
                z-index: 100;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 0 10px rgba(33, 150, 243, 0.4);
                pointer-events: auto;
            }

            .toggle-activity-feed-btn:hover {
                background: rgba(33, 150, 243, 0.4);
                border-color: rgba(33, 150, 243, 0.7);
                box-shadow: 0 0 20px rgba(33, 150, 243, 0.6);
                transform: scale(1.1);
            }

            .toggle-activity-feed-btn:active {
                transform: scale(0.95);
                background: rgba(33, 150, 243, 0.6);
            }

            /* Ensure the button stays on top and clickable */
            .toggle-activity-feed-btn {
                user-select: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
            }
        `;
        document.head.appendChild(style);
    }

    bindEventListeners() {
        const pauseBtn = document.getElementById('pause-feed');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.togglePause());
        }

        const clearBtn = document.getElementById('clear-feed');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearMessages());
        }

        const restoreBtn = document.getElementById('restore-ladder');
        if (restoreBtn) {
            restoreBtn.addEventListener('click', () => this.restoreOriginal());
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pause-feed');
        const statusEl = document.getElementById('feed-status');
        
        if (this.isPaused) {
            pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            pauseBtn.classList.add('paused');
            statusEl.textContent = '⏸️ Paused';
            statusEl.style.background = 'rgba(255, 193, 7, 0.2)';
            statusEl.style.color = '#FFC107';
        } else {
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            pauseBtn.classList.remove('paused');
            statusEl.textContent = '🟢 Active';
            statusEl.style.background = 'rgba(76, 175, 80, 0.2)';
            statusEl.style.color = '#4CAF50';
        }
    }

    clearMessages() {
        this.messages = [];
        const messagesContainer = document.getElementById('activity-messages');
        if (messagesContainer) {
            messagesContainer.innerHTML = `
                <div class="welcome-message">
                    <i class="fas fa-broom"></i>
                    <span>Messages Cleared</span>
                    <small>Ready for new activity...</small>
                </div>
            `;
        }
        this.updateMessageCounter();
    }

    restoreOriginal() {
        console.log('🔄 Restoring Smart Order Ladder...');
        
        if (this.targetPanel && this.originalContent) {
            // Stop monitoring to prevent conflicts
            this.stopOrderMonitoring();
            
            // Restore the EXACT original content with toggle button
            const enhancedContent = this.addToggleButtonToOriginal(this.originalContent);
            this.targetPanel.innerHTML = enhancedContent;
            this.isShowingActivityFeed = false;
            
            // Wait for DOM to settle, then set up everything
            setTimeout(() => {
                // Replace static prices with level numbers
                this.setPriceLevelNumbers();
                
                // Bind the toggle button with debugging
                this.bindToggleButtonWithDebugging();
                
                // Start monitoring for order updates
                this.startOrderMonitoring();
                
                console.log('✅ Smart Order Ladder restored with bottom-right toggle');
            }, 100);
        }
    }

    addToggleButtonToOriginal(originalContent) {
        const toggleButton = `
            <button class="toggle-activity-feed-btn" id="toggle-activity-feed" title="Show Live Activity Feed">
                <i class="fas fa-chart-line"></i>
            </button>
        `;
        
        return `
            <div class="smart-order-ladder-enhanced">
                ${originalContent}
                ${toggleButton}
            </div>
        `;
    }

    setPriceLevelNumbers() {
        // We KNOW the exact structure: .order-ladder-grid .price-level-badge
        const priceBadges = document.querySelectorAll('.order-ladder-grid .price-level-badge');
        
        console.log(`💡 Found ${priceBadges.length} price badges for level numbering`);
        
        if (priceBadges.length === 0) {
            console.log('❌ No price badges found with exact selector');
            return;
        }
        
        // Set level numbers on each badge
        priceBadges.forEach((badge, index) => {
            const levelNumber = index + 1;
            const levelText = `Limit Order ${levelNumber}`;
            
            // Store original price for reference
            const originalPrice = badge.textContent.trim();
            badge.setAttribute('data-original-price', originalPrice);
            badge.setAttribute('data-level', levelNumber);
            
            // Replace the text content directly
            badge.textContent = levelText;
            
            console.log(`🏷️ Set badge ${index + 1} to "${levelText}" (was "${originalPrice}")`);
        });
        
        console.log(`✅ Successfully set level numbers on ${priceBadges.length} price badges`);
    }

    bindToggleButtonWithDebugging() {
        const toggleBtn = document.getElementById('toggle-activity-feed');
        
        if (!toggleBtn) {
            console.log('❌ Toggle button not found in DOM');
            return;
        }
        
        console.log('🔘 Toggle button found, binding click event...');
        
        // Remove any existing listeners
        const newToggleBtn = toggleBtn.cloneNode(true);
        toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
        
        // Add click event with debugging
        newToggleBtn.addEventListener('click', (event) => {
            console.log('🔘 Toggle button clicked!');
            event.preventDefault();
            event.stopPropagation();
            
            try {
                this.showActivityFeed();
                console.log('✅ showActivityFeed() called successfully');
            } catch (error) {
                console.log('❌ Error in showActivityFeed():', error);
            }
        });
        
        // Add visual feedback for debugging
        newToggleBtn.addEventListener('mousedown', () => {
            console.log('🔘 Toggle button mousedown');
        });
        
        newToggleBtn.addEventListener('mouseup', () => {
            console.log('🔘 Toggle button mouseup');
        });
        
        console.log('✅ Toggle button event listeners bound with debugging');
    }

    showActivityFeed() {
        console.log('🎬 Switching to Live Activity Feed...');
        
        // Stop monitoring to prevent conflicts
        this.stopOrderMonitoring();
        
        // Replace content
        this.replaceContent();
        this.isShowingActivityFeed = true;
        
        console.log('✅ Switched to Live Activity Feed successfully');
    }

    // ORDER MONITORING with conflict prevention
    startOrderMonitoring() {
        console.log('🔍 Starting order monitoring...');
        
        // Clear any existing interval
        this.stopOrderMonitoring();
        
        // Immediate check
        this.checkOrdersAndHighlight();
        
        // Regular monitoring every 5 seconds
        this.monitoringInterval = setInterval(() => {
            if (!this.isShowingActivityFeed) {
                this.checkOrdersAndHighlight();
            }
        }, 5000);
        
        console.log('✅ Order monitoring started');
    }

    stopOrderMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log('🛑 Order monitoring stopped');
        }
    }

    async checkOrdersAndHighlight() {
        try {
            // Protect toggle button from being overwritten
            const toggleBtn = document.getElementById('toggle-activity-feed');
            const toggleBtnExists = !!toggleBtn;
            
            // Use the EXACT method we know exists: amplManagerEnhanced.getActiveOrders()
            if (typeof amplManagerEnhanced !== 'undefined' && amplManagerEnhanced.getActiveOrders) {
                const orderData = await amplManagerEnhanced.getActiveOrders();
                
                if (orderData && (orderData.active || orderData.filled)) {
                    const activeOrders = orderData.active || [];
                    const filledOrders = orderData.filled || [];
                    
                    console.log(`📊 Highlighting: ${activeOrders.length} active, ${filledOrders.length} filled`);
                    
                    // Update the price level badges using EXACT CSS classes
                    this.updatePriceLevelBadges(activeOrders, filledOrders);
                    
                    // Ensure toggle button still exists and is functional
                    if (toggleBtnExists && !document.getElementById('toggle-activity-feed')) {
                        console.log('⚠️ Toggle button was removed during monitoring, restoring...');
                        this.bindToggleButtonWithDebugging();
                    }
                }
            }
        } catch (error) {
            console.log('📊 Error in order monitoring:', error.message);
        }
    }

    updatePriceLevelBadges(activeOrders, filledOrders) {
        // We KNOW the exact structure: .order-ladder-grid .price-level-badge
        const priceBadges = document.querySelectorAll('.order-ladder-grid .price-level-badge');
        
        if (priceBadges.length === 0) {
            return;
        }
        
        // Reset all badges to empty state (using EXACT CSS classes from style.css)
        priceBadges.forEach(badge => {
            badge.className = 'price-level-badge empty';
        });
        
        // Highlight active orders as PENDING (orange) - using EXACT CSS class
        activeOrders.forEach((order, index) => {
            if (index < priceBadges.length) {
                priceBadges[index].className = 'price-level-badge pending';
            }
        });
        
        // Highlight filled orders as FILLED (green) - using EXACT CSS class
        filledOrders.forEach((order, index) => {
            if (index < priceBadges.length) {
                priceBadges[index].className = 'price-level-badge filled';
            }
        });
    }

    addMessage(text, type = 'system', icon = '📊') {
        if (this.isPaused) return;

        const timestamp = new Date().toLocaleTimeString();
        const message = {
            text,
            type,
            icon,
            timestamp,
            id: Date.now()
        };

        this.messages.unshift(message);

        if (this.messages.length > this.maxMessages) {
            this.messages = this.messages.slice(0, this.maxMessages);
        }

        this.renderMessages();
        this.updateMessageCounter();
    }

    renderMessages() {
        const messagesContainer = document.getElementById('activity-messages');
        if (!messagesContainer) return;

        if (this.messages.length === 0) {
            messagesContainer.innerHTML = `
                <div class="welcome-message">
                    <i class="fas fa-chart-line"></i>
                    <span>AMPL Activity Feed Ready</span>
                    <small>Monitoring system activity...</small>
                </div>
            `;
            return;
        }

        const messagesHTML = this.messages.map(msg => `
            <div class="activity-message ${msg.type}">
                <div class="message-icon">${msg.icon}</div>
                <div class="message-content">
                    <div class="message-text">${msg.text}</div>
                    <div class="message-time">${msg.timestamp}</div>
                </div>
            </div>
        `).join('');

        messagesContainer.innerHTML = messagesHTML;
        messagesContainer.scrollTop = 0;
    }

    updateMessageCounter() {
        const counterEl = document.getElementById('message-count');
        if (counterEl) {
            counterEl.textContent = `${this.messages.length} messages`;
        }
    }

    interceptConsoleMessages() {
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        console.log = (...args) => {
            originalLog.apply(console, args);
            
            const message = args.join(' ');
            if (this.isAMPLMessage(message)) {
                this.processAMPLMessage(message);
            }
        };

        console.warn = (...args) => {
            originalWarn.apply(console, args);
            
            const message = args.join(' ');
            if (this.isAMPLMessage(message)) {
                this.addMessage(message, 'error', '⚠️');
            }
        };

        console.error = (...args) => {
            originalError.apply(console, args);
            
            const message = args.join(' ');
            if (this.isAMPLMessage(message)) {
                this.addMessage(message, 'error', '❌');
            }
        };
    }

    isAMPLMessage(message) {
        const amplKeywords = [
            'AMPL', 'ampl', 'cascade', 'profit', 'sell', 'order', 'replace',
            'Level', 'position', 'buy', 'price', 'balance', 'deployed',
            'monitoring', 'checking', 'filled', 'pending', 'active'
        ];
        
        return amplKeywords.some(keyword => message.includes(keyword));
    }

    processAMPLMessage(message) {
        let type = 'system';
        let icon = '📊';

        if (message.includes('profit') || message.includes('Profit')) {
            type = 'profit';
            icon = '💰';
        } else if (message.includes('sell') || message.includes('Sell')) {
            type = 'sell';
            icon = '💸';
        } else if (message.includes('replace') || message.includes('Replace')) {
            type = 'replace';
            icon = '🔄';
        } else if (message.includes('deployed') || message.includes('placed')) {
            type = 'system';
            icon = '🎯';
        } else if (message.includes('price') || message.includes('Price')) {
            type = 'system';
            icon = '📈';
        }

        const cleanMessage = message
            .replace(/^[🎉✅❌⚠️💰📊🔄🎯📈💸]+\s*/, '')
            .replace(/^\w+:\s*/, '')
            .trim();

        this.addMessage(cleanMessage, type, icon);
    }

    connectToAMPLManager() {
        if (typeof amplManagerEnhanced !== 'undefined') {
            console.log('🔗 Connected to AMPL Manager Enhanced');
            this.addMessage('Connected to AMPL Manager Enhanced', 'system', '🔗');
        } else {
            console.log('⏳ Waiting for AMPL Manager Enhanced...');
            setTimeout(() => this.connectToAMPLManager(), 2000);
        }
    }

    // Public methods for external use
    logProfit(message) {
        this.addMessage(message, 'profit', '💰');
    }

    logSell(message) {
        this.addMessage(message, 'sell', '💸');
    }

    logReplace(message) {
        this.addMessage(message, 'replace', '🔄');
    }

    logSystem(message) {
        this.addMessage(message, 'system', '📊');
    }

    logError(message) {
        this.addMessage(message, 'error', '❌');
    }

    // Public method to manually update order indicators
    updateOrderIndicators(activeOrders, executedOrders) {
        this.activeOrders = activeOrders || [];
        this.executedOrders = executedOrders || [];
        
        if (!this.isShowingActivityFeed) {
            this.updatePriceLevelBadges(this.activeOrders, this.executedOrders);
        }
        
        console.log(`💡 Manual update: ${this.activeOrders.length} active, ${this.executedOrders.length} executed`);
    }
}

// Initialize the activity feed
const amplActivityFeed = new AMPLActivityFeedIntegrated();

// Global functions for external use
function logProfit(message) {
    if (amplActivityFeed) amplActivityFeed.logProfit(message);
}

function logSell(message) {
    if (amplActivityFeed) amplActivityFeed.logSell(message);
}

function logReplace(message) {
    if (amplActivityFeed) amplActivityFeed.logReplace(message);
}

function logSystem(message) {
    if (amplActivityFeed) amplActivityFeed.logSystem(message);
}

function logError(message) {
    if (amplActivityFeed) amplActivityFeed.logError(message);
}

// Global function to update order indicators
function updateOrderIndicators(activeOrders, executedOrders) {
    if (amplActivityFeed) amplActivityFeed.updateOrderIndicators(activeOrders, executedOrders);
}

console.log('🎬 AMPL Activity Feed (Fixed Toggle) loaded successfully');

