/**
 * Main Game class for Brick Breaker 2P
 * Coordinates all game systems and manages the game loop
 */

import { createRenderer } from './renderer.js';
import { createPhysicsSystem } from './physics.js'; // Keep for checkGameEvents for now
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
import Matter from 'matter-js'; // Import Matter.js

class Game {
    constructor() { // Constructor cannot be async
        this.initialized = false;

        // Get canvas and context
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Initialize game systems
        this.renderer = createRenderer(this.canvas);
        this.physics = createPhysicsSystem(this.canvas.width, this.canvas.height); // Keep instance for checkGameEvents
        this.gameState = createGameStateManager();

        // Initialize Matter.js engine
        console.log("[Game Constructor] Initializing Matter.js Engine..."); // DEBUG
        this.matterEngine = Matter.Engine.create();
        this.matterWorld = this.matterEngine.world;
        this.matterEngine.world.gravity.y = 0; // Disable gravity for top-down view

        // Create static boundaries (walls)
        const wallOptions = {
            isStatic: true,
            restitution: 1.0, // Perfect bounce
            friction: 0,
            label: 'wall' // Label for collision identification
        };
        const wallThickness = 20; // How far outside the canvas the wall center is
        Matter.World.add(this.matterWorld, [
            // Top wall (adjust Y if score zone exists later)
            Matter.Bodies.rectangle(this.canvas.width / 2, -wallThickness / 2, this.canvas.width, wallThickness, wallOptions),
            // Bottom wall (adjust Y if score zone exists later)
            Matter.Bodies.rectangle(this.canvas.width / 2, this.canvas.height + wallThickness / 2, this.canvas.width, wallThickness, wallOptions),
            // Left wall
            Matter.Bodies.rectangle(-wallThickness / 2, this.canvas.height / 2, wallThickness, this.canvas.height, wallOptions),
            // Right wall
            Matter.Bodies.rectangle(this.canvas.width + wallThickness / 2, this.canvas.height / 2, wallThickness, this.canvas.height, wallOptions)
        ]);
        console.log("[Game Constructor] Matter.js Walls Added."); // DEBUG
        console.log("[Game Constructor] Matter.js Engine Initialized."); // DEBUG
        // Use existing global InputManager if available, otherwise create it
        if (window.inputManager) {
            console.log("[Game Constructor] Using existing global InputManager.");
            this.input = window.inputManager;
            // Update canvas reference if needed (assuming InputManager uses it)
            this.input.canvas = this.canvas;
            // Re-setup listeners with the correct canvas? Or assume global listeners are enough?
            // Let's assume InputManager needs re-setup or canvas update for canvas-specific listeners.
             this.input.setupEventListeners(); // Re-run setup with the correct canvas
        } else {
             console.log("[Game Constructor] Creating new InputManager and assigning globally.");
             this.input = createInputManager(this.canvas);
             window.inputManager = this.input; // Assign to global scope
        }
        this.isTouchEnvironment = this.input.isTouchDevice; // Check touch environment

        // Initialize game objects (Pass matterWorld)
        this.paddle1 = createPaddle(this.matterWorld, false, this.canvas.width, this.canvas.height);
        this.paddle2 = createPaddle(this.matterWorld, true, this.canvas.width, this.canvas.height);
        this.balls = [
            createBall(this.matterWorld, 1, this.canvas.width, this.canvas.height),
            createBall(this.matterWorld, 2, this.canvas.width, this.canvas.height)
        ];
        this.bricks = createBrickManager(this.matterWorld, this.canvas.width, this.canvas.height);

        // Initialize AI controllers
        this.ai1 = createAIController('medium');
        this.ai2 = createAIController('medium');

        // Initialize power-ups and effects
        this.freezeRays = [];
        this.laserBeams = [];
        this.particles = [];
        this.fragments = []; // Add array to track brick fragments
        this.bricksToRemove = []; // Add array to defer brick body removal

        // Initialize UI elements
        this.player1PowerUpIndicator = document.getElementById('player1PowerUp');
        this.player2PowerUpIndicator = document.getElementById('player2PowerUp');
        this.player1LaserIndicator = document.getElementById('player1LaserPowerUp');
        this.player2LaserIndicator = document.getElementById('player2LaserPowerUp');
        this.score1Element = document.getElementById('score1');
        this.score2Element = document.getElementById('score2');
        this.topBarElement = document.getElementById('top-bar'); // Get top bar
        this.fullscreenBtn = document.getElementById('fullscreenBtn'); // Get fullscreen button

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
        this.togglePause = this.togglePause.bind(this); // Bind togglePause
        this.toggleFullScreen = this.toggleFullScreen.bind(this); // Bind toggleFullScreen
        this.drawFragments = this.drawFragments.bind(this); // Bind drawFragments
        this.checkBallOutOfBounds = this.checkBallOutOfBounds.bind(this); // Bind OOB check
        this.enforceConstantBallSpeed = this.enforceConstantBallSpeed.bind(this); // Bind speed enforcement
        this.processDeferredRemovals = this.processDeferredRemovals.bind(this); // Bind deferred removal

        // Initialize audio
        // Cannot await here. Initialization will be awaited in Game.init()
        // audioManager.init(); // Optionally start loading early, but don't await

        // Get pause button element safely within init
        this.pauseBtn = document.getElementById('pauseBtn');
        console.log('[Game Init] Pause button found. Adding listener.'); // DEBUG
        if (this.pauseBtn) {
            this.pauseBtn.addEventListener('click', this.togglePause);
        } else {
            console.error('[Game Init] Pause button element (#pauseBtn) not found!'); // DEBUG
        }

        // Get fullscreen button element safely within init
        if (this.fullscreenBtn) {
            this.fullscreenBtn.addEventListener('click', this.toggleFullScreen); // Bind context
        } else {
            console.warn('[Game Init] Fullscreen button element (#fullscreenBtn) not found.');
        }

        // Start the game loop *after* initialization in init() method
        this.lastTime = performance.now(); // Restore lastTime initialization
        // this.gameLoop(); // REMOVED from constructor

        // --- Setup Matter.js Event Listeners ---
        this.setupCollisionListener();
        // this.setupAfterUpdateListener(); // Listener setup removed as deferred removal is not currently used
        console.log("[Game Constructor] Matter.js listeners setup."); // DEBUG

        // Mark as initialized
        this.initialized = true;
        // Play start sound
        // Removed playGameStart sound call

        // Return the game instance for chaining
        return this;
    }

