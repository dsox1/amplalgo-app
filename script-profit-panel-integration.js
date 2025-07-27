/**
 * AMPL Profit Panel Integration for script.js
 * 
 * Add this code to your script.js file to integrate the profit panel
 * with the "Show Ladder Panel" checkbox functionality
 */

// Add this to your existing script.js file, preferably in the DOMContentLoaded event listener

// Profit Panel Integration
// document.addEventListener("DOMContentLoaded", function() { // This listener is already in script.js
    // Find the Show Ladder Panel checkbox
    const showLadderPanelCheckbox = document.getElementById("show-ladder-panel");
    const amplProfitPanel = document.getElementById("ampl-profit-panel") || 
                           document.querySelector(".ampl-profit-panel") ||
                           document.querySelector("[data-panel=\'profit\']");
    
    // Initialize profit panel as hidden
    if (amplProfitPanel) {
        amplProfitPanel.style.display = 'none';
        amplProfitPanel.style.opacity = '0';
        amplProfitPanel.style.transform = 'translateY(-20px)';
        amplProfitPanel.style.transition = 'all 0.3s ease-in-out';
    }
    
    // Handle Show Ladder Panel checkbox change
    if (showLadderPanelCheckbox && amplProfitPanel) {
        showLadderPanelCheckbox.addEventListener('change', function() {
            if (this.checked) {
                showAmplProfitPanel();
            } else {
                hideAmplProfitPanel();
            }
        });
    }
    
    function showAmplProfitPanel() {
        if (amplProfitPanel) {
            console.log('🎯 Showing AMPL Profit Panel');
            
            // Show the panel
            amplProfitPanel.style.display = 'block';
            
            // Trigger reflow
            amplProfitPanel.offsetHeight;
            
            // Animate in
            setTimeout(() => {
                amplProfitPanel.style.opacity = '1';
                amplProfitPanel.style.transform = 'translateY(0)';
            }, 50);
            
            // Initialize the profit panel if it has an initialization function
            if (typeof window.amplProfitPanelFixed !== 'undefined' && 
                typeof window.amplProfitPanelFixed.initialize === 'function') {
                window.amplProfitPanelFixed.initialize();
            }
            
            // Start profit panel updates
            if (typeof window.amplProfitPanelFixed !== 'undefined' && 
                typeof window.amplProfitPanelFixed.startUpdates === 'function') {
                window.amplProfitPanelFixed.startUpdates();
            }
            
            // Update panel data
            updateAmplProfitPanelData();
            
            // Start updating profit panel every 5 seconds
            if (!window.profitPanelUpdateInterval) {
                window.profitPanelUpdateInterval = setInterval(updateAmplProfitPanelData, 5000);
            }
        }
    }
    
    function hideAmplProfitPanel() {
        if (amplProfitPanel) {
            console.log('🎯 Hiding AMPL Profit Panel');
            
            // Animate out
            amplProfitPanel.style.opacity = '0';
            amplProfitPanel.style.transform = 'translateY(-20px)';
            
            // Hide after animation
            setTimeout(() => {
                amplProfitPanel.style.display = 'none';
            }, 300);
            
            // Stop profit panel updates
            if (window.profitPanelUpdateInterval) {
                clearInterval(window.profitPanelUpdateInterval);
                window.profitPanelUpdateInterval = null;
            }
            
            // Stop profit panel if it has a stop function
            if (typeof window.amplProfitPanelFixed !== 'undefined' && 
                typeof window.amplProfitPanelFixed.stop === 'function') {
                window.amplProfitPanelFixed.stop();
            }
        }
    }
    
    function updateAmplProfitPanelData() {
        // Update KuCoin AMPL Price
        const priceElement = document.querySelector('#ampl-profit-panel .kucoin-price-value') ||
                           document.querySelector('.ampl-profit-panel .kucoin-price-value');
        if (priceElement) {
            // Get current AMPL price from existing elements or variables
            const currentPrice = getCurrentAmplPrice();
            if (currentPrice) {
                priceElement.textContent = `$${currentPrice.toFixed(4)}`;
            }
        }
        
        // Update USDT Balance
        const balanceElement = document.querySelector('#ampl-profit-panel .usdt-balance-value') ||
                             document.querySelector('.ampl-profit-panel .usdt-balance-value');
        if (balanceElement) {
            // Get current USDT balance from existing elements
            const currentBalance = getCurrentUsdtBalance();
            if (currentBalance) {
                balanceElement.textContent = `$${currentBalance.toFixed(2)}`;
            }
        }
        
        // Update Active Positions
        const positionsElement = document.querySelector('#ampl-profit-panel .active-positions-value') ||
                                document.querySelector('.ampl-profit-panel .active-positions-value');
        if (positionsElement && typeof tradingState !== 'undefined') {
            positionsElement.textContent = tradingState.active_trades || 0;
        }
        
        // Update Sell Orders
        const ordersElement = document.querySelector('#ampl-profit-panel .sell-orders-value') ||
                            document.querySelector('.ampl-profit-panel .sell-orders-value');
        if (ordersElement && typeof tradingState !== 'undefined') {
            const sellOrders = tradingState.openSellOrders ? tradingState.openSellOrders.length : 0;
            ordersElement.textContent = sellOrders;
        }
        
        // Log activity
        logAmplProfitActivity('System monitoring active', 'info');
    }
    
    function getCurrentAmplPrice() {
        // Try to get price from existing elements or variables
        const priceElement = document.getElementById('current-ampl-price');
        if (priceElement && priceElement.textContent) {
            const priceText = priceElement.textContent.replace('$', '');
            const price = parseFloat(priceText);
            if (!isNaN(price)) {
                return price;
            }
        }
        
        // Try global variable
        if (typeof currentAmplPrice !== 'undefined' && currentAmplPrice > 0) {
            return currentAmplPrice;
        }
        
        // Fallback to a default or API call
        return 1.420; // Default fallback
    }
    
    function getCurrentUsdtBalance() {
        // Try to get balance from existing elements
        const balanceElement = document.getElementById('usdt-balance');
        if (balanceElement && balanceElement.textContent) {
            const balance = parseFloat(balanceElement.textContent);
            if (!isNaN(balance)) {
                return balance;
            }
        }
        
        // Fallback
        return 0.00;
    }
    
    function logAmplProfitActivity(message, type = 'info') {
        const activityLog = document.querySelector('#ampl-profit-panel .activity-log') ||
                          document.querySelector('.ampl-profit-panel .activity-log');
        
        if (activityLog) {
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = document.createElement('div');
            logEntry.className = `log-entry log-${type}`;
            logEntry.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${message}`;
            
            // Add to top of log
            activityLog.insertBefore(logEntry, activityLog.firstChild);
            
            // Limit log entries to 50
            const entries = activityLog.querySelectorAll('.log-entry');
            if (entries.length > 50) {
                entries[entries.length - 1].remove();
            }
        }
    }
    
    // Integration with existing buy order functionality
    // When a buy order is filled, add it to the profit panel
    const originalPlaceLimitOrder = window.placeLimitOrder;
    if (originalPlaceLimitOrder) {
        window.placeLimitOrder = function(threshold) {
            const result = originalPlaceLimitOrder.call(this, threshold);
            
            // Log to profit panel
            logAmplProfitActivity(`Limit order placed at $${threshold}`, 'success');
            
            return result;
        };
    }
    
    // Integration with existing market order functionality
    const originalPlaceMarketOrder = window.placeMarketOrder;
    if (originalPlaceMarketOrder) {
        window.placeMarketOrder = function() {
            const result = originalPlaceMarketOrder.call(this);
            
            // Log to profit panel
            logAmplProfitActivity(`Market order executed at $${getCurrentAmplPrice()}`, 'success');
            
            return result;
        };
    }
    
    // Make functions globally available for external calls
    window.showAmplProfitPanel = showAmplProfitPanel;
    window.hideAmplProfitPanel = hideAmplProfitPanel;
    window.updateAmplProfitPanelData = updateAmplProfitPanelData;
    window.logAmplProfitActivity = logAmplProfitActivity;
    
    console.log('✅ AMPL Profit Panel integration loaded');
// }); // This listener is already in script.js

/**
 * INTEGRATION INSTRUCTIONS:
 * 
 * 1. ADD TO SCRIPT.JS:
 *    - Copy this entire code block into your script.js file
 *    - Place it within the existing DOMContentLoaded event listener
 *    - Or add it as a separate DOMContentLoaded listener
 * 
 * 2. ENSURE DEPENDENCIES:
 *    - Make sure ampl-profit-panel-fixed-integration.js is loaded first
 *    - Ensure the Show Ladder Panel checkbox exists with id="show-ladder-panel"
 *    - Ensure the profit panel exists with id="ampl-profit-panel"
 * 
 * 3. EXTERNAL CALLS:
 *    - showAmplProfitPanel() - Show the panel programmatically
 *    - hideAmplProfitPanel() - Hide the panel programmatically
 *    - updateAmplProfitPanelData() - Update panel data manually
 *    - logAmplProfitActivity(message, type) - Add log entry
 * 
 * 4. AUTOMATIC FEATURES:
 *    - Panel shows/hides with Show Ladder Panel checkbox
 *    - Integrates with existing trading functions
 *    - Updates data every 5 seconds when visible
 *    - Logs trading activity automatically
 */


