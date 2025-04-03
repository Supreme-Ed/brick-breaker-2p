// @ts-check
const { test, expect } = require('@playwright/test');

// Base URL is set in playwright.config.js
const mainMenuUrl = '/'; // index.html
const gamePagePath = '/brick-breaker.html'; // Game page

test.describe('AI Gameplay Checks', () => {

  test('should display the AI vs AI button on the main menu', async ({ page }) => {
    await page.goto(mainMenuUrl);
    console.log('Navigated to main menu.');

    const startAIButton = page.locator('button:has-text("AI vs. AI")');

    await expect(startAIButton).toBeVisible();
    console.log('Start AI button is visible.');
  });

  test('clicking Start AI Button should start AI vs AI mode correctly', async ({ page }) => {
    await page.goto(mainMenuUrl);
    console.log('Navigated to main menu.');

    const startAIButton = page.locator('button:has-text("AI vs. AI")');
    await startAIButton.click();
    console.log('Clicked Start AI button.');

    // Wait for navigation to the game page with mode 3
    await page.waitForURL(url => url.pathname === gamePagePath && url.search.includes('mode=3'));
    console.log(`Navigated to ${page.url()}`);

    // Wait for canvas to be visible
    const canvas = page.locator('#gameCanvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });
    console.log('Game canvas is visible.');

    // First wait for game to be initialized
    await page.waitForFunction(() => window.game && window.game.initialized, null, { timeout: 15000 });
    console.log('Game is initialized.');

    // Then wait for game state to be 'playing'
    await page.waitForFunction(() => window.game.gameState && window.game.gameState.state === 'playing', null, { timeout: 15000 });
    console.log('Game state is playing.');

    // Verify the game mode is actually AI vs AI (mode 3)
    const currentGameMode = await page.evaluate(() => window.game.gameState.gameMode);
    expect(currentGameMode).toBe(3);
    console.log(`Current game mode verified as: ${currentGameMode}`);

    // Verify initial scores are 0
    const score1Value = await page.evaluate(() => window.game.paddle1.score);
    const score2Value = await page.evaluate(() => window.game.paddle2.score);
    expect(score1Value).toBe(0);
    expect(score2Value).toBe(0);
    console.log('Initial scores verified as 0.');
  });

  // We could add more tests here to observe AI behavior over time,
  // e.g., checking if scores change after a delay, but the basic start is verified.

});
