/**
 * AMPL UI Integration System - FIXED VERSION
 * Fixes: Duplicate panels, flickering display, proper order status logic
 * Removes resource-wasting duplicate elements
 */

class AMPLUIIntegration {
    constructor() {
        this.monitoringData = null;
        this.updateInterval = null;
        this.isMonitoring = false;
        this.lastUpdateData = null; // Prevent unnecessary updates
        
        // Track created elements to prevent duplicates
        this.createdElements = {
            statusDisplay: false,
            rebaseDisplay: false
        };
        
        // UI element selectors
        this.selectors = {
            // Limit Orders Panel
            limitOrdersPanel: '.limit-orders-panel',
            activeTradesCount: '#active-trades-count',
            pendingTradesCount: '#pending-trades-count',
            activeTradesIndicator: '.active-trades-indicator',
            pendingTradesIndicator: '.pending-trades-indicator',
            
            // Smart Order Ladder
            smartOrderLadder: '.smart-order-ladder',
            orderLadderInputs: '.smart-order-ladder input[type="text"]',
            orderStatusDisplay: '.order-status-display',
            
            // Rebase Protection Monitor
            rebaseProtectionPanel: '.rebase-protection-panel',
            protectionStatus: '.protection-status',
            progressBar: '.progress-bar',
            progressPercentage: '.progress-percentage',
            originalPurchase: '.original-purchase-value',
            currentValue: '.current-value',
            valueDifference: '.value-difference',
            
            // AMPL Manager Toggle
            amplManagerToggle: '#ampl-manager-toggle, input[type="checkbox"][id*="ampl"], input[type="checkbox"][class*="ampl"]'
        };
        
        console.log('🎨 AMPL UI Integration (FIXED) initialized');
        this.initializeUI();
    }
    
    /**
     * Initialize UI integration
     */
    initializeUI() {
        // AGGRESSIVE purple button removal - multiple strategies
        this.removePurpleCascadeButton();
        
        // Remove any existing duplicate panels first
        this.removeDuplicatePanels();
        
        // Set up monitoring when AMPL Manager is enabled
        this.setupAMPLManagerIntegration();
        
        // Initialize UI panels (only if they don't exist)
        this.initializePanels();
        
        console.log('🎨 UI Integration setup complete (duplicates removed)');
    }
    
    /**
     * AGGRESSIVE removal of purple cascade button
     */
    removePurpleCascadeButton() {
        // Strategy 1: Remove by content
        const allButtons = document.querySelectorAll('button');
        allButtons.forEach(button => {
            const text = button.textContent.toLowerCase();
            if (text.includes('cascade') || text.includes('🌊') || 
                (text.includes('deploy') && text.includes('ampl'))) {
                console.log('🗑️ Removing cascade button:', button.textContent);
                button.remove();
            }
        });
        
        // Strategy 2: Remove by style (purple colors)
        const purpleButtons = document.querySelectorAll('button[style*="purple"], button[style*="#8B5CF6"], button[style*="#7C3AED"]');
        purpleButtons.forEach(button => {
            console.log('🗑️ Removing purple button');
            button.remove();
        });
        
        // Strategy 3: Remove floating buttons
        const floatingButtons = document.querySelectorAll('button[style*="position: fixed"], button[style*="position: absolute"]');
        floatingButtons.forEach(button => {
            if (button.textContent.includes('🌊') || button.textContent.includes('Cascade')) {
                console.log('🗑️ Removing floating cascade button');
                button.remove();
            }
        });
        
        // Strategy 4: Prevent creation by intercepting createElement
        const originalCreateElement = document.createElement;
        document.createElement = function(tagName) {
            const element = originalCreateElement.call(this, tagName);
            if (tagName.toLowerCase() === 'button') {
                // Monitor for cascade button creation
                const originalSetAttribute = element.setAttribute;
                element.setAttribute = function(name, value) {
                    if (name === 'onclick' && value && value.includes('cascade')) {
                        console.log('🚫 Blocked cascade button creation');
                        return;
                    }
                    return originalSetAttribute.call(this, name, value);
                };
            }
            return element;
        };
        
        console.log('🧹 Aggressive purple cascade button removal complete');
    }
    
