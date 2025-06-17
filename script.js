document.addEventListener("DOMContentLoaded", function() {
    // Initialize variables
    let currentZoom = 30; // Start zoom level at 30%
    let currentThreshold = 1.25; // Default threshold is 1.25
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
        const controlPanels = document.querySelectorAll('.control-panel');
        
        controlPanels.forEach((panel, index) => {
            setTimeout(() => {
                panel.classList.add('visible');
            }, index * 300); // 300ms delay between each panel
        });
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
    
    // Function to simulate AMPL price updates
    function startAmplPriceUpdates() {
        // Initial price
        updateAmplPrice(1.20);
        
        // Update price every 10 seconds with a small random change
        setInterval(() => {
            const randomChange = (Math.random() - 0.5) * 0.02; // Random change between -0.01 and 0.01
            const newPrice = Math.max(0.5, Math.min(2.0, currentAmplPrice + randomChange)); // Keep price between 0.5 and 2.0
            updateAmplPrice(newPrice);
            
            // Check if we should place a limit order based on the new price
            checkAndPlaceLimitOrder(newPrice);
        }, 10000);
    }
    
    // Function to update AMPL price
    function updateAmplPrice(price) {
        currentAmplPrice = price;
        if (currentAmplPriceDisplay) {
            currentAmplPriceDisplay.textContent = price.toFixed(3);
        }
        
        // Simulate a balance update as well (just for demo purposes)
        const randomBalance = 2000 + Math.random() * 1000;
        if (balanceDisplay) {
            balanceDisplay.textContent = randomBalance.toFixed(2);
        }
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
    zoomInBtn.addEventListener("click", function() {
        if (currentZoom < 100) { // Limit maximum zoom to 100%
            currentZoom += 5;
            applyZoom();
            updateZoomDisplay();
        }
    });
    
    zoomOutBtn.addEventListener("click", function() {
        if (currentZoom > 50) {
            currentZoom -= 5;
            applyZoom();
            updateZoomDisplay();
        }
    });
    
    zoomResetBtn.addEventListener("click", function() {
        currentZoom = 80; // Reset to default 80%
        applyZoom();
        updateZoomDisplay();
    });
    
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
});

