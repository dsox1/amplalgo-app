/**
 * KuCoin Order Placement API
 * Proper implementation based on official KuCoin API documentation
 */

// KuCoin API configuration
const KUCOIN_CONFIG = {
    baseURL: 'https://api.kucoin.com',
    orderEndpoint: '/api/v1/orders'
};

/**
 * Generate KuCoin API signature
 * @param {string} timestamp - Unix timestamp in milliseconds
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} endpoint - API endpoint path
 * @param {string} body - Request body as JSON string
 * @param {string} apiSecret - KuCoin API Secret
 * @returns {string} Base64 encoded signature
 */
function generateKuCoinSignature(timestamp, method, endpoint, body, apiSecret) {
    // Create the string to sign: timestamp + method + endpoint + body
    const stringToSign = timestamp + method.toUpperCase() + endpoint + body;
    
    // Create HMAC SHA256 signature
    const crypto = require('crypto');
    const signature = crypto
        .createHmac('sha256', apiSecret)
        .update(stringToSign)
        .digest('base64');
    
    return signature;
}

/**
 * Generate encrypted passphrase for API v2/v3
 * @param {string} passphrase - Original passphrase
 * @param {string} apiSecret - KuCoin API Secret
 * @returns {string} Base64 encoded encrypted passphrase
 */
function generateEncryptedPassphrase(passphrase, apiSecret) {
    const crypto = require('crypto');
    const encryptedPassphrase = crypto
        .createHmac('sha256', apiSecret)
        .update(passphrase)
        .digest('base64');
    
    return encryptedPassphrase;
}

/**
 * Place a limit buy order on KuCoin
 * @param {Object} orderParams - Order parameters
 * @param {string} orderParams.symbol - Trading pair (e.g., 'AMPL-USDT')
 * @param {string} orderParams.price - Order price
 * @param {string} orderParams.size - Order size (quantity)
 * @param {string} orderParams.clientOid - Client order ID
 * @param {Object} credentials - KuCoin API credentials
 * @returns {Promise<Object>} Order placement result
 */