    async init(mode, controlMethod) { // Make init async
        // Store the game mode
        this.gameMode = mode;

        // Determine final control method, overriding for touch devices in P1 vs AI
        let finalControlMethod = controlMethod;
        if (this.gameMode === 1 && this.isTouchEnvironment) {
            finalControlMethod = 'mouse'; // Force mouse/touch controls
        }
        this.controlMethod = finalControlMethod; // Store final method on Game instance

        // --- Initialize Audio Context for Game Page ---
        console.log("[Game Init] Attempting to initialize audio context...");
        try {
            await audioManager.tryResumeContext();
            console.log("[Game Init] Audio context initialization attempt finished.");
        } catch (audioError) {
            console.error("[Game Init] Error initializing audio context:", audioError);
        }
        // --- End Audio Init ---

        // Initialize game state
        this.gameState.init(this.gameMode, this.controlMethod);

        // Reset game objects
        this.resetGame();

        // Update UI
        this.updateUIButtons();

        // Start the game loop
        // this.gameLoop(); // Moved to end of init

        // Mark as initialized
        this.initialized = true;
        // Play start sound
        // Removed playGameStart sound call
        // Audio initialization is now triggered by InputManager -> tryResumeContext on first user gesture.
        // No need to call or await audioManager.init() here anymore.

        // Start the game loop AFTER all initialization is complete
        console.log("[Game Init] Starting game loop...");
        this.gameLoop();

        // Return the game instance for chaining
        return this;
    }

    resetGame() {
        // Reset paddles (Need to update physics body position too)
        const paddle1X = (this.canvas.width - this.paddle1.width) / 2;
        const paddle2X = (this.canvas.width - this.paddle2.width) / 2;
        this.paddle1.x = paddle1X;
        this.paddle1.score = 0;
        this.paddle1.hasFreezeRay = false;
        this.paddle1.isFrozen = false;
        this.paddle1.isWide = false;
        this.paddle1.hasLaser = false;
        this.paddle1.isAshes = false;
        if (this.paddle1.physicsBody) Matter.Body.setPosition(this.paddle1.physicsBody, { x: paddle1X + this.paddle1.width / 2, y: this.paddle1.physicsBody.position.y });


        this.paddle2.x = paddle2X;
        this.paddle2.score = 0;
        this.paddle2.hasFreezeRay = false;
        this.paddle2.isFrozen = false;
        this.paddle2.isWide = false;
        this.paddle2.hasLaser = false;
        this.paddle2.isAshes = false;
        if (this.paddle2.physicsBody) Matter.Body.setPosition(this.paddle2.physicsBody, { x: paddle2X + this.paddle2.width / 2, y: this.paddle2.physicsBody.position.y });

        // Reset balls (using their own reset method which handles physics)
        this.balls.forEach(ball => {
            if (ball && typeof ball.reset === 'function') {
                ball.reset(ball.owner, this.canvas.width, this.canvas.height);
            }
        });

        // Reset bricks (initGrid handles physics body cleanup/creation)
        this.bricks.initGrid();

        // Clear power-ups and effects
        this.freezeRays = [];
        this.laserBeams = [];
        this.particles = [];

        // Clear existing fragments and their physics bodies
        this.fragments.forEach(frag => {
            if (frag) Matter.World.remove(this.matterWorld, frag);
        });
        this.fragments = []; // Clear fragments array
        this.bricksToRemove = []; // Clear deferred removal list

        // Update UI
        this.updatePowerUpIndicators();
        this.updateScoreDisplay(); // Update display on reset
    }

