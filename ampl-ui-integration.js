/**
 * AMPL UI Integration System - FIXED VERSION
 * Proper color coding, order status logic, and display fixes
 */

class AMPLUIIntegration {
    constructor() {
        this.monitoringData = null;
        this.updateInterval = null;
        this.isMonitoring = false;
        this.lastUpdateTime = null;
        
        // Prevent multiple instances
        if (window.amplUIIntegration) {
            console.log('🎨 AMPL UI Integration already exists, skipping...');
            return window.amplUIIntegration;
        }
        
        // UI element selectors
        this.selectors = {
            // Limit Orders Panel
            limitOrdersPanel: '.limit-orders-panel, [class*="limit"], [class*="order"]',
            activeTradesCount: '#active-trades-count, .active-trades-count, [data-count="active"]',
            pendingTradesCount: '#pending-trades-count, .pending-trades-count, [data-count="pending"]',
            orderStatusDisplay: '.order-status-display, .order-status, [data-status="orders"]',
            
            // Smart Order Ladder
            smartOrderLadder: '.smart-order-ladder, [class*="ladder"], [data-ladder]',
            orderLadderInputs: '.smart-order-ladder input[type="text"], input[class*="ladder"], input[data-level]',
            
            // Rebase Protection Monitor
            rebaseProtectionPanel: '.rebase-protection-panel, [class*="rebase"], [class*="protection"]',
            
            // AMPL Manager Toggle
            amplManagerToggle: '#ampl-manager-toggle, input[type="checkbox"][id*="ampl"], input[type="checkbox"][class*="ampl"]'
        };
        
        console.log('🎨 AMPL UI Integration (Fixed) initializing...');
        this.initialize();
    }
    
    /**
     * Initialize UI integration
     */
    initialize() {
        // IMMEDIATELY remove any purple buttons before they can appear
        this.removeAllPurpleButtons();
        
        // Set up observer to catch any dynamically created purple buttons
        this.setupButtonObserver();
        
        // Set up AMPL Manager integration
        this.setupAMPLManagerIntegration();
        
        // Initialize UI panels with proper styling
        this.initializePanels();
        
        console.log('🎨 UI Integration (Fixed) setup complete');
    }
    
    /**
     * Aggressively remove all purple cascade buttons
     */
    removeAllPurpleButtons() {
        // Remove any existing buttons immediately
        const removeButtons = () => {
            // Multiple strategies to find and remove buttons
            const strategies = [
                // By text content
                () => {
                    const allButtons = document.querySelectorAll('button');
                    allButtons.forEach(button => {
                        const text = button.textContent.toLowerCase();
                        if (text.includes('cascade') || text.includes('🌊') || 
                            (text.includes('deploy') && text.includes('ampl'))) {
                            console.log('🗑️ Removing cascade button:', button.textContent);
                            button.remove();
                        }
                    });
                },
                
                // By style attributes
                () => {
                    const styleSelectors = [
                        'button[style*="purple"]',
                        'button[style*="#8B5CF6"]',
                        'button[style*="#7C3AED"]',
                        'button[style*="position: fixed"]',
                        'button[style*="position: absolute"]'
                    ];
                    
                    styleSelectors.forEach(selector => {
                        try {
                            document.querySelectorAll(selector).forEach(button => {
                                console.log('🗑️ Removing styled button:', button.textContent);
                                button.remove();
                            });
                        } catch (e) {
                            // Invalid selector, continue
                        }
                    });
                },
                
                // By class names
                () => {
                    const classSelectors = [
                        '.cascade-button',
                        '.deploy-cascade',
                        '[class*="cascade"]',
                        '[class*="purple"]'
                    ];
                    
                    classSelectors.forEach(selector => {
                        try {
                            document.querySelectorAll(selector).forEach(button => {
                                if (button.tagName === 'BUTTON') {
                                    console.log('🗑️ Removing classed button:', button.textContent);
                                    button.remove();
                                }
                            });
                        } catch (e) {
                            // Invalid selector, continue
                        }
                    });
                }
            ];
            
            strategies.forEach(strategy => {
                try {
                    strategy();
                } catch (e) {
                    console.warn('Button removal strategy failed:', e);
                }
            });
        };
        
        // Remove immediately
        removeButtons();
        
        // Remove again after short delay
        setTimeout(removeButtons, 100);
        setTimeout(removeButtons, 500);
        setTimeout(removeButtons, 1000);
    }
    
