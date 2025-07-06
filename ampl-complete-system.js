/**
 * AMPL Complete System - FIXED VERSION
 * Fixes: Duplicate panels, flickering display, proper order status logic
 * Prevents resource waste from duplicate elements
 */

class AMPLCompleteSystem {
    constructor() {
        this.isEnabled = false;
        this.monitoringInterval = null;
        this.refillInterval = null;
        this.uiUpdateInterval = null;
        this.lastOrderData = null; // Prevent unnecessary updates
        
        // Track created elements to prevent duplicates
        this.createdElements = {
            statusDisplay: false,
            rebaseDisplay: false,
            duplicateRemovalDone: false
        };
        
        // Configuration
        this.config = {
            monitoringFrequency: 30000,  // 30 seconds
            refillFrequency: 300000,     // 5 minutes
            uiUpdateFrequency: 15000,    // 15 seconds (reduced to prevent flickering)
            autoRefillEnabled: true,
            maxRefillAttempts: 3
        };
        
        // State tracking
        this.state = {
            lastMonitorTime: null,
            lastRefillTime: null,
            refillAttempts: 0,
            orderData: null,
            uiData: null
        };
        
        console.log('🚀 AMPL Complete System (FIXED) initializing...');
        this.initialize();
    }
    
    /**
     * Initialize the complete system
     */
    async initialize() {
        // AGGRESSIVE purple button removal
        this.removePurpleCascadeButton();
        
        // Remove duplicate panels that waste resources
        this.removeDuplicatePanels();
        
        // Setup AMPL Manager integration
        this.setupAMPLManagerToggle();
        
        // Initialize UI panels (prevent duplicates)
        this.initializeUIPanels();
        
        // Setup keyboard shortcuts for manual control
        this.setupKeyboardShortcuts();
        
        console.log('✅ AMPL Complete System (FIXED) initialized');
    }
    
    /**
     * AGGRESSIVE purple cascade button removal
     */
    removePurpleCascadeButton() {
        // Strategy 1: Remove existing buttons by content
        const allButtons = document.querySelectorAll('button');
        allButtons.forEach(button => {
            const text = button.textContent.toLowerCase();
            if (text.includes('cascade') || text.includes('🌊') || 
                (text.includes('deploy') && text.includes('ampl'))) {
                console.log('🗑️ Removing cascade button:', button.textContent);
                button.remove();
            }
        });
        
        // Strategy 2: Remove by style attributes
        const purpleSelectors = [
            'button[style*="purple"]',
            'button[style*="#8B5CF6"]',
            'button[style*="#7C3AED"]',
            'button[style*="rgb(139, 92, 246)"]'
        ];
        
        purpleSelectors.forEach(selector => {
            const buttons = document.querySelectorAll(selector);
            buttons.forEach(button => {
                console.log('🗑️ Removing purple button by style');
                button.remove();
            });
        });
        
        // Strategy 3: Intercept button creation
        const originalCreateElement = document.createElement;
        document.createElement = function(tagName) {
            const element = originalCreateElement.call(this, tagName);
            
            if (tagName.toLowerCase() === 'button') {
                // Monitor for cascade-related attributes
                const originalSetAttribute = element.setAttribute;
                element.setAttribute = function(name, value) {
                    if ((name === 'onclick' || name === 'class' || name === 'id') && 
                        value && value.toString().toLowerCase().includes('cascade')) {
                        console.log('🚫 Blocked cascade button creation via', name);
                        return;
                    }
                    return originalSetAttribute.call(this, name, value);
                };
                
                // Monitor textContent changes
                const originalSetTextContent = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent').set;
                Object.defineProperty(element, 'textContent', {
                    set: function(value) {
                        if (value && value.toString().toLowerCase().includes('cascade')) {
                            console.log('🚫 Blocked cascade button text assignment');
                            return;
                        }
                        return originalSetTextContent.call(this, value);
                    },
                    get: function() {
                        return this.innerText;
                    }
                });
            }
            
            return element;
        };
        
        console.log('🧹 AGGRESSIVE purple cascade button removal complete');
    }
    
