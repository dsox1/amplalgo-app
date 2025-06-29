// Supabase configuration for AMPL Manager (global scope)
const SUPABASE_URL = 'https://fbkcdirkshubectuvxzi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia2NkaXJrc2h1YmVjdHV2eHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NDc0ODAsImV4cCI6MjA2MjAyMzQ4MH0.yhy1JL-V9zQVK1iIdSVK1261qD8gmHmo2vB-qe7Kit8';

document.addEventListener("DOMContentLoaded", function() {
    // Initialize variables
    let currentZoom = 30; // Start zoom level at 30%
    let currentThreshold = 1.25; // Default threshold is 1.40
    let waitForWebhook = true; // Default to wait for webhook
    let sellOnThreshold = false; // Default not to sell immediately on threshold
    let currentAmplPrice = 0; // Current AMPL price
    let tvWidget = null; // TradingView widget reference
    let bgAmplAlgoActive = false; // Track if background amplALGO is active
    let bgAmplAlgoTimer = null; // Timer for background amplALGO animation
    
    // DOM Elements
    const zoomInBtn = document.getElementById("zoom-in-btn");
    const zoomOutBtn = document.getElementById("zoom-out-btn");
    const zoomResetBtn = document.getElementById("zoom-reset-btn");
    const currentZoomDisplay = document.getElementById("current-zoom");
    const thresholdButtons = document.querySelectorAll(".threshold-btn");
    const currentThresholdDisplay = document.getElementById("current-threshold");
    const balanceDisplay = document.getElementById("usdt-balance");
    const waitForWebhookCheckbox = document.getElementById("wait-for-webhook");
    const sellOnThresholdCheckbox = document.getElementById("sell-on-threshold");
    const currentAmplPriceDisplay = document.getElementById("current-ampl-price");
    const themeRadios = document.querySelectorAll('input[name="theme"]');
    const luminousAmplAlgoOverlay = document.getElementById("luminous-amplalgo-overlay");
    const webhookEndpointDisplay = document.getElementById("webhook-endpoint-url");
    
    // Set the webhook endpoint URL (this would be your public URL when deployed)
    if (webhookEndpointDisplay) {
        webhookEndpointDisplay.textContent = "/webhook";
    }
    
    // Load initial settings from Supabase
    loadInitialSettings();
    
    // Initialize theme from localStorage (if available)
    initializeTheme();
    
    // Initialize TradingView widget with theme-appropriate chart type
    setTimeout(() => {
        initializeTradingViewWidget();
    }, 1000); // Delay initialization to ensure DOM is ready
    
    // Initialize zoom level display
    updateZoomDisplay();
    
    // Apply initial zoom level (30%) - static for 3 seconds
    applyZoom();
    
    // Hold at 30% for 3 seconds, then animate to 80%
    setTimeout(() => {
        animateZoomTo(80);
    }, 3000); // Wait 3 seconds before starting animation
    
    // Initialize threshold display and highlight active button
    updateThresholdDisplay();
    highlightActiveThresholdButton();
    
    // Initialize flickering lights
    setupFlickeringLights();
    
    // Initialize background amplALGO animation
    initializeBackgroundAmplAlgo();
    
    // Load existing webhooks and orders from Supabase
    loadWebhooksFromSupabase();
    loadOrdersFromSupabase();
    
    // Start AMPL price update interval (now with real API calls)
    startAmplPriceUpdates();
    
    // Initialize AMPL Manager
    detectExistingAmplOrders();
    getAmplManagerStatus();
    
    // Set up AMPL Manager toggle event listener
    const amplManagerCheckbox = document.getElementById('ampl-manager-toggle');
    if (amplManagerCheckbox) {
        amplManagerCheckbox.addEventListener('change', async function() {
            const enable = this.checked;
            console.log(`AMPL Manager toggle clicked: ${enable ? 'ENABLE' : 'DISABLE'}`);
            
            const result = await toggleAmplManager(enable);
            if (!result) {
                // Revert checkbox state on error
                this.checked = !enable;
            }
        });
    }
    
    // Function to animate zoom to a target level
    function animateZoomTo(targetZoom) {
        const startZoom = currentZoom;
        const duration = 1000; // 1 second animation
        const startTime = Date.now();
        
        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            currentZoom = startZoom + (targetZoom - startZoom) * easeProgress;
            applyZoom();
            updateZoomDisplay();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                currentZoom = targetZoom; // Ensure exact final value
                applyZoom();
                updateZoomDisplay();
                
                // When zoom reaches 80%, start showing control panels one by one
                if (targetZoom === 80) {
                    showControlPanelsSequentially();
                }
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    // Function to show control panels one by one with staggered animation
    function showControlPanelsSequentially() {
        const controlPanelsRow = document.querySelector('.control-panels-row');
        if (controlPanelsRow) {
            controlPanelsRow.classList.add('visible');
        }
    }
    
    // Function to load initial settings from Supabase
    async function loadInitialSettings() {
        try {
            const settings = await window.db.getSettings();
            
            // Apply settings to UI and variables
            currentThreshold = settings.sellThreshold || 1.25;
            waitForWebhook = settings.waitForWebhook !== undefined ? settings.waitForWebhook : true;
            sellOnThreshold = settings.sellOnThreshold !== undefined ? settings.sellOnThreshold : false;
            
            // Update UI to match settings
            updateThresholdDisplay();
            highlightActiveThresholdButton();
            
            if (waitForWebhookCheckbox) {
                waitForWebhookCheckbox.checked = waitForWebhook;
            }
            
            if (sellOnThresholdCheckbox) {
                sellOnThresholdCheckbox.checked = sellOnThreshold;
            }
            
            console.log("Settings loaded successfully");
        } catch (error) {
            console.error("Error loading settings from Supabase:", error);
        }
    }
    
    // Function to load webhooks from Supabase
    async function loadWebhooksFromSupabase() {
        try {
            const webhooks = await window.db.getWebhooks();
            
            // Clear existing webhooks
            const webhookContent = document.querySelector(".webhook-display-section .log-content");
            if (webhookContent) {
                webhookContent.innerHTML = '';
                
                if (webhooks.length === 0) {
                    webhookContent.innerHTML = '<p>Waiting for webhook data...</p>';
                } else {
                    // Add each webhook to the display
                    webhooks.forEach(webhook => {
                        try {
                            const webhookData = JSON.parse(webhook.content);
                            addWebhookEntry(webhookData);
                        } catch (e) {
                            console.error("Error parsing webhook data:", e);
                        }
                    });
                }
            }
            
            console.log("Webhooks loaded from Supabase:", webhooks.length);
        } catch (error) {
            console.error("Error loading webhooks from Supabase:", error);
        }
    }
    
    // Function to load orders from Supabase
    async function loadOrdersFromSupabase() {
        try {
            const orders = await window.db.getOrders();
            
            // Clear existing orders
            const orderLogContent = document.querySelector(".order-log-section .log-content");
            if (orderLogContent) {
                orderLogContent.innerHTML = '';
                
                if (orders.length === 0) {
                    orderLogContent.innerHTML = '<p>No orders placed yet...</p>';
                } else {
                    // Add each order to the display
                    orders.forEach(order => {
                        try {
                            const orderData = JSON.parse(order.content);
                            addOrderEntry(orderData);
                        } catch (e) {
                            console.error("Error parsing order data:", e);
                        }
                    });
                }
            }
            
            console.log("Orders loaded from Supabase:", orders.length);
        } catch (error) {
            console.error("Error loading orders from Supabase:", error);
        }
    }
    
    // Function to fetch real AMPL price from Vercel API
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
    
    // Function to fetch real balance from Vercel API
    async function fetchBalance() {
        try {
            const response = await fetch('/api/ampl/balance');
            const data = await response.json();
            
            if (data.balance !== undefined) {
                return data.balance;
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
    
    // Function to update AMPL price and balance with real data
    async function updateAmplPriceAndBalance() {
        // Fetch real AMPL price
        const price = await fetchAmplPrice();
        if (price !== null) {
            currentAmplPrice = price;
            if (currentAmplPriceDisplay) {
                currentAmplPriceDisplay.textContent = price.toFixed(3);
            }
            
            // Check if we should place a limit order based on the new price
            checkAndPlaceLimitOrder(price);
        }
        
        // Fetch real balance
        const balance = await fetchBalance();
        if (balance !== null) {
            // Update balance display
            if (balanceDisplay) {
                balanceDisplay.textContent = `$${balance.toFixed(2)}`;
            }
        }
    }
    
    // Function to check if we should place a limit order based on price
    function checkAndPlaceLimitOrder(price) {
        // Only proceed if we're waiting for webhook signal and sell on threshold is enabled
        if (!waitForWebhook && sellOnThreshold && price >= currentThreshold) {
            console.log(`Price ${price} reached threshold ${currentThreshold}, placing limit order...`);
            // Here you would implement the actual order placement logic
            // For now, just log the action
            addOrderEntry({
                type: "sell",
                price: price,
                amount: "100",
                timestamp: new Date().toISOString(),
                status: "placed"
            });
        }
    }
    
    // AMPL Manager Supabase Edge Function integration
    async function detectExistingAmplOrders() {
        try {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/ampl-manager-detect`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            console.log('AMPL Manager detection result:', result);
            
            // Update UI based on detection result
            const amplManagerCheckbox = document.getElementById('ampl-manager-toggle');
            if (amplManagerCheckbox && result.hasActiveOrders) {
                amplManagerCheckbox.checked = true;
            }
        } catch (error) {
            console.error('Error detecting existing AMPL orders:', error);
        }
    }
    
    async function getAmplManagerStatus() {
        try {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/ampl-manager-status`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            console.log('AMPL Manager status:', result);
            
            // Update UI based on status
            const amplManagerCheckbox = document.getElementById('ampl-manager-toggle');
            if (amplManagerCheckbox) {
                amplManagerCheckbox.checked = result.isActive || false;
            }
        } catch (error) {
            console.error('Error getting AMPL Manager status:', error);
        }
    }
    
    async function toggleAmplManager(enable) {
        try {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/ampl-manager-toggle`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ enable })
            });
            
            const result = await response.json();
            console.log('AMPL Manager toggle result:', result);
            
            if (result.success) {
                console.log(`AMPL Manager ${enable ? 'enabled' : 'disabled'} successfully`);
                return true;
            } else {
                console.error('Failed to toggle AMPL Manager:', result.error);
                return false;
            }
        } catch (error) {
            console.error('Error toggling AMPL Manager:', error);
            return false;
        }
    }
    
    // Zoom control functions
    function applyZoom() {
        const zoomFactor = currentZoom / 100;
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.style.transform = `scale(${zoomFactor})`;
            mainContent.style.transformOrigin = 'top left';
        }
    }
    
    function updateZoomDisplay() {
        if (currentZoomDisplay) {
            currentZoomDisplay.textContent = `${Math.round(currentZoom)}%`;
        }
    }
    
    // Zoom button event listeners
    if (zoomInBtn) {
        zoomInBtn.addEventListener("click", function() {
            if (currentZoom < 100) {
                currentZoom = Math.min(currentZoom + 10, 100);
                applyZoom();
                updateZoomDisplay();
            }
        });
    }
    
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener("click", function() {
            if (currentZoom > 20) {
                currentZoom = Math.max(currentZoom - 10, 20);
                applyZoom();
                updateZoomDisplay();
            }
        });
    }
    
    if (zoomResetBtn) {
        zoomResetBtn.addEventListener("click", function() {
            currentZoom = 80;
            applyZoom();
            updateZoomDisplay();
        });
    }
    
    // Threshold button functions
    function updateThresholdDisplay() {
        if (currentThresholdDisplay) {
            currentThresholdDisplay.textContent = currentThreshold.toFixed(2);
        }
    }
    
    function highlightActiveThresholdButton() {
        thresholdButtons.forEach(btn => {
            const btnValue = parseFloat(btn.dataset.threshold);
            if (Math.abs(btnValue - currentThreshold) < 0.01) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });
    }
    
    // Threshold button event listeners
    thresholdButtons.forEach(btn => {
        btn.addEventListener("click", async function() {
            const newThreshold = parseFloat(this.dataset.threshold);
            currentThreshold = newThreshold;
            updateThresholdDisplay();
            highlightActiveThresholdButton();
            
            // Save to Supabase
            try {
                await window.db.updateSettings({ sellThreshold: currentThreshold });
                console.log("Threshold updated in Supabase:", currentThreshold);
            } catch (error) {
                console.error("Error updating threshold in Supabase:", error);
            }
        });
    });
    
    // Checkbox event listeners
    if (waitForWebhookCheckbox) {
        waitForWebhookCheckbox.addEventListener("change", async function() {
            waitForWebhook = this.checked;
            console.log("Wait for webhook:", waitForWebhook);
            
            // Save to Supabase
            try {
                await window.db.updateSettings({ waitForWebhook: waitForWebhook });
                console.log("Wait for webhook setting updated in Supabase:", waitForWebhook);
            } catch (error) {
                console.error("Error updating wait for webhook setting in Supabase:", error);
            }
        });
    }
    
    if (sellOnThresholdCheckbox) {
        sellOnThresholdCheckbox.addEventListener("change", async function() {
            sellOnThreshold = this.checked;
            console.log("Sell on threshold:", sellOnThreshold);
            
            // Save to Supabase
            try {
                await window.db.updateSettings({ sellOnThreshold: sellOnThreshold });
                console.log("Sell on threshold setting updated in Supabase:", sellOnThreshold);
            } catch (error) {
                console.error("Error updating sell on threshold setting in Supabase:", error);
            }
        });
    }
    
    // Theme functions
    function initializeTheme() {
        const savedTheme = localStorage.getItem('amplalgo-theme') || 'color';
        
        // Set the radio button
        const themeRadio = document.querySelector(`input[name="theme"][value="${savedTheme}"]`);
        if (themeRadio) {
            themeRadio.checked = true;
        }
        
        // Apply the theme
        applyTheme(savedTheme);
    }
    
    function applyTheme(theme) {
        document.body.className = `theme-${theme}`;
        localStorage.setItem('amplalgo-theme', theme);
        
        // Update TradingView widget if it exists
        if (tvWidget) {
            updateTradingViewTheme(theme);
        }
    }
    
    // Theme radio button event listeners
    themeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                applyTheme(this.value);
            }
        });
    });
    
    // TradingView widget functions
    function initializeTradingViewWidget() {
        const chartContainer = document.getElementById('tradingview-chart');
        if (!chartContainer) return;
        
        const currentTheme = localStorage.getItem('amplalgo-theme') || 'color';
        const chartTheme = getChartTheme(currentTheme);
        
        tvWidget = new TradingView.widget({
            "width": "100%",
            "height": "100%",
            "symbol": "KUCOIN:AMPLUSDT",
            "interval": "1h",
            "timezone": "Etc/UTC",
            "theme": chartTheme,
            "style": "1",
            "locale": "en",
            "toolbar_bg": "#f1f3f6",
            "enable_publishing": false,
            "hide_top_toolbar": false,
            "hide_legend": true,
            "save_image": false,
            "container_id": "tradingview-chart",
            "studies": [
                "Volume@tv-basicstudies"
            ]
        });
    }
    
    function getChartTheme(appTheme) {
        switch(appTheme) {
            case 'mono': return 'light';
            case 'bw': return 'dark';
            case 'color':
            default: return 'dark';
        }
    }
    
    function updateTradingViewTheme(theme) {
        // TradingView doesn't support dynamic theme changes
        // We would need to recreate the widget
        if (tvWidget) {
            const chartContainer = document.getElementById('tradingview-chart');
            if (chartContainer) {
                chartContainer.innerHTML = '';
                setTimeout(() => {
                    initializeTradingViewWidget();
                }, 100);
            }
        }
    }
    
    // Flickering lights setup
    function setupFlickeringLights() {
        const lights = document.querySelectorAll('.flicker-light');
        
        lights.forEach(light => {
            setInterval(() => {
                if (Math.random() < 0.1) { // 10% chance to flicker
                    light.style.opacity = Math.random() * 0.5 + 0.5;
                    setTimeout(() => {
                        light.style.opacity = 1;
                    }, 100 + Math.random() * 200);
                }
            }, 1000 + Math.random() * 2000);
        });
    }
    
    // Background amplALGO animation
    function initializeBackgroundAmplAlgo() {
        if (!luminousAmplAlgoOverlay) return;
        
        // Start the background animation after a delay
        setTimeout(() => {
            startBackgroundAmplAlgo();
        }, 5000);
    }
    
    function startBackgroundAmplAlgo() {
        if (bgAmplAlgoActive) return;
        
        bgAmplAlgoActive = true;
        luminousAmplAlgoOverlay.classList.add('active');
        
        // Stop after 10 seconds
        bgAmplAlgoTimer = setTimeout(() => {
            stopBackgroundAmplAlgo();
        }, 10000);
    }
    
    function stopBackgroundAmplAlgo() {
        bgAmplAlgoActive = false;
        if (luminousAmplAlgoOverlay) {
            luminousAmplAlgoOverlay.classList.remove('active');
        }
        
        if (bgAmplAlgoTimer) {
            clearTimeout(bgAmplAlgoTimer);
            bgAmplAlgoTimer = null;
        }
        
        // Restart after a random delay (30-60 seconds)
        setTimeout(() => {
            startBackgroundAmplAlgo();
        }, 30000 + Math.random() * 30000);
    }
    
    // Webhook and order entry functions
    function addWebhookEntry(data) {
        const webhookContent = document.querySelector(".webhook-display-section .log-content");
        if (!webhookContent) return;
        
        // Clear "waiting" message if it exists
        if (webhookContent.innerHTML.includes("Waiting for webhook data")) {
            webhookContent.innerHTML = '';
        }
        
        const entry = document.createElement('div');
        entry.className = 'webhook-entry';
        entry.innerHTML = `
            <div class="webhook-header">
                <span class="webhook-action">${data.action || 'Unknown'}</span>
                <span class="webhook-time">${new Date(data.timestamp || Date.now()).toLocaleTimeString()}</span>
            </div>
            <div class="webhook-details">
                <div>Symbol: ${data.ticker || 'N/A'}</div>
                <div>Price: $${data.price || 'N/A'}</div>
                <div>Amount: ${data.amount || 'N/A'}</div>
            </div>
        `;
        
        webhookContent.insertBefore(entry, webhookContent.firstChild);
        
        // Keep only the last 10 entries
        while (webhookContent.children.length > 10) {
            webhookContent.removeChild(webhookContent.lastChild);
        }
    }
    
    function addOrderEntry(data) {
        const orderLogContent = document.querySelector(".order-log-section .log-content");
        if (!orderLogContent) return;
        
        // Clear "no orders" message if it exists
        if (orderLogContent.innerHTML.includes("No orders placed yet")) {
            orderLogContent.innerHTML = '';
        }
        
        const entry = document.createElement('div');
        entry.className = 'order-entry';
        entry.innerHTML = `
            <div class="order-header">
                <span class="order-type">${data.type || 'Unknown'}</span>
                <span class="order-status">${data.status || 'Unknown'}</span>
                <span class="order-time">${new Date(data.timestamp || Date.now()).toLocaleTimeString()}</span>
            </div>
            <div class="order-details">
                <div>Price: $${data.price || 'N/A'}</div>
                <div>Amount: ${data.amount || 'N/A'}</div>
            </div>
        `;
        
        orderLogContent.insertBefore(entry, orderLogContent.firstChild);
        
        // Keep only the last 10 entries
        while (orderLogContent.children.length > 10) {
            orderLogContent.removeChild(orderLogContent.lastChild);
        }
    }
    
    // Simulate webhook button
    const simulateWebhookBtn = document.getElementById('simulate-webhook-btn');
    if (simulateWebhookBtn) {
        simulateWebhookBtn.addEventListener('click', function() {
            const mockWebhookData = {
                action: 'BUY',
                ticker: 'AMPL',
                price: (Math.random() * 0.5 + 1.0).toFixed(3),
                amount: (Math.random() * 1000 + 100).toFixed(0),
                timestamp: new Date().toISOString()
            };
            
            addWebhookEntry(mockWebhookData);
            
            // Also save to Supabase
            if (window.db && window.db.saveWebhook) {
                window.db.saveWebhook(mockWebhookData);
            }
        });
    }
    
    console.log("AmplAlgo dashboard initialized successfully");
});

// Global functions for external access
window.amplAlgo = {
    addWebhookEntry: function(data) {
        // This function can be called from external scripts
        const event = new CustomEvent('addWebhookEntry', { detail: data });
        document.dispatchEvent(event);
    },
    
    addOrderEntry: function(data) {
        // This function can be called from external scripts
        const event = new CustomEvent('addOrderEntry', { detail: data });
        document.dispatchEvent(event);
    }
};

// Listen for custom events
document.addEventListener('addWebhookEntry', function(e) {
    addWebhookEntry(e.detail);
});

document.addEventListener('addOrderEntry', function(e) {
    addOrderEntry(e.detail);
});

