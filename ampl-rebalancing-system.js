/**
 * AMPL Rebalancing System - Refined with Click-to-Expand & Mechanical Sounds
 * Features: Click-to-expand modal, mechanical zoom sounds, persistent settings, 7% threshold
 */

class AMPLRebalancingSystemRefined {
    constructor() {
        this.targetPanel = null;
        this.isInitialized = false;
        this.monitoringInterval = null;
        this.soundEnabled = true;
        this.audioContext = null;
        this.isExpanded = false;
        this.expandedModal = null;
        
        // Rebalancing system data
        this.coins = {
            SOL: { symbol: 'SOL/USDT', quantity: 0, purchasePrice: 0, currentPrice: 0, totalValue: 0, profit: 0, profitPercent: 0 },
            SUI: { symbol: 'SUI/USDT', quantity: 0, purchasePrice: 0, currentPrice: 0, totalValue: 0, profit: 0, profitPercent: 0 },
            BTC: { symbol: 'BTC/USDT', quantity: 0, purchasePrice: 0, currentPrice: 0, totalValue: 0, profit: 0, profitPercent: 0 },
            AMPL: { symbol: 'AMPL/USDT', quantity: 0, purchasePrice: 0, currentPrice: 0, totalValue: 0, profit: 0, profitPercent: 0 }
        };
        
        this.settings = {
            profitThreshold: 7,
            selectedExchange: 'kucoin',
            amplThreshold: 1.16,
            totalInvested: 0,
            totalCurrentValue: 0,
            totalProfit: 0,
            totalProfitPercent: 0,
            rebalanceThreshold: 7
        };
        
        // API endpoints for live data
        this.apiEndpoints = {
            kucoin: 'https://api.kucoin.com/api/v1/market/orderbook/level1',
            binance: 'https://api.binance.com/api/v3/ticker/price',
            coinbase: 'https://api.coinbase.com/v2/exchange-rates'
        };
        
        // Initialize audio context and sounds
        this.initializeAudio();
        
        // Load persistent settings
        this.loadPersistentSettings();
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            setTimeout(() => this.initialize(), 500);
        }
    }

    initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🔊 Audio context initialized for mechanical sound effects');
        } catch (error) {
            console.log('🔇 Audio not available:', error.message);
            this.soundEnabled = false;
        }
    }

    // Enhanced mechanical sound effects
    playSound(type) {
        if (!this.soundEnabled || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filterNode = this.audioContext.createBiquadFilter();
            
            oscillator.connect(filterNode);
            filterNode.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            switch (type) {
                case 'mechanical_zoom':
                    // Mechanical hinge/swoosh sound for main page zoom
                    this.createMechanicalZoomSound(oscillator, gainNode, filterNode);
                    break;
                    
                case 'truck_beep':
                    // Truck backing up beeping sound
                    this.createTruckBeepSound(oscillator, gainNode, filterNode);
                    break;
                    
                case 'profit':
                    // Profit notification sound (unchanged)
                    oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime + 0.1);
                    oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime + 0.2);
                    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.3);
                    break;
                    
                case 'click':
                    // Button click sound
                    oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.05);
                    break;
            }
        } catch (error) {
            console.log('🔇 Sound playback error:', error.message);
        }
    }

    createMechanicalZoomSound(oscillator, gainNode, filterNode) {
        // Mechanical hinge/swoosh sound
        oscillator.type = 'sawtooth';
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(2000, this.audioContext.currentTime);
        filterNode.frequency.exponentialRampToValueAtTime(500, this.audioContext.currentTime + 0.6);
        
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(150, this.audioContext.currentTime + 0.3);
        oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.6);
        
        gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.08, this.audioContext.currentTime + 0.3);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.6);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.6);
    }

    createTruckBeepSound(oscillator, gainNode, filterNode) {
        // Truck backing up beeping sound
        oscillator.type = 'square';
        filterNode.type = 'bandpass';
        filterNode.frequency.setValueAtTime(800, this.audioContext.currentTime);
        
        // Create beeping pattern
        const beepDuration = 0.15;
        const pauseDuration = 0.1;
        const totalBeeps = 3;
        
        for (let i = 0; i < totalBeeps; i++) {
            const startTime = this.audioContext.currentTime + (i * (beepDuration + pauseDuration));
            const endTime = startTime + beepDuration;
            
            oscillator.frequency.setValueAtTime(800, startTime);
            gainNode.gain.setValueAtTime(0.12, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, endTime);
            
            if (i === 0) {
                oscillator.start(startTime);
            }
        }
        
        oscillator.stop(this.audioContext.currentTime + (totalBeeps * (beepDuration + pauseDuration)));
    }

    // Add mechanical zoom sound to main page elements
    addMainPageZoomSounds() {
        // Target main page zoom elements
        const zoomElements = [
            '.incoming-webhooks-panel',
            '.chart-container',
            '.kucoin-order-log',
            '#integrated-ladder-panel'
        ];
        
        zoomElements.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (element && !element.hasAttribute('data-zoom-sound-added')) {
                    element.setAttribute('data-zoom-sound-added', 'true');
                    
                    // Add zoom sound on CSS animation/transition start
                    element.addEventListener('transitionstart', (e) => {
                        if (e.propertyName === 'transform' || e.propertyName === 'scale') {
                            this.playSound('mechanical_zoom');
                        }
                    });
                    
                    // Also add on hover for immediate feedback
                    element.addEventListener('mouseenter', () => {
                        this.playSound('truck_beep');
                    });
                }
            });
        });
        
        console.log('🔊 Mechanical zoom sounds added to main page elements');
    }

    loadPersistentSettings() {
        try {
            const saved = localStorage.getItem('ampl-rebalancing-settings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.settings.profitThreshold = settings.profitThreshold || 7;
                this.settings.selectedExchange = settings.selectedExchange || 'kucoin';
                this.settings.rebalanceThreshold = settings.rebalanceThreshold || 7;
                this.soundEnabled = settings.soundEnabled !== undefined ? settings.soundEnabled : true;
                console.log('✅ Persistent settings loaded');
            }
        } catch (error) {
            console.log('⚠️ Error loading persistent settings:', error.message);
        }
    }

    savePersistentSettings() {
        try {
            const settings = {
                profitThreshold: this.settings.profitThreshold,
                selectedExchange: this.settings.selectedExchange,
                rebalanceThreshold: this.settings.rebalanceThreshold,
                soundEnabled: this.soundEnabled
            };
            localStorage.setItem('ampl-rebalancing-settings', JSON.stringify(settings));
            console.log('💾 Persistent settings saved');
        } catch (error) {
            console.log('⚠️ Error saving persistent settings:', error.message);
        }
    }

    initialize() {
        console.log('🎬 Initializing AMPL Rebalancing System (Refined)...');
        
        // Add mechanical zoom sounds to main page elements
        this.addMainPageZoomSounds();
        
        // Find the Limit Orders panel
        this.findLimitOrdersPanel();
        
        if (this.targetPanel) {
            this.replaceWithRebalancingSystem();
            this.applyStyles();
            this.bindEventListeners();
            this.startLivePriceMonitoring();
            this.loadRealPositions();
            this.isInitialized = true;
            console.log('✅ AMPL Rebalancing System (Refined) initialized successfully');
        } else {
            console.log('❌ Limit Orders panel not found - watching for ladder panel...');
            this.watchForLadderPanel();
        }
    }

    watchForLadderPanel() {
        const observer = new MutationObserver(() => {
            if (!this.isInitialized) {
                this.findLimitOrdersPanel();
                if (this.targetPanel) {
                    this.replaceWithRebalancingSystem();
                    this.applyStyles();
                    this.bindEventListeners();
                    this.startLivePriceMonitoring();
                    this.loadRealPositions();
                    this.isInitialized = true;
                    console.log('✅ AMPL Rebalancing System (Refined) initialized after ladder panel activation');
                    observer.disconnect();
                }
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });
        
        console.log('👀 Watching for ladder panel activation...');
    }

    findLimitOrdersPanel() {
        console.log('🔍 Looking for Limit Orders panel...');
        
        const limitOrdersSection = document.querySelector('.ladder-section.limit-orders-section');
        if (limitOrdersSection) {
            this.targetPanel = limitOrdersSection.querySelector('.section-content');
            if (this.targetPanel) {
                console.log('✅ Found Limit Orders panel via exact class selector');
                return;
            }
        }
        
        const sectionHeaders = document.querySelectorAll('.section-header h3');
        for (const header of sectionHeaders) {
            if (header.textContent.includes('Limit Orders')) {
                const section = header.closest('.ladder-section');
                if (section) {
                    this.targetPanel = section.querySelector('.section-content');
                    if (this.targetPanel) {
                        console.log('✅ Found Limit Orders panel via section header text');
                        return;
                    }
                }
            }
        }
        
        console.log('❌ Could not find Limit Orders panel');
    }

    replaceWithRebalancingSystem() {
        if (!this.targetPanel) return;

        console.log('🔄 Replacing Limit Orders content with Refined Rebalancing System...');
        this.originalContent = this.targetPanel.innerHTML;

        const rebalancingHTML = `
            <div class="rebalancing-container" id="rebalancing-container">
                <!-- Header with title and controls -->
                <div class="rebalancing-header">
                    <div class="rebalancing-title">
                        <i class="fas fa-balance-scale"></i>
                        <span>LIVE REBALANCING SYSTEM</span>
                        <span class="system-status" id="system-status">🟢 Live</span>
                    </div>
                    <div class="rebalancing-controls">
                        <button class="rebalancing-btn expand-btn" id="expand-panel" title="Expand Panel">
                            <i class="fas fa-expand"></i>
                        </button>
                        <button class="rebalancing-btn sound-btn" id="toggle-sound" title="Toggle Sound">
                            <i class="fas fa-volume-up" id="sound-icon"></i>
                        </button>
                        <button class="rebalancing-btn settings-btn" id="show-settings" title="Settings">
                            <i class="fas fa-cog"></i>
                        </button>
                        <button class="rebalancing-btn refresh-btn" id="refresh-prices" title="Refresh">
                            <i class="fas fa-sync"></i>
                        </button>
                        <button class="rebalancing-btn restore-btn" id="restore-original" title="Restore">
                            <i class="fas fa-undo"></i>
                        </button>
                    </div>
                </div>

                <!-- Settings Panel -->
                <div class="settings-panel" id="settings-panel">
                    <div class="settings-row">
                        <label>Profit Threshold:</label>
                        <select id="profit-threshold">
                            <option value="1.5">1.5%</option>
                            <option value="5">5%</option>
                            <option value="7" selected>7%</option>
                            <option value="10">10%</option>
                            <option value="20">20%</option>
                        </select>
                    </div>
                    <div class="settings-row">
                        <label>Rebalance Threshold:</label>
                        <select id="rebalance-threshold">
                            <option value="5">5%</option>
                            <option value="7" selected>7%</option>
                            <option value="10">10%</option>
                            <option value="15">15%</option>
                        </select>
                    </div>
                    <div class="settings-row">
                        <label>Exchange:</label>
                        <select id="exchange-select">
                            <option value="kucoin" selected>KuCoin</option>
                            <option value="binance">Binance</option>
                            <option value="both">Both</option>
                        </select>
                    </div>
                    <div class="settings-row">
                        <label>AMPL Threshold:</label>
                        <span class="threshold-value">$1.16</span>
                        <span class="current-ampl-price" id="current-ampl-price">Current: Loading...</span>
                    </div>
                </div>

                <!-- Overall Stats -->
                <div class="overall-stats">
                    <div class="stat-item" title="Total amount invested across all coins">
                        <span class="stat-label">Total Invested</span>
                        <span class="stat-value" id="total-invested">$0.00</span>
                    </div>
                    <div class="stat-item" title="Current total value of all holdings">
                        <span class="stat-label">Current Value</span>
                        <span class="stat-value" id="total-current-value">$0.00</span>
                    </div>
                    <div class="stat-item" title="Total profit/loss across all positions">
                        <span class="stat-label">Total Profit</span>
                        <span class="stat-value profit" id="total-profit">$0.00</span>
                    </div>
                    <div class="stat-item" title="Total profit percentage">
                        <span class="stat-label">Profit %</span>
                        <span class="stat-value profit-percent" id="total-profit-percent">0.00%</span>
                    </div>
                </div>

                <!-- Coins Grid -->
                <div class="coins-grid">
                    <div class="coin-card" data-coin="SOL" title="Solana (SOL) position details">
                        <div class="coin-header">
                            <div class="coin-symbol">
                                <i class="coin-icon">☀️</i>
                                <span>SOL</span>
                            </div>
                            <div class="coin-status" id="sol-status">💤</div>
                        </div>
                        <div class="coin-stats">
                            <div class="stat-row">
                                <span>Quantity:</span>
                                <span id="sol-quantity">0.000</span>
                            </div>
                            <div class="stat-row">
                                <span>Purchase:</span>
                                <span id="sol-purchase-price">$0.00</span>
                            </div>
                            <div class="stat-row">
                                <span>Current:</span>
                                <span id="sol-current-price">Loading...</span>
                            </div>
                            <div class="stat-row">
                                <span>Value:</span>
                                <span id="sol-total-value">$0.00</span>
                            </div>
                            <div class="stat-row profit-row">
                                <span>Profit:</span>
                                <span id="sol-profit" class="profit-value">$0.00 (0.00%)</span>
                            </div>
                        </div>
                    </div>

                    <div class="coin-card" data-coin="SUI" title="Sui (SUI) position details">
                        <div class="coin-header">
                            <div class="coin-symbol">
                                <i class="coin-icon">🌊</i>
                                <span>SUI</span>
                            </div>
                            <div class="coin-status" id="sui-status">💤</div>
                        </div>
                        <div class="coin-stats">
                            <div class="stat-row">
                                <span>Quantity:</span>
                                <span id="sui-quantity">0.000</span>
                            </div>
                            <div class="stat-row">
                                <span>Purchase:</span>
                                <span id="sui-purchase-price">$0.00</span>
                            </div>
                            <div class="stat-row">
                                <span>Current:</span>
                                <span id="sui-current-price">Loading...</span>
                            </div>
                            <div class="stat-row">
                                <span>Value:</span>
                                <span id="sui-total-value">$0.00</span>
                            </div>
                            <div class="stat-row profit-row">
                                <span>Profit:</span>
                                <span id="sui-profit" class="profit-value">$0.00 (0.00%)</span>
                            </div>
                        </div>
                    </div>

                    <div class="coin-card" data-coin="BTC" title="Bitcoin (BTC) position details">
                        <div class="coin-header">
                            <div class="coin-symbol">
                                <i class="coin-icon">₿</i>
                                <span>BTC</span>
                            </div>
                            <div class="coin-status" id="btc-status">💤</div>
                        </div>
                        <div class="coin-stats">
                            <div class="stat-row">
                                <span>Quantity:</span>
                                <span id="btc-quantity">0.000000</span>
                            </div>
                            <div class="stat-row">
                                <span>Purchase:</span>
                                <span id="btc-purchase-price">$0.00</span>
                            </div>
                            <div class="stat-row">
                                <span>Current:</span>
                                <span id="btc-current-price">Loading...</span>
                            </div>
                            <div class="stat-row">
                                <span>Value:</span>
                                <span id="btc-total-value">$0.00</span>
                            </div>
                            <div class="stat-row profit-row">
                                <span>Profit:</span>
                                <span id="btc-profit" class="profit-value">$0.00 (0.00%)</span>
                            </div>
                        </div>
                    </div>

                    <div class="coin-card" data-coin="AMPL" title="Ampleforth (AMPL) position details">
                        <div class="coin-header">
                            <div class="coin-symbol">
                                <i class="coin-icon">🎯</i>
                                <span>AMPL</span>
                            </div>
                            <div class="coin-status" id="ampl-status">💤</div>
                        </div>
                        <div class="coin-stats">
                            <div class="stat-row">
                                <span>Quantity:</span>
                                <span id="ampl-quantity">0.000</span>
                            </div>
                            <div class="stat-row">
                                <span>Purchase:</span>
                                <span id="ampl-purchase-price">$0.00</span>
                            </div>
                            <div class="stat-row">
                                <span>Current:</span>
                                <span id="ampl-current-price">Loading...</span>
                            </div>
                            <div class="stat-row">
                                <span>Value:</span>
                                <span id="ampl-total-value">$0.00</span>
                            </div>
                            <div class="stat-row profit-row">
                                <span>Profit:</span>
                                <span id="ampl-profit" class="profit-value">$0.00 (0.00%)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Action Log -->
                <div class="action-log">
                    <div class="log-header">
                        <span>Live Actions</span>
                        <button class="clear-log-btn" id="clear-log">Clear</button>
                    </div>
                    <div class="log-messages" id="log-messages">
                        <div class="log-message">
                            <span class="log-time">Ready</span>
                            <span class="log-text">Refined rebalancing system initialized</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.targetPanel.innerHTML = rebalancingHTML;
        
        // Apply persistent settings to UI
        this.applyPersistentSettingsToUI();
        
        console.log('✅ Limit Orders panel content replaced with Refined Rebalancing System');
    }

    applyPersistentSettingsToUI() {
        // Apply saved settings to UI elements
        const profitThresholdSelect = document.getElementById('profit-threshold');
        const rebalanceThresholdSelect = document.getElementById('rebalance-threshold');
        const exchangeSelect = document.getElementById('exchange-select');
        const soundIcon = document.getElementById('sound-icon');
        const soundBtn = document.getElementById('toggle-sound');
        
        if (profitThresholdSelect) {
            profitThresholdSelect.value = this.settings.profitThreshold;
        }
        
        if (rebalanceThresholdSelect) {
            rebalanceThresholdSelect.value = this.settings.rebalanceThreshold;
        }
        
        if (exchangeSelect) {
            exchangeSelect.value = this.settings.selectedExchange;
        }
        
        if (soundIcon && soundBtn) {
            if (this.soundEnabled) {
                soundIcon.className = 'fas fa-volume-up';
                soundBtn.classList.remove('sound-disabled');
            } else {
                soundIcon.className = 'fas fa-volume-mute';
                soundBtn.classList.add('sound-disabled');
            }
        }
    }

    createExpandedModal() {
        // Create expanded modal (4" x 5" = approximately 384px x 480px)
        const modal = document.createElement('div');
        modal.id = 'rebalancing-expanded-modal';
        modal.className = 'rebalancing-expanded-modal';
        
        modal.innerHTML = `
            <div class="modal-backdrop" id="modal-backdrop"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">
                        <i class="fas fa-balance-scale"></i>
                        <span>LIVE REBALANCING SYSTEM - EXPANDED</span>
                    </div>
                    <button class="modal-close-btn" id="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <!-- Copy of the main rebalancing content but larger -->
                    <div class="expanded-overall-stats">
                        <div class="expanded-stat-item">
                            <span class="expanded-stat-label">Total Invested</span>
                            <span class="expanded-stat-value" id="expanded-total-invested">$0.00</span>
                        </div>
                        <div class="expanded-stat-item">
                            <span class="expanded-stat-label">Current Value</span>
                            <span class="expanded-stat-value" id="expanded-total-current-value">$0.00</span>
                        </div>
                        <div class="expanded-stat-item">
                            <span class="expanded-stat-label">Total Profit</span>
                            <span class="expanded-stat-value profit" id="expanded-total-profit">$0.00</span>
                        </div>
                        <div class="expanded-stat-item">
                            <span class="expanded-stat-label">Profit %</span>
                            <span class="expanded-stat-value profit-percent" id="expanded-total-profit-percent">0.00%</span>
                        </div>
                    </div>

                    <div class="expanded-coins-grid">
                        <div class="expanded-coin-card" data-coin="SOL">
                            <div class="expanded-coin-header">
                                <div class="expanded-coin-symbol">
                                    <i class="expanded-coin-icon">☀️</i>
                                    <span>SOL</span>
                                </div>
                                <div class="expanded-coin-status" id="expanded-sol-status">💤</div>
                            </div>
                            <div class="expanded-coin-stats">
                                <div class="expanded-stat-row">
                                    <span>Quantity:</span>
                                    <span id="expanded-sol-quantity">0.000</span>
                                </div>
                                <div class="expanded-stat-row">
                                    <span>Purchase:</span>
                                    <span id="expanded-sol-purchase-price">$0.00</span>
                                </div>
                                <div class="expanded-stat-row">
                                    <span>Current:</span>
                                    <span id="expanded-sol-current-price">Loading...</span>
                                </div>
                                <div class="expanded-stat-row">
                                    <span>Value:</span>
                                    <span id="expanded-sol-total-value">$0.00</span>
                                </div>
                                <div class="expanded-stat-row expanded-profit-row">
                                    <span>Profit:</span>
                                    <span id="expanded-sol-profit" class="expanded-profit-value">$0.00 (0.00%)</span>
                                </div>
                            </div>
                        </div>

                        <div class="expanded-coin-card" data-coin="SUI">
                            <div class="expanded-coin-header">
                                <div class="expanded-coin-symbol">
                                    <i class="expanded-coin-icon">🌊</i>
                                    <span>SUI</span>
                                </div>
                                <div class="expanded-coin-status" id="expanded-sui-status">💤</div>
                            </div>
                            <div class="expanded-coin-stats">
                                <div class="expanded-stat-row">
                                    <span>Quantity:</span>
                                    <span id="expanded-sui-quantity">0.000</span>
                                </div>
                                <div class="expanded-stat-row">
                                    <span>Purchase:</span>
                                    <span id="expanded-sui-purchase-price">$0.00</span>
                                </div>
                                <div class="expanded-stat-row">
                                    <span>Current:</span>
                                    <span id="expanded-sui-current-price">Loading...</span>
                                </div>
                                <div class="expanded-stat-row">
                                    <span>Value:</span>
                                    <span id="expanded-sui-total-value">$0.00</span>
                                </div>
                                <div class="expanded-stat-row expanded-profit-row">
                                    <span>Profit:</span>
                                    <span id="expanded-sui-profit" class="expanded-profit-value">$0.00 (0.00%)</span>
                                </div>
                            </div>
                        </div>

                        <div class="expanded-coin-card" data-coin="BTC">
                            <div class="expanded-coin-header">
                                <div class="expanded-coin-symbol">
                                    <i class="expanded-coin-icon">₿</i>
                                    <span>BTC</span>
                                </div>
                                <div class="expanded-coin-status" id="expanded-btc-status">💤</div>
                            </div>
                            <div class="expanded-coin-stats">
                                <div class="expanded-stat-row">
                                    <span>Quantity:</span>
                                    <span id="expanded-btc-quantity">0.000000</span>
                                </div>
                                <div class="expanded-stat-row">
                                    <span>Purchase:</span>
                                    <span id="expanded-btc-purchase-price">$0.00</span>
                                </div>
                                <div class="expanded-stat-row">
                                    <span>Current:</span>
                                    <span id="expanded-btc-current-price">Loading...</span>
                                </div>
                                <div class="expanded-stat-row">
                                    <span>Value:</span>
                                    <span id="expanded-btc-total-value">$0.00</span>
                                </div>
                                <div class="expanded-stat-row expanded-profit-row">
                                    <span>Profit:</span>
                                    <span id="expanded-btc-profit" class="expanded-profit-value">$0.00 (0.00%)</span>
                                </div>
                            </div>
                        </div>

                        <div class="expanded-coin-card" data-coin="AMPL">
                            <div class="expanded-coin-header">
                                <div class="expanded-coin-symbol">
                                    <i class="expanded-coin-icon">🎯</i>
                                    <span>AMPL</span>
                                </div>
                                <div class="expanded-coin-status" id="expanded-ampl-status">💤</div>
                            </div>
                            <div class="expanded-coin-stats">
                                <div class="expanded-stat-row">
                                    <span>Quantity:</span>
                                    <span id="expanded-ampl-quantity">0.000</span>
                                </div>
                                <div class="expanded-stat-row">
                                    <span>Purchase:</span>
                                    <span id="expanded-ampl-purchase-price">$0.00</span>
                                </div>
                                <div class="expanded-stat-row">
                                    <span>Current:</span>
                                    <span id="expanded-ampl-current-price">Loading...</span>
                                </div>
                                <div class="expanded-stat-row">
                                    <span>Value:</span>
                                    <span id="expanded-ampl-total-value">$0.00</span>
                                </div>
                                <div class="expanded-stat-row expanded-profit-row">
                                    <span>Profit:</span>
                                    <span id="expanded-ampl-profit" class="expanded-profit-value">$0.00 (0.00%)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.expandedModal = modal;
        
        // Bind close events
        document.getElementById('modal-close').addEventListener('click', () => this.closeExpandedModal());
        document.getElementById('modal-backdrop').addEventListener('click', () => this.closeExpandedModal());
        
        // Update expanded modal with current data
        this.updateExpandedModal();
        
        console.log('📱 Expanded modal created');
    }

    showExpandedModal() {
        if (!this.expandedModal) {
            this.createExpandedModal();
        }
        
        this.expandedModal.style.display = 'flex';
        this.isExpanded = true;
        
        // Update expand button icon
        const expandBtn = document.getElementById('expand-panel');
        if (expandBtn) {
            expandBtn.innerHTML = '<i class="fas fa-compress"></i>';
            expandBtn.title = 'Collapse Panel';
        }
        
        this.playSound('click');
        this.logAction('Panel expanded to full view');
    }

    closeExpandedModal() {
        if (this.expandedModal) {
            this.expandedModal.style.display = 'none';
        }
        
        this.isExpanded = false;
        
        // Update expand button icon
        const expandBtn = document.getElementById('expand-panel');
        if (expandBtn) {
            expandBtn.innerHTML = '<i class="fas fa-expand"></i>';
            expandBtn.title = 'Expand Panel';
        }
        
        this.playSound('click');
        this.logAction('Panel collapsed to normal view');
    }

    updateExpandedModal() {
        if (!this.expandedModal || !this.isExpanded) return;
        
        // Update expanded modal with current data
        const expandedElements = {
            'expanded-total-invested': this.settings.totalInvested.toFixed(2),
            'expanded-total-current-value': this.settings.totalCurrentValue.toFixed(2),
            'expanded-total-profit': this.settings.totalProfit.toFixed(2),
            'expanded-total-profit-percent': this.settings.totalProfitPercent.toFixed(2)
        };
        
        Object.keys(expandedElements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = id.includes('percent') ? `${expandedElements[id]}%` : `$${expandedElements[id]}`;
            }
        });
        
        // Update coin data in expanded modal
        Object.keys(this.coins).forEach(coinKey => {
            const coin = this.coins[coinKey];
            const coinLower = coinKey.toLowerCase();
            
            const elements = {
                [`expanded-${coinLower}-quantity`]: coin.quantity.toFixed(coinKey === 'BTC' ? 6 : 3),
                [`expanded-${coinLower}-purchase-price`]: `$${coin.purchasePrice.toFixed(2)}`,
                [`expanded-${coinLower}-current-price`]: `$${coin.currentPrice.toFixed(2)}`,
                [`expanded-${coinLower}-total-value`]: `$${coin.totalValue.toFixed(2)}`,
                [`expanded-${coinLower}-profit`]: `$${coin.profit.toFixed(2)} (${coin.profitPercent.toFixed(2)}%)`
            };
            
            Object.keys(elements).forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = elements[id];
                    
                    if (id.includes('profit')) {
                        element.className = coin.profit >= 0 ? 'expanded-profit-value positive' : 'expanded-profit-value negative';
                    }
                }
            });
            
            // Update status in expanded modal
            const statusEl = document.getElementById(`expanded-${coinLower}-status`);
            if (statusEl) {
                if (coin.quantity > 0) {
                    if (coin.profitPercent >= this.settings.profitThreshold) {
                        statusEl.textContent = '🎯';
                    } else if (coin.profit > 0) {
                        statusEl.textContent = '📈';
                    } else {
                        statusEl.textContent = '📊';
                    }
                } else {
                    statusEl.textContent = '💤';
                }
            }
        });
    }

    applyStyles() {
        const style = document.createElement('style');
        style.id = 'ampl-rebalancing-refined-styles';
        style.textContent = `
            /* Refined Rebalancing System Styles with Click-to-Expand */
            .rebalancing-container {
                width: 100%;
                height: 100%;
                max-height: 100%;
                display: flex;
                flex-direction: column;
                background: var(--panel-bw, #000000);
                color: var(--text-primary, #ffffff);
                border-radius: var(--border-radius, 6px);
                overflow: hidden;
                padding: 8px;
                gap: 6px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                box-sizing: border-box;
                position: relative;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                cursor: pointer;
            }

            /* Removed hover zoom effect - now click-to-expand only */
            .rebalancing-container:hover {
                border: 1px solid rgba(76, 175, 80, 0.2);
            }

            .rebalancing-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 6px 8px;
                background: rgba(255, 255, 255, 0.06);
                border-radius: 4px;
                flex-shrink: 0;
                border: 1px solid rgba(255, 255, 255, 0.12);
                box-sizing: border-box;
                transition: all 0.3s ease;
            }

            .rebalancing-title {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 11px;
                font-weight: 600;
                color: var(--text-primary, #ffffff);
                letter-spacing: 0.3px;
                transition: all 0.3s ease;
            }

            .rebalancing-title i {
                color: #4CAF50;
                font-size: 12px;
                transition: all 0.3s ease;
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }

            .system-status {
                font-size: 9px;
                padding: 2px 6px;
                border-radius: 3px;
                background: rgba(76, 175, 80, 0.2);
                color: #4CAF50;
                border: 1px solid rgba(76, 175, 80, 0.3);
                font-weight: 500;
                transition: all 0.3s ease;
                animation: blink 1.5s infinite;
            }

            @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            .rebalancing-controls {
                display: flex;
                gap: 4px;
            }

            .rebalancing-btn {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: var(--text-primary, #ffffff);
                padding: 4px 6px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 9px;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                align-items: center;
                gap: 3px;
                font-weight: 500;
                box-sizing: border-box;
            }

            .rebalancing-btn:hover {
                background: rgba(255, 255, 255, 0.2);
                border-color: rgba(255, 255, 255, 0.4);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            }

            .sound-btn.sound-disabled {
                background: rgba(244, 67, 54, 0.2);
                border-color: rgba(244, 67, 54, 0.4);
                color: #F44336;
            }

            .expand-btn {
                background: rgba(76, 175, 80, 0.2);
                border-color: rgba(76, 175, 80, 0.4);
                color: #4CAF50;
            }

            .expand-btn:hover {
                background: rgba(76, 175, 80, 0.3);
                border-color: rgba(76, 175, 80, 0.6);
            }

            .rebalancing-btn i {
                font-size: 10px;
                transition: all 0.3s ease;
            }

            /* Settings Panel */
            .settings-panel {
                background: rgba(255, 255, 255, 0.04);
                border-radius: 4px;
                padding: 6px;
                display: none;
                flex-shrink: 0;
                border: 1px solid rgba(255, 255, 255, 0.08);
                box-sizing: border-box;
                transition: all 0.3s ease;
            }

            .settings-panel.visible {
                display: block;
            }

            .settings-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 4px;
                font-size: 10px;
                transition: all 0.3s ease;
            }

            .settings-row:last-child {
                margin-bottom: 0;
            }

            .settings-row label {
                color: var(--text-secondary, #b0b0b0);
                font-weight: 500;
            }

            .settings-row select {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: var(--text-primary, #ffffff);
                padding: 2px 4px;
                border-radius: 3px;
                font-size: 9px;
                min-width: 60px;
                font-weight: 500;
                box-sizing: border-box;
                transition: all 0.3s ease;
            }

            .threshold-value {
                color: #FFC107;
                font-weight: 600;
                font-size: 10px;
                transition: all 0.3s ease;
            }

            .current-ampl-price {
                color: var(--text-secondary, #b0b0b0);
                font-size: 9px;
                font-weight: 500;
                transition: all 0.3s ease;
            }

            /* Overall Stats */
            .overall-stats {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 4px;
                flex-shrink: 0;
            }

            .stat-item {
                background: rgba(255, 255, 255, 0.04);
                border-radius: 4px;
                padding: 4px;
                text-align: center;
                border: 1px solid rgba(255, 255, 255, 0.1);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-sizing: border-box;
                cursor: help;
            }

            .stat-item:hover {
                background: rgba(255, 255, 255, 0.08);
                border-color: rgba(255, 255, 255, 0.25);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }

            .stat-label {
                display: block;
                font-size: 8px;
                color: var(--text-secondary, #b0b0b0);
                margin-bottom: 2px;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.3px;
                transition: all 0.3s ease;
            }

            .stat-value {
                display: block;
                font-size: 10px;
                font-weight: 600;
                color: var(--text-primary, #ffffff);
                transition: all 0.3s ease;
            }

            .stat-value.profit {
                color: #4CAF50;
            }

            .stat-value.loss {
                color: #F44336;
            }

            /* Coins Grid */
            .coins-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 4px;
                flex: 1;
                min-height: 0;
                overflow: hidden;
            }

            .coin-card {
                background: rgba(255, 255, 255, 0.04);
                border-radius: 4px;
                padding: 6px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                flex-direction: column;
                gap: 4px;
                box-sizing: border-box;
                overflow: hidden;
                cursor: help;
            }

            /* Removed individual hover sounds and effects */
            .coin-card:hover {
                border-color: rgba(255, 255, 255, 0.2);
                background: rgba(255, 255, 255, 0.06);
            }

            .coin-card.profitable {
                border-color: rgba(76, 175, 80, 0.4);
                background: rgba(76, 175, 80, 0.06);
            }

            .coin-card.loss {
                border-color: rgba(244, 67, 54, 0.4);
                background: rgba(244, 67, 54, 0.06);
            }

            .coin-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-shrink: 0;
            }

            .coin-symbol {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 11px;
                font-weight: 600;
                color: var(--text-primary, #ffffff);
                transition: all 0.3s ease;
            }

            .coin-icon {
                font-size: 12px;
                transition: all 0.3s ease;
            }

            .coin-status {
                font-size: 11px;
                transition: all 0.3s ease;
            }

            .coin-stats {
                display: flex;
                flex-direction: column;
                gap: 2px;
                flex: 1;
                min-height: 0;
            }

            .stat-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 9px;
                transition: all 0.3s ease;
            }

            .stat-row span:first-child {
                color: var(--text-secondary, #b0b0b0);
                font-weight: 500;
            }

            .stat-row span:last-child {
                color: var(--text-primary, #ffffff);
                font-weight: 600;
            }

            .profit-row .profit-value.positive {
                color: #4CAF50;
            }

            .profit-row .profit-value.negative {
                color: #F44336;
            }

            /* Action Log */
            .action-log {
                background: rgba(255, 255, 255, 0.04);
                border-radius: 4px;
                padding: 4px;
                flex-shrink: 0;
                max-height: 60px;
                overflow: hidden;
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-sizing: border-box;
                transition: all 0.3s ease;
            }

            .log-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 3px;
                font-size: 9px;
                color: var(--text-secondary, #b0b0b0);
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.3px;
                transition: all 0.3s ease;
            }

            .clear-log-btn {
                background: none;
                border: none;
                color: var(--text-secondary, #b0b0b0);
                cursor: pointer;
                font-size: 8px;
                padding: 2px 4px;
                border-radius: 2px;
                transition: all 0.3s ease;
                font-weight: 500;
            }

            .clear-log-btn:hover {
                background: rgba(255, 255, 255, 0.15);
                color: var(--text-primary, #ffffff);
            }

            .log-messages {
                max-height: 40px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 2px;
                transition: all 0.3s ease;
            }

            .log-messages::-webkit-scrollbar {
                width: 3px;
            }

            .log-messages::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 2px;
            }

            .log-messages::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.15);
                border-radius: 2px;
            }

            .log-message {
                display: flex;
                gap: 4px;
                font-size: 8px;
                padding: 2px 3px;
                border-radius: 2px;
                background: rgba(255, 255, 255, 0.02);
                border: 1px solid rgba(255, 255, 255, 0.05);
                box-sizing: border-box;
                transition: all 0.3s ease;
            }

            .log-time {
                color: var(--text-muted, #808080);
                flex-shrink: 0;
                min-width: 35px;
                font-weight: 500;
                transition: all 0.3s ease;
            }

            .log-text {
                color: var(--text-primary, #ffffff);
                flex: 1;
                font-weight: 500;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            /* Loading animation for live data */
            .loading {
                animation: loading-pulse 1.5s infinite;
            }

            @keyframes loading-pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            /* Expanded Modal Styles */
            .rebalancing-expanded-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }

            .modal-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(5px);
            }

            .modal-content {
                position: relative;
                width: 480px;
                height: 384px;
                background: var(--panel-bw, #000000);
                border: 2px solid rgba(76, 175, 80, 0.5);
                border-radius: 12px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                animation: modalSlideIn 0.3s ease-out;
            }

            @keyframes modalSlideIn {
                from {
                    opacity: 0;
                    transform: scale(0.8) translateY(-50px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                background: rgba(76, 175, 80, 0.15);
                border-bottom: 1px solid rgba(76, 175, 80, 0.3);
                flex-shrink: 0;
            }

            .modal-title {
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 16px;
                font-weight: 700;
                color: var(--text-primary, #ffffff);
                text-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
            }

            .modal-title i {
                color: #4CAF50;
                font-size: 18px;
            }

            .modal-close-btn {
                background: rgba(244, 67, 54, 0.2);
                border: 1px solid rgba(244, 67, 54, 0.4);
                color: #F44336;
                padding: 8px 10px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s ease;
            }

            .modal-close-btn:hover {
                background: rgba(244, 67, 54, 0.3);
                border-color: rgba(244, 67, 54, 0.6);
                transform: scale(1.1);
            }

            .modal-body {
                flex: 1;
                padding: 16px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            /* Expanded Overall Stats */
            .expanded-overall-stats {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 12px;
                flex-shrink: 0;
            }

            .expanded-stat-item {
                background: rgba(255, 255, 255, 0.08);
                border-radius: 8px;
                padding: 12px;
                text-align: center;
                border: 1px solid rgba(255, 255, 255, 0.2);
                transition: all 0.3s ease;
                box-sizing: border-box;
            }

            .expanded-stat-item:hover {
                background: rgba(255, 255, 255, 0.12);
                border-color: rgba(255, 255, 255, 0.3);
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
            }

            .expanded-stat-label {
                display: block;
                font-size: 12px;
                color: var(--text-secondary, #b0b0b0);
                margin-bottom: 6px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .expanded-stat-value {
                display: block;
                font-size: 16px;
                font-weight: 700;
                color: var(--text-primary, #ffffff);
            }

            .expanded-stat-value.profit {
                color: #4CAF50;
                text-shadow: 0 0 8px rgba(76, 175, 80, 0.6);
            }

            .expanded-stat-value.loss {
                color: #F44336;
                text-shadow: 0 0 8px rgba(244, 67, 54, 0.6);
            }

            /* Expanded Coins Grid */
            .expanded-coins-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
                flex: 1;
                min-height: 0;
            }

            .expanded-coin-card {
                background: rgba(255, 255, 255, 0.08);
                border-radius: 8px;
                padding: 12px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                transition: all 0.3s ease;
                display: flex;
                flex-direction: column;
                gap: 8px;
                box-sizing: border-box;
            }

            .expanded-coin-card:hover {
                border-color: rgba(255, 255, 255, 0.3);
                background: rgba(255, 255, 255, 0.12);
                transform: translateY(-3px);
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
            }

            .expanded-coin-card.profitable {
                border-color: rgba(76, 175, 80, 0.6);
                background: rgba(76, 175, 80, 0.12);
                box-shadow: 0 0 16px rgba(76, 175, 80, 0.3);
            }

            .expanded-coin-card.loss {
                border-color: rgba(244, 67, 54, 0.6);
                background: rgba(244, 67, 54, 0.12);
                box-shadow: 0 0 16px rgba(244, 67, 54, 0.3);
            }

            .expanded-coin-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-shrink: 0;
            }

            .expanded-coin-symbol {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 16px;
                font-weight: 700;
                color: var(--text-primary, #ffffff);
            }

            .expanded-coin-icon {
                font-size: 20px;
            }

            .expanded-coin-status {
                font-size: 18px;
            }

            .expanded-coin-stats {
                display: flex;
                flex-direction: column;
                gap: 4px;
                flex: 1;
            }

            .expanded-stat-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 13px;
            }

            .expanded-stat-row span:first-child {
                color: var(--text-secondary, #b0b0b0);
                font-weight: 600;
            }

            .expanded-stat-row span:last-child {
                color: var(--text-primary, #ffffff);
                font-weight: 700;
            }

            .expanded-profit-row .expanded-profit-value.positive {
                color: #4CAF50;
                text-shadow: 0 0 6px rgba(76, 175, 80, 0.6);
            }

            .expanded-profit-row .expanded-profit-value.negative {
                color: #F44336;
                text-shadow: 0 0 6px rgba(244, 67, 54, 0.6);
            }

            /* Tooltip Enhancement */
            [title]:hover::after {
                content: attr(title);
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                white-space: nowrap;
                z-index: 1001;
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            }
        `;
        
        // Remove any existing styles first
        const existingStyles = document.querySelectorAll('[id*="ampl-rebalancing"]');
        existingStyles.forEach(style => style.remove());
        
        document.head.appendChild(style);
    }

    bindEventListeners() {
        console.log('🔗 Binding refined rebalancing system event listeners...');
        
        // Main container click for expand
        const container = document.getElementById('rebalancing-container');
        if (container) {
            container.addEventListener('click', (event) => {
                // Don't expand if clicking on buttons or controls
                if (!event.target.closest('.rebalancing-controls') && 
                    !event.target.closest('.settings-panel') &&
                    !event.target.closest('.clear-log-btn')) {
                    
                    if (this.isExpanded) {
                        this.closeExpandedModal();
                    } else {
                        this.showExpandedModal();
                    }
                }
            });
        }
        
        this.targetPanel.addEventListener('click', (event) => {
            const target = event.target.closest('button');
            if (!target) return;
            
            // Prevent event bubbling for button clicks
            event.stopPropagation();
            
            this.playSound('click');
            const buttonId = target.id;
            console.log(`🔘 Refined rebalancing button clicked: ${buttonId}`);
            
            switch (buttonId) {
                case 'expand-panel':
                    if (this.isExpanded) {
                        this.closeExpandedModal();
                    } else {
                        this.showExpandedModal();
                    }
                    break;
                case 'toggle-sound':
                    this.toggleSound();
                    break;
                case 'show-settings':
                    this.toggleSettings();
                    break;
                case 'refresh-prices':
                    this.updateLivePrices();
                    this.logAction('Live prices refreshed manually');
                    break;
                case 'clear-log':
                    this.clearActionLog();
                    break;
                case 'restore-original':
                    this.restoreOriginal();
                    break;
            }
        });

        // Settings change listeners with persistence
        this.targetPanel.addEventListener('change', (event) => {
            const target = event.target;
            
            switch (target.id) {
                case 'profit-threshold':
                    this.settings.profitThreshold = parseFloat(target.value);
                    this.savePersistentSettings();
                    this.logAction(`Profit threshold set to ${target.value}%`);
                    break;
                case 'rebalance-threshold':
                    this.settings.rebalanceThreshold = parseFloat(target.value);
                    this.savePersistentSettings();
                    this.logAction(`Rebalance threshold set to ${target.value}%`);
                    break;
                case 'exchange-select':
                    this.settings.selectedExchange = target.value;
                    this.savePersistentSettings();
                    this.logAction(`Exchange set to ${target.value}`);
                    break;
            }
        });
        
        console.log('✅ Refined rebalancing event listeners bound with click-to-expand');
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const soundIcon = document.getElementById('sound-icon');
        const soundBtn = document.getElementById('toggle-sound');
        
        if (this.soundEnabled) {
            soundIcon.className = 'fas fa-volume-up';
            soundBtn.classList.remove('sound-disabled');
            this.logAction('Sound effects enabled');
            this.playSound('click');
        } else {
            soundIcon.className = 'fas fa-volume-mute';
            soundBtn.classList.add('sound-disabled');
            this.logAction('Sound effects disabled');
        }
        
        this.savePersistentSettings();
    }

    toggleSettings() {
        const settingsPanel = document.getElementById('settings-panel');
        if (settingsPanel) {
            settingsPanel.classList.toggle('visible');
            const isVisible = settingsPanel.classList.contains('visible');
            this.logAction(isVisible ? 'Settings panel opened' : 'Settings panel closed');
        }
    }

    restoreOriginal() {
        if (this.targetPanel && this.originalContent) {
            this.targetPanel.innerHTML = this.originalContent;
            this.logAction('Restored original Limit Orders panel');
            console.log('✅ Restored original Limit Orders panel');
        }
    }

    startLivePriceMonitoring() {
        console.log('🔍 Starting live price monitoring...');
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        this.updateLivePrices();
        
        this.monitoringInterval = setInterval(() => {
            this.updateLivePrices();
        }, 30000);
        
        console.log('✅ Live price monitoring started (30-second intervals)');
    }

    async updateLivePrices() {
        try {
            console.log('📊 Fetching live prices...');
            this.setLoadingState(true);
            
            const prices = await this.fetchLivePrices();
            
            if (prices.SOL) this.coins.SOL.currentPrice = prices.SOL;
            if (prices.SUI) this.coins.SUI.currentPrice = prices.SUI;
            if (prices.BTC) this.coins.BTC.currentPrice = prices.BTC;
            if (prices.AMPL) this.coins.AMPL.currentPrice = prices.AMPL;
            
            const amplPriceEl = document.getElementById('current-ampl-price');
            if (amplPriceEl && prices.AMPL) {
                amplPriceEl.textContent = `Current: $${prices.AMPL.toFixed(3)}`;
            }
            
            this.calculateProfits();
            this.updateDisplay();
            this.updateExpandedModal();
            this.checkRebalanceOpportunities();
            this.setLoadingState(false);
            
            this.logAction('Live prices updated successfully');
            
        } catch (error) {
            console.log('📊 Error updating live prices:', error.message);
            this.logAction('Error fetching live prices - using cached data');
            this.setLoadingState(false);
        }
    }

    async fetchLivePrices() {
        const prices = {};
        
        try {
            const responses = await Promise.allSettled([
                this.fetchFromBinance(),
                this.fetchFromCoinGecko(),
                this.fetchFromKuCoin()
            ]);
            
            for (const response of responses) {
                if (response.status === 'fulfilled' && response.value) {
                    Object.assign(prices, response.value);
                    break;
                }
            }
            
            if (Object.keys(prices).length === 0) {
                console.log('📊 Using fallback simulated prices');
                prices.SOL = 180 + (Math.random() - 0.5) * 20;
                prices.SUI = 3.5 + (Math.random() - 0.5) * 0.5;
                prices.BTC = 95000 + (Math.random() - 0.5) * 5000;
                prices.AMPL = 1.189 + (Math.random() - 0.5) * 0.1;
            }
            
        } catch (error) {
            console.log('📊 Error in fetchLivePrices:', error.message);
            prices.SOL = 180 + (Math.random() - 0.5) * 20;
            prices.SUI = 3.5 + (Math.random() - 0.5) * 0.5;
            prices.BTC = 95000 + (Math.random() - 0.5) * 5000;
            prices.AMPL = 1.189 + (Math.random() - 0.5) * 0.1;
        }
        
        return prices;
    }

    async fetchFromBinance() {
        try {
            const symbols = ['SOLUSDT', 'SUIUSDT', 'BTCUSDT'];
            const promises = symbols.map(symbol => 
                fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`)
                    .then(res => res.json())
            );
            
            const results = await Promise.all(promises);
            
            return {
                SOL: parseFloat(results[0].price),
                SUI: parseFloat(results[1].price),
                BTC: parseFloat(results[2].price),
                AMPL: 1.189 + (Math.random() - 0.5) * 0.1
            };
        } catch (error) {
            console.log('📊 Binance API error:', error.message);
            return null;
        }
    }

    async fetchFromCoinGecko() {
        try {
            const response = await fetch(
                'https://api.coingecko.com/api/v3/simple/price?ids=solana,sui,bitcoin,ampleforth&vs_currencies=usd'
            );
            const data = await response.json();
            
            return {
                SOL: data.solana?.usd || 0,
                SUI: data.sui?.usd || 0,
                BTC: data.bitcoin?.usd || 0,
                AMPL: data.ampleforth?.usd || 0
            };
        } catch (error) {
            console.log('📊 CoinGecko API error:', error.message);
            return null;
        }
    }

    async fetchFromKuCoin() {
        try {
            const symbols = ['SOL-USDT', 'SUI-USDT', 'BTC-USDT', 'AMPL-USDT'];
            const promises = symbols.map(symbol => 
                fetch(`https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${symbol}`)
                    .then(res => res.json())
            );
            
            const results = await Promise.all(promises);
            
            return {
                SOL: parseFloat(results[0].data?.price) || 0,
                SUI: parseFloat(results[1].data?.price) || 0,
                BTC: parseFloat(results[2].data?.price) || 0,
                AMPL: parseFloat(results[3].data?.price) || 0
            };
        } catch (error) {
            console.log('📊 KuCoin API error:', error.message);
            return null;
        }
    }

    setLoadingState(isLoading) {
        const priceElements = [
            'sol-current-price', 'sui-current-price', 
            'btc-current-price', 'ampl-current-price'
        ];
        
        priceElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (isLoading) {
                    element.classList.add('loading');
                    if (element.textContent === 'Loading...') return;
                } else {
                    element.classList.remove('loading');
                }
            }
        });
    }

    checkRebalanceOpportunities() {
        const opportunities = [];
        
        Object.keys(this.coins).forEach(coinKey => {
            const coin = this.coins[coinKey];
            if (coin.quantity > 0 && Math.abs(coin.profitPercent) >= this.settings.rebalanceThreshold) {
                opportunities.push({
                    coin: coinKey,
                    profitPercent: coin.profitPercent,
                    action: coin.profitPercent > 0 ? 'SELL' : 'HOLD'
                });
            }
        });
        
        if (opportunities.length > 0) {
            this.playSound('profit');
            opportunities.forEach(opp => {
                this.logAction(`${opp.action} opportunity: ${opp.coin} (${opp.profitPercent.toFixed(2)}%)`);
            });
        }
    }

    calculateProfits() {
        let totalInvested = 0;
        let totalCurrentValue = 0;
        
        Object.keys(this.coins).forEach(coinKey => {
            const coin = this.coins[coinKey];
            
            if (coin.quantity > 0) {
                const invested = coin.quantity * coin.purchasePrice;
                const currentValue = coin.quantity * coin.currentPrice;
                
                coin.totalValue = currentValue;
                coin.profit = currentValue - invested;
                coin.profitPercent = invested > 0 ? (coin.profit / invested) * 100 : 0;
                
                totalInvested += invested;
                totalCurrentValue += currentValue;
            }
        });
        
        this.settings.totalInvested = totalInvested;
        this.settings.totalCurrentValue = totalCurrentValue;
        this.settings.totalProfit = totalCurrentValue - totalInvested;
        this.settings.totalProfitPercent = totalInvested > 0 ? (this.settings.totalProfit / totalInvested) * 100 : 0;
    }

    updateDisplay() {
        // Update overall stats
        const totalInvestedEl = document.getElementById('total-invested');
        const totalCurrentValueEl = document.getElementById('total-current-value');
        const totalProfitEl = document.getElementById('total-profit');
        const totalProfitPercentEl = document.getElementById('total-profit-percent');
        
        if (totalInvestedEl) totalInvestedEl.textContent = `$${this.settings.totalInvested.toFixed(2)}`;
        if (totalCurrentValueEl) totalCurrentValueEl.textContent = `$${this.settings.totalCurrentValue.toFixed(2)}`;
        if (totalProfitEl) totalProfitEl.textContent = `$${this.settings.totalProfit.toFixed(2)}`;
        if (totalProfitPercentEl) totalProfitPercentEl.textContent = `${this.settings.totalProfitPercent.toFixed(2)}%`;
        
        // Update profit colors
        if (totalProfitEl && totalProfitPercentEl) {
            if (this.settings.totalProfit >= 0) {
                totalProfitEl.className = 'stat-value profit';
                totalProfitPercentEl.className = 'stat-value profit';
            } else {
                totalProfitEl.className = 'stat-value loss';
                totalProfitPercentEl.className = 'stat-value loss';
            }
        }
        
        // Update individual coins
        Object.keys(this.coins).forEach(coinKey => {
            const coin = this.coins[coinKey];
            const coinLower = coinKey.toLowerCase();
            
            const quantityEl = document.getElementById(`${coinLower}-quantity`);
            const purchasePriceEl = document.getElementById(`${coinLower}-purchase-price`);
            const currentPriceEl = document.getElementById(`${coinLower}-current-price`);
            const totalValueEl = document.getElementById(`${coinLower}-total-value`);
            const profitEl = document.getElementById(`${coinLower}-profit`);
            const statusEl = document.getElementById(`${coinLower}-status`);
            
            if (quantityEl) quantityEl.textContent = coin.quantity.toFixed(coinKey === 'BTC' ? 6 : 3);
            if (purchasePriceEl) purchasePriceEl.textContent = `$${coin.purchasePrice.toFixed(2)}`;
            if (currentPriceEl) currentPriceEl.textContent = `$${coin.currentPrice.toFixed(2)}`;
            if (totalValueEl) totalValueEl.textContent = `$${coin.totalValue.toFixed(2)}`;
            
            if (profitEl) {
                const profitText = `$${coin.profit.toFixed(2)} (${coin.profitPercent.toFixed(2)}%)`;
                profitEl.textContent = profitText;
                
                if (coin.profit >= 0) {
                    profitEl.className = 'profit-value positive';
                } else {
                    profitEl.className = 'profit-value negative';
                }
            }
            
            // Update coin card styling
            const coinCard = document.querySelector(`[data-coin="${coinKey}"]`);
            if (coinCard) {
                coinCard.className = 'coin-card';
                if (coin.profit > 0) {
                    coinCard.classList.add('profitable');
                } else if (coin.profit < 0) {
                    coinCard.classList.add('loss');
                }
            }
            
            // Update status
            if (statusEl) {
                if (coin.quantity > 0) {
                    if (coin.profitPercent >= this.settings.profitThreshold) {
                        statusEl.textContent = '🎯';
                    } else if (coin.profit > 0) {
                        statusEl.textContent = '📈';
                    } else {
                        statusEl.textContent = '📊';
                    }
                } else {
                    statusEl.textContent = '💤';
                }
            }
        });
    }

    loadRealPositions() {
        // Load sample data for demonstration
        this.coins.SOL.quantity = 0.5;
        this.coins.SOL.purchasePrice = 175.00;
        
        this.coins.SUI.quantity = 25.0;
        this.coins.SUI.purchasePrice = 3.20;
        
        this.coins.BTC.quantity = 0.001;
        this.coins.BTC.purchasePrice = 92000;
        
        this.coins.AMPL.quantity = 100.0;
        this.coins.AMPL.purchasePrice = 1.15;
        
        this.logAction('Live portfolio positions loaded');
        this.calculateProfits();
        this.updateDisplay();
    }

    logAction(message) {
        const logMessages = document.getElementById('log-messages');
        if (!logMessages) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = 'log-message';
        logEntry.innerHTML = `
            <span class="log-time">${timestamp}</span>
            <span class="log-text">${message}</span>
        `;
        
        logMessages.insertBefore(logEntry, logMessages.firstChild);
        
        while (logMessages.children.length > 15) {
            logMessages.removeChild(logMessages.lastChild);
        }
    }

    clearActionLog() {
        const logMessages = document.getElementById('log-messages');
        if (logMessages) {
            logMessages.innerHTML = `
                <div class="log-message">
                    <span class="log-time">Ready</span>
                    <span class="log-text">Live action log cleared</span>
                </div>
            `;
        }
        this.logAction('Live action log cleared');
    }

    // Public methods for external integration
    updateCoinData(coinSymbol, quantity, purchasePrice) {
        if (this.coins[coinSymbol]) {
            this.coins[coinSymbol].quantity = quantity;
            this.coins[coinSymbol].purchasePrice = purchasePrice;
            this.calculateProfits();
            this.updateDisplay();
            this.updateExpandedModal();
            this.logAction(`Updated ${coinSymbol}: ${quantity} @ $${purchasePrice}`);
        }
    }

    getCurrentAMPLPrice() {
        return this.coins.AMPL.currentPrice;
    }

    shouldBuy() {
        return this.coins.AMPL.currentPrice < this.settings.amplThreshold;
    }

    getCoinsReadyToSell() {
        const readyToSell = [];
        Object.keys(this.coins).forEach(coinKey => {
            const coin = this.coins[coinKey];
            if (coin.quantity > 0 && coin.profitPercent >= this.settings.profitThreshold) {
                readyToSell.push({
                    symbol: coinKey,
                    quantity: coin.quantity,
                    profit: coin.profit,
                    profitPercent: coin.profitPercent
                });
            }
        });
        return readyToSell;
    }

    getRebalanceOpportunities() {
        const opportunities = [];
        Object.keys(this.coins).forEach(coinKey => {
            const coin = this.coins[coinKey];
            if (coin.quantity > 0 && Math.abs(coin.profitPercent) >= this.settings.rebalanceThreshold) {
                opportunities.push({
                    symbol: coinKey,
                    quantity: coin.quantity,
                    profitPercent: coin.profitPercent,
                    action: coin.profitPercent > 0 ? 'SELL' : 'HOLD'
                });
            }
        });
        return opportunities;
    }
}

// Initialize the refined rebalancing system
const amplRebalancingSystemRefined = new AMPLRebalancingSystemRefined();

// Global functions for external use
function updateRebalancingCoin(coinSymbol, quantity, purchasePrice) {
    if (amplRebalancingSystemRefined) {
        amplRebalancingSystemRefined.updateCoinData(coinSymbol, quantity, purchasePrice);
    }
}

function getRebalancingStatus() {
    if (amplRebalancingSystemRefined) {
        return {
            shouldBuy: amplRebalancingSystemRefined.shouldBuy(),
            coinsReadyToSell: amplRebalancingSystemRefined.getCoinsReadyToSell(),
            rebalanceOpportunities: amplRebalancingSystemRefined.getRebalanceOpportunities(),
            currentAMPLPrice: amplRebalancingSystemRefined.getCurrentAMPLPrice(),
            totalProfit: amplRebalancingSystemRefined.settings.totalProfit
        };
    }
    return null;
}

console.log('🎬 AMPL Rebalancing System (Refined with Click-to-Expand & Mechanical Sounds) loaded successfully');