    /**
     * Remove duplicate panels that waste resources
     */
    removeDuplicatePanels() {
        if (this.createdElements.duplicateRemovalDone) return;
        
        // Remove duplicate order status displays
        const statusDisplays = document.querySelectorAll('.order-status-display');
        if (statusDisplays.length > 1) {
            console.log(`🗑️ Found ${statusDisplays.length} status displays, removing ${statusDisplays.length - 1} duplicates`);
            for (let i = 1; i < statusDisplays.length; i++) {
                statusDisplays[i].remove();
            }
        }
        
        // Remove duplicate rebase protection displays
        const rebaseDisplays = document.querySelectorAll('.rebase-protection-display');
        if (rebaseDisplays.length > 1) {
            console.log(`🗑️ Found ${rebaseDisplays.length} rebase displays, removing ${rebaseDisplays.length - 1} duplicates`);
            for (let i = 1; i < rebaseDisplays.length; i++) {
                rebaseDisplays[i].remove();
            }
        }
        
        // Remove duplicate progress containers
        const progressContainers = document.querySelectorAll('.progress-container');
        if (progressContainers.length > 1) {
            console.log(`🗑️ Found ${progressContainers.length} progress containers, removing ${progressContainers.length - 1} duplicates`);
            for (let i = 1; i < progressContainers.length; i++) {
                progressContainers[i].remove();
            }
        }
        
        // Remove any orphaned monitoring elements
        const orphanedElements = document.querySelectorAll('[class*="ampl-monitor"], [class*="cascade-monitor"], [class*="order-monitor"]');
        orphanedElements.forEach(element => {
            if (!element.closest('.smart-order-ladder') && 
                !element.closest('.limit-orders-panel') && 
                !element.closest('.rebase-protection-panel')) {
                console.log('🗑️ Removing orphaned monitoring element');
                element.remove();
            }
        });
        
        this.createdElements.duplicateRemovalDone = true;
        console.log('🧹 Duplicate panel cleanup complete');
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
     * Initialize UI panels (prevent duplicates)
     */
    initializeUIPanels() {
        this.initializeLimitOrdersPanel();
        this.initializeSmartOrderLadder();
        this.initializeRebaseProtectionMonitor();
        
        console.log('🎨 UI panels initialized (no duplicates)');
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
            
            // Ctrl+Shift+C = Clean duplicates
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                console.log('⌨️ Manual duplicate cleanup triggered');
                this.removeDuplicatePanels();
            }
        });
        
        console.log('⌨️ Keyboard shortcuts enabled: Ctrl+Shift+R (refill), Ctrl+Shift+M (toggle), Ctrl+Shift+S (status), Ctrl+Shift+C (clean)');
    }
    
    /**
     * Enable the complete system
     */
    async enable() {
        if (this.isEnabled) return;
        
        this.isEnabled = true;
        console.log('🚀 Enabling AMPL Complete System...');
        
        // Remove duplicates before starting
        this.removeDuplicatePanels();
        
        // Initial cascade deployment
        await this.deployInitialCascade();
        
        // Start monitoring
        this.startMonitoring();
        
        // Start auto-refill
        if (this.config.autoRefillEnabled) {
            this.startAutoRefill();
        }
        
        // Start UI updates
        this.startUIUpdates();
        
        // Show notification
        this.showNotification('🚀 AMPL Complete System ENABLED', 'success');
        
        console.log('✅ AMPL Complete System fully enabled');
    }
    
    /**
     * Disable the complete system
     */
    disable() {
        if (!this.isEnabled) return;
        
        this.isEnabled = false;
        console.log('🛑 Disabling AMPL Complete System...');
        
        // Stop all intervals
        this.stopMonitoring();
        this.stopAutoRefill();
        this.stopUIUpdates();
        
        // Clear UI
        this.clearAllUI();
        
        // Show notification
        this.showNotification('🛑 AMPL Complete System DISABLED', 'info');
        
        console.log('✅ AMPL Complete System fully disabled');
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
     * Start monitoring
     */
    startMonitoring() {
        if (this.monitoringInterval) return;
        
        console.log('👁️ Starting order monitoring...');
        
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
     * Perform monitoring check
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
                // Only update if data actually changed (prevents flickering)
                const dataChanged = !this.lastOrderData || 
                    JSON.stringify(this.lastOrderData.orderStatus) !== JSON.stringify(result.data.orderStatus);
                
                if (dataChanged) {
                    this.state.orderData = result.data;
                    this.lastOrderData = result.data;
                    this.state.lastMonitorTime = new Date();
                    
                    console.log(`👁️ Monitoring: ${result.data.orderStatus.active} active, ${result.data.orderStatus.missing} missing (data changed)`);
                    
                    // Check if refill is needed
                    if (result.data.orderStatus.missing > 0) {
                        console.log(`⚠️ ${result.data.orderStatus.missing} orders missing - refill may be needed`);
                    }
                } else {
                    console.log(`👁️ Monitoring: No data change detected - skipping update`);
                }
            }
            
        } catch (error) {
            console.error('❌ Monitoring error:', error);
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
            return; // No refill needed
        }
        
        if (this.state.refillAttempts >= this.config.maxRefillAttempts) {
            console.log('⚠️ Max refill attempts reached, skipping auto-refill');
            return;
        }
        
        console.log(`🔄 Auto-refill triggered: ${this.state.orderData.orderStatus.missing} orders missing`);
        
        const refilled = await this.performRefill();
        
        if (refilled > 0) {
            this.state.refillAttempts = 0; // Reset on success
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
     * Start UI updates - ANTI-FLICKER
     */
    startUIUpdates() {
        if (this.uiUpdateInterval) return;
        
        console.log('🎨 Starting UI updates (anti-flicker)...');
        
        // Initial UI update
        this.updateUI();
        
        this.uiUpdateInterval = setInterval(() => {
            this.updateUI();
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
     * Update UI with latest data - ANTI-FLICKER
     */
    updateUI() {
        if (!this.state.orderData) return;
        
        // Only update if data has actually changed
        const currentDataHash = JSON.stringify(this.state.orderData.orderStatus);
        if (this.lastUIDataHash === currentDataHash) {
            return; // No change, skip update to prevent flickering
        }
        
        this.lastUIDataHash = currentDataHash;
        
        this.updateLimitOrdersPanel();
        this.updateSmartOrderLadder();
        this.updateRebaseProtectionMonitor();
        
        console.log('🎨 UI updated (data changed)');
    }
    
    /**
     * Initialize and update Limit Orders Panel - NO DUPLICATES
     */
    initializeLimitOrdersPanel() {
        // Check if already exists
        if (this.createdElements.statusDisplay || document.querySelector('.order-status-display')) {
            console.log('✅ Limit Orders Panel already exists - skipping creation');
            this.createdElements.statusDisplay = true;
            return;
        }
        
        // Create status display if it doesn't exist
        let statusEl = document.querySelector('.order-status-display');
        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.className = 'order-status-display';
            statusEl.style.cssText = `
                padding: 15px; 
                background: linear-gradient(135deg, #1F2937 0%, #374151 100%); 
                color: white; 
                border-radius: 8px; 
                margin: 10px 0;
                font-size: 28px;
                font-weight: bold;
                text-align: center;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                border: 1px solid #4B5563;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            `;
            
            // Try to find a good place to insert it
            const limitPanel = document.querySelector('.limit-orders-panel, [class*="limit"], [class*="order"]');
            if (limitPanel) {
                limitPanel.appendChild(statusEl);
            } else {
                // Fallback: add to body
                document.body.appendChild(statusEl);
            }
            
            this.createdElements.statusDisplay = true;
        }
    }
    
    updateLimitOrdersPanel() {
        if (!this.state.orderData) return;
        
        const { orderStatus } = this.state.orderData;
        
        // CORRECTED LOGIC:
        // Pending = Orders deployed but not executed (waiting limit orders)
        // Active = Orders that have been executed and are now active trades
        const pendingOrders = orderStatus.active; // These are actually pending limit orders
        const activeOrders = orderStatus.filled;  // These are executed orders (active trades)
        
        const statusEl = document.querySelector('.order-status-display');
        if (statusEl) {
            statusEl.innerHTML = `<strong>${activeOrders} orders open, ${pendingOrders} pending</strong>`;
        }
        
        // Update individual elements with enhanced styling
        const activeEl = document.querySelector('#active-trades-count, .active-trades-count');
        const pendingEl = document.querySelector('#pending-trades-count, .pending-trades-count');
        
        if (activeEl) {
            activeEl.textContent = activeOrders;
            activeEl.style.fontSize = '28px';
            activeEl.style.fontWeight = 'bold';
            activeEl.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        }
        
        if (pendingEl) {
            pendingEl.textContent = pendingOrders;
            pendingEl.style.fontSize = '28px';
            pendingEl.style.fontWeight = 'bold';
            pendingEl.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        }
    }
    
    /**
     * Initialize and update Smart Order Ladder
     */
    initializeSmartOrderLadder() {
        // Smart Order Ladder should already exist
        console.log('🎯 Smart Order Ladder initialized (using existing)');
    }
    
    updateSmartOrderLadder() {
        if (!this.state.orderData) return;
        
        const { existingOrders, expectedLevels } = this.state.orderData;
        
        // Find ladder inputs
        const inputs = document.querySelectorAll('.smart-order-ladder input[type="text"], input[class*="ladder"], input[data-level]');
        
        inputs.forEach((input, index) => {
            if (index < expectedLevels.length) {
                const expectedLevel = expectedLevels[index];
                const existingOrder = existingOrders.find(o => o.level === expectedLevel.level);
                
                // Update input value
                input.value = expectedLevel.price.toFixed(4);
                
                // CORRECTED COLOR LOGIC:
                if (existingOrder && existingOrder.status === 'active') {
                    // Orange for deployed orders waiting for execution
                    input.style.backgroundColor = '#F59E0B';
                    input.style.color = 'white';
                    input.style.border = '2px solid #D97706';
                    input.style.boxShadow = '0 0 8px rgba(245, 158, 11, 0.4)';
                } else if (existingOrder) {
                    // Green for executed orders
                    input.style.backgroundColor = '#10B981';
                    input.style.color = 'white';
                    input.style.border = '2px solid #059669';
                    input.style.boxShadow = '0 0 8px rgba(16, 185, 129, 0.4)';
                } else {
                    // Gray for empty positions
                    input.style.backgroundColor = '#374151';
                    input.style.color = '#9CA3AF';
                    input.style.border = '1px solid #4B5563';
                    input.style.boxShadow = 'none';
                }
            }
        });
    }
    
    /**
     * Initialize and update Rebase Protection Monitor - NO DUPLICATES
     */
    initializeRebaseProtectionMonitor() {
        // Check if already exists
        if (this.createdElements.rebaseDisplay || document.querySelector('.rebase-protection-display')) {
            console.log('✅ Rebase Protection Monitor already exists - skipping creation');
            this.createdElements.rebaseDisplay = true;
            return;
        }
        
        // Create rebase protection display if it doesn't exist
        let rebaseEl = document.querySelector('.rebase-protection-display');
        if (!rebaseEl) {
            rebaseEl = document.createElement('div');
            rebaseEl.className = 'rebase-protection-display';
            rebaseEl.style.cssText = 'padding: 10px; background: #1F2937; color: white; border-radius: 5px; margin: 5px 0;';
            rebaseEl.innerHTML = `
                <div style="margin-bottom: 10px;"><strong>Rebase Protection Monitor</strong></div>
                <div class="progress-bar-container" style="background: #374151; height: 20px; border-radius: 10px; overflow: hidden; margin: 5px 0;">
                    <div class="progress-bar" style="height: 100%; background: #10B981; width: 0%; transition: width 0.3s ease;"></div>
                </div>
                <div class="progress-percentage" style="text-align: center; margin: 5px 0;">0% Unknown</div>
            `;
            
            // Try to find a good place to insert it
            const rebasePanel = document.querySelector('.rebase-protection-panel, [class*="rebase"], [class*="protection"]');
            if (rebasePanel) {
                rebasePanel.appendChild(rebaseEl);
            } else {
                // Fallback: add to body
                document.body.appendChild(rebaseEl);
            }
            
            this.createdElements.rebaseDisplay = true;
        }
    }
    
    updateRebaseProtectionMonitor() {
        if (!this.state.orderData) return;
        
        const { rebaseProtection } = this.state.orderData;
        
        // Update progress bar
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            const percentage = Math.max(0, Math.min(100, parseFloat(rebaseProtection.safetyRatio) * 100));
            progressBar.style.width = `${percentage}%`;
            
            // Color coding
            if (percentage >= 100) {
                progressBar.style.backgroundColor = '#10B981'; // Green
            } else if (percentage >= 95) {
                progressBar.style.backgroundColor = '#F59E0B'; // Orange
            } else {
                progressBar.style.backgroundColor = '#EF4444'; // Red
            }
        }
        
        // Update percentage text
        const percentageEl = document.querySelector('.progress-percentage');
        if (percentageEl) {
            const percentage = (parseFloat(rebaseProtection.safetyRatio) * 100).toFixed(0);
            percentageEl.textContent = `${percentage}% ${rebaseProtection.status}`;
        }
    }
    
    /**
     * Clear all UI
     */
    clearAllUI() {
        // Clear status displays
        const statusEl = document.querySelector('.order-status-display');
        if (statusEl) {
            statusEl.innerHTML = '<strong>0 orders open, 0 pending</strong>';
        }
        
        // Clear ladder inputs
        const inputs = document.querySelectorAll('.smart-order-ladder input[type="text"], input[class*="ladder"]');
        inputs.forEach(input => {
            input.value = '';
            input.style.backgroundColor = '#374151';
            input.style.color = '#9CA3AF';
            input.style.border = '1px solid #4B5563';
            input.style.boxShadow = 'none';
        });
        
        // Clear rebase protection
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = '0%';
            progressBar.style.backgroundColor = '#6B7280';
        }
    }
    
    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        console.log(`📢 ${type.toUpperCase()}: ${message}`);
        
        // Try to use existing notification system
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
            return;
        }
        
        // Fallback: create simple notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        // Color based on type
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#10B981';
                break;
            case 'error':
                notification.style.backgroundColor = '#EF4444';
                break;
            case 'warning':
                notification.style.backgroundColor = '#F59E0B';
                break;
            default:
                notification.style.backgroundColor = '#3B82F6';
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
    
    /**
     * Show current status
     */
    showStatus() {
        const status = {
            enabled: this.isEnabled,
            lastMonitor: this.state.lastMonitorTime,
            lastRefill: this.state.lastRefillTime,
            refillAttempts: this.state.refillAttempts,
            orderData: this.state.orderData?.orderStatus,
            config: this.config,
            createdElements: this.createdElements
        };
        
        console.log('📊 AMPL Complete System Status:', status);
        
        // Show in notification
        if (this.state.orderData) {
            const { orderStatus } = this.state.orderData;
            this.showNotification(
                `Status: ${this.isEnabled ? 'ENABLED' : 'DISABLED'} | Orders: ${orderStatus.active} pending, ${orderStatus.filled} active`,
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
            state: this.state,
            config: this.config,
            hasOrderData: !!this.state.orderData,
            intervals: {
                monitoring: !!this.monitoringInterval,
                refill: !!this.refillInterval,
                ui: !!this.uiUpdateInterval
            },
            createdElements: this.createdElements
        };
    }
}

// Initialize Complete System when DOM is loaded
let amplCompleteSystem = null;

document.addEventListener('DOMContentLoaded', function() {
    // Wait for other scripts to load
    setTimeout(() => {
        amplCompleteSystem = new AMPLCompleteSystem();
        console.log('🚀 AMPL Complete System (FIXED) ready');
        
        // Make it globally accessible
        window.amplCompleteSystem = amplCompleteSystem;
        window.amplSystem = amplCompleteSystem; // Shorter alias
    }, 4000);
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AMPLCompleteSystem;
}

