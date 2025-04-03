/**
 * Particle system for visual effects
 * Handles brick breaking animations and other particle effects
 */

export class Particle {
    constructor(x, y, color, velocityX, velocityY, size, gravity = 0.1, fadeRate = 0.02) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.size = size;
        this.gravity = gravity;
        this.fadeRate = fadeRate;
        this.alpha = 1;
        this.active = true;
    }

    update() {
        this.velocityY += this.gravity;
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.alpha -= this.fadeRate;
        
        if (this.alpha <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

export function createBrickParticles(brick, particles) {
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
        const velocityX = (Math.random() - 0.5) * 4;
        const velocityY = (Math.random() - 0.5) * 4;
        const size = Math.random() * 3 + 1;
        particles.push(new Particle(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color, velocityX, velocityY, size));
    }
}

export function createAshParticles(object, count, particles) {
    for (let i = 0; i < count; i++) {
        const x = object.x + Math.random() * object.width;
        const y = object.y + Math.random() * object.height;
        const velocityX = (Math.random() - 0.5) * 2;
        const velocityY = (Math.random() - 0.5) * 2;
        const size = Math.random() * 2 + 1;
        const gravity = 0.05;
        const fadeRate = 0.01;
        const color = "#888888"; // Gray ash color
        
        particles.push(new Particle(x, y, color, velocityX, velocityY, size, gravity, fadeRate));
    }
}
