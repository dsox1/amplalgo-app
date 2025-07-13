/**
 * AMPL Rebalancing System with Automatic $1.16 Trigger
 * Features: 1) Automatic equal accumulation when AMPL < $1.16, 2) Live data integration, 3) Persistence fixes
 */

// Enhanced Rebalancing System with Automatic Trigger Logic
class AMPLRebalancingSystem {
    constructor() {
        this.isInitialized = false;
        this.originalContent = null;
        this.isExpanded = false;
        this.updateInterval = null;
        this.retryCount = 0;
        this.maxRetries = 10;
        
        // Supabase configuration
        this.SUPABASE_URL = 'https://fbkcdirkshubectuvxzi.supabase.co';
        this.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia2NkaXJrc2h1YmVjdHV2eHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NDc0ODAsImV4cCI6MjA2MjAyMzQ4MH0.yhy1JL-V9zQVK1iIdSVK1261qD8gmHmo2vB-qe7Kit8';
        
        // AMPL Trigger Configuration
        this.AMPL_TRIGGER_PRICE = 1.16; // When AMPL falls below this, trigger equal accumulation
        this.lastAMPLPrice = null;
        this.triggerActive = false;
        this.rebalanceInProgress = false;
        
        // Portfolio data
        this.portfolioData = {
            SOL: {
                quantity: 0,
                purchasePrice: 0,
                currentPrice: 0,
                value: 0,
                profit: 0,
                status: '💤',
                targetAllocation: 0.25 // 25% each for equal allocation
            },
            SUI: {
                quantity: 0,
                purchasePrice: 0,
                currentPrice: 0,
                value: 0,
                profit: 0,
                status: '💤',
                targetAllocation: 0.25
            },
            BTC: {
                quantity: 0,
                purchasePrice: 0,
                currentPrice: 0,
                value: 0,
                profit: 0,
                status: '💤',
                targetAllocation: 0.25
            },
            AMPL: {
                quantity: 0,
                purchasePrice: 0,
                currentPrice: 0,
                value: 0,
                profit: 0,
                status: '💤',
                targetAllocation: 0.25
            }
        };
        
        this.settings = {
            profitThreshold: 1.5,
            exchange: 'KuCoin',
            autoRebalanceEnabled: true,
            rebalanceAmount: 1000 // USD amount to use for equal accumulation
        };
        
        this.actionLog = [
            'System initialized - monitoring AMPL trigger price...',
            `Trigger price set to $${this.AMPL_TRIGGER_PRICE}`,
            'Waiting for AMPL price data...'
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
        console.log('🎬 Initializing AMPL Rebalancing System with $1.16 Trigger...');
        
        // Load persistent settings
        this.loadPersistentSettings();
        
        // Try to find and replace the Limit Orders panel
        this.findAndReplacePanel();
        
        console.log('✅ AMPL Rebalancing System with Trigger initialization started');
    }

    findAndReplacePanel() {
        // Enhanced detection methods (same as before)
        const detectionMethods = [
            () => document.querySelector('.ladder-section.limit-orders-section .section-content'),
            () => {
                const limitOrdersSection = document.querySelector('.ladder-section.limit-orders-section');
                return limitOrdersSection ? limitOrdersSection.querySelector('.section-content') : null;
            },
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
            () => {
                const integratedPanel = document.querySelector('.integrated-ladder-panel');
                if (integratedPanel && integratedPanel.style.display !== 'none') {
                    return integratedPanel.querySelector('.ladder-section.limit-orders-section .section-content');
                }
                return null;
            },
            () => {
                const showLadderCheckbox = document.querySelector('#show-ladder-panel');
                if (showLadderCheckbox && !showLadderCheckbox.checked) {
                    console.log('📋 Enabling ladder panel for rebalancing system...');
                    showLadderCheckbox.checked = true;
                    showLadderCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
                    
                    setTimeout(() => {
                        const panel = document.querySelector('.ladder-section.limit-orders-section .section-content');
                        if (panel) {
                            this.replaceContent(panel);
                        }
                    }, 1000);
                    return null;
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

        this.originalContent = targetElement.innerHTML;
        targetElement.innerHTML = this.createRebalancingHTML();
        this.addEventListeners(targetElement);
        this.startRealLiveDataUpdates();
        
        this.isInitialized = true;
        console.log('✅ AMPL Rebalancing System with Trigger replaced Limit Orders panel successfully');
    }

    async startRealLiveDataUpdates() {
        console.log('🔄 Starting REAL live data updates with AMPL trigger monitoring...');
        
        await this.loadExistingPositions();
        await this.updateLiveData();
        
        // Update every 30 seconds with trigger monitoring
        this.updateInterval = setInterval(() => {
            this.updateLiveData();
        }, 30000);
        
        this.addToActionLog('REAL live data monitoring with AMPL trigger started');
    }

    async loadExistingPositions() {
        try {
            console.log('📊 Loading existing positions from KuCoin...');
            
            const balanceResponse = await fetch(`${this.SUPABASE_URL}/functions/v1/ampl-manager/balance`, {
                headers: {
                    'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (balanceResponse.ok) {
                const balanceData = await balanceResponse.json();
                console.log('✅ Balance data received:', balanceData);
                
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
            
            const prices = await this.fetchRealPrices();
            
            if (prices && Object.keys(prices).length > 0) {
                // Update portfolio with real prices
                Object.keys(this.portfolioData).forEach(symbol => {
                    if (prices[symbol]) {
                        this.portfolioData[symbol].currentPrice = prices[symbol];
                        this.portfolioData[symbol].value = this.portfolioData[symbol].quantity * prices[symbol];
                        this.portfolioData[symbol].profit = this.portfolioData[symbol].value - (this.portfolioData[symbol].quantity * this.portfolioData[symbol].purchasePrice);
                        
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
                
                // CHECK AMPL TRIGGER PRICE
                if (prices.AMPL) {
                    await this.checkAMPLTrigger(prices.AMPL);
                }
                
                this.updateDisplay();
                this.addToActionLog(`LIVE prices updated: ${Object.keys(prices).join(', ')}`);
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

    async checkAMPLTrigger(currentAMPLPrice) {
        // Store previous price for comparison
        const previousPrice = this.lastAMPLPrice;
        this.lastAMPLPrice = currentAMPLPrice;
        
        console.log(`🔍 AMPL Price Check: Current $${currentAMPLPrice.toFixed(4)}, Trigger $${this.AMPL_TRIGGER_PRICE}`);
        
        // Check if AMPL price has fallen below trigger price
        if (currentAMPLPrice < this.AMPL_TRIGGER_PRICE && !this.rebalanceInProgress) {
            // Check if this is a new trigger (price was above trigger before)
            const isNewTrigger = previousPrice === null || previousPrice >= this.AMPL_TRIGGER_PRICE;
            
            if (isNewTrigger && this.settings.autoRebalanceEnabled) {
                console.log(`🚨 AMPL TRIGGER ACTIVATED: Price $${currentAMPLPrice.toFixed(4)} < $${this.AMPL_TRIGGER_PRICE}`);
                this.addToActionLog(`🚨 AMPL TRIGGER: $${currentAMPLPrice.toFixed(4)} < $${this.AMPL_TRIGGER_PRICE}`);
                
                // Set trigger status
                this.triggerActive = true;
                this.portfolioData.AMPL.status = '🚨';
                
                // Execute equal accumulation
                await this.executeEqualAccumulation(currentAMPLPrice);
            } else if (this.triggerActive) {
                // Trigger is still active
                this.portfolioData.AMPL.status = '🚨';
                this.addToActionLog(`🚨 AMPL below trigger: $${currentAMPLPrice.toFixed(4)}`);
            }
        } else if (currentAMPLPrice >= this.AMPL_TRIGGER_PRICE && this.triggerActive) {
            // AMPL price has recovered above trigger
            console.log(`✅ AMPL TRIGGER DEACTIVATED: Price $${currentAMPLPrice.toFixed(4)} >= $${this.AMPL_TRIGGER_PRICE}`);
            this.addToActionLog(`✅ AMPL recovered above $${this.AMPL_TRIGGER_PRICE}`);
            this.triggerActive = false;
            
            // Reset AMPL status based on normal profit logic
            if (this.portfolioData.AMPL.quantity > 0) {
                const profitPercentage = this.portfolioData.AMPL.purchasePrice > 0 ? 
                    ((this.portfolioData.AMPL.profit / (this.portfolioData.AMPL.quantity * this.portfolioData.AMPL.purchasePrice)) * 100) : 0;
                
                if (profitPercentage >= this.settings.profitThreshold) {
                    this.portfolioData.AMPL.status = '🎯';
                } else if (profitPercentage > 0) {
                    this.portfolioData.AMPL.status = '📈';
                } else {
                    this.portfolioData.AMPL.status = '📊';
                }
            } else {
                this.portfolioData.AMPL.status = '💤';
            }
        }
    }

    async executeEqualAccumulation(amplPrice) {
        if (this.rebalanceInProgress) {
            console.log('⚠️ Rebalance already in progress, skipping...');
            return;
        }
        
        this.rebalanceInProgress = true;
        this.addToActionLog('🔄 Starting equal accumulation rebalance...');
        
        try {
            console.log(`🔄 Executing equal accumulation with $${this.settings.rebalanceAmount} at AMPL price $${amplPrice.toFixed(4)}`);
            
            // Calculate equal allocation for each coin
            const allocationPerCoin = this.settings.rebalanceAmount / 4; // $250 each if $1000 total
            
            // Get current prices for all coins
            const prices = await this.fetchRealPrices();
            
            if (!prices || Object.keys(prices).length < 4) {
                throw new Error('Could not fetch current prices for all coins');
            }
            
            // Calculate quantities to buy for each coin
            const buyOrders = {};
            Object.keys(this.portfolioData).forEach(symbol => {
                if (prices[symbol]) {
                    const quantityToBuy = allocationPerCoin / prices[symbol];
                    buyOrders[symbol] = {
                        quantity: quantityToBuy,
                        price: prices[symbol],
                        value: allocationPerCoin
                    };
                }
            });
            
            console.log('📊 Calculated buy orders:', buyOrders);
            this.addToActionLog(`📊 Equal allocation: $${allocationPerCoin.toFixed(2)} per coin`);
            
            // Execute buy orders via Supabase function
            for (const [symbol, order] of Object.entries(buyOrders)) {
                try {
                    await this.executeBuyOrder(symbol, order);
                    this.addToActionLog(`✅ Bought ${order.quantity.toFixed(4)} ${symbol} at $${order.price.toFixed(4)}`);
                } catch (error) {
                    console.error(`❌ Failed to buy ${symbol}:`, error);
                    this.addToActionLog(`❌ Failed to buy ${symbol}: ${error.message}`);
                }
            }
            
            this.addToActionLog('✅ Equal accumulation rebalance completed');
            
        } catch (error) {
            console.error('❌ Error during equal accumulation:', error);
            this.addToActionLog(`❌ Rebalance error: ${error.message}`);
        } finally {
            this.rebalanceInProgress = false;
        }
    }

    async executeBuyOrder(symbol, order) {
        try {
            console.log(`🛒 Placing buy order for ${symbol}:`, order);
            
            // Call Supabase function to place order
            const response = await fetch(`${this.SUPABASE_URL}/functions/v1/ampl-manager/place-order`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    symbol: `${symbol}-USDT`,
                    side: 'buy',
                    type: 'market', // Use market orders for immediate execution
                    size: order.quantity.toFixed(4),
                    clientOid: `rebalance-${symbol}-${Date.now()}`
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log(`✅ Buy order placed for ${symbol}:`, result);
                
                // Update portfolio data with new purchase
                this.portfolioData[symbol].quantity += order.quantity;
                this.portfolioData[symbol].purchasePrice = order.price;
                this.portfolioData[symbol].status = '📊';
                
                return result;
            } else {
                const error = await response.text();
                throw new Error(`Order placement failed: ${error}`);
            }
        } catch (error) {
            console.error(`❌ Error placing buy order for ${symbol}:`, error);
            throw error;
        }
    }

    async fetchRealPrices() {
        const prices = {};
        
        try {
            // Get AMPL price from Supabase
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
        
        // Get other coin prices from CoinGecko
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
        
        // Binance backup
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
            this.addToActionLog(`🎯 PROFIT OPPORTUNITY: ${symbol} at ${profitPercentage.toFixed(1)}% profit`);
            console.log(`🎯 PROFIT OPPORTUNITY: ${symbol} at ${profitPercentage.toFixed(1)}% profit`);
        }
    }

    updateLiveStatusIndicator(isLive) {
        const statusIndicator = document.querySelector('.live-status-indicator');
        if (statusIndicator) {
            if (isLive) {
                const triggerStatus = this.triggerActive ? ' 🚨 TRIGGER ACTIVE' : '';
                statusIndicator.innerHTML = `<span style="color: #4CAF50;">🟢 LIVE${triggerStatus}</span>`;
                statusIndicator.style.background = this.triggerActive ? 'rgba(255, 152, 0, 0.2)' : 'rgba(76, 175, 80, 0.2)';
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

                <!-- AMPL Trigger Status -->
                <div class="trigger-status" style="
                    background: ${this.triggerActive ? 'rgba(255, 152, 0, 0.1)' : 'rgba(76, 175, 80, 0.1)'};
                    border: 1px solid ${this.triggerActive ? 'rgba(255, 152, 0, 0.3)' : 'rgba(76, 175, 80, 0.3)'};
                    border-radius: 4px;
                    padding: 4px 8px;
                    margin-bottom: 8px;
                    font-size: 9px;
                    text-align: center;
                ">
                    <div style="color: ${this.triggerActive ? '#FF9800' : '#4CAF50'};">
                        ${this.triggerActive ? '🚨 AMPL TRIGGER ACTIVE' : '✅ AMPL TRIGGER MONITORING'}
                    </div>
                    <div style="color: #888; font-size: 8px;">
                        Trigger: $${this.AMPL_TRIGGER_PRICE} | Current: $${this.lastAMPLPrice ? this.lastAMPLPrice.toFixed(4) : '---'}
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
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 6px;">
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
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                        <div>
                            <label style="color: #888; font-size: 8px;">Auto Rebalance:</label>
                            <input type="checkbox" class="auto-rebalance-checkbox" ${this.settings.autoRebalanceEnabled ? 'checked' : ''} style="margin-left: 4px;">
                        </div>
                        <div>
                            <label style="color: #888; font-size: 8px;">Rebalance Amount:</label>
                            <input type="number" class="rebalance-amount-input" value="${this.settings.rebalanceAmount}" style="
                                width: 60px;
                                background: rgba(0, 0, 0, 0.8);
                                border: 1px solid rgba(76, 175, 80, 0.4);
                                color: #ffffff;
                                padding: 1px 2px;
                                border-radius: 3px;
                                font-size: 8px;
                            ">
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

        // Settings controls
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

        const autoRebalanceCheckbox = container.querySelector('.auto-rebalance-checkbox');
        if (autoRebalanceCheckbox) {
            autoRebalanceCheckbox.addEventListener('change', (e) => {
                this.settings.autoRebalanceEnabled = e.target.checked;
                this.savePersistentSettings();
                this.addToActionLog(`Auto rebalance ${e.target.checked ? 'enabled' : 'disabled'}`);
            });
        }

        const rebalanceAmountInput = container.querySelector('.rebalance-amount-input');
        if (rebalanceAmountInput) {
            rebalanceAmountInput.addEventListener('change', (e) => {
                this.settings.rebalanceAmount = parseFloat(e.target.value);
                this.savePersistentSettings();
                this.addToActionLog(`Rebalance amount set to $${e.target.value}`);
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
                <h2 style="color: #4CAF50; margin: 0; font-size: 18px;">🔄 AMPL Rebalancing System</h2>
                <p style="color: ${this.isLiveDataActive ? '#4CAF50' : '#ff4444'}; margin: 4px 0; font-size: 12px; background: rgba(${this.isLiveDataActive ? '76, 175, 80' : '255, 68, 68'}, 0.2); padding: 4px 8px; border-radius: 4px; display: inline-block;">
                    ${this.isLiveDataActive ? '🟢 LIVE DATA ACTIVE' : '🔴 SIMULATED DATA'} | Trigger: $${this.AMPL_TRIGGER_PRICE}
                </p>
                <p style="color: ${this.triggerActive ? '#FF9800' : '#4CAF50'}; margin: 4px 0; font-size: 11px;">
                    ${this.triggerActive ? '🚨 AMPL TRIGGER ACTIVE' : '✅ MONITORING AMPL PRICE'}
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
        
        // Update trigger status
        const triggerStatus = document.querySelector('.trigger-status');
        if (triggerStatus) {
            triggerStatus.innerHTML = `
                <div style="color: ${this.triggerActive ? '#FF9800' : '#4CAF50'};">
                    ${this.triggerActive ? '🚨 AMPL TRIGGER ACTIVE' : '✅ AMPL TRIGGER MONITORING'}
                </div>
                <div style="color: #888; font-size: 8px;">
                    Trigger: $${this.AMPL_TRIGGER_PRICE} | Current: $${this.lastAMPLPrice ? this.lastAMPLPrice.toFixed(4) : '---'}
                </div>
            `;
            triggerStatus.style.background = this.triggerActive ? 'rgba(255, 152, 0, 0.1)' : 'rgba(76, 175, 80, 0.1)';
            triggerStatus.style.borderColor = this.triggerActive ? 'rgba(255, 152, 0, 0.3)' : 'rgba(76, 175, 80, 0.3)';
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
            this.actionLog.shift();
        }
    }

    loadPersistentSettings() {
        try {
            const savedProfitThreshold = localStorage.getItem('amplRebalancingProfitThreshold');
            const savedExchange = localStorage.getItem('amplRebalancingExchange');
            const savedAutoRebalance = localStorage.getItem('amplRebalancingAutoEnabled');
            const savedRebalanceAmount = localStorage.getItem('amplRebalancingAmount');
            
            if (savedProfitThreshold) {
                this.settings.profitThreshold = parseFloat(savedProfitThreshold);
            }
            if (savedExchange) {
                this.settings.exchange = savedExchange;
            }
            if (savedAutoRebalance !== null) {
                this.settings.autoRebalanceEnabled = savedAutoRebalance === 'true';
            }
            if (savedRebalanceAmount) {
                this.settings.rebalanceAmount = parseFloat(savedRebalanceAmount);
            }
            
            console.log('✅ Loaded persistent settings:', this.settings);
        } catch (error) {
            console.log('⚠️ Error loading persistent settings:', error.message);
        }
    }

    savePersistentSettings() {
        try {
            localStorage.setItem('amplRebalancingProfitThreshold', this.settings.profitThreshold.toString());
            localStorage.setItem('amplRebalancingExchange', this.settings.exchange);
            localStorage.setItem('amplRebalancingAutoEnabled', this.settings.autoRebalanceEnabled.toString());
            localStorage.setItem('amplRebalancingAmount', this.settings.rebalanceAmount.toString());
            console.log('💾 Settings saved:', this.settings);
        } catch (error) {
            console.log('⚠️ Error saving persistent settings:', error.message);
        }
    }
}

// Initialize the enhanced rebalancing system
const amplRebalancingSystemWithTrigger = new AMPLRebalancingSystemWithTrigger();

console.log('🎬 AMPL Rebalancing System with $1.16 Trigger loaded successfully');

