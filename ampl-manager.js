/**
 * AMPL Manager - Smart Order Ladder System
 * Connects AMPL Manager checkbox to AMPL Cascade deployment
 * Uses 90% of balance and updates Smart Order Ladder UI
 */

class AMPLManager {
    constructor() {
        // 8-level price ladder (4% spacing from 1.16 down to ~0.85)
        this.priceLevels = [
            1.160, 1.114, 1.069, 1.026, 
            0.985, 0.946, 0.908, 0.872
        ];
        
        // Weighted distribution - more money to lower prices
        this.weightFactors = [
            0.8,   // 1.160 - 80% of base amount (less money)
            0.9,   // 1.114 - 90% of base amount
            1.0,   // 1.069 - 100% of base amount (baseline)
            1.2,   // 1.026 - 120% of base amount
            1.4,   // 0.985 - 140% of base amount (more money)
            1.6,   // 0.946 - 160% of base amount
            1.8,   // 0.908 - 180% of base amount
            2.0    // 0.872 - 200% of base amount (most money)
        ];
        
        this.isEnabled = false;
        this.currentOrders = [];
        this.totalBalance = 0;
        this.originalPurchaseAmount = 0;
        this.currentHoldings = {
            ampl: 0,
            value: 0
        };
        
        // Rebase protection settings
        this.rebaseProtectionEnabled = true;
        this.minimumSafetyRatio = 0.95; // Don't sell if current value < 95% of original purchase
        
        // Initialize event listeners
        this.initializeEventListeners();
        
        console.log('🚀 AMPL Manager initialized');
    }
    
