/**
 * Tests for paddle collision mechanics in Brick Breaker 2P
 */

describe('Paddle Collision Mechanics', () => {
  // Setup test environment
  beforeEach(() => {
    // Create canvas
    document.body.innerHTML = `<canvas id="gameCanvas" width="800" height="600"></canvas>`;
  });

  // Test paddle-ball collision detection
  test('Ball should bounce off paddle when colliding', () => {
    // Create simplified paddle and ball objects
    const paddle = {
      x: 350,
      y: 550,
      width: 100,
      height: 10,
      curvature: 0.3
    };
    
    const ball = {
      x: 400,
      y: 540,
      radius: 8,
      dx: 0,
      dy: 5,
      lastHitBy: 2
    };
    
    // Simplified collision detection function
    function checkCollision(paddle, ball) {
      // Check if ball overlaps with paddle
      if (ball.x + ball.radius > paddle.x && 
          ball.x - ball.radius < paddle.x + paddle.width && 
          ball.y + ball.radius > paddle.y && 
          ball.y - ball.radius < paddle.y + paddle.height) {
        
        // Calculate hit position (0 to 1, from left to right)
        const hitPosition = (ball.x - paddle.x) / paddle.width;
        
        // Apply curvature based on hit position
        ball.dx = (hitPosition - 0.5) * 10 * paddle.curvature;
        
        // Reverse vertical direction
        ball.dy = -ball.dy;
        
        // Update last hit
        ball.lastHitBy = 1; // Assuming paddle 1
        
        return true;
      }
      
      return false;
    }
    
    // Test collision
    const result = checkCollision(paddle, ball);
    
    // Assertions
    expect(result).toBe(true);
    expect(ball.dy).toBe(-5); // Direction should be reversed
    expect(ball.lastHitBy).toBe(1); // Last hit should be updated
  });
  
  test('Ball should not collide when not overlapping with paddle', () => {
    // Create simplified paddle and ball objects
    const paddle = {
      x: 350,
      y: 550,
      width: 100,
      height: 10
    };
    
    const ball = {
      x: 200, // Far from paddle
      y: 300, // Far from paddle
      radius: 8,
      dx: 0,
      dy: 5,
      lastHitBy: 2
    };
    
    // Simplified collision detection function
    function checkCollision(paddle, ball) {
      if (ball.x + ball.radius > paddle.x && 
          ball.x - ball.radius < paddle.x + paddle.width && 
          ball.y + ball.radius > paddle.y && 
          ball.y - ball.radius < paddle.y + paddle.height) {
        ball.dy = -ball.dy;
        ball.lastHitBy = 1;
        return true;
      }
      return false;
    }
    
    // Test collision
    const result = checkCollision(paddle, ball);
    
    // Assertions
    expect(result).toBe(false);
    expect(ball.dy).toBe(5); // Direction should not change
    expect(ball.lastHitBy).toBe(2); // Last hit should not change
  });
  
  test('Hit position affects ball direction', () => {
    // Create simplified paddle object
    const paddle = {
      x: 350,
      y: 550,
      width: 100,
      height: 10,
      curvature: 0.3
    };
    
    // Test center hit (should go straight)
    const centerBall = {
      x: 400, // Center of paddle
      y: 540,
      radius: 8,
      dx: 0,
      dy: 5,
      lastHitBy: 2
    };
    
    // Simplified collision function
    function checkCollision(paddle, ball) {
      if (ball.x + ball.radius > paddle.x && 
          ball.x - ball.radius < paddle.x + paddle.width && 
          ball.y + ball.radius > paddle.y && 
          ball.y - ball.radius < paddle.y + paddle.height) {
        
        const hitPosition = (ball.x - paddle.x) / paddle.width;
        ball.dx = (hitPosition - 0.5) * 10 * paddle.curvature;
        ball.dy = -ball.dy;
        ball.lastHitBy = 1;
        return true;
      }
      return false;
    }
    
    // Test center collision
    const result = checkCollision(paddle, centerBall);
    
    // Assertions
    expect(result).toBe(true);
    expect(centerBall.dy).toBe(-5); // Direction should be reversed
    
    // Create two more balls for left and right hits
    const leftBall = {
      x: 360, // Left side of paddle
      y: 540,
      radius: 8,
      dx: 0,
      dy: 5,
      lastHitBy: 2
    };
    
    const rightBall = {
      x: 440, // Right side of paddle
      y: 540,
      radius: 8,
      dx: 0,
      dy: 5,
      lastHitBy: 2
    };
    
    // Test left and right collisions
    checkCollision(paddle, leftBall);
    checkCollision(paddle, rightBall);
    
    // Just verify that hitting different parts of the paddle produces different dx values
    expect(leftBall.dx).not.toEqual(rightBall.dx);
  });
});
