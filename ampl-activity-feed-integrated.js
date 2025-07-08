/**
 * AMPL Live Activity Feed - Improved Version
 * Enhanced with larger text (+1pt) and proper text wrapping
 * Maintains neat and tidy presentation
 */

class AMPLActivityFeedIntegrated {
    constructor() {
        this.messages = [];
        this.maxMessages = 50;
        this.isPaused = false;
        this.originalContent = null;
        this.targetPanel = null;
        this.isInitialized = false;
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        console.log('🎬 Initializing AMPL Activity Feed (replacing Order Board)...');
        
        // Find the Order Board panel
        this.findSmartOrderLadderPanel();
        
        if (this.targetPanel) {
            this.replaceContent();
            this.interceptConsoleMessages();
            this.connectToAMPLManager();
            this.isInitialized = true;
            console.log('✅ AMPL Activity Feed integrated successfully');
        } else {
            console.log('❌ Order Board panel not found');
        }
    }

    findSmartOrderLadderPanel() {
        // Strategy 1: Look for the ladder section specifically
        const ladderSection = document.querySelector('.ladder-section.order-ladder-section');
        if (ladderSection) {
            this.targetPanel = ladderSection.querySelector('.section-content');
            console.log('✅ Found Order Board via .ladder-section');
            return;
        }

        // Strategy 2: Look for section with "Smart Order Ladder" text
        const headers = document.querySelectorAll('.section-header h3');
        for (const header of headers) {
            if (header.textContent.includes('Smart Order Ladder')) {
                this.targetPanel = header.closest('.ladder-section')?.querySelector('.section-content');
                console.log('✅ Found Order Board via header text');
                return;
            }
        }

        // Strategy 3: Look for order-ladder-grid
        const ladderGrid = document.querySelector('.order-ladder-grid');
        if (ladderGrid) {
            this.targetPanel = ladderGrid.closest('.section-content');
            console.log('✅ Found Order Board via .order-ladder-grid');
            return;
        }

        console.log('❌ Order Board panel not found with any strategy');
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
                        <button class="feed-btn restore-btn" id="restore-ladder" title="Restore Original">
                            <i class="fas fa-undo"></i>
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
                font-size: 13px; /* +1pt from 12px */
                font-weight: 600;
                color: var(--text-primary, #ffffff);
            }

            .feed-title i {
                color: var(--accent-primary, #00DCFF);
            }

            .feed-status {
                font-size: 11px; /* +1pt from 10px */
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
                font-size: 11px; /* +1pt from 10px */
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
                font-size: 12px; /* +1pt more (was 11px) */
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
                font-size: 13px; /* +1pt more (was 12px) */
                line-height: 1.4; /* Improved line height for better text wrapping */
                border-left: 3px solid transparent;
                background: rgba(255, 255, 255, 0.02);
                animation: slideIn 0.3s ease;
                word-wrap: break-word; /* Enable word wrapping */
                overflow-wrap: break-word; /* Modern word wrapping */
                hyphens: auto; /* Enable hyphenation for better wrapping */
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
                border-left-color: var(--accent-primary, #00DCFF);
                background: rgba(0, 220, 255, 0.05);
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
                width: 15px; /* Slightly larger for better proportion */
                text-align: center;
                margin-top: 1px;
                font-size: 13px; /* +1pt more (was 12px) */
            }

            .message-content {
                flex: 1;
                min-width: 0; /* Allow content to shrink and wrap properly */
            }

            .message-text {
                color: var(--text-primary, #ffffff);
                margin-bottom: 2px;
                word-wrap: break-word; /* Enable word wrapping */
                overflow-wrap: break-word; /* Modern word wrapping */
                hyphens: auto; /* Enable hyphenation */
                line-height: 1.4; /* Better line spacing for wrapped text */
            }

            .message-time {
                color: var(--text-muted, #808080);
                font-size: 10px; /* +1pt from 9px */
                white-space: nowrap; /* Keep timestamp on one line */
            }

            .welcome-message {
                text-align: center;
                padding: 20px;
                color: var(--text-secondary, #b0b0b0);
            }

            .welcome-message i {
                display: block;
                font-size: 25px; /* +1pt from 24px */
                margin-bottom: 8px;
                color: var(--accent-primary, #00DCFF);
            }

            .welcome-message span {
                display: block;
                font-weight: 600;
                margin-bottom: 4px;
                font-size: 13px; /* +1pt from 12px */
            }

            .welcome-message small {
                font-size: 11px; /* +1pt from 10px */
                opacity: 0.7;
            }

            /* Enhanced text wrapping for long messages */
            .message-text {
                max-width: 100%;
                overflow: hidden;
                text-overflow: ellipsis;
                display: -webkit-box;
                -webkit-line-clamp: 3; /* Limit to 3 lines max */
                -webkit-box-orient: vertical;
                white-space: normal; /* Allow text to wrap */
            }

            /* Hover to show full message if truncated */
            .activity-message:hover .message-text {
                -webkit-line-clamp: unset; /* Show full text on hover */
                max-height: none;
                overflow: visible;
                text-overflow: unset;
            }

            /* Ensure neat alignment */
            .activity-message {
                align-items: flex-start; /* Align to top for multi-line messages */
            }

            /* Better spacing for wrapped content */
            .message-content {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
        `;
        document.head.appendChild(style);
    }

    bindEventListeners() {
        // Pause/Resume button
        const pauseBtn = document.getElementById('pause-feed');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.togglePause());
        }

        // Clear button
        const clearBtn = document.getElementById('clear-feed');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearMessages());
        }

        // Restore button
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
        if (this.targetPanel && this.originalContent) {
            this.targetPanel.innerHTML = this.originalContent;
            console.log('↩️ Order Board restored');
        }
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

        this.messages.unshift(message); // Add to beginning

        // Limit messages
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
        
        // Auto-scroll to top (newest messages)
        messagesContainer.scrollTop = 0;
    }

    updateMessageCounter() {
        const counterEl = document.getElementById('message-count');
        if (counterEl) {
            counterEl.textContent = `${this.messages.length} messages`;
        }
    }

    interceptConsoleMessages() {
        // Store original console methods
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        // Override console.log to capture AMPL messages
        console.log = (...args) => {
            originalLog.apply(console, args);
            
            const message = args.join(' ');
            if (this.isAMPLMessage(message)) {
                this.processAMPLMessage(message);
            }
        };

        // Override console.warn
        console.warn = (...args) => {
            originalWarn.apply(console, args);
            
            const message = args.join(' ');
            if (this.isAMPLMessage(message)) {
                this.addMessage(message, 'error', '⚠️');
            }
        };

        // Override console.error
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

        // Determine message type and icon
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

        // Clean up the message
        const cleanMessage = message
            .replace(/^[🎉✅❌⚠️💰📊🔄🎯📈💸]+\s*/, '') // Remove leading emojis
            .replace(/^\w+:\s*/, '') // Remove log level prefixes
            .trim();

        this.addMessage(cleanMessage, type, icon);
    }

    connectToAMPLManager() {
        // Try to connect to the AMPL Manager Enhanced
        if (typeof amplManagerEnhanced !== 'undefined') {
            console.log('🔗 Connected to AMPL Manager Enhanced');
            this.addMessage('Connected to AMPL Manager Enhanced', 'system', '🔗');
            
            // Hook into AMPL manager events if available
            this.hookIntoAMPLEvents();
        } else {
            console.log('⏳ Waiting for AMPL Manager Enhanced...');
            // Try again in 2 seconds
            setTimeout(() => this.connectToAMPLManager(), 2000);
        }
    }

    hookIntoAMPLEvents() {
        // Add periodic status updates
        setInterval(() => {
            if (!this.isPaused && typeof amplManagerEnhanced !== 'undefined') {
                // Add a subtle status update every 30 seconds
                const now = new Date();
                if (now.getSeconds() === 0 || now.getSeconds() === 30) {
                    this.addMessage('System monitoring active', 'system', '🔍');
                }
            }
        }, 30000);
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

console.log('🎬 AMPL Activity Feed (Improved) loaded successfully');

