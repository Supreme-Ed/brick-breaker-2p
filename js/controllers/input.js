/**
 * Input Manager for Brick Breaker 2P
 * Handles keyboard, mouse, and touch input
 */

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
            f: false  // Cheat: Add FreezeRay
        };
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        this.activeTouches = {};
        // Initialize mouse position to center to avoid initial jump left
        this.mousePosition = { x: canvas.width / 2, y: canvas.height / 2 }; 
        this.isMouseDown = false;
        this.tapPosition = null; // Position of the last detected tap
        this.justTapped = false; // Flag for reacting to a tap event
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Mouse events
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Touch events (if supported)
        if (this.isTouchDevice) {
            this.setupTouchControls();
        }
    }
    
    handleKeyDown(e) {
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
        this.isMouseDown = true;
        console.log("[Input DEBUG] MouseDown event fired."); // Log event
        // Store the click position for potential action
        const rect = this.canvas.getBoundingClientRect();
        this.mousePosition = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
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
        e.preventDefault();
        
        // Store all active touches
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
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
            const rect = this.canvas.getBoundingClientRect();
            this.mousePosition = {
                x: firstTouch.clientX - rect.left,
                y: firstTouch.clientY - rect.top
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
                this.activeTouches[touch.identifier].currentX = touch.clientX - rect.left;
                this.activeTouches[touch.identifier].currentY = touch.clientY - rect.top;
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
        return this.isMouseDown;
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
    
    // Check if specific actions are triggered
    isShootActionTriggered(playerNum) {
        if (playerNum === 1) {
            return this.keys.Space || (this.isMouseDown && this.mousePosition.y > this.canvas.height / 2);
        } else {
            return this.keys.s;
        }
    }
    
    isEscapePressed() {
        const wasPressed = this.keys.Escape;
        this.keys.Escape = false; // Clear after reading
        return wasPressed;
    }
    
    // Reset all input states
    reset() {
        for (const key in this.keys) {
            this.keys[key] = false;
        }
        this.isMouseDown = false;
        this.tapPosition = null;
        this.justTapped = false;
        this.activeTouches = {};
    }
}

// Factory function to create input manager
export function createInputManager(canvas) {
    return new InputManager(canvas);
}
