/**
 * End-to-end tests for power-up effects in Brick Breaker 2P
 * 
 * This test suite verifies that power-up effects work correctly in a real browser environment,
 * focusing on the freeze ray and laser beam effects on paddles.
 */

const puppeteer = require('puppeteer');

describe('Power-up Effects', () => {
  let page;
  const BASE_URL = global.__BASE_URL__; // Use global base URL

  // Create page before tests
  beforeAll(async () => {
    page = await global.__BROWSER__.newPage(); // Use global browser
    // Add console logging from browser to Node console for debugging
    page.on('console', (msg) => {
      console.log(`-> BROWSER: ${msg.text()}`);
    });
  });

  // Close page after tests
  afterAll(async () => {
    if (page) await page.close();
  });

  // Setup the game for each test
  beforeEach(async () => {
    // Navigate to the game
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle0' });
    
    // Wait for game controls to be ready
    await page.waitForSelector('#controlKeyboard', { visible: true });

    // Make sure keyboard control is selected (it's the default)
    await page.click('#controlKeyboard');
    
    // Click the "Two Players" button to start the game
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button.button'));
      const twoPlayersButton = buttons.find(button => button.textContent === 'Two Players');
      if (twoPlayersButton) {
        twoPlayersButton.click();
      } else {
        console.error('Two Players button not found for test setup');
      }
    });
    
    // Wait for game canvas to be ready and game object initialized
    await page.waitForSelector('#gameCanvas', { visible: true });
    // Wait until the game object, paddles, AND the needed activation methods are ready
    await page.waitForFunction(() => 
      window.game && 
      window.game.paddle1 && typeof window.game.paddle1.activateFreezeRay === 'function' && 
      window.game.paddle1 && typeof window.game.paddle1.activateLaser === 'function' &&
      window.game.paddle2 // Ensure paddle2 exists as we need to observe its state
    , { timeout: 10000 }); // Increased timeout slightly just in case init takes longer

    // Wait a moment for the game loop to potentially stabilize
    await page.waitForTimeout(500); 
  });

  it('should freeze the opponent paddle when Freeze Ray hits', async () => {
    // Manually position Paddle 2 to ensure a hit
    await page.evaluate(() => {
      const p1 = window.game.paddle1;
      const p2 = window.game.paddle2;
      if (p1 && p2) {
        p2.x = p1.x + p1.width / 2 - p2.width / 2; // Center align paddles
        console.log(`[Test Setup] Positioned Paddle 2 at x=${p2.x} to align with Paddle 1 at x=${p1.x}`);
      } else {
        console.error('[Test Setup] Paddles not found for positioning!');
      }
    });
    
    // Give paddle 1 the freeze ray power-up
    await page.evaluate(() => {
      window.game.paddle1.activateFreezeRay(); // Use correct method
      console.log('[Test] Activated Freeze Ray for Paddle 1');
    });

    // Shoot the freeze ray by simulating the Space key press
    await page.keyboard.press('Space'); 
    console.log('[Test] Pressed Space to shoot Freeze Ray');

    // Wait for the ray to hit and paddle 2 to be frozen
    console.log('[Test] Waiting for Paddle 2 to freeze...');
    const isPaddle2Frozen = await page.evaluate(async () => {
      // Check if game objects are ready
      if (!window.game || !window.game.paddle1 || !window.game.paddle2) {
        console.error('[Browser] Freeze Test Error: Game objects not ready');
        return false;
      }
      
      return new Promise((resolve) => {
        const interval = setInterval(() => {
          // Log current state every interval
          console.log(`[Browser Polling] Checking Freeze: paddle2.isFrozen = ${window.game.paddle2.isFrozen}`);
          if (window.game.paddle2.isFrozen) {
            console.log('[Browser] Paddle 2 is frozen!');
            clearInterval(interval);
            resolve(true);
          }
        }, 100); // Check every 100ms

        // Timeout after 5 seconds
        setTimeout(() => {
          // Log state just before timeout
          const p2State = window.game.paddle2 ? { x: window.game.paddle2.x, y: window.game.paddle2.y, isFrozen: window.game.paddle2.isFrozen } : 'not defined';
          const freezeRays = window.game.freezeRays ? window.game.freezeRays.map(r => ({ x: r.x, y: r.y, active: !r.isExpired() })) : '[]'; // Check if active
          console.error(`[Browser Timeout] Paddle 2 did not freeze. P2 State: ${JSON.stringify(p2State)}, Freeze Rays: ${JSON.stringify(freezeRays)}`);
          clearInterval(interval);
          resolve(false);
        }, 5000);
      });
    });
    
    expect(isPaddle2Frozen).toBe(true);
    console.log('[Test] Freeze Ray test completed.');
  }, 15000); // Increase test timeout

  it('should turn opponent paddle to ashes when Laser Beam hits', async () => {
    // Manually position Paddle 2 to ensure a hit
    await page.evaluate(() => {
      const p1 = window.game.paddle1;
      const p2 = window.game.paddle2;
      if (p1 && p2) {
        p2.x = p1.x + p1.width / 2 - p2.width / 2; // Center align paddles
        console.log(`[Test Setup] Positioned Paddle 2 at x=${p2.x} to align with Paddle 1 at x=${p1.x}`);
      } else {
        console.error('[Test Setup] Paddles not found for positioning!');
      }
    });

    // Give paddle 1 the laser power-up
    await page.evaluate(() => {
      window.game.paddle1.activateLaser(); // Use correct method
      console.log('[Test] Activated Laser for Paddle 1');
    });

    // Shoot the laser by simulating the Space key press
    await page.keyboard.press('Space');
    console.log('[Test] Pressed Space to shoot Laser');

    // Wait for the laser to hit and paddle 2 to turn to ashes
    console.log('[Test] Waiting for Paddle 2 to turn to ashes...');
    const isPaddle2Ashes = await page.evaluate(async () => {
      // Check if game objects are ready
      if (!window.game || !window.game.paddle1 || !window.game.paddle2) {
        console.error('[Browser] Laser Test Error: Game objects not ready');
        return false;
      }
      
      return new Promise((resolve) => {
        const interval = setInterval(() => {
          // Log current state every interval
          console.log(`[Browser Polling] Checking Ashes: paddle2.isAshes = ${window.game.paddle2.isAshes}`);
          if (window.game.paddle2.isAshes) {
            console.log('[Browser] Paddle 2 turned to ashes!');
            clearInterval(interval);
            resolve(true);
          }
        }, 100); // Check every 100ms

        // Timeout after 5 seconds
        setTimeout(() => {
          // Log state just before timeout
          const p2State = window.game.paddle2 ? { x: window.game.paddle2.x, y: window.game.paddle2.y, isAshes: window.game.paddle2.isAshes } : 'not defined';
          const laserBeams = window.game.laserBeams ? window.game.laserBeams.map(l => ({ x: l.x, y: l.y, active: !l.isExpired() })) : '[]'; // Check if active
          console.error(`[Browser Timeout] Paddle 2 did not turn to ashes. P2 State: ${JSON.stringify(p2State)}, Laser Beams: ${JSON.stringify(laserBeams)}`);
          clearInterval(interval);
          resolve(false);
        }, 5000);
      });
    });

    expect(isPaddle2Ashes).toBe(true);
    console.log('[Test] Laser Beam test completed.');
  }, 15000); // Increase test timeout
});
