/**
 * Physics system for Brick Breaker 2P
 * Handles collision detection and resolution
 */

export class PhysicsSystem {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
    }
    
    update(balls, paddle1, paddle2, bricks, freezeRays, laserBeams, particles, audioManager) {
        // Update all physics entities
        this.updateBalls(balls, paddle1, paddle2, bricks, audioManager);
        this.updateFreezeRays(freezeRays, paddle1, paddle2, audioManager);
        this.updateLaserBeams(laserBeams, paddle1, paddle2, bricks, particles, audioManager);
        this.updateParticles(particles);
        
        // Return any important events
        return this.checkGameEvents(balls, bricks);
    }
    
    updateBalls(balls, paddle1, paddle2, bricks, audioManager) {
        const events = [];
        
        balls.forEach(ball => {
            // Check for wall collisions
            const wallCollision = this.checkWallCollision(ball);
            if (wallCollision.collided) {
                audioManager.playSound('wallHit');
            }
            
            // Check for paddle collisions
            const paddle1Collision = this.checkPaddleCollision(ball, paddle1, false);
            const paddle2Collision = this.checkPaddleCollision(ball, paddle2, true);
            
            if (paddle1Collision || paddle2Collision) {
                audioManager.playSound('paddleHit');
            }
            
            // Check for brick collisions
            const brickCollision = bricks.checkCollision(ball);
            if (brickCollision.hit) {
                // Award points to the player who last hit the ball
                if (ball.lastHitBy === 1) {
                    paddle1.score += 5;
                    console.log(`[DEBUG] Player 1 scored 5 points for breaking a brick`);
                } else {
                    paddle2.score += 5;
                    console.log(`[DEBUG] ${paddle2.isAI ? 'AI' : 'Player 2'} scored 5 points for breaking a brick`);
                }
                
                // Check for power-ups
                if (brickCollision.powerUp) {
                    this.handlePowerUp(brickCollision.powerUp, ball.lastHitBy, paddle1, paddle2, audioManager);
                }
                
                audioManager.playSound('brickHit'); // Play brick hit sound
                events.push({ type: 'brickBreak', brick: brickCollision.brick });
            }
            
            // Check for boundary crossings
            const boundaryCollision = this.checkBoundaryCollision(ball);
            if (boundaryCollision.boundary) {
                if (boundaryCollision.boundary === 'top') {
                    // Ball crossed top boundary (Player 1 scores)
                    paddle1.score += 10;
                    // Score sound removed as requested
                    events.push({ type: 'score', scorer: 1, points: 10 });
                } else if (boundaryCollision.boundary === 'bottom') {
                    // Ball crossed bottom boundary (Player 2 scores)
                    paddle2.score += 10;
                    // Score sound removed as requested
                    events.push({ type: 'score', scorer: 2, points: 10 });
                }
                
                // Reset the ball
                this.resetBall(ball);
            }
        });
        
        return events;
    }
    
    checkWallCollision(ball) {
        let collided = false;
        
        // Left and right walls
        if (ball.x - ball.radius < 0) {
            ball.x = ball.radius;
            ball.dx = Math.abs(ball.dx);
            collided = true;
        } else if (ball.x + ball.radius > this.canvasWidth) {
            ball.x = this.canvasWidth - ball.radius;
            ball.dx = -Math.abs(ball.dx);
            collided = true;
        }
        
        return { collided };
    }
    
    checkPaddleCollision(ball, paddle, isTopPaddle) {
        // Skip if paddle is turned to ashes
        if (paddle.isAshes) return false;
        
        // Check if ball is colliding with paddle
        if (ball.x + ball.radius > paddle.x && 
            ball.x - ball.radius < paddle.x + paddle.width && 
            ((isTopPaddle && ball.y - ball.radius < paddle.y + paddle.height && ball.y > paddle.y) || 
             (!isTopPaddle && ball.y + ball.radius > paddle.y && ball.y < paddle.y + paddle.height))) {
            
            // Calculate impact point on paddle (0 to 1)
            const impactPoint = (ball.x - paddle.x) / paddle.width;
            
            // Calculate bounce angle based on impact point
            // Center = straight, edges = angled
            const maxBounceAngle = Math.PI / 3; // 60 degrees
            const bounceAngle = (impactPoint * 2 - 1) * maxBounceAngle * paddle.curvature;
            
            // Set new velocity based on bounce angle
            const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
            const direction = isTopPaddle ? 1 : -1; // Down for top paddle, up for bottom paddle
            
            ball.dx = Math.sin(bounceAngle) * speed;
            ball.dy = Math.cos(bounceAngle) * speed * direction;
            
            // Ensure ball is outside paddle to prevent multiple collisions
            if (isTopPaddle) {
                ball.y = paddle.y + paddle.height + ball.radius;
            } else {
                ball.y = paddle.y - ball.radius;
            }
            
            // Update last hit by
            ball.lastHitBy = isTopPaddle ? 2 : 1;
            
            return true;
        }
        
        return false;
    }
    
    checkBoundaryCollision(ball) {
        // Check if ball crossed top or bottom boundary
        if (ball.y - ball.radius < 0) {
            // Ball crossed top boundary (Player 1 scores)
            return { boundary: 'top', scorer: 1 };
        } else if (ball.y + ball.radius > this.canvasHeight) {
            // Ball crossed bottom boundary (Player 2 scores)
            return { boundary: 'bottom', scorer: 2 };
        }
        
        // No boundary crossed
        return { boundary: null, scorer: null };
    }
    
    resetBall(ball) {
        // Reset ball position and direction using the ball's baseSpeed property
        if (ball.owner === 1) {
            // Player 1's ball (bottom)
            ball.x = this.canvasWidth / 2;
            ball.y = this.canvasHeight - 50;
            ball.dx = (Math.random() * 0.8 - 0.4) * ball.baseSpeed; // Use baseSpeed for consistent velocity
            ball.dy = -ball.baseSpeed * 0.6; // Use baseSpeed for consistent velocity
        } else {
            // Player 2's ball (top)
            ball.x = this.canvasWidth / 2;
            ball.y = 50;
            ball.dx = (Math.random() * 0.8 - 0.4) * ball.baseSpeed; // Use baseSpeed for consistent velocity
            ball.dy = ball.baseSpeed * 0.6; // Use baseSpeed for consistent velocity
        }
        
        ball.lastHitBy = ball.owner;
    }
    
    handlePowerUp(powerUpType, playerId, paddle1, paddle2, audioManager) {
        const paddle = playerId === 1 ? paddle1 : paddle2;
        
        switch (powerUpType) {
            case 'freezeRay':
                paddle.hasFreezeRay = true;
                break;
                
            case 'widePaddle':
                paddle.makeWide(10); // 10 seconds duration
                break;
                
            case 'laser':
                paddle.hasLaser = true;
                break;
        }
        
        audioManager.playSound('powerUp'); // Play power-up collected sound
    }
    
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
            particles[i].update();
            
            // Remove expired particles
            if (particles[i].isExpired) {
                particles.splice(i, 1);
            }
        }
    }
    
    checkGameEvents(balls, bricks) {
        const events = [];
        
        // Check if all bricks are cleared
        if (bricks.countActiveBricks() === 0) {
            events.push({ type: 'allBricksCleared' });
            audioManager.playSound('levelComplete'); // Play level complete sound
        }
        
        return events;
    }
}

// Factory function to create physics system
export function createPhysicsSystem(canvasWidth, canvasHeight) {
    return new PhysicsSystem(canvasWidth, canvasHeight);
}