    /**
     * Remove duplicate panels that waste resources
     */
    removeDuplicatePanels() {
        // Remove duplicate order status displays
        const statusDisplays = document.querySelectorAll('.order-status-display');
        if (statusDisplays.length > 1) {
            console.log(`🗑️ Removing ${statusDisplays.length - 1} duplicate status displays`);
            for (let i = 1; i < statusDisplays.length; i++) {
                statusDisplays[i].remove();
            }
        }
        
        // Remove duplicate rebase protection displays
        const rebaseDisplays = document.querySelectorAll('.rebase-protection-display');
        if (rebaseDisplays.length > 1) {
            console.log(`🗑️ Removing ${rebaseDisplays.length - 1} duplicate rebase displays`);
            for (let i = 1; i < rebaseDisplays.length; i++) {
                rebaseDisplays[i].remove();
            }
        }
        
        // Remove any orphaned monitoring elements
        const orphanedElements = document.querySelectorAll('[class*="ampl-monitor"], [class*="cascade-monitor"]');
        orphanedElements.forEach(element => {
            if (!element.closest('.smart-order-ladder') && !element.closest('.limit-orders-panel')) {
                console.log('🗑️ Removing orphaned monitoring element');
                element.remove();
            }
        });
        
        console.log('🧹 Duplicate panel cleanup complete');
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
     * Initialize all UI panels (only if they don't exist)
     */
    initializePanels() {
        // Only initialize if not already created
        if (!this.createdElements.statusDisplay) {
            this.initializeLimitOrdersPanel();
        }
        
        // Smart Order Ladder should already exist - don't create duplicates
        this.initializeSmartOrderLadder();
        
        // Only initialize rebase protection if not already created
        if (!this.createdElements.rebaseDisplay) {
            this.initializeRebaseProtectionMonitor();
        }
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
        
        // Set up periodic updates every 30 seconds (reduced frequency to prevent flickering)
        this.updateInterval = setInterval(() => {
            this.updateAllPanels();
        }, 30000);
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
     * Update all UI panels with latest data - FIXED FLICKERING
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
                // Only update if data actually changed (prevents flickering)
                const dataChanged = !this.lastUpdateData || 
                    JSON.stringify(this.lastUpdateData.orderStatus) !== JSON.stringify(result.data.orderStatus);
                
                if (dataChanged) {
                    this.monitoringData = result.data;
                    this.lastUpdateData = result.data;
                    
                    // Update all panels
                    this.updateLimitOrdersPanel();
                    this.updateSmartOrderLadder();
                    this.updateRebaseProtectionMonitor();
                    
                    console.log('✅ UI panels updated successfully (data changed)');
                } else {
                    console.log('📊 UI panels - no data change, skipping update');
                }
            } else {
                console.error('❌ Monitor API error:', result.error);
            }
            
        } catch (error) {
            console.error('❌ Error updating UI panels:', error);
        }
    }
    
    /**
     * Initialize Limit Orders Panel - PREVENT DUPLICATES
     */
    initializeLimitOrdersPanel() {
        // Check if already exists
        if (document.querySelector(this.selectors.orderStatusDisplay)) {
            console.log('✅ Limit Orders Panel already exists - skipping creation');
            this.createdElements.statusDisplay = true;
            return;
        }
        
        const panel = document.querySelector(this.selectors.limitOrdersPanel);
        if (!panel) {
            console.warn('⚠️ Limit Orders Panel not found');
            return;
        }
        
        // Create status display only if it doesn't exist
        const statusDiv = document.createElement('div');
        statusDiv.className = 'order-status-display';
        statusDiv.style.cssText = `
            padding: 15px; 
            background: #1F2937; 
            color: white; 
            border-radius: 8px; 
            margin: 10px 0;
            font-size: 28px;
            font-weight: bold;
            text-align: center;
            background: linear-gradient(135deg, #1F2937 0%, #374151 100%);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border: 1px solid #4B5563;
        `;
        statusDiv.innerHTML = '<strong>0 orders open, 0 pending</strong>';
        panel.appendChild(statusDiv);
        
        this.createdElements.statusDisplay = true;
        console.log('✅ Limit Orders Panel initialized (no duplicates)');
    }
    
