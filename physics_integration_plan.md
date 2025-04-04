# Plan: Integrating Matter.js for Enhanced Physics

This document outlines the steps to integrate the Matter.js physics library into the Brick Breaker 2P game to enable more realistic physics effects, specifically focusing on improved bouncing and brick fragmentation.

**Recommended Library:** Matter.js (Good balance of features and ease of use for 2D web games).

## Phase 1: Core Integration

1.  **Add Matter.js Library:**
    *   Determine the project setup (e.g., using ES modules, npm, or plain HTML/JS).
    *   Add Matter.js:
        *   If using npm: `npm install matter-js` (or `yarn add matter-js`) and import it where needed (`import Matter from 'matter-js';`).
        *   If plain JS: Download `matter.min.js` from the official site/CDN and include it via `<script src="path/to/matter.min.js"></script>` in `game.html` before your game scripts.

2.  **Initialize Physics Engine:**
    *   In the main game initialization logic (e.g., `js/main.js` or `js/core/game.js`):
        *   Create the Matter.js engine: `const engine = Matter.Engine.create();`
        *   Get a reference to the world: `const world = engine.world;`
        *   Disable or adjust gravity as needed for a top-down view: `engine.world.gravity.y = 0;`
        *   Store references to `engine` and `world` where accessible by the game loop and entity creation logic.

3.  **Create Physics Bodies for Game Entities:**
    *   **Walls/Boundaries:** Create static rectangular bodies representing the play area boundaries (left, right, top, bottom - potentially excluding scoring zones initially) and add them to the `world`.
        ```javascript
        // Example boundaries (adjust dimensions/positions)
        const wallOptions = { isStatic: true, restitution: 1.0, friction: 0 };
        Matter.World.add(world, [
            Matter.Bodies.rectangle(canvasWidth / 2, -10, canvasWidth, 20, wallOptions), // Top wall (adjust if score zone)
            Matter.Bodies.rectangle(canvasWidth / 2, canvasHeight + 10, canvasWidth, 20, wallOptions), // Bottom wall (adjust if score zone)
            Matter.Bodies.rectangle(-10, canvasHeight / 2, 20, canvasHeight, wallOptions), // Left wall
            Matter.Bodies.rectangle(canvasWidth + 10, canvasHeight / 2, 20, canvasHeight, wallOptions) // Right wall
        ]);
        ```
    *   **Ball (`js/entities/ball.js`):**
        *   In the constructor or an initialization method, create a `Matter.Bodies.circle` corresponding to the ball's position and radius.
        *   Set physics properties like `restitution` (bounciness), `friction`, `frictionAir`.
        *   Add the body to the `world`: `Matter.World.add(world, ballBody);`
        *   Store a reference to the `ballBody` on the `Ball` instance (e.g., `this.physicsBody = ballBody;`).
        *   Add a label or reference back to the game object for easy identification in collision events: `ballBody.gameObject = this;`
    *   **Paddles (`js/entities/paddle_entity.js`):**
        *   Similar to the ball, create a `Matter.Bodies.rectangle` in the constructor.
        *   Make the paddle body `isStatic: true` initially if it's moved manually via input, *or* kinematic (`isStatic: false, isSensor: false` but move using `Matter.Body.setPosition`) if you want physics interactions to move it slightly. Manual positioning is usually simpler for paddles.
        *   Set physics properties (`restitution`, `friction`).
        *   Add to the `world` and store the reference (`this.physicsBody`).
        *   Add a label/reference: `paddleBody.gameObject = this;`
    *   **Bricks (`js/entities/brick_manager.js` or `js/entities/brick.js`):**
        *   When creating each brick, create a corresponding `Matter.Bodies.rectangle`.
        *   Make brick bodies static (`isStatic: true`) as they don't move until broken.
        *   Set properties (`restitution`, `friction`).
        *   Add to the `world` and store the reference (`this.physicsBody`).
        *   Add a label/reference: `brickBody.gameObject = this;`

4.  **Refactor `PhysicsSystem.js`:**
    *   Remove methods related to direct collision checks: `checkWallCollision`, `checkPaddleCollision`, `checkBoundaryCollision`.
    *   Remove the call to `bricks.checkCollision`.
    *   The `updateBalls` method will no longer need to calculate collisions directly. Its role will shift to handling *results* of collisions detected by Matter.js events (see Step 6).
    *   Keep logic related to power-ups, scoring, projectile updates (unless projectiles also become physics bodies), and particle updates for now.

5.  **Update Game Loop:**
    *   In the main game loop (`Game.update`):
        *   Call `Matter.Engine.update(engine, deltaTime)` *before* rendering. This advances the simulation.
        *   Modify the `Renderer`: Instead of drawing entities at their stored `x`, `y`, draw them at `entity.physicsBody.position.x` and `entity.physicsBody.position.y`. Also, use `entity.physicsBody.angle` if rotation is needed.
        *   If paddles are moved manually (not via physics forces), update their corresponding `Matter.Body` position *before* the `Matter.Engine.update` call using `Matter.Body.setPosition(paddleBody, { x: newX, y: paddleBody.position.y });`.

