/**
 * kucoin_integration.js
 * KuCoin API integration for real trading functionality
 * Handles secure credential management and API calls
 */

class KuCoinAPIIntegration {
    constructor() {
        this.baseURL = 'https://api.kucoin.com';
        this.credentials = {
            apiKey: null,
            apiSecret: null,
            passphrase: null,
            sandbox: false
        };
        
        this.isInitialized = false;
        this.rateLimiter = {
            lastRequest: 0,
            minInterval: 100 // 100ms between requests
        };
        
        this.init();
    }

    init() {
        console.log('🎬 Initializing KuCoin API Integration...');
        this.loadCredentials();
        this.setupUI();
        console.log('✅ KuCoin API Integration initialized');
    }

    /**
     * Load credentials from environment variables (Vercel)
     * In production, these should be set as Vercel environment variables
     */
    loadCredentials() {
        try {
            // In a real deployment, these would come from secure environment variables
            // For now, we'll check if they're available in the global scope
            if (typeof KUCOIN_API_KEY !== 'undefined') {
                this.credentials.apiKey = KUCOIN_API_KEY;
                this.credentials.apiSecret = KUCOIN_API_SECRET;
                this.credentials.passphrase = KUCOIN_PASSPHRASE;
                this.credentials.sandbox = KUCOIN_SANDBOX === 'true';
                
                this.isInitialized = true;
                console.log('✅ KuCoin credentials loaded from environment');
            } else {
                console.log('⚠️ KuCoin credentials not found - running in simulation mode');
                this.setupCredentialInput();
            }
            
            // Update base URL for sandbox
            if (this.credentials.sandbox) {
                this.baseURL = 'https://openapi-sandbox.kucoin.com';
                console.log('🧪 Using KuCoin Sandbox environment');
            }
            
        } catch (error) {
            console.error('❌ Error loading KuCoin credentials:', error);
        }
    }

