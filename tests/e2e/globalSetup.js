/**
 * Jest Global Setup for E2E Tests
 * 
 * Starts the HTTP server and Puppeteer browser instance once before all tests.
 */
const puppeteer = require('puppeteer');
const http = require('http');
const handler = require('serve-handler');
const path = require('path');

const PORT = 3005; // Using a different port just in case
const BASE_URL = `http://localhost:${PORT}`;
const projectRoot = path.resolve(__dirname, '../../');

module.exports = async () => {
  console.log('\nSetting up E2E test environment...');

  // Start server
  console.log('Starting HTTP server...');
  const server = http.createServer((req, res) => {
    return handler(req, res, {
      public: projectRoot,
      etag: false, // Disable ETag-based caching
      headers: [ // Add cache-control headers to prevent caching
        {
          "source": "**/*.@(js|css|html)",
          "headers": [{
            "key": "Cache-Control",
            "value": "no-store, no-cache, must-revalidate, proxy-revalidate"
          }, {
            "key": "Pragma",
            "value": "no-cache"
          }, {
            "key": "Expires",
            "value": "0"
          }]
        }
      ]
    });
  });

  global.__SERVER__ = server; // Store server instance globally

  await new Promise((resolve, reject) => {
    server.on('error', (err) => {
      console.error('Server failed to start:', err);
      reject(err);
    });
    server.listen(PORT, () => {
      console.log(`Server running at ${BASE_URL}`);
      resolve();
    });
  });
  console.log('HTTP server started successfully.');

  // Launch browser
  console.log('Launching Puppeteer browser...');
  try {
      const browser = await puppeteer.launch({
          headless: true, // Keep headless true for CI/faster runs, change to false for local debug
          dumpio: true,   // Forward browser console logs to terminal
          args: ['--window-size=1366,768', '--no-sandbox', '--disable-setuid-sandbox'], // Added sandbox args for compatibility
          defaultViewport: {
              width: 1366,
              height: 768
          }
      });
      global.__BROWSER__ = browser; // Store browser instance globally
      console.log('Puppeteer browser launched successfully.');
  } catch (error) {
      console.error('Failed to launch Puppeteer:', error);
      process.exit(1); // Exit if browser fails to launch
  }
  
  // Store base URL globally for tests to use
  global.__BASE_URL__ = BASE_URL;

  console.log('E2E environment setup complete.');
};
