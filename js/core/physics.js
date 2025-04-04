/**
 * Physics system for Brick Breaker 2P
 * Handles updates for non-Matter.js entities like projectiles and particles.
 * Collision detection and resolution are now handled by Matter.js in Game.js.
 */

export class PhysicsSystem {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
    }
    
    update(balls, paddle1, paddle2, bricks, freezeRays, laserBeams, particles, audioManager) {
        // Update all physics entities
        // this.updateBalls(balls, paddle1, paddle2, bricks, audioManager); // Ball physics handled by Matter.js
        this.updateFreezeRays(freezeRays, paddle1, paddle2, audioManager); // Projectiles still need updates
        this.updateLaserBeams(laserBeams, paddle1, paddle2, bricks, particles, audioManager); // Projectiles still need updates
        this.updateParticles(particles); // Particles still need updates
        
        // Check for game-level events not directly tied to Matter.js collisions
        return this.checkGameEvents(bricks); // Only need bricks for 'all cleared' check now
    }
    
    // updateBalls method removed - Ball physics and collision consequences
    // are now handled by Matter.js engine and event listeners in Game.js.
    
    // Removed checkWallCollision - Handled by Matter.js engine and static wall bodies.
    // Removed checkPaddleCollision - Handled by Matter.js collision events.
    // Removed checkBoundaryCollision - Handled by Matter.js collision events (or sensors).
    // Removed resetBall - Handled within Ball class using Matter.Body.setPosition/setVelocity.
    // Removed handlePowerUp - Logic moved to Matter.js collision event handler in Game.js.
    
    updateFreezeRays(freezeRays, paddle1, paddle2, audioManager) {
        // Update all active freeze rays
        for (let i = freezeRays.length - 1; i >= 0; i--) {
            const ray = freezeRays[i];
            
            // Pass the correct parameters to the FreezeRay update method
            const hitTarget = ray.update(paddle1, paddle2);
            
            // Play sound if a target was hit
            if (hitTarget) {
                audioManager.playSound('freezeRayHit'); // Play freeze ray hit sound
            }
            
            // Remove expired rays
            if (ray.isExpired) {
                freezeRays.splice(i, 1);
            }
        }
    }
    
    updateLaserBeams(laserBeams, paddle1, paddle2, bricks, particles, audioManager) {
        // Update all active laser beams
        for (let i = laserBeams.length - 1; i >= 0; i--) {
            const beam = laserBeams[i];
            
            // Pass the correct parameters to the LaserBeam update method
            const result = beam.update(bricks, paddle1, paddle2);
            
            // Check for BRICK hit specifically for scoring and sound
            if (result.brickHit) {
                // Award points to the player who shot the laser
                if (beam.owner === 1) {
                    paddle1.score += 5;
                    console.log(`[DEBUG] Player 1 scored 5 points for lasering a brick`);
                } else {
                    paddle2.score += 5;
                    console.log(`[DEBUG] ${paddle2.isAI ? 'AI' : 'Player 2'} scored 5 points for lasering a brick`);
                }
                
                // Play laser hit sound effect
                audioManager.playSound('laserHit');
            }
            
            // Check for PADDLE hit (could play a different sound here if needed)
            // if (result.paddleHit) {
                // Optional: Play a distinct sound for hitting the paddle?
                // if (window.audioManager && typeof window.audioManager.playLaserPaddleHit === 'function') { 
                //     window.audioManager.playLaserPaddleHit(); 
                // }
            // }
            
            // Remove expired beams (beams that hit paddle OR missed)
            if (beam.isExpired) {
                laserBeams.splice(i, 1);
            }
        }
    }
    
    updateParticles(particles) {
        // Update all particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i];
            particle.update();
            // Add logging only if the particle is still active after update
            if (particle.active) {
                console.log(`[DEBUG] Updated particle ${i}: x=${particle.x.toFixed(1)}, y=${particle.y.toFixed(1)}, alpha=${particle.alpha.toFixed(2)}, active=${particle.active}`);
            }
            
            // Remove expired particles
            if (!particles[i].active) { // Check 'active' property instead of non-existent 'isExpired'
                particles.splice(i, 1);
            }
        }
    }
    
    checkGameEvents(bricks) { // No longer needs balls
        const events = [];
        
        // Check if all bricks are cleared
        if (bricks.countActiveBricks() === 0) {
            events.push({ type: 'allBricksCleared' });
            // audioManager.playSound('levelComplete'); // Sound playing moved to Game.js event handler
        }
        
        return events;
    }
}

// Factory function to create physics system
export function createPhysicsSystem(canvasWidth, canvasHeight) {
    return new PhysicsSystem(canvasWidth, canvasHeight);
}
