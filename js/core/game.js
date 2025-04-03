/**
 * Main Game class for Brick Breaker 2P
 * Coordinates all game systems and manages the game loop
 */

import { createRenderer } from './renderer.js';
import { createPhysicsSystem } from './physics.js';
import { createGameStateManager } from './gameState.js';
import { createInputManager } from '../controllers/input.js';
import { createAIController } from '../controllers/ai.js';
import { createBall } from '../entities/ball.js';
import { createPaddle } from '../entities/paddle_entity.js';
import { createBrickManager } from '../entities/brick.js';
import { Particle, createBrickParticles, createAshParticles } from '../entities/particles.js';
import { FreezeRay } from '../powerups/freezeRay.js';
import { LaserBeam } from '../powerups/laserBeam.js';
import { audioManager } from '../utils/audio.js';

class Game {
    constructor() {
        this.initialized = false;

        // Get canvas and context
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Initialize game systems
        this.renderer = createRenderer(this.canvas);
        this.physics = createPhysicsSystem(this.canvas.width, this.canvas.height);
        this.gameState = createGameStateManager();
        this.input = createInputManager(this.canvas);
        this.isTouchEnvironment = this.input.isTouchDevice; // Check touch environment
        
        // Initialize game objects
        this.paddle1 = createPaddle(false, this.canvas.width, this.canvas.height);
        this.paddle2 = createPaddle(true, this.canvas.width, this.canvas.height);
        this.balls = [
            createBall(1, this.canvas.width, this.canvas.height),
            createBall(2, this.canvas.width, this.canvas.height)
        ];
        this.bricks = createBrickManager(this.canvas.width, this.canvas.height);
        
        // Initialize AI controllers
        this.ai1 = createAIController('medium');
        this.ai2 = createAIController('medium');
        
        // Initialize power-ups and effects
        this.freezeRays = [];
        this.laserBeams = [];
        this.particles = [];
        
        // Initialize UI elements
        this.player1PowerUpIndicator = document.getElementById('player1PowerUp');
        this.player2PowerUpIndicator = document.getElementById('player2PowerUp');
        this.player1LaserIndicator = document.getElementById('player1LaserPowerUp');
        this.player2LaserIndicator = document.getElementById('player2LaserPowerUp');
        
        // Bind methods
        this.update = this.update.bind(this);
        this.draw = this.draw.bind(this);
        this.gameLoop = this.gameLoop.bind(this);
        this.returnToStartScreen = this.returnToStartScreen.bind(this);
        this.restartGame = this.restartGame.bind(this);
        this.updatePaddles = this.updatePaddles.bind(this);
        this.shootAction = this.shootAction.bind(this);
        this.shootFreezeRay = this.shootFreezeRay.bind(this);
        this.shootLaser = this.shootLaser.bind(this);
        
        // Initialize audio
        audioManager.init();
    }
    
    init(mode, controlMethod) {
        // Store the game mode
        this.gameMode = mode;

        // Determine final control method, overriding for touch devices in P1 vs AI
        let finalControlMethod = controlMethod;
        if (this.gameMode === 1 && this.isTouchEnvironment) {
            finalControlMethod = 'mouse'; // Force mouse/touch controls
        }
        this.controlMethod = finalControlMethod; // Store final method on Game instance
        
        // Initialize game state
        this.gameState.init(this.gameMode, this.controlMethod);
        
        // Reset game objects
        this.resetGame();
        
        // Update UI
        this.updateUIButtons();
        
        // Start the game loop
        this.lastTime = performance.now(); // Restore lastTime initialization
        this.gameLoop();
        
        // Mark as initialized
        this.initialized = true;
        // Play start sound
        audioManager.playGameStart();
        
        // Return the game instance for chaining
        return this;
    }
    
