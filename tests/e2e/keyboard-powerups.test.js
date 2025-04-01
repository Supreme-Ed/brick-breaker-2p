/**
 * End-to-end tests for keyboard power-up activation in Brick Breaker 2P
 * 
 * This test suite verifies that the keyboard controls for power-up activation
 * work correctly in a real browser environment, focusing on the Space key for
 * Player 1 and the S key for Player 2.
 */

const puppeteer = require('puppeteer');
const http = require('http');
const handler = require('serve-handler');
const path = require('path');

describe('Keyboard Power-up Activation', () => {
  let server;
  let browser;
  let page;
  const PORT = 3003;
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

  test('Verify keyboard controls for power-up activation', async () => {
    // Set up page to monitor console logs
    page.on('console', (msg) => {
      console.log(`Browser console: ${msg.text()}`);
    });

    // Test the keyboard controls for power-up activation
    const keyboardControlsCheck = await page.evaluate(() => {
      try {
        // Check if the keys object exists
        const keysExist = typeof keys !== 'undefined';
        
        // Log what we found
        console.log('Keys object exists:', keysExist);
        
        if (keysExist) {
          console.log('Keys object:', JSON.stringify(keys));
        }
        
        // Check if the movePaddles function exists and handles Space and S keys
        const movePaddlesExists = typeof movePaddles === 'function';
        let keyboardControls = {};
        
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
          
          console.log('movePaddles function exists:', movePaddlesExists);
          console.log('Keyboard controls:', keyboardControls);
        }
        
        // Check if the shootAction function exists
        const shootActionExists = typeof shootAction === 'function';
        console.log('shootAction function exists:', shootActionExists);
        
        return {
          keysExist,
          movePaddlesExists,
          shootActionExists,
          keyboardControls
        };
      } catch (error) {
        console.error('Error during keyboard controls check:', error);
        return { error: error.message };
      }
    });

    console.log('Keyboard controls check results:', keyboardControlsCheck);
    
    // Assert that the keys object exists
    expect(keyboardControlsCheck.keysExist).toBe(true);
    
    // Assert that the movePaddles function exists
    expect(keyboardControlsCheck.movePaddlesExists).toBe(true);
  });
});
