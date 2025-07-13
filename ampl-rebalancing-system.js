/**
 * AMPL Rebalancing System - Simple & Clean
 * Fixed version with proper layer management and dynamic data updates
 */

class AMPLRebalancingSystem {
    constructor() {
        this.isInitialized = false;
        this.originalContent = null;
        this.updateInterval = null;
        this.retryCount = 0;
        this.maxRetries = 10;
        
        // Configuration
        this.AMPL_TRIGGER_PRICE = 1.16;
        this.UPDATE_INTERVAL = 120000; // 2 minutes
        this.TRIGGER_COOLDOWN = 600000; // 10 minutes between triggers
        
        // State tracking
        this.lastAMPLPrice = null;
        this.triggerActive = false;
        this.rebalanceInProgress = false;
        this.lastTriggerTime = 0;
        this.availableBalance = 0;
        this.expandedViewOpen = false;
        
        // Portfolio data - ZEROED by default
        this.portfolioData = {
            SOL: { quantity: 0, purchasePrice: 0, currentPrice: 0, value: 0, profit: 0, profitPercent: 0, status: '💤' },
            SUI: { quantity: 0, purchasePrice: 0, currentPrice: 0, value: 0, profit: 0, profitPercent: 0, status: '💤' },
            BTC: { quantity: 0, purchasePrice: 0, currentPrice: 0, value: 0, profit: 0, profitPercent: 0, status: '💤' },
            AMPL: { quantity: 0, purchasePrice: 0, currentPrice: 0, value: 0, profit: 0, profitPercent: 0, status: '💤' }
        };
        
        this.settings = {
            profitThreshold: 1.5,
            autoRebalanceEnabled: true
        };
        
        this.actionLog = ['System initialized'];
        this.isLiveDataActive = false;
        
        // Initialize
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            setTimeout(() => this.initialize(), 500);
        }
    }

    initialize() {
        console.log('🎬 Initializing AMPL Rebalancing System (Fixed Version)...');
        this.loadPersistentSettings();
        this.findAndReplacePanel();
    }

    findAndReplacePanel() {
        // Clear any existing instances first to prevent conflicts
        this.clearExistingInstances();
        
        const detectionMethods = [
            () => document.querySelector('.ladder-section.limit-orders-section .section-content'),
            () => {
                const limitOrdersSection = document.querySelector('.ladder-section.limit-orders-section');
                return limitOrdersSection ? limitOrdersSection.querySelector('.section-content') : null;
            },
            () => {
                const showLadderCheckbox = document.querySelector('#show-ladder-panel');
                if (showLadderCheckbox && !showLadderCheckbox.checked) {
                    showLadderCheckbox.checked = true;
                    showLadderCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
                    setTimeout(() => this.findAndReplacePanel(), 1000);
                    return null;
                }
                return null;
            }
        ];

        for (let i = 0; i < detectionMethods.length; i++) {
            try {
                const targetElement = detectionMethods[i]();
                if (targetElement) {
                    console.log(`✅ Found Limit Orders panel`);
                    this.replaceContent(targetElement);
                    return;
                }
            } catch (error) {
                console.log(`⚠️ Detection method ${i + 1} failed:`, error.message);
            }
        }

        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            setTimeout(() => this.findAndReplacePanel(), 3000);
        }
    }

    clearExistingInstances() {
        // Remove any existing rebalancing panels to prevent conflicts
        const existingPanels = document.querySelectorAll('.simple-rebalancing-panel, .rebalancing-fullsize-backdrop');
        existingPanels.forEach(panel => panel.remove());
        
        // Clear any existing intervals
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        console.log('🧹 Cleared existing instances to prevent conflicts');
    }

    replaceContent(targetElement) {
        if (this.isInitialized) return;

        this.originalContent = targetElement.innerHTML;
        targetElement.innerHTML = this.createSimplePanelHTML();
        this.addEventListeners(targetElement);
        this.startDataUpdates();
        
        this.isInitialized = true;
        console.log('✅ AMPL Rebalancing System initialized (conflict-free)');
    }

    async startDataUpdates() {
        console.log('🔄 Starting data updates (2-minute intervals)...');
        
        // Initial load
        await this.loadAccountData();
        await this.updatePrices();
        
        // Set up slower interval updates
        this.updateInterval = setInterval(async () => {
            await this.loadAccountData();
            await this.updatePrices();
            this.checkTriggerConditions();
            
            // Update both simple and expanded views if open
            this.updateAllViews();
        }, this.UPDATE_INTERVAL);
        
        this.addToActionLog('Data monitoring started (2-minute intervals)');
    }

    async loadAccountData() {
        try {
            console.log('📊 Loading account balances...');
            
            // Try to get real balances from KuCoin
            const response = await fetch('https://fbkcdirkshubectuvxzi.supabase.co/rest/v1/rpc/get_kucoin_balances', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia2NkaXJrc2h1YmVjdHV2eHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NDc0ODAsImV4cCI6MjA2MjAyMzQ4MH0.yhy1JL-V9zQVK1iIdSVK1261qD8gmHmo2vB-qe7Kit8',
                    'Content-Type': 'application/json',
                    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia2NkaXJrc2h1YmVjdHV2eHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NDc0ODAsImV4cCI6MjA2MjAyMzQ4MH0.yhy1JL-V9zQVK1iIdSVK1261qD8gmHmo2vB-qe7Kit8'
                },
                body: JSON.stringify({})
            });
            
            if (response.ok) {
                const balanceData = await response.json();
                console.log('✅ Balance data received:', balanceData);
                
                // Reset all to zero first
                Object.keys(this.portfolioData).forEach(symbol => {
                    this.portfolioData[symbol].quantity = 0;
                    this.portfolioData[symbol].status = '💤';
                });
                this.availableBalance = 0;
                
                // Update with real balances
                if (balanceData && Array.isArray(balanceData)) {
                    balanceData.forEach(balance => {
                        const symbol = balance.currency;
                        const available = parseFloat(balance.available || 0);
                        
                        if (symbol === 'USDT') {
                            this.availableBalance = available;
                        } else if (this.portfolioData[symbol] && available > 0) {
                            this.portfolioData[symbol].quantity = available;
                            this.portfolioData[symbol].status = '📊';
                        }
                    });
                }
                
                this.isLiveDataActive = true;
                this.addToActionLog(`Loaded balances: USDT $${this.availableBalance.toFixed(2)}`);
            } else {
                console.log('⚠️ Could not load balances, keeping zero values');
                this.isLiveDataActive = false;
                this.addToActionLog('Balance loading failed - showing zero values');
            }
        } catch (error) {
            console.error('❌ Error loading account data:', error);
            this.isLiveDataActive = false;
            this.addToActionLog('Balance loading error - showing zero values');
        }
    }

    async updatePrices() {
        try {
            console.log('📊 Fetching current prices...');
            
            const prices = await this.fetchCurrentPrices();
            
            if (prices && Object.keys(prices).length > 0) {
                // Update portfolio with current prices
                Object.keys(this.portfolioData).forEach(symbol => {
                    if (prices[symbol]) {
                        const data = this.portfolioData[symbol];
                        data.currentPrice = prices[symbol];
                        data.value = data.quantity * data.currentPrice;
                        
                        if (data.quantity > 0 && data.purchasePrice > 0) {
                            const invested = data.quantity * data.purchasePrice;
                            data.profit = data.value - invested;
                            data.profitPercent = (data.profit / invested) * 100;
                            
                            if (data.profitPercent >= this.settings.profitThreshold) {
                                data.status = '🎯';
                            } else if (data.profitPercent > 0) {
                                data.status = '📈';
                            } else {
                                data.status = '📊';
                            }
                        }
                    }
                });
                
                // Update AMPL price for trigger monitoring
                if (prices.AMPL) {
                    this.lastAMPLPrice = prices.AMPL;
                }
                
                this.addToActionLog(`Prices updated: ${Object.keys(prices).join(', ')}`);
            } else {
                this.addToActionLog('Price update failed');
            }
        } catch (error) {
            console.error('❌ Error updating prices:', error);
            this.addToActionLog('Price update error');
        }
    }

    async fetchCurrentPrices() {
        const prices = {};
        
        try {
            // Use CoinGecko as primary source
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana,sui,bitcoin,ampleforth&vs_currencies=usd');
            if (response.ok) {
                const data = await response.json();
                if (data.solana) prices.SOL = data.solana.usd;
                if (data.sui) prices.SUI = data.sui.usd;
                if (data.bitcoin) prices.BTC = data.bitcoin.usd;
                if (data.ampleforth) prices.AMPL = data.ampleforth.usd;
            }
        } catch (error) {
            console.log('⚠️ CoinGecko failed:', error.message);
        }
        
        // Fallback to Binance for missing prices
        const binanceMap = { SOL: 'SOLUSDT', SUI: 'SUIUSDT', BTC: 'BTCUSDT' };
        for (const [coin, symbol] of Object.entries(binanceMap)) {
            if (!prices[coin]) {
                try {
                    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
                    if (response.ok) {
                        const data = await response.json();
                        prices[coin] = parseFloat(data.price);
                    }
                } catch (error) {
                    console.log(`⚠️ Binance ${coin} failed:`, error.message);
                }
            }
        }
        
        return prices;
    }

    checkTriggerConditions() {
        if (!this.lastAMPLPrice || this.rebalanceInProgress) return;
        
        const now = Date.now();
        const timeSinceLastTrigger = now - this.lastTriggerTime;
        
        console.log(`🔍 AMPL Check: $${this.lastAMPLPrice.toFixed(4)} vs trigger $${this.AMPL_TRIGGER_PRICE}`);
        
        if (this.lastAMPLPrice < this.AMPL_TRIGGER_PRICE && 
            this.settings.autoRebalanceEnabled && 
            timeSinceLastTrigger > this.TRIGGER_COOLDOWN) {
            
            console.log('🚨 AMPL TRIGGER ACTIVATED!');
            this.triggerActive = true;
            this.lastTriggerTime = now;
            this.portfolioData.AMPL.status = '🚨';
            this.addToActionLog(`🚨 AMPL trigger: $${this.lastAMPLPrice.toFixed(4)} < $${this.AMPL_TRIGGER_PRICE}`);
            
            this.executeEqualRebalance();
        } else if (this.lastAMPLPrice >= this.AMPL_TRIGGER_PRICE && this.triggerActive) {
            console.log('✅ AMPL trigger deactivated');
            this.triggerActive = false;
            this.addToActionLog(`✅ AMPL recovered: $${this.lastAMPLPrice.toFixed(4)}`);
        }
    }

    async executeEqualRebalance() {
        if (this.rebalanceInProgress || this.availableBalance <= 0) {
            this.addToActionLog('❌ Cannot rebalance: insufficient balance or already in progress');
            return;
        }
        
        this.rebalanceInProgress = true;
        this.addToActionLog('🔄 Starting equal rebalance...');
        
        try {
            // Calculate equal allocation from available balance
            const allocationPerCoin = this.availableBalance / 4;
            
            if (allocationPerCoin < 10) { // Minimum $10 per coin
                throw new Error(`Insufficient balance: $${this.availableBalance.toFixed(2)} (need minimum $40)`);
            }
            
            console.log(`💰 Equal allocation: $${allocationPerCoin.toFixed(2)} per coin from $${this.availableBalance.toFixed(2)} balance`);
            this.addToActionLog(`💰 Allocating $${allocationPerCoin.toFixed(2)} per coin`);
            
            const coins = ['SOL', 'SUI', 'BTC', 'AMPL'];
            let successfulOrders = 0;
            
            for (const coin of coins) {
                try {
                    const currentPrice = this.portfolioData[coin].currentPrice;
                    if (currentPrice > 0) {
                        const quantity = allocationPerCoin / currentPrice;
                        
                        const success = await this.placeBuyOrder(coin, quantity, allocationPerCoin);
                        if (success) {
                            successfulOrders++;
                            
                            // Update portfolio data
                            const oldQuantity = this.portfolioData[coin].quantity;
                            const oldValue = oldQuantity * this.portfolioData[coin].purchasePrice;
                            const newValue = quantity * currentPrice;
                            
                            this.portfolioData[coin].quantity += quantity;
                            this.portfolioData[coin].purchasePrice = (oldValue + newValue) / this.portfolioData[coin].quantity;
                            this.portfolioData[coin].status = '📊';
                            
                            this.addToActionLog(`✅ Bought ${quantity.toFixed(4)} ${coin} at $${currentPrice.toFixed(4)}`);
                        }
                    }
                } catch (error) {
                    this.addToActionLog(`❌ Failed to buy ${coin}: ${error.message}`);
                }
            }
            
            // Update available balance
            this.availableBalance -= (successfulOrders * allocationPerCoin);
            
            this.addToActionLog(`✅ Rebalance complete: ${successfulOrders}/4 orders successful`);
            
        } catch (error) {
            console.error('❌ Rebalance error:', error);
            this.addToActionLog(`❌ Rebalance failed: ${error.message}`);
        } finally {
            this.rebalanceInProgress = false;
        }
    }

    async placeBuyOrder(symbol, quantity, value) {
        try {
            console.log(`🛒 Placing order: ${quantity.toFixed(4)} ${symbol} (~$${value.toFixed(2)})`);
            
            const response = await fetch('https://fbkcdirkshubectuvxzi.supabase.co/rest/v1/rpc/place_kucoin_order', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia2NkaXJrc2h1YmVjdHV2eHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NDc0ODAsImV4cCI6MjA2MjAyMzQ4MH0.yhy1JL-V9zQVK1iIdSVK1261qD8gmHmo2vB-qe7Kit8',
                    'Content-Type': 'application/json',
                    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia2NkaXJrc2h1YmVjdHV2eHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NDc0ODAsImV4cCI6MjA2MjAyMzQ4MH0.yhy1JL-V9zQVK1iIdSVK1261qD8gmHmo2vB-qe7Kit8'
                },
                body: JSON.stringify({
                    symbol: `${symbol}-USDT`,
                    side: 'buy',
                    type: 'market',
                    funds: value.toFixed(2),
                    client_oid: `rebalance-${symbol}-${Date.now()}`
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log(`✅ Order placed for ${symbol}:`, result);
                return true;
            } else {
                const error = await response.text();
                console.log(`⚠️ Order failed for ${symbol}:`, error);
                return false;
            }
        } catch (error) {
            console.error(`❌ Order error for ${symbol}:`, error);
            return false;
        }
    }

    createSimplePanelHTML() {
        const totalInvested = Object.values(this.portfolioData).reduce((sum, coin) => sum + (coin.quantity * coin.purchasePrice), 0);
        const currentValue = Object.values(this.portfolioData).reduce((sum, coin) => sum + coin.value, 0);
        const totalProfit = currentValue - totalInvested;
        const totalProfitPercent = totalInvested > 0 ? ((totalProfit / totalInvested) * 100) : 0;

        return `
            <div class="simple-rebalancing-panel" style="
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.95);
                border: 1px solid rgba(76, 175, 80, 0.3);
                border-radius: 8px;
                padding: 20px;
                box-sizing: border-box;
                font-family: 'Courier New', monospace;
                color: #ffffff;
                display: flex;
                flex-direction: column;
                justify-content: center;
                text-align: center;
                position: relative;
                z-index: 1000;
            ">
                <!-- Title -->
                <div style="
                    color: #4CAF50;
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 20px;
                ">
                    🔄 AMPL REBALANCING SYSTEM
                </div>

                <!-- Status -->
                <div style="
                    color: ${this.triggerActive ? '#FF9800' : '#4CAF50'};
                    font-size: 16px;
                    margin-bottom: 20px;
                    background: rgba(${this.triggerActive ? '255, 152, 0' : '76, 175, 80'}, 0.1);
                    border: 1px solid rgba(${this.triggerActive ? '255, 152, 0' : '76, 175, 80'}, 0.3);
                    border-radius: 6px;
                    padding: 12px;
                ">
                    ${this.triggerActive ? '🚨 TRIGGER ACTIVE' : '✅ MONITORING'}
                </div>

                <!-- Balance -->
                <div style="
                    background: rgba(76, 175, 80, 0.1);
                    border: 1px solid rgba(76, 175, 80, 0.3);
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 16px;
                ">
                    <div style="color: #888; font-size: 14px; margin-bottom: 8px;">AVAILABLE BALANCE</div>
                    <div style="color: #4CAF50; font-size: 28px; font-weight: bold;">$${this.availableBalance.toFixed(2)}</div>
                </div>

                <!-- Profit -->
                <div style="
                    background: rgba(${totalProfit >= 0 ? '76, 175, 80' : '244, 67, 54'}, 0.1);
                    border: 1px solid rgba(${totalProfit >= 0 ? '76, 175, 80' : '244, 67, 54'}, 0.3);
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 20px;
                ">
                    <div style="color: #888; font-size: 14px; margin-bottom: 8px;">TOTAL PROFIT</div>
                    <div style="color: ${totalProfit >= 0 ? '#4CAF50' : '#f44336'}; font-size: 28px; font-weight: bold;">
                        $${totalProfit.toFixed(2)}
                    </div>
                    <div style="color: ${totalProfit >= 0 ? '#4CAF50' : '#f44336'}; font-size: 16px; margin-top: 4px;">
                        (${totalProfitPercent.toFixed(1)}%)
                    </div>
                </div>

                <!-- Description -->
                <div style="
                    color: #888;
                    font-size: 14px;
                    line-height: 1.5;
                    margin-bottom: 24px;
                    background: rgba(76, 175, 80, 0.05);
                    border: 1px solid rgba(76, 175, 80, 0.2);
                    border-radius: 6px;
                    padding: 16px;
                ">
                    <strong style="color: #4CAF50;">Automated Portfolio Rebalancing:</strong><br>
                    Monitors AMPL price and automatically purchases equal amounts of SOL, SUI, BTC, and AMPL when AMPL drops below $1.16. 
                    Tracks profit opportunities at 1.5% threshold for optimal rebalancing decisions.
                </div>

                <!-- View Details Button -->
                <button class="view-details-btn" style="
                    background: rgba(76, 175, 80, 0.2);
                    border: 2px solid rgba(76, 175, 80, 0.5);
                    color: #ffffff;
                    padding: 16px 24px;
                    border-radius: 8px;
                    font-size: 18px;
                    font-weight: bold;
                    cursor: pointer;
                    font-family: 'Courier New', monospace;
                    transition: all 0.3s ease;
                    margin-bottom: 16px;
                    position: relative;
                    z-index: 1001;
                " onmouseover="this.style.background='rgba(76, 175, 80, 0.3)'" onmouseout="this.style.background='rgba(76, 175, 80, 0.2)'">
                    📊 VIEW DETAILED PORTFOLIO
                </button>

                <!-- Restore Button -->
                <button class="restore-btn" style="
                    background: rgba(255, 152, 0, 0.2);
                    border: 1px solid rgba(255, 152, 0, 0.4);
                    color: #ffffff;
                    padding: 8px 16px;
                    border-radius: 4px;
                    font-size: 14px;
                    cursor: pointer;
                    font-family: 'Courier New', monospace;
                    position: relative;
                    z-index: 1001;
                ">
                    ↩️ RESTORE ORIGINAL PANEL
                </button>
            </div>
        `;
    }

    addEventListeners(container) {
        // View Details button
        const viewDetailsBtn = container.querySelector('.view-details-btn');
        if (viewDetailsBtn) {
            viewDetailsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showFullSizeView();
            });
        }

        // Restore button
        const restoreBtn = container.querySelector('.restore-btn');
        if (restoreBtn) {
            restoreBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.restoreOriginalContent();
            });
        }
    }

    showFullSizeView() {
        // Remove any existing expanded views first
        const existingBackdrop = document.querySelector('.rebalancing-fullsize-backdrop');
        if (existingBackdrop) {
            existingBackdrop.remove();
        }

        // Create full-screen backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'rebalancing-fullsize-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            overflow-y: auto;
            padding: 20px;
            box-sizing: border-box;
        `;

        backdrop.innerHTML = this.createFullSizeHTML();
        document.body.appendChild(backdrop);
        
        this.expandedViewOpen = true;

        // Add event listeners for full-size view
        const returnBtn = backdrop.querySelector('.return-btn');
        if (returnBtn) {
            returnBtn.addEventListener('click', () => {
                backdrop.remove();
                this.expandedViewOpen = false;
            });
        }

        // Close on backdrop click (but not on content click)
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                backdrop.remove();
                this.expandedViewOpen = false;
            }
        });

        this.addToActionLog('Detailed view opened');
    }

    createFullSizeHTML() {
        const totalInvested = Object.values(this.portfolioData).reduce((sum, coin) => sum + (coin.quantity * coin.purchasePrice), 0);
        const currentValue = Object.values(this.portfolioData).reduce((sum, coin) => sum + coin.value, 0);
        const totalProfit = currentValue - totalInvested;
        const totalProfitPercent = totalInvested > 0 ? ((totalProfit / totalInvested) * 100) : 0;

        return `
            <div style="
                max-width: 1200px;
                margin: 0 auto;
                background: rgba(0, 0, 0, 0.95);
                border: 2px solid rgba(76, 175, 80, 0.5);
                border-radius: 12px;
                padding: 30px;
                font-family: 'Courier New', monospace;
                color: #ffffff;
                box-shadow: 0 0 50px rgba(76, 175, 80, 0.3);
            ">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #4CAF50; margin: 0; font-size: 32px; margin-bottom: 10px;">🔄 AMPL REBALANCING SYSTEM</h1>
                    <p style="color: ${this.isLiveDataActive ? '#4CAF50' : '#ff4444'}; margin: 0; font-size: 16px; background: rgba(${this.isLiveDataActive ? '76, 175, 80' : '255, 68, 68'}, 0.2); padding: 8px 16px; border-radius: 6px; display: inline-block;">
                        ${this.isLiveDataActive ? '🟢 LIVE DATA' : '🔴 OFFLINE'} | AMPL: $${this.lastAMPLPrice ? this.lastAMPLPrice.toFixed(4) : '---'} | Trigger: $${this.AMPL_TRIGGER_PRICE} | Balance: $${this.availableBalance.toFixed(2)}
                    </p>
                    <p style="color: ${this.triggerActive ? '#FF9800' : '#4CAF50'}; margin: 8px 0; font-size: 18px; font-weight: bold;">
                        ${this.triggerActive ? '🚨 AMPL TRIGGER ACTIVE' : '✅ MONITORING AMPL PRICE'}
                    </p>
                </div>

                <!-- Overall Stats -->
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                    <div style="background: rgba(76, 175, 80, 0.1); padding: 20px; border-radius: 8px; text-align: center; border: 2px solid rgba(76, 175, 80, 0.3);">
                        <div style="color: #888; font-size: 16px; margin-bottom: 8px;">TOTAL INVESTED</div>
                        <div style="color: #4CAF50; font-weight: bold; font-size: 24px;">$${totalInvested.toFixed(2)}</div>
                    </div>
                    <div style="background: rgba(76, 175, 80, 0.1); padding: 20px; border-radius: 8px; text-align: center; border: 2px solid rgba(76, 175, 80, 0.3);">
                        <div style="color: #888; font-size: 16px; margin-bottom: 8px;">CURRENT VALUE</div>
                        <div style="color: #4CAF50; font-weight: bold; font-size: 24px;">$${currentValue.toFixed(2)}</div>
                    </div>
                    <div style="background: rgba(76, 175, 80, 0.1); padding: 20px; border-radius: 8px; text-align: center; border: 2px solid rgba(76, 175, 80, 0.3);">
                        <div style="color: #888; font-size: 16px; margin-bottom: 8px;">TOTAL PROFIT</div>
                        <div style="color: ${totalProfit >= 0 ? '#4CAF50' : '#f44336'}; font-weight: bold; font-size: 24px;">
                            $${totalProfit.toFixed(2)}<br>
                            <span style="font-size: 18px;">(${totalProfitPercent.toFixed(1)}%)</span>
                        </div>
                    </div>
                </div>

                <!-- Coins Grid -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                    ${Object.entries(this.portfolioData).map(([symbol, data]) => `
                        <div style="background: rgba(0, 0, 0, 0.8); border: 2px solid rgba(76, 175, 80, 0.4); border-radius: 12px; padding: 24px;">
                            <div style="text-align: center; margin-bottom: 20px;">
                                <div style="color: #4CAF50; font-size: 48px; margin-bottom: 8px;">${data.status}</div>
                                <div style="color: #4CAF50; font-weight: bold; font-size: 28px; margin-bottom: 8px;">${symbol}</div>
                                <div style="color: #888; font-size: 16px;">Quantity: ${data.quantity.toFixed(4)}</div>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                                <div style="background: rgba(76, 175, 80, 0.1); border: 1px solid rgba(76, 175, 80, 0.3); border-radius: 6px; padding: 12px; text-align: center;">
                                    <div style="color: #888; font-size: 12px; margin-bottom: 4px;">PURCHASE PRICE</div>
                                    <div style="color: #ffffff; font-weight: bold; font-size: 18px;">$${data.purchasePrice.toFixed(2)}</div>
                                </div>
                                <div style="background: rgba(76, 175, 80, 0.1); border: 1px solid rgba(76, 175, 80, 0.3); border-radius: 6px; padding: 12px; text-align: center;">
                                    <div style="color: #888; font-size: 12px; margin-bottom: 4px;">CURRENT PRICE</div>
                                    <div style="color: #ffffff; font-weight: bold; font-size: 18px;">$${data.currentPrice.toFixed(2)}</div>
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                <div style="background: rgba(76, 175, 80, 0.1); border: 1px solid rgba(76, 175, 80, 0.3); border-radius: 6px; padding: 12px; text-align: center;">
                                    <div style="color: #888; font-size: 12px; margin-bottom: 4px;">CURRENT VALUE</div>
                                    <div style="color: #4CAF50; font-weight: bold; font-size: 18px;">$${data.value.toFixed(2)}</div>
                                </div>
                                <div style="background: rgba(${data.profit >= 0 ? '76, 175, 80' : '244, 67, 54'}, 0.1); border: 1px solid rgba(${data.profit >= 0 ? '76, 175, 80' : '244, 67, 54'}, 0.3); border-radius: 6px; padding: 12px; text-align: center;">
                                    <div style="color: #888; font-size: 12px; margin-bottom: 4px;">PROFIT/LOSS</div>
                                    <div style="color: ${data.profit >= 0 ? '#4CAF50' : '#f44336'}; font-weight: bold; font-size: 18px;">
                                        $${data.profit.toFixed(2)}<br>
                                        <span style="font-size: 14px;">(${data.profitPercent.toFixed(1)}%)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Action Log -->
                <div style="background: rgba(0, 0, 0, 0.8); border: 2px solid rgba(76, 175, 80, 0.3); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                    <div style="color: #888; font-size: 16px; margin-bottom: 12px; font-weight: bold;">RECENT ACTIONS:</div>
                    <div style="max-height: 150px; overflow-y: auto;">
                        ${this.actionLog.slice(-10).map(action => 
                            `<div style="color: #4CAF50; margin-bottom: 6px; font-size: 14px;">• ${action}</div>`
                        ).join('')}
                    </div>
                </div>

                <!-- Return Button -->
                <div style="text-align: center;">
                    <button class="return-btn" style="
                        background: rgba(255, 152, 0, 0.2);
                        border: 2px solid rgba(255, 152, 0, 0.4);
                        color: #ffffff;
                        padding: 16px 32px;
                        border-radius: 8px;
                        font-size: 18px;
                        font-weight: bold;
                        cursor: pointer;
                        font-family: 'Courier New', monospace;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.background='rgba(255, 152, 0, 0.3)'" onmouseout="this.style.background='rgba(255, 152, 0, 0.2)'">
                        ↩️ RETURN TO SIMPLE VIEW
                    </button>
                </div>
            </div>
        `;
    }

    updateAllViews() {
        // Update simple panel
        this.updateSimpleDisplay();
        
        // Update expanded view if it's open
        if (this.expandedViewOpen) {
            const backdrop = document.querySelector('.rebalancing-fullsize-backdrop');
            if (backdrop) {
                const content = backdrop.querySelector('div');
                if (content) {
                    content.innerHTML = this.createFullSizeHTML().match(/<div[^>]*>([\s\S]*)<\/div>$/)[1];
                    
                    // Re-add event listeners for the updated content
                    const returnBtn = backdrop.querySelector('.return-btn');
                    if (returnBtn) {
                        returnBtn.addEventListener('click', () => {
                            backdrop.remove();
                            this.expandedViewOpen = false;
                        });
                    }
                }
            }
        }
    }

    updateSimpleDisplay() {
        // Update the simple panel display
        const panel = document.querySelector('.simple-rebalancing-panel');
        if (panel) {
            panel.innerHTML = this.createSimplePanelHTML().match(/<div class="simple-rebalancing-panel"[^>]*>([\s\S]*)<\/div>$/)[1];
            this.addEventListeners(panel.parentElement);
        }
    }

    restoreOriginalContent() {
        if (this.originalContent) {
            const targetElement = document.querySelector('.ladder-section.limit-orders-section .section-content');
            if (targetElement) {
                targetElement.innerHTML = this.originalContent;
                this.isInitialized = false;
                this.expandedViewOpen = false;
                
                // Clear intervals and remove any expanded views
                if (this.updateInterval) {
                    clearInterval(this.updateInterval);
                }
                
                const existingBackdrop = document.querySelector('.rebalancing-fullsize-backdrop');
                if (existingBackdrop) {
                    existingBackdrop.remove();
                }
                
                console.log('✅ Original content restored');
            }
        }
    }

    addToActionLog(message) {
        const timestamp = new Date().toLocaleTimeString();
        this.actionLog.push(`${timestamp}: ${message}`);
        if (this.actionLog.length > 20) {
            this.actionLog.shift();
        }
    }

    loadPersistentSettings() {
        try {
            const savedProfitThreshold = localStorage.getItem('amplRebalancingProfitThreshold');
            const savedAutoRebalance = localStorage.getItem('amplRebalancingAutoEnabled');
            
            if (savedProfitThreshold) {
                this.settings.profitThreshold = parseFloat(savedProfitThreshold);
            }
            if (savedAutoRebalance !== null) {
                this.settings.autoRebalanceEnabled = savedAutoRebalance === 'true';
            }
            
            console.log('✅ Loaded settings:', this.settings);
        } catch (error) {
            console.log('⚠️ Error loading settings:', error.message);
        }
    }

    savePersistentSettings() {
        try {
            localStorage.setItem('amplRebalancingProfitThreshold', this.settings.profitThreshold.toString());
            localStorage.setItem('amplRebalancingAutoEnabled', this.settings.autoRebalanceEnabled.toString());
            console.log('💾 Settings saved:', this.settings);
        } catch (error) {
            console.log('⚠️ Error saving settings:', error.message);
        }
    }
}

// Initialize the rebalancing system
const amplRebalancingSystem = new AMPLRebalancingSystem();

console.log('🎬 AMPL Rebalancing System (Fixed - No Conflicts) loaded successfully');

