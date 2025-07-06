/**
 * AMPL Ladder System - FIXED VERSION
 * Properly replaces Smart Order Ladder panel with correct size and dark styling
 */

class AMPLLadderSystemFixed {
    constructor() {
        this.isEnabled = false;
        this.monitoringInterval = null;
        this.orderData = null;
        this.lastDataHash = null;
        this.originalSmartOrderLadder = null;
        
        // Configuration
        this.config = {
            monitoringFrequency: 30000,  // 30 seconds
            expectedLevels: 8,           // 8 cascade levels
            priceStart: 1.16,            // Starting price
            priceDecrement: 0.04         // 4% between levels
        };
        
        // Color coding for order states
        this.colors = {
            notSubmitted: {
                background: '#374151',    // Gray - Order not submitted
                color: '#9CA3AF',
                border: '1px solid #4B5563'
            },
            submitted: {
                background: '#F59E0B',    // Orange - Submitted, waiting in order book
                color: 'white',
                border: '2px solid #D97706'
            },
            inProfit: {
                background: '#10B981',    // Green - In profit/near sell threshold
                color: 'white',
                border: '2px solid #059669'
            }
        };
        
        console.log('🎯 AMPL Ladder System (FIXED) initializing...');
        this.initialize();
    }
    
    /**
     * Initialize the fixed system
     */
    async initialize() {
        // Clean up old displays first
        this.cleanupOldDisplays();
        
        // Setup AMPL Manager integration
        this.setupAMPLManagerToggle();
        
        // Replace the Smart Order Ladder panel
        this.replaceSmartOrderLadderPanel();
        
        console.log('✅ AMPL Ladder System (FIXED) initialized');
    }
    
    /**
     * Clean up old displays
     */
    cleanupOldDisplays() {
        console.log('🧹 Cleaning up old displays...');
        
        // Remove any previous rebuilt panels
        const oldPanels = document.querySelectorAll('.ampl-ladder-rebuilt, .ladder-system-rebuilt');
        oldPanels.forEach(el => {
            console.log('🗑️ Removing old rebuilt panel');
            el.remove();
        });
        
        // Remove confusing displays
        const confusingDisplays = document.querySelectorAll('.order-status-display');
        confusingDisplays.forEach(el => {
            if (el.textContent.includes('orders open') || el.textContent.includes('pending')) {
                console.log('🗑️ Removing confusing display:', el.textContent);
                el.remove();
            }
        });
        
        console.log('✅ Old displays cleaned up');
    }
    