    gameLoop(timestamp) {
        // Always check for Pause key ('P') press, regardless of game state
        if (this.input.isPauseKeyPressed()) {
            console.log('[Game Loop] \'P\' key detected, calling togglePause'); // DEBUG
            this.togglePause(); // This now handles state checking internally
            console.log(`[Game Loop] State after P key toggle: ${this.gameState.state}`); // DEBUG
            // If we just paused, skip the rest of the loop for this frame
            if (this.gameState.isPaused()) {
                console.log('[Game Loop] Game is paused. Calling drawPauseScreen.'); // DEBUG
                this.renderer.drawPauseScreen();
                // Continue the loop to keep checking for resume and rendering pause screen
                requestAnimationFrame(this.gameLoop.bind(this));
                return;
            }
        }

        // Restore original deltaTime calculation
        const currentTime = timestamp || performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Check if paused before updating
        if (this.gameState.isPaused()) {
            // If paused, still request the next frame to keep checking
            // but don't update game logic or draw. Optionally draw a pause overlay.
            // console.log('[Game Loop] Game is paused. Calling drawPauseScreen.'); // DEBUG - Removed repeating log
            this.renderer.drawPauseScreen(); // Draw pause screen
            requestAnimationFrame(this.gameLoop.bind(this));
            return; // Skip update and draw
        }

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
            console.warn('[Game Update] Escape key pressed, toggling pause via gameState.handleEvent'); // DEBUG: Note this path is different
            return;
        }

        // Get input state
        const keys = this.input.getKeys();
        const mousePosition = this.input.getMousePosition();

        // Handle cheat codes
        this.handleCheats(keys);

        // Update paddles based on game mode
        this.updatePaddles(deltaTime, keys, mousePosition);

        // Update balls (internal logic, not physics movement)
        this.balls.forEach(ball => ball.update(deltaTime));

        // Update active freeze rays
        this.freezeRays.forEach(ray => ray.update(deltaTime, this.paddle1, this.paddle2)); // Pass paddles for collision check

        // Update active laser beams
        this.laserBeams.forEach(beam => beam.update(deltaTime, this.paddle1, this.paddle2, this.bricks)); // Pass paddles AND bricks for collision check

        // Clean up expired power-ups and particles to prevent memory issues
        this.cleanupExpiredEntities();

        // --- Update Matter.js Physics Engine ---
        // This advances the simulation, moves bodies, and detects collisions
        // The 'afterUpdate' event listener will handle deferred removals
        Matter.Engine.update(this.matterEngine, deltaTime * 1000); // Matter expects delta in milliseconds
        // --- Process Deferred Removals (e.g., from LaserBeam hits) ---
        this.processDeferredRemovals();
        // --- End Matter.js Update & Removals ---

        // --- Check for Ball Out Of Bounds ---
        this.checkBallOutOfBounds();
        // --- End Ball OOB Check ---

        // --- Enforce Constant Ball Speed ---
        this.enforceConstantBallSpeed();
        // --- End Constant Speed ---

        // Old physics system update removed
        // const events = this.physics.update(...);

        // TODO: Handle non-collision game events (like all bricks cleared)
        // This might need adjustment based on how checkGameEvents is refactored
        // or if this check moves elsewhere.
        const gameEvents = this.physics.checkGameEvents(this.bricks); // Check remaining game events

        // Handle game events (from old physics system + potentially new ones)
        // Note: Collision-related events (score, brickBreak) will be handled
        // by the Matter.js collision listener we add in Step 6.
        gameEvents.forEach(event => { // Use gameEvents from checkGameEvents
            this.gameState.handleEvent(event);

            if (event.type === 'allBricksCleared') {
                // Award bonus points (from PRD)
                this.paddle1.score += 20;
                this.paddle2.score += 20;
                this.bricks.nextPattern(); // Keep pattern switching logic here for now
                audioManager.playSound('levelComplete'); // Play sound here now
            }
        });

        // Check for power-up activation
        this.checkPowerUpActivation();

