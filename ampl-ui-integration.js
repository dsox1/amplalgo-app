/**
 * AMPL UI Integration System
 * Connects order monitoring data to all UI panels
 * Provides real-time updates and visual indicators
 */

class AMPLUIIntegration {
    constructor() {
        this.monitoringData = null;
        this.updateInterval = null;
        this.isMonitoring = false;
        
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
        
        console.log('🎨 AMPL UI Integration initialized');
        this.initializeUI();
    }
    
    /**
     * Initialize UI integration
     */
    initializeUI() {
        // Remove purple cascade button if it exists
        this.removePurpleCascadeButton();
        
        // Set up monitoring when AMPL Manager is enabled
        this.setupAMPLManagerIntegration();
        
        // Initialize UI panels
        this.initializePanels();
        
        console.log('🎨 UI Integration setup complete');
    }
    
    /**
     * Remove the purple "Deploy AMPL Cascade" button
     */
    removePurpleCascadeButton() {
        // Look for purple cascade button with various selectors
        const buttonSelectors = [
            'button[style*="purple"]',
            'button[style*="#8B5CF6"]',
            'button[style*="#7C3AED"]',
            'button:contains("Deploy AMPL Cascade")',
            'button:contains("🌊")',
            '.cascade-button',
            '#deploy-cascade-btn'
        ];
        
        buttonSelectors.forEach(selector => {
            try {
                const buttons = document.querySelectorAll(selector);
                buttons.forEach(button => {
                    if (button.textContent.includes('Deploy') || 
                        button.textContent.includes('Cascade') || 
                        button.textContent.includes('🌊')) {
                        console.log('🗑️ Removing purple cascade button:', button.textContent);
                        button.remove();
                    }
                });
            } catch (e) {
                // Selector might not be valid, continue
            }
        });
        
        // Also remove any floating buttons
        const floatingButtons = document.querySelectorAll('button[style*="position: fixed"], button[style*="position: absolute"]');
        floatingButtons.forEach(button => {
            if (button.textContent.includes('🌊') || button.textContent.includes('Cascade')) {
                console.log('🗑️ Removing floating cascade button');
                button.remove();
            }
        });
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
     * Initialize all UI panels
     */
    initializePanels() {
        this.initializeLimitOrdersPanel();
        this.initializeSmartOrderLadder();
        this.initializeRebaseProtectionMonitor();
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
        
        // Set up periodic updates every 30 seconds
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
                
                // Update all panels
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
        const panel = document.querySelector(this.selectors.limitOrdersPanel);
        if (!panel) {
            console.warn('⚠️ Limit Orders Panel not found');
            return;
        }
        
        // Ensure we have the status display elements
        if (!document.querySelector(this.selectors.orderStatusDisplay)) {
            const statusDiv = document.createElement('div');
            statusDiv.className = 'order-status-display';
            statusDiv.innerHTML = '<strong>0 orders open, 0 pending</strong>';
            panel.appendChild(statusDiv);
        }
        
        console.log('✅ Limit Orders Panel initialized');
    }
    
    /**
     * Update Limit Orders Panel
     */
    updateLimitOrdersPanel() {
        if (!this.monitoringData) return;
        
        const { orderStatus } = this.monitoringData;
        
        // Update order counts
        const statusEl = document.querySelector(this.selectors.orderStatusDisplay);
        if (statusEl) {
            statusEl.innerHTML = `<strong>${orderStatus.active} orders open, 0 pending</strong>`;
        }
        
        // Update individual count elements
        const activeEl = document.querySelector(this.selectors.activeTradesCount);
        const pendingEl = document.querySelector(this.selectors.pendingTradesCount);
        
        if (activeEl) activeEl.textContent = orderStatus.active;
        if (pendingEl) pendingEl.textContent = '0'; // No pending orders in our system
        
        // Update indicators
        const activeIndicator = document.querySelector(this.selectors.activeTradesIndicator);
        const pendingIndicator = document.querySelector(this.selectors.pendingTradesIndicator);
        
        if (activeIndicator) {
            activeIndicator.style.backgroundColor = orderStatus.active > 0 ? '#10B981' : '#6B7280';
        }
        
        if (pendingIndicator) {
            pendingIndicator.style.backgroundColor = '#6B7280'; // Always gray for pending
        }
        
        console.log(`📊 Limit Orders Panel: ${orderStatus.active} active, ${orderStatus.filled} filled, ${orderStatus.missing} missing`);
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
     * Update Smart Order Ladder
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
                
                // Update styling based on order status
                input.classList.remove('filled', 'pending', 'empty');
                
                if (existingOrder) {
                    if (existingOrder.status === 'active') {
                        input.classList.add('pending');
                        input.style.backgroundColor = '#F59E0B'; // Orange for active orders
                        input.style.color = 'white';
                        input.style.border = '2px solid #D97706';
                    } else {
                        input.classList.add('filled');
                        input.style.backgroundColor = '#10B981'; // Green for filled
                        input.style.color = 'white';
                        input.style.border = '2px solid #059669';
                    }
                } else {
                    input.classList.add('empty');
                    input.style.backgroundColor = '#374151'; // Gray for empty
                    input.style.color = '#9CA3AF';
                    input.style.border = '1px solid #4B5563';
                }
            }
        });
        
        console.log(`🎯 Smart Order Ladder updated: ${existingOrders.length}/${expectedLevels.length} levels filled`);
    }
    
    /**
     * Initialize Rebase Protection Monitor
     */
    initializeRebaseProtectionMonitor() {
        const panel = document.querySelector(this.selectors.rebaseProtectionPanel);
        if (!panel) {
            console.warn('⚠️ Rebase Protection Panel not found');
            return;
        }
        
        // Ensure we have all required elements
        if (!document.querySelector(this.selectors.progressBar)) {
            const progressContainer = document.createElement('div');
            progressContainer.className = 'progress-container';
            progressContainer.innerHTML = `
                <div class="progress-bar-background">
                    <div class="progress-bar" style="width: 0%; background-color: #10B981; height: 20px; transition: width 0.3s ease;"></div>
                </div>
                <div class="progress-percentage">0% Safe</div>
            `;
            panel.appendChild(progressContainer);
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
        
        // Update value displays
        const originalEl = document.querySelector(this.selectors.originalPurchase);
        const currentEl = document.querySelector(this.selectors.currentValue);
        const diffEl = document.querySelector(this.selectors.valueDifference);
        
        if (originalEl) originalEl.textContent = `$${rebaseProtection.estimatedPurchase}`;
        if (currentEl) currentEl.textContent = `$${rebaseProtection.currentValue}`;
        
        if (diffEl) {
            const diff = parseFloat(rebaseProtection.currentValue) - parseFloat(rebaseProtection.estimatedPurchase);
            const sign = diff >= 0 ? '+' : '';
            diffEl.textContent = `${sign}$${diff.toFixed(2)}`;
            diffEl.style.color = diff >= 0 ? '#10B981' : '#EF4444';
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
            orderStatus: this.monitoringData?.orderStatus
        };
    }
}

// Initialize UI Integration when DOM is loaded
let amplUIIntegration = null;

document.addEventListener('DOMContentLoaded', function() {
    // Wait for other scripts to initialize
    setTimeout(() => {
        amplUIIntegration = new AMPLUIIntegration();
        console.log('🎨 AMPL UI Integration initialized');
        
        // Make it globally accessible
        window.amplUIIntegration = amplUIIntegration;
    }, 3000);
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AMPLUIIntegration;
}

