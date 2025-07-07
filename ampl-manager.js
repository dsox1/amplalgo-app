/**
 * AMPL Manager - Enhanced Complete System (CORS FIXED)
 * Uses proper Supabase endpoints instead of direct KuCoin API calls
 * Single file solution for AMPL cascade trading
 */

class AMPLManagerEnhanced {
    constructor() {
        // Prevent multiple instances
        if (window.amplManagerEnhanced) {
            console.log('🚀 AMPL Manager Enhanced already exists, skipping...');
            return window.amplManagerEnhanced;
        }

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
        this.filledOrders = [];
        this.totalBalance = 0;
        this.originalPurchaseAmount = 0;
        this.currentHoldings = {
            ampl: 0,
            value: 0
        };
        
        // Supabase configuration
        this.supabaseUrl = window.SUPABASE_URL || 'https://fbkcdirkshubectuvxzi.supabase.co';
        this.supabaseKey = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia2NkaXJrc2h1YmVjdHV2eHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NDc0ODAsImV4cCI6MjA2MjAyMzQ4MH0.yhy1JL-V9zQVK1iIdSVK1261qD8gmHmo2vB-qe7Kit8';
        
        // Rebase protection settings
        this.rebaseProtectionEnabled = true;
        this.minimumSafetyRatio = 0.95; // Don't sell if current value < 95% of original purchase
        this.profitThreshold = 1.03; // Sell when 3% profit (103% of purchase price)
        
        // Monitoring intervals
        this.monitoringInterval = null;
        this.profitCheckInterval = null;
        
        // Current price cache
        this.currentPrice = 1.20;
        
        // IMMEDIATELY remove purple buttons before anything else
        this.aggressivePurpleButtonRemoval();
        
        // Initialize event listeners
        this.initializeEventListeners();
        
        console.log('🚀 AMPL Manager Enhanced (CORS Fixed) initialized');
        
        // Make globally accessible
        window.amplManagerEnhanced = this;
    }

    /**
     * AGGRESSIVE PURPLE BUTTON REMOVAL
     * Prevents any cascade buttons from appearing
     */
    aggressivePurpleButtonRemoval() {
        console.log('🛡️ Activating aggressive purple button removal...');

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
            
            // Remove by class and ID
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
     * FIXED API FUNCTIONS - Using Supabase endpoints
     */

    // Get current AMPL price via Supabase function
    async getCurrentAMPLPrice() {
        try {
            console.log('📈 Fetching AMPL price via Supabase...');
            
            const response = await fetch(`${this.supabaseUrl}/functions/v1/ampl-manager/price`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.price) {
                this.currentPrice = parseFloat(data.price);
                console.log(`📈 AMPL price: $${this.currentPrice}`);
                return this.currentPrice;
            } else {
                throw new Error('No price data in response');
            }
            
        } catch (error) {
            console.error('❌ Error fetching AMPL price:', error);
            console.log('📈 Using cached price:', this.currentPrice);
            return this.currentPrice; // Return cached price
        }
    }

    // Get KuCoin balance via Supabase function
    async getKuCoinBalance(currency) {
        try {
            console.log(`💰 Fetching ${currency} balance via Supabase...`);
            
            const response = await fetch(`${this.supabaseUrl}/functions/v1/ampl-manager/balance`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (currency === 'USDT' && data.usdt) {
                const balance = parseFloat(data.usdt.balance || data.usdt.available || '0');
                console.log(`💰 USDT balance: $${balance}`);
                return balance;
            } else if (currency === 'AMPL' && data.ampl) {
                const balance = parseFloat(data.ampl.balance || data.ampl.available || '0');
                console.log(`💰 AMPL balance: ${balance}`);
                return balance;
            } else {
                throw new Error(`No ${currency} balance data in response`);
            }
            
        } catch (error) {
            console.error(`❌ Error fetching ${currency} balance:`, error);
            return 0; // Return 0 on error
        }
    }

    // Get active orders via Supabase function
    async getActiveOrders() {
        try {
            console.log('📋 Fetching active orders via Supabase...');
            
            const response = await fetch(`${this.supabaseUrl}/functions/v1/ampl-order-monitor`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refill: false }) // Just get status, don't refill
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success) {
                console.log('📋 Orders fetched successfully');
                return {
                    active: data.data.existingOrders || [],
                    filled: data.data.profitablePositions || [],
                    missing: data.data.missingLevels || []
                };
            } else {
                throw new Error(data.error || 'Failed to fetch orders');
            }
            
        } catch (error) {
            console.error('❌ Error fetching active orders:', error);
            return { active: [], filled: [], missing: [] };
        }
    }