    /**
     * Setup AMPL Manager toggle integration
     */
    setupAMPLManagerToggle() {
        const toggleSelectors = [
            '#ampl-manager-toggle',
            'input[type="checkbox"][id*="ampl"]',
            'input[type="checkbox"][class*="ampl"]'
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
                    console.log('🎯 AMPL Manager ENABLED - Starting ladder monitoring');
                    this.enable();
                } else {
                    console.log('🎯 AMPL Manager DISABLED - Stopping ladder monitoring');
                    this.disable();
                }
            });
            
            // If already checked, enable system
            if (toggle.checked) {
                setTimeout(() => this.enable(), 2000);
            }
        } else {
            console.warn('⚠️ AMPL Manager toggle not found');
        }
    }
    
    /**
     * Replace the Smart Order Ladder panel
     */
    replaceSmartOrderLadderPanel() {
        // Find the Smart Order Ladder panel container
        const smartOrderLadderContainer = document.querySelector('[class*="smart-order"], .smart-order-ladder');
        
        if (!smartOrderLadderContainer) {
            console.warn('⚠️ Smart Order Ladder container not found');
            return;
        }
        
        // Store reference to original content
        this.originalSmartOrderLadder = smartOrderLadderContainer.innerHTML;
        
        // Clear the existing content
        smartOrderLadderContainer.innerHTML = '';
        
        // Apply dark styling to match other panels
        smartOrderLadderContainer.style.cssText = `
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 15px;
            color: white;
            height: auto;
            max-height: 400px;
            overflow: hidden;
        `;
        
        // Create compact ladder display
        const ladderContent = document.createElement('div');
        ladderContent.className = 'ampl-ladder-fixed';
        ladderContent.style.cssText = `
            width: 100%;
            height: 100%;
        `;
        
        // Create header (compact)
        const header = document.createElement('div');
        header.style.cssText = `
            text-align: center;
            margin-bottom: 10px;
            color: white;
            font-size: 14px;
            font-weight: bold;
        `;
        header.innerHTML = '🎯 AMPL Cascade (8 Levels)';
        ladderContent.appendChild(header);
        
        // Create compact legend
        const legend = document.createElement('div');
        legend.style.cssText = `
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 10px;
            color: #9CA3AF;
        `;
        legend.innerHTML = `
            <span>⚫ Not Sub.</span>
            <span>🟠 Waiting</span>
            <span>🟢 In Profit</span>
        `;
        ladderContent.appendChild(legend);
        
        // Create compact 8 level grid (4x2 to fit height)
        const levelsContainer = document.createElement('div');
        levelsContainer.className = 'ladder-levels-compact';
        levelsContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(4, 1fr);
            gap: 6px;
            height: 200px;
        `;
        
        for (let i = 0; i < this.config.expectedLevels; i++) {
            const level = i + 1;
            const price = (this.config.priceStart * Math.pow(0.96, i)).toFixed(4);
            
            const levelDiv = document.createElement('div');
            levelDiv.className = `ladder-level-${level}`;
            levelDiv.setAttribute('data-level', level);
            levelDiv.style.cssText = `
                background: ${this.colors.notSubmitted.background};
                color: ${this.colors.notSubmitted.color};
                border: ${this.colors.notSubmitted.border};
                border-radius: 4px;
                padding: 6px;
                text-align: center;
                transition: all 0.3s ease;
                font-size: 11px;
                display: flex;
                flex-direction: column;
                justify-content: center;
            `;
            
            levelDiv.innerHTML = `
                <div style="font-weight: bold;">L${level}</div>
                <div style="font-size: 12px; margin: 2px 0;">$${price}</div>
                <div class="level-status" style="font-size: 9px; opacity: 0.8;">Not Sub.</div>
            `;
            
            levelsContainer.appendChild(levelDiv);
        }
        
        ladderContent.appendChild(levelsContainer);
        
        // Create compact status summary
        const statusSummary = document.createElement('div');
        statusSummary.className = 'ladder-status-summary';
        statusSummary.style.cssText = `
            margin-top: 10px;
            padding: 6px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 4px;
            text-align: center;
            color: #9CA3AF;
            font-size: 11px;
        `;
        statusSummary.innerHTML = '📊 0 sub, 0 wait, 0 profit';
        ladderContent.appendChild(statusSummary);
        
        // Add to Smart Order Ladder container
        smartOrderLadderContainer.appendChild(ladderContent);
        
        console.log('✅ Smart Order Ladder panel replaced with compact ladder');
    }
    
    /**
     * Enable ladder monitoring
     */
    enable() {
        if (this.isEnabled) return;
        
        this.isEnabled = true;
        console.log('🎯 Enabling AMPL Ladder monitoring...');
        
        // Start monitoring
        this.startMonitoring();
    }
    
    /**
     * Disable ladder monitoring
     */
    disable() {
        if (!this.isEnabled) return;
        
        this.isEnabled = false;
        console.log('🛑 Disabling AMPL Ladder monitoring...');
        
        // Stop monitoring
        this.stopMonitoring();
        
        // Reset ladder display
        this.resetLadderDisplay();
    }
    
    /**
     * Start monitoring
     */
    startMonitoring() {
        if (this.monitoringInterval) return;
        
        console.log('👁️ Starting ladder monitoring...');
        
        // Initial update
        this.updateLadderDisplay();
        
        // Set up periodic monitoring
        this.monitoringInterval = setInterval(() => {
            this.updateLadderDisplay();
        }, this.config.monitoringFrequency);
    }
    
    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log('🛑 Ladder monitoring stopped');
        }
    }
    
    /**
     * Update ladder display
     */
    async updateLadderDisplay() {
        try {
            console.log('🔄 Updating ladder display...');
            
            // Fetch order data
            const response = await fetch(`${window.SUPABASE_URL || 'https://fbkcdirkshubectuvxzi.supabase.co'}/functions/v1/ampl-order-monitor`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia2NkaXJrc2h1YmVjdHV2eHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NDc0ODAsImV4cCI6MjA2MjAyMzQ4MH0.yhy1JL-V9zQVK1iIdSVK1261qD8gmHmo2vB-qe7Kit8'}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refill: false })
            });
            
            if (!response.ok) {
                throw new Error(`Monitor API error: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                // Only update if data changed
                const dataHash = JSON.stringify(result.data.orderStatus);
                if (this.lastDataHash === dataHash) {
                    return; // No change, skip update
                }
                
                this.lastDataHash = dataHash;
                this.orderData = result.data;
                
                // Update the ladder levels
                this.updateLadderLevels();
                
                console.log('✅ Ladder display updated');
            } else {
                console.error('❌ Monitor API error:', result.error);
            }
            
        } catch (error) {
            console.error('❌ Error updating ladder display:', error);
        }
    }
    
    /**
     * Update individual ladder levels
     */
    updateLadderLevels() {
        if (!this.orderData) return;
        
        const { existingOrders, expectedLevels } = this.orderData;
        
        let submittedCount = 0;
        let waitingCount = 0;
        let profitCount = 0;
        
        // Update each level
        for (let i = 0; i < this.config.expectedLevels; i++) {
            const level = i + 1;
            const levelDiv = document.querySelector(`.ladder-level-${level}`);
            
            if (!levelDiv) continue;
            
            const expectedLevel = expectedLevels[i];
            const existingOrder = existingOrders.find(o => o.level === expectedLevel?.level);
            
            let colorScheme = this.colors.notSubmitted;
            let statusText = 'Not Sub.';
            
            if (existingOrder) {
                submittedCount++;
                
                if (existingOrder.status === 'active') {
                    // Order is submitted and waiting in order book
                    colorScheme = this.colors.submitted;
                    statusText = 'Waiting';
                    waitingCount++;
                } else if (existingOrder.status === 'filled') {
                    // Order was filled - now in profit or near sell threshold
                    colorScheme = this.colors.inProfit;
                    statusText = 'In Profit';
                    profitCount++;
                }
            }
            
            // Update level styling
            levelDiv.style.background = colorScheme.background;
            levelDiv.style.color = colorScheme.color;
            levelDiv.style.border = colorScheme.border;
            
            // Update status text
            const statusEl = levelDiv.querySelector('.level-status');
            if (statusEl) {
                statusEl.textContent = statusText;
            }
        }
        
        // Update compact status summary
        const statusSummary = document.querySelector('.ladder-status-summary');
        if (statusSummary) {
            statusSummary.innerHTML = `📊 ${submittedCount} sub, ${waitingCount} wait, ${profitCount} profit`;
        }
        
        console.log(`🎯 Ladder levels: ${submittedCount} submitted, ${waitingCount} waiting, ${profitCount} in profit`);
    }
    
    /**
     * Reset ladder display
     */
    resetLadderDisplay() {
        for (let i = 1; i <= this.config.expectedLevels; i++) {
            const levelDiv = document.querySelector(`.ladder-level-${i}`);
            
            if (levelDiv) {
                levelDiv.style.background = this.colors.notSubmitted.background;
                levelDiv.style.color = this.colors.notSubmitted.color;
                levelDiv.style.border = this.colors.notSubmitted.border;
                
                const statusEl = levelDiv.querySelector('.level-status');
                if (statusEl) {
                    statusEl.textContent = 'Not Sub.';
                }
            }
        }
        
        // Reset status summary
        const statusSummary = document.querySelector('.ladder-status-summary');
        if (statusSummary) {
            statusSummary.innerHTML = '📊 0 sub, 0 wait, 0 profit';
        }
        
        console.log('🧹 Ladder display reset');
    }
    
    /**
     * Restore original Smart Order Ladder (if needed)
     */
    restoreOriginalLadder() {
        if (!this.originalSmartOrderLadder) return;
        
        const smartOrderLadderContainer = document.querySelector('[class*="smart-order"], .smart-order-ladder');
        if (smartOrderLadderContainer) {
            smartOrderLadderContainer.innerHTML = this.originalSmartOrderLadder;
            console.log('🔄 Original Smart Order Ladder restored');
        }
    }
    
    /**
     * Get system status
     */
    getStatus() {
        return {
            enabled: this.isEnabled,
            hasData: !!this.orderData,
            lastUpdate: this.orderData?.timestamp,
            monitoring: !!this.monitoringInterval,
            config: this.config
        };
    }
}

// Initialize Fixed Ladder System when DOM is loaded
let amplLadderSystemFixed = null;

document.addEventListener('DOMContentLoaded', function() {
    // Wait for other scripts to load
    setTimeout(() => {
        amplLadderSystemFixed = new AMPLLadderSystemFixed();
        console.log('🎯 AMPL Ladder System (FIXED) ready');
        
        // Make it globally accessible
        window.amplLadderSystemFixed = amplLadderSystemFixed;
        window.amplLadder = amplLadderSystemFixed; // Shorter alias
    }, 5000);
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AMPLLadderSystemFixed;
}

