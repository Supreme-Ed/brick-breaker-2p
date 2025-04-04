/**
 * Ball class for Brick Breaker 2P
 * Handles ball physics (via Matter.js), movement, and collision detection (via Matter.js events)
 */

import Matter from 'matter-js';

export class Ball {
    /**
     * @param {Matter.World} matterWorld - The Matter.js world instance
     * @param {number} x - Initial x position
     * @param {number} y - Initial y position
     * @param {number} radius
     * @param {number} owner - 1 for player 1, 2 for player 2
     */
        constructor(matterWorld, x, y, radius, owner) {
            this.x = x; // Still store for drawing reference, updated before draw
            this.y = y; // Still store for drawing reference, updated before draw
            this.radius = radius;
            this.owner = owner; // 1 for player 1, 2 for player 2
            this.lastHitBy = owner;
            this.baseSpeed = 75; // Reduced base speed further
            this.maxSpeed = 350;  // Max speed (can be enforced via Matter.js if needed)

            // Create Matter.js body
            const options = {
                restitution: 1.0, // Perfect bounciness (like walls)
                friction: 0,      // No friction
                frictionAir: 0,   // No air resistance
                density: 0.001,
                label: 'ball', // Identify body type in collisions
                gameObject: this // Reference back to the Ball instance
            };
            this.physicsBody = Matter.Bodies.circle(x, y, radius, options);

            // Add to the world
            Matter.World.add(matterWorld, this.physicsBody);
            console.log(`[Ball Constructor] Matter.js body created for owner ${owner} at (${x}, ${y})`); // DEBUG
        }

    /**
     * @param {number} deltaTime
     */
    update(deltaTime) {
        // Movement and wall collisions are now handled by the Matter.js engine.
        // Speed capping logic removed, relying on enforceConstantBallSpeed in Game.js for now.
    }

    // Removed checkWallCollision - Handled by Matter.js engine and static wall bodies.
    // Removed checkPaddleCollision - Handled by Matter.js collision events.
    // Removed checkBoundaryCollision - Handled by Matter.js collision events (or sensors if needed).

    /**
     * @param {number} owner - 1 for player 1, 2 for player 2
     * @param {number} canvasWidth - Needed to calculate reset position
     * @param {number} canvasHeight - Needed to calculate reset position
     */
    reset(owner, canvasWidth, canvasHeight) {
        this.owner = owner;
        this.lastHitBy = owner;

        let resetX, resetY, resetDX, resetDY;
        // Calculate reset position and velocity based on owner
        // Note: Matter.js velocity is pixels per step (roughly 1/60th sec), not pixels per second.
        // We need to scale baseSpeed accordingly. A common factor is ~1/16.66 or similar. Let's adjust.
        const matterSpeedScale = 1 / (1000 / 60); // Approximation for deltaTime scaling

        if (owner === 1) { // Player 1 (bottom)
            resetX = canvasWidth / 2;
            resetY = canvasHeight - 50;
            resetDX = (Math.random() * 0.8 - 0.4) * this.baseSpeed * matterSpeedScale;
            resetDY = -this.baseSpeed * 0.6 * matterSpeedScale;
        } else { // Player 2 (top)
            resetX = canvasWidth / 2;
            resetY = 50;
            resetDX = (Math.random() * 0.8 - 0.4) * this.baseSpeed * matterSpeedScale;
            resetDY = this.baseSpeed * 0.6 * matterSpeedScale;
        }

        // Set position and velocity using Matter.js functions
        // Ensure physicsBody exists before trying to set properties
        if (this.physicsBody) {
            Matter.Body.setPosition(this.physicsBody, { x: resetX, y: resetY });
            Matter.Body.setVelocity(this.physicsBody, { x: resetDX, y: resetDY });
            // Ensure angular velocity is zeroed out on reset
            Matter.Body.setAngularVelocity(this.physicsBody, 0);
            console.log(`[Ball Reset] Owner ${owner} reset to (${resetX.toFixed(1)}, ${resetY.toFixed(1)}) vel (${resetDX.toFixed(2)}, ${resetDY.toFixed(2)})`); // DEBUG
        } else {
            console.error(`[Ball Reset] Attempted to reset ball for owner ${owner} but physicsBody is missing.`);
        }
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        // Ensure physicsBody exists before drawing
        if (!this.physicsBody) {
             console.error(`[Ball.draw] Cannot draw ball for owner ${this.owner}, physicsBody is missing.`);
             return;
        }
        // Update internal x, y from physics body before drawing
        this.x = this.physicsBody.position.x;
        this.y = this.physicsBody.position.y;

        // Safeguard against non-finite coordinates causing crash
        if (!isFinite(this.x) || !isFinite(this.y) || !isFinite(this.radius)) {
            console.error(`[Ball.draw] Invalid physics body position: x=${this.x}, y=${this.y}. Skipping draw.`);
            // Attempt to reset the ball if position becomes invalid? Or just skip draw.
            // For now, just skip drawing. Consider adding recovery logic if this happens frequently.
            return;
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

/**
 * Factory function to create balls and integrate them with Matter.js
 * @param {Matter.World} matterWorld - The Matter.js world instance
 * @param {number} owner - 1 for player 1, 2 for player 2
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @returns {Ball} The created Ball instance
 */
export function createBall(matterWorld, owner, canvasWidth, canvasHeight) {
    const radius = 8;
    let x, y, initialDX, initialDY;
    const baseSpeed = 75; // Reduced base speed further
    const matterSpeedScale = 1 / (1000 / 60); // Scale factor for Matter.js velocity (pixels/step)

    // Determine initial position
    if (owner === 1) { // Player 1 (bottom)
        x = canvasWidth / 2;
        y = canvasHeight - 50;
    } else { // Player 2 (top)
        x = canvasWidth / 2;
        y = 50;
    }

    // Create the Ball instance (which creates the Matter body)
    const ball = new Ball(matterWorld, x, y, radius, owner);

    // Determine and set initial velocity using Matter.js
    if (owner === 1) {
        initialDX = (Math.random() * 0.8 - 0.4) * baseSpeed * matterSpeedScale;
        initialDY = -baseSpeed * 0.6 * matterSpeedScale;
    } else {
        initialDX = (Math.random() * 0.8 - 0.4) * baseSpeed * matterSpeedScale;
        initialDY = baseSpeed * 0.6 * matterSpeedScale;
    }
    // Ensure physicsBody exists before setting velocity
    if (ball.physicsBody) {
        Matter.Body.setVelocity(ball.physicsBody, { x: initialDX, y: initialDY });
        console.log(`[createBall] Ball created for owner ${owner}, initial vel (${initialDX.toFixed(2)}, ${initialDY.toFixed(2)})`); // DEBUG
    } else {
         console.error(`[createBall] Failed to set initial velocity for owner ${owner}, physicsBody is missing.`);
    }

    return ball;
}