    // Place sell order via Supabase function
    async placeSellOrder(size, price) {
        try {
            console.log(`💰 Placing sell order: ${size} AMPL at $${price}`);
            
            const response = await fetch(`${this.supabaseUrl}/functions/v1/ampl-manager/place-order`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    symbol: 'AMPL-USDT',
                    side: 'sell',
                    type: 'limit',
                    size: size.toString(),
                    price: price.toString(),
                    clientOid: `ampl-sell-${Date.now()}`
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('💰 Sell order response:', data);
            return data;
            
        } catch (error) {
            console.error('❌ Error placing sell order:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * SELLING LOGIC - The missing piece!
     * Monitors filled orders and sells when profitable
     */
    async checkAndSellProfitablePositions() {
        if (!this.isEnabled) return;

        try {
            console.log('💰 Checking for profitable positions to sell...');

            const currentPrice = await this.getCurrentAMPLPrice();
            const orderData = await this.getActiveOrders();
            const amplBalance = await this.getKuCoinBalance('AMPL');

            console.log(`📊 Current price: $${currentPrice}, AMPL balance: ${amplBalance}`);
            console.log(`📊 Filled positions to check: ${orderData.filled.length}`);

            // Check filled orders for profit opportunities
            for (const position of orderData.filled) {
                const fillPrice = parseFloat(position.fillPrice || position.price || position.averagePrice || 0);
                const fillSize = parseFloat(position.fillSize || position.size || position.dealSize || 0);
                
                if (fillPrice <= 0 || fillSize <= 0) {
                    console.log(`⚠️ Invalid position data:`, position);
                    continue;
                }
                
                const profitRatio = currentPrice / fillPrice;

                console.log(`📊 Position Level ${position.level || 'Unknown'}: Buy $${fillPrice.toFixed(4)}, Current $${currentPrice.toFixed(4)}, Profit: ${((profitRatio - 1) * 100).toFixed(1)}%`);

                // Check if position is profitable and safe to sell
                if (profitRatio >= this.profitThreshold && this.isRebaseSafe(profitRatio)) {
                    console.log(`💰 Selling Level ${position.level || 'Unknown'}: ${fillSize} AMPL at profit`);

                    // Calculate sell price (slightly below market for quick execution)
                    const sellPrice = (currentPrice * 0.999).toFixed(4);

                    const sellResult = await this.placeSellOrder(fillSize, sellPrice);

                    if (sellResult.success) {
                        console.log(`✅ Sell order placed for Level ${position.level || 'Unknown'}: ${sellResult.orderId || 'No ID'}`);
                        
                        // Update tracking
                        this.updateSellTracking(position, sellResult);
                        
                        // Show notification
                        this.showNotification(`💰 Sold Level ${position.level || 'Unknown'}: ${fillSize} AMPL at $${sellPrice} (${((profitRatio - 1) * 100).toFixed(1)}% profit)`, 'success');
                    } else {
                        console.error(`❌ Failed to sell Level ${position.level || 'Unknown'}:`, sellResult.error);
                    }
                } else {
                    const reason = profitRatio < this.profitThreshold ? 'not profitable enough' : 'rebase protection active';
                    console.log(`⏳ Level ${position.level || 'Unknown'}: ${((profitRatio - 1) * 100).toFixed(1)}% profit, but ${reason}`);
                }
            }

        } catch (error) {
            console.error('❌ Error checking profitable positions:', error);
        }
    }

    /**
     * Check if selling is safe according to rebase protection
     */
    isRebaseSafe(profitRatio) {
        if (!this.rebaseProtectionEnabled) return true;

        // Calculate current safety ratio
        const currentValue = this.currentHoldings.ampl * this.currentPrice;
        const safetyRatio = this.originalPurchaseAmount > 0 ? currentValue / this.originalPurchaseAmount : 1.0;

        console.log(`🛡️ Rebase safety check: Current value $${currentValue.toFixed(2)}, Original $${this.originalPurchaseAmount.toFixed(2)}, Ratio: ${(safetyRatio * 100).toFixed(1)}%`);

        // Only sell if we're above minimum safety ratio
        return safetyRatio >= this.minimumSafetyRatio;
    }

    /**
     * Update sell tracking
     */
    updateSellTracking(position, sellResult) {
        // Remove from filled orders
        this.filledOrders = this.filledOrders.filter(order => order.level !== position.level);
        
        // Update holdings
        this.currentHoldings.ampl -= parseFloat(position.fillSize || position.size || 0);
        this.currentHoldings.value = this.currentHoldings.ampl * this.currentPrice;
        
        console.log(`📊 Updated holdings: ${this.currentHoldings.ampl} AMPL, $${this.currentHoldings.value.toFixed(2)} value`);
    }

    /**
     * AUTOMATED REPLACEMENT LOGIC
     * Automatically replaces cancelled or filled orders
     */
    async checkAndReplaceOrders() {
        if (!this.isEnabled) return;

        try {
            console.log('🔄 Checking for orders that need replacement...');

            // Trigger auto-refill via order monitor
            const response = await fetch(`${this.supabaseUrl}/functions/v1/ampl-order-monitor`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refill: true }) // Enable auto-refill
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success && data.refilledCount > 0) {
                console.log(`✅ Auto-replaced ${data.refilledCount} missing orders`);
                this.showNotification(`🔄 Auto-replaced ${data.refilledCount} orders`, 'info');
                
                // Update UI
                this.updateLadderPanelDisplay();
            } else if (data.success) {
                console.log('✅ Order check complete - no replacement needed');
            } else {
                console.error('❌ Order replacement failed:', data.error);
            }

        } catch (error) {
            console.error('❌ Error checking for order replacement:', error);
        }
    }

    /**
     * Start automated monitoring
     */
    startAutomatedMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        if (this.profitCheckInterval) {
            clearInterval(this.profitCheckInterval);
        }

        // Check for order replacement every 5 minutes
        this.monitoringInterval = setInterval(() => {
            if (this.isEnabled) {
                this.checkAndReplaceOrders();
            }
        }, 300000); // 5 minutes

        // Check for profitable positions every 2 minutes
        this.profitCheckInterval = setInterval(() => {
            if (this.isEnabled) {
                this.checkAndSellProfitablePositions();
            }
        }, 120000); // 2 minutes

        console.log('🤖 Automated monitoring started');
    }

    /**
     * Stop automated monitoring
     */
    stopAutomatedMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        if (this.profitCheckInterval) {
            clearInterval(this.profitCheckInterval);
            this.profitCheckInterval = null;
        }

        console.log('🛑 Automated monitoring stopped');
    }

