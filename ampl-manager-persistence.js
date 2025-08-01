/**
 * AMPL Manager and Sell Price Target Persistence - Fixed Version
 * Uses proper code-based detection methods from script.js
 */

class AMPLManagerPersistenceFixed {
    constructor() {
        // Load persistent settings when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            setTimeout(() => this.initialize(), 1000); // Delay to ensure elements are loaded
        }
    }

    initialize() {
        console.log('🎬 Initializing AMPL Manager and Sell Price Target Persistence (Fixed Version)...');
        
        // Load persistent settings
        this.loadAMPLManagerPersistence();
        this.loadSellPriceTargetsPersistence();
        
        // Watch for changes to auto-save
        this.watchForPersistenceChanges();
        
        console.log('✅ AMPL Manager and Sell Price Target Persistence (Fixed) initialized successfully');
    }

    loadAMPLManagerPersistence() {
        try {
            const savedAMPLManagerState = localStorage.getItem('amplManagerEnabled');
            
            if (savedAMPLManagerState !== null) {
                const isEnabled = savedAMPLManagerState === 'true';
                
                // Apply to AMPL Manager checkbox - using code-based detection from script.js
                setTimeout(() => {
                    // Look for AMPL Manager checkbox in the Trading Controls section
                    const amplManagerCheckbox = document.querySelector('#ampl-manager');
                    
                    if (amplManagerCheckbox) {
                        amplManagerCheckbox.checked = isEnabled;
                        console.log(`✅ Restored AMPL Manager state: ${isEnabled ? 'Enabled' : 'Disabled'}`);
                        
                        // Trigger change event to ensure proper state
                        amplManagerCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
                    } else {
                        console.log('⚠️ AMPL Manager checkbox (#ampl-manager) not found - will retry...');
                        // Retry after more time for elements to load
                        setTimeout(() => this.loadAMPLManagerPersistence(), 20000);
                    }
                }, 5000);
            }
        } catch (error) {
            console.log('⚠️ Error loading AMPL Manager persistence:', error.message);
        }
    }

    loadSellPriceTargetsPersistence() {
        try {
            const savedTarget110 = localStorage.getItem('amplSellTarget110');
            const savedTarget125 = localStorage.getItem('amplSellTarget125');
            const savedTarget140 = localStorage.getItem('amplSellTarget140');
            const savedCurrentTarget = localStorage.getItem('amplCurrentTarget');
            
            setTimeout(() => {
                // Apply to sell price target buttons - using code-based detection from script.js
                // From script.js: thresholdButtons.forEach(button => { ... button.getAttribute("data-value") ... })
                const thresholdButtons = document.querySelectorAll('.threshold-btn');
                const currentThresholdDisplay = document.getElementById('current-threshold');
                
                console.log(`Found ${thresholdButtons.length} threshold buttons`);
                
                thresholdButtons.forEach(button => {
                    const buttonValue = parseFloat(button.getAttribute('data-value'));
                    
                    if (buttonValue === 1.10 && savedTarget110 === 'true') {
                        button.classList.add('active');
                        console.log('✅ Restored 1.10 target button state');
                    }
                    
                    if (buttonValue === 1.25 && savedTarget125 === 'true') {
                        button.classList.add('active');
                        console.log('✅ Restored 1.25 target button state');
                    }
                    
                    if (buttonValue === 1.40 && savedTarget140 === 'true') {
                        button.classList.add('active');
                        console.log('✅ Restored 1.40 target button state');
                    }
                });
                
                // Apply current target to display
                if (savedCurrentTarget && currentThresholdDisplay) {
                    currentThresholdDisplay.textContent = savedCurrentTarget;
                    console.log(`✅ Restored current target display: ${savedCurrentTarget}`);
                }
                
                if (thresholdButtons.length === 0) {
                    console.log('⚠️ Sell Price Target buttons (.threshold-btn) not found - will retry...');
                    // Retry after more time for elements to load
                    setTimeout(() => this.loadSellPriceTargetsPersistence(), 20000);
                }
            }, 5000);
        } catch (error) {
            console.log('⚠️ Error loading Sell Price Targets persistence:', error.message);
        }
    }

    saveAMPLManagerPersistence() {
        try {
            const amplManagerCheckbox = document.querySelector('#ampl-manager');
            
            if (amplManagerCheckbox) {
                const isEnabled = amplManagerCheckbox.checked;
                localStorage.setItem('amplManagerEnabled', isEnabled.toString());
                console.log(`💾 Saved AMPL Manager state: ${isEnabled ? 'Enabled' : 'Disabled'}`);
            }
        } catch (error) {
            console.log('⚠️ Error saving AMPL Manager persistence:', error.message);
        }
    }

    saveSellPriceTargetsPersistence() {
        try {
            const thresholdButtons = document.querySelectorAll('.threshold-btn');
            const currentThresholdDisplay = document.getElementById('current-threshold');
            
            // Reset all saved states first
            localStorage.setItem('amplSellTarget110', 'false');
            localStorage.setItem('amplSellTarget125', 'false');
            localStorage.setItem('amplSellTarget140', 'false');
            
            // Save active button states
            thresholdButtons.forEach(button => {
                const buttonValue = parseFloat(button.getAttribute('data-value'));
                const isActive = button.classList.contains('active');
                
                if (buttonValue === 1.10) {
                    localStorage.setItem('amplSellTarget110', isActive.toString());
                    console.log(`💾 Saved 1.10 target state: ${isActive}`);
                }
                
                if (buttonValue === 1.25) {
                    localStorage.setItem('amplSellTarget125', isActive.toString());
                    console.log(`💾 Saved 1.25 target state: ${isActive}`);
                }
                
                if (buttonValue === 1.40) {
                    localStorage.setItem('amplSellTarget140', isActive.toString());
                    console.log(`💾 Saved 1.40 target state: ${isActive}`);
                }
            });
            
            // Save current target display
            if (currentThresholdDisplay) {
                const currentTarget = currentThresholdDisplay.textContent;
                localStorage.setItem('amplCurrentTarget', currentTarget);
                console.log(`💾 Saved current target: ${currentTarget}`);
            }
        } catch (error) {
            console.log('⚠️ Error saving Sell Price Targets persistence:', error.message);
        }
    }

    // Watch for changes in AMPL Manager and Sell Price Targets to auto-save
    watchForPersistenceChanges() {
        // Watch AMPL Manager checkbox changes
        const amplManagerCheckbox = document.querySelector('#ampl-manager');
        
        if (amplManagerCheckbox) {
            amplManagerCheckbox.addEventListener('change', () => {
                this.saveAMPLManagerPersistence();
            });
            console.log('👀 Watching AMPL Manager checkbox (#ampl-manager) for changes');
        } else {
            // Retry watching after delay
            setTimeout(() => {
                this.watchForPersistenceChanges();
            }, 20000);
        }
        
        // Watch sell price target button changes - using code-based detection from script.js
        const thresholdButtons = document.querySelectorAll('.threshold-btn');
        
        if (thresholdButtons.length > 0) {
            thresholdButtons.forEach(button => {
                button.addEventListener('click', () => {
                    // Small delay to ensure the active class has been applied
                    setTimeout(() => {
                        this.saveSellPriceTargetsPersistence();
                    }, 1000);
                });
            });
            console.log(`👀 Watching ${thresholdButtons.length} sell price target buttons (.threshold-btn) for changes`);
        } else {
            // Retry watching after delay
            setTimeout(() => {
                this.watchForPersistenceChanges();
            }, 20000);
        }
        
        // Also watch for any changes to the current threshold display
        const currentThresholdDisplay = document.getElementById('current-threshold');
        if (currentThresholdDisplay) {
            // Use MutationObserver to watch for text changes
            const observer = new MutationObserver(() => {
                setTimeout(() => {
                    this.saveSellPriceTargetsPersistence();
                }, 1000);
            });
            
            observer.observe(currentThresholdDisplay, {
                childList: true,
                subtree: true,
                characterData: true
            });
            
            console.log('👀 Watching current threshold display (#current-threshold) for changes');
        }
        
        console.log('👀 Watching for AMPL Manager and Sell Price Target changes for auto-persistence (Fixed Version)');
    }
}

// Initialize AMPL Manager and Sell Price Target persistence (Fixed Version)
const amplManagerPersistenceFixed = new AMPLManagerPersistenceFixed();

console.log('🎬 AMPL Manager and Sell Price Target Persistence (Fixed Version) loaded successfully');

