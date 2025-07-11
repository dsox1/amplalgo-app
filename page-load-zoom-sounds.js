/**
 * Page Load Zoom Sounds
 * Handles 6-second continuous beeping during page load zoom animation
 */

class PageLoadZoomSounds {
    constructor() {
        this.audioContext = null;
        this.soundsTriggered = false;
        
        // Initialize audio context
        this.initializeAudio();
        
        // Start 6-second continuous beeping immediately on page load
        this.startPageLoadBeeping();
    }

    initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🔊 Page load zoom sounds audio context initialized');
        } catch (error) {
            console.log('🔇 Audio not available for page load sounds:', error.message);
        }
    }

    startPageLoadBeeping() {
        if (this.soundsTriggered || !this.audioContext) return;
        
        console.log('🔊 Starting 6-second continuous beeping for page load zoom...');
        
        // Start beeping immediately
        setTimeout(() => {
            this.playContinuousBeeping();
        }, 100); // Very short delay to ensure audio context is ready
        
        this.soundsTriggered = true;
        console.log('✅ 6-second continuous beeping started for page load zoom');
    }

    playContinuousBeeping() {
        if (!this.audioContext) return;
        
        try {
            console.log('🔊 Playing 6-second continuous beeping sequence for zoom animation...');
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filterNode = this.audioContext.createBiquadFilter();
            
            oscillator.connect(filterNode);
            filterNode.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Configure for sober mechanical beeping
            oscillator.type = 'sine';
            filterNode.type = 'bandpass';
            filterNode.frequency.setValueAtTime(600, this.audioContext.currentTime);
            
            const beepDuration = 0.3;
            const pauseDuration = 0.8;
            const totalDuration = 6.0; // 6 seconds total
            const beepCycle = beepDuration + pauseDuration; // 1.1 seconds per cycle
            const totalBeeps = Math.floor(totalDuration / beepCycle); // About 5-6 beeps
            
            console.log(`🔊 Creating ${totalBeeps} beeps over ${totalDuration} seconds for zoom animation`);
            
            for (let i = 0; i < totalBeeps; i++) {
                const startTime = this.audioContext.currentTime + (i * beepCycle);
                const endTime = startTime + beepDuration;
                
                oscillator.frequency.setValueAtTime(600, startTime);
                gainNode.gain.setValueAtTime(0.08, startTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, endTime);
                
                if (i === 0) {
                    oscillator.start(startTime);
                }
            }
            
            oscillator.stop(this.audioContext.currentTime + totalDuration);
            
            console.log('✅ 6-second continuous beeping sequence initiated for page load zoom');
            
        } catch (error) {
            console.log('🔇 Page load zoom beeping error:', error.message);
        }
    }
}

// Initialize page load zoom sounds
const pageLoadZoomSounds = new PageLoadZoomSounds();

console.log('🎬 Page Load Zoom Sounds (6-Second Continuous Beeping) loaded successfully');

