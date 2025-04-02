/**
 * FreezeRay power-up class
 * Handles the freeze ray power-up that temporarily disables opponent's paddle
 */

class FreezeRay {
    constructor(x, y, owner, canvasHeight) {
        this.x = x;
        this.y = y;
        this.width = 10; // Increased from 5 to be more visible
        this.height = owner === 1 ? -canvasHeight : canvasHeight;
        this.owner = owner;
        this.speed = 12;
        this.isExpired = false;
        this.alphaValue = 1.0;
        this.hitTarget = false;
        this.progress = 0;
    }

    update(paddle1, paddle2) {
        if (this.hitTarget) {
            this.alphaValue -= 0.05;
            if (this.alphaValue <= 0) {
                this.isExpired = true;
            }
            return false;
        }
        
        this.progress += this.speed / Math.abs(this.height);
        
        if (this.progress >= 1) {
            const targetPaddle = this.owner === 1 ? paddle2 : paddle1;
            const hitX = this.x;
            
            if (targetPaddle && hitX >= targetPaddle.x && hitX <= targetPaddle.x + targetPaddle.width) {
                // Use the paddle's freeze method instead of directly setting properties
                console.log(`[DEBUG FreezeRay] Hit detected on paddle owned by player: ${this.owner === 1 ? 2 : 1}`);
                targetPaddle.freeze(10);
                console.log(`[DEBUG] Player ${this.owner === 1 ? 2 : 1} frozen for 10 seconds!`);
                this.hitTarget = true;
                
                // Check if window.audioManager exists before calling playFreezeHit
                if (window.audioManager && typeof window.audioManager.playFreezeHit === 'function') {
                    window.audioManager.playFreezeHit();
                }
                
                return true; // Hit success
            } else {
                console.log(`[DEBUG] Freeze ray missed!`);
                this.hitTarget = true;
                return false; // Miss
            }
        }
        
        return false; // No hit yet
    }

    draw(ctx) {
        if (!this.isExpired) {
            ctx.save();
            ctx.globalAlpha = this.alphaValue;
            
            // Create gradient for freeze ray
            const gradient = ctx.createLinearGradient(
                this.x - this.width, this.y,
                this.x + this.width, this.y + this.height * this.progress
            );
            
            // Set gradient colors
            gradient.addColorStop(0, 'rgba(0, 255, 255, 0.9)'); // Cyan
            gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.7)');
            gradient.addColorStop(1, 'rgba(0, 255, 255, 0.3)');
            
            // Draw main beam - wider for better visibility
            ctx.fillStyle = gradient;
            ctx.fillRect(
                this.x - this.width * 2,
                this.y,
                this.width * 4,
                this.height * this.progress
            );
            
            // Draw core of the beam (brighter)
            ctx.fillStyle = '#00FFFF';
            ctx.fillRect(
                this.x - this.width,
                this.y,
                this.width * 2,
                this.height * this.progress
            );
            
            // Draw glow effect
            ctx.shadowColor = '#00FFFF';
            ctx.shadowBlur = 20; // Increased from 15 for better visibility
            ctx.fillRect(
                this.x - this.width / 2,
                this.y,
                this.width,
                this.height * this.progress
            );
            
            // Draw ice crystal particles along the beam
            this.drawIceParticles(ctx);
            
            ctx.restore();
        }
    }
    
    drawIceParticles(ctx) {
        // Draw ice crystal particles along the beam - more particles for better visibility
        const particleCount = Math.floor(Math.abs(this.height) * this.progress / 15); // Increased particle count
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        for (let i = 0; i < particleCount; i++) {
            const x = this.x + (Math.random() - 0.5) * this.width * 6; // Wider spread
            const y = this.y + Math.random() * this.height * this.progress;
            const size = 2 + Math.random() * 3; // Larger particles
            
            // Draw a small ice crystal
            ctx.beginPath();
            ctx.moveTo(x, y - size);
            ctx.lineTo(x + size, y);
            ctx.lineTo(x, y + size);
            ctx.lineTo(x - size, y);
            ctx.closePath();
            ctx.fill();
        }
    }
}

// Revert to ES Module export only
export { FreezeRay };
