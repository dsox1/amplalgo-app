/**
 * AMPL Complete System - FIXED VERSION
 * No redundant code, proper order logic, stable displays
 */

class AMPLCompleteSystem {
    constructor() {
        // Prevent multiple instances
        if (window.amplCompleteSystem) {
            console.log('🚀 AMPL Complete System already exists, skipping...');
            return window.amplCompleteSystem;
        }
        
        this.isEnabled = false;
        this.monitoringInterval = null;
        this.refillInterval = null;
        this.uiUpdateInterval = null;
        this.lastOrderData = null;
        
        // Configuration
        this.config = {
            monitoringFrequency: 30000,  // 30 seconds
            refillFrequency: 300000,     // 5 minutes
            uiUpdateFrequency: 15000,    // 15 seconds (more frequent for responsiveness)
            autoRefillEnabled: true,
            maxRefillAttempts: 3
        };
        
        // State tracking
        this.state = {
            lastMonitorTime: null,
            lastRefillTime: null,
            refillAttempts: 0,
            orderData: null,
            uiData: null,
            isStable: false
        };
        
        console.log('🚀 AMPL Complete System (Fixed) initializing...');
        this.initialize();
    }
    
    /**
     * Initialize the complete system
     */
    async initialize() {
        // IMMEDIATELY remove all purple buttons and prevent their creation
        this.aggressiveButtonRemoval();
        
        // Setup AMPL Manager integration
        this.setupAMPLManagerToggle();
        
        // Initialize UI panels with stable updates
        this.initializeUIPanels();
        
        // Setup keyboard shortcuts for manual control
        this.setupKeyboardShortcuts();
        
        // Clean up any redundant scripts
        this.cleanupRedundantCode();
        
        console.log('✅ AMPL Complete System (Fixed) initialized');
    }
    
    /**
     * Aggressive button removal with multiple strategies
     */
    aggressiveButtonRemoval() {
        // Strategy 1: Remove existing buttons immediately
        const removeExistingButtons = () => {
            // Remove by text content
            document.querySelectorAll('button').forEach(button => {
                const text = button.textContent.toLowerCase();
                if (text.includes('cascade') || text.includes('🌊') || 
                    (text.includes('deploy') && text.includes('ampl'))) {
                    console.log('🗑️ Removing existing cascade button:', button.textContent);
                    button.remove();
                }
            });
            
            // Remove by style
            ['purple', '#8B5CF6', '#7C3AED'].forEach(color => {
                document.querySelectorAll(`button[style*="${color}"]`).forEach(button => {
                    console.log('🗑️ Removing purple styled button');
                    button.remove();
                });
            });
            
            // Remove by class
            ['.cascade-button', '[class*="cascade"]', '[id*="cascade"]'].forEach(selector => {
                try {
                    document.querySelectorAll(selector).forEach(el => {
                        if (el.tagName === 'BUTTON') {
                            console.log('🗑️ Removing cascade class button');
                            el.remove();
                        }
                    });
                } catch (e) {
                    // Invalid selector, continue
                }
            });
        };
        
        // Remove immediately and repeatedly
        removeExistingButtons();
        setTimeout(removeExistingButtons, 50);
        setTimeout(removeExistingButtons, 100);
        setTimeout(removeExistingButtons, 200);
        setTimeout(removeExistingButtons, 500);
        setTimeout(removeExistingButtons, 1000);
        
        // Strategy 2: Intercept button creation
        const originalCreateElement = document.createElement;
        document.createElement = function(tagName) {
            const element = originalCreateElement.call(this, tagName);
            
            if (tagName.toLowerCase() === 'button') {
                // Monitor this button for cascade-related content
                const observer = new MutationObserver(() => {
                    const text = element.textContent.toLowerCase();
                    if (text.includes('cascade') || text.includes('🌊')) {
                        console.log('🗑️ Intercepted cascade button creation');
                        element.remove();
                    }
                });
                
                observer.observe(element, { childList: true, characterData: true, subtree: true });
                
                // Also check when added to DOM
                setTimeout(() => {
                    const text = element.textContent.toLowerCase();
                    if (text.includes('cascade') || text.includes('🌊')) {
                        console.log('🗑️ Removed cascade button after DOM insertion');
                        element.remove();
                    }
                }, 10);
            }
            
            return element;
        };
        
        // Strategy 3: DOM mutation observer
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.tagName === 'BUTTON') {
                            this.checkAndRemoveButton(node);
                        }
                        
