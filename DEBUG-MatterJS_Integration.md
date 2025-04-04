# Debug Log: Matter.js Physics Integration

This log tracks the steps taken to integrate the Matter.js physics engine into the Brick Breaker 2P game and the results of testing.

## Integration Steps Taken (Phase 1 & Initial Phase 2)

1.  **Project Setup Confirmed:** Identified the project uses npm and Vite.
2.  **Dependency Added:** Installed `matter-js` via `npm install matter-js`.
3.  **Engine Initialization (`js/core/game.js`):**
    *   Imported `Matter`.
    *   Created `Matter.Engine` and `Matter.World` instances in the `Game` constructor.
    *   Disabled gravity (`engine.world.gravity.y = 0`).
    *   Stored engine and world references (`this.matterEngine`, `this.matterWorld`).
4.  **Static Walls Added (`js/core/game.js`):**
    *   Created 4 static rectangular `Matter.Bodies` for the play area boundaries.
    *   Added walls to the `matterWorld`.
    *   Set `restitution: 1.0`, `friction: 0`, and `label: 'wall'`.
5.  **Ball Integration (`js/entities/ball.js`):**
    *   Imported `Matter`.
    *   Updated constructor to accept `matterWorld`.
    *   Created a `Matter.Bodies.circle` for the ball with physics properties (`restitution`, `friction`, `frictionAir`, `label`, `gameObject`).
    *   Added the body to `matterWorld`.
    *   Removed manual movement/collision logic from `Ball.update`.
    *   Updated `Ball.draw` to use `physicsBody.position`.
    *   Updated `Ball.reset` to use `Matter.Body.setPosition` and `Matter.Body.setVelocity`.
    *   Updated `createBall` factory function to pass `matterWorld` and set initial velocity. Fixed missing `matterWorld` parameter in definition. Adjusted friction/airFriction to 0 and restitution to 1.0. Reduced `baseSpeed` to 150, then 60, then back to 150, then to 75.
6.  **Paddle Integration (`js/entities/paddle_entity.js`):**
    *   Imported `Matter`.
    *   Updated constructor to accept `matterWorld`.
    *   Created a static (`isStatic: true`) `Matter.Bodies.rectangle` for the paddle with physics properties (`label`, `gameObject`). Set restitution to 1.0.
    *   Added the body to `matterWorld`.
    *   Updated movement methods (`updateKeyboardMovement`, `updateTargetMovement`, `updateAI`) to calculate target X and use `Matter.Body.setPosition` after checking bounds (`checkBounds` method added). Fixed mouse lag by setting position directly. Fixed missing `deltaTime` in `updateTargetMovement`.
    *   Updated `Paddle.draw` to use `physicsBody.position`.
    *   Updated `createPaddle` factory function to pass `matterWorld`.
7.  **Brick Integration (`js/entities/brick.js`):**
    *   Imported `Matter`.
    *   Updated `BrickManager` constructor to accept and store `matterWorld`.
    *   Added `physicsBody: null`, `c`, `r` properties to the brick data structure.
    *   Modified `initGrid` to clear old physics bodies from `matterWorld`.
    *   Modified `updateBrickPositionsAndBodies` (renamed from `updateBrickPositions`) to create static `Matter.Bodies.rectangle` for active bricks, add `gameObject` reference (changed from copy to direct reference), and add them to `matterWorld`. Also handles removing old bodies on pattern change. Added logging. Restored missing `Matter.World.add` call. Removed duplicate `Matter.World.add` call.
    *   Removed the old `checkCollision` method.
    *   Updated `createBrickManager` factory function to accept and pass `matterWorld`.
8.  **Game Object Instantiation (`js/core/game.js`):**
    *   Updated calls to `createBall`, `createPaddle`, and `createBrickManager` in the `Game` constructor to pass `this.matterWorld`.
9.  **Physics System Refactor (`js/core/physics.js`):**
    *   Removed collision detection methods (`checkWallCollision`, `checkPaddleCollision`, `checkBoundaryCollision`).
    *   Removed `resetBall` and `handlePowerUp`.
    *   Simplified `updateBalls` (effectively removed its core logic).
    *   Simplified main `update` method, keeping projectile/particle updates and `checkGameEvents`.
10. **Game Loop Update (`js/core/game.js`):**
    *   Added `Matter.Engine.update(this.matterEngine, deltaTime * 1000)` call in `Game.update`.
    *   Removed the call to the old `this.physics.update(...)`.
    *   Verified that entity `draw` methods use `physicsBody.position` (handled in steps 5 & 6).
11. **Collision Handling (`js/core/game.js`):**
    *   Added `setupCollisionListener` method, called in the constructor.
    *   Added listener for `collisionStart` event.
    *   Implemented handler methods:
        *   `handleBallBrickCollision`: Plays sound, awards score, handles power-ups, creates particles, sets brick status to 0, **implements basic fragmentation (creates fragment bodies, adds to world, applies force)**. Added guard clause to prevent processing inactive bricks. Refactored multiple times to debug body reference issues. Fixed `ball is not defined` error. Reverted handler logic multiple times.
        *   `handleBallPaddleCollision`: Plays sound, updates `ball.lastHitBy`.
        *   `handleBallWallCollision`: Plays sound.
