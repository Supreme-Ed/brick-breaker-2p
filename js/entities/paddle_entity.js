/**
 * Paddle class for Brick Breaker 2P
 * Handles paddle creation, movement (via Matter.js body updates), and power-up effects
 */
import { audioManager } from '../utils/audio.js'; // Import AudioManager
import Matter from 'matter-js';

/**
 * Paddle class for Brick Breaker 2P
 * Handles paddle creation, movement, and power-up effects
 */

class Paddle {
    constructor(matterWorld, x, y, width, height, isTopPaddle = false, canvasWidth) {
        this.x = x; // Store for drawing reference, updated before draw
        this.y = y; // Store for drawing reference, updated before draw
        this.width = width;
        this.height = height;
        // this.dx = 0; // dx is no longer directly used for movement calculation
        this.score = 0;
        this.curvature = 0.3;
        this.hasFreezeRay = false;
        this.isFrozen = false;
        this.frozenTimeRemaining = 0;
        this.isWide = false;
        this.widePaddleTimeRemaining = 0;
        this.originalWidth = width;
        this.hasLaser = false;
        this.isAshes = false;
        this.ashesTimeRemaining = 0;
        this.targetX = null; // For touch/mouse control
        this.isTopPaddle = isTopPaddle;
        this.canvasWidth = canvasWidth;
        this.speed = 300; // Base movement speed (Compensated for deltaTime)
        this.aiReactionTime = 0; // Timer for AI reaction delay
        this.aiReactionDelay = 0.1; // Delay in seconds before AI reacts

        // Create Matter.js body
        const options = {
            isStatic: true, // Paddles are moved manually, not by physics forces
            restitution: 1.0, // Perfect bounciness
            friction: 0.5,
            label: 'paddle', // Identify body type in collisions
            gameObject: this // Reference back to the Paddle instance
        };
        this.physicsBody = Matter.Bodies.rectangle(x + width / 2, y + height / 2, width, height, options); // Position is center-based

        // Add to the world
        Matter.World.add(matterWorld, this.physicsBody);
        console.log(`[Paddle Constructor] Matter.js body created for ${isTopPaddle ? 'Top' : 'Bottom'} Paddle`); // DEBUG
    }

    /**
     * Updates the paddle state based on time delta, input keys, AI status, and ball positions.
     * @param {number} deltaTime - The time elapsed since the last update.
     * @param {Object} keys - An object containing the state of relevant keys.
     * @param {boolean} [isAI=false] - Flag indicating if the paddle is controlled by AI.
     * @param {Ball[]} [balls=[]] - An array of ball entities in the game.
     * @param {Object} [gameManager=null] - The game manager instance.
     */
    update(deltaTime, keys, isAI = false, balls = [], gameManager = null) { 
        // Handle power-up timers
        this.updatePowerUpTimers(deltaTime);
        
        // Skip movement if frozen
        if (this.isFrozen) return;
        
        // Skip movement if turned to ashes
        if (this.isAshes) return;
        
        if (isAI) {
            // AI updates (movement and shooting)
            this.updateAI(deltaTime, balls, gameManager);
        } else if (this.targetX !== null) {
            // Mouse/touch movement
            this.updateTargetMovement(deltaTime); // Pass deltaTime here
        } else {
            // Keyboard movement - Calculates newX and updates physics body
            this.updateKeyboardMovement(keys, deltaTime);
        }
        
        // Position is now set within the movement methods after bounds check
        // this.keepInBounds(); // keepInBounds is called within movement methods before setting position
    }
    
    updatePowerUpTimers(deltaTime) {
        // Update frozen timer
        if (this.isFrozen) {
            this.frozenTimeRemaining -= deltaTime;
            if (this.frozenTimeRemaining <= 0) {
                this.isFrozen = false;
                this.frozenTimeRemaining = 0;
                audioManager.playSound('paddleUnfreeze'); // Play unfreeze sound
            }
        }
        
        // Update wide paddle timer
        if (this.isWide) {
            this.widePaddleTimeRemaining -= deltaTime;
            if (this.widePaddleTimeRemaining <= 0) {
                this.isWide = false;
                this.widePaddleTimeRemaining = 0;
                this.width = this.originalWidth;
            }
        }
        
        // Update ashes timer
        if (this.isAshes) {
            this.ashesTimeRemaining -= deltaTime;
            if (this.ashesTimeRemaining <= 0) {
                this.isAshes = false;
                this.ashesTimeRemaining = 0;
                audioManager.playSound('paddleUnash'); // Play unash sound
            }
        }
    }
    
