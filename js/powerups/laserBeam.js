/**
 * LaserBeam power-up class
 * Handles the laser beam power-up that can destroy bricks and turn opponents to ashes
 */
import { audioManager } from '../utils/audio.js'; // Ensure audioManager is imported
import Matter from 'matter-js'; // Import Matter if not already

class LaserBeam {
    constructor(x, y, owner, canvasHeight, matterWorld) { // Add matterWorld
        this.matterWorld = matterWorld; // Store matterWorld
        this.x = x;
        this.y = y;
        this.width = 30; // Increased from 20 to be more visible
        this.height = owner === 1 ? -canvasHeight : canvasHeight;
        this.owner = owner;
        this.speed = 12; // Speed (Matching FreezeRay exactly)
        this.isExpired = false;
        this.alphaValue = 1.0;
        this.hitTarget = false; // Flag indicating the beam hit something or finished travel
        this.progress = 0; // Fraction of total length travelled (0 to 1)
        this.bodiesToRemove = []; // Bodies marked for removal after engine update
        this.maxLength = Math.abs(this.height); // Total travel distance
    }

    update(deltaTime, paddle1, paddle2, bricks) {
        // 1. Handle fading out after hit/miss (Identical to FreezeRay)
        if (this.hitTarget) {
            this.alphaValue -= 0.05; // Adjust fade speed as needed
            if (this.alphaValue <= 0) {
                this.isExpired = true;
            }
            return false; // Indicate no new hit this frame
        }

        // 2. Advance beam progress (Using speed, identical to corrected FreezeRay)
        const moveDistance = this.speed * 60 * deltaTime; // Distance moved this frame (Matching FreezeRay calculation)
        this.progress += moveDistance / this.maxLength; // Update progress fraction
        this.progress = Math.min(this.progress, 1); // Cap progress at 1

        let beamTipY; // Define beamTipY outside the block

        // 3. Check for hit only when progress is complete (Exact logic from FreezeRay)
        if (this.progress >= 1) {
            // Calculate final Y position now that progress is >= 1
            beamTipY = this.owner === 1 ? 0 : this.maxLength; // Tip reaches top (0) or bottom (maxLength) edge

            const targetPaddle = this.owner === 1 ? paddle2 : paddle1;
            const hitX = this.x; // Use the laser's X position for the check

            // Check for paddle hit
            if (targetPaddle && !targetPaddle.isAshes && hitX >= targetPaddle.x && hitX <= targetPaddle.x + targetPaddle.width) {
                 // --- Hit Logic ---
                 console.log(`[LaserBeam] Hit detected on paddle owned by player: ${this.owner === 1 ? 2 : 1}`);
                 targetPaddle.turnToAshes(5); // Apply Laser effect
                 console.log(`[LaserBeam] Player ${this.owner === 1 ? 2 : 1} turned to ashes for 5 seconds!`);
                 this.hitTarget = true; // Mark as hit to start fading
                 audioManager.playSound('laserHit'); // Play hit sound
                 return true; // Indicate hit occurred this frame
            } else {
                 // --- Paddle Miss Logic ---
                 // Check for brick hit ONLY if paddle was missed
                 const hitBrick = this.checkBrickCollisionsAtEnd(bricks, beamTipY); // Pass beamTipY defined earlier
                 if (hitBrick) {
                     console.log(`[LaserBeam] Hit Brick(s) instead of paddle`);
                     this.hitTarget = true; // Start fading
                     // Optional: Play a specific brick hit sound for laser?
                     // audioManager.playSound('laserBrickHit');
                     return true; // Indicate hit occurred this frame (on a brick)
                 } else {
                     // --- True Miss (No paddle, no brick) ---
                     console.log(`[LaserBeam] Missed paddle and bricks!`);
                     this.hitTarget = true; // Mark as "hit" (completed its travel) to start fading
                     return false; // Return false ONLY if it was a true miss
                 }
                 // If hitBrick was true, we already returned true above.
                 // If hitBrick was false, we returned false inside the else block above.
            } // End of paddle miss logic block
        } // End of if (this.progress >= 1)

        // 4. If progress < 1, no hit yet (Identical to FreezeRay)
        return false;
    }

    // checkPaddleCollision removed as logic is in update

    // Check for bricks only at the end point
    checkBrickCollisionsAtEnd(bricks, beamTipY) { // Accept beamTipY as argument
         let hitBrick = false;
         const laserWidthMargin = 5; // Margin for easier hits
         // const beamTipY = this.y + this.height; // Remove incorrect recalculation

         for (let c = 0; c < bricks.columns; c++) {
             for (let r = 0; r < bricks.rows; r++) {
                 const brick = bricks.grid[c][r];

                 if (brick.status === 0) continue; // Skip inactive bricks

                 const brickX = c * (brick.width + bricks.padding) + bricks.offsetLeft;
                 const brickY = r * (brick.height + bricks.padding) + bricks.offsetTop;

                 // Check horizontal overlap
                 const brickHorizontalHit =
                     (this.x - laserWidthMargin <= brickX + brick.width) &&
                     (this.x + laserWidthMargin >= brickX);

                 if (brickHorizontalHit) {
                     // Check if the beam's final Y position falls within the brick's vertical bounds
                     const brickTop = brickY;
                     const brickBottom = brickY + brick.height;
                     const verticalIntersection = (beamTipY >= brickTop && beamTipY <= brickBottom);

                     if (verticalIntersection) {
                         console.log(`[LaserBeam] Destroyed brick at column ${c}, row ${r} at end`);
                         brick.status = 0; // Mark brick as destroyed visually
                         // Mark physics body for deferred removal
                         if (brick.physicsBody) {
                             this.bodiesToRemove.push(brick.physicsBody);
                             brick.physicsBody = null; // Clear reference immediately
                         } else {
                              console.warn(`[LaserBeam] Brick at ${c},${r} already had null physicsBody?`);
                         }
                         // TODO: Add scoring for laser brick hit in Game class collision handler?
                         // TODO: Trigger particle effect for lasered brick?
                         hitBrick = true;
                         // Break inner loop once a brick is hit in this column at the tip? Optional.
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
            this.drawLaserParticles(ctx); // Call the restored method

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
