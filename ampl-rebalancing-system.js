/**
 * AMPL Rebalancing System - Complete Rewrite
 * Built from scratch with proper architecture and functionality
 */

class AMPLRebalancingSystem {
    constructor() {
        this.isInitialized = false;
        this.originalContent = null;
        this.isExpanded = false;
        this.updateInterval = null;
        this.retryCount = 0;
        this.maxRetries = 10;
        
        // Configuration
        this.AMPL_TRIGGER_PRICE = 1.16;
        this.UPDATE_INTERVAL = 120000; // 2 minutes - much slower
        this.TRIGGER_COOLDOWN = 600000; // 10 minutes between triggers
        
        // State tracking
        this.lastAMPLPrice = null;
        this.triggerActive = false;
        this.rebalanceInProgress = false;
        this.lastTriggerTime = 0;
        this.availableBalance = 0; // USDT balance for rebalancing
        
        // Portfolio data - ZEROED by default
        this.portfolioData = {
            SOL: { quantity: 0, purchasePrice: 0, currentPrice: 0, value: 0, profit: 0, profitPercent: 0, status: '💤' },
            SUI: { quantity: 0, purchasePrice: 0, currentPrice: 0, value: 0, profit: 0, profitPercent: 0, status: '💤' },
            BTC: { quantity: 0, purchasePrice: 0, currentPrice: 0, value: 0, profit: 0, profitPercent: 0, status: '💤' },
            AMPL: { quantity: 0, purchasePrice: 0, currentPrice: 0, value: 0, profit: 0, profitPercent: 0, status: '💤' }
        };
        
        this.settings = {
            profitThreshold: 1.5,
            exchange: 'KuCoin',
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
        console.log('🎬 Initializing AMPL Rebalancing System (Complete Rewrite)...');
        this.loadPersistentSettings();
        this.findAndReplacePanel();
    }

    findAndReplacePanel() {
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

    replaceContent(targetElement) {
        if (this.isInitialized) return;

        this.originalContent = targetElement.innerHTML;
        targetElement.innerHTML = this.createRebalancingHTML();
        this.addEventListeners(targetElement);
        this.startDataUpdates();
        
        this.isInitialized = true;
        console.log('✅ AMPL Rebalancing System initialized');
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
                
                this.updateDisplay();
                this.addToActionLog(`Prices updated: ${Object.keys(prices).join(', ')}`);
                this.updateLiveStatusIndicator(true);
            } else {
                this.updateLiveStatusIndicator(false);
                this.addToActionLog('Price update failed');
            }
        } catch (error) {
            console.error('❌ Error updating prices:', error);
            this.updateLiveStatusIndicator(false);
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

    createRebalancingHTML() {
        const totalInvested = Object.values(this.portfolioData).reduce((sum, coin) => sum + (coin.quantity * coin.purchasePrice), 0);
        const currentValue = Object.values(this.portfolioData).reduce((sum, coin) => sum + coin.value, 0);
        const totalProfit = currentValue - totalInvested;
        const totalProfitPercent = totalInvested > 0 ? ((totalProfit / totalInvested) * 100) : 0;

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
                font-family: 'Courier New', monospace;
                color: #ffffff;
            ">
                <!-- Header -->
                <div class="rebalancing-header" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                    padding: 6px 8px;
                    background: rgba(76, 175, 80, 0.1);
                    border-radius: 4px;
                    border: 1px solid rgba(76, 175, 80, 0.3);
                ">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="color: #4CAF50; font-size: 12px; font-weight: bold;">🔄 REBALANCING SYSTEM</span>
                        <span class="live-status-indicator" style="color: #ff4444; font-size: 10px; background: rgba(255, 68, 68, 0.2); padding: 2px 6px; border-radius: 3px;">🔴 CONNECTING...</span>
                    </div>
                    <div style="display: flex; gap: 6px;">
                        <button class="expand-btn" style="
                            background: rgba(76, 175, 80, 0.2);
                            border: 1px solid rgba(76, 175, 80, 0.4);
                            color: #ffffff;
                            padding: 4px 8px;
                            border-radius: 3px;
                            font-size: 10px;
                            cursor: pointer;
                            font-weight: bold;
                        ">📊 EXPAND</button>
                        <button class="settings-btn" style="
                            background: rgba(76, 175, 80, 0.2);
                            border: 1px solid rgba(76, 175, 80, 0.4);
                            color: #ffffff;
                            padding: 4px 8px;
                            border-radius: 3px;
                            font-size: 10px;
                            cursor: pointer;
                            font-weight: bold;
                        ">⚙️ SETTINGS</button>
                        <button class="restore-btn" style="
                            background: rgba(255, 152, 0, 0.2);
                            border: 1px solid rgba(255, 152, 0, 0.4);
                            color: #ffffff;
                            padding: 4px 8px;
                            border-radius: 3px;
                            font-size: 10px;
                            cursor: pointer;
                            font-weight: bold;
                        ">↩️ RESTORE</button>
                    </div>
                </div>

                <!-- AMPL Trigger Status -->
                <div class="trigger-status" style="
                    background: ${this.triggerActive ? 'rgba(255, 152, 0, 0.1)' : 'rgba(76, 175, 80, 0.1)'};
                    border: 1px solid ${this.triggerActive ? 'rgba(255, 152, 0, 0.3)' : 'rgba(76, 175, 80, 0.3)'};
                    border-radius: 4px;
                    padding: 6px 8px;
                    margin-bottom: 8px;
                    font-size: 10px;
                    text-align: center;
                ">
                    <div style="color: ${this.triggerActive ? '#FF9800' : '#4CAF50'}; font-weight: bold;">
                        ${this.triggerActive ? '🚨 AMPL TRIGGER ACTIVE' : '✅ AMPL TRIGGER MONITORING'}
                    </div>
                    <div style="color: #888; font-size: 9px;">
                        Trigger: $${this.AMPL_TRIGGER_PRICE} | Current: $${this.lastAMPLPrice ? this.lastAMPLPrice.toFixed(4) : '---'} | Balance: $${this.availableBalance.toFixed(2)}
                    </div>
                </div>

                <!-- Overall Stats -->
                <div class="overall-stats" style="
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 6px;
                    margin-bottom: 8px;
                    font-size: 10px;
                ">
                    <div style="background: rgba(76, 175, 80, 0.1); padding: 6px; border-radius: 3px; text-align: center; border: 1px solid rgba(76, 175, 80, 0.3);">
                        <div style="color: #888; font-size: 9px; font-weight: bold;">INVESTED</div>
                        <div style="color: #4CAF50; font-weight: bold; font-size: 11px;">$${totalInvested.toFixed(2)}</div>
                    </div>
                    <div style="background: rgba(76, 175, 80, 0.1); padding: 6px; border-radius: 3px; text-align: center; border: 1px solid rgba(76, 175, 80, 0.3);">
                        <div style="color: #888; font-size: 9px; font-weight: bold;">VALUE</div>
                        <div style="color: #4CAF50; font-weight: bold; font-size: 11px;">$${currentValue.toFixed(2)}</div>
                    </div>
                    <div style="background: rgba(76, 175, 80, 0.1); padding: 6px; border-radius: 3px; text-align: center; border: 1px solid rgba(76, 175, 80, 0.3);">
                        <div style="color: #888; font-size: 9px; font-weight: bold;">PROFIT</div>
                        <div style="color: ${totalProfit >= 0 ? '#4CAF50' : '#f44336'}; font-weight: bold; font-size: 11px;">
                            $${totalProfit.toFixed(2)} (${totalProfitPercent.toFixed(1)}%)
                        </div>
                    </div>
                </div>

                <!-- Coins List (Each on separate row) -->
                <div class="coins-list" style="
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    flex: 1;
                    min-height: 0;
                    margin-bottom: 8px;
                ">
                    ${this.createCoinRows()}
                </div>

                <!-- Settings Panel -->
                <div class="settings-panel" style="
                    display: none;
                    background: rgba(0, 0, 0, 0.9);
                    border: 1px solid rgba(76, 175, 80, 0.4);
                    border-radius: 4px;
                    padding: 8px;
                    margin-bottom: 8px;
                    font-size: 10px;
                ">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                        <div>
                            <label style="color: #888; font-size: 9px; font-weight: bold;">Profit Threshold:</label>
                            <select class="profit-threshold-select" style="
                                width: 100%;
                                background: rgba(0, 0, 0, 0.8);
                                border: 1px solid rgba(76, 175, 80, 0.4);
                                color: #ffffff;
                                padding: 4px;
                                border-radius: 3px;
                                font-size: 9px;
                            ">
                                <option value="1.5" ${this.settings.profitThreshold === 1.5 ? 'selected' : ''}>1.5%</option>
                                <option value="5" ${this.settings.profitThreshold === 5 ? 'selected' : ''}>5%</option>
                                <option value="10" ${this.settings.profitThreshold === 10 ? 'selected' : ''}>10%</option>
                                <option value="15" ${this.settings.profitThreshold === 15 ? 'selected' : ''}>15%</option>
                            </select>
                        </div>
                        <div>
                            <label style="color: #888; font-size: 9px; font-weight: bold;">Auto Rebalance:</label>
                            <div style="margin-top: 4px;">
                                <input type="checkbox" class="auto-rebalance-checkbox" ${this.settings.autoRebalanceEnabled ? 'checked' : ''} style="margin-right: 6px;">
                                <span style="color: #fff; font-size: 9px;">Enable automatic rebalancing</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Action Log -->
                <div class="action-log" style="
                    background: rgba(0, 0, 0, 0.8);
                    border: 1px solid rgba(76, 175, 80, 0.3);
                    border-radius: 4px;
                    padding: 6px;
                    max-height: 60px;
                    overflow-y: auto;
                    font-size: 9px;
                ">
                    <div style="color: #888; font-size: 8px; margin-bottom: 3px; font-weight: bold;">RECENT ACTIONS:</div>
                    ${this.actionLog.slice(-4).map(action => 
                        `<div style="color: #4CAF50; margin-bottom: 2px; font-size: 9px;">• ${action}</div>`
                    ).join('')}
                </div>
            </div>
        `;
    }

    createCoinRows() {
        return Object.entries(this.portfolioData).map(([symbol, data]) => `
            <div class="coin-row" style="
                background: rgba(0, 0, 0, 0.8);
                border: 1px solid rgba(76, 175, 80, 0.3);
                border-radius: 4px;
                padding: 8px;
                font-size: 10px;
                transition: all 0.3s ease;
                display: grid;
                grid-template-columns: 60px 1fr 1fr 1fr 1fr 1fr;
                gap: 8px;
                align-items: center;
            ">
                <div style="text-align: center;">
                    <div style="color: #4CAF50; font-weight: bold; font-size: 12px;">${data.status}</div>
                    <div style="color: #4CAF50; font-weight: bold; font-size: 11px;">${symbol}</div>
                </div>
                <div style="text-align: center;">
                    <div style="color: #666; font-size: 8px; font-weight: bold;">QUANTITY</div>
                    <div style="color: #fff; font-weight: bold;">${data.quantity.toFixed(4)}</div>
                </div>
                <div style="text-align: center;">
                    <div style="color: #666; font-size: 8px; font-weight: bold;">PURCHASE</div>
                    <div style="color: #fff; font-weight: bold;">$${data.purchasePrice.toFixed(2)}</div>
                </div>
                <div style="text-align: center;">
                    <div style="color: #666; font-size: 8px; font-weight: bold;">CURRENT</div>
                    <div style="color: #fff; font-weight: bold;">$${data.currentPrice.toFixed(2)}</div>
                </div>
                <div style="text-align: center;">
                    <div style="color: #666; font-size: 8px; font-weight: bold;">VALUE</div>
                    <div style="color: #4CAF50; font-weight: bold;">$${data.value.toFixed(2)}</div>
                </div>
                <div style="text-align: center;">
                    <div style="color: #666; font-size: 8px; font-weight: bold;">PROFIT</div>
                    <div style="color: ${data.profit >= 0 ? '#4CAF50' : '#f44336'}; font-weight: bold;">
                        $${data.profit.toFixed(2)}<br>
                        <span style="font-size: 8px;">(${data.profitPercent.toFixed(1)}%)</span>
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

        const autoRebalanceCheckbox = container.querySelector('.auto-rebalance-checkbox');
        if (autoRebalanceCheckbox) {
            autoRebalanceCheckbox.addEventListener('change', (e) => {
                this.settings.autoRebalanceEnabled = e.target.checked;
                this.savePersistentSettings();
                this.addToActionLog(`Auto rebalance ${e.target.checked ? 'enabled' : 'disabled'}`);
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
        // DYNAMIC DATA - syncs with current portfolio state
        const totalInvested = Object.values(this.portfolioData).reduce((sum, coin) => sum + (coin.quantity * coin.purchasePrice), 0);
        const currentValue = Object.values(this.portfolioData).reduce((sum, coin) => sum + coin.value, 0);
        const totalProfit = currentValue - totalInvested;
        const totalProfitPercent = totalInvested > 0 ? ((totalProfit / totalInvested) * 100) : 0;

        return `
            <div style="text-align: center; margin-bottom: 16px;">
                <h2 style="color: #4CAF50; margin: 0; font-size: 18px;">🔄 AMPL Rebalancing System</h2>
                <p style="color: ${this.isLiveDataActive ? '#4CAF50' : '#ff4444'}; margin: 4px 0; font-size: 12px; background: rgba(${this.isLiveDataActive ? '76, 175, 80' : '255, 68, 68'}, 0.2); padding: 4px 8px; border-radius: 4px; display: inline-block;">
                    ${this.isLiveDataActive ? '🟢 LIVE DATA' : '🔴 OFFLINE'} | Trigger: $${this.AMPL_TRIGGER_PRICE} | Balance: $${this.availableBalance.toFixed(2)}
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
                        <span style="font-size: 12px;">(${totalProfitPercent.toFixed(1)}%)</span>
                    </div>
                </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
                ${Object.entries(this.portfolioData).map(([symbol, data]) => `
                    <div style="background: rgba(0, 0, 0, 0.8); border: 1px solid rgba(76, 175, 80, 0.3); border-radius: 6px; padding: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="color: #4CAF50; font-weight: bold; font-size: 16px;">${data.status} ${symbol}</span>
                            <span style="color: #888; font-size: 12px;">Qty: ${data.quantity.toFixed(4)}</span>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; font-size: 12px;">
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
                                    $${data.profit.toFixed(2)}<br>
                                    <span style="font-size: 10px;">(${data.profitPercent.toFixed(1)}%)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div style="background: rgba(0, 0, 0, 0.8); border: 1px solid rgba(76, 175, 80, 0.3); border-radius: 6px; padding: 12px;">
                <div style="color: #888; font-size: 11px; margin-bottom: 8px;">RECENT ACTIONS:</div>
                <div style="max-height: 60px; overflow-y: auto;">
                    ${this.actionLog.slice(-8).map(action => 
                        `<div style="color: #4CAF50; margin-bottom: 4px; font-size: 11px;">• ${action}</div>`
                    ).join('')}
                </div>
            </div>

            <div style="text-align: center; margin-top: 16px;">
                <button onclick="document.querySelector('.rebalancing-modal-backdrop').remove();" style="
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
                console.log('✅ Original content restored');
            }
        }
    }

    updateDisplay() {
        // Update coins list
        const coinsList = document.querySelector('.coins-list');
        if (coinsList) {
            coinsList.innerHTML = this.createCoinRows();
        }
        
        // Update overall stats
        const totalInvested = Object.values(this.portfolioData).reduce((sum, coin) => sum + (coin.quantity * coin.purchasePrice), 0);
        const currentValue = Object.values(this.portfolioData).reduce((sum, coin) => sum + coin.value, 0);
        const totalProfit = currentValue - totalInvested;
        const totalProfitPercent = totalInvested > 0 ? ((totalProfit / totalInvested) * 100) : 0;
        
        const overallStats = document.querySelector('.overall-stats');
        if (overallStats) {
            overallStats.innerHTML = `
                <div style="background: rgba(76, 175, 80, 0.1); padding: 6px; border-radius: 3px; text-align: center; border: 1px solid rgba(76, 175, 80, 0.3);">
                    <div style="color: #888; font-size: 9px; font-weight: bold;">INVESTED</div>
                    <div style="color: #4CAF50; font-weight: bold; font-size: 11px;">$${totalInvested.toFixed(2)}</div>
                </div>
                <div style="background: rgba(76, 175, 80, 0.1); padding: 6px; border-radius: 3px; text-align: center; border: 1px solid rgba(76, 175, 80, 0.3);">
                    <div style="color: #888; font-size: 9px; font-weight: bold;">VALUE</div>
                    <div style="color: #4CAF50; font-weight: bold; font-size: 11px;">$${currentValue.toFixed(2)}</div>
                </div>
                <div style="background: rgba(76, 175, 80, 0.1); padding: 6px; border-radius: 3px; text-align: center; border: 1px solid rgba(76, 175, 80, 0.3);">
                    <div style="color: #888; font-size: 9px; font-weight: bold;">PROFIT</div>
                    <div style="color: ${totalProfit >= 0 ? '#4CAF50' : '#f44336'}; font-weight: bold; font-size: 11px;">
                        $${totalProfit.toFixed(2)} (${totalProfitPercent.toFixed(1)}%)
                    </div>
                </div>
            `;
        }
        
        // Update trigger status
        const triggerStatus = document.querySelector('.trigger-status');
        if (triggerStatus) {
            triggerStatus.innerHTML = `
                <div style="color: ${this.triggerActive ? '#FF9800' : '#4CAF50'}; font-weight: bold;">
                    ${this.triggerActive ? '🚨 AMPL TRIGGER ACTIVE' : '✅ AMPL TRIGGER MONITORING'}
                </div>
                <div style="color: #888; font-size: 9px;">
                    Trigger: $${this.AMPL_TRIGGER_PRICE} | Current: $${this.lastAMPLPrice ? this.lastAMPLPrice.toFixed(4) : '---'} | Balance: $${this.availableBalance.toFixed(2)}
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
                logContent.innerHTML = this.actionLog.slice(-4).map(action => 
                    `<div style="color: #4CAF50; margin-bottom: 2px; font-size: 9px;">• ${action}</div>`
                ).join('');
            }
        }
    }

    updateLiveStatusIndicator(isLive) {
        const statusIndicator = document.querySelector('.live-status-indicator');
        if (statusIndicator) {
            if (isLive) {
                const triggerStatus = this.triggerActive ? ' 🚨 TRIGGER' : '';
                statusIndicator.innerHTML = `<span style="color: #4CAF50;">🟢 LIVE${triggerStatus}</span>`;
                statusIndicator.style.background = this.triggerActive ? 'rgba(255, 152, 0, 0.2)' : 'rgba(76, 175, 80, 0.2)';
            } else {
                statusIndicator.innerHTML = '<span style="color: #ff4444;">🔴 OFFLINE</span>';
                statusIndicator.style.background = 'rgba(255, 68, 68, 0.2)';
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

console.log('🎬 AMPL Rebalancing System (Complete Rewrite) loaded successfully');

