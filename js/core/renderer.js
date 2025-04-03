/**
 * Renderer for Brick Breaker 2P
 * Handles all drawing operations for the game
 */

export class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
    }
    
    clear() {
        // Clear the entire canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawBackground() {
        // Draw gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#2c3e50');
        gradient.addColorStop(0.5, '#34495e');
        gradient.addColorStop(1, '#2c3e50');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawScore(paddle1, paddle2, player1Name = 'Player 1', player2Name = 'Player 2') {
        // Draw scores
        this.ctx.font = '24px Arial';
        this.ctx.fillStyle = '#ffffff';
        
        // Player 1 Score (Top Left)
        this.ctx.textAlign = 'left'; 
        this.ctx.fillText(`${player1Name}: ${paddle1.score}`, 20, 30); // Moved to top left
        
        // Player 2 Score (Top Right)
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`${player2Name}: ${paddle2.score}`, this.canvas.width - 20, 30); // Moved to top right
    }
    
    drawPowerUpIndicators(paddle1, paddle2) {
        // Update power-up indicators
        const player1PowerUpIndicator = document.getElementById('player1PowerUp');
        const player2PowerUpIndicator = document.getElementById('player2PowerUp');
        const player1LaserIndicator = document.getElementById('player1LaserPowerUp');
        const player2LaserIndicator = document.getElementById('player2LaserPowerUp');
        
        if (player1PowerUpIndicator) {
            player1PowerUpIndicator.style.display = paddle1.hasFreezeRay ? 'block' : 'none';
        }
        
        if (player2PowerUpIndicator) {
            player2PowerUpIndicator.style.display = paddle2.hasFreezeRay ? 'block' : 'none';
        }
        
        if (player1LaserIndicator) {
            player1LaserIndicator.style.display = paddle1.hasLaser ? 'block' : 'none';
        }
        
        if (player2LaserIndicator) {
            player2LaserIndicator.style.display = paddle2.hasLaser ? 'block' : 'none';
        }
    }
    
    drawFreezeRays(freezeRays) {
        // Draw all active freeze rays
        freezeRays.forEach(ray => {
            // Use !ray.isExpired instead of checking for a non-existent 'active' property
            if (!ray.isExpired) {
                ray.draw(this.ctx);
            }
        });
    }
    
    drawLaserBeams(laserBeams) {
        // Draw all active laser beams
        laserBeams.forEach(beam => {
            // Use !beam.isExpired instead of checking for a non-existent 'active' property
            if (!beam.isExpired) {
                beam.draw(this.ctx);
            }
        });
    }
    
    drawParticles(particles) {
        // Draw all active particles
        particles.forEach(particle => {
            if (particle.active) {
                particle.draw(this.ctx);
            }
        });
    }
    
    drawGameState(gameState) {
        // Draw different messages based on game state
        this.ctx.font = '36px Arial';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';
        
        if (gameState === 'paused') {
            this.ctx.fillText('Game Paused', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Press P or Click Resume to continue', this.canvas.width / 2, this.canvas.height / 2 + 40);
        } else if (gameState === 'gameOver') {
            this.ctx.fillText('Game Over', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Press any key to restart', this.canvas.width / 2, this.canvas.height / 2 + 40);
        }
    }
    
    drawPauseScreen() {
        console.log('[Renderer] drawPauseScreen called'); // DEBUG
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Semi-transparent black overlay
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.font = '36px Arial';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Paused', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press P or Resume button to continue', this.canvas.width / 2, this.canvas.height / 2 + 40);
    }
    
    drawDebugInfo(fps, ballCount, brickCount) {
        // Draw debug information
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.textAlign = 'right';
        
        this.ctx.fillText(`FPS: ${fps.toFixed(1)}`, this.canvas.width - 10, 20);
        this.ctx.fillText(`Balls: ${ballCount}`, this.canvas.width - 10, 40);
        this.ctx.fillText(`Bricks: ${brickCount}`, this.canvas.width - 10, 60);
    }
}

// Factory function to create renderer
export function createRenderer(canvas) {
    const ctx = canvas.getContext('2d');
    return new Renderer(canvas, ctx);
}