    resetGame() {
        // Reset paddles
        this.paddle1.x = (this.canvas.width - this.paddle1.width) / 2;
        this.paddle1.score = 0;
        this.paddle1.hasFreezeRay = false;
        this.paddle1.isFrozen = false;
        this.paddle1.isWide = false;
        this.paddle1.hasLaser = false;
        this.paddle1.isAshes = false;
 
        this.paddle2.x = (this.canvas.width - this.paddle2.width) / 2;
        this.paddle2.score = 0;
        this.paddle2.hasFreezeRay = false;
        this.paddle2.isFrozen = false;
        this.paddle2.isWide = false;
        this.paddle2.hasLaser = false;
        this.paddle2.isAshes = false;
        
        // Reset balls
        this.balls[0].reset(1);
        this.balls[1].reset(2);
        
        // Reset bricks
        this.bricks.initGrid();
        
        // Clear power-ups and effects
        this.freezeRays = [];
        this.laserBeams = [];
        this.particles = [];
        
        // Update UI
        this.updatePowerUpIndicators();
    }
    
    gameLoop(timestamp) {
        // Restore original deltaTime calculation
        const currentTime = timestamp || performance.now(); 
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Update game logic
        this.update(deltaTime); 
 
        // Draw everything
        this.draw();
        
        // Request next frame at the end
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    update(deltaTime) { // Update method now receives deltaTime
        // Check for escape key to pause
        if (this.input.isEscapePressed()) {
            this.gameState.handleEvent({ type: 'escape' });
            return;
        }
        
        // Get input state
        const keys = this.input.getKeys();
        const mousePosition = this.input.getMousePosition();
        
        // Handle cheat codes
        this.handleCheats(keys);
        
        // Update paddles based on game mode
        this.updatePaddles(deltaTime, keys, mousePosition);
        
        // Update balls
        this.balls.forEach(ball => ball.update(deltaTime));
        
        // Clean up expired power-ups and particles to prevent memory issues
        this.cleanupExpiredEntities();
        
        // Update physics
        const events = this.physics.update(
            this.balls,
            this.paddle1,
            this.paddle2,
            this.bricks,
            this.freezeRays,
            this.laserBeams,
            this.particles,
            audioManager
        );
        
        // Handle game events
        events.forEach(event => {
            this.gameState.handleEvent(event);
            
            if (event.type === 'brickBreak') {
                createBrickParticles(event.brick, this.particles);
                
                // --- Add Power-up Granting Logic ---
                if (event.brick && event.brick.powerUpType && event.ball) {
                    const paddle = event.ball.playerNum === 1 ? this.paddle1 : this.paddle2;
                    if (paddle) {
                        switch (event.brick.powerUpType) {
                            case 'freeze':
                                paddle.activateFreezeRay(); // Call activation function
                                audioManager.playPowerUp();
                                console.log(`Power-up: Freeze Ray granted to Player ${event.ball.playerNum}`);
                                break;
                            case 'laser':
                                paddle.activateLaser(); // Call activation function
                                audioManager.playPowerUp();
                                console.log(`Power-up: Laser granted to Player ${event.ball.playerNum}`);
                                break;
                            // Add cases for other power-ups if needed
                        }
                    }
                }
                // --- End Power-up Granting Logic ---
                
            } else if (event.type === 'allBricksCleared') {
                // Award bonus points (from PRD)
                this.paddle1.score += 20;
                this.paddle2.score += 20;
                this.bricks.nextPattern();
                audioManager.playLevelComplete();
            }
        });
        
        // Check for power-up activation
        this.checkPowerUpActivation();
        
        // Update UI
        this.updatePowerUpIndicators();
    }
    
    cleanupExpiredEntities() {
        try {
            // Perform safety check for null entities first
            if (!this.freezeRays) this.freezeRays = [];
            if (!this.laserBeams) this.laserBeams = [];
            if (!this.particles) this.particles = [];
            
            // Clean up expired freeze rays
            if (this.freezeRays.length > 0) {
                const initialCount = this.freezeRays.length;
                // Check for invalid objects before filtering
                this.freezeRays = this.freezeRays.filter(ray => ray && typeof ray === 'object' && !ray.isExpired);
                const removedCount = initialCount - this.freezeRays.length;
                if (removedCount > 0) {
                    console.log(`[Game] Cleaned up ${removedCount} expired freeze rays. Remaining: ${this.freezeRays.length}`);
                }
            }
            
            // Clean up expired laser beams
            if (this.laserBeams.length > 0) {
                const initialCount = this.laserBeams.length;
                // Check for invalid objects before filtering
                this.laserBeams = this.laserBeams.filter(beam => beam && typeof beam === 'object' && !beam.isExpired);
                const removedCount = initialCount - this.laserBeams.length;
                if (removedCount > 0) {
                    console.log(`[Game] Cleaned up ${removedCount} expired laser beams. Remaining: ${this.laserBeams.length}`);
                }
            }
            
            // Clean up expired particles
            if (this.particles.length > 0) {
                const initialCount = this.particles.length;
                // Check for invalid objects before filtering
                this.particles = this.particles.filter(particle => 
                    particle && typeof particle === 'object' && 
                    !particle.isExpired && particle.active);
                const removedCount = initialCount - this.particles.length;
                if (removedCount > 0 && initialCount > 50) { // Only log if we're removing a significant number
                    console.log(`[Game] Cleaned up ${removedCount} expired particles. Remaining: ${this.particles.length}`);
                }
            }
            
            // Forcibly limit the maximum number of entities to prevent memory/performance issues
            if (this.freezeRays.length > 10) {
                console.warn(`[Game] Too many freeze rays (${this.freezeRays.length}). Removing oldest.`);
                this.freezeRays = this.freezeRays.slice(-10); // Keep only the 10 most recent
            }
            
            if (this.laserBeams.length > 10) {
                console.warn(`[Game] Too many laser beams (${this.laserBeams.length}). Removing oldest.`);
                this.laserBeams = this.laserBeams.slice(-10); // Keep only the 10 most recent
            }
            
            if (this.particles.length > 200) {
                // Keep only the 200 most recent particles
                this.particles = this.particles.slice(-200);
            }
            
            // Periodically force a hard refresh of event handlers (every ~10 seconds)
            const currentTime = performance.now();
            if (!this.lastEventRefresh || currentTime - this.lastEventRefresh > 10000) {
                this.lastEventRefresh = currentTime;
                // Re-bind key event handlers to handle potential event handler memory leaks
                if (this.input && typeof this.input.setupEventListeners === 'function') {
                    // We're not actually re-binding here, just checking the input system is still working
                    console.log("[Game] Verifying input system is responsive");
                }
            }
        } catch (error) {
            console.error('[Game] Error in cleanupExpiredEntities:', error);
            // Reset to safe defaults in case of critical error
            this.freezeRays = [];
            this.laserBeams = [];
        }
    }
    
    handleCheats(keys) {
        // Cheats only active in single player (mode 1) or debug/test modes
        // Or potentially if a global debug flag is set
        const gameMode = this.gameState.gameMode;
        if (gameMode === 1) { // Assuming mode 1 is Player vs AI
            if (keys.l) {
                // --- Use activation function instead of direct assignment ---
                this.paddle1.activateLaser(); 
                // this.paddle1.hasLaser = true; // Original direct assignment
                // this.paddle1.hasFreezeRay = false; // activateLaser should handle exclusivity if needed
                console.log('CHEAT: Laser added to Player 1');
                keys.l = false; // Consume the key press
                audioManager.playPowerUp(); // Play feedback sound
            }
            // Restore original check for 'f' key
            if (keys.f) {
                // --- Use activation function instead of direct assignment ---
                this.paddle1.activateFreezeRay();
                // this.paddle1.hasFreezeRay = true; // Original direct assignment
                // this.paddle1.hasLaser = false; // activateFreezeRay should handle exclusivity if needed
                console.log('CHEAT: Freeze Ray added to Player 1');
                keys.f = false; // Consume the key press
                audioManager.playPowerUp(); // Play feedback sound
            }
        }
    }
    
    updatePaddles(deltaTime, keys, mousePosition) {
        const gameMode = this.gameState.gameMode;
        const controlMethod = this.gameState.controlMethod;
        
        // Helper function for AI shooting logic
        this.getOpponentPaddle = function(playerNum) {
            return playerNum === 1 ? this.paddle2 : this.paddle1;
        }
        
        // Player 1 (bottom)
        if (gameMode === 3) {
            // AI vs AI: Both paddles controlled by AI
            this.paddle1.update(deltaTime, keys, true, this.balls, this);
        } else {
            // Player controlled
            if (controlMethod === 'mouse') {
                // Mouse control for player 1
                this.paddle1.targetX = mousePosition.x;
                this.paddle1.update(deltaTime, keys);
                
                // Check for mouse click to shoot
                const isP1ShootTriggered = this.input.isMousePressed(); // This now returns true only once per click
                
                // Only check position if a click was actually detected
                if (isP1ShootTriggered && mousePosition.y > this.canvas.height / 2) {
                    console.log("[Game] Player 1 mouse shoot triggered at", mousePosition.x, mousePosition.y);
                    const result = this.shootAction(1);
                    console.log("[Game] Shoot action result:", result);
                }
                
                // Handle tap events separately
                const tapped = this.input.wasTapped();
                const tapPosition = this.input.getTapPosition(); // Clears tap position after getting
                const isP1TapTriggered = tapped && tapPosition && tapPosition.y > this.canvas.height / 2;
                
                if (isP1TapTriggered) {
                    console.log("[Game] Player 1 tap shoot triggered at", tapPosition.x, tapPosition.y);
                    const result = this.shootAction(1);
                    console.log("[Game] Shoot action result:", result);
                }
            } else {
                // Keyboard control for player 1
                this.paddle1.targetX = null;
                this.paddle1.update(deltaTime, keys);
                
                // Check for space key to shoot using our new method
                if (this.input.isSpaceKeyPressed()) {
                    console.log("[Game] Player 1 keyboard shoot triggered");
                    const result = this.shootAction(1);
                    console.log("[Game] Keyboard shoot action result:", result);
                }
            }
        }
        
        // Player 2 (top)
        if (gameMode === 1 || gameMode === 3) {
            // AI control for player 2
            this.paddle2.update(deltaTime, keys, true, this.balls, this);
        } else {
            // Player controlled
            this.paddle2.targetX = null;
            this.paddle2.update(deltaTime, keys);
            
            // Check for S key to shoot using our new method
            if (this.input.isSKeyPressed()) {
                console.log("[Game] Player 2 keyboard shoot triggered");
                const result = this.shootAction(2);
                console.log("[Game] Keyboard shoot action result:", result);
            }
        }
    }
    
    checkPowerUpActivation() {
        // Perform regular synchronization of game state and UI
        try {
            // Verify paddle power-up states are valid
            if (this.paddle1) {
                if (this.paddle1.hasLaser && this.paddle1.hasFreezeRay) {
                    // This shouldn't happen - fix the inconsistency
                    console.warn('[Game] Inconsistent power-up state for Player 1 - has both laser and freeze ray');
                    // Keep the most recently acquired power-up
                    if (this.freezeRays.length > 0 && this.freezeRays[this.freezeRays.length - 1].owner === 1) {
                        this.paddle1.hasLaser = false;
                    } else {
                        this.paddle1.hasFreezeRay = false;
                    }
                }
            }
            
            if (this.paddle2) {
                if (this.paddle2.hasLaser && this.paddle2.hasFreezeRay) {
                    // This shouldn't happen - fix the inconsistency
                    console.warn('[Game] Inconsistent power-up state for Player 2 - has both laser and freeze ray');
                    // Keep the most recently acquired power-up
                    if (this.freezeRays.length > 0 && this.freezeRays[this.freezeRays.length - 1].owner === 2) {
                        this.paddle2.hasLaser = false;
                    } else {
                        this.paddle2.hasFreezeRay = false;
                    }
                }
            }
            
            // Explicitly update UI indicators
            this.updatePowerUpIndicators();
        } catch (error) {
            console.error('[Game] Error in checkPowerUpActivation:', error);
        }
    }
    
    shootAction(player) {
        try {
            const startTime = performance.now();
            console.log(`[Game] Shoot Action triggered for player ${player} at time: ${startTime}`);
            
            // Get the correct paddle
            const paddle = player === 1 ? this.paddle1 : this.paddle2;
            if (!paddle) {
                console.error(`[Game] Error: No paddle found for player ${player}`);
                return false;
            }
            
            // Check each power-up type and log state
            console.log(`[Game] Power-up status for player ${player}: FreezeRay=${paddle.hasFreezeRay}, Laser=${paddle.hasLaser}`);
            
            if (paddle.hasFreezeRay) {
                const result = this.shootFreezeRay(player);
                console.log(`[Game] shootFreezeRay result: ${result}`);
                return result;
            } else if (paddle.hasLaser) {
                const result = this.shootLaser(player);
                console.log(`[Game] shootLaser result: ${result}`);
                return result;
            } else {
                console.log(`[Game] No power-up available for player ${player}`);
            }
            
            const endTime = performance.now();
            console.log(`[Game] Shoot Action finished for player ${player} at time: ${endTime} (Duration: ${(endTime - startTime).toFixed(2)}ms)`);
            return false; // Return false if no power-up was used
        } catch (error) {
            console.error(`[Game] Error in shootAction for player ${player}:`, error);
            return false;
        }
    }
    
    shootFreezeRay(player) {
        const paddle = player === 1 ? this.paddle1 : this.paddle2;
        
        // Log the attempt to shoot a freeze ray
        console.log(`[Game] Attempting to shoot freeze ray for player ${player}. Has freeze ray: ${paddle.hasFreezeRay}`);
        
        if (paddle.useFreezeRay()) {
            const x = paddle.x + paddle.width / 2;
            const y = player === 1 ? paddle.y : paddle.y + paddle.height;
            
            // Clean up any expired freeze rays first to prevent array overflow
            this.freezeRays = this.freezeRays.filter(ray => !ray.isExpired);
            
            // Create and add the new freeze ray
            const newRay = new FreezeRay(x, y, player, this.canvas.height);
            this.freezeRays.push(newRay);
            
            // Play sound effect
            audioManager.playFreezeRay();
            console.log(`[Game] Freeze ray created and added to array. Current count: ${this.freezeRays.length}`);
            return true;
        }
        
        return false;
    }
    
    shootLaser(player) {
        const paddle = player === 1 ? this.paddle1 : this.paddle2;
        
        // Log the attempt to shoot a laser
        console.log(`[Game] Attempting to shoot laser for player ${player}. Has laser: ${paddle.hasLaser}`);
        
        // Check if the paddle can use the laser (handles ammo check/consumption internally)
        if (paddle.useLaser()) {
            const x = paddle.x + paddle.width / 2;
            const y = player === 1 ? paddle.y : paddle.y + paddle.height;
            
            // Clean up any expired laser beams first to prevent array overflow
            this.laserBeams = this.laserBeams.filter(beam => !beam.isExpired);
            
            // Create and add the new laser beam
            const newBeam = new LaserBeam(x, y, player, this.canvas.height);
            this.laserBeams.push(newBeam);
            
            // Play sound effect
            audioManager.playLaserShoot();
            console.log(`[Game] Laser beam created and added to array. Current count: ${this.laserBeams.length}`);
            return true;
        }
        
        return false;
    }
    
    draw() {
        // Clear canvas
        this.renderer.clear();
        
        // Draw background
        this.renderer.drawBackground();
        
        // Draw game objects
        this.bricks.draw(this.ctx);
        
        this.balls.forEach(ball => ball.draw(this.ctx));
        
        this.paddle1.draw(this.ctx);
        this.paddle2.draw(this.ctx);
        
        // Draw power-ups and effects
        this.renderer.drawFreezeRays(this.freezeRays);
        this.renderer.drawLaserBeams(this.laserBeams);
        this.renderer.drawParticles(this.particles);
        
        // Draw UI
        this.renderer.drawScore(this.paddle1, this.paddle2, this.gameState.player1Name, this.gameState.player2Name);
        
        // Draw game state messages
        if (this.gameState.isPaused()) {
            this.renderer.drawGameState('paused');
        } else if (this.gameState.isGameOver()) {
            this.renderer.drawGameState('gameOver');
        }
        
        // Draw debug info if enabled
        if (this.gameState.isDebugMode) {
            this.renderer.drawDebugInfo(
                this.gameState.fps,
                this.balls.length,
                this.bricks.countActiveBricks()
            );
        }
    }
    
    updatePowerUpIndicators() {
        // Update power-up indicators with forced DOM refresh
        try {
            // Re-query the DOM elements to ensure we have the latest references
            this.player1PowerUpIndicator = document.getElementById('player1PowerUp');
            this.player2PowerUpIndicator = document.getElementById('player2PowerUp');
            this.player1LaserIndicator = document.getElementById('player1LaserPowerUp');
            this.player2LaserIndicator = document.getElementById('player2LaserPowerUp');
            
            // Update freeze ray indicators
            if (this.player1PowerUpIndicator) {
                const newDisplayValue = this.paddle1.hasFreezeRay ? 'block' : 'none';
                if (this.player1PowerUpIndicator.style.display !== newDisplayValue) {
                    this.player1PowerUpIndicator.style.display = newDisplayValue;
                    console.log(`[UI] Player 1 freeze ray indicator updated: ${newDisplayValue}`);
                }
            }
            
            if (this.player2PowerUpIndicator) {
                const newDisplayValue = this.paddle2.hasFreezeRay ? 'block' : 'none';
                if (this.player2PowerUpIndicator.style.display !== newDisplayValue) {
                    this.player2PowerUpIndicator.style.display = newDisplayValue;
                    console.log(`[UI] Player 2 freeze ray indicator updated: ${newDisplayValue}`);
                }
            }
            
            // Update laser indicators
            if (this.player1LaserIndicator) {
                const newDisplayValue = this.paddle1.hasLaser ? 'block' : 'none';
                if (this.player1LaserIndicator.style.display !== newDisplayValue) {
                    this.player1LaserIndicator.style.display = newDisplayValue;
                    console.log(`[UI] Player 1 laser indicator updated: ${newDisplayValue}`);
                }
            }
            
            if (this.player2LaserIndicator) {
                const newDisplayValue = this.paddle2.hasLaser ? 'block' : 'none';
                if (this.player2LaserIndicator.style.display !== newDisplayValue) {
                    this.player2LaserIndicator.style.display = newDisplayValue;
                    console.log(`[UI] Player 2 laser indicator updated: ${newDisplayValue}`);
                }
            }
        } catch (error) {
            console.error('[Game] Error updating power-up indicators:', error);
        }
    }
    
    updateUIButtons() {
        const gameUI = document.getElementById('gameUI');
        if (gameUI) {
            gameUI.style.display = 'block';
        }
    }
    
    returnToStartScreen() {
        this.gameState.returnToStartScreen();
    }
    
    restartGame() {
        this.resetGame();
        this.gameState.restartGame();
        audioManager.playGameStart();
    }
}

// Create and export a singleton instance
export const game = new Game();
