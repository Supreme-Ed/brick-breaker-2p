/**
 * Game State Manager for Brick Breaker 2P
 * Handles game state, transitions, and overall game flow
 */

export class GameStateManager {
    constructor() {
        this.state = 'menu'; 
        this.gameMode = 1; // 1 = single player, 2 = two players, 3 = AI vs AI
        this.controlMethod = 'keyboard'; // 'keyboard', 'mouse', 'touch'
        this.player1Name = 'Player 1';
        this.player2Name = 'Player 2';
        this.isDebugMode = false;
        this.lastFrameTime = 0; 
        this.deltaTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.secondsCounter = 0;
    }
    
    init(mode, controlMethod) {
        this.gameMode = mode || 1;
        this.controlMethod = controlMethod || 'keyboard';
        
        // Set player names based on mode
        if (this.gameMode === 1) {
            this.player1Name = 'Player 1';
            this.player2Name = 'AI';
        } else if (this.gameMode === 2) {
            this.player1Name = 'Player 1';
            this.player2Name = 'Player 2';
        } else if (this.gameMode === 3) {
            this.player1Name = 'AI 1';
            this.player2Name = 'AI 2';
        }
    }
    
    update(timestamp) {
        if (this.lastFrameTime === 0) {
            this.lastFrameTime = timestamp;
        }

        this.deltaTime = (timestamp - this.lastFrameTime) / 1000;
        this.lastFrameTime = timestamp;

        if (!isFinite(this.deltaTime) || this.deltaTime < 0) {
            console.warn(`[GameStateManager.update] Invalid deltaTime calculated (${this.deltaTime}). Resetting to 0. timestamp=${timestamp}, lastFrameTime=${this.lastFrameTime}`);
            this.deltaTime = 0; 
        }
        
        if (this.deltaTime > 0.1) { 
            console.warn(`[GameStateManager.update] Capping large deltaTime (${this.deltaTime}) to 0.1.`);
            this.deltaTime = 0.1;
        }

        this.frameCount++;
        this.secondsCounter += this.deltaTime;
        if (this.secondsCounter >= 1) {
            this.fps = this.frameCount / this.secondsCounter;
            this.frameCount = 0;
            this.secondsCounter = 0;
        }

        return false;
    }
    
    handleEvent(event) {
        switch (event.type) {
            case 'escape':
                this.togglePause();
                break;
                
            case 'allBricksCleared':
                // Logic handled in Game.update based on physics event
                break;
                
            case 'score':
                // Handle scoring events
                break;
                
            case 'gameOver':
                this.state = 'gameOver';
                break;
                
            case 'restart':
                this.state = 'playing';
                break;
                
            case 'returnToMenu':
                this.returnToStartScreen();
                break;
        }
    }
    
    togglePause() { 
        if (this.state === 'playing') {
            this.state = 'paused';
        } else if (this.state === 'paused') {
            this.state = 'playing';
        }
    }
    
    isPlaying() {
        return this.state === 'playing';
    }
    
    isPaused() {
        return this.state === 'paused';
    }
    
    isGameOver() {
        return this.state === 'gameOver';
    }
    
    isMenu() {
        return this.state === 'menu';
    }
    
    returnToStartScreen() {
        // Navigate back to index.html
        window.location.href = 'index.html';
    }
    
    restartGame() {
        // Reset game state but stay in the same mode
        this.state = 'playing';
        return { restart: true };
    }
    
    toggleDebugMode() {
        this.isDebugMode = !this.isDebugMode;
        return this.isDebugMode;
    }
}

// Factory function to create game state manager
export function createGameStateManager() {
    return new GameStateManager();
}