    /**
     * Update Limit Orders Panel - FIXED LOGIC
     */
    updateLimitOrdersPanel() {
        if (!this.monitoringData) return;
        
        const { orderStatus } = this.monitoringData;
        
        // CORRECTED LOGIC:
        // Pending = Orders deployed but not executed (waiting limit orders)
        // Active = Orders that have been executed and are now active trades
        
        const pendingOrders = orderStatus.active; // These are actually pending limit orders
        const activeOrders = orderStatus.filled;  // These are executed orders (active trades)
        
        // Update main status display with STABLE values
        const statusEl = document.querySelector(this.selectors.orderStatusDisplay);
        if (statusEl) {
            statusEl.innerHTML = `<strong>${activeOrders} orders open, ${pendingOrders} pending</strong>`;
        }
        
        // Update individual count elements with enhanced styling
        const activeEl = document.querySelector(this.selectors.activeTradesCount);
        const pendingEl = document.querySelector(this.selectors.pendingTradesCount);
        
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
        
        // Update indicators with proper colors
        const activeIndicator = document.querySelector(this.selectors.activeTradesIndicator);
        const pendingIndicator = document.querySelector(this.selectors.pendingTradesIndicator);
        
        if (activeIndicator) {
            activeIndicator.style.backgroundColor = activeOrders > 0 ? '#10B981' : '#6B7280';
            activeIndicator.style.boxShadow = activeOrders > 0 ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none';
        }
        
        if (pendingIndicator) {
            pendingIndicator.style.backgroundColor = pendingOrders > 0 ? '#F59E0B' : '#6B7280';
            pendingIndicator.style.boxShadow = pendingOrders > 0 ? '0 0 10px rgba(245, 158, 11, 0.5)' : 'none';
        }
        
        console.log(`📊 Limit Orders Panel: ${activeOrders} active trades, ${pendingOrders} pending orders`);
    }
    
    /**
     * Initialize Smart Order Ladder - NO DUPLICATES
     */
    initializeSmartOrderLadder() {
        const ladder = document.querySelector(this.selectors.smartOrderLadder);
        if (!ladder) {
            console.warn('⚠️ Smart Order Ladder not found');
            return;
        }
        
        console.log('✅ Smart Order Ladder found (using existing)');
    }
    
    /**
     * Update Smart Order Ladder - PROPER COLOR CODING
     */
    updateSmartOrderLadder() {
        if (!this.monitoringData) return;
        
        const { existingOrders, expectedLevels } = this.monitoringData;
        const inputs = document.querySelectorAll(this.selectors.orderLadderInputs);
        
        inputs.forEach((input, index) => {
            if (index < expectedLevels.length) {
                const expectedLevel = expectedLevels[index];
                const existingOrder = existingOrders.find(o => o.level === expectedLevel.level);
                
                // Update input value
                input.value = expectedLevel.price.toFixed(4);
                
                // CORRECTED COLOR LOGIC:
                input.classList.remove('filled', 'pending', 'empty');
                
                if (existingOrder) {
                    if (existingOrder.status === 'active') {
                        // Orange for deployed orders waiting for execution
                        input.classList.add('pending');
                        input.style.backgroundColor = '#F59E0B';
                        input.style.color = 'white';
                        input.style.border = '2px solid #D97706';
                        input.style.boxShadow = '0 0 8px rgba(245, 158, 11, 0.4)';
                    } else {
                        // Green for executed orders
                        input.classList.add('filled');
                        input.style.backgroundColor = '#10B981';
                        input.style.color = 'white';
                        input.style.border = '2px solid #059669';
                        input.style.boxShadow = '0 0 8px rgba(16, 185, 129, 0.4)';
                    }
                } else {
                    // Gray for empty positions
                    input.classList.add('empty');
                    input.style.backgroundColor = '#374151';
                    input.style.color = '#9CA3AF';
                    input.style.border = '1px solid #4B5563';
                    input.style.boxShadow = 'none';
                }
            }
        });
        
        console.log(`🎯 Smart Order Ladder updated: ${existingOrders.length}/${expectedLevels.length} levels filled`);
    }
    
    /**
     * Initialize Rebase Protection Monitor - PREVENT DUPLICATES
     */
    initializeRebaseProtectionMonitor() {
        // Check if already exists
        if (document.querySelector('.rebase-protection-display')) {
            console.log('✅ Rebase Protection Monitor already exists - skipping creation');
            this.createdElements.rebaseDisplay = true;
            return;
        }
        
        const panel = document.querySelector(this.selectors.rebaseProtectionPanel);
        if (!panel) {
            console.warn('⚠️ Rebase Protection Panel not found');
            return;
        }
        
        // Create rebase protection display only if it doesn't exist
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';
        progressContainer.innerHTML = `
            <div class="progress-bar-background" style="background: #374151; height: 24px; border-radius: 12px; overflow: hidden; margin: 8px 0;">
                <div class="progress-bar" style="width: 0%; background-color: #10B981; height: 100%; transition: width 0.5s ease; border-radius: 12px;"></div>
            </div>
            <div class="progress-percentage" style="text-align: center; margin: 8px 0; font-weight: bold; font-size: 16px;">0% Safe</div>
        `;
        panel.appendChild(progressContainer);
        
        this.createdElements.rebaseDisplay = true;
        console.log('✅ Rebase Protection Monitor initialized (no duplicates)');
    }
    
