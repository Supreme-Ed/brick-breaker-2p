/**
 * Paddle class for Brick Breaker 2P
 * Handles paddle creation, movement, and power-up effects
 */

/**
 * Paddle class for Brick Breaker 2P
 * Handles paddle creation, movement, and power-up effects
 */

class Paddle {
    constructor(x, y, width, height, isTopPaddle = false, canvasWidth) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.dx = 0;
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
        this.speed = 8; // Base movement speed
    }

    update(deltaTime, keys, isAI = false, aiTarget = null) {
        // Handle power-up timers
        this.updatePowerUpTimers(deltaTime);
        
        // Skip movement if frozen
        if (this.isFrozen) return;
        
        // Skip movement if turned to ashes
        if (this.isAshes) return;
        
        if (isAI) {
            // AI movement
            this.updateAIMovement(aiTarget);
        } else if (this.targetX !== null) {
            // Mouse/touch movement
            this.updateTargetMovement();
        } else {
            // Keyboard movement
            this.updateKeyboardMovement(keys);
        }
        
        // Ensure paddle stays within canvas bounds
        this.keepInBounds();
    }
    
    updatePowerUpTimers(deltaTime) {
        // Update frozen timer
        if (this.isFrozen) {
            this.frozenTimeRemaining -= deltaTime;
            if (this.frozenTimeRemaining <= 0) {
                this.isFrozen = false;
                this.frozenTimeRemaining = 0;
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
            }
        }
    }
    
    updateKeyboardMovement(keys) {
        // Reset movement
        this.dx = 0;
        
        // Top paddle (Player 2) uses A/D
        if (this.isTopPaddle) {
            if (keys.a) this.dx = -this.speed;
            if (keys.d) this.dx = this.speed;
        } 
        // Bottom paddle (Player 1) uses arrow keys
        else {
            if (keys.ArrowLeft) this.dx = -this.speed;
            if (keys.ArrowRight) this.dx = this.speed;
        }
        
        // Apply movement
        this.x += this.dx;
    }
    
    updateTargetMovement() {
        // Move towards target X position (for mouse/touch control)
        if (this.targetX !== null) {
            const paddleCenter = this.x + this.width / 2;
            const distance = this.targetX - paddleCenter;
            
            // Only move if we're not very close to the target
            if (Math.abs(distance) > 2) {
                // Move at a speed proportional to distance, but capped
                const moveSpeed = Math.min(Math.abs(distance) * 0.2, this.speed);
                this.dx = distance > 0 ? moveSpeed : -moveSpeed;
                this.x += this.dx;
            } else {
                this.dx = 0;
            }
        }
    }
    
    updateAIMovement(targetX) {
        // Simple, direct movement toward target - no jitter or complex calculations
        if (targetX !== null) {
            const paddleCenter = this.x + this.width / 2;
            const distance = targetX - paddleCenter;
            
            // Move directly toward target with a small deadzone
            if (Math.abs(distance) > 5) {
                // Set speed based on distance for smoother movement
                const moveSpeed = Math.min(Math.abs(distance) * 0.1, this.speed * 0.8);
                this.dx = distance > 0 ? moveSpeed : -moveSpeed;
                this.x += this.dx;
            } else {
                this.dx = 0;
            }
        }
    }
    
    keepInBounds() {
        // Ensure paddle stays within canvas bounds
        if (this.x < 0) {
            this.x = 0;
            this.dx = 0;
        } else if (this.x + this.width > this.canvasWidth) {
            this.x = this.canvasWidth - this.width;
            this.dx = 0;
        }
    }
    
    draw(ctx) {
        if (this.isAshes) {
            // Draw ashes effect instead of making paddle invisible
            this.drawAshesEffect(ctx);
            return;
        }
        
        // Draw paddle shadow
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
    }
    
    activateLaser() {
        this.hasLaser = true;
    }
    
    useFreezeRay() {
        if (this.hasFreezeRay) {
            this.hasFreezeRay = false;
            return true;
        }
        return false;
    }
    
    useLaser() {
        if (this.hasLaser) {
            this.hasLaser = false;
            return true;
        }
        return false;
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
function createPaddle(isTopPaddle, canvasWidth, canvasHeight) {
    const paddleWidth = 100;
    const paddleHeight = 10;
    const paddleX = (canvasWidth - paddleWidth) / 2;
    const paddleY = isTopPaddle ? 30 : canvasHeight - 30;
    
    return new Paddle(paddleX, paddleY, paddleWidth, paddleHeight, isTopPaddle, canvasWidth);
}

// Revert to ES Module export only
export { Paddle, createPaddle };