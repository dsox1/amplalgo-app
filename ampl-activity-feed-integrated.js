/**
 * AMPL Live Activity Feed - Fixed Toggle & Labeling
 * Enhanced with proper toggle positioning and level numbering
 * Price levels light up blue when limit orders are detected on KuCoin
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
            this.isShowingActivityFeed = true;
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
                font-size: 13px; /* +1pt from 12px */
                font-weight: 600;
                color: var(--text-primary, #ffffff);
            }

            .feed-title i {
                color: var(--accent-primary, #2196F3);
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
                color: var(--accent-primary, #2196F3);
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

            /* Enhanced Smart Order Ladder with toggle button */
            .smart-order-ladder-enhanced {
                position: relative;
            }

            /* Position toggle button in the outer Smart Order Ladder header */
            .ladder-section .section-header {
                position: relative;
            }

            .toggle-activity-feed-btn {
                position: absolute;
                top: 8px;
                right: 8px;
                background: rgba(33, 150, 243, 0.2);
                border: 2px solid rgba(33, 150, 243, 0.4);
                color: #2196F3;
                padding: 6px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.3s ease;
                z-index: 10;
                width: 28px;
                height: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 0 8px rgba(33, 150, 243, 0.3);
            }

            .toggle-activity-feed-btn:hover {
                background: rgba(33, 150, 243, 0.3);
                border-color: rgba(33, 150, 243, 0.6);
                box-shadow: 0 0 15px rgba(33, 150, 243, 0.5);
                transform: scale(1.1);
            }

            /* Enhanced price level badges with order detection */
            .price-level-badge {
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }

            /* Blue state: Active limit orders waiting to be filled */
            .price-level-badge.has-order {
                background: rgba(33, 150, 243, 0.2) !important;
                border: 2px solid #2196F3 !important;
                color: #2196F3 !important;
                box-shadow: 0 0 10px rgba(33, 150, 243, 0.3);
                animation: pulseBlue 2s infinite;
            }

            /* Green state: Executed/filled orders */
            .price-level-badge.executed-order {
                background: rgba(76, 175, 80, 0.2) !important;
                border: 2px solid #4CAF50 !important;
                color: #4CAF50 !important;
                box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
                animation: pulseGreen 2s infinite;
            }

            @keyframes pulseBlue {
                0%, 100% {
                    box-shadow: 0 0 10px rgba(33, 150, 243, 0.3);
                }
                50% {
                    box-shadow: 0 0 20px rgba(33, 150, 243, 0.6);
                }
            }

            @keyframes pulseGreen {
                0%, 100% {
                    box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
                }
                50% {
                    box-shadow: 0 0 20px rgba(76, 175, 80, 0.6);
                }
            }

            .price-level-badge.has-order::before {
                content: '●';
                position: absolute;
                top: 2px;
                right: 4px;
                color: #2196F3;
                font-size: 8px;
                animation: blink 1s infinite;
            }

            .price-level-badge.executed-order::before {
                content: '●';
                position: absolute;
                top: 2px;
                right: 4px;
                color: #4CAF50;
                font-size: 8px;
                animation: blink 1s infinite;
            }

            @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0.3; }
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
            // Add the enhanced content with toggle button
            const enhancedContent = this.addToggleButtonToOriginal(this.originalContent);
            this.targetPanel.innerHTML = enhancedContent;
            this.isShowingActivityFeed = false;
            
            // Set level numbers on price badges
            this.setPriceLevelNumbers();
            
            // Bind the toggle button
            this.bindToggleButton();
            
            // Start monitoring for order updates
            this.startOrderMonitoring();
            
            console.log('↩️ Order Board restored with toggle functionality');
        }
    }

    addToggleButtonToOriginal(originalContent) {
        // Find the Smart Order Ladder section and add toggle button to its header
        const sectionPattern = /<div[^>]*class="[^"]*ladder-section[^"]*"[^>]*>([\s\S]*?)<\/div>/;
        const sectionMatch = originalContent.match(sectionPattern);
        
        if (sectionMatch) {
            // Find the header within the section
            const headerPattern = /<div[^>]*class="[^"]*section-header[^"]*"[^>]*>([\s\S]*?)<\/div>/;
            const headerMatch = sectionMatch[1].match(headerPattern);
            
            if (headerMatch) {
                // Add toggle button to the header
                const enhancedHeader = headerMatch[0].replace(
                    /<\/div>$/,
                    `<button class="toggle-activity-feed-btn" id="toggle-activity-feed" title="Show Live Activity Feed">
                        <i class="fas fa-chart-line"></i>
                    </button></div>`
                );
                
                // Replace the header in the section
                const enhancedSection = sectionMatch[0].replace(headerPattern, enhancedHeader);
                
                // Replace the section in the original content
                const enhancedContent = originalContent.replace(sectionPattern, enhancedSection);
                
                console.log('✅ Toggle button added to Smart Order Ladder header');
                return enhancedContent;
            }
        }
        
        // Fallback: wrap content and add button (original method)
        const toggleButton = `
            <button class="toggle-activity-feed-btn" id="toggle-activity-feed" title="Show Live Activity Feed">
                <i class="fas fa-chart-line"></i>
            </button>
        `;
        
        return `
            <div class="smart-order-ladder-enhanced">
                ${toggleButton}
                ${originalContent}
            </div>
        `;
    }

    setPriceLevelNumbers() {
        // Wait a moment for DOM to settle
        setTimeout(() => {
            // Find all price level elements
            const selectors = [
                '.order-ladder-grid div',
                '.ladder-section div',
                '[class*="price"]',
                '.price-level-badge',
                '.ladder-price',
                '.price-badge'
            ];
            
            let priceBadges = [];
            
            // Try each selector until we find price badges
            for (const selector of selectors) {
                const elements = document.querySelectorAll(selector);
                // Filter to only elements that look like price badges
                priceBadges = Array.from(elements).filter(badge => {
                    const text = badge.textContent.trim();
                    const hasPrice = text && (text.includes('.') && text.match(/\d+\.\d+/));
                    const isVisible = badge.offsetWidth > 0 && badge.offsetHeight > 0;
                    const notButton = !badge.classList.contains('toggle-activity-feed-btn');
                    return hasPrice && isVisible && notButton;
                });
                
                if (priceBadges.length > 0) {
                    console.log(`💡 Setting level numbers on ${priceBadges.length} badges using selector: ${selector}`);
                    break;
                }
            }
            
            if (priceBadges.length === 0) {
                console.log('❌ No price badges found to set level numbers');
                return;
            }
            
            // Set level numbers on each badge
            priceBadges.forEach((badge, index) => {
                const levelNumber = index + 1;
                const levelText = `Limit Order ${levelNumber}`;
                
                // Store original price for reference
                const originalPrice = badge.textContent.trim();
                badge.setAttribute('data-original-price', originalPrice);
                
                // Set data attribute
                badge.setAttribute('data-level', levelText);
                
                // Replace the text content directly
                badge.textContent = levelText;
                
                // Add class for styling
                badge.classList.add('price-level-badge');
                
                console.log(`🏷️ Set badge ${index + 1} to "${levelText}" (was "${originalPrice}")`);
            });
            
            console.log(`✅ Successfully set level numbers on ${priceBadges.length} price badges`);
        }, 200);
    }

    bindToggleButton() {
        const toggleBtn = document.getElementById('toggle-activity-feed');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.showActivityFeed();
            });
        }
    }

    showActivityFeed() {
        this.replaceContent();
        this.isShowingActivityFeed = true;
        console.log('🎬 Switched back to Live Activity Feed');
    }

    startOrderMonitoring() {
        // Monitor for active orders and update price level indicators
        this.updatePriceLevelIndicators();
        
        // Set up periodic monitoring
        setInterval(() => {
            if (!this.isShowingActivityFeed) {
                this.updatePriceLevelIndicators();
            }
        }, 5000); // Check every 5 seconds
    }

    async updatePriceLevelIndicators() {
        try {
            // Get active orders from AMPL Manager if available
            if (typeof amplManagerEnhanced !== 'undefined') {
                // Try multiple methods to get order data
                let activeOrders = [];
                let executedOrders = [];
                
                if (amplManagerEnhanced.getActiveOrders) {
                    activeOrders = await amplManagerEnhanced.getActiveOrders() || [];
                }
                
                // Also try to get order status from the system
                if (typeof getAMPLStatus === 'function') {
                    const status = await getAMPLStatus();
                    if (status && status.orders) {
                        activeOrders = status.orders.filter(order => order.status === 'active' || order.status === 'pending');
                        executedOrders = status.orders.filter(order => order.status === 'filled' || order.status === 'executed');
                    }
                }
                
                this.activeOrders = activeOrders;
                this.executedOrders = executedOrders;
                
                console.log(`📊 Found ${activeOrders.length} active orders, ${executedOrders.length} executed orders`);
            } else {
                console.log('📊 AMPL Manager not available - keeping levels grey (local testing mode)');
            }
            
            // Update the visual indicators
            this.highlightActivePriceLevels();
            
        } catch (error) {
            console.log('📊 Order monitoring: ', error.message);
        }
    }

    highlightActivePriceLevels() {
        // Find all price level badges
        const priceBadges = document.querySelectorAll('.price-level-badge');
        
        if (priceBadges.length === 0) {
            console.log('❌ No price level badges found for highlighting');
            return;
        }
        
        // Log all found badges for debugging
        console.log('🔍 Found price badges:');
        priceBadges.forEach((badge, index) => {
            const levelText = badge.getAttribute('data-level') || badge.textContent.trim();
            console.log(`  ${index + 1}: "${levelText}" (${badge.className})`);
        });
        
        // Reset all badges to default state
        priceBadges.forEach(badge => {
            badge.classList.remove('has-order', 'executed-order');
        });
        
        // Only highlight if we have real order data (not local testing)
        if (!this.activeOrders || this.activeOrders.length === 0) {
            console.log('📊 No active orders - keeping price levels grey (correct for local testing)');
            return;
        }
        
        // Highlight badges that have active orders (blue)
        if (this.activeOrders && this.activeOrders.length > 0) {
            console.log(`💙 Processing ${this.activeOrders.length} active orders:`);
            
            this.activeOrders.forEach((order, orderIndex) => {
                const orderPrice = parseFloat(order.price);
                const orderLevel = order.level || (orderIndex + 1); // Use level if available, otherwise index
                console.log(`  Order ${orderIndex + 1}: $${orderPrice} (Level ${orderLevel})`);
                
                let matched = false;
                priceBadges.forEach((badge, badgeIndex) => {
                    const badgeLevel = badgeIndex + 1; // Badge level is its position (1-based)
                    
                    // Match by level number (preferred)
                    if (orderLevel === badgeLevel) {
                        badge.classList.add('has-order');
                        console.log(`    ✅ Matched by level: Badge ${badgeLevel} = Order Level ${orderLevel}`);
                        matched = true;
                    }
                });
                
                if (!matched) {
                    console.log(`    ❌ No badge found for order Level ${orderLevel} ($${orderPrice})`);
                }
            });
        }
        
        // Highlight badges that have executed orders (green)
        if (this.executedOrders && this.executedOrders.length > 0) {
            console.log(`💚 Processing ${this.executedOrders.length} executed orders:`);
            
            this.executedOrders.forEach((order, orderIndex) => {
                const orderPrice = parseFloat(order.price);
                const orderLevel = order.level || (orderIndex + 1);
                console.log(`  Executed Order ${orderIndex + 1}: $${orderPrice} (Level ${orderLevel})`);
                
                let matched = false;
                priceBadges.forEach((badge, badgeIndex) => {
                    const badgeLevel = badgeIndex + 1;
                    
                    // Match by level number (preferred)
                    if (orderLevel === badgeLevel) {
                        badge.classList.remove('has-order'); // Remove blue if it was there
                        badge.classList.add('executed-order');
                        console.log(`    ✅ Matched executed by level: Badge ${badgeLevel} = Order Level ${orderLevel}`);
                        matched = true;
                    }
                });
                
                if (!matched) {
                    console.log(`    ❌ No badge found for executed order Level ${orderLevel} ($${orderPrice})`);
                }
            });
        }
        
        const blueCount = document.querySelectorAll('.price-level-badge.has-order').length;
        const greenCount = document.querySelectorAll('.price-level-badge.executed-order').length;
        console.log(`💡 Final result: ${blueCount} blue levels, ${greenCount} green levels`);
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

    // Public method to manually update order indicators
    updateOrderIndicators(activeOrders, executedOrders) {
        this.activeOrders = activeOrders || [];
        this.executedOrders = executedOrders || [];
        if (!this.isShowingActivityFeed) {
            this.highlightActivePriceLevels();
        }
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

console.log('🎬 AMPL Activity Feed (Fixed Toggle & Labeling) loaded successfully');