    updateKeyboardMovement(keys, deltaTime) {
        let targetSpeed = 0;

        // Determine target speed based on keys
        if (this.isTopPaddle) { // Player 2 (A/D)
            if (keys.a) targetSpeed = -this.speed;
            if (keys.d) targetSpeed = this.speed;
        } else { // Player 1 (Arrows)
            if (keys.ArrowLeft) targetSpeed = -this.speed;
            if (keys.ArrowRight) targetSpeed = this.speed;
        }

        // Calculate potential new position
        let newX = this.physicsBody.position.x + (targetSpeed * deltaTime);

        // Apply bounds check *before* setting position
        newX = this.checkBounds(newX);

        // Set the Matter.js body position
        Matter.Body.setPosition(this.physicsBody, { x: newX, y: this.physicsBody.position.y });
    }
    
    updateTargetMovement(deltaTime) { // Accept deltaTime
        // Move towards target X position (for mouse/touch control)
        if (this.targetX !== null) {
            // Directly target the mouse position for less lag
            let targetCenterX = this.targetX;

            let newX = targetCenterX; // Set desired center X directly

            // Apply bounds check *before* setting position
            newX = this.checkBounds(newX);

            // Set the Matter.js body position
            Matter.Body.setPosition(this.physicsBody, { x: newX, y: this.physicsBody.position.y });
        }
    }
    
    updateAI(deltaTime, balls = [], gameManager = null) { 
        if (!balls || balls.length === 0 || !gameManager) { 
            this.dx = 0; 
            return; // Need balls and game manager for AI
        } 

        // Apply reaction time delay
        this.aiReactionTime += deltaTime;
        if (this.aiReactionTime < this.aiReactionDelay) {
            // Maintain current dx or slightly dampen it while waiting
             // AI doesn't move during reaction time
             // let currentX = this.physicsBody.position.x;
             // currentX = this.checkBounds(currentX); // Ensure it stays in bounds even if not moving
             // Matter.Body.setPosition(this.physicsBody, { x: currentX, y: this.physicsBody.position.y });
            return; 
        }
        // Reset timer for next reaction
        this.aiReactionTime = 0;

        // --- Ball Tracking Logic (from original) ---
        const isBottomPaddle = !this.isTopPaddle;
        // Filter balls moving towards the AI paddle
        const approachingBalls = balls.filter(ball => 
            (isBottomPaddle ? ball.dy > 0 : ball.dy < 0)
        );

        let ballToTrack;
        if (approachingBalls.length > 0) {
            // Prioritize balls last hit by this AI or owned by this AI
            ballToTrack = approachingBalls.find(ball => ball.lastHitBy === (this.isTopPaddle ? 2 : 1) || ball.owner === (this.isTopPaddle ? 2 : 1));
            if (!ballToTrack) {
                // If no owned/last-hit ball, track the closest one vertically
                approachingBalls.sort((a, b) =>
                    isBottomPaddle ? (this.y - a.y) - (this.y - b.y) : (a.y - this.y) - (b.y - this.y)
                );
                ballToTrack = approachingBalls[0];
            }
        } else {
            // If no balls are approaching, track any owned/last-hit ball, or the first ball as fallback
            ballToTrack = balls.find(ball => ball.lastHitBy === (this.isTopPaddle ? 2 : 1) || ball.owner === (this.isTopPaddle ? 2 : 1)) || balls[0];
        }
        
        if (!ballToTrack) { // Final fallback if no balls exist
            this.dx = 0;
            return;
        }

        // --- Movement Calculation (from original) ---
        // Aim for the center of the paddle to intercept the ball's x position
        const targetCenterX = ballToTrack.x; // AI aims for ball's center
        const currentCenterX = this.physicsBody.position.x;
        const diff = targetCenterX - currentCenterX;
        // const randomness = (Math.random() - 0.5) * 15; // Add randomness later if needed
        const maxSpeed = this.speed * 0.7; // AI speed limit
        const moveThreshold = 5; // Pixels distance threshold to start/stop moving

        let moveDelta = 0;
        if (Math.abs(diff) > moveThreshold) {
            const direction = Math.sign(diff);
            moveDelta = direction * maxSpeed * deltaTime; // Calculate move distance for this frame
            // Cap movement distance per frame if needed, though deltaTime handles rate
            // moveDelta = Math.max(-maxSpeed * deltaTime, Math.min(maxSpeed * deltaTime, moveDelta));
        }

        let newX = this.physicsBody.position.x + moveDelta;

        // Apply bounds check *before* setting position
        newX = this.checkBounds(newX);

        // Set the Matter.js body position
        Matter.Body.setPosition(this.physicsBody, { x: newX, y: this.physicsBody.position.y });

        // --- AI Shooting Logic (moved to separate function, called here) ---
        this.updateAIShooting(gameManager);
        
        // Ensure paddle stays within bounds (already called in main update)
        // this.keepInBounds(); // Called in parent update method
    }

