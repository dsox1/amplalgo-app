/**
 * AMPL Manager and Sell Price Target Persistence
 * Handles persistence for AMPL Manager checkbox and Sell Price Target buttons
 */

class AMPLManagerPersistence {
    constructor() {
        // Load persistent settings when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            setTimeout(() => this.initialize(), 1000); // Delay to ensure elements are loaded
        }
    }

    initialize() {
        console.log('🎬 Initializing AMPL Manager and Sell Price Target Persistence...');
        
        // Load persistent settings
        this.loadAMPLManagerPersistence();
        this.loadSellPriceTargetsPersistence();
        
        // Watch for changes to auto-save
        this.watchForPersistenceChanges();
        
        console.log('✅ AMPL Manager and Sell Price Target Persistence initialized successfully');
    }

    loadAMPLManagerPersistence() {
        try {
            const savedAMPLManagerState = localStorage.getItem('amplManagerEnabled');
            
            if (savedAMPLManagerState !== null) {
                const isEnabled = savedAMPLManagerState === 'true';
                
                // Apply to AMPL Manager checkbox
                setTimeout(() => {
                    // Try multiple selectors to find AMPL Manager checkbox
                    const amplManagerCheckbox = document.querySelector(
                        'input[type="checkbox"][id*="ampl"], ' +
                        'input[type="checkbox"][name*="ampl"], ' +
                        'input[type="checkbox"][class*="ampl"], ' +
                        '.ampl-manager input[type="checkbox"], ' +
                        '#ampl-manager, ' +
                        '.ampl-checkbox'
                    );
                    
                    if (amplManagerCheckbox) {
                        amplManagerCheckbox.checked = isEnabled;
                        console.log(`✅ Restored AMPL Manager state: ${isEnabled ? 'Enabled' : 'Disabled'}`);
                        
                        // Trigger change event to ensure proper state
                        amplManagerCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
                    } else {
                        console.log('⚠️ AMPL Manager checkbox not found - will retry...');
                        // Retry after more time for elements to load
                        setTimeout(() => this.loadAMPLManagerPersistence(), 2000);
                    }
                }, 500);
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
                // Apply to sell price target buttons - try multiple selectors
                const target110Btn = document.querySelector(
                    'button[data-target="1.10"], ' +
                    '.target-btn[data-value="1.10"], ' +
                    'button[value="1.10"], ' +
                    '.price-target-110, ' +
                    '#target-110'
                );
                
                const target125Btn = document.querySelector(
                    'button[data-target="1.25"], ' +
                    '.target-btn[data-value="1.25"], ' +
                    'button[value="1.25"], ' +
                    '.price-target-125, ' +
                    '#target-125'
                );
                
                const target140Btn = document.querySelector(
                    'button[data-target="1.40"], ' +
                    '.target-btn[data-value="1.40"], ' +
                    'button[value="1.40"], ' +
                    '.price-target-140, ' +
                    '#target-140'
                );
                
                if (savedTarget110 === 'true' && target110Btn) {
                    target110Btn.classList.add('active', 'selected');
                    console.log('✅ Restored 1.10 target button state');
                }
                
                if (savedTarget125 === 'true' && target125Btn) {
                    target125Btn.classList.add('active', 'selected');
                    console.log('✅ Restored 1.25 target button state');
                }
                
                if (savedTarget140 === 'true' && target140Btn) {
                    target140Btn.classList.add('active', 'selected');
                    console.log('✅ Restored 1.40 target button state');
                }
                
                // Apply current target
                if (savedCurrentTarget) {
                    const currentTargetDisplay = document.querySelector(
                        '.current-target, ' +
                        '#current-target, ' +
                        '.target-display, ' +
                        '.selected-target'
                    );
                    
                    if (currentTargetDisplay) {
                        currentTargetDisplay.textContent = savedCurrentTarget;
                        console.log(`✅ Restored current target: ${savedCurrentTarget}`);
                    }
                }
                
                if (!target110Btn && !target125Btn && !target140Btn) {
                    console.log('⚠️ Sell Price Target buttons not found - will retry...');
                    // Retry after more time for elements to load
                    setTimeout(() => this.loadSellPriceTargetsPersistence(), 2000);
                }
            }, 500);
        } catch (error) {
            console.log('⚠️ Error loading Sell Price Targets persistence:', error.message);
        }
    }

    saveAMPLManagerPersistence() {
        try {
            const amplManagerCheckbox = document.querySelector(
                'input[type="checkbox"][id*="ampl"], ' +
                'input[type="checkbox"][name*="ampl"], ' +
                'input[type="checkbox"][class*="ampl"], ' +
                '.ampl-manager input[type="checkbox"], ' +
                '#ampl-manager, ' +
                '.ampl-checkbox'
            );
            
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
            const target110Btn = document.querySelector(
                'button[data-target="1.10"], ' +
                '.target-btn[data-value="1.10"], ' +
                'button[value="1.10"], ' +
                '.price-target-110, ' +
                '#target-110'
            );
            
            const target125Btn = document.querySelector(
                'button[data-target="1.25"], ' +
                '.target-btn[data-value="1.25"], ' +
                'button[value="1.25"], ' +
                '.price-target-125, ' +
                '#target-125'
            );
            
            const target140Btn = document.querySelector(
                'button[data-target="1.40"], ' +
                '.target-btn[data-value="1.40"], ' +
                'button[value="1.40"], ' +
                '.price-target-140, ' +
                '#target-140'
            );
            
            const currentTargetDisplay = document.querySelector(
                '.current-target, ' +
                '#current-target, ' +
                '.target-display, ' +
                '.selected-target'
            );
            
            if (target110Btn) {
                const isActive = target110Btn.classList.contains('active') || target110Btn.classList.contains('selected');
                localStorage.setItem('amplSellTarget110', isActive.toString());
                console.log(`💾 Saved 1.10 target state: ${isActive}`);
            }
            
            if (target125Btn) {
                const isActive = target125Btn.classList.contains('active') || target125Btn.classList.contains('selected');
                localStorage.setItem('amplSellTarget125', isActive.toString());
                console.log(`💾 Saved 1.25 target state: ${isActive}`);
            }
            
            if (target140Btn) {
                const isActive = target140Btn.classList.contains('active') || target140Btn.classList.contains('selected');
                localStorage.setItem('amplSellTarget140', isActive.toString());
                console.log(`💾 Saved 1.40 target state: ${isActive}`);
            }
            
            if (currentTargetDisplay) {
                const currentTarget = currentTargetDisplay.textContent;
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
        const amplManagerCheckbox = document.querySelector(
            'input[type="checkbox"][id*="ampl"], ' +
            'input[type="checkbox"][name*="ampl"], ' +
            'input[type="checkbox"][class*="ampl"], ' +
            '.ampl-manager input[type="checkbox"], ' +
            '#ampl-manager, ' +
            '.ampl-checkbox'
        );
        
        if (amplManagerCheckbox) {
            amplManagerCheckbox.addEventListener('change', () => {
                this.saveAMPLManagerPersistence();
            });
            console.log('👀 Watching AMPL Manager checkbox for changes');
        } else {
            // Retry watching after delay
            setTimeout(() => {
                this.watchForPersistenceChanges();
            }, 2000);
        }
        
        // Watch sell price target button changes
        const targetButtons = document.querySelectorAll(
            'button[data-target], ' +
            '.target-btn[data-value], ' +
            'button[value*="1."], ' +
            '.price-target-110, ' +
            '.price-target-125, ' +
            '.price-target-140, ' +
            '#target-110, ' +
            '#target-125, ' +
            '#target-140'
        );
        
        if (targetButtons.length > 0) {
            targetButtons.forEach(button => {
                button.addEventListener('click', () => {
                    setTimeout(() => {
                        this.saveSellPriceTargetsPersistence();
                    }, 100); // Small delay to ensure state has changed
                });
            });
            console.log(`👀 Watching ${targetButtons.length} sell price target buttons for changes`);
        } else {
            // Retry watching after delay
            setTimeout(() => {
                this.watchForPersistenceChanges();
            }, 2000);
        }
        
        // Watch for any button clicks in the sell price targets area
        document.addEventListener('click', (event) => {
            const target = event.target;
            
            // Check if clicked element is related to sell price targets
            if (target.matches('button[data-target], .target-btn, button[value*="1."]') ||
                target.closest('.sell-price-targets') ||
                target.closest('.price-targets') ||
                target.textContent.includes('1.10') ||
                target.textContent.includes('1.25') ||
                target.textContent.includes('1.40')) {
                
                setTimeout(() => {
                    this.saveSellPriceTargetsPersistence();
                }, 200); // Delay to ensure state changes are applied
            }
        });
        
        console.log('👀 Watching for AMPL Manager and Sell Price Target changes for auto-persistence');
    }
}

// Initialize AMPL Manager and Sell Price Target persistence
const amplManagerPersistence = new AMPLManagerPersistence();

console.log('🎬 AMPL Manager and Sell Price Target Persistence loaded successfully');

