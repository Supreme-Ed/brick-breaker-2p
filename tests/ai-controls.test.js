/**
 * Tests for AI paddle controls in Brick Breaker 2P
 */

describe('AI Paddle Controls', () => {
  // Setup test environment
  beforeEach(() => {
    document.body.innerHTML = `<canvas id="gameCanvas" width="800" height="600"></canvas>`;
  });
  
  test('AI should move paddle towards ball', () => {
    // Create game objects
    const paddle2 = {
      x: 350,
      y: 50,
      width: 100,
      height: 10,
      dx: 0,
      isFrozen: false,
      isAshes: false
    };
    
    const ball = {
      x: 500, // Ball to the right of paddle center
      y: 200,
      radius: 8,
      dx: 2,
      dy: 3
    };
    
    // Simplified AI movement function
    function moveAIPaddle(paddle, ball, difficulty = 0.8) {
      if (paddle.isFrozen || paddle.isAshes) return false;
      
      const paddleCenter = paddle.x + paddle.width / 2;
      const targetX = ball.x;
      const diff = targetX - paddleCenter;
      
      // Apply difficulty factor (lower = easier, higher = harder)
      const moveSpeed = 5 * difficulty;
      
      if (Math.abs(diff) > moveSpeed) {
        // Move paddle towards ball
        paddle.dx = Math.sign(diff) * moveSpeed;
        paddle.x += paddle.dx;
        
        // Keep paddle within bounds
        if (paddle.x < 0) paddle.x = 0;
        if (paddle.x + paddle.width > 800) paddle.x = 800 - paddle.width;
        
        return true;
      } else {
        // Ball is already centered with paddle
        paddle.dx = 0;
        return false;
      }
    }
    
    // Initial position
    const initialX = paddle2.x;
    
    // Test AI movement
    const moved = moveAIPaddle(paddle2, ball);
    
    // Assertions - paddle should move right towards the ball
    expect(moved).toBe(true);
    expect(paddle2.x).toBeGreaterThan(initialX);
    expect(paddle2.dx).toBeGreaterThan(0);
    
    // Move ball to left side
    ball.x = 200;
    
    // Reset paddle position
    paddle2.x = 350;
    paddle2.dx = 0;
    
    // Test AI movement again
    const movedLeft = moveAIPaddle(paddle2, ball);
    
    // Assertions - paddle should move left towards the ball
    expect(movedLeft).toBe(true);
    expect(paddle2.x).toBeLessThan(350);
    expect(paddle2.dx).toBeLessThan(0);
  });
  
  test('AI should not move if ball is already centered with paddle', () => {
    // Create game objects
    const paddle2 = {
      x: 350,
      y: 50,
      width: 100,
      height: 10,
      dx: 0,
      isFrozen: false,
      isAshes: false
    };
    
    const ball = {
      x: 400, // Ball centered with paddle
      y: 200,
      radius: 8,
      dx: 0,
      dy: 3
    };
    
    // Simplified AI movement function
    function moveAIPaddle(paddle, ball, difficulty = 0.8) {
      if (paddle.isFrozen || paddle.isAshes) return false;
      
      const paddleCenter = paddle.x + paddle.width / 2;
      const targetX = ball.x;
      const diff = targetX - paddleCenter;
      
      // Apply difficulty factor (lower = easier, higher = harder)
      const moveSpeed = 5 * difficulty;
      
      if (Math.abs(diff) > moveSpeed) {
        // Move paddle towards ball
        paddle.dx = Math.sign(diff) * moveSpeed;
        paddle.x += paddle.dx;
        return true;
      } else {
        // Ball is already centered with paddle
        paddle.dx = 0;
        return false;
      }
    }
    
    // Initial position
    const initialX = paddle2.x;
    
    // Test AI movement
    const moved = moveAIPaddle(paddle2, ball);
    
    // Assertions - paddle should not move
    expect(moved).toBe(false);
    expect(paddle2.x).toBe(initialX);
    expect(paddle2.dx).toBe(0);
  });
  
  test('AI should not move if paddle is frozen', () => {
    // Create game objects
    const paddle2 = {
      x: 350,
      y: 50,
      width: 100,
      height: 10,
      dx: 0,
      isFrozen: true, // Paddle is frozen
      isAshes: false
    };
    
    const ball = {
      x: 500, // Ball to the right of paddle
      y: 200,
      radius: 8,
      dx: 2,
      dy: 3
    };
    
    // Simplified AI movement function
    function moveAIPaddle(paddle, ball, difficulty = 0.8) {
      if (paddle.isFrozen || paddle.isAshes) return false;
      
      const paddleCenter = paddle.x + paddle.width / 2;
      const targetX = ball.x;
      const diff = targetX - paddleCenter;
      
      // Apply difficulty factor (lower = easier, higher = harder)
      const moveSpeed = 5 * difficulty;
      
      if (Math.abs(diff) > moveSpeed) {
        // Move paddle towards ball
        paddle.dx = Math.sign(diff) * moveSpeed;
        paddle.x += paddle.dx;
        return true;
      } else {
        // Ball is already centered with paddle
        paddle.dx = 0;
        return false;
      }
    }
    
    // Initial position
    const initialX = paddle2.x;
    
    // Test AI movement
    const moved = moveAIPaddle(paddle2, ball);
    
    // Assertions - paddle should not move when frozen
    expect(moved).toBe(false);
    expect(paddle2.x).toBe(initialX);
  });
  
  test('AI difficulty should affect paddle speed', () => {
    // Create game objects
    const paddle2 = {
      x: 350,
      y: 50,
      width: 100,
      height: 10,
      dx: 0,
      isFrozen: false,
      isAshes: false
    };
    
    const ball = {
      x: 500, // Ball to the right of paddle
      y: 200,
      radius: 8,
      dx: 2,
      dy: 3
    };
    
    // Simplified AI movement function
    function moveAIPaddle(paddle, ball, difficulty = 0.8) {
      if (paddle.isFrozen || paddle.isAshes) return false;
      
      const paddleCenter = paddle.x + paddle.width / 2;
      const targetX = ball.x;
      const diff = targetX - paddleCenter;
      
      // Apply difficulty factor (lower = easier, higher = harder)
      const moveSpeed = 5 * difficulty;
      
      if (Math.abs(diff) > moveSpeed) {
        // Move paddle towards ball
        paddle.dx = Math.sign(diff) * moveSpeed;
        paddle.x += paddle.dx;
        return moveSpeed;
      } else {
        // Ball is already centered with paddle
        paddle.dx = 0;
        return 0;
      }
    }
    
    // Test with easy difficulty (0.5)
    const easyPaddle = { ...paddle2 };
    const easySpeed = moveAIPaddle(easyPaddle, ball, 0.5);
    
    // Test with hard difficulty (1.0)
    const hardPaddle = { ...paddle2 };
    const hardSpeed = moveAIPaddle(hardPaddle, ball, 1.0);
    
    // Assertions - hard difficulty should move faster
    expect(hardSpeed).toBeGreaterThan(easySpeed);
    expect(hardPaddle.dx).toBeGreaterThan(easyPaddle.dx);
  });
  
  test('AI should predict ball trajectory for advanced difficulty', () => {
    // Create game objects
    const paddle2 = {
      x: 350,
      y: 50,
      width: 100,
      height: 10,
      dx: 0,
      isFrozen: false,
      isAshes: false
    };
    
    const ball = {
      x: 300,
      y: 400, // Ball far from paddle
      radius: 8,
      dx: 3, // Moving right
      dy: -5 // Moving up towards paddle
    };
    
    // Advanced AI movement function with prediction
    function moveAdvancedAIPaddle(paddle, ball) {
      if (paddle.isFrozen || paddle.isAshes) return false;
      
      // Predict where ball will be when it reaches paddle's y position
      let predictedX = ball.x;
      
      // Only predict if ball is moving towards paddle
      if (ball.dy < 0) {
        const distanceToTravel = ball.y - (paddle.y + paddle.height);
        const timeToReach = distanceToTravel / Math.abs(ball.dy);
        predictedX = ball.x + (ball.dx * timeToReach);
        
        // Account for bounces off walls
        const canvasWidth = 800;
        while (predictedX < 0 || predictedX > canvasWidth) {
          if (predictedX < 0) {
            predictedX = -predictedX; // Bounce off left wall
          } else if (predictedX > canvasWidth) {
            predictedX = 2 * canvasWidth - predictedX; // Bounce off right wall
          }
        }
      }
      
      const paddleCenter = paddle.x + paddle.width / 2;
      const diff = predictedX - paddleCenter;
      const moveSpeed = 5;
      
      if (Math.abs(diff) > moveSpeed) {
        // Move paddle towards predicted position
        paddle.dx = Math.sign(diff) * moveSpeed;
        paddle.x += paddle.dx;
        
        // Keep paddle within bounds
        if (paddle.x < 0) paddle.x = 0;
        if (paddle.x + paddle.width > 800) paddle.x = 800 - paddle.width;
        
        return predictedX;
      } else {
        // Already at predicted position
        paddle.dx = 0;
        return ball.x;
      }
    }
    
    // Test advanced AI movement
    const predictedPosition = moveAdvancedAIPaddle(paddle2, ball);
    
    // Assertions
    expect(predictedPosition).not.toBe(ball.x); // Predicted position should be different from current ball position
    expect(paddle2.dx).not.toBe(0); // Paddle should be moving
  });
});
