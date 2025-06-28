// Supabase configuration for database operations
const SUPABASE_URL = 'https://fbkcdirkshubectuvxzi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia2NkaXJrc2h1YmVjdHV2eHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NDc0ODAsImV4cCI6MjA2MjAyMzQ4MH0.yhy1JL-V9zQVK1iIdSVK1261qD8gmHmo2vB-qe7Kit8';

document.addEventListener("DOMContentLoaded", function() {
    const webhookEndpointDisplay = document.getElementById("webhook-endpoint-url");
    
    // Set the webhook endpoint URL (this would be your public URL when deployed)
    const webhookEndpoint = "/webhook";
    if (webhookEndpointDisplay) {
        webhookEndpointDisplay.textContent = webhookEndpoint;
    }

    // Get references to important elements
    const currentAmplPriceDisplay = document.getElementById("current-ampl-price");
    const balanceDisplay = document.getElementById("usdt-balance");
    const sellThresholdInput = document.getElementById("sell-threshold");
    const waitForWebhookCheckbox = document.getElementById("wait-for-webhook");
    const sellOnThresholdCheckbox = document.getElementById("sell-threshold-only");
    const amplManagerToggle = document.getElementById("ampl-manager-toggle");

    // Initialize current AMPL price
    let currentAmplPrice = 1.20; // Default value

    // Load settings from Supabase on page load
    loadSettings();

    // Load existing orders and webhooks from Supabase
    loadOrdersFromSupabase();
    loadWebhooksFromSupabase();

    // Set up event listeners for settings
    if (sellThresholdInput) {
        sellThresholdInput.addEventListener('change', saveSettings);
    }
    if (waitForWebhookCheckbox) {
        waitForWebhookCheckbox.addEventListener('change', saveSettings);
    }
    if (sellOnThresholdCheckbox) {
        sellOnThresholdCheckbox.addEventListener('change', saveSettings);
    }

    // Set up AMPL Manager toggle
    if (amplManagerToggle) {
        amplManagerToggle.addEventListener('change', handleAmplManagerToggle);
        // Auto-detect AMPL Manager status on page load
        detectAmplManagerStatus();
    }

    // Function to save settings to Supabase
    async function saveSettings() {
        const settings = {
            sellThreshold: parseFloat(sellThresholdInput?.value || 1.25),
            waitForWebhook: waitForWebhookCheckbox?.checked || false,
            sellOnThreshold: sellOnThresholdCheckbox?.checked || false
        };

        try {
            await window.db.saveSettings(settings);
            console.log('Settings saved successfully');
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    // Function to load settings from Supabase
    async function loadSettings() {
        try {
            const settings = await window.db.getSettings();
            
            if (sellThresholdInput) {
                sellThresholdInput.value = settings.sellThreshold || 1.25;
            }
            if (waitForWebhookCheckbox) {
                waitForWebhookCheckbox.checked = settings.waitForWebhook || false;
            }
            if (sellOnThresholdCheckbox) {
                sellOnThresholdCheckbox.checked = settings.sellOnThreshold || false;
            }
            
            console.log('Settings loaded successfully');
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    // Function to load orders from Supabase and display them
    async function loadOrdersFromSupabase() {
        try {
            const orders = await window.db.getOrders();
            
            // Display orders in the KuCoin Order Log panel
            const orderLogContent = document.querySelector('#kucoin-order-log .panel-content');
            if (orderLogContent && orders.length > 0) {
                orderLogContent.innerHTML = '';
                orders.slice(0, 10).forEach(order => { // Show only last 10 orders
                    const orderData = JSON.parse(order.content);
                    const orderElement = document.createElement('div');
                    orderElement.className = 'order-entry';
                    orderElement.innerHTML = `
                        <div class="timestamp">${new Date(order.created_at).toLocaleTimeString()}</div>
                        <div class="order-details">${JSON.stringify(orderData, null, 2)}</div>
                    `;
                    orderLogContent.appendChild(orderElement);
                });
            }
        } catch (error) {
            console.error("Error loading orders from Supabase:", error);
        }
    }

    // Function to load webhooks from Supabase and display them
    async function loadWebhooksFromSupabase() {
        try {
            const webhooks = await window.db.getWebhooks();
            
            // Display webhooks in the Incoming Webhooks panel
            const webhookContent = document.querySelector('#incoming-webhooks .panel-content');
            if (webhookContent && webhooks.length > 0) {
                webhookContent.innerHTML = '';
                webhooks.slice(0, 20).forEach(webhook => { // Show only last 20 webhooks
                    const webhookData = JSON.parse(webhook.content);
                    const webhookElement = document.createElement('div');
                    webhookElement.className = 'webhook-entry';
                    webhookElement.innerHTML = `
                        <div class="timestamp">${new Date(webhook.created_at).toLocaleTimeString()}</div>
                        <div class="webhook-details">${JSON.stringify(webhookData, null, 2)}</div>
                    `;
                    webhookContent.appendChild(webhookElement);
                });
            }
        } catch (error) {
            console.error("Error loading webhooks from Supabase:", error);
        }
    }

    // Function to save an order to Supabase
    async function saveOrderToSupabase(orderData) {
        try {
            const result = await window.db.saveOrder(orderData);
            console.log('Order saved to Supabase:', result);
            
            // Reload orders to update the display
            loadOrdersFromSupabase();
        } catch (error) {
            console.error("Error saving order to Supabase:", error);
        }
    }

    // Function to save a webhook to Supabase
    async function saveWebhookToSupabase(webhookData) {
        try {
            const result = await window.db.saveWebhook(webhookData);
            console.log('Webhook saved to Supabase:', result);
            
            // Reload webhooks to update the display
            loadWebhooksFromSupabase();
        } catch (error) {
            console.error("Error saving webhook to Supabase:", error);
        }
    }
    
    // Function to fetch real AMPL price from Vercel API route
    async function fetchAmplPrice() {
        try {
            const response = await fetch('/api/ampl/price');
            const data = await response.json();
            
            if (data.price !== undefined) {
                return data.price;
            } else {
                console.error('Invalid price data:', data);
                return null;
            }
        } catch (error) {
            console.error('Error fetching AMPL price:', error);
            return null;
        }
    }
    
    // Function to fetch real balance from Vercel API route
    async function fetchBalance() {
        try {
            const response = await fetch('/api/ampl/balance');
            const data = await response.json();
            
            if (data.usdt && data.usdt.balance !== undefined) {
                return data.usdt.balance;
            } else {
                console.error('Invalid balance data:', data);
                return null;
            }
        } catch (error) {
            console.error('Error fetching balance:', error);
            return null;
        }
    }
    
    // Function to start real AMPL price and balance updates
    function startAmplPriceUpdates() {
        // Initial fetch
        updateAmplPriceAndBalance();
        
        // Update price and balance every 30 seconds
        setInterval(() => {
            updateAmplPriceAndBalance();
        }, 30000);
    }

    // Function to update AMPL price and balance displays
    async function updateAmplPriceAndBalance() {
        try {
            // Fetch and update AMPL price
            const price = await fetchAmplPrice();
            if (price !== null) {
                currentAmplPrice = price;
                if (currentAmplPriceDisplay) {
                    currentAmplPriceDisplay.textContent = price.toFixed(3);
                }
            }

            // Fetch and update balance
            const balance = await fetchBalance();
            if (balance !== null && balanceDisplay) {
                balanceDisplay.textContent = `$${balance.toFixed(2)}`;
            }
        } catch (error) {
            console.error('Error updating price and balance:', error);
        }
    }

    // Function to check if we should place a limit order based on price
    function checkLimitOrderConditions(price) {
        const settings = {
            sellThreshold: parseFloat(sellThresholdInput?.value || 1.25),
            waitForWebhook: waitForWebhookCheckbox?.checked || false,
            sellOnThreshold: sellOnThresholdCheckbox?.checked || false
        };

        if (settings.sellOnThreshold && price >= settings.sellThreshold) {
            return true;
        }

        return false;
    }

    // AMPL Manager Supabase Edge Function integration
    async function toggleAmplManager(enabled) {
        try {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/ampl-manager/toggle`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ enabled })
            });
            
            const data = await response.json();
            console.log('AMPL Manager toggle response:', data);
            return data;
        } catch (error) {
            console.error('Error toggling AMPL Manager:', error);
            return null;
        }
    }

    async function getAmplManagerStatus() {
        try {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/ampl-manager/status`, {
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error getting AMPL Manager status:', error);
            return null;
        }
    }

    async function detectAmplManagerStatus() {
        try {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/ampl-manager/detect`, {
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data && amplManagerToggle) {
                amplManagerToggle.checked = data.active || false;
            }
            
            return data;
        } catch (error) {
            console.error('Error detecting AMPL Manager status:', error);
            return null;
        }
    }

    async function handleAmplManagerToggle() {
        const enabled = amplManagerToggle?.checked || false;
        console.log('AMPL Manager toggled:', enabled);
        
        const result = await toggleAmplManager(enabled);
        if (result) {
            console.log('AMPL Manager successfully toggled');
        }
    }

    // Start AMPL price and balance updates
    startAmplPriceUpdates();
    
    // Auto-detect AMPL Manager status on page load
    detectAmplManagerStatus();

    // Simulate webhook functionality for testing
    window.simulateWebhook = function() {
        const mockWebhook = {
            type: "market",
            side: "sell",
            symbol: "AMPL-USDT",
            price: currentAmplPrice,
            size: 0.1,
            timestamp: new Date().toISOString()
        };

        // Save to Supabase
        saveWebhookToSupabase(mockWebhook);

        // Also save as an order
        saveOrderToSupabase(mockWebhook);

        console.log("Simulated webhook:", mockWebhook);
    };

    // Clear functions for the panels
    window.clearWebhooks = function() {
        window.db.deleteAllWebhooks().then(() => {
            loadWebhooksFromSupabase();
        });
    };

    window.clearOrders = function() {
        window.db.deleteAllOrders().then(() => {
            loadOrdersFromSupabase();
        });
    };

    // Panel toggle functionality
    const panels = document.querySelectorAll('.panel');
    panels.forEach(panel => {
        const header = panel.querySelector('.panel-header');
        const content = panel.querySelector('.panel-content');
        const toggleBtn = header?.querySelector('.panel-toggle');

        if (toggleBtn && content) {
            toggleBtn.addEventListener('click', () => {
                const isCollapsed = content.style.display === 'none';
                content.style.display = isCollapsed ? 'block' : 'none';
                toggleBtn.textContent = isCollapsed ? '▼' : '▲';
            });
        }
    });

    // Sell Price Targets functionality
    const sellTargets = document.querySelectorAll('.sell-target');
    sellTargets.forEach(target => {
        target.addEventListener('click', () => {
            // Remove active class from all targets
            sellTargets.forEach(t => t.classList.remove('active'));
            // Add active class to clicked target
            target.classList.add('active');
            
            // Update the current target display
            const targetPrice = target.textContent;
            const currentTargetDisplay = document.querySelector('.current-target');
            if (currentTargetDisplay) {
                currentTargetDisplay.textContent = `Current Target: ${targetPrice}`;
            }
        });
    });

    // View Controls functionality
    const viewControls = document.querySelectorAll('.view-control');
    viewControls.forEach(control => {
        control.addEventListener('click', () => {
            // Remove active class from all controls
            viewControls.forEach(c => c.classList.remove('active'));
            // Add active class to clicked control
            control.classList.add('active');
        });
    });

    console.log("AmplAlgo dashboard initialized successfully");
});

