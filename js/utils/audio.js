/**
 * Audio system for Brick Breaker 2P
 * Handles all sound effects and music using Web Audio API
 */

export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.gainNode = null;
        this.isMuted = false;
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
            this.isInitialized = true;
            console.log("[DEBUG] Audio system initialized");
        } catch (e) {
            console.error("[DEBUG] Web Audio API not supported:", e);
        }
    }

    _playNote(freq, type = 'sine', duration = 0.1, vol = 0.5, delay = 0) {
        if (!this.isInitialized || this.isMuted) return;
        
        // Resume audio context if it's suspended (browser policy)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        // Schedule note to play after delay
        setTimeout(() => {
            this._actuallyPlayNote(freq, type, duration, vol);
        }, delay * 1000);
    }

    _actuallyPlayNote(freq, type, duration, vol) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = type;
        oscillator.frequency.value = freq;
        gainNode.gain.value = vol;
        
        oscillator.connect(gainNode);
        gainNode.connect(this.gainNode);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // Specific sound effects
    playPaddleHit(impact = 0.5) { this._playNote(220 + impact * 100, 'triangle', 0.1, 0.3); }
    playWallHit() { this._playNote(440, 'sine', 0.05, 0.2); }
    playPowerUp() { this._playNote(880, 'sine', 0.2, 0.3); this._playNote(1100, 'sine', 0.1, 0.3, 0.2); }
    playLaserShoot() { this._playNote(880, 'sawtooth', 0.05, 0.3); this._playNote(1100, 'sawtooth', 0.05, 0.3, 0.05); this._playNote(1320, 'sawtooth', 0.1, 0.3, 0.1); }
    playLaserHit() { this._playNote(1320, 'sawtooth', 0.05, 0.3); this._playNote(880, 'sawtooth', 0.05, 0.3, 0.05); this._playNote(440, 'sawtooth', 0.1, 0.3, 0.1); }
    playFreezeRay() { this._playNote(220, 'sine', 0.3, 0.3); }
    playScore() { this._playNote(523, 'sine', 0.05); this._playNote(659, 'sine', 0.05, 0.5, 0.05); this._playNote(784, 'sine', 0.1, 0.5, 0.1); }
    playGameStart() { this._playNote(440, 'sine', 0.1, 0.5); this._playNote(554, 'sine', 0.1, 0.5, 0.1); this._playNote(659, 'sine', 0.2, 0.5, 0.2); }
    playLevelComplete() { this._playNote(523, 'sine', 0.1, 0.5); this._playNote(659, 'sine', 0.1, 0.5, 0.1); this._playNote(784, 'sine', 0.1, 0.5, 0.2); this._playNote(1047, 'sine', 0.3, 0.5, 0.3); }
    playMiss() { this._playNote(392, 'sine', 0.1, 0.5); this._playNote(349, 'sine', 0.1, 0.5, 0.1); this._playNote(330, 'sine', 0.3, 0.5, 0.2); }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isInitialized) {
            this.gainNode.gain.value = this.isMuted ? 0 : 1;
        }
        return this.isMuted;
    }
}

// Create and export a singleton instance
export const audioManager = new AudioManager();
