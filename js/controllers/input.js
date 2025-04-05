/**
 * Input Manager for Brick Breaker 2P
 * Handles keyboard, mouse, and touch input
 */
import { audioManager } from '../utils/audio.js'; // Import the singleton instance

export class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = { 
            ArrowLeft: false, 
            ArrowRight: false, 
            a: false, 
            d: false, 
            Space: false, 
            s: false, 
            Escape: false,
            l: false, // Cheat: Add Laser
            f: false, // Cheat: Add FreezeRay
            w: false, // Cheat: Add Wide Paddle
            p: false  // Added 'p' key for pause
        };
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        this.activeTouches = {};
        // Initialize mouse position to center to avoid initial jump left
        this.mousePosition = { x: canvas.width / 2, y: canvas.height / 2 }; 
        this.isMouseDown = false;
        this.justClicked = false; // Flag for detecting new clicks
        this.tapPosition = null; // Position of the last detected tap
        this.justTapped = false; // Flag for reacting to a tap event
        this.clickPending = false; // New flag to track if a click needs processing
        
        // New flags for keyboard power-up activation
        this.spaceKeyPending = false;
        this.sKeyPending = false;
        
        // Track the last time power-ups were activated to prevent too frequent activation
        this.lastSpaceActivation = 0;
        this.lastSActivation = 0;
        this.activationCooldown = 300; // Reduced cooldown for more responsive feel
        // Removed initialInteractionOccurred flag - audio init handled by game.js
        
        // Bound event handlers for cleanup
        this._boundKeyDown = null;
        this._boundKeyUp = null;
        this._boundMouseMove = null;
        this._boundMouseDown = null;
        this._boundMouseUp = null;
        
        this.setupEventListeners();
        
        // Check inputs periodically to ensure we don't miss any
        this.inputCheckInterval = setInterval(() => this.checkInputState(), 100);
    }
    
    setupEventListeners() {
        // Remove any existing event listeners to prevent duplicates
        this.removeEventListeners();
        
        // Store bound event handlers so we can remove them later if needed
        this._boundKeyDown = this.handleKeyDown.bind(this);
        this._boundKeyUp = this.handleKeyUp.bind(this);
        this._boundMouseMove = this.handleMouseMove.bind(this);
        this._boundMouseDown = this.handleMouseDown.bind(this);
        this._boundMouseUp = this.handleMouseUp.bind(this);
        
        // Keyboard events - add to window to ensure they're captured regardless of focus
        window.addEventListener('keydown', this._boundKeyDown);
        window.addEventListener('keyup', this._boundKeyUp);
        
        // Also add to document for broader coverage
        document.addEventListener('keydown', this._boundKeyDown);
        document.addEventListener('keyup', this._boundKeyUp);
        
        // Mouse events
        this.canvas.addEventListener('mousemove', this._boundMouseMove);
        this.canvas.addEventListener('mousedown', this._boundMouseDown);
        this.canvas.addEventListener('mouseup', this._boundMouseUp);
        
        // Touch events (if supported)
        if (this.isTouchDevice) {
            this.setupTouchControls();
        }
        
        console.log("[Input] Event listeners set up");
    }
    
    handleKeyDown(e) {
        // Removed audio context resume trigger - handled by game.js init
        // Log all key events to debug spacebar issues
        console.log(`[Input] Key down: '${e.key}', keyCode: ${e.keyCode}, code: ${e.code}`);
        
        // More robust space key detection - check all possible representations
        if (e.key === ' ' || e.key === 'Space' || e.code === 'Space' || e.keyCode === 32) {
            this.keys.Space = true;
            this.spaceKeyPending = true; // New flag to track space key press
            console.log("[Input] Space key pressed, pending activation");
            e.preventDefault();
            return; // Early return after handling space
        }
        
        // More robust S key detection
        if (e.key === 's' || e.key === 'S' || e.code === 'KeyS' || e.keyCode === 83) {
            this.keys.s = true;
            this.sKeyPending = true; // New flag to track s key press
            console.log("[Input] 's' key pressed, pending activation");
            e.preventDefault();
            return; // Early return after handling s
        }
        
        // More robust P key detection
        if (e.key === 'p' || e.key === 'P' || e.code === 'KeyP' || e.keyCode === 80) {
            this.keys.p = true;
            console.log("[Input] 'p' key pressed");
            e.preventDefault();
            return; // Early return after handling p
        }
        // More robust W key detection (for Wide Paddle cheat)
        if (e.key === 'w' || e.key === 'W' || e.code === 'KeyW' || e.keyCode === 87) {
            this.keys.w = true;
            console.log("[Input] 'w' key pressed (Wide Paddle Cheat)");
            e.preventDefault();
            return; // Early return after handling w
        }
        
        // For all other keys that we track
        if (e.key in this.keys) {
            this.keys[e.key] = true;
            e.preventDefault();
        }
    }
    
    handleKeyUp(e) {
        if (e.key in this.keys) {
            this.keys[e.key] = false;
            e.preventDefault();
        }
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePosition = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    handleMouseDown(e) {
        // Removed audio context resume trigger - handled by game.js init
        this.isMouseDown = true;
        this.justClicked = true;
        this.clickPending = true; // Set pending flag for next frame
        
        // Store the click position for potential action
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.mousePosition = { x, y };
        
        console.log("[Input DEBUG] MouseDown event fired at x:", x, "y:", y, "clickPending:", this.clickPending);
    }
    
    handleMouseUp() {
        this.isMouseDown = false;
        console.log("[Input DEBUG] MouseUp event fired."); // Log event
    }
    
    setupTouchControls() {
        // Re-enable canvas listener
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        this.canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false });
    }
    
    handleTouchStart(e) {
        // Removed audio context resume trigger - handled by game.js init
        e.preventDefault();
        
        // Store all active touches
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const rect = this.canvas.getBoundingClientRect();
            // Calculate scaling factors to map viewport coordinates to canvas coordinates
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            // Apply scaling to get coordinates within the canvas's internal resolution
            const x = (touch.clientX - rect.left) * scaleX;
            const y = (touch.clientY - rect.top) * scaleY;
            
            this.activeTouches[touch.identifier] = {
                startX: x,
                startY: y,
                currentX: x,
                currentY: y,
                startTime: Date.now()
            };
        }
        
        // Directly update mousePosition based on the first changed touch
        const firstTouch = e.changedTouches[0];
        if (firstTouch) {
            const rect = this.canvas.getBoundingClientRect(); // Re-get rect in case of resize
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            this.mousePosition = {
                x: (firstTouch.clientX - rect.left) * scaleX,
                y: (firstTouch.clientY - rect.top) * scaleY
            };
        }
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        
        // Update positions of active touches
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (this.activeTouches[touch.identifier]) {
                const rect = this.canvas.getBoundingClientRect();
                // Calculate scaling factors
                const scaleX = this.canvas.width / rect.width;
                const scaleY = this.canvas.height / rect.height;
                // Apply scaling
                this.activeTouches[touch.identifier].currentX = (touch.clientX - rect.left) * scaleX;
                this.activeTouches[touch.identifier].currentY = (touch.clientY - rect.top) * scaleY;
            }
        }
        
        // Update mousePosition based on the first *active* touch's current position
        const touchIds = Object.keys(this.activeTouches);
        if (touchIds.length > 0) {
            const firstTouchInfo = this.activeTouches[touchIds[0]];
            this.mousePosition = {
                x: firstTouchInfo.currentX,
                y: firstTouchInfo.currentY
            };
        }
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        
        // Process ended touches
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (this.activeTouches[touch.identifier]) {
                const touchInfo = this.activeTouches[touch.identifier];
                const duration = Date.now() - touchInfo.startTime;
                
                // Check if it was a tap (short duration, little movement)
                const moveX = Math.abs(touchInfo.currentX - touchInfo.startX);
                const moveY = Math.abs(touchInfo.currentY - touchInfo.startY);
                const wasTap = duration < 300 && moveX < 20 && moveY < 20;
                
                if (wasTap) {
                    // Store the tap position for potential action
                    this.tapPosition = {
                        x: touchInfo.currentX,
                        y: touchInfo.currentY
                    };
                    this.justTapped = true; // Signal that a tap just occurred
                }
                
                // Remove the touch
                delete this.activeTouches[touch.identifier];
            }
        }
    }
    
    // Methods to get input state
    getKeys() {
        return this.keys;
    }
    
    getMousePosition() {
        return this.mousePosition;
    }
    
    isMousePressed() {
        // Return true once per click to ensure each click is only processed once
        if (this.clickPending) {
            this.clickPending = false;
            console.log("[Input] Click detected and consumed");
            return true;
        }
        return false;
    }
    
    getTapPosition() {
        const tap = this.tapPosition;
        this.tapPosition = null; // Clear after reading
        return tap;
    }
    
    getActiveTouches() {
        return this.activeTouches;
    }
    
    wasTapped() {
        const tapped = this.justTapped;
        this.justTapped = false; // Reset after checking
        return tapped;
    }
    
    // Check if space key was pressed for player 1 power-up activation
    isSpaceKeyPressed() {
        const currentTime = performance.now();
        
        // First, check for actual pending activation from keydown event
        if (this.spaceKeyPending && currentTime - this.lastSpaceActivation > this.activationCooldown) {
            this.spaceKeyPending = false;
            this.lastSpaceActivation = currentTime;
            console.log("[Input] Space key activation detected and consumed");
            return true;
        }
        
        // Fallback: Also check the raw key state in case the event handler missed it
        if (this.keys.Space && currentTime - this.lastSpaceActivation > this.activationCooldown) {
            this.keys.Space = false; // Reset the state
            this.lastSpaceActivation = currentTime;
            console.log("[Input] Space key activation detected from raw state");
            return true;
        }
        
        return false;
    }
    
    // Check if S key was pressed for player 2 power-up activation
    isSKeyPressed() {
        const currentTime = performance.now();
        
        // First, check for actual pending activation from keydown event
        if (this.sKeyPending && currentTime - this.lastSActivation > this.activationCooldown) {
            this.sKeyPending = false;
            this.lastSActivation = currentTime;
            console.log("[Input] S key activation detected and consumed");
            return true;
        }
        
        // Fallback: Also check the raw key state in case the event handler missed it
        if (this.keys.s && currentTime - this.lastSActivation > this.activationCooldown) {
            this.keys.s = false; // Reset the state
            this.lastSActivation = currentTime;
            console.log("[Input] S key activation detected from raw state");
            return true;
        }
        
        return false;
    }
    
    // Check if P key was pressed for pause
    isPauseKeyPressed() {
        const pPressed = this.keys.p;
        if (pPressed) {
            this.keys.p = false; // Consume the press
        }
        return pPressed;
    }
    
    // For backward compatibility, though this method is no longer used
    isShootActionTriggered(playerNum) {
        if (playerNum === 1) {
            return this.isSpaceKeyPressed() || (this.isMouseDown && this.mousePosition.y > this.canvas.height / 2);
        } else {
            return this.isSKeyPressed();
        }
    }
    
    isEscapePressed() {
        const wasPressed = this.keys.Escape;
        this.keys.Escape = false; // Clear after reading
        return wasPressed;
    }
    
    // Reset all input states
    removeEventListeners() {
        // Only remove listeners if they exist
        if (this._boundKeyDown) {
            window.removeEventListener('keydown', this._boundKeyDown);
            window.removeEventListener('keyup', this._boundKeyUp);
            document.removeEventListener('keydown', this._boundKeyDown);
            document.removeEventListener('keyup', this._boundKeyUp);
            this.canvas.removeEventListener('mousemove', this._boundMouseMove);
            this.canvas.removeEventListener('mousedown', this._boundMouseDown);
            this.canvas.removeEventListener('mouseup', this._boundMouseUp);
            
            console.log("[Input] Event listeners removed");
        }
    }
    
    // Periodic check of input state to ensure we don't miss any keys
    checkInputState() {
        // Force a check of UI state and game state alignment
        if (window.game) {
            // Request that the game check its power-up state for consistency
            window.game.checkPowerUpActivation();
        }
    }
    
    reset() {
        for (const key in this.keys) { // Reset all keys, including 'w'
            this.keys[key] = false;
        }
        this.isMouseDown = false;
        this.justClicked = false;
        this.clickPending = false; // Reset pending click state
        this.spaceKeyPending = false;
        this.sKeyPending = false;
        this.tapPosition = null;
        this.justTapped = false;
        this.activeTouches = {};
    }
}

// Factory function to create input manager
export function createInputManager(canvas) {
    return new InputManager(canvas);
}
