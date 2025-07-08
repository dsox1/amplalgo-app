/**
 * AMPL Live Activity Feed - Architectural Fix
 * Uses show/hide pattern instead of DOM replacement to preserve event listeners
 */

class AMPLActivityFeedArchitectural {
    constructor() {
        this.messages = [];
        this.maxMessages = 50;
        this.isPaused = false;
        this.targetPanel = null;
        this.isInitialized = false;
        this.currentView = 'activity'; // 'activity' or 'ladder'
        this.monitoringInterval = null;
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        console.log('🎬 Initializing AMPL Activity Feed (Architectural Fix)...');
        
        // Find the Smart Order Ladder panel
        this.findSmartOrderLadderPanel();
        
        if (this.targetPanel) {
            this.createDualViewStructure();
            this.applyStyles();
            this.bindAllEventListeners();
            this.startOrderMonitoring();
            this.isInitialized = true;
            console.log('✅ AMPL Activity Feed integrated with architectural fix');
        } else {
            console.log('❌ Smart Order Ladder panel not found');
        }
    }

    findSmartOrderLadderPanel() {
        // Find the exact Smart Order Ladder section
        const smartOrderLadder = document.querySelector('.ladder-section.order-ladder-section');
        if (smartOrderLadder) {
            this.targetPanel = smartOrderLadder.querySelector('.section-content');
            console.log('✅ Found Smart Order Ladder using exact known selector');
            return;
        }
        
        console.log('❌ Smart Order Ladder not found with known selector');
    }

    createDualViewStructure() {
        if (!this.targetPanel) return;

        // Store the original content
        const originalContent = this.targetPanel.innerHTML;

        // Create the dual-view structure
        const dualViewHTML = `
            <!-- Activity Feed View -->
            <div class="ampl-view ampl-activity-view" id="ampl-activity-view">
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
                            <button class="feed-btn switch-btn" id="switch-to-ladder" title="Show Smart Order Ladder">
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
            </div>

            <!-- Smart Order Ladder View -->
            <div class="ampl-view ampl-ladder-view" id="ampl-ladder-view" style="display: none;">
                <div class="smart-order-ladder-enhanced">
                    ${originalContent}
                    <!-- Toggle button positioned at bottom right -->
                    <button class="toggle-activity-feed-btn" id="switch-to-activity" title="Show Live Activity Feed">
                        <i class="fas fa-chart-line"></i>
                    </button>
                </div>
            </div>
        `;

        // Replace content ONCE - this is the only innerHTML replacement
        this.targetPanel.innerHTML = dualViewHTML;

        // Set up price level numbers immediately
        this.setPriceLevelNumbers();
    }

    applyStyles() {
        const style = document.createElement('style');
        style.id = 'ampl-architectural-styles';
        style.textContent = `
            /* Base view container */
            .ampl-view {
                height: 100%;
                width: 100%;
            }

            /* Activity Feed Styles */
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

            /* Toggle button positioned at bottom right */
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
        `;
        
        // Remove any existing styles first
        const existingStyle = document.getElementById('ampl-architectural-styles');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        document.head.appendChild(style);
    }

    bindAllEventListeners() {
        console.log('🔗 Binding all event listeners using event delegation...');
        
        // Use event delegation on the target panel (stable parent)
        this.targetPanel.addEventListener('click', (event) => {
            const target = event.target.closest('button');
            if (!target) return;
            
            const buttonId = target.id;
            console.log(`🔘 Button clicked: ${buttonId}`);
            
            switch (buttonId) {
                case 'pause-feed':
                    this.togglePause();
                    break;
                case 'clear-feed':
                    this.clearMessages();
                    break;
                case 'switch-to-ladder':
                    this.showLadderView();
                    break;
                case 'switch-to-activity':
                    this.showActivityView();
                    break;
            }
        });
        
        console.log('✅ Event delegation set up on stable parent element');
    }

    showActivityView() {
        console.log('🎬 Switching to Activity Feed view...');
        
        const activityView = document.getElementById('ampl-activity-view');
        const ladderView = document.getElementById('ampl-ladder-view');
        
        if (activityView && ladderView) {
            activityView.style.display = 'block';
            ladderView.style.display = 'none';
            this.currentView = 'activity';
            console.log('✅ Switched to Activity Feed view');
        }
    }

