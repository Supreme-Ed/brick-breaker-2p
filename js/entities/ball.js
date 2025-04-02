/**
 * Ball class for Brick Breaker 2P
 * Handles ball physics, movement, and collision detection
 */

export class Ball {
    constructor(x, y, radius, dx, dy, owner, canvasWidth, canvasHeight) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.dx = dx;
        this.dy = dy;
        this.owner = owner; // 1 for player 1, 2 for player 2
        this.lastHitBy = owner;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.baseSpeed = 200; // Adjusted for appropriate on-screen speed
        this.maxSpeed = 350;  // Adjusted for appropriate on-screen speed
    }

    update(deltaTime) {
        // Move the ball - using deltaTime for frame-independent movement
        this.x += this.dx * deltaTime;
        this.y += this.dy * deltaTime;

        // Check for wall collisions
        this.checkWallCollision();
    }
    
    checkWallCollision() {
        // Left and right walls
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.dx = Math.abs(this.dx);
            return { wall: 'left' };
        } else if (this.x + this.radius > this.canvasWidth) {
            this.x = this.canvasWidth - this.radius;
            this.dx = -Math.abs(this.dx);
            return { wall: 'right' };
        }
        
        // No collision
        return { wall: null };
    }
    
    checkPaddleCollision(paddle, isTopPaddle) {
        // Skip if paddle is turned to ashes
        if (paddle.isAshes) return false;
        
        // Check if ball is colliding with paddle
        if (this.x + this.radius > paddle.x && 
            this.x - this.radius < paddle.x + paddle.width && 
            ((isTopPaddle && this.y - this.radius < paddle.y + paddle.height && this.y > paddle.y) || 
             (!isTopPaddle && this.y + this.radius > paddle.y && this.y < paddle.y + paddle.height))) {
            
            // Calculate impact point on paddle (0 to 1)
            const impactPoint = (this.x - paddle.x) / paddle.width;
            
            // Calculate bounce angle based on impact point
            // Center = straight, edges = angled
            const maxBounceAngle = Math.PI / 3; // 60 degrees
            const bounceAngle = (impactPoint * 2 - 1) * maxBounceAngle * paddle.curvature;
            
            // Set new velocity based on bounce angle
            const speed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
            const direction = isTopPaddle ? 1 : -1; // Down for top paddle, up for bottom paddle
            
            this.dx = Math.sin(bounceAngle) * speed;
            this.dy = Math.cos(bounceAngle) * speed * direction;
            
            // Ensure ball is outside paddle to prevent multiple collisions
            if (isTopPaddle) {
                this.y = paddle.y + paddle.height + this.radius;
            } else {
                this.y = paddle.y - this.radius;
            }
            
            // Update last hit by
            this.lastHitBy = isTopPaddle ? 2 : 1;
            
            return true;
        }
        
        return false;
    }
    
    checkBoundaryCollision() {
        // Check if ball crossed top or bottom boundary
        if (this.y - this.radius < 0) {
            // Ball crossed top boundary (Player 1 scores)
            return { boundary: 'top', scorer: 1 };
        } else if (this.y + this.radius > this.canvasHeight) {
            // Ball crossed bottom boundary (Player 2 scores)
            return { boundary: 'bottom', scorer: 2 };
        }
        
        // No boundary crossed
        return { boundary: null, scorer: null };
    }
    
    reset(owner) {
        // Reset ball position and direction
        if (owner === 1) {
            // Player 1's ball (bottom)
            this.x = this.canvasWidth / 2;
            this.y = this.canvasHeight - 50;
            this.dx = (Math.random() * 0.8 - 0.4) * this.baseSpeed; // Adjusted for better initial angle
            this.dy = -this.baseSpeed * 0.6; // Adjusted for better initial speed
        } else {
            // Player 2's ball (top)
            this.x = this.canvasWidth / 2;
            this.y = 50;
            this.dx = (Math.random() * 0.8 - 0.4) * this.baseSpeed; // Adjusted for better initial angle
            this.dy = this.baseSpeed * 0.6; // Adjusted for better initial speed
        }
        
        this.owner = owner;
        this.lastHitBy = owner;
    }
    
    draw(ctx) {
        // Safeguard against non-finite coordinates causing crash
        if (!isFinite(this.x) || !isFinite(this.y) || !isFinite(this.radius)) {
            console.error(`[Ball.draw] Invalid coordinates or radius: x=${this.x}, y=${this.y}, radius=${this.radius}. Skipping draw.`);
            return; // Don't attempt to draw if values are invalid
        }

        // Draw ball with gradient and shadow
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius
        );
        
        // Set gradient colors based on last hit
        if (this.lastHitBy === 1) {
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(1, '#2ecc71'); // Green for player 1
        } else {
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(1, '#3498db'); // Blue for player 2
        }
        
        // Draw shadow
        ctx.beginPath();
        ctx.arc(this.x + 2, this.y + 2, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();
        ctx.closePath();
        
        // Draw ball
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.closePath();
        
        // Add highlight
        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
        ctx.closePath();
    }
}

// Factory function to create balls
export function createBall(owner, canvasWidth, canvasHeight) {
    const radius = 8;
    let x, y, dx, dy;
    const baseSpeed = 200; // Adjusted for appropriate on-screen speed
    
    if (owner === 1) {
        // Player 1's ball (bottom)
        x = canvasWidth / 2;
        y = canvasHeight - 50;
        dx = (Math.random() * 0.8 - 0.4) * baseSpeed;
        dy = -baseSpeed * 0.6;
    } else {
        // Player 2's ball (top)
        x = canvasWidth / 2;
        y = 50;
        dx = (Math.random() * 0.8 - 0.4) * baseSpeed;
        dy = baseSpeed * 0.6;
    }
    
    return new Ball(x, y, radius, dx, dy, owner, canvasWidth, canvasHeight);
}
