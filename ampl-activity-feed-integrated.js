/**
 * AMPL Live Activity Feed - CRITICAL FIX
 * Fixed to prevent targeting AMPL Rebase Protection Monitor
 * Enhanced KuCoin order detection for live environment
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
        this.smartOrderLadderContainer = null; // Store reference to prevent cross-contamination
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        console.log('🎬 Initializing AMPL Activity Feed (Critical Fix)...');
        
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
        // Strategy 1: Look for the ladder section specifically with SMART ORDER LADDER title
        const sections = document.querySelectorAll('.ladder-section');
        for (const section of sections) {
            const header = section.querySelector('.section-header h3');
            if (header && header.textContent.includes('SMART ORDER LADDER')) {
                this.targetPanel = section.querySelector('.section-content');
                this.smartOrderLadderContainer = section; // Store container reference
                console.log('✅ Found Smart Order Ladder via section header');
                return;
            }
        }

        // Strategy 2: Look for order-ladder-grid within a section
        const ladderGrids = document.querySelectorAll('.order-ladder-grid');
        for (const grid of ladderGrids) {
            const section = grid.closest('.ladder-section');
            if (section) {
                const header = section.querySelector('.section-header h3');
                // Make sure it's not the rebase protection monitor
                if (header && !header.textContent.includes('REBASE PROTECTION')) {
                    this.targetPanel = section.querySelector('.section-content');
                    this.smartOrderLadderContainer = section;
                    console.log('✅ Found Smart Order Ladder via grid');
                    return;
                }
            }
        }

        console.log('❌ Smart Order Ladder panel not found');
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

            /* CRITICAL: Only target price badges within Smart Order Ladder */
            .smart-order-ladder-enhanced .price-level-badge,
            .ladder-section[data-ladder-type="smart-order"] .price-level-badge {
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }

            /* Blue state: Active limit orders waiting to be filled */
            .smart-order-ladder-enhanced .price-level-badge.has-order,
            .ladder-section[data-ladder-type="smart-order"] .price-level-badge.has-order {
                background: rgba(33, 150, 243, 0.2) !important;
                border: 2px solid #2196F3 !important;
                color: #2196F3 !important;
                box-shadow: 0 0 10px rgba(33, 150, 243, 0.3);
                animation: pulseBlue 2s infinite;
            }

            /* Green state: Executed/filled orders */
            .smart-order-ladder-enhanced .price-level-badge.executed-order,
            .ladder-section[data-ladder-type="smart-order"] .price-level-badge.executed-order {
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

            .smart-order-ladder-enhanced .price-level-badge.has-order::before,
            .ladder-section[data-ladder-type="smart-order"] .price-level-badge.has-order::before {
                content: '●';
                position: absolute;
                top: 2px;
                right: 4px;
                color: #2196F3;
                font-size: 8px;
                animation: blink 1s infinite;
            }

            .smart-order-ladder-enhanced .price-level-badge.executed-order::before,
            .ladder-section[data-ladder-type="smart-order"] .price-level-badge.executed-order::before {
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
            
            // Mark the container to prevent cross-contamination
            if (this.smartOrderLadderContainer) {
                this.smartOrderLadderContainer.setAttribute('data-ladder-type', 'smart-order');
            }
            
            // Set level numbers on price badges
            this.setPriceLevelNumbers();
            
            // Bind the toggle button
            this.bindToggleButton();
            
            // Start monitoring for order updates
            this.startOrderMonitoring();
            
            console.log('↩️ Smart Order Ladder restored with toggle functionality');
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
            // CRITICAL: Only target elements within the Smart Order Ladder container
            if (!this.smartOrderLadderContainer) {
                console.log('❌ No Smart Order Ladder container reference - skipping labeling');
                return;
            }

            // Find price elements ONLY within the Smart Order Ladder
            const selectors = [
                '.order-ladder-grid div',
                '[class*="price"]',
                '.price-level-badge',
                '.ladder-price',
                '.price-badge'
            ];
            
            let priceBadges = [];
            
            // Try each selector within the Smart Order Ladder container only
            for (const selector of selectors) {
                const elements = this.smartOrderLadderContainer.querySelectorAll(selector);
                // Filter to only elements that look like price badges
                priceBadges = Array.from(elements).filter(badge => {
                    const text = badge.textContent.trim();
                    const hasPrice = text && (text.includes('.') && text.match(/\d+\.\d+/));
                    const isVisible = badge.offsetWidth > 0 && badge.offsetHeight > 0;
                    const notButton = !badge.classList.contains('toggle-activity-feed-btn');
                    const notInRebaseMonitor = !badge.closest('[class*="rebase"]') && !badge.closest('[class*="protection"]');
                    return hasPrice && isVisible && notButton && notInRebaseMonitor;
                });
                
                if (priceBadges.length > 0) {
                    console.log(`💡 Setting level numbers on ${priceBadges.length} badges using selector: ${selector}`);
                    break;
                }
            }
            
            if (priceBadges.length === 0) {
                console.log('❌ No price badges found in Smart Order Ladder to set level numbers');
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
                
                console.log(`🏷️ Set Smart Order Ladder badge ${index + 1} to "${levelText}" (was "${originalPrice}")`);
            });
            
            console.log(`✅ Successfully set level numbers on ${priceBadges.length} Smart Order Ladder price badges`);
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
            // Enhanced KuCoin order detection for live environment
            let activeOrders = [];
            let executedOrders = [];
            
            // Method 1: Try AMPL Manager Enhanced
            if (typeof amplManagerEnhanced !== 'undefined') {
                if (amplManagerEnhanced.getActiveOrders) {
                    activeOrders = await amplManagerEnhanced.getActiveOrders() || [];
                }
                
                if (amplManagerEnhanced.getOrderStatus) {
                    const status = await amplManagerEnhanced.getOrderStatus();
                    if (status && status.orders) {
                        activeOrders = status.orders.filter(order => order.status === 'active' || order.status === 'pending');
                        executedOrders = status.orders.filter(order => order.status === 'filled' || order.status === 'executed');
                    }
                }
            }
            
            // Method 2: Try global AMPL status function
            if (typeof getAMPLStatus === 'function') {
                const status = await getAMPLStatus();
                if (status && status.orders) {
                    activeOrders = status.orders.filter(order => order.status === 'active' || order.status === 'pending');
                    executedOrders = status.orders.filter(order => order.status === 'filled' || order.status === 'executed');
                }
            }
            
            // Method 3: Try KuCoin API directly
            if (typeof kucoinAPI !== 'undefined' && kucoinAPI.getActiveOrders) {
                try {
                    const kucoinOrders = await kucoinAPI.getActiveOrders('AMPL-USDT');
                    if (kucoinOrders && kucoinOrders.length > 0) {
                        activeOrders = kucoinOrders.filter(order => order.side === 'buy' && order.type === 'limit');
                        console.log(`🔗 Found ${activeOrders.length} active KuCoin orders`);
                    }
                } catch (error) {
                    console.log('📊 KuCoin API error:', error.message);
                }
            }
            
            // Method 4: Parse from console/DOM for order information
            this.parseOrdersFromDOM();
            
            this.activeOrders = activeOrders;
            this.executedOrders = executedOrders;
            
            console.log(`📊 Live Environment: ${activeOrders.length} active orders, ${executedOrders.length} executed orders`);
            
            // Update the visual indicators
            this.highlightActivePriceLevels();
            
        } catch (error) {
            console.log('📊 Order monitoring error: ', error.message);
        }
    }

    parseOrdersFromDOM() {
        // Look for order information in the Limit Orders panel
        const limitOrdersPanel = document.querySelector('.limit-orders-section');
        if (limitOrdersPanel) {
            const pendingElement = limitOrdersPanel.querySelector('.pending-trades');
            if (pendingElement) {
                const pendingText = pendingElement.textContent;
                const pendingCount = parseInt(pendingText) || 0;
                
                if (pendingCount > 0) {
                    console.log(`📊 Found ${pendingCount} pending orders from Limit Orders panel`);
                    
                    // Generate expected orders based on pending count
                    const expectedOrders = [];
                    for (let i = 0; i < pendingCount; i++) {
                        expectedOrders.push({
                            level: i + 1,
                            price: `1.${1000 + (i * 100)}`, // Placeholder prices
                            status: 'active'
                        });
                    }
                    
                    this.activeOrders = expectedOrders;
                }
            }
        }
    }

    highlightActivePriceLevels() {
        // CRITICAL: Only find price badges within the Smart Order Ladder container
        if (!this.smartOrderLadderContainer) {
            console.log('❌ No Smart Order Ladder container - cannot highlight levels');
            return;
        }

        const priceBadges = this.smartOrderLadderContainer.querySelectorAll('.price-level-badge');
        
        if (priceBadges.length === 0) {
            console.log('❌ No price level badges found in Smart Order Ladder for highlighting');
            return;
        }
        
        // Log all found badges for debugging
        console.log('🔍 Found Smart Order Ladder price badges:');
        priceBadges.forEach((badge, index) => {
            const levelText = badge.getAttribute('data-level') || badge.textContent.trim();
            console.log(`  ${index + 1}: "${levelText}" (${badge.className})`);
        });
        
        // Reset all badges to default state
        priceBadges.forEach(badge => {
            badge.classList.remove('has-order', 'executed-order');
        });
        
        // Only highlight if we have real order data
        if (!this.activeOrders || this.activeOrders.length === 0) {
            console.log('📊 No active orders - keeping price levels grey');
            return;
        }
        
        // Highlight badges that have active orders (blue)
        if (this.activeOrders && this.activeOrders.length > 0) {
            console.log(`💙 Processing ${this.activeOrders.length} active orders:`);
            
            this.activeOrders.forEach((order, orderIndex) => {
                const orderLevel = order.level || (orderIndex + 1);
                console.log(`  Order ${orderIndex + 1}: Level ${orderLevel}`);
                
                // Match by level number
                if (orderLevel <= priceBadges.length) {
                    const badge = priceBadges[orderLevel - 1]; // Convert to 0-based index
                    badge.classList.add('has-order');
                    console.log(`    ✅ Highlighted Level ${orderLevel} badge`);
                } else {
                    console.log(`    ❌ Level ${orderLevel} exceeds available badges (${priceBadges.length})`);
                }
            });
        }
        
        // Highlight badges that have executed orders (green)
        if (this.executedOrders && this.executedOrders.length > 0) {
            console.log(`💚 Processing ${this.executedOrders.length} executed orders:`);
            
            this.executedOrders.forEach((order, orderIndex) => {
                const orderLevel = order.level || (orderIndex + 1);
                console.log(`  Executed Order ${orderIndex + 1}: Level ${orderLevel}`);
                
                // Match by level number
                if (orderLevel <= priceBadges.length) {
                    const badge = priceBadges[orderLevel - 1]; // Convert to 0-based index
                    badge.classList.remove('has-order'); // Remove blue if it was there
                    badge.classList.add('executed-order');
                    console.log(`    ✅ Highlighted executed Level ${orderLevel} badge`);
                }
            });
        }
        
        const blueCount = this.smartOrderLadderContainer.querySelectorAll('.price-level-badge.has-order').length;
        const greenCount = this.smartOrderLadderContainer.querySelectorAll('.price-level-badge.executed-order').length;
        console.log(`💡 Smart Order Ladder result: ${blueCount} blue levels, ${greenCount} green levels`);
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

console.log('🎬 AMPL Activity Feed (Critical Fix) loaded successfully');

