/**
 * Audio system for Brick Breaker 2P
 * Handles all sound effects using Web Audio API by loading and playing audio files.
 */

// Define the mapping of sound names to their file paths
const SOUND_FILES = {
    paddleHit: 'assets/audio/hit.mp3',
    wallHit: 'assets/audio/wall.mp3',
    brickHit: 'assets/audio/brick_hit.mp3',
    powerUp: 'assets/audio/power_up.mp3', // Corrected filename
    laserShoot: 'assets/audio/laser_shoot.mp3',
    laserHit: 'assets/audio/laser_hit.mp3',
    freezeRayShoot: 'assets/audio/freeze_shoot.mp3',
    freezeRayHit: 'assets/audio/freeze_hit.mp3',
    // levelComplete: 'assets/audio/complete.wav', // Removed - File does not exist
    uiClick: 'assets/audio/click.mp3', // Corrected extension
    paddleUnfreeze: 'assets/audio/paddle_unfreeze.mp3', // Added unfreeze sound
    paddleUnash: 'assets/audio/paddle_unash.mp3' // Added unash sound
    // Add other sounds here if needed
};

export class AudioManager {
    constructor() {
        this.audioContext = null; // Will be created on user gesture
        this.gainNode = null; // Will be created on user gesture
        // this.isMuted = false; // Removed mute functionality
        this.isInitialized = false; // True only after context created AND files loaded
        this.soundBuffers = {}; // To store loaded AudioBuffers
        this.contextResumed = false; // Tracks if context is running
        this.isLoading = false; // Flag to prevent multiple load attempts
        this.initCalled = false; // Flag to track if basic init setup was done
    }

    // Removed stub init() function. Initialization is handled by tryResumeContext().

