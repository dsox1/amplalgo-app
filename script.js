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
    
    // Supabase configuration for AMPL Manager
    const SUPABASE_URL = 'https://fbkcdirkshubectuvxzi.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia2NkaXJrc2h1YmVjdHV2eHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NDc0ODAsImV4cCI6MjA2MjAyMzQ4MH0.yhy1JL-V9zQVK1iIdSVK1261qD8gmHmo2vB-qe7Kit8';
    
    // Set the webhook endpoint URL (this would be your public URL when deployed)
    if (webhookEndpointDisplay) {
        webhookEndpointDisplay.textContent = "/webhook";
    }
    
    // Enhanced Trading Logic - Merged from advanced script
    let ladderOrders = [];
    let autoLadderEnabled = true;
    let tradingState = {
        lastTradePrice: null,
        openSellOrders: [],
        ladderDeployed: false,
        rebaseProtectionActive: true,
        tradingHistory: [],
        active_trades: 0,
        pendingTrades: 0,
        accumulatedBuyOrders: 0,
        currentRebaseValue: 0
    };

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
    
    // Apply initial zoom level (30%) - static for 2 seconds
    applyZoom();
    
    // Hold at 30% for 2 seconds, then animate to 80%
    setTimeout(() => {
        animateZoomTo(80);
    }, 2000); // Wait 2 seconds before starting animation
    
    // Initialize threshold display and highlight active button
    updateThresholdDisplay();
    highlightActiveThresholdButton();
    
    // Initialize flickering lights
    setupFlickeringLights();
    
    // Initialize background amplALGO animation
    initializeBackgroundAmplAlgo();
    
    // Initialize ladder management
    initializeLadderControls();
    
    // Start updating large digit displays
    startLargeDigitUpdates();
    
    // Load existing webhooks and orders from Supabase
    loadWebhooksFromSupabase();
    loadOrdersFromSupabase();
    
    // Start AMPL price update interval (simulating real-time updates)
    startAmplPriceUpdates();
    
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
            
            console.log("Settings loaded from Supabase:", settings);
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

    // Function to fetch real balance from Supabase (REPLACE)
    async function fetchRealBalance() {
        try {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/ampl-manager/balance`, {
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
        
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        
            const data = await response.json();
        
            if (data.usdt && balanceDisplay) {
                balanceDisplay.textContent = data.usdt.balance.toFixed(2);
            }
        
            console.log('Balance updated via Supabase:', data.usdt?.balance);
        } catch (error) {
            console.error('Error fetching balance from Supabase:', error);
            if (balanceDisplay) {
                balanceDisplay.textContent = 'Loading...';
            }
        }
    }

    // Function to fetch real AMPL price from Supabase (REPLACE)
    async function fetchRealPrice() {
        try {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/ampl-manager/price`, {
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
        
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        
            const data = await response.json();
        
            if (data.price) {
                updateAmplPrice(data.price);
            }
        
            console.log('Price updated via Supabase:', data.price);
        } catch (error) {
            console.error('Error fetching price from Supabase:', error);
            // Fallback to simulated price if API fails
            const fallbackPrice = 1.20 + (Math.random() - 0.5) * 0.02;
            updateAmplPrice(fallbackPrice);
        }
    }
       
    // Function to update AMPL price display
    function updateAmplPrice(price) {
        currentAmplPrice = price;
        if (currentAmplPriceDisplay) {
            currentAmplPriceDisplay.textContent = price.toFixed(3);
        }
    }
    
    // Function to start real price and balance updates
    function startAmplPriceUpdates() {
        // Initial fetch of both price and balance
        fetchRealPrice();
        fetchRealBalance();
    
        // Update price every 30 seconds
        setInterval(() => {
            fetchRealPrice();
        }, 30000);

        // Update balance every 60 seconds
        setInterval(() => {
            fetchRealBalance();
        }, 60000);
    }
    
    // Function to check if we should place a limit order based on price
    function checkAndPlaceLimitOrder(price) {
        // If sell on threshold is enabled and price is above threshold, place a limit order
        if (sellOnThreshold && price > currentThreshold) {
            placeLimitOrder(currentThreshold);
        }
    }
    
    // Function to initialize and start the luminous amplALGO overlay animation
    function initializeBackgroundAmplAlgo() {
        // Only start if we're in color theme
        const currentTheme = localStorage.getItem('amplAlgoTheme') || 'color';
        if (currentTheme === 'color') {
            startBackgroundAmplAlgo();
        }
    }
    
    // Function to start the luminous amplALGO overlay animation cycle
    function startBackgroundAmplAlgo() {
        // Clear any existing timers to prevent duplicates
        stopBackgroundAmplAlgo();
        
        // Start the animation immediately
        activateBackgroundAmplAlgo();
        
        // Set up the cycle: 3 minutes on, then off, repeat
        bgAmplAlgoTimer = setInterval(() => {
            if (bgAmplAlgoActive) {
                deactivateBackgroundAmplAlgo();
            } else {
                activateBackgroundAmplAlgo();
            }
        }, 3 * 60 * 1000); // 3 minutes in milliseconds
    }
    
    // Function to stop the luminous amplALGO overlay animation
    function stopBackgroundAmplAlgo() {
        if (bgAmplAlgoTimer) {
            clearInterval(bgAmplAlgoTimer);
            bgAmplAlgoTimer = null;
        }
        deactivateBackgroundAmplAlgo();
    }
    
    // Function to activate the luminous amplALGO effects
    function activateBackgroundAmplAlgo() {
        // Activate luminous title effect
        const luminousTitle = document.querySelector(".luminous-title");
        if (luminousTitle) {
            luminousTitle.classList.add('active');
        }
        
        bgAmplAlgoActive = true;
        console.log('Luminous amplALGO effects activated for 3 minutes');
    }
    
    // Function to deactivate the luminous amplALGO effects
    function deactivateBackgroundAmplAlgo() {
        // Deactivate luminous title effect
        const luminousTitle = document.querySelector(".luminous-title");
        if (luminousTitle) {
            luminousTitle.classList.remove('active');
        }
        
        bgAmplAlgoActive = false;
        console.log('Luminous amplALGO effects deactivated for 3 minutes');
    }
    
    // Event Listeners for Zoom Controls
    if (zoomInBtn) {
        zoomInBtn.addEventListener("click", function() {
            if (currentZoom < 100) { // Limit maximum zoom to 100%
                currentZoom += 5;
                applyZoom();
                updateZoomDisplay();
            }
        });
    }
    
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener("click", function() {
            if (currentZoom > 50) {
                currentZoom -= 5;
                applyZoom();
                updateZoomDisplay();
            }
        });
    }
    
    if (zoomResetBtn) {
        zoomResetBtn.addEventListener("click", function() {
            currentZoom = 80; // Reset to default 80%
            applyZoom();
            updateZoomDisplay();
        });
    }
    
    // Event Listeners for Threshold Buttons
    thresholdButtons.forEach(button => {
        button.addEventListener("click", function() {
            const threshold = parseFloat(this.getAttribute("data-value"));
            currentThreshold = threshold;
            updateThresholdDisplay();
            highlightActiveThresholdButton();
            
            // Save settings to Supabase
            saveSettings();
            
            // If sell on threshold is enabled, place a limit order at the new threshold
            if (sellOnThreshold) {
                placeLimitOrder(threshold);
                console.log(`Limit order placed immediately for threshold: ${threshold} (sellOnThreshold is enabled)`);
            }
            
            console.log(`Sell target price set to: ${threshold}`);
        });
    });
    
    // Event Listeners for Sell Behavior Checkboxes - FIXED VERSION
    if (waitForWebhookCheckbox) {
        waitForWebhookCheckbox.addEventListener("change", function() {
            console.log(`Wait for webhook checkbox changed to: ${this.checked}`);
            
            if (this.checked) {
                // Enable wait for webhook mode
                waitForWebhook = true;
                sellOnThreshold = false;
                
                // Uncheck the other checkbox
                if (sellOnThresholdCheckbox) {
                    sellOnThresholdCheckbox.checked = false;
                }
                
                // Save settings to Supabase
                saveSettings();
                
                console.log("✅ Sell behavior updated: Wait for webhook (market order)");
                console.log(`Variables state - waitForWebhook: ${waitForWebhook}, sellOnThreshold: ${sellOnThreshold}`);
            } else {
                // If unchecked, don't change anything - let the other checkbox handle it
                console.log("Wait for webhook unchecked - no action taken");
            }
        });
    }
    
    if (sellOnThresholdCheckbox) {
        sellOnThresholdCheckbox.addEventListener("change", function() {
            console.log(`Sell on threshold checkbox changed to: ${this.checked}`);
            
            if (this.checked) {
                // Enable sell on threshold mode
                waitForWebhook = false;
                sellOnThreshold = true;
                
                // Uncheck the other checkbox
                if (waitForWebhookCheckbox) {
                    waitForWebhookCheckbox.checked = false;
                }
                
                // Save settings to Supabase
                saveSettings();
                
                console.log("✅ Sell behavior updated: Sell on threshold (limit order)");
                console.log(`Variables state - waitForWebhook: ${waitForWebhook}, sellOnThreshold: ${sellOnThreshold}`);
                
                // FIXED: Always place a limit order when this option is selected
                // Removed the currentAmplPrice > 0 condition that was preventing orders
                if (currentThreshold > 0) {
                    placeLimitOrder(currentThreshold);
                    console.log(`🎯 Limit order placed immediately at threshold: ${currentThreshold}`);
                } else {
                    console.log("❌ Cannot place limit order - currentThreshold is 0");
                }
            } else {
                // If unchecked, don't change anything - let the other checkbox handle it
                console.log("Sell on threshold unchecked - no action taken");
            }
        });
    }
    
    // Event Listeners for Theme Radio Buttons
    if (themeRadios) {
        themeRadios.forEach(radio => {
            radio.addEventListener("change", function() {
                applyTheme(this.value);
                
                // Update chart type based on theme
                updateChartTypeForTheme(this.value);
            });
        });
    }
    
    // Function to save settings to Supabase
    async function saveSettings() {
        try {
            const settings = {
                sellThreshold: currentThreshold,
                waitForWebhook: waitForWebhook,
                sellOnThreshold: sellOnThreshold
            };
            
            await window.db.saveSettings(settings);
            console.log("💾 Settings saved to Supabase:", settings);
        } catch (error) {
            console.error("❌ Error saving settings to Supabase:", error);
        }
    }
    
    // Function to place a limit order - ENHANCED WITH BETTER LOGGING
    function placeLimitOrder(price) {
        console.log(`🔄 Attempting to place limit order at price: ${price}`);
        
        const orderData = {
            type: "limit",
            side: "sell",
            symbol: "AMPL-USDT",
            price: price,
            size: 0.1, // Example size
            timestamp: new Date().toISOString()
        };
        
        try {
            // Save order to Supabase
            window.db.saveOrder(orderData);
            
            // Add order to the UI
            addOrderEntry(orderData);
            
            console.log(`✅ Limit order placed successfully at price: ${price}`);
            console.log(`📊 Order details:`, orderData);
        } catch (error) {
            console.error(`❌ Error placing limit order:`, error);
        }
    }
    
    // Function to place a market order
    function placeMarketOrder() {
        const orderData = {
            type: "market",
            side: "sell",
            symbol: "AMPL-USDT",
            price: currentAmplPrice,
            size: 0.1, // Example size
            timestamp: new Date().toISOString()
        };
        
        // Save order to Supabase
        window.db.saveOrder(orderData);
        
        // Add order to the UI
        addOrderEntry(orderData);
        
        console.log(`Market order placed at price: ${currentAmplPrice}`);
    }
    
    // Function to add a webhook entry to the UI
    function addWebhookEntry(data) {
        const webhookContent = document.querySelector(".webhook-display-section .log-content");
        if (webhookContent) {
            // Remove the "Waiting for webhook data..." message if it exists
            if (webhookContent.innerHTML.includes("Waiting for webhook data...")) {
                webhookContent.innerHTML = '';
            }
            
            // Create a new entry
            const entry = document.createElement("div");
            entry.className = "webhook-entry";
            
            // Format the data nicely
            let formattedData = '';
            if (typeof data === 'object') {
                formattedData = JSON.stringify(data, null, 2);
            } else {
                formattedData = data.toString();
            }
            
            // Add timestamp
            const timestamp = new Date().toLocaleTimeString();
            
            entry.innerHTML = `
                <div class="entry-header">
                    <span class="timestamp">${timestamp}</span>
                </div>
                <pre class="entry-content">${formattedData}</pre>
            `;
            
            // Add to the top of the list
            webhookContent.insertBefore(entry, webhookContent.firstChild);
            
            // If this is a sell signal and we're waiting for webhooks, place a market order
            if (waitForWebhook && data.action === 'sell') {
                placeMarketOrder();
            }
        }
    }
    
    // Function to add an order entry to the UI
    function addOrderEntry(data) {
        const orderLogContent = document.querySelector(".order-log-section .log-content");
        if (orderLogContent) {
            // Remove the "No orders placed yet..." message if it exists
            if (orderLogContent.innerHTML.includes("No orders placed yet...")) {
                orderLogContent.innerHTML = '';
            }
            
            // Create a new entry
            const entry = document.createElement("div");
            entry.className = "order-entry";
            
            // Format the data nicely
            let formattedData = '';
            if (typeof data === 'object') {
                formattedData = JSON.stringify(data, null, 2);
            } else {
                formattedData = data.toString();
            }
            
            // Add timestamp
            const timestamp = new Date().toLocaleTimeString();
            
            entry.innerHTML = `
                <div class="entry-header">
                    <span class="timestamp">${timestamp}</span>
                </div>
                <pre class="entry-content">${formattedData}</pre>
            `;
            
            // Add to the top of the list
            orderLogContent.insertBefore(entry, orderLogContent.firstChild);
        }
    }
    
    // Function to apply zoom level
    function applyZoom() {
        const zoomFactor = currentZoom / 100;
        const contentWrapper = document.querySelector('.content-wrapper');
        if (contentWrapper) {
            contentWrapper.style.transform = `scale(${zoomFactor})`;
            contentWrapper.style.transformOrigin = 'center top';
        }
    }
    
    // Function to update zoom display
    function updateZoomDisplay() {
        if (currentZoomDisplay) {
            currentZoomDisplay.textContent = Math.round(currentZoom) + '%';
        }
    }
    
    // Function to update threshold display
    function updateThresholdDisplay() {
        if (currentThresholdDisplay) {
            currentThresholdDisplay.textContent = currentThreshold.toFixed(2);
        }
    }
    
    // Function to highlight the active threshold button
    function highlightActiveThresholdButton() {
        thresholdButtons.forEach(button => {
            const buttonValue = parseFloat(button.getAttribute("data-value"));
            if (buttonValue === currentThreshold) {
                button.classList.add("active");
            } else {
                button.classList.remove("active");
            }
        });
    }
    
    // Initialize TradingView widget with appropriate chart type based on theme
    function initializeTradingViewWidget() {
        try {
            // Get current theme
            const currentTheme = localStorage.getItem('amplAlgoTheme') || 'color';
            
            // Determine chart style and theme based on current theme
            const chartStyle = getChartStyleForTheme(currentTheme);
            const chartTheme = getChartThemeForTheme(currentTheme);
            
            tvWidget = new TradingView.widget({
                "autosize": true,
                "symbol": "KUCOIN:AMPLUSDT",
                "interval": "60",
                "timezone": "Etc/UTC",
                "theme": chartTheme,
                "style": chartStyle,
                "locale": "en",
                "toolbar_bg": chartTheme === "light" ? "#ffffff" : "#f1f3f6",
                "enable_publishing": false,
                "hide_top_toolbar": false,
                "hide_legend": false,
                "save_image": false,
                "container_id": "tradingview_chart_widget"
            });
            console.log(`TradingView widget initialized with chart style: ${chartStyle}, theme: ${chartTheme} for theme: ${currentTheme}`);
        } catch (e) {
            console.error("Error initializing TradingView widget:", e);
        }
    }
    
    // Get chart theme based on app theme
    function getChartThemeForTheme(themeName) {
        if (themeName === 'mono') {
            return "light"; // Light theme for mono to get white background
        } else {
            return "dark"; // Dark theme for color and bw
        }
    }
    
    // Get chart style based on app theme
    function getChartStyleForTheme(themeName) {
        if (themeName === 'color') {
            return "1"; // Candlestick for color theme
        } else {
            return "2"; // Line chart for mono and bw themes
        }
    }
    
    // Function to update chart type when theme changes
    function updateChartTypeForTheme(themeName) {
        // Reinitialize the TradingView widget with new theme settings
        if (document.getElementById("tradingview_chart_widget")) {
            // Clear the existing widget
            document.getElementById("tradingview_chart_widget").innerHTML = '';
            
            // Reinitialize with new theme
            setTimeout(() => {
                initializeTradingViewWidget();
            }, 500); // Small delay to ensure cleanup
        }
    }
    
    // Function to initialize theme
    function initializeTheme() {
        const savedTheme = localStorage.getItem('amplAlgoTheme');
        if (savedTheme) {
            // Apply saved theme
            applyTheme(savedTheme);
            
            // Set the radio button
            const themeRadio = document.querySelector(`input[name="theme"][value="${savedTheme}"]`);
            if (themeRadio) {
                themeRadio.checked = true;
            }
        } else {
            // Default to color theme
            applyTheme('color');
        }
    }
    
    // Function to apply theme
    function applyTheme(themeName) {
        // Remove existing theme classes
        document.body.classList.remove('theme-color', 'theme-mono', 'theme-bw');
        
        // Add new theme class
        document.body.classList.add(`theme-${themeName}`);
        
        // Save theme to localStorage
        localStorage.setItem('amplAlgoTheme', themeName);
        
        // Handle background amplALGO animation based on theme
        if (themeName === 'color') {
            startBackgroundAmplAlgo();
        } else {
            stopBackgroundAmplAlgo();
        }
        
        console.log(`Theme applied: ${themeName}`);
    }
    
    // Function to setup flickering lights effect
    function setupFlickeringLights() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes flicker {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.8; }
            }
            
            .flicker {
                animation: flicker 2s infinite;
            }
        `;
        
        if (!document.head.querySelector('style[data-flicker]')) {
            style.setAttribute('data-flicker', 'true');
            document.head.appendChild(style);
        }
    }

    // Initialize ladder management
    function initializeLadderControls() {
        // Show Ladder Panel checkbox with LED
        const showLadderCheckbox = document.getElementById('show-ladder-panel');
        const ladderPanel = document.getElementById('ladder-panel');
        const ladderLED = document.getElementById('ladder-led');
        
        if (showLadderCheckbox && ladderPanel) {
            showLadderCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    ladderPanel.style.display = 'block';
                    setTimeout(() => {
                        ladderPanel.classList.add('visible');
                    }, 50);
                    
                    // Stop flashing when panel is shown
                    const flashingText = document.querySelector('.flashing-indicator');
                    if (flashingText) {
                        flashingText.classList.remove('flashing-indicator');
                    }
                    
                    // Turn off LED
                    if (ladderLED) {
                        ladderLED.style.animation = 'none';
                        ladderLED.style.opacity = '0.3';
                    }
                } else {
                    ladderPanel.classList.remove('visible');
                    setTimeout(() => {
                        ladderPanel.style.display = 'none';
                    }, 300);
                }
            });
        }
        
        // Deploy Fresh Ladder button
        const deployButton = document.getElementById('deploy-fresh-ladder');
        if (deployButton) {
            deployButton.addEventListener('click', function() {
                deployFreshLadder();
            });
        }
        
        // Cancel All Orders button
        const cancelButton = document.getElementById('cancel-all-orders');
        if (cancelButton) {
            cancelButton.addEventListener('click', function() {
                cancelAllOrders();
            });
        }
    }

    // Smart Ladder Deployment (8 levels, 3.34% spacing)
    function deployFreshLadder() {
        console.log('Deploying fresh ladder...');
        
        // Cancel existing orders first
        cancelAllOrders();
        
        // Calculate ladder levels
        const startPrice = 1.16;
        const spacing = 0.0334; // 3.34%
        const balancePerOrder = parseFloat(balanceDisplay.textContent) / 8;
        
        ladderOrders = [];
        
        for (let i = 0; i < 8; i++) {
            const price = startPrice * Math.pow(1 - spacing, i);
            const order = {
                level: i + 1,
                price: price,
                size: balancePerOrder,
                status: 'pending',
                orderId: null
            };
            
            ladderOrders.push(order);
            
            // Place the actual order (simulated for now)
            setTimeout(() => {
                placeLimitBuyOrder(order);
            }, i * 500);
        }
        
        tradingState.ladderDeployed = true;
        updateLargeDigits();
        
        console.log('Fresh ladder deployed with 8 levels');
    }

    function cancelAllOrders() {
        console.log('Cancelling all orders...');
        
        ladderOrders.forEach(order => {
            if (order.status === 'active' && order.orderId) {
                order.status = 'cancelled';
                console.log(`Cancelled order ${order.orderId} at $${order.price.toFixed(4)}`);
            }
        });
        
        tradingState.active_trades = 0;
        tradingState.pendingTrades = 0;
        updateLargeDigits();
    }

    function placeLimitBuyOrder(order) {
        const orderId = 'ORDER_' + Date.now() + '_' + order.level;
        order.orderId = orderId;
        order.status = 'active';
        
        console.log(`Placed buy order: ${order.size.toFixed(2)} USDT at $${order.price.toFixed(4)}`);
        
        // Update trading state
        tradingState.active_trades++;
        tradingState.accumulatedBuyOrders += order.size;
        
        updateLargeDigits();
    }

    function handleOrderFill(order) {
        console.log(`Order filled: Level ${order.level} at $${order.price.toFixed(4)}`);
        
        // Update trading state
        tradingState.lastTradePrice = order.price;
        tradingState.active_trades--;
        tradingState.tradingHistory.push({
            type: 'buy',
            price: order.price,
            amount: order.size,
            timestamp: new Date()
        });
        
        updateLargeDigits();
        
        // Auto-deploy new ladder if enabled
        if (autoLadderEnabled) {
            setTimeout(() => {
                checkAndDeployAutoLadder();
            }, 2000);
        }
    }

    function checkAndDeployAutoLadder() {
        const activeBuyOrders = ladderOrders.filter(order => order.status === 'active').length;
        
        if (activeBuyOrders < 3) {
            console.log('Auto-deploying fresh ladder due to low active orders');
            deployFreshLadder();
        }
    }

    // 1% Spacing Rule Implementation
    function canPlaceNewTrade(currentPrice) {
        if (!tradingState.lastTradePrice) {
            return true;
        }
        
        const priceThreshold = tradingState.lastTradePrice * 0.99;
        
        if (currentPrice >= priceThreshold) {
            console.log(`Trade blocked: Current price $${currentPrice.toFixed(4)} must be 1% below last trade $${tradingState.lastTradePrice.toFixed(4)}`);
            return false;
        }
        
        return true;
    }

    // AMPL Rebase Protection
    function calculateRebaseValue() {
        // Simulate rebase effect based on current price
        const baseValue = tradingState.accumulatedBuyOrders;
        const rebaseMultiplier = currentAmplPrice > 1.0 ? 1.02 : 0.98; // +2% if price > $1, -2% if price < $1
        
        tradingState.currentRebaseValue = baseValue * rebaseMultiplier;
        return tradingState.currentRebaseValue;
    }

    // Update Large Digit Displays
    function updateLargeDigits() {
        // Update Active Trades count
        const activeTradesEl = document.getElementById('active-trades-count');
        if (activeTradesEl) {
            activeTradesEl.textContent = tradingState.active_trades;
        }
        
        // Update Pending Trades count
        const pendingTradesEl = document.getElementById('pending-trades-count');
        if (pendingTradesEl) {
            const pendingCount = ladderOrders.filter(order => order.status === 'pending').length;
            pendingTradesEl.textContent = pendingCount;
            tradingState.pendingTrades = pendingCount;
        }
        
        // Update Accumulated Buy Orders
        const buyOrdersEl = document.getElementById('buy-orders-total');
        if (buyOrdersEl) {
            buyOrdersEl.textContent = `$${tradingState.accumulatedBuyOrders.toFixed(0)}`;
        }
        
        // Update Current Rebase Value
        const rebaseValueEl = document.getElementById('current-rebase-value');
        if (rebaseValueEl) {
            const rebaseValue = calculateRebaseValue();
            rebaseValueEl.textContent = `$${rebaseValue.toFixed(0)}`;
        }
    }

    function startLargeDigitUpdates() {
        // Update displays every 3 seconds
        setInterval(() => {
            updateLargeDigits();
        }, 3000);
    }

    // Enhanced sell threshold functionality with 1% spacing
    function enhancedSellThresholdLogic() {
        const originalPlaceLimitOrder = window.placeLimitOrder;
        
        window.placeLimitOrder = function(threshold) {
            // Check 1% spacing rule before placing order
            if (!canPlaceNewTrade(threshold)) {
                console.log('Order blocked by 1% spacing rule');
                return false;
            }
            
            // Call original function if spacing rule passes
            if (originalPlaceLimitOrder) {
                return originalPlaceLimitOrder(threshold);
            }
            
            return true;
        };
    }

    // Initialize enhanced functionality
    enhancedSellThresholdLogic();
    
    // Scroll panel functions - FIXED VERSION
    window.scrollPanelUp = function(panelId) {
        console.log(`Attempting to scroll up panel: ${panelId}`);
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.scrollTop -= 100;
            console.log(`✅ Scrolled up panel: ${panelId}, new scrollTop: ${panel.scrollTop}`);
        } else {
            console.log(`❌ Panel not found: ${panelId}`);
        }
    };
    
    window.scrollPanelDown = function(panelId) {
        console.log(`Attempting to scroll down panel: ${panelId}`);
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.scrollTop += 100;
            console.log(`✅ Scrolled down panel: ${panelId}, new scrollTop: ${panel.scrollTop}`);
        } else {
            console.log(`❌ Panel not found: ${panelId}`);
        }
    };
    
    // Make database functions available globally
    window.db = {
        saveWebhook: async function(webhookData) {
            return await saveWebhook(webhookData);
        },
        getWebhooks: async function() {
            return await getWebhooks();
        },
        saveOrder: async function(orderData) {
            return await saveOrder(orderData);
        },
        getOrders: async function() {
            return await getOrders();
        },
        saveSettings: async function(settings) {
            return await saveSettings(settings);
        },
        getSettings: async function() {
            return await getSettings();
        }
    };
    
    // Global function to simulate webhook for testing
    window.simulateWebhook = function() {
        const testWebhook = {
            action: "sell",
            ticker: "AMPL-USDT",
            price: 1.25,
            amount: 0.1,
            timestamp: new Date().toISOString(),
            source: "simulation"
        };
        
        addWebhookEntry(testWebhook);
        window.db.saveWebhook(testWebhook);
        
        console.log("Test webhook simulated:", testWebhook);
    };

    // Debug functions for testing
    window.testLadderDeploy = function() {
        deployFreshLadder();
    };

    window.testCancelOrders = function() {
        cancelAllOrders();
    };

    window.checkTradingState = function() {
        console.log('Trading State:', tradingState);
        console.log('Ladder Orders:', ladderOrders);
        return { tradingState, ladderOrders };
    };

    // Ladder Panel Functionality
    const showLadderPanelCheckbox = document.getElementById("show-ladder-panel");
    const integratedLadderPanel = document.getElementById("integrated-ladder-panel");
    
    // Initialize ladder panel as hidden
    if (integratedLadderPanel) {
        integratedLadderPanel.style.display = 'none';
    }
    
    // Handle ladder panel toggle
    if (showLadderPanelCheckbox) {
        showLadderPanelCheckbox.addEventListener('change', function() {
            if (this.checked) {
                showLadderPanel();
            } else {
                hideLadderPanel();
            }
        });
    }
    
    function showLadderPanel() {
        if (integratedLadderPanel) {
            integratedLadderPanel.style.display = 'block';
            // Trigger reflow
            integratedLadderPanel.offsetHeight;
            integratedLadderPanel.classList.add('visible');
            
            // Update ladder panel data
            updateLadderPanelData();
            
            // Start updating ladder panel every 3 seconds
            if (!window.ladderUpdateInterval) {
                window.ladderUpdateInterval = setInterval(updateLadderPanelData, 3000);
            }
        }
    }
    
    function hideLadderPanel() {
        if (integratedLadderPanel) {
            integratedLadderPanel.classList.remove('visible');
            setTimeout(() => {
                integratedLadderPanel.style.display = 'none';
            }, 500); // Wait for animation to complete
            
            // Stop updating ladder panel
            if (window.ladderUpdateInterval) {
                clearInterval(window.ladderUpdateInterval);
                window.ladderUpdateInterval = null;
            }
        }
    }
    
    function updateLadderPanelData() {
        // Update Active Trades count from real trading state
        const activeTradesElement = document.getElementById('active-trades-count');
        if (activeTradesElement) {
            activeTradesElement.textContent = tradingState.active_trades || 0;
        }
        
        // Update Pending Trades count from real trading state
        const pendingTradesElement = document.getElementById('pending-trades-count');
        if (pendingTradesElement) {
            const pendingCount = ladderOrders.filter(order => order.status === 'pending').length;
            pendingTradesElement.textContent = pendingCount;
        }
        
        // Update Accumulated Buy Orders from real trading state
        const buyOrdersElement = document.getElementById('buy-orders-total');
        if (buyOrdersElement) {
            const accumulatedValue = tradingState.accumulatedBuyOrders || 0;
            buyOrdersElement.textContent = `$${accumulatedValue.toLocaleString()}`;
        }
        
        // Update Current Value with rebase from real calculation
        const currentValueElement = document.getElementById('current-rebase-value');
        if (currentValueElement) {
            const rebaseValue = calculateRebaseValue();
            currentValueElement.textContent = `$${Math.floor(rebaseValue).toLocaleString()}`;
        }
        
        // Update Trading Stats with real data
        updateTradingStats();
    }
    
    function updateTradingStats() {
        // Calculate real success rate
        const successRateElement = document.querySelector('.stat-value');
        if (successRateElement && tradingState.tradingHistory.length > 0) {
            const profitableTrades = tradingState.tradingHistory.filter(trade => 
                trade.profit && trade.profit > 0
            ).length;
            const successRate = Math.round((profitableTrades / tradingState.tradingHistory.length) * 100);
            successRateElement.textContent = `${successRate}%`;
        }
        
        // Update total trades count
        const totalTradesElements = document.querySelectorAll('.stat-value');
        if (totalTradesElements[1]) {
            totalTradesElements[1].textContent = tradingState.tradingHistory.length;
        }
        
        // Calculate average profit
        if (totalTradesElements[2] && tradingState.tradingHistory.length > 0) {
            const totalProfit = tradingState.tradingHistory.reduce((sum, trade) => 
                sum + (trade.profit || 0), 0
            );
            const avgProfit = (totalProfit / tradingState.tradingHistory.length);
            const sign = avgProfit >= 0 ? '+' : '';
            totalTradesElements[2].textContent = `${sign}${avgProfit.toFixed(1)}%`;
        }
    }

    // Socket.IO Integration (if available)
    if (typeof io !== "undefined") {
        console.log("Socket.IO library detected, initializing connection...");
        
        try {
            const socket = io();
            let amplManagerEnabled = false;

            socket.on("connect", () => {
                console.log("✅ Connected to server via Socket.io");
                socket.emit("get_ampl_manager_status");
            });

            socket.on("disconnect", () => {
                console.log("❌ Disconnected from server");
            });

            socket.on("ampl_manager_status", (data) => {
                console.log("📊 AMPL Manager Status:", data);
                amplManagerEnabled = data.enabled;
                
                // Update UI based on status
                const statusElement = document.getElementById("ampl-manager-status");
                if (statusElement) {
                    statusElement.textContent = amplManagerEnabled ? "Active" : "Inactive";
                    statusElement.className = amplManagerEnabled ? "status-active" : "status-inactive";
                }
            });

            socket.on("ampl_price_update", (data) => {
                console.log("💰 Real-time AMPL price update:", data);
                if (data.price) {
                    updateAmplPrice(data.price);
                }
            });

            socket.on("ampl_balance_update", (data) => {
                console.log("💳 Real-time balance update:", data);
                if (data.usdt && balanceDisplay) {
                    balanceDisplay.textContent = data.usdt.toFixed(2);
                }
            });

            // Make socket available globally for other scripts
            window.amplSocket = socket;
            
        } catch (error) {
            console.error("Error initializing Socket.IO:", error);
        }
    } else {
        console.log("Socket.IO library not loaded. Real-time features will be disabled.");
    }

    // Enhanced AMPL Ladder System Integration
    class EnhancedAMPLLadder {
        constructor() {
            this.ladderConfig = {
                startPrice: 1.16,
                endPrice: 0.85,
                numOrders: 8,
                orders: [],
                filledOrders: [],
            };

            this.targetSellConfig = {
                conservative: 0.015, // 1.5% profit
                moderate: 0.05,      // 5% profit
                aggressive: 0.13,    // 13% profit
            };

            this.currentTargetMode = localStorage.getItem("targetSellMode") || "moderate";
            this.init();
        }

        init() {
            console.log("🎬 Initializing Enhanced AMPL Ladder System...");
            this.setupUI();
            this.updateTargetModeDisplay();
            console.log("✅ Enhanced AMPL Ladder System initialized");
        }

        setupUI() {
            // Find the AMPL Ladder View section
            const amplLadderView = document.querySelector('.ampl-ladder-view .section-content');
            if (!amplLadderView) {
                //console.warn("AMPL Ladder View section not found");
                return;
            }

            // Create target mode selector
            const targetModeContainer = document.createElement('div');
            targetModeContainer.className = 'target-mode-container';
            targetModeContainer.innerHTML = `
                <div class="target-mode-header">
                    <h4>Target Sell Mode</h4>
                    <span class="current-mode">${this.currentTargetMode}</span>
                </div>
                <div class="target-mode-buttons">
                    <button class="target-btn ${this.currentTargetMode === 'conservative' ? 'active' : ''}" 
                            data-mode="conservative">1.5%</button>
                    <button class="target-btn ${this.currentTargetMode === 'moderate' ? 'active' : ''}" 
                            data-mode="moderate">5%</button>
                    <button class="target-btn ${this.currentTargetMode === 'aggressive' ? 'active' : ''}" 
                            data-mode="aggressive">13%</button>
                </div>
            `;

            // Insert at the beginning of the section
            amplLadderView.insertBefore(targetModeContainer, amplLadderView.firstChild);

            // Add event listeners
            const targetButtons = targetModeContainer.querySelectorAll('.target-btn');
            targetButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const mode = e.target.getAttribute('data-mode');
                    this.setTargetMode(mode);
                });
            });
        }

        setTargetMode(mode) {
            this.currentTargetMode = mode;
            localStorage.setItem("targetSellMode", mode);
            this.updateTargetModeDisplay();
            console.log(`🎯 Target sell mode set to: ${mode} (${(this.targetSellConfig[mode] * 100).toFixed(1)}%)`);
        }

        updateTargetModeDisplay() {
            const currentModeSpan = document.querySelector('.current-mode');
            if (currentModeSpan) {                currentModeSpan.textContent = this.currentTargetMode;

            }

            // Update button states
            const targetButtons = document.querySelectorAll('.target-btn');
            targetButtons.forEach(btn => {
                const mode = btn.getAttribute('data-mode');
                if (mode === this.currentTargetMode) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }

        calculateLadderPrices() {
            const prices = [];
            const numSteps = this.ladderConfig.numOrders - 1;
            const priceRange = this.ladderConfig.startPrice - this.ladderConfig.endPrice;

            for (let i = 0; i < this.ladderConfig.numOrders; i++) {
                const factor = Math.pow(i / numSteps, 2);
                const price = this.ladderConfig.startPrice - (priceRange * factor);
                prices.push(parseFloat(price.toFixed(4)));
            }
            return prices.reverse();
        }

        calculateOrderSizes(totalBalance) {
            const sizes = [];
            const numOrders = this.ladderConfig.numOrders;
            const weights = Array.from({ length: numOrders }, (_, i) => i + 1);
            const totalWeight = weights.reduce((sum, w) => sum + w, 0);

            for (let i = 0; i < numOrders; i++) {
                const proportion = weights[i] / totalWeight;
                let size = Math.floor(totalBalance * proportion);
                sizes.push(size);
            }

            return sizes;
        }

        deployEnhancedLadder() {
            console.log("🚀 Deploying Enhanced AMPL Ladder...");
            
            const totalBalance = parseFloat(balanceDisplay?.textContent || "1000");
            const prices = this.calculateLadderPrices();
            const sizes = this.calculateOrderSizes(totalBalance);

            this.ladderConfig.orders = [];

            for (let i = 0; i < this.ladderConfig.numOrders; i++) {
                const order = {
                    id: `enhanced_${Date.now()}_${i}`,
                    price: prices[i],
                    size: sizes[i],
                    targetSellPrice: prices[i] * (1 + this.targetSellConfig[this.currentTargetMode]),
                    status: 'pending',
                    level: i + 1
                };

                this.ladderConfig.orders.push(order);
                console.log(`📋 Order ${i + 1}: ${sizes[i]} AMPL at $${prices[i]} → Target: $${order.targetSellPrice.toFixed(4)}`);
            }

            console.log("✅ Enhanced ladder deployed successfully");
            return this.ladderConfig.orders;
        }
    }

    // Initialize Enhanced AMPL Ladder System
    window.enhancedLadder = new EnhancedAMPLLadder();

    // Make enhanced functions available globally
    window.deployEnhancedLadder = function() {
        return window.enhancedLadder.deployEnhancedLadder();
    };

    // Database functions for Supabase integration
    async function saveWebhook(webhookData) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/webhooks`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY
                },
                body: JSON.stringify({
                    content: JSON.stringify(webhookData),
                    created_at: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error saving webhook to Supabase:', error);
            throw error;
        }
    }

    async function getWebhooks() {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/webhooks?order=created_at.desc&limit=50`, {
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'apikey': SUPABASE_ANON_KEY
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching webhooks from Supabase:', error);
            return [];
        }
    }

    async function saveOrder(orderData) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY
                },
                body: JSON.stringify({
                    content: JSON.stringify(orderData),
                    created_at: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error saving order to Supabase:', error);
            throw error;
        }
    }


// Around line 1510-1525, replace the existing code with:
async function getOrders() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?order=created_at.desc`, {
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        });
        
        // Check if response is OK before parsing JSON
        if (!response.ok) {
            console.warn(`Orders fetch failed: ${response.status} ${response.statusText}`);
            return []; // Return empty array instead of failing
        }
        
        const data = await response.json();
        return data || [];
        
    } catch (error) {
        console.error('Error fetching orders from Supabase:', error);
        return []; // Return empty array on error
    }
}




    async function saveSettings(settings) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/settings`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY
                },
                body: JSON.stringify({
                    settings: JSON.stringify(settings),
                    updated_at: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error saving settings to Supabase:', error);
            throw error;
        }
    }

    async function getSettings() {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/settings?order=updated_at.desc&limit=1`, {
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'apikey': SUPABASE_ANON_KEY
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.length > 0) {
                return JSON.parse(data[0].settings);
            }
            return {};
        } catch (error) {
            console.error('Error fetching settings from Supabase:', error);
            return {};
        }
    }

});