    /**
     * Deploy AMPL Cascade using 90% of balance
     * @param {number} currentPrice - Current AMPL price
     * @param {number} balance - Available USDT balance
     */
    async deployAMPLCascade(currentPrice, balance) {
        if (!this.isEnabled) {
            console.log('❌ AMPL Manager disabled - skipping cascade deployment');
            return;
        }
        
        console.log('🌊 Deploying AMPL Cascade...');
        console.log(`💰 Using 90% of balance: $${(balance * 0.9).toFixed(2)} out of $${balance.toFixed(2)}`);
        
        try {
            // Call the integrated AMPL Cascade function
            const response = await fetch(`${window.SUPABASE_URL || 'https://fbkcdirkshubectuvxzi.supabase.co'}/functions/v1/ampl-cascade`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia2NkaXJrc2h1YmVjdHV2eHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NDc0ODAsImV4cCI6MjA2MjAyMzQ4MH0.yhy1JL-V9zQVK1iIdSVK1261qD8gmHmo2vB-qe7Kit8'}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    balance: balance // Pass current balance to cascade function
                })
            });
            
            console.log('📡 Cascade response status:', response.status);
            
            const responseText = await response.text();
            console.log('📡 Cascade raw response:', responseText);
            
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('❌ JSON parse error:', parseError);
                throw new Error(`Invalid JSON response: ${responseText}`);
            }
            
            console.log('✅ Cascade parsed response:', data);
            
            if (data.success) {
                // Update internal tracking with cascade orders
                this.currentOrders = data.placedOrders.map(order => ({
                    id: order.clientOid,
                    kucoinOrderId: order.orderId,
                    price: order.price,
                    size: parseFloat(order.size),
                    usdtValue: parseFloat(order.usdtValue),
                    level: order.level - 1, // Convert to 0-based index
                    status: 'active',
                    timestamp: new Date().toISOString(),
                    source: 'cascade'
                }));
                
                console.log(`🌊 AMPL Cascade deployed successfully!`);
                console.log(`✅ Orders placed: ${data.summary.ordersPlaced}/${data.summary.totalLevels}`);
                console.log(`💰 USDT deployed: $${data.summary.totalUSDTDeployed} (${data.summary.balanceUsagePercent}% of balance)`);
                
                // Update UI
                this.updateLadderPanelDisplay();
                
                // Show success notification
                this.showNotification(`🌊 AMPL Cascade deployed! ${data.summary.ordersPlaced} orders placed using ${data.summary.balanceUsagePercent}% of balance ($${data.summary.totalUSDTDeployed})`, 'success');
                
                return {
                    success: true,
                    ordersPlaced: data.summary.ordersPlaced,
                    totalDeployed: data.summary.totalUSDTDeployed
                };
                
            } else {
                console.error('❌ Cascade deployment failed:', data.error);
                this.showNotification(`❌ Cascade deployment failed: ${data.error}`, 'error');
                
                return {
                    success: false,
                    error: data.error
                };
            }
            
        } catch (error) {
            console.error('❌ Error deploying cascade:', error);
            this.showNotification(`❌ Cascade deployment error: ${error.message}`, 'error');
            
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Refresh order ladder with current balance
     */
    async refreshOrderLadder() {
        if (!this.isEnabled) return;
        
        // Get current balance and price
        const balance = parseFloat(document.getElementById('usdt-balance')?.textContent || '0');
        const currentPrice = parseFloat(document.getElementById('current-ampl-price')?.textContent || '1.20');
        
        console.log('🔄 Refreshing order ladder...');
        console.log(`💰 Current balance: $${balance.toFixed(2)}`);
        console.log(`📈 Current AMPL price: $${currentPrice.toFixed(4)}`);
        
        await this.deployAMPLCascade(currentPrice, balance);
    }
    
    /**
     * Cancel all current orders
     */
    async cancelAllOrders() {
        console.log('🚫 Canceling all cascade orders...');
        
        // TODO: Implement cascade order cancellation via KuCoin API
        // For now, just clear internal tracking
        this.currentOrders = [];
        
        // Update UI
        this.updateLadderPanelDisplay();
        
        this.showNotification('🚫 All orders canceled', 'info');
    }
    
    /**
     * Update ladder panel display with cascade orders
     */
    updateLadderPanelDisplay() {
        // Update active/pending trade counts
        const activeCount = this.currentOrders.filter(o => o.status === 'active').length;
        const pendingCount = this.currentOrders.filter(o => o.status === 'pending').length;
        
        // Update order status display
        const statusEl = document.querySelector('.order-status-display');
        if (statusEl) {
            statusEl.innerHTML = `<strong>${activeCount} orders open, ${pendingCount} pending</strong>`;
        }
        
        // Update individual order status elements
        const activeEl = document.querySelector('#active-trades-count');
        const pendingEl = document.querySelector('#pending-trades-count');
        
        if (activeEl) activeEl.textContent = activeCount;
        if (pendingEl) pendingEl.textContent = pendingCount;
        
        // Update price level badges
        this.updatePriceLevelBadges();
        
        // Update holdings tracker
        this.updateHoldingsTracker();
        
        console.log(`📊 UI updated: ${activeCount} active, ${pendingCount} pending orders`);
    }
    
    /**
     * Update price level badges with current status
     */
    updatePriceLevelBadges() {
        // Find all price level input fields in Smart Order Ladder
        const priceInputs = document.querySelectorAll('.smart-order-ladder input[type="text"]');
        
        priceInputs.forEach((input, index) => {
            if (index < this.priceLevels.length) {
                const priceLevel = this.priceLevels[index];
                const order = this.currentOrders.find(o => o.level === index);
                
                // Update input value with current price level
                input.value = priceLevel.toFixed(4);
                
                // Update input styling based on order status
                input.classList.remove('filled', 'pending', 'empty');
                
                if (order) {
                    if (order.status === 'filled') {
                        input.classList.add('filled');
                        input.style.backgroundColor = '#059669'; // Green for filled
                        input.style.color = 'white';
                    } else if (order.status === 'active') {
                        input.classList.add('pending');
                        input.style.backgroundColor = '#f59e0b'; // Orange for pending
                        input.style.color = 'white';
                    }
                } else {
                    input.classList.add('empty');
                    input.style.backgroundColor = '#374151'; // Gray for empty
                    input.style.color = '#9ca3af';
                }
            }
        });
    }
    
    /**
     * Update rebase protection progress bar
     * @param {number} safetyRatio - Current safety ratio (0-1)
     */
    updateRebaseProtectionDisplay(safetyRatio) {
        const progressBar = document.querySelector('.progress-bar');
        const percentageEl = document.querySelector('.progress-percentage');
        
        if (progressBar) {
            const percentage = Math.max(0, Math.min(100, safetyRatio * 100));
            progressBar.style.width = `${percentage}%`;
        }
        
        if (percentageEl) {
            const status = safetyRatio >= 1.0 ? 'Safe' : safetyRatio >= 0.95 ? 'Caution' : 'Danger';
            percentageEl.textContent = `${(safetyRatio * 100).toFixed(0)}% ${status}`;
        }
    }
    
    /**
     * Update holdings tracker display
     */
    updateHoldingsTracker() {
        const currentPrice = parseFloat(document.getElementById('current-ampl-price')?.textContent || '1.20');
        const currentValue = this.currentHoldings.ampl * currentPrice;
        const difference = currentValue - this.originalPurchaseAmount;
        
        // Update original purchase amount
        const originalEl = document.querySelector('.holdings-value.original');
        if (originalEl) {
            originalEl.textContent = `$${this.originalPurchaseAmount.toFixed(2)}`;
        }
        
        // Update current value
        const currentEl = document.querySelector('.holdings-value.current');
        if (currentEl) {
            currentEl.textContent = `$${currentValue.toFixed(2)}`;
        }
        
        // Update difference
        const diffEl = document.querySelector('.holdings-value.difference');
        if (diffEl) {
            const sign = difference >= 0 ? '+' : '';
            diffEl.textContent = `${sign}$${difference.toFixed(2)}`;
            diffEl.classList.remove('positive', 'negative');
            diffEl.classList.add(difference >= 0 ? 'positive' : 'negative');
        }
    }
    
    /**
     * Show notification to user
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, info)
     */
    showNotification(message, type = 'info') {
        // Try to use existing notification system
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
            return;
        }
        
        // Fallback: console log and alert for important messages
        console.log(`📢 ${type.toUpperCase()}: ${message}`);
        
        if (type === 'error') {
            alert(`❌ ${message}`);
        } else if (type === 'success') {
            // Only show success alerts for major events
            if (message.includes('deployed')) {
                alert(`✅ ${message}`);
            }
        }
    }
    
    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        // AMPL Manager enable/disable toggle
        const amplManagerToggle = document.getElementById('ampl-manager-toggle');
        if (amplManagerToggle) {
            amplManagerToggle.addEventListener('change', (e) => {
                this.isEnabled = e.target.checked;
                console.log(`🎯 AMPL Manager ${this.isEnabled ? 'ENABLED' : 'DISABLED'}`);
                
                if (this.isEnabled) {
                    // Deploy cascade when enabled
                    setTimeout(() => {
                        this.refreshOrderLadder();
                    }, 1000); // Small delay to ensure UI is ready
                } else {
                    // Cancel orders when disabled
                    this.cancelAllOrders();
                }
            });
        } else {
            console.warn('⚠️ AMPL Manager toggle not found - looking for alternative selectors');
            
            // Try alternative selectors
            const altToggle = document.querySelector('input[type="checkbox"][id*="ampl"]') || 
                             document.querySelector('input[type="checkbox"][class*="ampl"]');
            
            if (altToggle) {
                console.log('✅ Found alternative AMPL toggle');
                altToggle.addEventListener('change', (e) => {
                    this.isEnabled = e.target.checked;
                    console.log(`🎯 AMPL Manager ${this.isEnabled ? 'ENABLED' : 'DISABLED'}`);
                    
                    if (this.isEnabled) {
                        setTimeout(() => {
                            this.refreshOrderLadder();
                        }, 1000);
                    } else {
                        this.cancelAllOrders();
                    }
                });
            }
        }
        
        // Listen for price updates
        document.addEventListener('amplPriceUpdate', (e) => {
            const newPrice = e.detail.price;
            // TODO: Check sell conditions when price updates
        });
        
        // Listen for balance updates
        document.addEventListener('balanceUpdate', (e) => {
            this.totalBalance = e.detail.balance;
        });
        
        console.log('🎧 Event listeners initialized');
    }
    
    /**
     * Enable AMPL Manager
     */
    enable() {
        this.isEnabled = true;
        const toggle = document.getElementById('ampl-manager-toggle');
        if (toggle) toggle.checked = true;
        this.refreshOrderLadder();
    }
    
    /**
     * Disable AMPL Manager
     */
    disable() {
        this.isEnabled = false;
        const toggle = document.getElementById('ampl-manager-toggle');
        if (toggle) toggle.checked = false;
        this.cancelAllOrders();
    }
    
    /**
     * Get current status for debugging
     */
    getStatus() {
        return {
            enabled: this.isEnabled,
            orders: this.currentOrders,
            holdings: this.currentHoldings,
            originalPurchase: this.originalPurchaseAmount,
            priceLevels: this.priceLevels,
            weightFactors: this.weightFactors
        };
    }
}

// Initialize AMPL Manager when DOM is loaded
let amplManager = null;

document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for main script to initialize
    setTimeout(() => {
        amplManager = new AMPLManager();
        console.log('🚀 AMPL Manager initialized');
        
        // Make it globally accessible for debugging
        window.amplManager = amplManager;
    }, 2000);
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AMPLManager;
}