    // Now called by tryResumeContext AFTER context is created/resumed. Ensure it's async.
    async loadAudioFiles() {
        if (!this.audioContext) {
            console.error("[DEBUG Audio Load] Cannot load files, AudioContext does not exist.");
            return; // Should not happen if called correctly
        }
        console.log("[DEBUG Audio Load] Starting audio file loading...");
        const loadPromises = Object.entries(SOUND_FILES).map(async ([name, path]) => {
            try {
                const response = await fetch(path);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for ${path}`);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                console.log(`[DEBUG Audio Load] Successfully decoded '${name}'`);
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
        console.log(`[DEBUG Audio Play] Request to play sound: '${soundName}'`);
        if (!this.isInitialized || !this.audioContext) {
             console.warn(`[DEBUG Audio Play] Cannot play sound '${soundName}'. Audio system not initialized (isInitialized: ${this.isInitialized}, audioContext exists: ${!!this.audioContext}).`);
            return; // Don't play anything if not ready
        }
        console.log(`[DEBUG Audio Play] Current context state: ${this.audioContext.state}. Main gain value: ${this.gainNode.gain.value}`);

        // Attempt to resume context if suspended - often needed after user interaction
        if (this.audioContext.state === 'suspended') {
            console.log(`[DEBUG Audio Play] Context is suspended. Attempting resume for '${soundName}'...`);
            this.audioContext.resume().then(() => {
                console.log(`[DEBUG Audio Play] Context resumed successfully for '${soundName}'. Current state: ${this.audioContext.state}. Playing sound...`);
                this._playRequestedSound(soundName); // Play sound AFTER resume attempt
            }).catch(e => {
                 console.error(`[DEBUG Audio] Error resuming context: ${e}. Sound '${soundName}' might not play.`);
                 // Optionally, try playing the beep even if resume failed, it might work in some cases
                 this._playDefaultBeep();
            });
        } else {
             // Context is already running, play directly
             this._playRequestedSound(soundName);
        }
    }

    // New helper function to avoid duplicating the play logic
    _playRequestedSound(soundName) {

         // Check if the specific sound buffer exists
         if (this.soundBuffers[soundName]) {
             // Buffer exists, play the loaded sound file
             this._playBuffer(soundName);
         } else {
             // Buffer doesn't exist (failed to load), play fallback beep
             console.warn(`[DEBUG Audio] Sound buffer '${soundName}' not found or not loaded. Playing default beep.`);
             this._playDefaultBeep();
         }
    }

    // --- Helper method to play a loaded buffer ---
    _playBuffer(soundName) {

        // No longer need to resume here, handled in playSound
        // if (this.audioContext.state === 'suspended') {
        //     this.audioContext.resume();
        // }

        try {
            const source = this.audioContext.createBufferSource();
            source.buffer = this.soundBuffers[soundName];
            console.log(`[DEBUG Audio Play] Connecting source for '${soundName}' to main gain node (value: ${this.gainNode.gain.value})`);
            source.connect(this.gainNode);
            console.log(`[DEBUG Audio Play] Calling source.start(0) for '${soundName}'`);
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

            console.log(`[DEBUG Beep] Connecting oscillator to beepGain (value: ${beepGain.gain.value})`);
            oscillator.connect(beepGain);
            console.log(`[DEBUG Beep] Connecting beepGain to main gainNode (value: ${this.gainNode.gain.value})`);
            beepGain.connect(this.gainNode);

            console.log(`[DEBUG Beep] Calling oscillator.start()`);
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.15);
        } catch (error) {
            console.error(`Error creating/playing default beep:`, error);
        }
    }
// Removed toggleMute() method

// Method to CREATE/Resume context and trigger loading, called on first user interaction
async tryResumeContext() {
    // Prevent multiple initializations or if already done
    if (this.isInitialized || this.isLoading) {
        // console.log(`[DEBUG Audio Resume] Skipping resume/init (isInitialized: ${this.isInitialized}, isLoading: ${this.isLoading})`);
        return;
    }

    // Removed check for initCalled and call to deleted init() function.
    console.log("[DEBUG Audio Resume] Attempting proactive context creation/resume...");
    this.isLoading = true; // Mark as loading

    try {
        // 1. Create AudioContext if it doesn't exist
        if (!this.audioContext) {
            console.log("[DEBUG Audio Resume] Attempting to create AudioContext...");
            try {
                 this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                 // Log success and state immediately after creation attempt
                 console.log(`[DEBUG Audio Resume] AudioContext creation attempted. Context exists: ${!!this.audioContext}, State: ${this.audioContext ? this.audioContext.state : 'N/A'}`);
            } catch (creationError) {
                 console.error("[DEBUG Audio Resume] FAILED TO CREATE AudioContext:", creationError);
                 this.isLoading = false; // Stop loading process
                 return; // Exit if creation failed
            }
        }

        // 2. Create GainNode if it doesn't exist
        if (this.audioContext && !this.gainNode) {
             console.log("[DEBUG Audio Resume] Creating GainNode...");
             this.gainNode = this.audioContext.createGain();
             console.log(`[DEBUG Audio Resume] Main gainNode created. Default gain: ${this.gainNode.gain.value}`);
             this.gainNode.connect(this.audioContext.destination);
        }

        // 3. Resume if suspended
        if (this.audioContext && this.audioContext.state === 'suspended') {
            console.log("[DEBUG Audio Resume] Context suspended, attempting resume...");
            await this.audioContext.resume();
            console.log(`[DEBUG Audio Resume] Context resume attempt finished. New state: ${this.audioContext.state}`);
        }

        // Check if context is now running
        if (this.audioContext && this.audioContext.state === 'running') {
            this.contextResumed = true; // Mark as running
            console.log("[DEBUG Audio Resume] AudioContext is running. Starting audio file loading...");

            // 4. Await loading BEFORE marking as initialized
            try {
                await this.loadAudioFiles(); // Await loading HERE
                this.isInitialized = true; // Set initialized AFTER loading succeeds
                console.log("[DEBUG Audio Resume] Audio file loading completed. Set isInitialized=true.");
            } catch (loadErr) {
                 console.error("[DEBUG Audio Resume] Audio file loading failed:", loadErr);
                 // Keep isInitialized false if loading fails critically
                 this.isInitialized = false;
            }
        } else {
             console.error(`[DEBUG Audio Resume] Context failed to start/resume. Final state: ${this.audioContext ? this.audioContext.state : 'No Context'}. Audio will likely not play.`);
             this.isInitialized = false; // Ensure false if context didn't start
        }

    } catch (error) {
        console.error("[DEBUG Audio Resume] Error during context creation/resume/load:", error);
        this.isInitialized = false; // Ensure false on error
    } finally {
        this.isLoading = false; // Unmark loading flag
    }
}
}

// Create and export a singleton instance
export const audioManager = new AudioManager();