    /**
     * Set up observer to catch dynamically created buttons
     */
    setupButtonObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if the added node is a button
                        if (node.tagName === 'BUTTON') {
                            this.checkAndRemoveButton(node);
                        }
                        
                        // Check if the added node contains buttons
                        const buttons = node.querySelectorAll ? node.querySelectorAll('button') : [];
                        buttons.forEach(button => this.checkAndRemoveButton(button));
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('👁️ Button observer active - will catch any new purple buttons');
    }
    
    /**
     * Check and remove a specific button if it's a cascade button
     */
    checkAndRemoveButton(button) {
        const text = button.textContent.toLowerCase();
        const style = button.getAttribute('style') || '';
        const className = button.className || '';
        
        if (text.includes('cascade') || text.includes('🌊') || 
            (text.includes('deploy') && text.includes('ampl')) ||
            style.includes('purple') || style.includes('#8B5CF6') || style.includes('#7C3AED') ||
            className.includes('cascade')) {
            console.log('🗑️ Observer caught and removed cascade button:', text);
            button.remove();
        }
    }
    
    /**
     * Setup AMPL Manager integration
     */
    setupAMPLManagerIntegration() {
        // Find AMPL Manager toggle
        const toggle = document.querySelector(this.selectors.amplManagerToggle);
        
        if (toggle) {
            console.log('✅ Found AMPL Manager toggle');
            
            // Start monitoring when enabled
            toggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    console.log('🎯 AMPL Manager enabled - starting UI monitoring');
                    this.startMonitoring();
                } else {
                    console.log('🎯 AMPL Manager disabled - stopping UI monitoring');
                    this.stopMonitoring();
                }
            });
            
            // If already checked, start monitoring
            if (toggle.checked) {
                setTimeout(() => this.startMonitoring(), 2000);
            }
        } else {
            console.warn('⚠️ AMPL Manager toggle not found');
        }
    }
    
    /**
     * Initialize all UI panels with proper styling
     */
    initializePanels() {
        this.initializeLimitOrdersPanel();
        this.initializeSmartOrderLadder();
        this.initializeRebaseProtectionMonitor();
        
        // Add desktop-specific styling for better readability
        this.addDesktopStyling();
    }
    
    /**
     * Add desktop-specific styling for better readability
     */
    addDesktopStyling() {
        // Only apply to desktop (screen width > 768px)
        const style = document.createElement('style');
        style.textContent = `
            @media (min-width: 769px) {
                .order-status-display {
                    font-size: 18px !important;
                    font-weight: bold !important;
                    padding: 15px !important;
                    background: #1F2937 !important;
                    color: white !important;
                    border-radius: 8px !important;
                    margin: 10px 0 !important;
                    text-align: center !important;
                    border: 2px solid #374151 !important;
                }
                
                .active-trades-count, .pending-trades-count,
                #active-trades-count, #pending-trades-count {
                    font-size: 24px !important;
                    font-weight: bold !important;
                    color: #10B981 !important;
                    text-shadow: 0 0 5px rgba(16, 185, 129, 0.5) !important;
                }
                
                .smart-order-ladder input[type="text"] {
                    font-size: 16px !important;
                    font-weight: bold !important;
                    text-align: center !important;
                    padding: 8px !important;
                    border-radius: 5px !important;
                    transition: all 0.3s ease !important;
                }
                
                .rebase-protection-display {
                    font-size: 16px !important;
                    padding: 15px !important;
                }
                
                .progress-percentage {
                    font-size: 18px !important;
                    font-weight: bold !important;
                }
            }
        `;
        document.head.appendChild(style);
        
        console.log('🎨 Desktop styling applied for better readability');
    }
    
    /**
     * Start monitoring and UI updates
     */
    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        console.log('👁️ Starting order monitoring and UI updates');
        
        // Initial update
        this.updateAllPanels();
        
        // Set up periodic updates every 15 seconds (more frequent for better responsiveness)
        this.updateInterval = setInterval(() => {
            this.updateAllPanels();
        }, 15000);
    }
    
    /**
     * Stop monitoring and UI updates
     */
    stopMonitoring() {
        if (!this.isMonitoring) return;
        
        this.isMonitoring = false;
        console.log('🛑 Stopping order monitoring and UI updates');
        
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        // Clear UI panels
        this.clearAllPanels();
    }
    
    /**
     * Update all UI panels with latest data
     */
    async updateAllPanels() {
        try {
            console.log('🔄 Updating all UI panels...');
            
            // Fetch latest monitoring data
            const response = await fetch(`${window.SUPABASE_URL || 'https://fbkcdirkshubectuvxzi.supabase.co'}/functions/v1/ampl-order-monitor`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia2NkaXJrc2h1YmVjdHV2eHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NDc0ODAsImV4cCI6MjA2MjAyMzQ4MH0.yhy1JL-V9zQVK1iIdSVK1261qD8gmHmo2vB-qe7Kit8'}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refill: false }) // Just monitor, don't refill
            });
            
            if (!response.ok) {
                throw new Error(`Monitor API error: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.monitoringData = result.data;
                this.lastUpdateTime = new Date();
                
                // Update all panels with stable data
                this.updateLimitOrdersPanel();
                this.updateSmartOrderLadder();
                this.updateRebaseProtectionMonitor();
                
                console.log('✅ UI panels updated successfully');
            } else {
                console.error('❌ Monitor API error:', result.error);
            }
            
        } catch (error) {
            console.error('❌ Error updating UI panels:', error);
        }
    }
    
    /**
     * Initialize Limit Orders Panel
     */
    initializeLimitOrdersPanel() {
        let statusEl = document.querySelector(this.selectors.orderStatusDisplay);
        
        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.className = 'order-status-display';
            statusEl.innerHTML = '<strong>0 pending orders, 0 active trades</strong>';
            
            // Find the best place to insert it
            const panel = document.querySelector(this.selectors.limitOrdersPanel);
            if (panel) {
                panel.appendChild(statusEl);
            } else {
                // Create a container if none exists
                const container = document.createElement('div');
                container.className = 'limit-orders-panel';
                container.appendChild(statusEl);
                document.body.appendChild(container);
            }
        }
        
        console.log('✅ Limit Orders Panel initialized');
    }
    
    /**
     * Update Limit Orders Panel with correct logic
     */
    updateLimitOrdersPanel() {
        if (!this.monitoringData) return;
        
        const { orderStatus, existingOrders } = this.monitoringData;
        
        // CORRECT LOGIC:
        // Pending = Orders deployed but not executed (active limit orders waiting)
        // Active = Orders that have been executed and are now trading positions
        
        const pendingOrders = existingOrders.filter(order => order.status === 'active').length; // Active limit orders = pending execution
        const activeOrders = existingOrders.filter(order => order.status === 'filled').length;  // Filled orders = active trades
        
        // Update main status display with stable text (no flickering)
        const statusEl = document.querySelector(this.selectors.orderStatusDisplay);
        if (statusEl) {
            // Use a stable update approach
            const newText = `<strong>${pendingOrders} pending orders, ${activeOrders} active trades</strong>`;
            if (statusEl.innerHTML !== newText) {
                statusEl.innerHTML = newText;
            }
        }
        
        // Update individual count elements
        const pendingEl = document.querySelector(this.selectors.pendingTradesCount);
        const activeEl = document.querySelector(this.selectors.activeTradesCount);
        
        if (pendingEl && pendingEl.textContent !== pendingOrders.toString()) {
            pendingEl.textContent = pendingOrders;
        }
        if (activeEl && activeEl.textContent !== activeOrders.toString()) {
            activeEl.textContent = activeOrders;
        }
        
        console.log(`📊 Limit Orders Panel: ${pendingOrders} pending, ${activeOrders} active`);
    }
    
    /**
     * Initialize Smart Order Ladder
     */
    initializeSmartOrderLadder() {
        const ladder = document.querySelector(this.selectors.smartOrderLadder);
        if (!ladder) {
            console.warn('⚠️ Smart Order Ladder not found');
            return;
        }
        
        console.log('✅ Smart Order Ladder initialized');
    }
    
    /**
     * Update Smart Order Ladder with PROPER color progression
     */
    updateSmartOrderLadder() {
        if (!this.monitoringData) return;
        
        const { existingOrders, expectedLevels } = this.monitoringData;
        const inputs = document.querySelectorAll(this.selectors.orderLadderInputs);
        
        inputs.forEach((input, index) => {
            if (index < expectedLevels.length) {
                const expectedLevel = expectedLevels[index];
                const existingOrder = existingOrders.find(o => o.level === expectedLevel.level);
                
                // Update input value only if different
                const newValue = expectedLevel.price.toFixed(4);
                if (input.value !== newValue) {
                    input.value = newValue;
                }
                
                // CORRECT COLOR LOGIC:
                // Gray = No order at this level (empty)
                // Orange = Order deployed but not executed (pending)
                // Green = Order executed/filled (active trade)
                
                let newStyle = {};
                
                if (!existingOrder) {
                    // Gray = Empty (no order at this level)
                    newStyle = {
                        backgroundColor: '#374151',
                        color: '#9CA3AF',
                        border: '1px solid #4B5563'
                    };
                } else if (existingOrder.status === 'active') {
                    // Orange = Pending (order deployed, waiting for execution)
                    newStyle = {
                        backgroundColor: '#F59E0B',
                        color: 'white',
                        border: '2px solid #D97706'
                    };
                } else if (existingOrder.status === 'filled') {
                    // Green = Filled (order executed, now active trade)
                    newStyle = {
                        backgroundColor: '#10B981',
                        color: 'white',
                        border: '2px solid #059669'
                    };
                }
                
                // Apply styles only if they've changed (prevent flickering)
                Object.keys(newStyle).forEach(prop => {
                    if (input.style[prop] !== newStyle[prop]) {
                        input.style[prop] = newStyle[prop];
                    }
                });
            }
        });
        
        console.log(`🎯 Smart Order Ladder updated: ${existingOrders.length}/${expectedLevels.length} levels with orders`);
    }
    
    /**
     * Initialize Rebase Protection Monitor
     */
    initializeRebaseProtectionMonitor() {
        let rebaseEl = document.querySelector('.rebase-protection-display');
        
        if (!rebaseEl) {
            rebaseEl = document.createElement('div');
            rebaseEl.className = 'rebase-protection-display';
            rebaseEl.innerHTML = `
                <div style="margin-bottom: 10px;"><strong>Rebase Protection Monitor</strong></div>
                <div class="progress-bar-container" style="background: #374151; height: 20px; border-radius: 10px; overflow: hidden; margin: 5px 0;">
                    <div class="progress-bar" style="height: 100%; background: #10B981; width: 0%; transition: width 0.3s ease;"></div>
                </div>
                <div class="progress-percentage" style="text-align: center; margin: 5px 0;">0% Unknown</div>
                <div class="value-display" style="display: flex; justify-content: space-between; font-size: 12px;">
                    <span>Original: <span class="original-value">$0.00</span></span>
                    <span>Current: <span class="current-value">$0.00</span></span>
                    <span>Diff: <span class="diff-value">$0.00</span></span>
                </div>
            `;
            
            // Find the best place to insert it
            const panel = document.querySelector(this.selectors.rebaseProtectionPanel);
            if (panel) {
                panel.appendChild(rebaseEl);
            } else {
                // Create container if none exists
                const container = document.createElement('div');
                container.className = 'rebase-protection-panel';
                container.appendChild(rebaseEl);
                document.body.appendChild(container);
            }
        }
        
        console.log('✅ Rebase Protection Monitor initialized');
    }
    
    /**
     * Update Rebase Protection Monitor
     */
    updateRebaseProtectionMonitor() {
        if (!this.monitoringData) return;
        
        const { rebaseProtection } = this.monitoringData;
        
        // Update progress bar
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            const percentage = Math.max(0, Math.min(100, parseFloat(rebaseProtection.safetyRatio) * 100));
            const newWidth = `${percentage}%`;
            
            if (progressBar.style.width !== newWidth) {
                progressBar.style.width = newWidth;
            }
            
            // Color coding based on safety level
            let newColor;
            if (percentage >= 100) {
                newColor = '#10B981'; // Green - Safe
            } else if (percentage >= 95) {
                newColor = '#F59E0B'; // Orange - Caution
            } else {
                newColor = '#EF4444'; // Red - Danger
            }
            
            if (progressBar.style.backgroundColor !== newColor) {
                progressBar.style.backgroundColor = newColor;
            }
        }
        
        // Update percentage display
        const percentageEl = document.querySelector('.progress-percentage');
        if (percentageEl) {
            const percentage = (parseFloat(rebaseProtection.safetyRatio) * 100).toFixed(0);
            const newText = `${percentage}% ${rebaseProtection.status}`;
            
            if (percentageEl.textContent !== newText) {
                percentageEl.textContent = newText;
                
                // Color coding for text
                percentageEl.style.color = rebaseProtection.status === 'Safe' ? '#10B981' : 
                                          rebaseProtection.status === 'Caution' ? '#F59E0B' : '#EF4444';
            }
        }
        
        // Update value displays
        const originalEl = document.querySelector('.original-value');
        const currentEl = document.querySelector('.current-value');
        const diffEl = document.querySelector('.diff-value');
        
        if (originalEl) {
            const newText = `$${rebaseProtection.estimatedPurchase}`;
            if (originalEl.textContent !== newText) {
                originalEl.textContent = newText;
            }
        }
        
        if (currentEl) {
            const newText = `$${rebaseProtection.currentValue}`;
            if (currentEl.textContent !== newText) {
                currentEl.textContent = newText;
            }
        }
        
        if (diffEl) {
            const diff = parseFloat(rebaseProtection.currentValue) - parseFloat(rebaseProtection.estimatedPurchase);
            const sign = diff >= 0 ? '+' : '';
            const newText = `${sign}$${diff.toFixed(2)}`;
            
            if (diffEl.textContent !== newText) {
                diffEl.textContent = newText;
                diffEl.style.color = diff >= 0 ? '#10B981' : '#EF4444';
            }
        }
        
        console.log(`🛡️ Rebase Protection: ${rebaseProtection.safetyRatio} ratio (${rebaseProtection.status})`);
    }
    
    /**
     * Clear all UI panels
     */
    clearAllPanels() {
        // Clear Limit Orders Panel
        const statusEl = document.querySelector(this.selectors.orderStatusDisplay);
        if (statusEl) {
            statusEl.innerHTML = '<strong>0 pending orders, 0 active trades</strong>';
        }
        
        // Clear Smart Order Ladder
        const inputs = document.querySelectorAll(this.selectors.orderLadderInputs);
        inputs.forEach(input => {
            input.value = '';
            input.style.backgroundColor = '#374151';
            input.style.color = '#9CA3AF';
            input.style.border = '1px solid #4B5563';
        });
        
        // Clear Rebase Protection Monitor
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = '0%';
            progressBar.style.backgroundColor = '#6B7280';
        }
        
        const percentageEl = document.querySelector('.progress-percentage');
        if (percentageEl) {
            percentageEl.textContent = '0% Unknown';
            percentageEl.style.color = '#6B7280';
        }
        
        console.log('🧹 All UI panels cleared');
    }
    
    /**
     * Get current status
     */
    getStatus() {
        return {
            isMonitoring: this.isMonitoring,
            hasData: !!this.monitoringData,
            lastUpdate: this.lastUpdateTime,
            orderStatus: this.monitoringData?.orderStatus
        };
    }
}

// Initialize UI Integration when DOM is loaded
let amplUIIntegration = null;

document.addEventListener('DOMContentLoaded', function() {
    // Wait for other scripts to initialize
    setTimeout(() => {
        if (!window.amplUIIntegration) {
            amplUIIntegration = new AMPLUIIntegration();
            window.amplUIIntegration = amplUIIntegration;
            console.log('🎨 AMPL UI Integration (Fixed) initialized');
        }
    }, 1000); // Reduced delay to catch buttons earlier
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AMPLUIIntegration;
}

