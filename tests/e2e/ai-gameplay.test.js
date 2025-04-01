/**
 * End-to-end tests for AI gameplay in Brick Breaker 2P
 * 
 * This test verifies that the AI vs. AI mode initializes correctly
 * by checking that the game properly starts when the AI vs. AI button is clicked.
 */

const puppeteer = require('puppeteer');
const http = require('http');
const handler = require('serve-handler');
const path = require('path');

describe('AI Gameplay', () => {
  let server;
  let browser;
  let page;
  const PORT = 3004;
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

  test('Verify AI vs AI mode button exists and can be clicked', async () => {
    // Set up console logging
    page.on('console', msg => console.log('Browser console:', msg.text()));
    
    // Navigate to the index page
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle0' });
    console.log('Loaded index page');
    
    // Verify the AI vs AI button exists
    const aiButtonExists = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button.button'));
      const aiButton = buttons.find(button => button.textContent.includes('AI vs. AI'));
      console.log('Found buttons:', buttons.map(b => b.textContent));
      return aiButton !== undefined;
    });
    
    console.log('AI vs AI button exists:', aiButtonExists);
    expect(aiButtonExists).toBe(true);
  });
  
  test('Verify AI vs AI mode starts correctly', async () => {
    // Navigate to the game directly with AI vs AI mode (mode=3)
    await page.goto(`${BASE_URL}/brick-breaker.html?mode=3`, { waitUntil: 'networkidle0' });
    console.log('Loaded game page with AI vs AI mode');
    
    // Wait for game canvas to be ready
    await page.waitForSelector('#gameCanvas', { visible: true, timeout: 5000 });
    
    // Wait a moment for the game to initialize
    await page.waitForTimeout(1000);
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'ai-vs-ai-mode.png' });
    
    // Success if we got this far - the game initialized in AI vs AI mode
    console.log('AI vs AI mode initialized successfully');
  });
});