    showLadderView() {
        console.log('🎬 Switching to Ladder view...');
        
        const activityView = document.getElementById('ampl-activity-view');
        const ladderView = document.getElementById('ampl-ladder-view');
        
        if (activityView && ladderView) {
            activityView.style.display = 'none';
            ladderView.style.display = 'block';
            this.currentView = 'ladder';
            console.log('✅ Switched to Ladder view');
        }
    }

    setPriceLevelNumbers() {
        // Wait for DOM to be ready
        setTimeout(() => {
            const priceBadges = document.querySelectorAll('.order-ladder-grid .price-level-badge');
            
            console.log(`💡 Found ${priceBadges.length} price badges for level numbering`);
            
            priceBadges.forEach((badge, index) => {
                const levelNumber = index + 1;
                const levelText = `Limit Order ${levelNumber}`;
                
                const originalPrice = badge.textContent.trim();
                badge.setAttribute('data-original-price', originalPrice);
                badge.setAttribute('data-level', levelNumber);
                badge.textContent = levelText;
                
                console.log(`🏷️ Set badge ${index + 1} to "${levelText}"`);
            });
            
            console.log(`✅ Successfully set level numbers on ${priceBadges.length} price badges`);
        }, 100);
    }

    startOrderMonitoring() {
        console.log('🔍 Starting order monitoring...');
        
        // Clear any existing interval
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        // Immediate check
        this.checkOrdersAndHighlight();
        
        // Regular monitoring every 5 seconds
        this.monitoringInterval = setInterval(() => {
            if (this.currentView === 'ladder') {
                this.checkOrdersAndHighlight();
            }
        }, 5000);
        
        console.log('✅ Order monitoring started');
    }

    async checkOrdersAndHighlight() {
        try {
            if (typeof amplManagerEnhanced !== 'undefined' && amplManagerEnhanced.getActiveOrders) {
                const orderData = await amplManagerEnhanced.getActiveOrders();
                
                if (orderData && (orderData.active || orderData.filled)) {
                    const activeOrders = orderData.active || [];
                    const filledOrders = orderData.filled || [];
                    
                    console.log(`📊 Highlighting: ${activeOrders.length} active, ${filledOrders.length} filled`);
                    
                    // Update badges without DOM replacement
                    this.updatePriceLevelBadges(activeOrders, filledOrders);
                }
            } else {
                console.log('📊 No active orders found');
            }
        } catch (error) {
            console.log('📊 Error in order monitoring:', error.message);
        }
    }

    updatePriceLevelBadges(activeOrders, filledOrders) {
        const priceBadges = document.querySelectorAll('.order-ladder-grid .price-level-badge');
        
        if (priceBadges.length === 0) {
            return;
        }
        
        console.log(`📊 Updating ${priceBadges.length} badges...`);
        
        // Reset all badges to empty state
        priceBadges.forEach(badge => {
            badge.className = 'price-level-badge empty';
        });
        
        // Highlight active orders as PENDING (orange)
        activeOrders.forEach((order, index) => {
            if (index < priceBadges.length) {
                priceBadges[index].className = 'price-level-badge pending';
            }
        });
        
        // Highlight filled orders as FILLED (green)
        filledOrders.forEach((order, index) => {
            if (index < priceBadges.length) {
                priceBadges[index].className = 'price-level-badge filled';
            }
        });
        
        console.log(`📊 Badge update complete`);
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pause-feed');
        const statusEl = document.getElementById('feed-status');
        
        if (pauseBtn && statusEl) {
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
        if (this.currentView === 'ladder') {
            this.updatePriceLevelBadges(activeOrders || [], executedOrders || []);
        }
        
        console.log(`💡 Manual update: ${(activeOrders || []).length} active, ${(executedOrders || []).length} executed`);
    }
}

// Initialize the activity feed
const amplActivityFeed = new AMPLActivityFeedArchitectural();

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

console.log('🎬 AMPL Activity Feed (Architectural Fix) loaded successfully');

