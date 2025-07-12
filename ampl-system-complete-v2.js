/**
 * AMPL System Complete v2 - NEW FILE
 * Fixes: 1) AMPL Manager persistence, 2) Exclusive sell price target selection, 3) Live data integration
 * Updated: 1.5% profit threshold (fits better with 5%, 10%, 15% choices)
 */

// Fix 1: AMPL Manager Persistence (Corrected)
class AMPLManagerPersistenceComplete {
    constructor() {
        this.initializeDelay = 2000; // Longer delay to ensure DOM is fully loaded
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.initialize(), this.initializeDelay);
            });
        } else {
            setTimeout(() => this.initialize(), this.initializeDelay);
        }
    }

    initialize() {
        console.log('🎬 Initializing AMPL Manager Persistence (Complete Fix)...');
        
        // Load and watch AMPL Manager
        this.setupAMPLManagerPersistence();
        
        // Load and watch Sell Price Targets with exclusive selection
        this.setupSellPriceTargetsPersistence();
        
        console.log('✅ AMPL Manager Persistence (Complete Fix) initialized');
    }

    setupAMPLManagerPersistence() {
        const findAndSetupAMPLManager = () => {
            // Try multiple ways to find AMPL Manager checkbox
            const amplManagerCheckbox = document.querySelector('#ampl-manager') || 
                                      document.querySelector('input[type="checkbox"][id*="ampl"]') ||
                                      document.querySelector('.ampl-manager input[type="checkbox"]');
            
            if (amplManagerCheckbox) {
                console.log('✅ Found AMPL Manager checkbox:', amplManagerCheckbox.id || amplManagerCheckbox.className);
                
                // Load saved state
                const savedState = localStorage.getItem('amplManagerEnabled');
                if (savedState !== null) {
                    const isEnabled = savedState === 'true';
                    amplManagerCheckbox.checked = isEnabled;
                    console.log(`✅ Restored AMPL Manager state: ${isEnabled}`);
                    
                    // Trigger change event
                    amplManagerCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
                }
                
                // Watch for changes
                amplManagerCheckbox.addEventListener('change', () => {
                    const isEnabled = amplManagerCheckbox.checked;
                    localStorage.setItem('amplManagerEnabled', isEnabled.toString());
                    console.log(`💾 Saved AMPL Manager state: ${isEnabled}`);
                });
                
                return true;
            }
            return false;
        };

        // Try immediately, then retry if not found
        if (!findAndSetupAMPLManager()) {
            console.log('⚠️ AMPL Manager checkbox not found, retrying...');
            setTimeout(() => {
                if (!findAndSetupAMPLManager()) {
                    console.log('❌ AMPL Manager checkbox still not found after retry');
                }
            }, 3000);
        }
    }

    setupSellPriceTargetsPersistence() {
        const findAndSetupSellTargets = () => {
            const thresholdButtons = document.querySelectorAll('.threshold-btn');
            const currentThresholdDisplay = document.getElementById('current-threshold');
            
            if (thresholdButtons.length > 0) {
                console.log(`✅ Found ${thresholdButtons.length} threshold buttons`);
                
                // Load saved state - ONLY ONE SHOULD BE ACTIVE
                const savedTarget = localStorage.getItem('amplCurrentActiveTarget');
                
                if (savedTarget) {
                    // Clear all active states first
                    thresholdButtons.forEach(btn => btn.classList.remove('active'));
                    
                    // Set only the saved target as active
                    thresholdButtons.forEach(button => {
                        const buttonValue = parseFloat(button.getAttribute('data-value'));
                        if (buttonValue.toString() === savedTarget) {
                            button.classList.add('active');
                            console.log(`✅ Restored EXCLUSIVE target: ${savedTarget}`);
                        }
                    });
                    
                    // Update display
                    if (currentThresholdDisplay) {
                        currentThresholdDisplay.textContent = parseFloat(savedTarget).toFixed(2);
                    }
                }
                
                // Watch for changes - EXCLUSIVE SELECTION
                thresholdButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        const buttonValue = parseFloat(button.getAttribute('data-value'));
                        
                        // EXCLUSIVE SELECTION: Remove active from all others
                        thresholdButtons.forEach(btn => btn.classList.remove('active'));
                        
                        // Add active to clicked button
                        button.classList.add('active');
                        
                        // Save ONLY the active target
                        localStorage.setItem('amplCurrentActiveTarget', buttonValue.toString());
                        console.log(`💾 Saved EXCLUSIVE target: ${buttonValue}`);
                        
                        // Update display
                        if (currentThresholdDisplay) {
                            currentThresholdDisplay.textContent = buttonValue.toFixed(2);
                        }
                    });
                });
                
                return true;
            }
            return false;
        };

        // Try immediately, then retry if not found
        if (!findAndSetupSellTargets()) {
            console.log('⚠️ Threshold buttons not found, retrying...');
            setTimeout(() => {
                if (!findAndSetupSellTargets()) {
                    console.log('❌ Threshold buttons still not found after retry');
                }
            }, 3000);
        }
    }
}