    updateAIShooting(gameManager) {
        if (!gameManager || !gameManager.getOpponentPaddle) return;

        const playerNum = this.isTopPaddle ? 2 : 1;
        const opponentPaddle = gameManager.getOpponentPaddle(playerNum);
        if (!opponentPaddle) return;

        // Don't attempt to shoot if paddle is frozen or turned to ashes
        if (this.isFrozen || this.isAshes) return;

        const paddleCenter = this.x + this.width / 2;
        const opponentCenter = opponentPaddle.x + opponentPaddle.width / 2;
        const alignmentThreshold = 30; // Increased threshold for better hit chance
        const isAligned = Math.abs(paddleCenter - opponentCenter) < alignmentThreshold;

        // Only shoot if we're reasonably aligned with the opponent
        if (!isAligned) return;

        // AI Shooting Logic (Freeze Ray)
        if (this.hasFreezeRay) {
            // Don't waste freeze ray if opponent is already frozen or ashes
            if (opponentPaddle.isFrozen || opponentPaddle.isAshes) return;
            
            // Higher chance to use freeze ray when well-aligned
            const useChance = isAligned ? 0.15 : 0.01; // 15% when aligned, 1% randomly
            
            if (Math.random() < useChance) {
                if (gameManager.shootFreezeRay) {
                    gameManager.shootFreezeRay(playerNum);
                    console.log(`[AI] Player ${playerNum} used Freeze Ray`);
                }
            }
        }

        // AI Shooting Logic (Laser)
        if (this.hasLaser) {
            // Higher chance to use laser when well-aligned
            const useChance = isAligned ? 0.2 : 0.01; // 20% when aligned, 1% randomly
            
            if (Math.random() < useChance) {
                if (gameManager.shootLaser) {
                    gameManager.shootLaser(playerNum);
                    console.log(`[AI] Player ${playerNum} used Laser`);
                }
            }
        }
    }
    
    // Renamed keepInBounds to checkBounds and returns the corrected position
    checkBounds(proposedX) {
        // Ensure paddle stays within canvas bounds, considering center position
        const halfWidth = this.width / 2;
        const minX = halfWidth; // Minimum center position
        const maxX = this.canvasWidth - halfWidth; // Maximum center position

        if (proposedX < minX) {
            return minX;
        } else if (proposedX > maxX) {
            return maxX;
        }
        return proposedX; // Position is valid
    }
    
