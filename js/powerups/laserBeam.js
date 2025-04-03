/**
 * LaserBeam power-up class
 * Handles the laser beam power-up that can destroy bricks and turn opponents to ashes
 */

class LaserBeam {
    constructor(x, y, owner, canvasHeight) {
        this.x = x;
        this.y = y;
        this.width = 30; // Increased from 20 to be more visible
        this.height = owner === 1 ? -canvasHeight : canvasHeight;
        this.owner = owner;
        this.speed = 20;
        this.isExpired = false;
        this.alphaValue = 1.0;
        this.hitTarget = false;
        this.progress = 0;
        this.affectedBricks = [];
        this.fading = false; // Flag to indicate beam is fading out
        this.elapsedTime = 0;
        this.duration = 1; // Assuming 1 second duration for simplicity
        this.maxLength = Math.abs(this.height);
    }

    update(bricks, paddle1, paddle2) {
        let paddleHit = false; // Declare paddleHit
        let brickHit = false;  // Declare brickHit

        // Handle fading out first
        if (this.fading) {
            this.alphaValue -= 0.05; // Adjust fade speed as needed
            if (this.alphaValue <= 0) {
                this.isExpired = true;
            }
            // Return early, no new interactions while fading
            return { paddleHit: false, brickHit: false };
        }

        // Determine origin paddle based on initial y
        const originPaddle = (this.y > this.maxLength / 2) ? paddle1 : paddle2;

        // Advance beam progress *before* checking collisions for this frame
        this.elapsedTime += 1/60; // Assuming 60 FPS
        this.progress = Math.min(this.elapsedTime / this.duration, 1);

        let beamTipY;
        if (this.y > this.maxLength / 2) { // Origin is bottom half, travelling up
            beamTipY = this.y - this.progress * this.maxLength;
        } else { // Origin is top half, travelling down
            beamTipY = this.y + this.progress * this.maxLength;
        }

        // Check for brick collisions FIRST
        if (this.progress < 1) { 
            brickHit = this.checkBrickCollisions(bricks); 
            // Removed: Hitting a brick no longer causes immediate fading.
            // The beam continues to destroy other bricks in its path.
        } else { 
            this.progress = 1; // Cap progress at 1
        }

        // Check for paddle collision only if no brick was hit and beam is still active
        if (!brickHit && !this.fading) {
            const hitPaddle = this.checkPaddleCollision(paddle1, paddle2, beamTipY, originPaddle);

            if (hitPaddle) {
                hitPaddle.turnToAshes(5);
                this.hitTarget = true;
                this.fading = true;
                paddleHit = true;
            } else if (this.progress >= 1) {
                 // --- Paddle Miss --- (Only trigger fade on miss if progress is complete)
                this.fading = true; 
                paddleHit = false;
            }
        }

        // Return status object
        return { paddleHit, brickHit };
    }

    checkPaddleCollision(paddle1, paddle2, beamTipY, originPaddle) {
        const targetPaddle = originPaddle === paddle1 ? paddle2 : paddle1;
        
        // Skip collision check if target paddle is already turned to ashes
        if (targetPaddle.isAshes) {
            return null;
        }
        
        // Use a wider collision area for better hit detection
        // Add a small margin to the laser width for more forgiving collision
        const laserWidthMargin = 5;
        const paddleHorizontalHit = 
            (this.x - laserWidthMargin <= targetPaddle.x + targetPaddle.width) && 
            (this.x + laserWidthMargin >= targetPaddle.x);
        
        if (paddleHorizontalHit) {
            // Check Y collision based on direction
            if (originPaddle === paddle1) { // Travelling up
                // Check if beam tip is within or has passed through the paddle
                if (beamTipY <= targetPaddle.y + targetPaddle.height && 
                    (beamTipY >= targetPaddle.y || this.progress >= 1)) {
                    console.log('[LaserBeam] Hit detected on top paddle');
                    return targetPaddle;
                }
            } else { // Travelling down
                // Check if beam tip is within or has passed through the paddle
                if (beamTipY >= targetPaddle.y && 
                    (beamTipY <= targetPaddle.y + targetPaddle.height || this.progress >= 1)) {
                    console.log('[LaserBeam] Hit detected on bottom paddle');
                    return targetPaddle;
                }
            }
        }
        return null;
    }