                        // Check child buttons
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
        
        console.log('🛡️ Aggressive button removal active - no purple buttons will survive');
    }
    
    /**
     * Check and remove cascade buttons
     */
    checkAndRemoveButton(button) {
        const text = button.textContent.toLowerCase();
        const style = button.getAttribute('style') || '';
        const className = button.className || '';
        const id = button.id || '';
        
        if (text.includes('cascade') || text.includes('🌊') || 
            (text.includes('deploy') && text.includes('ampl')) ||
            style.includes('purple') || style.includes('#8B5CF6') || style.includes('#7C3AED') ||
            className.includes('cascade') || id.includes('cascade')) {
            console.log('🗑️ Removed cascade button:', text || 'styled button');
            button.remove();
            return true;
        }
        return false;
    }
    
    /**
     * Clean up redundant code and scripts
     */
    cleanupRedundantCode() {
        // Remove old script tags that might contain cascade button code
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
            if (script.src && (script.src.includes('cascade') || script.src.includes('test'))) {
                console.log('🧹 Removing redundant script:', script.src);
                script.remove();
            }
        });
        
        // Clear any global cascade functions
        if (window.deployAMPLCascade) {
            delete window.deployAMPLCascade;
            console.log('🧹 Removed global cascade function');
        }
        
        if (window.testSingleOrder) {
            // Keep this one as it's still needed
            console.log('ℹ️ Keeping testSingleOrder function');
        }
        
        console.log('🧹 Code cleanup complete');
    }
    
    /**
     * Setup AMPL Manager toggle integration
     */
    setupAMPLManagerToggle() {
        // Find AMPL Manager toggle with multiple selectors
        const toggleSelectors = [
            '#ampl-manager-toggle',
            'input[type="checkbox"][id*="ampl"]',
            'input[type="checkbox"][class*="ampl"]',
            'input[type="checkbox"][name*="ampl"]',
            '.ampl-manager-toggle',
            '[data-ampl-manager]'
        ];
        
        let toggle = null;
        for (const selector of toggleSelectors) {
            toggle = document.querySelector(selector);
            if (toggle) break;
        }
        
        if (toggle) {
            console.log('✅ Found AMPL Manager toggle');
            
            toggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    console.log('🎯 AMPL Manager ENABLED - Starting complete system');
                    this.enable();
                } else {
                    console.log('🎯 AMPL Manager DISABLED - Stopping complete system');
                    this.disable();
                }
            });
            
            // If already checked, enable system
            if (toggle.checked) {
                setTimeout(() => this.enable(), 2000);
            }
        } else {
            console.warn('⚠️ AMPL Manager toggle not found - system will not auto-start');
        }
    }
    
    /**
     * Initialize UI panels with stable update logic
     */
    initializeUIPanels() {
        this.initializeLimitOrdersPanel();
        this.initializeSmartOrderLadder();
        this.initializeRebaseProtectionMonitor();
        
        // Add desktop-specific styling
        this.addDesktopStyling();
        
        console.log('🎨 UI panels initialized with stable updates');
    }
    
    /**
     * Add desktop-specific styling for better readability
     */
    addDesktopStyling() {
        // Check if style already exists
        if (document.querySelector('#ampl-desktop-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'ampl-desktop-styles';
        style.textContent = `
            @media (min-width: 769px) {
                .order-status-display {
                    font-size: 20px !important;
                    font-weight: bold !important;
                    padding: 20px !important;
                    background: linear-gradient(135deg, #1F2937, #374151) !important;
                    color: white !important;
                    border-radius: 10px !important;
                    margin: 15px 0 !important;
                    text-align: center !important;
                    border: 2px solid #10B981 !important;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
                    transition: all 0.3s ease !important;
                }
                
                .order-status-display:hover {
                    transform: translateY(-2px) !important;
                    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15) !important;
                }
                
                .active-trades-count, .pending-trades-count,
                #active-trades-count, #pending-trades-count {
                    font-size: 28px !important;
                    font-weight: bold !important;
                    color: #10B981 !important;
                    text-shadow: 0 0 8px rgba(16, 185, 129, 0.6) !important;
                    display: inline-block !important;
                    padding: 5px 10px !important;
                    background: rgba(16, 185, 129, 0.1) !important;
                    border-radius: 5px !important;
                    margin: 0 5px !important;
                }
                
                .smart-order-ladder input[type="text"] {
                    font-size: 18px !important;
                    font-weight: bold !important;
                    text-align: center !important;
                    padding: 12px !important;
                    border-radius: 8px !important;
                    transition: all 0.3s ease !important;
                    min-width: 120px !important;
                }
                
                .smart-order-ladder input[type="text"]:hover {
                    transform: scale(1.05) !important;
                }
                
                .rebase-protection-display {
                    font-size: 18px !important;
                    padding: 20px !important;
                    background: linear-gradient(135deg, #1F2937, #374151) !important;
                    border-radius: 10px !important;
                    border: 2px solid #374151 !important;
                }
                
                .progress-percentage {
                    font-size: 22px !important;
                    font-weight: bold !important;
                    text-shadow: 0 0 5px rgba(255, 255, 255, 0.3) !important;
                }
                
                .value-display {
                    font-size: 16px !important;
                }
                
                .value-display span {
                    padding: 5px 10px !important;
                    background: rgba(255, 255, 255, 0.1) !important;
                    border-radius: 5px !important;
                    margin: 0 2px !important;
                }
            }
        `;
        document.head.appendChild(style);
        
        console.log('🎨 Enhanced desktop styling applied');
    }
    
    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+R = Manual refill
            if (e.ctrlKey && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                console.log('⌨️ Manual refill triggered via keyboard');
                this.manualRefill();
            }
            
            // Ctrl+Shift+M = Toggle monitoring
            if (e.ctrlKey && e.shiftKey && e.key === 'M') {
                e.preventDefault();
                console.log('⌨️ Manual toggle triggered via keyboard');
                this.isEnabled ? this.disable() : this.enable();
            }
            
            // Ctrl+Shift+S = Show status
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                console.log('⌨️ Status display triggered via keyboard');
                this.showStatus();
            }
            
            // Ctrl+Shift+C = Clean cascade buttons
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                console.log('⌨️ Manual cascade button cleanup');
                this.aggressiveButtonRemoval();
            }
        });
        
        console.log('⌨️ Enhanced keyboard shortcuts: Ctrl+Shift+R (refill), Ctrl+Shift+M (toggle), Ctrl+Shift+S (status), Ctrl+Shift+C (cleanup)');
    }
    
    /**
     * Enable the complete system
     */
    async enable() {
        if (this.isEnabled) return;
        
        this.isEnabled = true;
        console.log('🚀 Enabling AMPL Complete System (Fixed)...');
        
        // Initial cascade deployment
        await this.deployInitialCascade();
        
        // Start monitoring with stable updates
        this.startMonitoring();
        
        // Start auto-refill
        if (this.config.autoRefillEnabled) {
            this.startAutoRefill();
        }
        
        // Start UI updates with anti-flicker logic
        this.startUIUpdates();
        
        // Show notification
        this.showNotification('🚀 AMPL Complete System ENABLED', 'success');
        
        console.log('✅ AMPL Complete System (Fixed) fully enabled');
    }
    
    /**
     * Disable the complete system
     */
    disable() {
        if (!this.isEnabled) return;
        
        this.isEnabled = false;
        console.log('🛑 Disabling AMPL Complete System (Fixed)...');
        
        // Stop all intervals
        this.stopMonitoring();
        this.stopAutoRefill();
        this.stopUIUpdates();
        
        // Clear UI with stable final state
        this.clearAllUI();
        
        // Show notification
        this.showNotification('🛑 AMPL Complete System DISABLED', 'info');
        
        console.log('✅ AMPL Complete System (Fixed) fully disabled');
    }
    
    /**
     * Deploy initial cascade
     */
    async deployInitialCascade() {
        try {
            console.log('🌊 Deploying initial AMPL Cascade...');
            
            // Get current balance
            const balanceEl = document.querySelector('#usdt-balance, .usdt-balance, [data-balance="usdt"]');
            const balance = balanceEl ? parseFloat(balanceEl.textContent.replace(/[^0-9.]/g, '')) : 1000;
            
            console.log(`💰 Using balance: $${balance.toFixed(2)}`);
            
            // Call cascade deployment
            const response = await fetch(`${window.SUPABASE_URL || 'https://fbkcdirkshubectuvxzi.supabase.co'}/functions/v1/ampl-cascade`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia2NkaXJrc2h1YmVjdHV2eHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NDc0ODAsImV4cCI6MjA2MjAyMzQ4MH0.yhy1JL-V9zQVK1iIdSVK1261qD8gmHmo2vB-qe7Kit8'}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ balance: balance })
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log(`✅ Initial cascade deployed: ${result.summary.ordersPlaced} orders, $${result.summary.totalUSDTDeployed} deployed`);
                this.showNotification(`🌊 Cascade deployed: ${result.summary.ordersPlaced} orders ($${result.summary.totalUSDTDeployed})`, 'success');
                return true;
            } else {
                console.error('❌ Initial cascade deployment failed:', result.error);
                this.showNotification(`❌ Cascade deployment failed: ${result.error}`, 'error');
                return false;
            }
            
        } catch (error) {
            console.error('❌ Error deploying initial cascade:', error);
            this.showNotification(`❌ Cascade error: ${error.message}`, 'error');
            return false;
        }
    }
    
    /**
     * Start monitoring with stable data handling
     */
    startMonitoring() {
        if (this.monitoringInterval) return;
        
        console.log('👁️ Starting stable order monitoring...');
        
        // Initial monitoring
        this.performMonitoring();
        
        // Set up periodic monitoring
        this.monitoringInterval = setInterval(() => {
            this.performMonitoring();
        }, this.config.monitoringFrequency);
    }
    
    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log('🛑 Order monitoring stopped');
        }
    }
    
    /**
     * Perform monitoring check with data stability
     */
    async performMonitoring() {
        try {
            const response = await fetch(`${window.SUPABASE_URL || 'https://fbkcdirkshubectuvxzi.supabase.co'}/functions/v1/ampl-order-monitor`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia2NkaXJrc2h1YmVjdHV2eHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NDc0ODAsImV4cCI6MjA2MjAyMzQ4MH0.yhy1JL-V9zQVK1iIdSVK1261qD8gmHmo2vB-qe7Kit8'}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refill: false })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Only update if data has actually changed (prevent flickering)
                const newDataString = JSON.stringify(result.data.orderStatus);
                const oldDataString = this.lastOrderData ? JSON.stringify(this.lastOrderData.orderStatus) : '';
                
                if (newDataString !== oldDataString) {
                    this.state.orderData = result.data;
                    this.lastOrderData = result.data;
                    this.state.lastMonitorTime = new Date();
                    this.state.isStable = true;
                    
                    console.log(`👁️ Monitoring (data changed): ${result.data.orderStatus.active} active, ${result.data.orderStatus.missing} missing`);
                } else {
                    console.log(`👁️ Monitoring (stable): ${result.data.orderStatus.active} active, ${result.data.orderStatus.missing} missing`);
                }
                
                // Check if refill is needed
                if (result.data.orderStatus.missing > 0) {
                    console.log(`⚠️ ${result.data.orderStatus.missing} orders missing - refill may be needed`);
                }
            }
            
        } catch (error) {
            console.error('❌ Monitoring error:', error);
        }
    }
    
    /**
     * Start UI updates with anti-flicker logic
     */
    startUIUpdates() {
        if (this.uiUpdateInterval) return;
        
        console.log('🎨 Starting stable UI updates...');
        
        // Initial UI update
        this.updateUI();
        
        this.uiUpdateInterval = setInterval(() => {
            // Only update UI if we have stable data
            if (this.state.isStable && this.state.orderData) {
                this.updateUI();
            }
        }, this.config.uiUpdateFrequency);
    }
    
    /**
     * Stop UI updates
     */
    stopUIUpdates() {
        if (this.uiUpdateInterval) {
            clearInterval(this.uiUpdateInterval);
            this.uiUpdateInterval = null;
            console.log('🛑 UI updates stopped');
        }
    }
    
    /**
     * Update UI with stable data (anti-flicker)
     */
    updateUI() {
        if (!this.state.orderData) return;
        
        this.updateLimitOrdersPanel();
        this.updateSmartOrderLadder();
        this.updateRebaseProtectionMonitor();
    }
    
    /**
     * Initialize and update Limit Orders Panel with correct logic
     */
    initializeLimitOrdersPanel() {
        let statusEl = document.querySelector('.order-status-display');
        
        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.className = 'order-status-display';
            statusEl.innerHTML = '<strong>0 pending orders, 0 active trades</strong>';
            
            const limitPanel = document.querySelector('.limit-orders-panel, [class*="limit"], [class*="order"]');
            if (limitPanel) {
                limitPanel.appendChild(statusEl);
            } else {
                const container = document.createElement('div');
                container.className = 'limit-orders-panel';
                container.appendChild(statusEl);
                document.body.appendChild(container);
            }
        }
    }
    
    updateLimitOrdersPanel() {
        if (!this.state.orderData) return;
        
        const { existingOrders } = this.state.orderData;
        
        // CORRECT LOGIC:
        // Pending = Orders deployed but not executed (active limit orders)
        // Active = Orders that have been executed (filled orders = active trades)
        
        const pendingOrders = existingOrders.filter(order => order.status === 'active').length;
        const activeOrders = existingOrders.filter(order => order.status === 'filled').length;
        
        // Update with stable text (prevent flickering)
        const statusEl = document.querySelector('.order-status-display');
        if (statusEl) {
            const newText = `<strong>${pendingOrders} pending orders, ${activeOrders} active trades</strong>`;
            if (statusEl.innerHTML !== newText) {
                statusEl.innerHTML = newText;
            }
        }
        
        // Update individual elements
        const pendingEl = document.querySelector('.pending-trades-count, #pending-trades-count');
        const activeEl = document.querySelector('.active-trades-count, #active-trades-count');
        
        if (pendingEl && pendingEl.textContent !== pendingOrders.toString()) {
            pendingEl.textContent = pendingOrders;
        }
        if (activeEl && activeEl.textContent !== activeOrders.toString()) {
            activeEl.textContent = activeOrders;
        }
    }
    
    /**
     * Initialize and update Smart Order Ladder with PROPER colors
     */
    initializeSmartOrderLadder() {
        console.log('🎯 Smart Order Ladder initialized');
    }
    
    updateSmartOrderLadder() {
        if (!this.state.orderData) return;
        
        const { existingOrders, expectedLevels } = this.state.orderData;
        const inputs = document.querySelectorAll('.smart-order-ladder input[type="text"], input[class*="ladder"], input[data-level]');
        
        inputs.forEach((input, index) => {
            if (index < expectedLevels.length) {
                const expectedLevel = expectedLevels[index];
                const existingOrder = existingOrders.find(o => o.level === expectedLevel.level);
                
                // Update value only if changed
                const newValue = expectedLevel.price.toFixed(4);
                if (input.value !== newValue) {
                    input.value = newValue;
                }
                
                // CORRECT COLOR PROGRESSION:
                // Gray = No order (empty)
                // Orange = Order deployed, waiting for execution (pending)
                // Green = Order executed (filled/active trade)
                
                let newStyle = {};
                
                if (!existingOrder) {
                    // Gray = Empty
                    newStyle = {
                        backgroundColor: '#374151',
                        color: '#9CA3AF',
                        border: '1px solid #4B5563'
                    };
                } else if (existingOrder.status === 'active') {
                    // Orange = Pending execution
                    newStyle = {
                        backgroundColor: '#F59E0B',
                        color: 'white',
                        border: '2px solid #D97706'
                    };
                } else if (existingOrder.status === 'filled') {
                    // Green = Executed/filled
                    newStyle = {
                        backgroundColor: '#10B981',
                        color: 'white',
                        border: '2px solid #059669'
                    };
                }
                
                // Apply styles only if changed (prevent flickering)
                Object.keys(newStyle).forEach(prop => {
                    if (input.style[prop] !== newStyle[prop]) {
                        input.style[prop] = newStyle[prop];
                    }
                });
            }
        });
    }
    
    /**
     * Initialize and update Rebase Protection Monitor
     */
    initializeRebaseProtectionMonitor() {
        let rebaseEl = document.querySelector('.rebase-protection-display');
        
        if (!rebaseEl) {
            rebaseEl = document.createElement('div');
            rebaseEl.className = 'rebase-protection-display';
            rebaseEl.innerHTML = `
                <div style="margin-bottom: 10px;"><strong>Rebase Protection Monitor</strong></div>
                <div class="progress-bar-container" style="background: #374151; height: 25px; border-radius: 12px; overflow: hidden; margin: 8px 0;">
                    <div class="progress-bar" style="height: 100%; background: #10B981; width: 0%; transition: width 0.5s ease;"></div>
                </div>
                <div class="progress-percentage" style="text-align: center; margin: 8px 0;">0% Unknown</div>
                <div class="value-display" style="display: flex; justify-content: space-between; font-size: 14px;">
                    <span>Original: <span class="original-value">$0.00</span></span>
                    <span>Current: <span class="current-value">$0.00</span></span>
                    <span>Diff: <span class="diff-value">$0.00</span></span>
                </div>
            `;
            
            const rebasePanel = document.querySelector('.rebase-protection-panel, [class*="rebase"], [class*="protection"]');
            if (rebasePanel) {
                rebasePanel.appendChild(rebaseEl);
            } else {
                const container = document.createElement('div');
                container.className = 'rebase-protection-panel';
                container.appendChild(rebaseEl);
                document.body.appendChild(container);
            }
        }
    }
    
    updateRebaseProtectionMonitor() {
        if (!this.state.orderData) return;
        
        const { rebaseProtection } = this.state.orderData;
        
        // Update progress bar with smooth transitions
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            const percentage = Math.max(0, Math.min(100, parseFloat(rebaseProtection.safetyRatio) * 100));
            const newWidth = `${percentage}%`;
            
            if (progressBar.style.width !== newWidth) {
                progressBar.style.width = newWidth;
            }
            
            // Smooth color transitions
            let newColor;
            if (percentage >= 100) {
                newColor = '#10B981'; // Green
            } else if (percentage >= 95) {
                newColor = '#F59E0B'; // Orange
            } else {
                newColor = '#EF4444'; // Red
            }
            
            if (progressBar.style.backgroundColor !== newColor) {
                progressBar.style.backgroundColor = newColor;
            }
        }
        
        // Update text elements only when changed
        const percentageEl = document.querySelector('.progress-percentage');
        if (percentageEl) {
            const percentage = (parseFloat(rebaseProtection.safetyRatio) * 100).toFixed(0);
            const newText = `${percentage}% ${rebaseProtection.status}`;
            
            if (percentageEl.textContent !== newText) {
                percentageEl.textContent = newText;
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
    }
    
    /**
     * Clear all UI with stable final state
     */
    clearAllUI() {
        const statusEl = document.querySelector('.order-status-display');
        if (statusEl) {
            statusEl.innerHTML = '<strong>0 pending orders, 0 active trades</strong>';
        }
        
        const inputs = document.querySelectorAll('.smart-order-ladder input[type="text"], input[class*="ladder"]');
        inputs.forEach(input => {
            input.value = '';
            input.style.backgroundColor = '#374151';
            input.style.color = '#9CA3AF';
            input.style.border = '1px solid #4B5563';
        });
        
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
    }
    
    /**
     * Start auto-refill
     */
    startAutoRefill() {
        if (this.refillInterval) return;
        
        console.log('🔄 Starting auto-refill...');
        
        this.refillInterval = setInterval(() => {
            this.performAutoRefill();
        }, this.config.refillFrequency);
    }
    
    /**
     * Stop auto-refill
     */
    stopAutoRefill() {
        if (this.refillInterval) {
            clearInterval(this.refillInterval);
            this.refillInterval = null;
            console.log('🛑 Auto-refill stopped');
        }
    }
    
    /**
     * Perform auto-refill check
     */
    async performAutoRefill() {
        if (!this.state.orderData || this.state.orderData.orderStatus.missing === 0) {
            return;
        }
        
        if (this.state.refillAttempts >= this.config.maxRefillAttempts) {
            console.log('⚠️ Max refill attempts reached, skipping auto-refill');
            return;
        }
        
        console.log(`🔄 Auto-refill triggered: ${this.state.orderData.orderStatus.missing} orders missing`);
        
        const refilled = await this.performRefill();
        
        if (refilled > 0) {
            this.state.refillAttempts = 0;
            this.state.lastRefillTime = new Date();
            this.showNotification(`🔄 Auto-refill: ${refilled} orders placed`, 'success');
        } else {
            this.state.refillAttempts++;
        }
    }
    
    /**
     * Manual refill
     */
    async manualRefill() {
        console.log('🔄 Manual refill triggered...');
        
        const refilled = await this.performRefill();
        
        if (refilled > 0) {
            this.showNotification(`🔄 Manual refill: ${refilled} orders placed`, 'success');
        } else {
            this.showNotification('🔄 No orders needed refilling', 'info');
        }
        
        return refilled;
    }
    
    /**
     * Perform refill operation
     */
    async performRefill() {
        try {
            const response = await fetch(`${window.SUPABASE_URL || 'https://fbkcdirkshubectuvxzi.supabase.co'}/functions/v1/ampl-order-monitor`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia2NkaXJrc2h1YmVjdHV2eHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NDc0ODAsImV4cCI6MjA2MjAyMzQ4MH0.yhy1JL-V9zQVK1iIdSVK1261qD8gmHmo2vB-qe7Kit8'}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refill: true })
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log(`✅ Refill complete: ${result.refilledCount} orders placed`);
                return result.refilledCount;
            } else {
                console.error('❌ Refill failed:', result.error);
                return 0;
            }
            
        } catch (error) {
            console.error('❌ Refill error:', error);
            return 0;
        }
    }
    
    /**
     * Show notification with enhanced styling
     */
    showNotification(message, type = 'info') {
        console.log(`📢 ${type.toUpperCase()}: ${message}`);
        
        // Try existing notification system first
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
            return;
        }
        
        // Enhanced notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 20px 25px;
            border-radius: 10px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            max-width: 350px;
            word-wrap: break-word;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        // Enhanced colors
        switch (type) {
            case 'success':
                notification.style.background = 'linear-gradient(135deg, #10B981, #059669)';
                break;
            case 'error':
                notification.style.background = 'linear-gradient(135deg, #EF4444, #DC2626)';
                break;
            case 'warning':
                notification.style.background = 'linear-gradient(135deg, #F59E0B, #D97706)';
                break;
            default:
                notification.style.background = 'linear-gradient(135deg, #3B82F6, #2563EB)';
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Auto-remove with animation
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
    
    /**
     * Show current status
     */
    showStatus() {
        const status = {
            enabled: this.isEnabled,
            stable: this.state.isStable,
            lastMonitor: this.state.lastMonitorTime,
            lastRefill: this.state.lastRefillTime,
            refillAttempts: this.state.refillAttempts,
            orderData: this.state.orderData?.orderStatus,
            config: this.config
        };
        
        console.log('📊 AMPL Complete System (Fixed) Status:', status);
        
        if (this.state.orderData) {
            const { orderStatus } = this.state.orderData;
            this.showNotification(
                `Status: ${this.isEnabled ? 'ENABLED' : 'DISABLED'} | Orders: ${orderStatus.active} pending, ${orderStatus.filled} active, ${orderStatus.missing} missing`,
                'info'
            );
        } else {
            this.showNotification(
                `Status: ${this.isEnabled ? 'ENABLED' : 'DISABLED'} | No order data`,
                'info'
            );
        }
        
        return status;
    }
    
    /**
     * Get system status
     */
    getStatus() {
        return {
            enabled: this.isEnabled,
            stable: this.state.isStable,
            state: this.state,
            config: this.config,
            hasOrderData: !!this.state.orderData,
            intervals: {
                monitoring: !!this.monitoringInterval,
                refill: !!this.refillInterval,
                ui: !!this.uiUpdateInterval
            }
        };
    }
}

// Initialize Complete System when DOM is loaded
let amplCompleteSystem = null;

document.addEventListener('DOMContentLoaded', function() {
    // Wait for other scripts to load, but not too long to catch buttons
    setTimeout(() => {
        if (!window.amplCompleteSystem) {
            amplCompleteSystem = new AMPLCompleteSystem();
            window.amplCompleteSystem = amplCompleteSystem;
            window.amplSystem = amplCompleteSystem; // Shorter alias
            console.log('🚀 AMPL Complete System (Fixed) ready');
        }
    }, 2000);
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AMPLCompleteSystem;
}

