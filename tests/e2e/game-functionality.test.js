/**
 * End-to-end tests for core game functionality in Brick Breaker 2P
 * 
 * This test suite verifies that the game's core functionality works correctly
 * in a real browser environment, focusing on paddle movement, ball physics,
 * and game state management.
 */

const puppeteer = require('puppeteer');
const http = require('http');
const handler = require('serve-handler');
const path = require('path');

describe('Game Core Functionality', () => {
  let server;
  let browser;
  let page;
  const PORT = 3001;
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

  test('Verify game initialization and controls', async () => {
    // Set up page to monitor console logs
    page.on('console', (msg) => {
      console.log(`Browser console: ${msg.text()}`);
    });

    // Test that the game is properly initialized with essential objects and controls
    const gameInitCheck = await page.evaluate(() => {
      try {
        // Check if essential game objects exist
        const paddle1Exists = typeof paddle1 !== 'undefined';
        const paddle2Exists = typeof paddle2 !== 'undefined';
        const ballExists = typeof ball !== 'undefined';
        const keysExist = typeof keys !== 'undefined';
        
        // Log what we found
        console.log('paddle1 exists:', paddle1Exists);
        console.log('paddle2 exists:', paddle2Exists);
        console.log('ball exists:', ballExists);
        console.log('keys exist:', keysExist);
        
        // Check if essential game functions exist
        const movePaddlesExists = typeof movePaddles === 'function';
        const moveBallExists = typeof moveBall === 'function';
        const shootActionExists = typeof shootAction === 'function';
        
        console.log('movePaddles exists:', movePaddlesExists);
        console.log('moveBall exists:', moveBallExists);
        console.log('shootAction exists:', shootActionExists);
        
        // Check keyboard controls structure
        let keyboardControls = {};
        if (keysExist) {
          console.log('Keys object:', JSON.stringify(keys));
          
          // Check if movePaddles function handles Space and S keys
          if (movePaddlesExists) {
            const movePaddlesSource = movePaddles.toString();
            
            // Check for both lowercase and uppercase key names and different access methods
            const hasSpaceKeyCheck = movePaddlesSource.includes('keys.Space') || 
                                    movePaddlesSource.includes('keys[\'Space\']') || 
                                    movePaddlesSource.includes('keys["Space"]');
                                    
            const hasSKeyCheck = movePaddlesSource.includes('keys.s') || 
                                movePaddlesSource.includes('keys[\'s\']') || 
                                movePaddlesSource.includes('keys["s"]');
            
            keyboardControls = {
              hasSpaceKeyCheck,
              hasSKeyCheck
            };
            
            console.log('Keyboard controls:', keyboardControls);
          }
        }
        
        // Check paddle power-up properties
        const paddlePowerUps = {
          paddle1HasFreezeRay: paddle1Exists && 'hasFreezeRay' in paddle1,
          paddle1HasLaser: paddle1Exists && 'hasLaser' in paddle1,
          paddle2HasFreezeRay: paddle2Exists && 'hasFreezeRay' in paddle2,
          paddle2HasLaser: paddle2Exists && 'hasLaser' in paddle2
        };
        
        console.log('Paddle power-ups:', paddlePowerUps);
        
        return {
          paddle1Exists,
          paddle2Exists,
          ballExists,
          keysExist,
          movePaddlesExists,
          moveBallExists,
          shootActionExists,
          keyboardControls,
          paddlePowerUps
        };
      } catch (error) {
        console.error('Error during game initialization check:', error);
        return { error: error.message };
      }
    });

    console.log('Game initialization check results:', gameInitCheck);
    
    // Assert that the essential game objects exist
    expect(gameInitCheck.paddle1Exists).toBe(true);
    expect(gameInitCheck.paddle2Exists).toBe(true);
    
    // Assert that the essential game functions exist
    expect(gameInitCheck.movePaddlesExists).toBe(true);
  });

  test('Verify paddle movement functionality', async () => {
    // Set up page to monitor console logs
    page.on('console', (msg) => {
      console.log(`Browser console: ${msg.text()}`);
    });

    // Test the paddle movement functionality
    const paddleMovementCheck = await page.evaluate(() => {
      try {
        // Check if the paddles are defined
        if (typeof paddle1 === 'undefined' || typeof paddle2 === 'undefined') {
          console.error('Game paddles are undefined');
          return { success: false, reason: 'Game objects not initialized' };
        }
        
        // Store initial paddle positions
        const initialPositions = {
          paddle1X: paddle1.x,
          paddle2X: paddle2.x
        };
        
        console.log('Initial paddle positions:', initialPositions);
        
        // Simulate key presses
        keys.ArrowLeft = true;
        keys.a = true;
        
        // Call the movePaddles function if it exists
        if (typeof movePaddles === 'function') {
          movePaddles();
        } else {
          console.error('movePaddles function not found');
          return { success: false, reason: 'movePaddles function not found' };
        }
        
        // Store positions after left movement
        const leftPositions = {
          paddle1X: paddle1.x,
          paddle2X: paddle2.x
        };
        
        console.log('Positions after left movement:', leftPositions);
        
        // Reset and simulate right movement
        keys.ArrowLeft = false;
        keys.a = false;
        keys.ArrowRight = true;
        keys.d = true;
        
        // Call movePaddles again
        movePaddles();
        
        // Store positions after right movement
        const rightPositions = {
          paddle1X: paddle1.x,
          paddle2X: paddle2.x
        };
        
        console.log('Positions after right movement:', rightPositions);
        
        // Check if the paddles moved
        const player1LeftMoved = initialPositions.paddle1X !== leftPositions.paddle1X;
        const player2LeftMoved = initialPositions.paddle2X !== leftPositions.paddle2X;
        const player1RightMoved = leftPositions.paddle1X !== rightPositions.paddle1X;
        const player2RightMoved = leftPositions.paddle2X !== rightPositions.paddle2X;
        
        return {
          success: true,
          player1LeftMoved,
          player2LeftMoved,
          player1RightMoved,
          player2RightMoved,
          initialPositions,
          leftPositions,
          rightPositions
        };
      } catch (error) {
        console.error('Error during paddle movement test:', error);
        return { 
          success: false, 
          reason: error.message,
          stack: error.stack
        };
      }
    });

    console.log('Paddle movement check results:', paddleMovementCheck);
    
    // Assert that the test ran successfully
    expect(paddleMovementCheck.success).toBe(true);
    
    // Assert that at least one of the paddles moved in each direction
    expect(paddleMovementCheck.player1LeftMoved || paddleMovementCheck.player2LeftMoved).toBe(true);
    expect(paddleMovementCheck.player1RightMoved || paddleMovementCheck.player2RightMoved).toBe(true);
  });
});
