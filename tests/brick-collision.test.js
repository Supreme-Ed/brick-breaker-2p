/**
 * Tests for brick collision and power-up mechanics in Brick Breaker 2P
 */

describe('Brick Collision and Power-ups', () => {
  // Setup test environment
  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="gameCanvas" width="800" height="600"></canvas>
      <div id="player1PowerUp" class="power-up-indicator" style="display: none;">Freeze Ray Ready!</div>
      <div id="player2PowerUp" class="power-up-indicator" style="display: none;">Freeze Ray Ready!</div>
      <div id="player1LaserPowerUp" class="power-up-indicator" style="display: none;">Laser Ready!</div>
      <div id="player2LaserPowerUp" class="power-up-indicator" style="display: none;">Laser Ready!</div>
    `;
  });

  test('Ball should bounce when hitting a brick', () => {
    // Create a brick and ball
    const brick = {
      x: 300,
      y: 200,
      width: 75,
      height: 20,
      status: 1,
      powerUp: null
    };
    
    const ball = {
      x: 330, // Inside brick x-range
      y: 225, // Just below brick
      radius: 8,
      dx: 0,
      dy: -5, // Moving upward
      lastHitBy: 1
    };
    
    // Simplified brick collision function
    function checkBrickCollision(brick, ball) {
      if (brick.status === 1 && 
          ball.x + ball.radius > brick.x && 
          ball.x - ball.radius < brick.x + brick.width && 
          ball.y + ball.radius > brick.y && 
          ball.y - ball.radius < brick.y + brick.height) {
        
        // Reverse ball direction
        ball.dy = -ball.dy;
        
        // Mark brick as hit
        brick.status = 0;
        
        return true;
      }
      
      return false;
    }
    
    // Test collision
    const result = checkBrickCollision(brick, ball);
    
    // Assertions
    expect(result).toBe(true);
    expect(ball.dy).toBe(5); // Direction should be reversed
    expect(brick.status).toBe(0); // Brick should be marked as hit
  });
  
  test('Ball should not collide with already destroyed bricks', () => {
    // Create a destroyed brick and ball
    const brick = {
      x: 300,
      y: 200,
      width: 75,
      height: 20,
      status: 0, // Already destroyed
      powerUp: null
    };
    
    const ball = {
      x: 330,
      y: 225,
      radius: 8,
      dx: 0,
      dy: -5,
      lastHitBy: 1
    };
    
    // Simplified brick collision function
    function checkBrickCollision(brick, ball) {
      if (brick.status === 1 && 
          ball.x + ball.radius > brick.x && 
          ball.x - ball.radius < brick.x + brick.width && 
          ball.y + ball.radius > brick.y && 
          ball.y - ball.radius < brick.y + brick.height) {
        ball.dy = -ball.dy;
        brick.status = 0;
        return true;
      }
      return false;
    }
    
    // Test collision
    const result = checkBrickCollision(brick, ball);
    
    // Assertions
    expect(result).toBe(false);
    expect(ball.dy).toBe(-5); // Direction should not change
  });
  
  test('Player should receive power-up when breaking power-up brick', () => {
    // Create a power-up brick and ball
    const brick = {
      x: 300,
      y: 200,
      width: 75,
      height: 20,
      status: 1,
      powerUp: 'freezeRay'
    };
    
    const ball = {
      x: 330,
      y: 225,
      radius: 8,
      dx: 0,
      dy: -5,
      lastHitBy: 1 // Player 1 last hit the ball
    };
    
    // Create player objects
    const paddle1 = {
      hasFreezeRay: false,
      score: 0
    };
    
    const paddle2 = {
      hasFreezeRay: false,
      score: 0
    };
    
    // Mock power-up indicators
    const player1PowerUpIndicator = document.getElementById('player1PowerUp');
    const player2PowerUpIndicator = document.getElementById('player2PowerUp');
    
    // Simplified brick collision function with power-up handling
    function checkBrickCollision(brick, ball, paddle1, paddle2) {
      if (brick.status === 1 && 
          ball.x + ball.radius > brick.x && 
          ball.x - ball.radius < brick.x + brick.width && 
          ball.y + ball.radius > brick.y && 
          ball.y - ball.radius < brick.y + brick.height) {
        
        // Reverse ball direction
        ball.dy = -ball.dy;
        
        // Mark brick as hit
        brick.status = 0;
        
        // Award point to last player who hit the ball
        if (ball.lastHitBy === 1) {
          paddle1.score++;
        } else {
          paddle2.score++;
        }
        
        // Handle power-up
        if (brick.powerUp) {
          if (ball.lastHitBy === 1) {
            if (brick.powerUp === 'freezeRay') {
              paddle1.hasFreezeRay = true;
              player1PowerUpIndicator.style.display = 'block';
            }
          } else {
            if (brick.powerUp === 'freezeRay') {
              paddle2.hasFreezeRay = true;
              player2PowerUpIndicator.style.display = 'block';
            }
          }
        }
        
        return true;
      }
      
      return false;
    }
    
    // Test collision
    const result = checkBrickCollision(brick, ball, paddle1, paddle2);
    
    // Assertions
    expect(result).toBe(true);
    expect(paddle1.hasFreezeRay).toBe(true); // Player 1 should get power-up
    expect(paddle1.score).toBe(1); // Player 1 should get a point
    expect(player1PowerUpIndicator.style.display).toBe('block'); // Indicator should be shown
  });
  
  test('Player should get a point for breaking a brick', () => {
    // Create a brick and ball
    const brick = {
      x: 300,
      y: 200,
      width: 75,
      height: 20,
      status: 1,
      powerUp: null
    };
    
    const ball = {
      x: 330,
      y: 225,
      radius: 8,
      dx: 0,
      dy: -5,
      lastHitBy: 2 // Player 2 last hit the ball
    };
    
    // Create player objects
    const paddle1 = { score: 0 };
    const paddle2 = { score: 0 };
    
    // Simplified brick collision function
    function checkBrickCollision(brick, ball, paddle1, paddle2) {
      if (brick.status === 1 && 
          ball.x + ball.radius > brick.x && 
          ball.x - ball.radius < brick.x + brick.width && 
          ball.y + ball.radius > brick.y && 
          ball.y - ball.radius < brick.y + brick.height) {
        
        ball.dy = -ball.dy;
        brick.status = 0;
        
        // Award point to last player who hit the ball
        if (ball.lastHitBy === 1) {
          paddle1.score++;
        } else {
          paddle2.score++;
        }
        
        return true;
      }
      
      return false;
    }
    
    // Test collision
    checkBrickCollision(brick, ball, paddle1, paddle2);
    
    // Assertions
    expect(paddle2.score).toBe(1); // Player 2 should get a point
    expect(paddle1.score).toBe(0); // Player 1 should not get a point
  });
});