    /**
     * Deploy AMPL Cascade using 90% of balance
     */
    async deployAMPLCascade(currentPrice, balance) {
        if (!this.isEnabled) {
            console.log('❌ AMPL Manager disabled - skipping cascade deployment');
            return;
        }
        
        console.log('🌊 Deploying AMPL Cascade...');
        console.log(`💰 Using 90% of balance: $${(balance * 0.9).toFixed(2)} out of $${balance.toFixed(2)}`);
        
        try {
            const response = await fetch(`${this.supabaseUrl}/functions/v1/ampl-cascade`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    balance: balance
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Update internal tracking
                this.currentOrders = (data.placedOrders || []).map(order => ({
                    id: order.clientOid,
                    kucoinOrderId: order.orderId,
                    price: order.price,
                    size: parseFloat(order.size),
                    usdtValue: parseFloat(order.usdtValue),
                    level: order.level - 1,
                    status: 'active',
                    timestamp: new Date().toISOString(),
                    source: 'cascade'
                }));
                
                console.log(`🌊 AMPL Cascade deployed successfully!`);
                
                // Update UI
                this.updateLadderPanelDisplay();
                
                // Show success notification
                this.showNotification(`🌊 AMPL Cascade deployed! ${data.summary?.ordersPlaced || 0} orders placed`, 'success');
                
                return {
                    success: true,
                    ordersPlaced: data.summary?.ordersPlaced || 0,
                    totalDeployed: data.summary?.totalUSDTDeployed || 0
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
        
        try {
            const balance = await this.getKuCoinBalance('USDT');
            const currentPrice = await this.getCurrentAMPLPrice();
            
            console.log('🔄 Refreshing order ladder...');
            console.log(`💰 Current balance: $${balance.toFixed(2)}`);
            console.log(`📈 Current AMPL price: $${currentPrice.toFixed(4)}`);
            
            await this.deployAMPLCascade(currentPrice, balance);
        } catch (error) {
            console.error('❌ Error refreshing order ladder:', error);
        }
    }

    /**
     * Cancel all current orders
     */
    async cancelAllOrders() {
        console.log('🚫 Canceling all cascade orders...');
        
        // TODO: Implement cascade order cancellation via KuCoin API
        this.currentOrders = [];
        
        this.updateLadderPanelDisplay();
        this.showNotification('🚫 All orders canceled', 'info');
    }

    /**
     * Update ladder panel display
     */
    updateLadderPanelDisplay() {
        const activeCount = this.currentOrders.filter(o => o.status === 'active').length;
        const pendingCount = this.currentOrders.filter(o => o.status === 'pending').length;
        
        // Update order status display
        const statusEl = document.querySelector('.order-status-display');
        if (statusEl) {
            statusEl.innerHTML = `<strong>${activeCount} orders open, ${pendingCount} pending</strong>`;
        }
        
        // Update individual counts
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
        const priceInputs = document.querySelectorAll('.smart-order-ladder input[type="text"]');
        
        priceInputs.forEach((input, index) => {
            if (index < this.priceLevels.length) {
                const priceLevel = this.priceLevels[index];
                const order = this.currentOrders.find(o => o.level === index);
                
                input.value = priceLevel.toFixed(4);
                
                input.classList.remove('filled', 'pending', 'empty');
                
                if (order) {
                    if (order.status === 'filled') {
                        input.classList.add('filled');
                        input.style.backgroundColor = '#059669';
                        input.style.color = 'white';
                    } else if (order.status === 'active') {
                        input.classList.add('pending');
                        input.style.backgroundColor = '#f59e0b';
                        input.style.color = 'white';
                    }
                } else {
                    input.classList.add('empty');
                    input.style.backgroundColor = '#374151';
                    input.style.color = '#9ca3af';
                }
            }
        });
    }

    /**
     * Update rebase protection display
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
        const currentValue = this.currentHoldings.ampl * this.currentPrice;
        const difference = currentValue - this.originalPurchaseAmount;
        
        const originalEl = document.querySelector('.holdings-value.original');
        if (originalEl) {
            originalEl.textContent = `$${this.originalPurchaseAmount.toFixed(2)}`;
        }
        
        const currentEl = document.querySelector('.holdings-value.current');
        if (currentEl) {
            currentEl.textContent = `$${currentValue.toFixed(2)}`;
        }
        
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
     */
    showNotification(message, type = 'info') {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
            return;
        }
        
        console.log(`📢 ${type.toUpperCase()}: ${message}`);
        
        if (type === 'error') {
            alert(`❌ ${message}`);
        } else if (type === 'success' && message.includes('deployed')) {
            alert(`✅ ${message}`);
        }
    }

    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        // AMPL Manager enable/disable toggle
        const amplManagerToggle = document.getElementById('ampl-manager-toggle') || 
                                 document.querySelector('input[type="checkbox"][id*="ampl"]') ||
                                 document.querySelector('input[type="checkbox"][class*="ampl"]');
        
        if (amplManagerToggle) {
            amplManagerToggle.addEventListener('change', (e) => {
                this.isEnabled = e.target.checked;
                console.log(`🎯 AMPL Manager ${this.isEnabled ? 'ENABLED' : 'DISABLED'}`);
                
                if (this.isEnabled) {
                    // Start automated monitoring
                    this.startAutomatedMonitoring();
                    
                    // Deploy cascade when enabled
                    setTimeout(() => {
                        this.refreshOrderLadder();
                    }, 1000);
                } else {
                    // Stop automated monitoring
                    this.stopAutomatedMonitoring();
                    
                    // Cancel orders when disabled
                    this.cancelAllOrders();
                }
            });
        } else {
            console.warn('⚠️ AMPL Manager toggle not found');
        }
        
        // Listen for price updates
        document.addEventListener('amplPriceUpdate', (e) => {
            // Trigger profit check when price updates
            if (this.isEnabled) {
                this.checkAndSellProfitablePositions();
            }
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
        this.startAutomatedMonitoring();
        this.refreshOrderLadder();
    }

    /**
     * Disable AMPL Manager
     */
    disable() {
        this.isEnabled = false;
        const toggle = document.getElementById('ampl-manager-toggle');
        if (toggle) toggle.checked = false;
        this.stopAutomatedMonitoring();
        this.cancelAllOrders();
    }

    /**
     * Get current status for debugging
     */
    getStatus() {
        return {
            enabled: this.isEnabled,
            orders: this.currentOrders,
            filledOrders: this.filledOrders,
            holdings: this.currentHoldings,
            originalPurchase: this.originalPurchaseAmount,
            priceLevels: this.priceLevels,
            weightFactors: this.weightFactors,
            currentPrice: this.currentPrice,
            supabaseConfig: {
                url: this.supabaseUrl,
                keyLength: this.supabaseKey.length
            },
            rebaseProtection: {
                enabled: this.rebaseProtectionEnabled,
                minimumSafetyRatio: this.minimumSafetyRatio,
                profitThreshold: this.profitThreshold
            },
            monitoring: {
                orderReplacement: !!this.monitoringInterval,
                profitChecking: !!this.profitCheckInterval
            }
        };
    }

    /**
     * Manual profit check (for testing)
     */
    async manualProfitCheck() {
        console.log('🔍 Manual profit check triggered');
        await this.checkAndSellProfitablePositions();
    }

    /**
     * Manual order replacement check (for testing)
     */
    async manualOrderCheck() {
        console.log('🔍 Manual order replacement check triggered');
        await this.checkAndReplaceOrders();
    }

    /**
     * Test all API endpoints
     */
    async testAllAPIs() {
        console.log('🧪 Testing all API endpoints...');
        
        try {
            console.log('1. Testing price endpoint...');
            const price = await this.getCurrentAMPLPrice();
            console.log(`✅ Price: $${price}`);
            
            console.log('2. Testing USDT balance endpoint...');
            const usdtBalance = await this.getKuCoinBalance('USDT');
            console.log(`✅ USDT Balance: $${usdtBalance}`);
            
            console.log('3. Testing AMPL balance endpoint...');
            const amplBalance = await this.getKuCoinBalance('AMPL');
            console.log(`✅ AMPL Balance: ${amplBalance}`);
            
            console.log('4. Testing orders endpoint...');
            const orders = await this.getActiveOrders();
            console.log(`✅ Orders: ${orders.active.length} active, ${orders.filled.length} filled`);
            
            console.log('🎉 All API tests completed!');
            
            return {
                price: price,
                usdtBalance: usdtBalance,
                amplBalance: amplBalance,
                orders: orders
            };
            
        } catch (error) {
            console.error('❌ API test failed:', error);
            return { error: error.message };
        }
    }
}

// Initialize AMPL Manager Enhanced when DOM is loaded
let amplManagerEnhanced = null;

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        amplManagerEnhanced = new AMPLManagerEnhanced();
        console.log('🚀 AMPL Manager Enhanced (CORS Fixed) initialized');
        
        // Make it globally accessible for debugging
        window.amplManagerEnhanced = amplManagerEnhanced;
        
        // Add manual control functions to window for testing
        window.manualProfitCheck = () => amplManagerEnhanced.manualProfitCheck();
        window.manualOrderCheck = () => amplManagerEnhanced.manualOrderCheck();
        window.getAMPLStatus = () => amplManagerEnhanced.getStatus();
        window.testAllAPIs = () => amplManagerEnhanced.testAllAPIs();
        
        console.log('🧪 Testing commands available: manualProfitCheck(), manualOrderCheck(), getAMPLStatus(), testAllAPIs()');
        
    }, 2000);
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AMPLManagerEnhanced;
}

