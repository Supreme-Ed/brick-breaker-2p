// @ts-check
const { test, expect } = require('@playwright/test');

// Base URL is set in playwright.config.js
const mainMenuUrl = '/'; // index.html
const gamePagePath = '/game.html'; // Game page

test.describe('Visual Gameplay Checks', () => {

  test('should display the main menu elements', async ({ page }) => {
    await page.goto(mainMenuUrl);
    console.log('Navigated to main menu.');

    const startScreen = page.locator('#startScreen');
    const start1PButton = page.locator('button:has-text("Single Player")'); // More specific selector
    const start2PButton = page.locator('button:has-text("Two Players")');
    const startAIButton = page.locator('button:has-text("AI vs. AI")');

    await expect(startScreen).toBeVisible();
    console.log('Start screen is visible.');
    await expect(start1PButton).toBeVisible();
    console.log('Start 1P button is visible.');
    await expect(start2PButton).toBeVisible();
    console.log('Start 2P button is visible.');
    await expect(startAIButton).toBeVisible();
    console.log('Start AI button is visible.');
  });

  test('clicking Start AI Button should navigate and display game elements', async ({ page }) => {
    // Increase default timeout for this test
    test.setTimeout(30000);
    await page.goto(mainMenuUrl);
    console.log('Navigated to main menu.');

    const startAIButton = page.locator('button:has-text("AI vs. AI")');
    await startAIButton.click();
    console.log('Clicked Start AI button.');

    // Wait for navigation to the game page to complete
    // We expect the URL to change and contain the game page path and mode parameter
    await page.waitForURL(url => url.pathname === gamePagePath && url.search.includes('mode=3'), { timeout: 15000 });
    console.log(`Navigated to ${page.url()}`);

    // Now check for elements on the game page
    const canvas = page.locator('#gameCanvas');
    const score1 = page.locator('#score1');
    const score2 = page.locator('#score2');

    // Wait for canvas and game object to be ready on the new page
    await expect(canvas).toBeVisible({ timeout: 20000 }); // Increased timeout further
    console.log('Game canvas is visible.');
    // First wait for game to be initialized
    await page.waitForFunction(() => window.game && window.game.initialized, null, { timeout: 20000 });
    console.log('Game is initialized.');

    // Then wait for game state to be 'playing'
    await page.waitForFunction(() => {
      try {
        return window.game && window.game.gameState && window.game.gameState.state === 'playing';
      } catch (e) {
        console.error('Error checking game state:', e);
        return false;
      }
    }, null, { timeout: 20000 });
    console.log('Game state is playing.');

    // Check scores by evaluating game state, not by looking for non-existent HTML elements
    const score1Value = await page.evaluate(() => window.game.paddle1.score);
    const score2Value = await page.evaluate(() => window.game.paddle2.score);

    expect(score1Value).toBe(0);
    console.log('Score 1 value is 0.');
    expect(score2Value).toBe(0);
    console.log('Score 2 value is 0.');

    // Check that menu buttons are gone (These might be hidden or removed, adjust selector if needed)
    // Let's assume the buttons from index.html are just not present here.
    const startAIButtonMainMenu = page.locator('button:has-text("AI vs. AI")');
    await expect(startAIButtonMainMenu).toBeHidden(); // It shouldn't exist on the game page
    console.log('Main menu Start AI button is hidden on game page.');

    // Optionally, check if the game state indicates running
    const isGameRunning = await page.evaluate(() => window.game.gameState.state === 'playing');
    expect(isGameRunning).toBe(true);
    console.log('Game state is running.');
  });

  // Add similar tests for starting 1P and 2P modes if needed
});
