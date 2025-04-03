// @ts-check
const { test, expect } = require('@playwright/test');

const mainMenuUrl = '/';
const gamePagePath = '/game.html';
const twoPlayerGameUrl = `${gamePagePath}?mode=2`; // Start in 2-Player mode

test.describe('Power-up Effects', () => {

  // Increase the default timeout for these tests as they involve waiting for effects
  test.slow(); 

  // Setup: Start 2-Player game before each test
  test.beforeEach(async ({ page }) => {
    await page.goto(twoPlayerGameUrl, { timeout: 15000 });
    console.log('Navigated to main menu.');

    // Click the "Two Players" button
    const start2PButton = page.locator('button:has-text("Two Players")');
    await start2PButton.click();
    console.log('Clicked Start 2P button.');

    // Wait for navigation to the 2-Player game page
    await page.waitForURL(url => url.pathname === gamePagePath && url.search.includes('mode=2'));
    console.log(`Navigated to ${page.url()}`);

    // Wait for canvas to be visible
    const canvas = page.locator('#gameCanvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });
    console.log('Game canvas is visible.');

    // Check for keyboard events
    await page.keyboard.down('ArrowRight');
    await page.waitForFunction(() => {
      const paddle = window.game.paddle1;
      return paddle.x > paddle.startX;
    });
    console.log('Paddle 1 moved right.');

    // Verify that keyboard controls work for both paddles
    await page.keyboard.down('d');
    await page.waitForFunction(() => {
      const paddle = window.game.paddle2;
      return paddle.x > paddle.startX;
    });
    console.log('Paddle 2 moved right.');

    // Wait for game to initialize
    await page.waitForFunction(() => window.game && window.game.initialized, null, { timeout: 20000 }); 

    // Wait for the game state to be 'playing' and paddles to be ready
    // Ignore static analysis errors for window.game
    await page.waitForFunction(() => 
        window.game && 
        window.game.gameState && 
        window.game.gameState.state === 'playing' &&
        window.game.paddle1 && 
        window.game.paddle2 &&
        typeof window.game.paddle1.activateFreezeRay === 'function' && // Check if method exists
        typeof window.game.paddle1.activateLaser === 'function' // Check if method exists
    , null, { timeout: 15000 }); 
    console.log('Game state is playing and paddles/methods ready.');

    // Short delay for stabilization if needed
    await page.waitForTimeout(500); 
  });

  test('Freeze Ray power-up should temporarily disable opponent paddle', async ({ page }) => {
    // Increase default timeout for this test
    test.setTimeout(30000);
    // Manually position Paddle 2 to ensure a hit
    await page.evaluate(() => {
      const p1 = window.game.paddle1;
      const p2 = window.game.paddle2;
      if (p1 && p2) {
        p2.x = p1.x + p1.width / 2 - p2.width / 2; // Center align paddles
        console.log(`[Test Setup] Positioned Paddle 2 at x=${p2.x} to align with Paddle 1 at x=${p1.x}`);
      }
    });
    
    // Give paddle 1 the freeze ray power-up
    await page.evaluate(() => {
      window.game.paddle1.activateFreezeRay(); 
      console.log('[Test] Activated Freeze Ray for Paddle 1');
    });

    console.log('[Test] Checking if Paddle 2 freezes...');

    // Directly call the game method responsible for shooting the ray
    await page.evaluate(() => {
      if (window.game && typeof window.game.shootFreezeRay === 'function') {
        console.log('[Test] Directly calling game.shootFreezeRay(1).');
        window.game.shootFreezeRay(1); // Player 1 shoots
      } else {
        console.error('[Test] Cannot call game.shootFreezeRay: game or method not available.');
      }
    });

    // Wait for Paddle 2 to become frozen
    const isPaddle2Frozen = await page.evaluate(async () => {
      return new Promise<boolean>((resolve) => {
        const checkInterval = 50; // ms
        const timeoutDuration = 8000; // ms
        let elapsedTime = 0;

        const interval = setInterval(() => {
          if (window.game?.paddle2?.isFrozen) {
            console.log('[Browser] Paddle 2 is frozen!');
            clearInterval(interval);
            resolve(true);
          } else {
            elapsedTime += checkInterval;
            if (elapsedTime >= timeoutDuration) {
              const p2State = window.game?.paddle2 ? JSON.stringify({ x: window.game.paddle2.x, y: window.game.paddle2.y, isFrozen: window.game.paddle2.isFrozen }) : 'not defined';
              const freezeRays = window.game?.freezeRays ? JSON.stringify(window.game.freezeRays.map(r => ({ x: r.x, y: r.y, active: !r.isExpired() }))) : '[]';
              console.error(`[Browser Timeout] Paddle 2 did not freeze. P2 State: ${p2State}, Freeze Rays: ${freezeRays}`);
              clearInterval(interval);
              resolve(false);
            }
          }
        }, checkInterval);
      });
    });
    
    expect(isPaddle2Frozen).toBe(true);
    console.log('[Test] Freeze Ray test completed.');
  });

  test('should turn opponent paddle to ashes when Laser Beam hits', async ({ page }) => {
    // Manually position Paddle 2 to ensure a hit
    await page.evaluate(() => {
      const p1 = window.game.paddle1;
      const p2 = window.game.paddle2;
      if (p1 && p2) {
        p2.x = p1.x + p1.width / 2 - p2.width / 2; // Center align paddles
        console.log(`[Test Setup] Positioned Paddle 2 at x=${p2.x} to align with Paddle 1 at x=${p1.x}`);
      }
    });

    // Give paddle 1 the laser power-up
    await page.evaluate(() => {
      window.game.paddle1.activateLaser(); 
      console.log('[Test] Activated Laser for Paddle 1');
    });

    console.log('[Test] Checking if Paddle 2 turns to ashes...');

    // Directly call the game method responsible for shooting the laser
    await page.evaluate(() => {
      if (window.game && typeof window.game.shootLaser === 'function') {
        console.log('[Test] Directly calling game.shootLaser(1).');
        window.game.shootLaser(1); // Player 1 shoots
      } else {
        console.error('[Test] Cannot call game.shootLaser: game or method not available.');
      }
    });

    // Wait for Paddle 2 to turn to ashes
    const isPaddle2Ashes = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const checkInterval = 50; // ms
        const timeoutDuration = 8000; // ms
        let elapsedTime = 0;

        const interval = setInterval(() => {
          if (window.game?.paddle2?.isAshes) {
            console.log('[Browser] Paddle 2 turned to ashes!');
            clearInterval(interval);
            resolve(true);
          } else {
            elapsedTime += checkInterval;
            if (elapsedTime >= timeoutDuration) {
              const p2State = window.game?.paddle2 ? JSON.stringify({ x: window.game.paddle2.x, y: window.game.paddle2.y, isAshes: window.game.paddle2.isAshes }) : 'not defined';
              const laserBeams = window.game?.laserBeams ? JSON.stringify(window.game.laserBeams.map(l => ({ x: l.x, y: l.y, active: !l.isExpired() }))) : '[]';
              console.error(`[Browser Timeout] Paddle 2 did not turn to ashes. P2 State: ${p2State}, Laser Beams: ${laserBeams}`);
              clearInterval(interval);
              resolve(false);
            }
          }
        }, checkInterval);
      });
    });

    expect(isPaddle2Ashes).toBe(true);
    console.log('[Test] Laser Beam test completed.');
  });
});