        // Update UI
        this.updatePowerUpIndicators();
        this.updateScoreDisplay(); // Update display
    }

    cleanupExpiredEntities() {
        try {
            // Perform safety check for null entities first
            if (!this.freezeRays) this.freezeRays = [];
            if (!this.laserBeams) this.laserBeams = [];
            if (!this.particles) this.particles = [];
            if (!this.fragments) this.fragments = []; // Ensure fragments array exists

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
                    particle.active); // Keep only active particles
                const removedCount = initialCount - this.particles.length;
                if (removedCount > 0 && initialCount > 50) { // Only log if we're removing a significant number
                    console.log(`[Game] Cleaned up ${removedCount} expired particles. Remaining: ${this.particles.length}`);
                }
            }

            // --- Clean up expired fragments ---
            const now = performance.now();
            this.fragments = this.fragments.filter(fragment => {
                if (!fragment) return false;
                // Add a creation timestamp to fragments if not already present
                if (!fragment.creationTime) {
                    fragment.creationTime = now;
                }
                // Remove after a certain duration (e.g., 2 seconds)
                const lifetime = 2000; // milliseconds
                if (now - fragment.creationTime > lifetime) {
                    // Check if body exists before removing (might already be removed by deferred logic)
                    if (Matter.Composite.get(this.matterWorld, fragment.id, 'body')) {
                        Matter.World.remove(this.matterWorld, fragment);
                    }
                    return false; // Remove from array
                }
                // Optional: Remove if off-screen
                const pos = fragment.position;
                if (pos.x < -50 || pos.x > this.canvas.width + 50 || pos.y < -50 || pos.y > this.canvas.height + 50) {
                     if (Matter.Composite.get(this.matterWorld, fragment.id, 'body')) {
                         Matter.World.remove(this.matterWorld, fragment);
                     }
                     return false; // Remove from array
                }
                return true; // Keep fragment
            });
            // --- End Fragment Cleanup ---


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

            // Limit fragments too
             if (this.fragments.length > 50) {
                 console.warn(`[Game] Too many fragments (${this.fragments.length}). Removing oldest.`);
                 const excess = this.fragments.length - 50;
                 const removedFragments = this.fragments.splice(0, excess); // Remove oldest from the start
                 removedFragments.forEach(frag => {
                     if (frag && Matter.Composite.get(this.matterWorld, frag.id, 'body')) {
                         Matter.World.remove(this.matterWorld, frag);
                     }
                 });
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
            this.particles = [];
            this.fragments = []; // Also clear fragments on error
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
                audioManager.playSound('powerUp'); // Play feedback sound
            }
            // Restore original check for 'f' key
            if (keys.f) {
                // --- Use activation function instead of direct assignment ---
                this.paddle1.activateFreezeRay();
                // this.paddle1.hasFreezeRay = true; // Original direct assignment
                // this.paddle1.hasLaser = false; // activateFreezeRay should handle exclusivity if needed
                console.log('CHEAT: Freeze Ray added to Player 1');
                keys.f = false; // Consume the key press
                audioManager.playSound('powerUp'); // Play feedback sound
            }
            // Add cheat for Wide Paddle ('w' key)
            if (keys.w) {
                this.paddle1.makeWide(); // Call the makeWide method
                console.log('CHEAT: Wide Paddle activated for Player 1');
                keys.w = false; // Consume the key press
                audioManager.playSound('powerUp'); // Play feedback sound
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
                if (isP1ShootTriggered) { // Removed Y-position check for mouse activation
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
        // Check Player 1 activation (Space or Mouse Click/Tap)
        if (!this.paddle1.isAI) { // Only check if player controlled
            let p1Shoot = false;
            if (this.controlMethod === 'mouse') {
                p1Shoot = this.input.isMousePressed() || (this.input.wasTapped() && this.input.getTapPosition()?.y > this.canvas.height / 2);
            } else {
                p1Shoot = this.input.isSpaceKeyPressed();
            }
            if (p1Shoot) {
                this.shootAction(1);
            }
        }

        // Check Player 2 activation (S key)
        if (!this.paddle2.isAI) { // Only check if player controlled
            if (this.input.isSKeyPressed()) {
                this.shootAction(2);
            }
        }
    }

    shootAction(player) {
        const paddle = player === 1 ? this.paddle1 : this.paddle2;
        if (paddle.isFrozen || paddle.isAshes) return false; // Cannot shoot if frozen or ashes

        if (paddle.hasLaser) {
            return this.shootLaser(player);
        } else if (paddle.hasFreezeRay) {
            return this.shootFreezeRay(player);
        }
        return false; // No power-up to shoot
    }

    shootFreezeRay(player) {
        const paddle = player === 1 ? this.paddle1 : this.paddle2;
        if (!paddle.useFreezeRay()) return false; // Check and consume power-up

        const startX = paddle.x + paddle.width / 2;
        const startY = player === 1 ? paddle.y : paddle.y + paddle.height;
        const direction = player === 1 ? -1 : 1; // Up for P1, Down for P2

        this.freezeRays.push(new FreezeRay(startX, startY, player, this.canvas.height)); // Pass owner (player) and canvasHeight
        audioManager.playSound('freezeRayShoot');
        console.log(`[Game] Player ${player} shot Freeze Ray`);
        this.updatePowerUpIndicators(); // Update UI after using
        return true;
    }

    shootLaser(player) {
        const paddle = player === 1 ? this.paddle1 : this.paddle2;
        if (!paddle.useLaser()) return false; // Check and consume power-up

        const startX = paddle.x + paddle.width / 2;
        const startY = player === 1 ? paddle.y : paddle.y + paddle.height;
        // const direction = player === 1 ? -1 : 1; // Direction is implicit in height calculation inside LaserBeam

        // Pass arguments matching FreezeRay: x, y, owner (player), canvasHeight
        this.laserBeams.push(new LaserBeam(startX, startY, player, this.canvas.height, this.matterWorld)); // Pass matterWorld
        audioManager.playSound('laserShoot');
        console.log(`[Game] Player ${player} shot Laser`);
        this.updatePowerUpIndicators(); // Update UI after using
        return true;
    }

    togglePause() {
        console.log(`[Game] togglePause called. Current state: ${this.gameState.state}`); // DEBUG
        // Call the single toggle method in GameStateManager
        const newState = this.gameState.togglePause();

        // Log the result
        if (newState === 'paused') {
            console.log('[Game] Game Paused'); // DEBUG
        } else if (newState === 'playing') {
            console.log('[Game] Game Resumed'); // DEBUG
            // Ensure game loop continues if it was stopped by pause logic
            // (The current gameLoop structure should handle this automatically by not returning early)
        }

        // Update button text/state if needed
        if (this.pauseBtn) {
            this.pauseBtn.textContent = this.gameState.isPaused() ? 'Resume' : 'Pause';
        }
    }

    toggleFullScreen() {
        const docEl = document.documentElement;
        const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullscreen || docEl.msRequestFullscreen;
        const cancelFullScreen = document.exitFullscreen || document.mozCancelFullScreen || document.webkitExitFullscreen || document.msExitFullscreen;

        if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
            // Currently not in fullscreen
            if (requestFullScreen) {
                requestFullScreen.call(docEl);
                if (this.fullscreenBtn) this.fullscreenBtn.blur(); // Remove focus
            }
        } else {
            // Currently in fullscreen
            if (cancelFullScreen) {
                cancelFullScreen.call(document);
                if (this.fullscreenBtn) this.fullscreenBtn.blur(); // Remove focus
            }
        }
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

        // Draw brick fragments
        this.drawFragments();

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
            console.error('[UI] Error updating power-up indicators:', error);
        }
    }

    updateScoreDisplay() {
        if (this.score1Element) {
            this.score1Element.textContent = `Score: ${this.paddle1.score}`;
        }
        if (this.score2Element) {
            this.score2Element.textContent = `Score: ${this.paddle2.score}`;
        }
    }

    updateUIButtons() {
        const gameUI = document.getElementById('gameUI');
        if (gameUI) {
            gameUI.style.display = 'block';
        }
    }

    showGameUI() {
        // Show the top bar instead of the old gameUI div
        if (this.topBarElement) {
            this.topBarElement.style.display = 'flex'; // Use flex as it's a flex container
        } else {
             console.warn('[UI] Top bar element (#top-bar) not found.');
        }
    }

    hideGameUI() {
        // Hide the top bar
        if (this.topBarElement) {
            this.topBarElement.style.display = 'none';
        }
    }

    returnToStartScreen() {
        this.gameState.returnToStartScreen();
    }

    restartGame() {
        this.resetGame();
        this.gameState.restartGame();
        // audioManager.playGameStart(); // Removed call to non-existent function
    }

    // Method to safely play UI click sound
    playUIClick() {
        if (audioManager && audioManager.isInitialized) {
            audioManager.playSound('uiClick');
        } else {
            console.warn("[Game] Attempted to play UI click sound before audio manager was ready.");
        }
    }
    // --- Matter.js Collision Handling ---
    setupCollisionListener() {
        Matter.Events.on(this.matterEngine, 'collisionStart', (event) => {
            const pairs = event.pairs;

            for (let i = 0; i < pairs.length; i++) {
                const pair = pairs[i];
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;

                // Try to get game objects from bodies
                const objA = bodyA.gameObject;
                const objB = bodyB.gameObject;

                // --- Collision Logic ---
                // Use labels for walls/boundaries as they might not have gameObject refs
                const labelA = bodyA.label;
                const labelB = bodyB.label;

                // Ball vs Brick
                if ((labelA === 'ball' && labelB === 'brick') || (labelA === 'brick' && labelB === 'ball')) {
                    // Identify the ball object
                    const ball = (labelA === 'ball') ? objA : objB;
                    // Pass the identified ball object and the original bodies
                    this.handleBallBrickCollision(ball, null, bodyA, bodyB); // Pass null for the ignored arg
                } // End of Ball vs Brick check

                // Ball vs Paddle
                else if ((labelA === 'ball' && labelB === 'paddle') || (labelA === 'paddle' && labelB === 'ball')) {
                    const ball = (labelA === 'ball') ? objA : objB;
                    const paddle = (labelA === 'paddle') ? objA : objB;
                     // Ensure we have valid objects before handling
                    if (ball && paddle) {
                        this.handleBallPaddleCollision(ball, paddle);
                    } else {
                        console.warn("[Collision] Invalid objects in ball-paddle collision:", { labelA, objA, labelB, objB });
                    }
                }

                // Ball vs Wall (Using labels)
                else if ((labelA === 'ball' && labelB === 'wall') || (labelA === 'wall' && labelB === 'ball')) {
                    const ball = (labelA === 'ball') ? objA : objB;
                    // const wallBody = (labelA === 'wall') ? bodyA : bodyB; // We might need wall info later
                     // Ensure we have a valid ball object
                    if (ball) {
                        this.handleBallWallCollision(ball);
                    } else {
                         console.warn("[Collision] Invalid ball object in ball-wall collision:", { labelA, objA, labelB, objB });
                    }
                }

                // TODO: Add other collision types (Laser vs Brick, Laser vs Paddle, FreezeRay vs Paddle)
                // These might need their own physics bodies if not already implemented.
            }
        });
    }

    // Reverted handler for Ball/Brick collisions - Uses indices and consistency checks
    handleBallBrickCollision(ball, _brickObjectFromEvent_IGNORED, bodyA, bodyB) {
        // 1. Identify the actual brick physics body involved in the collision
        const brickBody = (bodyA.label === 'brick') ? bodyA : (bodyB.label === 'brick') ? bodyB : null;
        if (!brickBody) {
            console.warn("[Collision vH] Ball-Brick collision detected, but couldn't identify brick body.", { bodyA_id: bodyA?.id, bodyB_id: bodyB?.id });
            return;
        }

        // 2. Get the associated data object using the gameObject reference
        const eventBrickData = brickBody.gameObject;
        // Check if we got data from the event body and it has indices
        if (!eventBrickData || typeof eventBrickData.c === 'undefined' || typeof eventBrickData.r === 'undefined') {
            console.warn("[Collision vH] Brick collision detected, but body/gameObject missing or lacks c/r indices.", { body_id: brickBody?.id });
            return;
        }

        // 3. Get the definitive brick object directly from the grid using indices from event data
        const c = eventBrickData.c;
        const r = eventBrickData.r;
        if (!this.bricks.grid[c] || !this.bricks.grid[c][r]) {
            console.warn(`[Collision vH] Indices [${c},${r}] from brick collision are out of bounds for grid.`);
            return; // Grid doesn't have this brick (shouldn't happen if indices are correct)
        }
        const brick = this.bricks.grid[c][r]; // Use the object directly from the grid

        // --- Perform checks using the definitive grid object 'brick' ---

        // 4. Check Status: Ensure the brick in the grid is actually active (status 1)
        if (brick.status !== 1) {
            // console.log(`[Collision vH] Ignoring collision with inactive brick [${c},${r}] (status: ${brick.status})`);
            return; // Already broken or inactive
        }

        // 5. Check Body Reference (Sanity Check): Ensure the body stored in the grid matches the body from the event
        if (brick.physicsBody !== brickBody) {
            console.warn(`[Collision vH] Mismatch between brick body in collision (ID: ${brickBody?.id}) and body stored in grid (ID: ${brick.physicsBody?.id}) for brick [${c},${r}]. Proceeding based on event body.`);
            // If they mismatch, it suggests a potential state inconsistency, but
            // the collision *did* happen with brickBody, so we should process it.
            // We will remove brickBody and nullify brick.physicsBody to try and sync state.
        }

        // --- If status check passes, proceed with breaking the brick ---
        console.log(`[Collision vH] Processing hit for brick [${c},${r}] (Status: ${brick.status}, Body ID: ${brickBody?.id})`);

        // Mark data as inactive FIRST
        brick.status = 0;

        // Play Sound
        audioManager.playSound('brickHit');

        // Award Score
        const scorerPaddle = ball.lastHitBy === 1 ? this.paddle1 : this.paddle2;
        if (scorerPaddle) {
            scorerPaddle.score += 5;
            console.log(`[DEBUG] Player ${ball.lastHitBy} scored 5 points for breaking a brick`);
            this.updateScoreDisplay();
        }

        // Handle Power-up Granting (using the grid 'brick' object)
        if (brick.powerUp) {
            if (scorerPaddle) {
                switch (brick.powerUp) {
                    case 'freezeRay':
                        scorerPaddle.activateFreezeRay();
                        audioManager.playSound('powerUp');
                        console.log(`Power-up: Freeze Ray granted to Player ${ball.lastHitBy}`);
                        break;
                    case 'laser':
                        scorerPaddle.activateLaser();
                        audioManager.playSound('powerUp');
                        console.log(`Power-up: Laser granted to Player ${ball.lastHitBy}`);
                        break;
                    case 'widePaddle':
                        scorerPaddle.makeWide(10);
                        audioManager.playSound('powerUp');
                        console.log(`Power-up: Wide Paddle granted to Player ${ball.lastHitBy}`);
                        break;
                }
                this.updatePowerUpIndicators();
            }
        }

        // Trigger Visual Effects (Particles) (using the grid 'brick' object)
        createBrickParticles(brick, this.particles);

        // Handle Fragmentation & Body Removal
        const brickPos = brickBody.position;
        const brickWidth = brick.width;     // Use dimensions from grid data object
        const brickHeight = brick.height;
        const numFragments = 4;
        const fragmentSize = Math.min(brickWidth, brickHeight) / 2;

        // Remove the specific brick body involved in the collision immediately
        const bodyIdToRemove = brickBody.id;
        Matter.World.remove(this.matterWorld, brickBody);
        console.log(`[Collision vH] Removed brick body ID: ${bodyIdToRemove} from world.`);

        // Clear the reference in the grid data object immediately after removal
        brick.physicsBody = null;

        // Create fragment bodies
        const fragmentOptions = {
            restitution: 0.4, friction: 0.6, frictionAir: 0.02,
            density: 0.002, label: 'brickFragment'
        };
        for (let i = 0; i < numFragments; i++) {
            const fragX = brickPos.x + (Math.random() - 0.5) * brickWidth * 0.5;
            const fragY = brickPos.y + (Math.random() - 0.5) * brickHeight * 0.5;
            const fragmentBody = Matter.Bodies.rectangle(fragX, fragY, fragmentSize, fragmentSize, fragmentOptions);
            const forceMagnitude = 0.0015;
            const angle = Math.random() * Math.PI * 2;
            const force = { x: Math.cos(angle) * forceMagnitude, y: Math.sin(angle) * forceMagnitude };
            Matter.Body.applyForce(fragmentBody, fragmentBody.position, force);
            Matter.World.add(this.matterWorld, fragmentBody);
            this.fragments.push(fragmentBody);
        }
        console.log(`[Collision vH] Created ${numFragments} fragments for broken brick.`);
    } // End handleBallBrickCollision

    handleBallPaddleCollision(ball, paddle) {
        // Double check validity
        if (!ball || !paddle || paddle.isAshes) return;

        console.log(`[Collision] Ball hit ${paddle.isTopPaddle ? 'Top' : 'Bottom'} Paddle`); // DEBUG

        // 1. Play Sound
        audioManager.playSound('paddleHit');

        // 2. Update Ball's Last Hitter
        ball.lastHitBy = paddle.isTopPaddle ? 2 : 1;

        // Optional: Apply slight impulse based on paddle velocity or impact point?
        // Matter.js handles the basic bounce, but we could add extra 'english'.
        // Example: Apply a small horizontal force based on paddle movement
        // const paddleVelX = paddle.physicsBody.velocity.x; // Need to track paddle velocity if static
        // Matter.Body.applyForce(ball.physicsBody, ball.physicsBody.position, { x: paddleVelX * 0.001, y: 0 });
    }

    handleBallWallCollision(ball) {
        // Double check validity
        if (!ball) return;

        // Only play sound, bounce is handled by Matter.js restitution
        audioManager.playSound('wallHit');
        console.log(`[Collision] Ball hit Wall`); // DEBUG
    }

    // TODO: Implement handleLaserBrickCollision
    // TODO: Implement handleLaserPaddleCollision
    // TODO: Implement handleFreezeRayPaddleCollision

    // --- Check Ball Out Of Bounds ---
    checkBallOutOfBounds() {
        const ballsToRemove = []; // In case reset fails or we change logic
        this.balls.forEach((ball, index) => {
            // Ensure ball and its physics body exist
            if (!ball || !ball.physicsBody) {
                console.warn(`[OOB Check] Skipping invalid ball at index ${index}`);
                return;
            }

            const posY = ball.physicsBody.position.y;
            let scored = false;
            let scorer = null;

            // Check top boundary crossing (Player 1 scores)
            if (posY - ball.radius < 0) { // Check edge, not center
                console.log("[Game] Ball crossed TOP boundary."); // DEBUG
                this.paddle1.score += 10;
                scorer = 1;
                scored = true;
            }
            // Check bottom boundary crossing (Player 2 scores)
            else if (posY + ball.radius > this.canvas.height) { // Check edge, not center
                console.log("[Game] Ball crossed BOTTOM boundary."); // DEBUG
                this.paddle2.score += 10;
                scorer = 2;
                scored = true;
            }

            if (scored) {
                this.updateScoreDisplay();
                audioManager.playSound('score'); // Play score sound
                // Reset the ball that went out
                // Ensure reset method exists and handles Matter.js body
                if (typeof ball.reset === 'function') {
                    ball.reset(ball.owner, this.canvas.width, this.canvas.height);
                } else {
                    console.error(`[OOB Check] Ball object missing reset method!`, ball);
                    // Consider removing the ball if reset fails catastrophically
                    // ballsToRemove.push(index);
                }
            }
        });

        // Optional: Handle ball removal if reset fails
        // for (let i = ballsToRemove.length - 1; i >= 0; i--) {
        //     const indexToRemove = ballsToRemove[i];
        //     if (this.balls[indexToRemove] && this.balls[indexToRemove].physicsBody) {
        //         Matter.World.remove(this.matterWorld, this.balls[indexToRemove].physicsBody);
        //     }
        //     this.balls.splice(indexToRemove, 1);
        // }
    }

    // --- Enforce Constant Ball Speed ---
    enforceConstantBallSpeed() {
        this.balls.forEach(ball => {
            if (!ball || !ball.physicsBody) return;

            const body = ball.physicsBody;
            const currentVelocity = body.velocity;
            const currentSpeed = Matter.Vector.magnitude(currentVelocity);

            // Target speed based on ball's baseSpeed, scaled for Matter's steps/sec
            const matterSpeedScale = 1 / (1000 / 60); // ~0.01667
            // Use the current baseSpeed (which was set to 150)
            const targetSpeed = ball.baseSpeed * matterSpeedScale;

            // Avoid division by zero or applying force to stationary balls
            if (currentSpeed < 0.001 || targetSpeed < 0.001) {
                // console.log(`[Speed Enforce] Skipping ball ${ball.owner}, speed too low: ${currentSpeed.toFixed(3)}`); // Optional Debug
                return;
            }

            // Calculate the scaling factor
            const scale = targetSpeed / currentSpeed;

            // Always apply the scaled velocity to strictly enforce constant speed
            Matter.Body.setVelocity(body, {
                x: currentVelocity.x * scale,
                y: currentVelocity.y * scale
            });
        });
    }


    // --- Drawing Fragments ---
    drawFragments() {
        // Use a less intrusive color for fragments, maybe grey or based on original brick?
        this.ctx.fillStyle = 'rgba(128, 128, 128, 0.8)'; // Semi-transparent grey
        this.fragments.forEach(fragment => {
            // Ensure fragment body still exists (might be cleaned up)
            if (!fragment) return;

            const pos = fragment.position;
            const angle = fragment.angle;
            // Assuming fragments are rectangles created in handleBallBrickCollision
            // We need the size used there (fragmentSize) - let's approximate or pass it somehow.
            // For now, approximate with a small fixed size.
            // TODO: Get actual fragment size if needed for accurate drawing
            const approxSize = 5; // Adjust as needed

            this.ctx.save(); // Save context state
            this.ctx.translate(pos.x, pos.y); // Move origin to fragment center
            this.ctx.rotate(angle); // Rotate context
            this.ctx.fillRect(-approxSize / 2, -approxSize / 2, approxSize, approxSize); // Draw centered rect
            this.ctx.restore(); // Restore context state
        });
    }

    // --- Deferred Removal (Not currently used, keep for potential future use) ---
    setupAfterUpdateListener() {
        // Use 'afterUpdate' event to process removals after the physics step
        Matter.Events.on(this.matterEngine, 'afterUpdate', this.processDeferredRemovals);
    }

    processDeferredRemovals() {
        // Process removals requested by LaserBeams
        this.laserBeams.forEach(beam => {
            if (beam.bodiesToRemove && beam.bodiesToRemove.length > 0) {
                beam.bodiesToRemove.forEach(body => {
                    // Double-check body exists in world before removing
                    if (Matter.Composite.get(this.matterWorld, body.id, 'body')) {
                         Matter.World.remove(this.matterWorld, body);
                         // console.log(`[Game] Deferred removal of body ID: ${body.id}`); // DEBUG
                    }
                });
                beam.bodiesToRemove = []; // Clear the list
            }
        });

        // Add similar logic here if other systems need deferred removal
        if (this.bricksToRemove.length > 0) {
            console.log(`[Deferred Remove] Processing ${this.bricksToRemove.length} brick bodies.`);
            this.bricksToRemove.forEach(body => {
                if (Matter.Composite.get(this.matterWorld, body.id, 'body')) {
                    Matter.World.remove(this.matterWorld, body);
                }
            });
            this.bricksToRemove = []; // Clear the list
        }
        // Add similar logic for other deferred removals if needed
    }

} // End of Game class

// Create and export a singleton instance
export const game = new Game();
