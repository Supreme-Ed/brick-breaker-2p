/**
 * Audio system for Brick Breaker 2P
 * Handles all sound effects using Web Audio API by loading and playing audio files.
 */

// Define the mapping of sound names to their file paths
const SOUND_FILES = {
    paddleHit: 'assets/audio/hit.wav',
    wallHit: 'assets/audio/wall.wav',
    brickHit: 'assets/audio/brick_hit.wav',
    powerUp: 'assets/audio/powerup.wav',
    laserShoot: 'assets/audio/laser_shoot.wav',
    laserHit: 'assets/audio/laser_hit.wav',
    freezeRayShoot: 'assets/audio/freeze_shoot.wav',
    freezeRayHit: 'assets/audio/freeze_hit.wav',
    levelComplete: 'assets/audio/complete.wav',
    uiClick: 'assets/audio/click.wav'
    // Add other sounds here if needed
};

export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.gainNode = null;
        // this.isMuted = false; // Removed mute functionality
        this.isInitialized = false;
        this.soundBuffers = {}; // To store loaded AudioBuffers
    }

    async init() {
        if (this.isInitialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);

            // Resume context if needed (user interaction might be required)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            console.log("[DEBUG] Audio context initialized. Loading sounds...");
            await this.loadAudioFiles(); // Load sounds after context is ready

            this.isInitialized = true;
            console.log("[DEBUG] Audio system fully initialized and sounds loaded.");

        } catch (e) {
            console.error("[DEBUG] Web Audio API not supported or initialization failed:", e);
            this.isInitialized = false; // Ensure it's marked as not initialized on error
        }
    }

    async loadAudioFiles() {
        const loadPromises = Object.entries(SOUND_FILES).map(async ([name, path]) => {
            try {
                const response = await fetch(path);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for ${path}`);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                return [name, audioBuffer]; // Pair name with buffer
            } catch (error) {
                console.error(`Error loading sound '${name}' from ${path}:`, error);
                return [name, null]; // Indicate failure for this sound
            }
        });

        // Wait for all loading attempts
        const results = await Promise.all(loadPromises);

        // Store successfully loaded buffers
        this.soundBuffers = Object.fromEntries(results.filter(entry => entry[1] !== null));
        console.log('[DEBUG] Loaded audio buffers:', Object.keys(this.soundBuffers));

        // Report failures
        const failures = results.filter(entry => entry[1] === null);
        if (failures.length > 0) {
            console.warn('[DEBUG] Failed to load some audio buffers:', failures.map(f => f[0]));
        }
    }

    playSound(soundName) {
        if (!this.isInitialized) {
            return; // Don't play anything if not ready
        }

        // Check if the specific sound buffer exists
        if (this.soundBuffers[soundName]) {
            // Buffer exists, play the loaded sound file
            this._playBuffer(soundName);
        } else {
            // Buffer doesn't exist (failed to load), play fallback beep
            console.warn(`[DEBUG] Sound '${soundName}' not found or not loaded. Playing default beep.`);
            this._playDefaultBeep();
        }
    }

    // --- Helper method to play a loaded buffer ---
    _playBuffer(soundName) {

        // Resume context if it somehow got suspended again
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        try {
            const source = this.audioContext.createBufferSource();
            source.buffer = this.soundBuffers[soundName];
            source.connect(this.gainNode);
            source.start(0); // Play immediately
        } catch (error) {
            console.error(`[DEBUG] Error playing sound ${soundName}:`, error);
        }
    }

    // --- Helper method to play a fallback synthesized beep ---
    _playDefaultBeep() {
        if (!this.audioContext) return; // Need context

        // Resume context if needed
        if (this.audioContext.state === 'suspended') {
            // Attempt to resume, then play beep once resumed (or fail silently)
            this.audioContext.resume().then(() => {
                 this._createAndPlayBeep(); // Try playing *after* resume attempt completes
            }).catch(e => console.error('Error resuming audio context for beep:', e));
        } else {
             this._createAndPlayBeep(); // Context is running, play directly
        }
    }

    // --- Helper to create and play the actual beep oscillator ---
    _createAndPlayBeep() {

        // Ensure context is running before proceeding
        if (!this.audioContext || this.audioContext.state !== 'running') {
             // Provide a clearer warning if the context is suspended
             const state = this.audioContext ? this.audioContext.state : 'not initialized';
             console.warn(`[DEBUG Beep] Cannot play fallback beep because AudioContext is not running. Current state: ${state}. User interaction might be required to resume the context.`);
             return;
        }

        try {
            const oscillator = this.audioContext.createOscillator();
            const beepGain = this.audioContext.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
            beepGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            beepGain.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + 0.15);

            oscillator.connect(beepGain);
            beepGain.connect(this.gainNode);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.15);
        } catch (error) {
            console.error(`Error creating/playing default beep:`, error);
        }
    }

    // Removed toggleMute() method
}

// Create and export a singleton instance
export const audioManager = new AudioManager();