    /**
     * Setup credential input UI for development/testing
     */
    setupCredentialInput() {
        const credentialHTML = `
            <div class="kucoin-credentials" style="
                background: rgba(255, 193, 7, 0.1);
                border: 1px solid rgba(255, 193, 7, 0.3);
                border-radius: 8px;
                padding: 15px;
                margin: 10px 0;
                color: var(--text-primary, #ffffff);
            ">
                <h4 style="margin: 0 0 10px 0; color: #FFC107; font-size: 14px;">
                    🔐 KuCoin API Configuration
                </h4>
                <p style="font-size: 12px; margin-bottom: 10px; opacity: 0.8;">
                    Enter your KuCoin API credentials or set them as Vercel environment variables
                </p>
                <div style="display: grid; gap: 8px;">
                    <input type="text" id="kucoin-api-key" placeholder="API Key" style="
                        background: rgba(0,0,0,0.3);
                        border: 1px solid rgba(255,255,255,0.2);
                        color: white;
                        padding: 8px;
                        border-radius: 4px;
                        font-size: 12px;
                    ">
                    <input type="password" id="kucoin-api-secret" placeholder="API Secret" style="
                        background: rgba(0,0,0,0.3);
                        border: 1px solid rgba(255,255,255,0.2);
                        color: white;
                        padding: 8px;
                        border-radius: 4px;
                        font-size: 12px;
                    ">
                    <input type="text" id="kucoin-passphrase" placeholder="Passphrase" style="
                        background: rgba(0,0,0,0.3);
                        border: 1px solid rgba(255,255,255,0.2);
                        color: white;
                        padding: 8px;
                        border-radius: 4px;
                        font-size: 12px;
                    ">
                    <label style="font-size: 12px; display: flex; align-items: center; gap: 5px;">
                        <input type="checkbox" id="kucoin-sandbox" checked>
                        Use Sandbox (recommended for testing)
                    </label>
                    <button id="save-kucoin-credentials" style="
                        background: rgba(76, 175, 80, 0.3);
                        border: 1px solid rgba(76, 175, 80, 0.5);
                        color: #4CAF50;
                        padding: 8px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">Save Credentials</button>
                </div>
            </div>
        `;
        
        // Try to inject into existing UI
        setTimeout(() => {
            const targetContainer = document.querySelector('.section-content') || 
                                  document.querySelector('.ladder-controls') ||
                                  document.body;
            
            if (targetContainer) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = credentialHTML;
                targetContainer.appendChild(tempDiv.firstElementChild);
                
                this.bindCredentialEvents();
            }
        }, 1000);
    }

    /**
     * Bind events for credential input
     */
    bindCredentialEvents() {
        const saveButton = document.getElementById('save-kucoin-credentials');
        
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                const apiKey = document.getElementById('kucoin-api-key').value.trim();
                const apiSecret = document.getElementById('kucoin-api-secret').value.trim();
                const passphrase = document.getElementById('kucoin-passphrase').value.trim();
                const sandbox = document.getElementById('kucoin-sandbox').checked;
                
                if (apiKey && apiSecret && passphrase) {
                    this.credentials = { apiKey, apiSecret, passphrase, sandbox };
                    this.baseURL = sandbox ? 
                        'https://openapi-sandbox.kucoin.com' : 
                        'https://api.kucoin.com';
                    
                    this.isInitialized = true;
                    
                    // Hide credential input
                    const credentialDiv = document.querySelector('.kucoin-credentials');
                    if (credentialDiv) {
                        credentialDiv.style.display = 'none';
                    }
                    
                    console.log('✅ KuCoin credentials saved');
                    this.logSystem('KuCoin API credentials configured');
                    
                    // Test connection
                    this.testConnection();
                } else {
                    alert('Please fill in all credential fields');
                }
            });
        }
    }

    /**
     * Test API connection
     */
    async testConnection() {
        try {
            const serverTime = await this.getServerTime();
            console.log('✅ KuCoin API connection successful');
            this.logSystem(`KuCoin API connected (Server time: ${new Date(serverTime).toLocaleString()})`);
            return true;
        } catch (error) {
            console.error('❌ KuCoin API connection failed:', error);
            this.logError(`KuCoin API connection failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Generate authentication signature for KuCoin API
     */
    generateSignature(timestamp, method, requestPath, body = '') {
        const crypto = require('crypto');
        const message = timestamp + method + requestPath + body;
        return crypto.createHmac('sha256', this.credentials.apiSecret)
                    .update(message)
                    .digest('base64');
    }

    /**
     * Make authenticated API request
     */
    async makeRequest(method, endpoint, body = null) {
        if (!this.isInitialized) {
            throw new Error('KuCoin API not initialized - please configure credentials');
        }

        // Rate limiting
        const now = Date.now();
        if (now - this.rateLimiter.lastRequest < this.rateLimiter.minInterval) {
            await new Promise(resolve => 
                setTimeout(resolve, this.rateLimiter.minInterval - (now - this.rateLimiter.lastRequest))
            );
        }
        this.rateLimiter.lastRequest = Date.now();

        const timestamp = Date.now().toString();
        const requestPath = endpoint;
        const bodyStr = body ? JSON.stringify(body) : '';
        
        const signature = this.generateSignature(timestamp, method, requestPath, bodyStr);
        
        const headers = {
            'KC-API-KEY': this.credentials.apiKey,
            'KC-API-SIGN': signature,
            'KC-API-TIMESTAMP': timestamp,
            'KC-API-PASSPHRASE': this.credentials.passphrase,
            'KC-API-KEY-VERSION': '2',
            'Content-Type': 'application/json'
        };

        const config = {
            method,
            headers
        };

        if (body) {
            config.body = bodyStr;
        }

        const response = await fetch(`${this.baseURL}${endpoint}`, config);
        
        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`KuCoin API error: ${response.status} - ${errorData}`);
        }

        return await response.json();
    }

    /**
     * Get server time
     */
    async getServerTime() {
        const response = await fetch(`${this.baseURL}/api/v1/timestamp`);
        const data = await response.json();
        return data.data;
    }

    /**
     * Get account balance
     */
    async getAccountBalance() {
        try {
            const response = await this.makeRequest('GET', '/api/v1/accounts');
            return response.data;
        } catch (error) {
            console.error('Error getting account balance:', error);
            throw error;
        }
    }

    /**
     * Place a limit order
     */
    async placeOrder(orderParams) {
        try {
            const {
                symbol,
                side,
                type = 'limit',
                price,
                size,
                timeInForce = 'GTC'
            } = orderParams;

            const orderData = {
                clientOid: `ampl_${Date.now()}`,
                symbol,
                side,
                type,
                price: price.toString(),
                size: size.toString(),
                timeInForce
            };

            console.log(`📬 Placing ${side} order:`, orderData);

            const response = await this.makeRequest('POST', '/api/v1/orders', orderData);
            
            if (response.code === '200000') {
                console.log(`✅ Order placed successfully: ${response.data.orderId}`);
                this.logSystem(`${side.toUpperCase()} order placed: ${size} ${symbol} at $${price}`);
                
                return {
                    orderId: response.data.orderId,
                    clientOid: orderData.clientOid,
                    success: true
                };
            } else {
                throw new Error(`Order placement failed: ${response.msg}`);
            }

        } catch (error) {
            console.error('❌ Error placing order:', error);
            this.logError(`Order placement failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get order details
     */
    async getOrder(orderId) {
        try {
            const response = await this.makeRequest('GET', `/api/v1/orders/${orderId}`);
            return response.data;
        } catch (error) {
            console.error(`Error getting order ${orderId}:`, error);
            throw error;
        }
    }

    /**
     * Cancel an order
     */
    async cancelOrder(orderId) {
        try {
            const response = await this.makeRequest('DELETE', `/api/v1/orders/${orderId}`);
            
            if (response.code === '200000') {
                console.log(`✅ Order cancelled: ${orderId}`);
                this.logSystem(`Order cancelled: ${orderId}`);
                return true;
            } else {
                throw new Error(`Order cancellation failed: ${response.msg}`);
            }

        } catch (error) {
            console.error(`❌ Error cancelling order ${orderId}:`, error);
            this.logError(`Order cancellation failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get active orders
     */
    async getActiveOrders(symbol = 'AMPL-USDT') {
        try {
            const response = await this.makeRequest('GET', `/api/v1/orders?status=active&symbol=${symbol}`);
            return response.data.items || [];
        } catch (error) {
            console.error('Error getting active orders:', error);
            throw error;
        }
    }

    /**
     * Get ticker information
     */
    async getTicker(symbol = 'AMPL-USDT') {
        try {
            const response = await fetch(`${this.baseURL}/api/v1/market/orderbook/level1?symbol=${symbol}`);
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('Error getting ticker:', error);
            throw error;
        }
    }

    /**
     * Setup UI elements
     */
    setupUI() {
        // Add connection status indicator
        const statusHTML = `
            <div class="kucoin-status" style="
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 5px 10px;
                background: rgba(0,0,0,0.2);
                border-radius: 4px;
                margin: 5px 0;
                font-size: 12px;
            ">
                <span id="kucoin-status-indicator" style="
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: ${this.isInitialized ? '#4CAF50' : '#F44336'};
                "></span>
                <span id="kucoin-status-text" style="color: var(--text-primary, #ffffff);">
                    KuCoin API: ${this.isInitialized ? 'Connected' : 'Not Connected'}
                </span>
            </div>
        `;

        setTimeout(() => {
            const targetContainer = document.querySelector('.section-content') || 
                                  document.querySelector('.ladder-controls');
            
            if (targetContainer) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = statusHTML;
                targetContainer.insertBefore(tempDiv.firstElementChild, targetContainer.firstChild);
            }
        }, 1500);
    }

    /**
     * Update connection status in UI
     */
    updateConnectionStatus(connected) {
        const indicator = document.getElementById('kucoin-status-indicator');
        const text = document.getElementById('kucoin-status-text');
        
        if (indicator && text) {
            indicator.style.background = connected ? '#4CAF50' : '#F44336';
            text.textContent = `KuCoin API: ${connected ? 'Connected' : 'Not Connected'}`;
        }
    }

    // Logging methods (integrate with existing activity feed)
    logSystem(message) {
        if (typeof logSystem === 'function') {
            logSystem(message);
        } else {
            console.log(`📊 ${message}`);
        }
    }

    logError(message) {
        if (typeof logError === 'function') {
            logError(message);
        } else {
            console.error(`❌ ${message}`);
        }
    }
}

// Initialize KuCoin API integration
document.addEventListener('DOMContentLoaded', () => {
    window.kucoinAPI = new KuCoinAPIIntegration();
});

// Global functions for external use
window.testKuCoinConnection = function() {
    if (window.kucoinAPI) {
        return window.kucoinAPI.testConnection();
    }
};

window.getKuCoinBalance = function() {
    if (window.kucoinAPI) {
        return window.kucoinAPI.getAccountBalance();
    }
};

window.getAMPLPrice = async function() {
    if (window.kucoinAPI) {
        try {
            const ticker = await window.kucoinAPI.getTicker('AMPL-USDT');
            return parseFloat(ticker.price);
        } catch (error) {
            console.error('Error getting AMPL price:', error);
            return null;
        }
    }
};

console.log('🎬 KuCoin API Integration loaded successfully');

