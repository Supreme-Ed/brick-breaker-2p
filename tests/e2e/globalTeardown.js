/**
 * Jest Global Teardown for E2E Tests
 * 
 * Closes the Puppeteer browser instance and HTTP server once after all tests.
 */

module.exports = async () => {
    console.log('\nTearing down E2E test environment...');

    // Close browser
    if (global.__BROWSER__) {
        console.log('Closing Puppeteer browser...');
        try {
            await global.__BROWSER__.close();
            console.log('Puppeteer browser closed successfully.');
        } catch (error) {
            console.error('Failed to close Puppeteer browser:', error);
        }
    }

    // Close server
    if (global.__SERVER__) {
        console.log('Closing HTTP server...');
        await new Promise((resolve) => {
            global.__SERVER__.close(() => {
                console.log('HTTP server closed successfully.');
                resolve();
            });
        });
    }

    console.log('E2E environment teardown complete.');
};