12. **Fragment Tracking & Drawing (`js/core/game.js`):**
    *   Added `this.fragments = []` array in constructor and `resetGame`.
    *   Added fragments to `this.fragments` in `handleBallBrickCollision`.
    *   Added `drawFragments` method to draw tracked fragments.
    *   Added call to `this.drawFragments()` in `Game.draw`.
13. **Fragment Cleanup (`js/core/game.js`):**
    *   Added logic within `cleanupExpiredEntities` to remove fragments from the `fragments` array and the `matterWorld` based on lifetime or position. Added limit for max fragments.
14. **Ball Out-of-Bounds (`js/core/game.js`):**
    *   Added `checkBallOutOfBounds` method.
    *   Added call to `this.checkBallOutOfBounds()` in `Game.update` after `Matter.Engine.update`.
    *   Method checks ball Y position, awards score, updates UI, plays sound, and calls `ball.reset()`.
15. **Constant Ball Speed (`js/core/game.js`):**
    *   Added `enforceConstantBallSpeed` method.
    *   Added call to `this.enforceConstantBallSpeed()` in `Game.update`.
    *   Method resets ball velocity magnitude after physics update. Updated to always apply scale. Removed again after user feedback. **Re-added after further feedback.** Fixed missing method definition error.
16. **Debug FreezeRay Instantiation (`js/core/game.js`):** Fixed missing `canvasHeight` argument in `new FreezeRay()`.
17. **Debug Paddle Movement (`js/entities/paddle_entity.js`):** Fixed missing `deltaTime` argument passed to `updateTargetMovement`.
18. **Debug Pause Function (`js/core/game.js`):** Corrected call in `togglePause` to use `this.gameState.togglePause()`.

## Testing Plan & Results

### Test 1: Basic Game Load & Rendering
*   **Action:** Run `npm run dev`. Open the game in the browser.
*   **Expected:** Game loads without console errors related to Matter.js setup. Paddles, balls, and bricks are rendered in their initial positions.
*   **Result:** **PASS** (after fixing `matterWorld`, `deltaTime`, `enforceConstantBallSpeed` definition errors). Pause error fixed.

### Test 2: Paddle Movement
*   **Action:** Control paddles using keyboard/mouse/touch as configured.
*   **Expected:** Paddles move smoothly and stay within bounds. No unexpected physics interactions affecting paddles.
*   **Result:** **PASS.** Keyboard movement okay. Mouse movement lag fixed.

### Test 3: Ball Movement & Wall Collisions
*   **Action:** Observe ball movement.
*   **Expected:** Ball moves and bounces off side walls realistically based on Matter.js physics (`restitution: 1.0` on walls). Wall hit sound plays.
*   **Result:** **PASS.** Log shows `[Collision] Ball hit Wall` and wall hit sound plays.

### Test 4: Ball-Paddle Collisions
*   **Action:** Let the ball hit the paddles.
*   **Expected:** Ball bounces off paddles. Bounce angle/speed should feel reasonably physical (influenced by `restitution` on ball/paddle bodies). Paddle hit sound plays. `ball.lastHitBy` should update correctly (check ball color change).
*   **Result:** **PASS.** Ball speed is now consistent after re-adding enforcement and adjusting base speed. Paddle bounce seems okay.

### Test 5: Ball-Brick Collisions & Fragmentation
*   **Action:** Let the ball hit bricks.
*   **Expected:**
    *   Brick hit sound plays.
    *   Score updates correctly for the player who last hit the ball.
    *   Brick disappears visually.
    *   Brick particles are created (existing effect).
    *   Several small grey fragment rectangles appear near the broken brick's location.
    *   Fragments move outwards with physics applied (affected by gravity=0, friction, air friction).
    *   Fragments disappear after a short time or if they go off-screen.
    *   Power-up bricks grant power-ups correctly upon breaking.
*   **Result:** **PASS.** Bricks break and fragment. Ghost collision issue resolved after multiple handler revisions and fixing duplicate `World.add` call.

### Test 6: Ball Out-of-Bounds (Scoring)
*   **Action:** Let the ball go past the top or bottom edge.
*   **Expected:**
    *   Correct player's score increases by 10.
    *   Score sound plays.
    *   Ball resets to its starting position and velocity for the owner.
*   **Result:** **PARTIAL PASS.** Score updates, ball resets. Log shows `Sound buffer 'score' not found or not loaded. Playing default beep.`

### Test 7: Level Clear
*   **Action:** Break all bricks.
*   **Expected:**
    *   Bonus points awarded.
    *   Level complete sound plays.
    *   Brick grid resets with the next pattern.
*   **Result:** **NOT TESTED** (but likely works now that bricks break).

### Test 8: Power-up Functionality (Post-Collision)
*   **Action:** Collect and use Laser/Freeze Ray power-ups.
*   **Expected:** Power-ups activate and function as before (projectiles fire, paddles freeze/unfreeze). Note: Projectile collisions are *not* yet handled by Matter.js.
*   **Result:** **PARTIAL PASS.** FreezeRay instantiation fixed, pause fixed. Should be fully testable now.

**Other Issues:**
*   ~~`Uncaught TypeError: this.gameState.pauseGame is not a function` when trying to pause.~~ **FIXED.**
*   `matter-js: Matter.Engine.update: delta argument is recommended to be less than or equal to 16.667 ms.` warning (Low priority).
*   **NEW:** Wide paddle power-up doesn't increase the physics collision boundary, only the visual size.

---
*(Add more specific tests or notes as needed during debugging)*