// Fix 2: Rebalancing System with REAL Live Data Integration (1.5% threshold)
class AMPLRebalancingSystemComplete {
    constructor() {
        this.isInitialized = false;
        this.originalContent = null;
        this.isExpanded = false;
        this.updateInterval = null;
        this.retryCount = 0;
        this.maxRetries = 10;
        
        // Supabase configuration (from script.js)
        this.SUPABASE_URL = 'https://fbkcdirkshubectuvxzi.supabase.co';
        this.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia2NkaXJrc2h1YmVjdHV2eHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NDc0ODAsImV4cCI6MjA2MjAyMzQ4MH0.yhy1JL-V9zQVK1iIdSVK1261qD8gmHmo2vB-qe7Kit8';
        
        // Portfolio data - START WITH REAL POSITIONS (if available)
        this.portfolioData = {
            SOL: {
                quantity: 0,
                purchasePrice: 0,
                currentPrice: 0,
                value: 0,
                profit: 0,
                status: '💤'
            },
            SUI: {
                quantity: 0,
                purchasePrice: 0,
                currentPrice: 0,
                value: 0,
                profit: 0,
                status: '💤'
            },
            BTC: {
                quantity: 0,
                purchasePrice: 0,
                currentPrice: 0,
                value: 0,
                profit: 0,
                status: '💤'
            },
            AMPL: {
                quantity: 0,
                purchasePrice: 0,
                currentPrice: 0,
                value: 0,
                profit: 0,
                status: '💤'
            }
        };
        
        this.settings = {
            profitThreshold: 1.5, // 1.5% - fits better with 5%, 10%, 15% choices
            exchange: 'KuCoin'
        };
        
        this.actionLog = [
            'System initialized - attempting live data connection...',
            'Checking KuCoin API connectivity...',
            'Loading portfolio positions...'
        ];
        
        this.isLiveDataActive = false;
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            setTimeout(() => this.initialize(), 500);
        }
    }

    initialize() {
        console.log('🎬 Initializing AMPL Rebalancing System v2 (1.5% threshold)...');
        
        // Load persistent settings
        this.loadPersistentSettings();
        
        // Try to find and replace the Limit Orders panel
        this.findAndReplacePanel();
        
        console.log('✅ AMPL Rebalancing System v2 initialization started');
    }

    findAndReplacePanel() {
        // Enhanced detection methods
        const detectionMethods = [
            // Method 1: Direct class selector for limit orders section
            () => document.querySelector('.ladder-section.limit-orders-section .section-content'),
            
            // Method 2: Look for the specific limit orders panel structure
            () => {
                const limitOrdersSection = document.querySelector('.ladder-section.limit-orders-section');
                return limitOrdersSection ? limitOrdersSection.querySelector('.section-content') : null;
            },
            
            // Method 3: Find by section header text
            () => {
                const headers = document.querySelectorAll('.section-header');
                for (const header of headers) {
                    if (header.textContent.includes('LIMIT ORDERS')) {
                        const section = header.closest('.ladder-section');
                        return section ? section.querySelector('.section-content') : null;
                    }
                }
                return null;
            },
            
            // Method 4: Look for the integrated ladder panel structure
            () => {
                const integratedPanel = document.querySelector('.integrated-ladder-panel');
                if (integratedPanel && integratedPanel.style.display !== 'none') {
                    return integratedPanel.querySelector('.ladder-section.limit-orders-section .section-content');
                }
                return null;
            },
            
            // Method 5: Check if ladder panel needs to be enabled first
            () => {
                const showLadderCheckbox = document.querySelector('#show-ladder-panel');
                if (showLadderCheckbox && !showLadderCheckbox.checked) {
                    console.log('📋 Enabling ladder panel for rebalancing system...');
                    showLadderCheckbox.checked = true;
                    showLadderCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
                    
                    // Wait for panel to appear
                    setTimeout(() => {
                        const panel = document.querySelector('.ladder-section.limit-orders-section .section-content');
                        if (panel) {
                            this.replaceContent(panel);
                        }
                    }, 1000);
                    return null; // Will be handled by timeout
                }
                return null;
            }
        ];

        for (let i = 0; i < detectionMethods.length; i++) {
            try {
                const targetElement = detectionMethods[i]();
                if (targetElement) {
                    console.log(`✅ Found Limit Orders panel via detection method ${i + 1}`);
                    this.replaceContent(targetElement);
                    return;
                }
            } catch (error) {
                console.log(`⚠️ Detection method ${i + 1} failed:`, error.message);
            }
        }

        // If not found, retry after delay
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.log(`🔄 Retrying panel detection (${this.retryCount}/${this.maxRetries})...`);
            setTimeout(() => this.findAndReplacePanel(), 3000);
        } else {
            console.log('❌ Could not find Limit Orders panel after maximum retries');
        }
    }

    replaceContent(targetElement) {
        if (this.isInitialized) return;

        // Store original content for restoration
        this.originalContent = targetElement.innerHTML;
        
        // Replace with rebalancing system
        targetElement.innerHTML = this.createRebalancingHTML();
        
        // Add event listeners
        this.addEventListeners(targetElement);
        
        // Start REAL live data updates
        this.startRealLiveDataUpdates();
        
        this.isInitialized = true;
        console.log('✅ AMPL Rebalancing System v2 replaced Limit Orders panel successfully');
    }

    async startRealLiveDataUpdates() {
        console.log('🔄 Starting REAL live data updates...');
        
        // First, try to load existing positions from KuCoin
        await this.loadExistingPositions();
        
        // Then start live price monitoring
        await this.updateLiveData();
        
        // Update every 30 seconds
        this.updateInterval = setInterval(() => {
            this.updateLiveData();
        }, 30000);
        
        this.addToActionLog('REAL live data monitoring started');
    }

    async loadExistingPositions() {
        try {
            console.log('📊 Loading existing positions from KuCoin...');
            
            // Try to get account balance from Supabase function
            const balanceResponse = await fetch(`${this.SUPABASE_URL}/functions/v1/ampl-manager/balance`, {
                headers: {
                    'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (balanceResponse.ok) {
                const balanceData = await balanceResponse.json();
                console.log('✅ Balance data received:', balanceData);
                
                // Update portfolio with real balances
                if (balanceData.balances) {
                    Object.keys(this.portfolioData).forEach(symbol => {
                        const balance = balanceData.balances.find(b => b.currency === symbol);
                        if (balance && parseFloat(balance.balance) > 0) {
                            this.portfolioData[symbol].quantity = parseFloat(balance.balance);
                            this.portfolioData[symbol].status = '📊';
                            console.log(`✅ Found ${symbol} position: ${balance.balance}`);
                        }
                    });
                }
                
                this.addToActionLog('Loaded real positions from KuCoin');
                this.isLiveDataActive = true;
            } else {
                console.log('⚠️ Could not load positions from KuCoin');
                this.addToActionLog('Position loading failed - using simulated data');
            }
        } catch (error) {
            console.error('❌ Error loading existing positions:', error);
            this.addToActionLog('Position loading error - using simulated data');
        }
    }

    async updateLiveData() {
        try {
            console.log('📊 Fetching REAL live market data...');
            
            // Get real prices from multiple sources
            const prices = await this.fetchRealPrices();
            
            if (prices && Object.keys(prices).length > 0) {
                // Update portfolio with real prices
                Object.keys(this.portfolioData).forEach(symbol => {
                    if (prices[symbol]) {
                        this.portfolioData[symbol].currentPrice = prices[symbol];
                        this.portfolioData[symbol].value = this.portfolioData[symbol].quantity * prices[symbol];
                        this.portfolioData[symbol].profit = this.portfolioData[symbol].value - (this.portfolioData[symbol].quantity * this.portfolioData[symbol].purchasePrice);
                        
                        // Update status based on profit and positions
                        if (this.portfolioData[symbol].quantity > 0) {
                            const profitPercentage = this.portfolioData[symbol].purchasePrice > 0 ? 
                                ((this.portfolioData[symbol].profit / (this.portfolioData[symbol].quantity * this.portfolioData[symbol].purchasePrice)) * 100) : 0;
                            
                            if (profitPercentage >= this.settings.profitThreshold) {
                                this.portfolioData[symbol].status = '🎯';
                                this.checkRebalanceOpportunity(symbol, profitPercentage);
                            } else if (profitPercentage > 0) {
                                this.portfolioData[symbol].status = '📈';
                            } else {
                                this.portfolioData[symbol].status = '📊';
                            }
                        } else {
                            this.portfolioData[symbol].status = '💤';
                        }
                    }
                });
                
                // Update display
                this.updateDisplay();
                this.addToActionLog(`LIVE prices updated: ${Object.keys(prices).join(', ')}`);
                
                // Update status indicator
                this.updateLiveStatusIndicator(true);
                
                console.log('✅ REAL live data updated successfully');
            } else {
                console.log('⚠️ No live price data available');
                this.addToActionLog('Live data fetch failed - retrying...');
                this.updateLiveStatusIndicator(false);
            }
        } catch (error) {
            console.error('❌ Error updating live data:', error);
            this.addToActionLog('Live data update error - retrying...');
            this.updateLiveStatusIndicator(false);
        }
    }

    async fetchRealPrices() {
        const prices = {};
        
        try {
            // Try Supabase price function first (AMPL)
            const amplResponse = await fetch(`${this.SUPABASE_URL}/functions/v1/ampl-manager/price`, {
                headers: {
                    'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (amplResponse.ok) {
                const amplData = await amplResponse.json();
                if (amplData.price) {
                    prices.AMPL = amplData.price;
                    console.log('✅ AMPL price from Supabase:', amplData.price);
                }
            }
        } catch (error) {
            console.log('⚠️ Supabase AMPL price fetch failed:', error.message);
        }
        
        // Try CoinGecko for other coins
        try {
            const coinGeckoResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana,sui,bitcoin&vs_currencies=usd');
            if (coinGeckoResponse.ok) {
                const coinGeckoData = await coinGeckoResponse.json();
                if (coinGeckoData.solana) prices.SOL = coinGeckoData.solana.usd;
                if (coinGeckoData.sui) prices.SUI = coinGeckoData.sui.usd;
                if (coinGeckoData.bitcoin) prices.BTC = coinGeckoData.bitcoin.usd;
                console.log('✅ Prices from CoinGecko:', prices);
            }
        } catch (error) {
            console.log('⚠️ CoinGecko price fetch failed:', error.message);
        }
        
        // Try Binance as backup
        if (Object.keys(prices).length < 4) {
            try {
                const binanceSymbols = ['SOLUSDT', 'SUIUSDT', 'BTCUSDT'];
                for (const symbol of binanceSymbols) {
                    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
                    if (response.ok) {
                        const data = await response.json();
                        const coin = symbol.replace('USDT', '');
                        prices[coin] = parseFloat(data.price);
                    }
                }
                console.log('✅ Backup prices from Binance:', prices);
            } catch (error) {
                console.log('⚠️ Binance backup price fetch failed:', error.message);
            }
        }
        
        return prices;
    }

    checkRebalanceOpportunity(symbol, profitPercentage) {
        if (profitPercentage >= this.settings.profitThreshold) {
            this.addToActionLog(`🎯 REBALANCE OPPORTUNITY: ${symbol} at ${profitPercentage.toFixed(1)}% profit`);
            
            // Here you would integrate with actual trading logic
            // For now, just log the opportunity
            console.log(`🎯 REBALANCE OPPORTUNITY: ${symbol} at ${profitPercentage.toFixed(1)}% profit`);
        }
    }

    updateLiveStatusIndicator(isLive) {
        const statusIndicator = document.querySelector('.live-status-indicator');
        if (statusIndicator) {
            if (isLive) {
                statusIndicator.innerHTML = '<span style="color: #4CAF50;">🟢 LIVE</span>';
                statusIndicator.style.background = 'rgba(76, 175, 80, 0.2)';
            } else {
                statusIndicator.innerHTML = '<span style="color: #ff4444;">🔴 OFFLINE</span>';
                statusIndicator.style.background = 'rgba(255, 68, 68, 0.2)';
            }
        }
    }

    createRebalancingHTML() {
        const totalInvested = Object.values(this.portfolioData).reduce((sum, coin) => sum + (coin.quantity * coin.purchasePrice), 0);
        const currentValue = Object.values(this.portfolioData).reduce((sum, coin) => sum + coin.value, 0);
        const totalProfit = currentValue - totalInvested;
        const profitPercentage = totalInvested > 0 ? ((totalProfit / totalInvested) * 100) : 0;

        return `
            <div class="rebalancing-system" style="
                width: 100%;
                height: 100%;
                max-height: 100%;
                overflow: hidden;
                background: rgba(0, 0, 0, 0.95);
                border: 1px solid rgba(76, 175, 80, 0.3);
                border-radius: 8px;
                padding: 8px;
                box-sizing: border-box;
                position: relative;
                font-family: 'Courier New', monospace;
                color: #ffffff;
            ">
                <!-- Header -->
                <div class="rebalancing-header" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                    padding: 4px 8px;
                    background: rgba(76, 175, 80, 0.1);
                    border-radius: 4px;
                    border: 1px solid rgba(76, 175, 80, 0.3);
                ">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="color: #4CAF50; font-size: 11px; font-weight: bold;">🔄 REBALANCING SYSTEM</span>
                        <span class="live-status-indicator" style="color: #ff4444; font-size: 9px; background: rgba(255, 68, 68, 0.2); padding: 1px 4px; border-radius: 3px;">🔴 CONNECTING...</span>
                    </div>
                    <div style="display: flex; gap: 4px;">
                        <button class="expand-btn" style="
                            background: rgba(76, 175, 80, 0.2);
                            border: 1px solid rgba(76, 175, 80, 0.4);
                            color: #ffffff;
                            padding: 2px 6px;
                            border-radius: 3px;
                            font-size: 9px;
                            cursor: pointer;
                        ">📊</button>
                        <button class="settings-btn" style="
                            background: rgba(76, 175, 80, 0.2);
                            border: 1px solid rgba(76, 175, 80, 0.4);
                            color: #ffffff;
                            padding: 2px 6px;
                            border-radius: 3px;
                            font-size: 9px;
                            cursor: pointer;
                        ">⚙️</button>
                        <button class="restore-btn" style="
                            background: rgba(255, 152, 0, 0.2);
                            border: 1px solid rgba(255, 152, 0, 0.4);
                            color: #ffffff;
                            padding: 2px 6px;
                            border-radius: 3px;
                            font-size: 9px;
                            cursor: pointer;
                        ">↩️</button>
                    </div>
                </div>

                <!-- Overall Stats -->
                <div class="overall-stats" style="
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 4px;
                    margin-bottom: 8px;
                    font-size: 9px;
                ">
                    <div style="background: rgba(76, 175, 80, 0.1); padding: 3px; border-radius: 3px; text-align: center;">
                        <div style="color: #888; font-size: 8px;">INVESTED</div>
                        <div style="color: #4CAF50; font-weight: bold;">$${totalInvested.toFixed(2)}</div>
                    </div>
                    <div style="background: rgba(76, 175, 80, 0.1); padding: 3px; border-radius: 3px; text-align: center;">
                        <div style="color: #888; font-size: 8px;">VALUE</div>
                        <div style="color: #4CAF50; font-weight: bold;">$${currentValue.toFixed(2)}</div>
                    </div>
                    <div style="background: rgba(76, 175, 80, 0.1); padding: 3px; border-radius: 3px; text-align: center;">
                        <div style="color: #888; font-size: 8px;">PROFIT</div>
                        <div style="color: ${totalProfit >= 0 ? '#4CAF50' : '#f44336'}; font-weight: bold;">
                            $${totalProfit.toFixed(2)} (${profitPercentage.toFixed(1)}%)
                        </div>
                    </div>
                </div>

                <!-- Coins Grid -->
                <div class="coins-grid" style="
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 4px;
                    flex: 1;
                    min-height: 0;
                    margin-bottom: 8px;
                ">
                    ${this.createCoinCards()}
                </div>

                <!-- Settings Panel -->
                <div class="settings-panel" style="
                    display: none;
                    background: rgba(0, 0, 0, 0.9);
                    border: 1px solid rgba(76, 175, 80, 0.4);
                    border-radius: 4px;
                    padding: 6px;
                    margin-bottom: 6px;
                    font-size: 9px;
                ">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                        <div>
                            <label style="color: #888; font-size: 8px;">Profit Threshold:</label>
                            <select class="profit-threshold-select" style="
                                width: 100%;
                                background: rgba(0, 0, 0, 0.8);
                                border: 1px solid rgba(76, 175, 80, 0.4);
                                color: #ffffff;
                                padding: 2px;
                                border-radius: 3px;
                                font-size: 8px;
                            ">
                                <option value="1.5" ${this.settings.profitThreshold === 1.5 ? 'selected' : ''}>1.5%</option>
                                <option value="5" ${this.settings.profitThreshold === 5 ? 'selected' : ''}>5%</option>
                                <option value="10" ${this.settings.profitThreshold === 10 ? 'selected' : ''}>10%</option>
                                <option value="15" ${this.settings.profitThreshold === 15 ? 'selected' : ''}>15%</option>
                            </select>
                        </div>
                        <div>
                            <label style="color: #888; font-size: 8px;">Exchange:</label>
                            <select class="exchange-select" style="
                                width: 100%;
                                background: rgba(0, 0, 0, 0.8);
                                border: 1px solid rgba(76, 175, 80, 0.4);
                                color: #ffffff;
                                padding: 2px;
                                border-radius: 3px;
                                font-size: 8px;
                            ">
                                <option value="KuCoin" ${this.settings.exchange === 'KuCoin' ? 'selected' : ''}>KuCoin</option>
                                <option value="Binance" ${this.settings.exchange === 'Binance' ? 'selected' : ''}>Binance</option>
                                <option value="Both" ${this.settings.exchange === 'Both' ? 'selected' : ''}>Both</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Action Log -->
                <div class="action-log" style="
                    background: rgba(0, 0, 0, 0.8);
                    border: 1px solid rgba(76, 175, 80, 0.3);
                    border-radius: 4px;
                    padding: 4px;
                    max-height: 60px;
                    overflow-y: auto;
                    font-size: 8px;
                ">
                    <div style="color: #888; font-size: 7px; margin-bottom: 2px;">RECENT ACTIONS:</div>
                    ${this.actionLog.slice(-5).map(action => 
                        `<div style="color: #4CAF50; margin-bottom: 1px;">• ${action}</div>`
                    ).join('')}
                </div>
            </div>
        `;
    }

    createCoinCards() {
        return Object.entries(this.portfolioData).map(([symbol, data]) => `
            <div class="coin-card" style="
                background: rgba(0, 0, 0, 0.8);
                border: 1px solid rgba(76, 175, 80, 0.3);
                border-radius: 4px;
                padding: 4px;
                font-size: 8px;
                transition: all 0.3s ease;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                    <span style="color: #4CAF50; font-weight: bold; font-size: 9px;">${data.status} ${symbol}</span>
                    <span style="color: #888; font-size: 7px;">${data.quantity.toFixed(3)}</span>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2px; font-size: 7px;">
                    <div>
                        <div style="color: #666;">Purchase:</div>
                        <div style="color: #fff;">$${data.purchasePrice.toFixed(2)}</div>
                    </div>
                    <div>
                        <div style="color: #666;">Current:</div>
                        <div style="color: #fff;">$${data.currentPrice.toFixed(2)}</div>
                    </div>
                    <div>
                        <div style="color: #666;">Value:</div>
                        <div style="color: #4CAF50;">$${data.value.toFixed(2)}</div>
                    </div>
                    <div>
                        <div style="color: #666;">Profit:</div>
                        <div style="color: ${data.profit >= 0 ? '#4CAF50' : '#f44336'};">
                            $${data.profit.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    addEventListeners(container) {
        // Expand button
        const expandBtn = container.querySelector('.expand-btn');
        if (expandBtn) {
            expandBtn.addEventListener('click', () => this.toggleExpanded());
        }

        // Settings button
        const settingsBtn = container.querySelector('.settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.toggleSettings());
        }

        // Restore button
        const restoreBtn = container.querySelector('.restore-btn');
        if (restoreBtn) {
            restoreBtn.addEventListener('click', () => this.restoreOriginalContent());
        }

        // Settings selects
        const profitThresholdSelect = container.querySelector('.profit-threshold-select');
        if (profitThresholdSelect) {
            profitThresholdSelect.addEventListener('change', (e) => {
                this.settings.profitThreshold = parseFloat(e.target.value);
                this.savePersistentSettings();
                this.addToActionLog(`Profit threshold set to ${e.target.value}%`);
            });
        }

        const exchangeSelect = container.querySelector('.exchange-select');
        if (exchangeSelect) {
            exchangeSelect.addEventListener('change', (e) => {
                this.settings.exchange = e.target.value;
                this.savePersistentSettings();
                this.addToActionLog(`Exchange set to ${e.target.value}`);
            });
        }
    }

    toggleExpanded() {
        if (this.isExpanded) {
            this.closeExpandedView();
        } else {
            this.showExpandedView();
        }
    }

    showExpandedView() {
        // Create modal backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'rebalancing-modal-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(5px);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        // Create modal content (4" x 5" = 480px x 384px)
        const modal = document.createElement('div');
        modal.className = 'rebalancing-modal';
        modal.style.cssText = `
            width: 480px;
            height: 384px;
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid rgba(76, 175, 80, 0.5);
            border-radius: 12px;
            padding: 16px;
            box-sizing: border-box;
            font-family: 'Courier New', monospace;
            color: #ffffff;
            overflow-y: auto;
            box-shadow: 0 0 30px rgba(76, 175, 80, 0.3);
        `;

        modal.innerHTML = this.createExpandedHTML();
        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        // Close on backdrop click
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                this.closeExpandedView();
            }
        });

        this.isExpanded = true;
        this.addToActionLog('Expanded view opened');
    }

    closeExpandedView() {
        const backdrop = document.querySelector('.rebalancing-modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
        this.isExpanded = false;
        this.addToActionLog('Expanded view closed');
    }

    createExpandedHTML() {
        const totalInvested = Object.values(this.portfolioData).reduce((sum, coin) => sum + (coin.quantity * coin.purchasePrice), 0);
        const currentValue = Object.values(this.portfolioData).reduce((sum, coin) => sum + coin.value, 0);
        const totalProfit = currentValue - totalInvested;
        const profitPercentage = totalInvested > 0 ? ((totalProfit / totalInvested) * 100) : 0;

        return `
            <div style="text-align: center; margin-bottom: 16px;">
                <h2 style="color: #4CAF50; margin: 0; font-size: 18px;">🔄 AMPL Rebalancing System v2</h2>
                <p style="color: ${this.isLiveDataActive ? '#4CAF50' : '#ff4444'}; margin: 4px 0; font-size: 12px; background: rgba(${this.isLiveDataActive ? '76, 175, 80' : '255, 68, 68'}, 0.2); padding: 4px 8px; border-radius: 4px; display: inline-block;">
                    ${this.isLiveDataActive ? '🟢 LIVE DATA ACTIVE' : '🔴 SIMULATED DATA'} (1.5% threshold)
                </p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                <div style="background: rgba(76, 175, 80, 0.1); padding: 12px; border-radius: 6px; text-align: center; border: 1px solid rgba(76, 175, 80, 0.3);">
                    <div style="color: #888; font-size: 11px;">TOTAL INVESTED</div>
                    <div style="color: #4CAF50; font-weight: bold; font-size: 16px;">$${totalInvested.toFixed(2)}</div>
                </div>
                <div style="background: rgba(76, 175, 80, 0.1); padding: 12px; border-radius: 6px; text-align: center; border: 1px solid rgba(76, 175, 80, 0.3);">
                    <div style="color: #888; font-size: 11px;">CURRENT VALUE</div>
                    <div style="color: #4CAF50; font-weight: bold; font-size: 16px;">$${currentValue.toFixed(2)}</div>
                </div>
                <div style="background: rgba(76, 175, 80, 0.1); padding: 12px; border-radius: 6px; text-align: center; border: 1px solid rgba(76, 175, 80, 0.3);">
                    <div style="color: #888; font-size: 11px;">TOTAL PROFIT</div>
                    <div style="color: ${totalProfit >= 0 ? '#4CAF50' : '#f44336'}; font-weight: bold; font-size: 16px;">
                        $${totalProfit.toFixed(2)}<br>
                        <span style="font-size: 12px;">(${profitPercentage.toFixed(1)}%)</span>
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                ${Object.entries(this.portfolioData).map(([symbol, data]) => `
                    <div style="background: rgba(0, 0, 0, 0.8); border: 1px solid rgba(76, 175, 80, 0.3); border-radius: 6px; padding: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="color: #4CAF50; font-weight: bold; font-size: 14px;">${data.status} ${symbol}</span>
                            <span style="color: #888; font-size: 11px;">Qty: ${data.quantity.toFixed(3)}</span>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px;">
                            <div>
                                <div style="color: #666;">Purchase Price:</div>
                                <div style="color: #fff; font-weight: bold;">$${data.purchasePrice.toFixed(2)}</div>
                            </div>
                            <div>
                                <div style="color: #666;">Current Price:</div>
                                <div style="color: #fff; font-weight: bold;">$${data.currentPrice.toFixed(2)}</div>
                            </div>
                            <div>
                                <div style="color: #666;">Value:</div>
                                <div style="color: #4CAF50; font-weight: bold;">$${data.value.toFixed(2)}</div>
                            </div>
                            <div>
                                <div style="color: #666;">Profit:</div>
                                <div style="color: ${data.profit >= 0 ? '#4CAF50' : '#f44336'}; font-weight: bold;">
                                    $${data.profit.toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div style="background: rgba(0, 0, 0, 0.8); border: 1px solid rgba(76, 175, 80, 0.3); border-radius: 6px; padding: 12px;">
                <div style="color: #888; font-size: 11px; margin-bottom: 8px;">RECENT ACTIONS:</div>
                <div style="max-height: 80px; overflow-y: auto;">
                    ${this.actionLog.slice(-10).map(action => 
                        `<div style="color: #4CAF50; margin-bottom: 4px; font-size: 11px;">• ${action}</div>`
                    ).join('')}
                </div>
            </div>

            <div style="text-align: center; margin-top: 16px;">
                <button onclick="document.querySelector('.rebalancing-modal-backdrop').remove(); this.isExpanded = false;" style="
                    background: rgba(255, 152, 0, 0.2);
                    border: 1px solid rgba(255, 152, 0, 0.4);
                    color: #ffffff;
                    padding: 8px 16px;
                    border-radius: 4px;
                    font-size: 12px;
                    cursor: pointer;
                ">Close</button>
            </div>
        `;
    }

    toggleSettings() {
        const settingsPanel = document.querySelector('.settings-panel');
        if (settingsPanel) {
            settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
        }
    }

    restoreOriginalContent() {
        if (this.originalContent) {
            const targetElement = document.querySelector('.ladder-section.limit-orders-section .section-content');
            if (targetElement) {
                targetElement.innerHTML = this.originalContent;
                this.isInitialized = false;
                if (this.updateInterval) {
                    clearInterval(this.updateInterval);
                }
                console.log('✅ Original Limit Orders content restored');
            }
        }
    }

    updateDisplay() {
        const coinsGrid = document.querySelector('.coins-grid');
        if (coinsGrid) {
            coinsGrid.innerHTML = this.createCoinCards();
        }
        
        // Update overall stats
        const totalInvested = Object.values(this.portfolioData).reduce((sum, coin) => sum + (coin.quantity * coin.purchasePrice), 0);
        const currentValue = Object.values(this.portfolioData).reduce((sum, coin) => sum + coin.value, 0);
        const totalProfit = currentValue - totalInvested;
        const profitPercentage = totalInvested > 0 ? ((totalProfit / totalInvested) * 100) : 0;
        
        const overallStats = document.querySelector('.overall-stats');
        if (overallStats) {
            overallStats.innerHTML = `
                <div style="background: rgba(76, 175, 80, 0.1); padding: 3px; border-radius: 3px; text-align: center;">
                    <div style="color: #888; font-size: 8px;">INVESTED</div>
                    <div style="color: #4CAF50; font-weight: bold;">$${totalInvested.toFixed(2)}</div>
                </div>
                <div style="background: rgba(76, 175, 80, 0.1); padding: 3px; border-radius: 3px; text-align: center;">
                    <div style="color: #888; font-size: 8px;">VALUE</div>
                    <div style="color: #4CAF50; font-weight: bold;">$${currentValue.toFixed(2)}</div>
                </div>
                <div style="background: rgba(76, 175, 80, 0.1); padding: 3px; border-radius: 3px; text-align: center;">
                    <div style="color: #888; font-size: 8px;">PROFIT</div>
                    <div style="color: ${totalProfit >= 0 ? '#4CAF50' : '#f44336'}; font-weight: bold;">
                        $${totalProfit.toFixed(2)} (${profitPercentage.toFixed(1)}%)
                    </div>
                </div>
            `;
        }
        
        // Update action log
        const actionLog = document.querySelector('.action-log');
        if (actionLog) {
            const logContent = actionLog.querySelector('div:last-child');
            if (logContent) {
                logContent.innerHTML = this.actionLog.slice(-5).map(action => 
                    `<div style="color: #4CAF50; margin-bottom: 1px;">• ${action}</div>`
                ).join('');
            }
        }
    }

    addToActionLog(message) {
        const timestamp = new Date().toLocaleTimeString();
        this.actionLog.push(`${timestamp}: ${message}`);
        if (this.actionLog.length > 15) {
            this.actionLog.shift(); // Keep only last 15 messages
        }
    }

    loadPersistentSettings() {
        try {
            const savedProfitThreshold = localStorage.getItem('amplRebalancingProfitThreshold');
            const savedExchange = localStorage.getItem('amplRebalancingExchange');
            
            if (savedProfitThreshold) {
                this.settings.profitThreshold = parseFloat(savedProfitThreshold);
                console.log(`✅ Loaded profit threshold: ${this.settings.profitThreshold}%`);
            }
            
            if (savedExchange) {
                this.settings.exchange = savedExchange;
                console.log(`✅ Loaded exchange: ${this.settings.exchange}`);
            }
        } catch (error) {
            console.log('⚠️ Error loading persistent settings:', error.message);
        }
    }

    savePersistentSettings() {
        try {
            localStorage.setItem('amplRebalancingProfitThreshold', this.settings.profitThreshold.toString());
            localStorage.setItem('amplRebalancingExchange', this.settings.exchange);
            console.log('💾 Settings saved:', this.settings);
        } catch (error) {
            console.log('⚠️ Error saving persistent settings:', error.message);
        }
    }
}

// Initialize both systems
const amplManagerPersistenceComplete = new AMPLManagerPersistenceComplete();
const amplRebalancingSystemComplete = new AMPLRebalancingSystemComplete();

console.log('🎬 AMPL System Complete v2 (1.5% threshold) loaded successfully');

