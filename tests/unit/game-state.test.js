/**
 * Tests for game state management in Brick Breaker 2P
 */

describe('Game State Management', () => {
  // Setup test environment
  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="gameCanvas" width="800" height="600"></canvas>
      <div id="player1PowerUp" class="power-up-indicator" style="display: none;">Freeze Ray Ready!</div>
      <div id="player2PowerUp" class="power-up-indicator" style="display: none;">Freeze Ray Ready!</div>
    `;
  });

  test('Game should reset ball position when it goes out of bounds', () => {
    // Create game objects
    const canvas = {
      width: 800,
      height: 600
    };
    
    const ball = {
      x: 400,
      y: 650, // Out of bounds (below canvas)
      radius: 8,
      dx: 2,
      dy: 3,
      owner: 1,
      lastHitBy: 1
    };
    
    const paddle1 = {
      x: 350,
      y: 550,
      width: 100,
      score: 0
    };
    
    const paddle2 = {
      x: 350,
      y: 50,
      width: 100,
      score: 0
    };
    
    // Function to reset ball
    function resetBall(ball) {
      // If ball goes below canvas (player 2 scores)
      if (ball.y > canvas.height + ball.radius) {
        paddle2.score += 2; // 2 points for getting ball past opponent
        
        // Reset ball to player 1's side
        ball.x = canvas.width / 2;
        ball.y = canvas.height - 50;
        ball.dx = (Math.random() * 4) - 2; // Random horizontal direction
        ball.dy = -3; // Move upward
        ball.owner = 1;
        ball.lastHitBy = 1;
        
        return true;
      }
      
      // If ball goes above canvas (player 1 scores)
      if (ball.y < -ball.radius) {
        paddle1.score += 2; // 2 points for getting ball past opponent
        
        // Reset ball to player 2's side
        ball.x = canvas.width / 2;
        ball.y = 50;
        ball.dx = (Math.random() * 4) - 2; // Random horizontal direction
        ball.dy = 3; // Move downward
        ball.owner = 2;
        ball.lastHitBy = 2;
        
        return true;
      }
      
      return false;
    }
    
    // Test resetting ball
    const result = resetBall(ball);
    
    // Assertions
    expect(result).toBe(true);
    expect(paddle2.score).toBe(2); // Player 2 should get 2 points
    expect(ball.y).toBe(canvas.height - 50); // Ball should be reset to player 1's side
    expect(ball.dy).toBe(-3); // Ball should be moving upward
    expect(ball.owner).toBe(1);
    expect(ball.lastHitBy).toBe(1);
  });
  
  test('Game should detect when all bricks are cleared', () => {
    // Create brick grid
    const bricks = [
      [{ status: 0 }, { status: 0 }],
      [{ status: 0 }, { status: 1 }] // One brick remaining
    ];
    
    // Function to count active bricks
    function countActiveBricks(bricks) {
      let count = 0;
      
      for (let c = 0; c < bricks.length; c++) {
        for (let r = 0; r < bricks[c].length; r++) {
          if (bricks[c][r].status === 1) {
            count++;
          }
        }
      }
      
      return count;
    }
    
    // Test with one brick remaining
    expect(countActiveBricks(bricks)).toBe(1);
    
    // Clear the last brick
    bricks[1][1].status = 0;
    
    // Test with no bricks remaining
    expect(countActiveBricks(bricks)).toBe(0);
  });
  
  test('Game should generate a new brick pattern when all bricks are cleared', () => {
    // Create empty brick grid
    const brickRowCount = 3;
    const brickColumnCount = 3;
    const bricks = [];
    
    for (let c = 0; c < brickColumnCount; c++) {
      bricks[c] = [];
      for (let r = 0; r < brickRowCount; r++) {
        bricks[c][r] = { status: 0 };
      }
    }
    
    // Function to create a standard pattern
    function createStandardPattern(bricks) {
      for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
          bricks[c][r].status = 1;
        }
      }
    }
    
    // Function to count active bricks
    function countActiveBricks(bricks) {
      let count = 0;
      
      for (let c = 0; c < bricks.length; c++) {
        for (let r = 0; r < bricks[c].length; r++) {
          if (bricks[c][r].status === 1) {
            count++;
          }
        }
      }
      
      return count;
    }
    
    // Test initial state
    expect(countActiveBricks(bricks)).toBe(0);
    
    // Generate new pattern
    createStandardPattern(bricks);
    
    // Test after generating pattern
    expect(countActiveBricks(bricks)).toBe(brickRowCount * brickColumnCount);
  });
  
  test('Game should end when a player reaches 10 points', () => {
    // Create player objects
    const paddle1 = { score: 9 };
    const paddle2 = { score: 5 };
    
    let gameOver = false;
    let winner = null;
    
    // Function to check for game over
    function checkGameOver() {
      if (paddle1.score >= 10) {
        gameOver = true;
        winner = 1;
        return true;
      }
      
      if (paddle2.score >= 10) {
        gameOver = true;
        winner = 2;
        return true;
      }
      
      return false;
    }
    
    // Test before reaching 10 points
    expect(checkGameOver()).toBe(false);
    
    // Increase player 1's score to 10
    paddle1.score = 10;
    
    // Test after reaching 10 points
    expect(checkGameOver()).toBe(true);
    expect(gameOver).toBe(true);
    expect(winner).toBe(1);
  });
});
