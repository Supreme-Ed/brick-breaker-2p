/**
 * Main entry point for Brick Breaker 2P
 * Loads necessary modules and initializes the game
 */

import { AudioManager } from './utils/audio.js';
import { game } from './core/game.js';

// Debug helper
window.debug = function(message) {
    // Only log if not in production build
    if (!import.meta.env.PROD) {
        console.log(`[DEBUG] ${message}`);
    }
};

// Expose game globally for tests/debugging
window.game = game;

// Instantiate AudioManager globally
window.audioManager = new AudioManager();

// Function to initialize the game
async function initializeGame() { // Make the function async
    debug('[DEBUG] Brick Breaker 2P initializing...'); // Use debug helper

    // Get mode from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get('mode');
    const controlParam = urlParams.get('control');
    
    // Determine game mode
    let gameMode = 1; // Default to Player vs AI
    let controlMethod = 'keyboard';
    
    if (modeParam === '1') {
        gameMode = 1; // Player vs AI
        controlMethod = controlParam === 'mouse' ? 'mouse' : 'keyboard';
        debug(`[DEBUG] Game Mode: Player vs AI. Player 1 controls: ${controlMethod}`);
    } else if (modeParam === '2') {
        gameMode = 2; // Two Players
        controlMethod = 'keyboard';
        console.log("[DEBUG] Game Mode: Two Players. Player 1 controls: Keyboard, Player 2 controls: Keyboard");
    } else if (modeParam === '3') {
        gameMode = 3; // AI vs AI
        debug("[DEBUG] Game Mode: AI vs AI"); // Use debug helper
    }
    
    // Initialize the game
    try {
      await game.init(gameMode, controlMethod); // Await the async init call
      debug("Game initialization call completed.");
    } catch (error) {
      console.error('[DEBUG] Error during game.init:', error);
    }
    debug("Game initialization logic finished.");
}

// Setup UI Buttons and start game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const returnBtn = document.getElementById('returnToMenuBtn');
    const restartBtn = document.getElementById('restartGameBtn');

    if (returnBtn) {
        returnBtn.addEventListener('click', () => game.returnToStartScreen());
    } else {
        console.warn('[InputManager] Could not find returnToMenuBtn');
    }

    if (restartBtn) {
        restartBtn.addEventListener('click', () => game.restartGame());
    } else {
        console.warn('[InputManager] Could not find restartGameBtn');
    }
    
    // Initialize the game
    initializeGame();
});
