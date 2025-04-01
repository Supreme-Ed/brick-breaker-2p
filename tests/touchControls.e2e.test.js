/**
 * End-to-end tests for Brick Breaker 2P touch controls
 * These tests use Puppeteer to simulate touch events in a real browser
 */

describe('Brick Breaker 2P Touch Controls', () => {
  beforeAll(async () => {
    // Navigate to the game page
    await page.goto('http://localhost:8080/brick-breaker.html');
    
    // Wait for the canvas to be available
    await page.waitForSelector('#gameCanvas');
    
    // Set mobile viewport
    await page.setViewport({
      width: 800,
      height: 600,
      hasTouch: true,
      isMobile: true
    });
  });
  
  it('should detect touch capability', async () => {
    // Check if touch is detected by the game
    const isTouchDevice = await page.evaluate(() => {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    });
    
    expect(isTouchDevice).toBe(true);
  });
  
  it('should register touch events on the canvas', async () => {
    // Create a touch event listener to verify events are captured
    const touchStartCaptured = await page.evaluate(() => {
      return new Promise(resolve => {
        const canvas = document.getElementById('gameCanvas');
        
        // Add a one-time touch listener
        canvas.addEventListener('touchstart', function handler() {
          canvas.removeEventListener('touchstart', handler);
          resolve(true);
        });
        
        // Simulate a touch event
        const touchEvent = new TouchEvent('touchstart', {
          bubbles: true,
          touches: [new Touch({
            identifier: 1,
            target: canvas,
            clientX: 400,
            clientY: 500
          })],
          changedTouches: [new Touch({
            identifier: 1,
            target: canvas,
            clientX: 400,
            clientY: 500
          })]
        });
        
        canvas.dispatchEvent(touchEvent);
        
        // If no event is captured within 1 second, resolve with false
        setTimeout(() => resolve(false), 1000);
      });
    });
    
    expect(touchStartCaptured).toBe(true);
  });
  
  it('should move paddle1 when touching bottom half of screen', async () => {
    // Get initial paddle position
    const initialPaddle1X = await page.evaluate(() => {
      return paddle1.x;
    });
    
    // Simulate touch in bottom half
    await page.touchscreen.tap({
      x: 200, // Left side of screen
      y: 500  // Bottom half
    });
    
    // Wait a moment for the game to process
    await page.waitForTimeout(500);
    
    // Get new paddle position
    const newPaddle1X = await page.evaluate(() => {
      return paddle1.x;
    });
    
    // Paddle should have moved toward touch position
    expect(newPaddle1X).not.toEqual(initialPaddle1X);
    expect(newPaddle1X).toBeLessThan(initialPaddle1X);
  });
  
  it('should move paddle2 when touching top half of screen', async () => {
    // Get initial paddle position
    const initialPaddle2X = await page.evaluate(() => {
      return paddle2.x;
    });
    
    // Simulate touch in top half
    await page.touchscreen.tap({
      x: 600, // Right side of screen
      y: 100  // Top half
    });
    
    // Wait a moment for the game to process
    await page.waitForTimeout(500);
    
    // Get new paddle position
    const newPaddle2X = await page.evaluate(() => {
      return paddle2.x;
    });
    
    // Paddle should have moved toward touch position
    expect(newPaddle2X).not.toEqual(initialPaddle2X);
    expect(newPaddle2X).toBeGreaterThan(initialPaddle2X);
  });
  
  it('should detect tap in center area for shooting', async () => {
    // First, give player1 a power-up
    await page.evaluate(() => {
      paddle1.hasFreezeRay = true;
      player1PowerUpIndicator.style.display = 'block';
    });
    
    // Get initial freeze ray count
    const initialFreezeRayCount = await page.evaluate(() => {
      return freezeRays.length;
    });
    
    // Simulate tap in center area (shoot zone)
    await page.touchscreen.tap({
      x: 400, // Center of screen
      y: 500  // Bottom half (player 1)
    });
    
    // Wait a moment for the game to process
    await page.waitForTimeout(500);
    
    // Check if a freeze ray was created
    const newFreezeRayCount = await page.evaluate(() => {
      return freezeRays.length;
    });
    
    // Should have created a new freeze ray
    expect(newFreezeRayCount).toBeGreaterThan(initialFreezeRayCount);
  });
  
  it('should handle touch drag to continuously move paddle', async () => {
    // Simulate touch drag from left to right
    await page.touchscreen.touchStart({
      x: 200,
      y: 500 // Bottom half (player 1)
    });
    
    // Record position after initial touch
    const midPaddle1X = await page.evaluate(() => {
      return paddle1.x;
    });
    
    // Move touch to right side
    await page.touchscreen.touchMove({
      x: 600,
      y: 500
    });
    
    // Wait a moment for the game to process
    await page.waitForTimeout(500);
    
    // Get final paddle position
    const finalPaddle1X = await page.evaluate(() => {
      return paddle1.x;
    });
    
    // End the touch
    await page.touchscreen.touchEnd();
    
    // Paddle should have moved right
    expect(finalPaddle1X).toBeGreaterThan(midPaddle1X);
  });
  
  it('should handle multi-touch for controlling both paddles simultaneously', async () => {
    // Get initial paddle positions
    const initialPositions = await page.evaluate(() => {
      return {
        paddle1X: paddle1.x,
        paddle2X: paddle2.x
      };
    });
    
    // Simulate first touch (player 1)
    await page.touchscreen.touchStart({
      x: 200,
      y: 500 // Bottom half
    });
    
    // Simulate second touch (player 2)
    await page.touchscreen.touchStart({
      x: 600,
      y: 100 // Top half
    });
    
    // Wait a moment for the game to process
    await page.waitForTimeout(500);
    
    // Get new paddle positions
    const newPositions = await page.evaluate(() => {
      return {
        paddle1X: paddle1.x,
        paddle2X: paddle2.x
      };
    });
    
    // End both touches
    await page.touchscreen.touchEnd();
    
    // Both paddles should have moved
    expect(newPositions.paddle1X).not.toEqual(initialPositions.paddle1X);
    expect(newPositions.paddle2X).not.toEqual(initialPositions.paddle2X);
  });
});
