/**
 * Unit tests for power-up effects in Brick Breaker 2P
 * 
 * This test suite verifies that power-up effects work correctly,
 * focusing on the freeze ray and laser beam effects on paddles.
 */

// Using CommonJS require
const { Paddle } = require('../../js/entities/paddle_entity.js');
const { FreezeRay } = require('../../js/powerups/freezeRay.js');
const { LaserBeam } = require('../../js/powerups/laserBeam.js');

// Mock canvas context
const mockCtx = {
  save: jest.fn(),
  restore: jest.fn(),
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  beginPath: jest.fn(),
  closePath: jest.fn(),
  fill: jest.fn(),
  arc: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  createLinearGradient: jest.fn(() => mockCtx),
  addColorStop: jest.fn(),
  fillStyle: null,
  strokeStyle: null,
  lineWidth: null,
  globalAlpha: null,
  shadowColor: null,
  shadowBlur: null,
  drawImage: jest.fn()
};

describe('Power-up Effects', () => {
  let paddle;
  const canvasWidth = 800;
  const canvasHeight = 600;
  
  beforeEach(() => {
    // Reset mock functions
    jest.clearAllMocks();
    
    // Create a test paddle
    paddle = new Paddle(350, 550, 100, 10, false, canvasWidth);
  });
  
  describe('Paddle.freeze method', () => {
    test('should set paddle to frozen state for specified duration', () => {
      // Initial state
      expect(paddle.isFrozen).toBe(false);
      expect(paddle.frozenTimeRemaining).toBe(0);
      
      // Freeze the paddle
      paddle.freeze(5);
      
      // Check frozen state
      expect(paddle.isFrozen).toBe(true);
      expect(paddle.frozenTimeRemaining).toBe(5);
      
      // Update should reduce time remaining
      paddle.update(0.5, {});
      expect(paddle.frozenTimeRemaining).toBe(4.5);
      
      // Paddle should still be frozen
      expect(paddle.isFrozen).toBe(true);
      
      // Update until unfrozen
      paddle.update(4.5, {});
      expect(paddle.frozenTimeRemaining).toBe(0);
      expect(paddle.isFrozen).toBe(false);
    });
    
    test('should draw frozen paddle with ice effect', () => {
      // Freeze the paddle
      paddle.freeze(5);
      
      // Draw the paddle
      paddle.draw(mockCtx);
      
      // Verify that the paddle was drawn with frozen effect
      expect(mockCtx.createLinearGradient).toHaveBeenCalled();
      expect(mockCtx.fillRect).toHaveBeenCalled();
      
      // Check that ice crystals were drawn
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.fill).toHaveBeenCalled();
    });
  });
  
  describe('Paddle.turnToAshes method', () => {
    test('should set paddle to ashes state for specified duration', () => {
      // Initial state
      expect(paddle.isAshes).toBe(false);
      expect(paddle.ashesTimeRemaining).toBe(0);
      
      // Turn paddle to ashes
      paddle.turnToAshes(5);
      
      // Check ashes state
      expect(paddle.isAshes).toBe(true);
      expect(paddle.ashesTimeRemaining).toBe(5);
      
      // Update should reduce time remaining
      paddle.update(0.5, {});
      expect(paddle.ashesTimeRemaining).toBe(4.5);
      
      // Paddle should still be ashes
      expect(paddle.isAshes).toBe(true);
      
      // Update until recovered
      paddle.update(4.5, {});
      expect(paddle.ashesTimeRemaining).toBe(0);
      expect(paddle.isAshes).toBe(false);
    });
    
    test('should draw paddle with ashes effect instead of making it invisible', () => {
      // Turn paddle to ashes
      paddle.turnToAshes(5);
      
      // Draw the paddle
      paddle.draw(mockCtx);
      
      // Verify that the paddle was drawn with ashes effect
      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
      
      // Check that the paddle was drawn (not invisible)
      expect(mockCtx.fillRect).toHaveBeenCalled();
      expect(mockCtx.strokeRect).toHaveBeenCalled();
      
      // Check that ash particles were drawn
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.fill).toHaveBeenCalled();
    });
  });
  
  describe('FreezeRay', () => {
    let freezeRay;
    let paddle1;
    let paddle2;
    
    beforeEach(() => {
      paddle1 = new Paddle(350, 550, 100, 10, false, canvasWidth);
      paddle2 = new Paddle(350, 50, 100, 10, true, canvasWidth);
      
      // Create a freeze ray from paddle1 to paddle2
      freezeRay = new FreezeRay(400, 550, 1, canvasHeight);
    });
    
    test('should freeze opponent paddle when hit', () => {
      // Position the ray to hit paddle2
      freezeRay.x = paddle2.x + paddle2.width / 2;
      
      // Force progress to almost complete
      freezeRay.progress = 0.99;
      
      // Update the ray
      const hit = freezeRay.update(paddle1, paddle2);
      
      // Verify hit and paddle2 is frozen
      expect(hit).toBe(true);
      expect(paddle2.isFrozen).toBe(true);
      expect(paddle2.frozenTimeRemaining).toBe(10);
      
      // Verify ray is marked as hit
      expect(freezeRay.hitTarget).toBe(true);
    });
    
    test('should draw freeze ray with proper effects', () => {
      // Set progress
      freezeRay.progress = 0.5;
      
      // Draw the ray
      freezeRay.draw(mockCtx);
      
      // Verify drawing calls
      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.createLinearGradient).toHaveBeenCalled();
      expect(mockCtx.fillRect).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    });
  });
  
  describe('LaserBeam', () => {
    let laserBeam;
    let paddle1;
    let paddle2;
    
    beforeEach(() => {
      paddle1 = new Paddle(350, 550, 100, 10, false, canvasWidth);
      paddle2 = new Paddle(350, 50, 100, 10, true, canvasWidth);
      
      // Create a laser beam from paddle1 to paddle2
      laserBeam = new LaserBeam(400, 550, 1, canvasHeight);
    });
    
    test('should turn opponent paddle to ashes when hit', () => {
      // Position the beam to hit paddle2
      laserBeam.x = paddle2.x + paddle2.width / 2;

      // Simulate the beam's full lifecycle by updating until it expires
      let safetyCounter = 0;
      const maxUpdates = 200; // Prevent infinite loops
      while (!laserBeam.isExpired && safetyCounter < maxUpdates) {
        laserBeam.update([], paddle1, paddle2);
        safetyCounter++;
      }

      if (safetyCounter >= maxUpdates) {
        console.warn("[TEST WARN] LaserBeam test exceeded max updates.");
      }
      
      // Verify paddle2 is turned to ashes after the beam has run its course
      expect(paddle2.isAshes).toBe(true);
      expect(paddle2.ashesTimeRemaining).toBeGreaterThan(0); // Check it was set
      
      // Verify beam is marked as hit
      expect(laserBeam.hitTarget).toBe(true);
    });
    
    test('should draw laser beam with proper effects', () => {
      // Set progress
      laserBeam.progress = 0.5;
      
      // Draw the beam
      laserBeam.draw(mockCtx);
      
      // Verify drawing calls
      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.createLinearGradient).toHaveBeenCalled();
      // Verify fillRect was called multiple times (glow, core, shadow)
      expect(mockCtx.fillRect).toHaveBeenCalledTimes(3);
      // Verify shadow color was set correctly at the end of the main beam drawing
      expect(mockCtx.shadowColor).toBe('#FFA500'); 
      expect(mockCtx.shadowBlur).toBe(20);
      expect(mockCtx.restore).toHaveBeenCalled();
    });
  });
});