6.  **Implement Collision Event Handling:**
    *   Set up a listener for Matter.js collision events, likely during initialization:
        ```javascript
        Matter.Events.on(engine, 'collisionStart', (event) => {
            const pairs = event.pairs;
            for (let i = 0; i < pairs.length; i++) {
                const pair = pairs[i];
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;

                // Identify the game objects involved
                const objA = bodyA.gameObject;
                const objB = bodyB.gameObject;

                // --- Add Collision Logic Here ---
                // Example: Ball hitting a Brick
                if ((objA instanceof Ball && objB instanceof Brick) || (objA instanceof Brick && objB instanceof Ball)) {
                    const ball = (objA instanceof Ball) ? objA : objB;
                    const brick = (objA instanceof Brick) ? objA : objB;
                    // Trigger brick breaking logic (Phase 2)
                    // Trigger scoring logic
                    // Play sound
                    // Handle power-ups if brick had one
                }

                // Example: Ball hitting a Paddle
                if ((objA instanceof Ball && objB instanceof PaddleEntity) || (objA instanceof PaddleEntity && objB instanceof Ball)) {
                    const ball = (objA instanceof Ball) ? objA : objB;
                    const paddle = (objA instanceof PaddleEntity) ? objA : objB;
                    // Update ball.lastHitBy
                    // Play sound
                    // Apply paddle angle influence (optional, Matter handles basic bounce)
                }

                // Example: Ball hitting a Wall (if walls are bodies with gameObjects)
                // Or handle boundary logic separately if using sensors/events

                // Add other collision pairs (projectiles, etc.)
            }
        });
        ```
    *   Transfer the logic for scoring, sound playing, power-up handling, and `ball.lastHitBy` updates into these collision event handlers based on the types of objects colliding.

## Phase 2: Implement Specific Effects

7.  **Realistic Bouncing:**
    *   Experiment with the `restitution` property (0 to 1+) on the ball, paddle, brick, and wall bodies. Higher values mean more bounce.
    *   Adjust `friction` (0 to 1+) and `frictionAir` (0 to 1, resistance as object moves) properties on the ball body to fine-tune movement.

8.  **Brick Fragmentation:**
    *   In the ball-brick collision handler (Step 6):
        *   Get the brick's position: `brick.physicsBody.position`.
        *   Remove the original brick's body from the world: `Matter.World.remove(world, brick.physicsBody);`
        *   Remove the `Brick` object from your game's management (e.g., `brickManager.removeBrick(brick)`).
        *   **Create Fragments:** Generate several small `Matter.Bodies.rectangle` or `Matter.Bodies.polygon` bodies at the brick's position.
            ```javascript
            // Example: Create 4 small square fragments
            const fragments = [];
            const fragmentSize = brick.width / 4;
            for (let i = 0; i < 4; i++) {
                const fragX = brick.physicsBody.position.x + (Math.random() - 0.5) * brick.width / 2;
                const fragY = brick.physicsBody.position.y + (Math.random() - 0.5) * brick.height / 2;
                const fragmentBody = Matter.Bodies.rectangle(fragX, fragY, fragmentSize, fragmentSize, {
                    restitution: 0.5, // Less bouncy than ball
                    friction: 0.5
                });
                // Add label for potential cleanup later
                fragmentBody.label = 'brickFragment';
                fragments.push(fragmentBody);
            }
            Matter.World.add(world, fragments);
            ```
        *   **Apply Force:** Give fragments an initial velocity/force outwards.
            ```javascript
            fragments.forEach(frag => {
                const forceMagnitude = 0.01; // Adjust as needed
                const angle = Math.random() * Math.PI * 2;
                const force = { x: Math.cos(angle) * forceMagnitude, y: Math.sin(angle) * forceMagnitude };
                Matter.Body.applyForce(frag, frag.position, force);
            });
            ```
        *   **Rendering:** Update the `Renderer` to draw these fragments based on their `Matter.Body` positions. You might need a simple array to hold active fragment bodies.
        *   **Cleanup:** Implement a mechanism to remove fragment bodies after a timeout or when they go off-screen to prevent performance degradation. This could involve checking their position in the game loop or using a timer. You could check bodies with `label === 'brickFragment'`.

## Conceptual Flow Diagram

```mermaid
graph TD
    A[Game Loop Start] --> B(Process User Input);
    B --> B1(Update Paddle Position - Manual);
    B1 --> B2(Set Matter.Body Position for Paddle);
    B2 --> C(Matter.Engine.update);
    C --> D[Physics Simulation (Movement & Collision Detection)];
    D --> E{Collision Events Fired?};
    E -- Yes --> F[Handle Collision Events (Game Logic: Score, Sound, Break Brick, etc.)];
    E -- No --> G;
    F --> G[Update Game State (e.g., remove broken brick object)];
    G --> H[Renderer: Draw Entities based on Matter Body Positions/Angles];
    H --> A;

    subgraph Matter.js Engine
        D
        E
    end

    subgraph Your Game Code
        A
        B
        B1
        B2
        F
        G
        H
    end
```

## Next Steps

*   Review this plan for clarity and completeness.
*   Proceed with Phase 1 implementation.