    checkBrickCollisions(bricks) {
        // Check for brick collisions along the laser path
        const startY = this.y;
        const endY = this.y + this.height * this.progress;
        let hitBrick = false;
        
        // Add a small margin to the laser width for more forgiving collision
        const laserWidthMargin = 5;
        
        // Iterate through all bricks to check for collisions
        for (let c = 0; c < bricks.columns; c++) {
            for (let r = 0; r < bricks.rows; r++) {
                const brick = bricks.grid[c][r];
                
                // Skip inactive bricks or already affected bricks
                if (brick.status === 0 || this.affectedBricks.includes(`${c}-${r}`)) {
                    continue;
                }
                
                // Calculate brick position
                const brickX = c * (brick.width + bricks.padding) + bricks.offsetLeft;
                const brickY = r * (brick.height + bricks.padding) + bricks.offsetTop;
                
                // Use a wider collision area for better hit detection
                const brickHorizontalHit = 
                    (this.x - laserWidthMargin <= brickX + brick.width) && 
                    (this.x + laserWidthMargin >= brickX);
                
                if (brickHorizontalHit) {
                    // Determine beam direction and endpoints
                    const beamTop = this.owner === 1 ? endY : startY; // Top point of beam
                    const beamBottom = this.owner === 1 ? startY : endY; // Bottom point of beam
                    const brickTop = brickY;
                    const brickBottom = brickY + brick.height;
                    
                    // Check if beam intersects with brick vertically
                    const verticalIntersection = 
                        // Beam top point is inside brick
                        (beamTop >= brickTop && beamTop <= brickBottom) ||
                        // Beam bottom point is inside brick
                        (beamBottom >= brickTop && beamBottom <= brickBottom) ||
                        // Brick is completely inside beam
                        (beamTop <= brickTop && beamBottom >= brickBottom) ||
                        // Beam is completely inside brick
                        (beamTop >= brickTop && beamBottom <= brickBottom);
                    
                    if (verticalIntersection) {
                        // Mark brick as hit
                        brick.status = 0;
                        
                        // Add to affected bricks list
                        this.affectedBricks.push(`${c}-${r}`);
                        
                        // Trigger brick destruction animation
                        if (brick.animation) {
                            brick.animation.active = true;
                        }
                        
                        console.log(`[LaserBeam] Destroyed brick at column ${c}, row ${r}`);
                        hitBrick = true;
                    }
                }
            }
        }
        
        return hitBrick;
    }

    draw(ctx) {
        if (!this.isExpired) {
            // Draw laser beam
            ctx.save();
            ctx.globalAlpha = this.alphaValue;
            
            // Create gradient for laser - Outer Glow (Orange -> Red)
            const gradient = ctx.createLinearGradient(
                this.x - this.width, this.y, // Start point (left edge)
                this.x + this.width, this.y  // End point (right edge) - Gradient across width
            );
            
            // Set gradient colors (Orange -> Red -> Orange)
            gradient.addColorStop(0, 'rgba(255, 165, 0, 0.0)'); // Transparent Orange start
            gradient.addColorStop(0.2, 'rgba(255, 165, 0, 0.7)'); // Orange
            gradient.addColorStop(0.5, 'rgba(255, 69, 0, 0.9)'); // Red-Orange (center)
            gradient.addColorStop(0.8, 'rgba(255, 165, 0, 0.7)'); // Orange
            gradient.addColorStop(1, 'rgba(255, 165, 0, 0.0)'); // Transparent Orange end
            
            // Draw outer glow part of the beam - slightly wider
            ctx.fillStyle = gradient;
            ctx.fillRect(
                this.x - this.width * 1.5, // Make glow wider
                this.y,
                this.width * 3, // Make glow wider
                this.height * this.progress
            );
            
            // Draw core of the beam (bright yellow)
            ctx.fillStyle = '#FFFF00'; // Bright Yellow
            ctx.fillRect(
                this.x - this.width / 4, // Narrower core
                this.y,
                this.width / 2,      // Narrower core
                this.height * this.progress
            );
            
            // Draw glow effect around the core
            ctx.shadowColor = '#FFA500'; // Orange glow
            ctx.shadowBlur = 20; 
            ctx.fillRect(
                this.x - this.width / 4, // Match core position
                this.y,
                this.width / 2,      // Match core width
                this.height * this.progress
            );
            
            // Add particle effects along the beam
            this.drawLaserParticles(ctx);
            
            ctx.restore();
        }
    }
    
    drawLaserParticles(ctx) {
        // Draw particles along the laser beam
        const particleCount = Math.floor(Math.abs(this.height) * this.progress / 15);
        
        ctx.fillStyle = 'rgba(255, 165, 0, 0.8)';
        
        for (let i = 0; i < particleCount; i++) {
            const x = this.x + (Math.random() - 0.5) * this.width * 2;
            const y = this.y + Math.random() * this.height * this.progress;
            const size = 2 + Math.random() * 3;
            
            // Draw a particle
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Revert to ES Module export only
export { LaserBeam };
