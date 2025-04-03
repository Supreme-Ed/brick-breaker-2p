/**
 * AI Controller for Brick Breaker 2P
 * Handles AI paddle movement and power-up usage
 */

export class AIController {
    constructor(difficulty = 'medium') {
        this.difficulty = difficulty; // 'easy', 'medium', 'hard'
        this.reactionDelay = this.getReactionDelay();
        this.accuracy = this.getAccuracy();
        this.lastBallPosition = null;
        this.targetPosition = null;
        this.lastUpdateTime = 0;
        this.predictionLookAhead = this.getPredictionLookAhead();
        this.shootCooldown = 0;
    }
    
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        this.reactionDelay = this.getReactionDelay();
        this.accuracy = this.getAccuracy();
        this.predictionLookAhead = this.getPredictionLookAhead();
    }
    
    getReactionDelay() {
        switch (this.difficulty) {
            case 'easy': return 500; // 500ms delay
            case 'medium': return 250; // 250ms delay
            case 'hard': return 100; // 100ms delay
            default: return 250;
        }
    }
    
    getAccuracy() {
        switch (this.difficulty) {
            case 'easy': return 0.7; // 70% accuracy
            case 'medium': return 0.85; // 85% accuracy
            case 'hard': return 0.95; // 95% accuracy
            default: return 0.85;
        }
    }
    
    getPredictionLookAhead() {
        switch (this.difficulty) {
            case 'easy': return 1; // Only basic prediction
            case 'medium': return 2; // Medium prediction
            case 'hard': return 3; // Advanced prediction
            default: return 2;
        }
    }
    
    update(paddle, ball, canvasWidth, canvasHeight, deltaTime) {
        // Update cooldowns
        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
        }
        
        // Skip if paddle is frozen or turned to ashes
        if (paddle.isFrozen || paddle.isAshes) {
            return null;
        }
        
        // Simple AI logic: just track the ball directly with slight prediction
        const currentTime = Date.now();
        
        // Only update target position after reaction delay
        if (!this.lastBallPosition || currentTime - this.lastUpdateTime > this.reactionDelay) {
            this.lastBallPosition = { x: ball.x, y: ball.y, dx: ball.dx, dy: ball.dy };
            this.targetPosition = this.predictBallPosition(ball, paddle, canvasWidth, canvasHeight);
            this.lastUpdateTime = currentTime;
        }
        
        return this.targetPosition;
    }
    
    predictBallPosition(ball, paddle, canvasWidth, canvasHeight) {
        // If ball is moving away from paddle, aim for center with slight offset
        if ((paddle.isTopPaddle && ball.dy < 0) || (!paddle.isTopPaddle && ball.dy > 0)) {
            return canvasWidth / 2;
        }
        
        // Simple prediction - just look ahead a bit based on ball direction
        const timeToReachPaddle = this.getTimeToReachPaddle(ball, paddle);
        const predictedX = ball.x + (ball.dx * timeToReachPaddle);
        
        // Ensure the predicted position is within bounds
        const boundedX = Math.max(
            paddle.width / 2, 
            Math.min(canvasWidth - paddle.width / 2, predictedX)
        );
        
        return boundedX;
    }
    
    getTimeToReachPaddle(ball, paddle) {
        // Calculate time for ball to reach paddle's y position
        const targetY = paddle.isTopPaddle ? paddle.y + paddle.height : paddle.y;
        const distanceY = Math.abs(targetY - ball.y);
        
        // Avoid division by zero
        if (Math.abs(ball.dy) < 0.1) return 1;
        
        return distanceY / Math.abs(ball.dy);
    }
    
    shouldUseShoot(paddle, opponentPaddle) {
        // Don't shoot if on cooldown
        if (this.shootCooldown > 0) return false;
        
        // Probability of shooting based on difficulty
        let shootProbability;
        switch (this.difficulty) {
            case 'easy': shootProbability = 0.01; break; // 1% chance per frame
            case 'medium': shootProbability = 0.02; break; // 2% chance per frame
            case 'hard': shootProbability = 0.03; break; // 3% chance per frame
            default: shootProbability = 0.02;
        }
        
        // Higher chance to shoot if opponent is not frozen/ashes and AI has a power-up
        if (!opponentPaddle.isFrozen && !opponentPaddle.isAshes) {
            if (paddle.hasFreezeRay || paddle.hasLaser) {
                shootProbability *= 3; // Triple chance
                
                // Random decision to shoot
                if (Math.random() < shootProbability) {
                    this.shootCooldown = 3; // 3 second cooldown
                    return true;
                }
            }
        }
        
        return false;
    }
}

// Factory function to create AI controller
export function createAIController(difficulty = 'medium') {
    return new AIController(difficulty);
}