    /**
     * Update Rebase Protection Monitor
     */
    updateRebaseProtectionMonitor() {
        if (!this.monitoringData) return;
        
        const { rebaseProtection } = this.monitoringData;
        
        // Update progress bar
        const progressBar = document.querySelector(this.selectors.progressBar);
        if (progressBar) {
            const percentage = Math.max(0, Math.min(100, parseFloat(rebaseProtection.safetyRatio) * 100));
            progressBar.style.width = `${percentage}%`;
            
            // Color coding based on safety level
            if (percentage >= 100) {
                progressBar.style.backgroundColor = '#10B981'; // Green - Safe
            } else if (percentage >= 95) {
                progressBar.style.backgroundColor = '#F59E0B'; // Orange - Caution
            } else {
                progressBar.style.backgroundColor = '#EF4444'; // Red - Danger
            }
        }
        
        // Update percentage display
        const percentageEl = document.querySelector(this.selectors.progressPercentage);
        if (percentageEl) {
            const percentage = (parseFloat(rebaseProtection.safetyRatio) * 100).toFixed(0);
            percentageEl.textContent = `${percentage}% ${rebaseProtection.status}`;
            
            // Color coding for text
            percentageEl.style.color = rebaseProtection.status === 'Safe' ? '#10B981' : 
                                      rebaseProtection.status === 'Caution' ? '#F59E0B' : '#EF4444';
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
            statusEl.innerHTML = '<strong>0 orders open, 0 pending</strong>';
        }
        
        // Clear Smart Order Ladder
        const inputs = document.querySelectorAll(this.selectors.orderLadderInputs);
        inputs.forEach(input => {
            input.value = '';
            input.style.backgroundColor = '#374151';
            input.style.color = '#9CA3AF';
            input.style.border = '1px solid #4B5563';
            input.style.boxShadow = 'none';
        });
        
        // Clear Rebase Protection Monitor
        const progressBar = document.querySelector(this.selectors.progressBar);
        if (progressBar) {
            progressBar.style.width = '0%';
            progressBar.style.backgroundColor = '#6B7280';
        }
        
        const percentageEl = document.querySelector(this.selectors.progressPercentage);
        if (percentageEl) {
            percentageEl.textContent = '0% Unknown';
            percentageEl.style.color = '#6B7280';
        }
        
        console.log('🧹 All UI panels cleared');
    }
    
    /**
     * Manual refill missing orders
     */
    async refillMissingOrders() {
        try {
            console.log('🔄 Manually triggering order refill...');
            
            const response = await fetch(`${window.SUPABASE_URL || 'https://fbkcdirkshubectuvxzi.supabase.co'}/functions/v1/ampl-order-monitor`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia2NkaXJrc2h1YmVjdHV2eHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NDc0ODAsImV4cCI6MjA2MjAyMzQ4MH0.yhy1JL-V9zQVK1iIdSVK1261qD8gmHmo2vB-qe7Kit8'}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refill: true }) // Request refill
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log(`✅ Refill complete: ${result.refilledCount} orders placed`);
                
                // Update UI immediately
                setTimeout(() => this.updateAllPanels(), 2000);
                
                return result.refilledCount;
            } else {
                console.error('❌ Refill failed:', result.error);
                return 0;
            }
            
        } catch (error) {
            console.error('❌ Error during refill:', error);
            return 0;
        }
    }
    
    /**
     * Get current monitoring status
     */
    getStatus() {
        return {
            isMonitoring: this.isMonitoring,
            hasData: !!this.monitoringData,
            lastUpdate: this.monitoringData?.timestamp,
            orderStatus: this.monitoringData?.orderStatus,
            createdElements: this.createdElements
        };
    }
}

// Initialize UI Integration when DOM is loaded
let amplUIIntegration = null;

document.addEventListener('DOMContentLoaded', function() {
    // Wait for other scripts to initialize
    setTimeout(() => {
        amplUIIntegration = new AMPLUIIntegration();
        console.log('🎨 AMPL UI Integration (FIXED) initialized');
        
        // Make it globally accessible
        window.amplUIIntegration = amplUIIntegration;
    }, 3000);
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AMPLUIIntegration;
}

