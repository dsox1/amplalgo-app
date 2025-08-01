/**
 * kucoin_integration_fixed.js
 * Fixed KuCoin API integration that uses Supabase Edge Function for secure API calls
 * This replaces the original kucoin_integration.js
 */

class KuCoinAPIIntegrationFixed {
    constructor() {
        this.supabaseURL = 'https://YOUR_SUPABASE_PROJECT_REF.supabase.co'; // !!! IMPORTANT: Replace with your actual Supabase Project URL !!!
        this.supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY_HERE'; // !!! IMPORTANT: Replace with your actual Supabase Anon Key !!!
        this.supabaseFunctionName = 'kucoin-api-proxy'; // Name of the Supabase Edge Function
        
        this.isInitialized = false;
        this.init();
    }

    init() {
        console.log('🎬 Initializing KuCoin API Integration (via Supabase Edge Function)...');
        // No direct credential loading here, as it's handled by the Edge Function
        this.setupUI();
        this.isInitialized = true;
        console.log('✅ KuCoin API Integration initialized');
    }

    /**
     * Make request to Supabase Edge Function
     */
    async makeRequest(method, endpoint, body = null) {
        if (!this.isInitialized) {
            throw new Error('KuCoin API not initialized - please ensure Supabase URL and Anon Key are set.');
        }

        const requestBody = {
            method: method,
            endpoint: endpoint,
            body: body,
            sandbox: false // Set to true if you want to use KuCoin Sandbox via Edge Function
        };

        try {
            const response = await fetch(`${this.supabaseURL}/functions/v1/${this.supabaseFunctionName}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.supabaseAnonKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Supabase Edge Function error: ${response.status} - ${errorData}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('❌ Error calling Supabase Edge Function:', error);
            this.logError(`API call failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Test API connection (via Supabase Edge Function)
     */
    async testConnection() {
        try {
            const response = await this.makeRequest('GET', '/api/v1/timestamp');
            const serverTime = response.data;
            console.log('✅ KuCoin API connection successful (via Supabase Edge Function)');
            this.logSystem(`KuCoin API connected (Server time: ${new Date(serverTime).toLocaleString()})`);
            this.updateConnectionStatus(true);
            return true;
        } catch (error) {
            console.error('❌ KuCoin API connection failed (via Supabase Edge Function):', error);
            this.logError(`KuCoin API connection failed: ${error.message}`);
            this.updateConnectionStatus(false);
            return false;
        }
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

            console.log(`📬 Placing ${side} order via Supabase:`, orderData);

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
            console.error('❌ Error placing order via Supabase:', error);
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
            const response = await this.makeRequest('GET', `/api/v1/market/orderbook/level1?symbol=${symbol}`);
            return response.data;
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
                    background: #F44336;
                "></span>
                <span id="kucoin-status-text" style="color: var(--text-primary, #ffffff);">
                    KuCoin API: Not Connected
                </span>
            </div>
        `;

        setTimeout(() => {
            const targetContainer = document.querySelector('.ladder-controls') || 
                                  document.querySelector('.section-content');
            
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
    window.kucoinAPI = new KuCoinAPIIntegrationFixed();
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

console.log('🎬 KuCoin API Integration (Fixed) loaded successfully');