async function placeKuCoinLimitOrder(orderParams, credentials) {
    try {
        console.log('🔄 Placing KuCoin limit order:', orderParams);
        
        // Validate required parameters
        if (!orderParams.symbol || !orderParams.price || !orderParams.size || !orderParams.clientOid) {
            throw new Error('Missing required order parameters');
        }
        
        if (!credentials.apiKey || !credentials.apiSecret || !credentials.passphrase) {
            throw new Error('Missing required API credentials');
        }
        
        // Prepare order data
        const orderData = {
            clientOid: orderParams.clientOid,
            side: 'buy',
            symbol: orderParams.symbol,
            type: 'limit',
            price: orderParams.price.toString(),
            size: orderParams.size.toString(),
            timeInForce: 'GTC' // Good Till Canceled
        };
        
        // Convert to JSON string
        const requestBody = JSON.stringify(orderData);
        
        // Generate timestamp
        const timestamp = Date.now().toString();
        
        // Generate signature
        const signature = generateKuCoinSignature(
            timestamp,
            'POST',
            KUCOIN_CONFIG.orderEndpoint,
            requestBody,
            credentials.apiSecret
        );
        
        // Generate encrypted passphrase (for API v2/v3)
        const encryptedPassphrase = generateEncryptedPassphrase(
            credentials.passphrase,
            credentials.apiSecret
        );
        
        // Prepare headers
        const headers = {
            'Content-Type': 'application/json',
            'KC-API-KEY': credentials.apiKey,
            'KC-API-SIGN': signature,
            'KC-API-TIMESTAMP': timestamp,
            'KC-API-PASSPHRASE': encryptedPassphrase,
            'KC-API-KEY-VERSION': '2' // Use API v2
        };
        
        console.log('📤 Sending request to KuCoin API...');
        console.log('Headers:', {
            ...headers,
            'KC-API-KEY': credentials.apiKey.substring(0, 8) + '...',
            'KC-API-SIGN': signature.substring(0, 8) + '...',
            'KC-API-PASSPHRASE': '***'
        });
        
        // Make API request
        const response = await fetch(KUCOIN_CONFIG.baseURL + KUCOIN_CONFIG.orderEndpoint, {
            method: 'POST',
            headers: headers,
            body: requestBody
        });
        
        const responseData = await response.json();
        
        console.log('📥 KuCoin API Response:', response.status, responseData);
        
        if (response.ok && responseData.code === '200000') {
            console.log('✅ Order placed successfully!');
            return {
                success: true,
                orderId: responseData.data.orderId,
                clientOid: orderParams.clientOid,
                message: 'Order placed successfully'
            };
        } else {
            console.error('❌ Order placement failed:', responseData);
            return {
                success: false,
                error: responseData.msg || 'Order placement failed',
                code: responseData.code
            };
        }
        
    } catch (error) {
        console.error('❌ Error placing KuCoin order:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Cancel all orders for a symbol
 * @param {string} symbol - Trading pair (e.g., 'AMPL-USDT')
 * @param {Object} credentials - KuCoin API credentials
 * @returns {Promise<Object>} Cancellation result
 */
async function cancelAllKuCoinOrders(symbol, credentials) {
    try {
        console.log('🗑️ Canceling all orders for', symbol);
        
        const timestamp = Date.now().toString();
        const endpoint = `/api/v1/orders?symbol=${symbol}`;
        const requestBody = '';
        
        const signature = generateKuCoinSignature(
            timestamp,
            'DELETE',
            endpoint,
            requestBody,
            credentials.apiSecret
        );
        
        const encryptedPassphrase = generateEncryptedPassphrase(
            credentials.passphrase,
            credentials.apiSecret
        );
        
        const headers = {
            'KC-API-KEY': credentials.apiKey,
            'KC-API-SIGN': signature,
            'KC-API-TIMESTAMP': timestamp,
            'KC-API-PASSPHRASE': encryptedPassphrase,
            'KC-API-KEY-VERSION': '2'
        };
        
        const response = await fetch(KUCOIN_CONFIG.baseURL + endpoint, {
            method: 'DELETE',
            headers: headers
        });
        
        const responseData = await response.json();
        
        if (response.ok && responseData.code === '200000') {
            console.log('✅ Orders canceled successfully');
            return {
                success: true,
                cancelledOrderIds: responseData.data.cancelledOrderIds || []
            };
        } else {
            console.error('❌ Order cancellation failed:', responseData);
            return {
                success: false,
                error: responseData.msg || 'Order cancellation failed'
            };
        }
        
    } catch (error) {
        console.error('❌ Error canceling orders:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get active orders for a symbol
 * @param {string} symbol - Trading pair (e.g., 'AMPL-USDT')
 * @param {Object} credentials - KuCoin API credentials
 * @returns {Promise<Object>} Active orders result
 */
async function getActiveKuCoinOrders(symbol, credentials) {
    try {
        console.log('📋 Getting active orders for', symbol);
        
        const timestamp = Date.now().toString();
        const endpoint = `/api/v1/orders?status=active&symbol=${symbol}`;
        const requestBody = '';
        
        const signature = generateKuCoinSignature(
            timestamp,
            'GET',
            endpoint,
            requestBody,
            credentials.apiSecret
        );
        
        const encryptedPassphrase = generateEncryptedPassphrase(
            credentials.passphrase,
            credentials.apiSecret
        );
        
        const headers = {
            'KC-API-KEY': credentials.apiKey,
            'KC-API-SIGN': signature,
            'KC-API-TIMESTAMP': timestamp,
            'KC-API-PASSPHRASE': encryptedPassphrase,
            'KC-API-KEY-VERSION': '2'
        };
        
        const response = await fetch(KUCOIN_CONFIG.baseURL + endpoint, {
            method: 'GET',
            headers: headers
        });
        
        const responseData = await response.json();
        
        if (response.ok && responseData.code === '200000') {
            console.log('✅ Retrieved active orders successfully');
            return {
                success: true,
                orders: responseData.data.items || []
            };
        } else {
            console.error('❌ Failed to get active orders:', responseData);
            return {
                success: false,
                error: responseData.msg || 'Failed to get active orders'
            };
        }
        
    } catch (error) {
        console.error('❌ Error getting active orders:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        placeKuCoinLimitOrder,
        cancelAllKuCoinOrders,
        getActiveKuCoinOrders,
        generateKuCoinSignature,
        generateEncryptedPassphrase
    };
}

// Make functions available globally in browser
if (typeof window !== 'undefined') {
    window.KuCoinOrderAPI = {
        placeKuCoinLimitOrder,
        cancelAllKuCoinOrders,
        getActiveKuCoinOrders
    };
    
    console.log('📦 KuCoin Order API loaded');
}

