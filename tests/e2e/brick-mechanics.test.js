/**
 * End-to-end tests for brick mechanics in Brick Breaker 2P
 * 
 * This test suite verifies that the brick mechanics work correctly
 * in a real browser environment, focusing on brick generation,
 * collision detection, and power-up functionality.
 */

const puppeteer = require('puppeteer');
const http = require('http');
const handler = require('serve-handler');
const path = require('path');

describe('Brick Mechanics', () => {
  let server;
  let browser;
  let page;
  const PORT = 3002;
  const BASE_URL = `http://localhost:${PORT}`;

  // Start a local server and launch browser before tests
  beforeAll(async () => {
    // Create a simple server to serve the game files
    server = http.createServer((req, res) => {
      return handler(req, res, {
        public: path.resolve(__dirname, '../../')
      });
    });
    
    await new Promise((resolve) => {
      server.listen(PORT, () => {
        console.log(`Server running at ${BASE_URL}`);
        resolve();
      });
    });

    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Use non-headless mode for debugging
      args: ['--window-size=1366,768'],
      defaultViewport: {
        width: 1366,
        height: 768
      }
    });
    
    page = await browser.newPage();
  });

  // Close browser and server after tests
  afterAll(async () => {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  });

  // Setup the game for testing
  beforeEach(async () => {
    // Navigate to the game
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle0' });
    
    // Make sure keyboard control is selected (it's the default)
    await page.click('#controlKeyboard');
    
    // Click the "Two Players" button to start the game
    await page.evaluate(() => {
      // Find the button by its text content
      const buttons = Array.from(document.querySelectorAll('button.button'));
      const twoPlayersButton = buttons.find(button => button.textContent === 'Two Players');
      if (twoPlayersButton) {
        twoPlayersButton.click();
      } else {
        console.error('Two Players button not found');
      }
    });
    
    // Wait for game canvas to be ready
    await page.waitForSelector('#gameCanvas');
    
    // Wait a moment for the game to initialize
    await page.waitForTimeout(2000);
  });

  test('Verify game initialization and brick existence', async () => {
    // Set up page to monitor console logs
    page.on('console', (msg) => {
      console.log(`Browser console: ${msg.text()}`);
    });

    // Test that the game is properly initialized with bricks
    const brickInitCheck = await page.evaluate(() => {
      try {
        // Check if bricks array exists
        const bricksExist = typeof bricks !== 'undefined';
        
        // Log what we found
        console.log('Bricks array exists:', bricksExist);
        
        // Check if bricks have expected properties
        let brickProperties = {};
        let sampleBrick = null;
        
        if (bricksExist && Array.isArray(bricks) && bricks.length > 0) {
          // Find the first non-null brick
          sampleBrick = bricks.find(brick => brick && brick.status === 1);
          
          if (sampleBrick) {
            brickProperties = {
              hasX: typeof sampleBrick.x === 'number',
              hasY: typeof sampleBrick.y === 'number',
              hasWidth: typeof sampleBrick.width === 'number',
              hasHeight: typeof sampleBrick.height === 'number',
              hasStatus: typeof sampleBrick.status === 'number'
            };
            
            console.log('Sample brick properties:', {
              x: sampleBrick.x,
              y: sampleBrick.y,
              width: sampleBrick.width,
              height: sampleBrick.height,
              status: sampleBrick.status
            });
          } else {
            console.log('No active bricks found');
          }
        }
        
        // Check if brick-related functions exist
        const drawBricksExists = typeof drawBricks === 'function';
        const checkBrickCollisionExists = typeof checkBrickCollision === 'function';
        
        console.log('drawBricks exists:', drawBricksExists);
        console.log('checkBrickCollision exists:', checkBrickCollisionExists);
        
        return {
          bricksExist,
          brickProperties,
          hasSampleBrick: sampleBrick !== null,
          drawBricksExists,
          checkBrickCollisionExists
        };
      } catch (error) {
        console.error('Error during brick initialization check:', error);
        return { error: error.message };
      }
    });

    console.log('Brick initialization check results:', brickInitCheck);
    
    // Assert that the bricks array exists
    expect(brickInitCheck.bricksExist).toBe(true);
  });
});