    draw(ctx) {
        // Update internal x, y from physics body before drawing
        // Position is center-based, adjust for top-left corner drawing
        this.x = this.physicsBody.position.x - this.width / 2;
        this.y = this.physicsBody.position.y - this.height / 2;

        if (this.isAshes) {
            // Draw ashes effect instead of making paddle invisible
            this.drawAshesEffect(ctx);
            return;
        }

        // Draw paddle shadow (using updated this.x, this.y)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(this.x + 3, this.y + 3, this.width, this.height);
        
        // Draw paddle with gradient
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        
        if (this.isFrozen) {
            // Frozen paddle (blue/white)
            gradient.addColorStop(0, '#A5F2F3');
            gradient.addColorStop(1, '#56CCF2');
            ctx.fillStyle = gradient;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Add ice crystal effect
            this.drawIceCrystals(ctx);
        } else {
            // Normal paddle (green for player 1, blue for player 2)
            if (this.isTopPaddle) {
                gradient.addColorStop(0, '#3498db');
                gradient.addColorStop(1, '#2980b9');
            } else {
                gradient.addColorStop(0, '#2ecc71');
                gradient.addColorStop(1, '#27ae60');
            }
            
            ctx.fillStyle = gradient;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Add highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(this.x, this.y, this.width, this.height / 3);
        }
        
        // Draw border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
    
    drawAshesEffect(ctx) {
        // Draw a semi-transparent, ashy version of the paddle
        ctx.save();
        
        // Draw paddle outline in ash color
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.7)';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Draw paddle base in ash color
        ctx.fillStyle = 'rgba(80, 80, 80, 0.4)';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw ash particles
        ctx.fillStyle = 'rgba(150, 150, 150, 0.8)';
        for (let i = 0; i < 15; i++) {
            const x = this.x + Math.random() * this.width;
            const y = this.y + Math.random() * this.height;
            const size = 1 + Math.random() * 2;
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw some embers
        const emberColors = ['rgba(255, 120, 50, 0.7)', 'rgba(255, 80, 30, 0.5)', 'rgba(255, 180, 70, 0.6)'];
        for (let i = 0; i < 5; i++) {
            const x = this.x + Math.random() * this.width;
            const y = this.y + Math.random() * this.height;
            const size = 1 + Math.random() * 1.5;
            
            ctx.fillStyle = emberColors[Math.floor(Math.random() * emberColors.length)];
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    drawIceCrystals(ctx) {
        // Draw ice crystal effect for frozen paddle
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        
        // Draw several small ice crystals
        for (let i = 0; i < 8; i++) {
            const x = this.x + Math.random() * this.width;
            const y = this.y + Math.random() * this.height;
            const size = 2 + Math.random() * 3;
            
            ctx.beginPath();
            ctx.moveTo(x, y - size);
            ctx.lineTo(x + size, y);
            ctx.lineTo(x, y + size);
            ctx.lineTo(x - size, y);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    activateFreezeRay() {
        this.hasFreezeRay = true;
        this.hasLaser = false; // Ensure exclusivity
        console.log('[Paddle] Freeze Ray activated.'); // Add log for confirmation
    }
    
    activateLaser() {
        this.hasLaser = true;
        this.hasFreezeRay = false; // Ensure exclusivity
        console.log('[Paddle] Laser activated.'); // Add log for confirmation
    }
    
    useFreezeRay() {
        if (this.hasFreezeRay) {
            this.hasFreezeRay = false;
            return true;
        }
        return false;
    }
    
    useLaser() {
        // Original logic: Check if laser is active and consume it immediately
        if (this.hasLaser) {
            this.hasLaser = false; // Consume the single shot
            console.log('[Paddle] Laser used and consumed.');
            return true;
        }
        return false; // No shot allowed (no laser)
    }
    
    freeze(duration = 3) {
        console.log(`[DEBUG Paddle] freeze called. Current isFrozen: ${this.isFrozen}, Duration: ${duration}`);
        this.isFrozen = true;
        this.frozenTimeRemaining = duration;
        console.log(`[DEBUG Paddle] Set isFrozen to: ${this.isFrozen}, Timer: ${this.frozenTimeRemaining}`);
    }
    
    turnToAshes(duration = 5) {
        this.isAshes = true;
        this.ashesTimeRemaining = duration;
    }
    
    makeWide(duration = 10) {
        this.isWide = true;
        this.widePaddleTimeRemaining = duration;
        this.width = this.originalWidth * 1.5;
    }
}

// Factory function to create paddles
function createPaddle(matterWorld, isTopPaddle, canvasWidth, canvasHeight) {
    const paddleWidth = 100;
    const paddleHeight = 10;
    const paddleX = (canvasWidth - paddleWidth) / 2; // Initial top-left X
    const paddleY = isTopPaddle ? 30 : canvasHeight - 40; // Adjusted Y position slightly

    return new Paddle(matterWorld, paddleX, paddleY, paddleWidth, paddleHeight, isTopPaddle, canvasWidth);
}

// Revert to ES Module export only
export { Paddle, createPaddle };