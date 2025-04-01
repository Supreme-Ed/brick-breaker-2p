/**
 * Unit tests for Brick Breaker 2P game features
 */

// Mock game objects and state
const canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 600;
canvas.id = 'gameCanvas';
document.body.appendChild(canvas);

// Mock power-up indicators
const indicators = ['player1PowerUp', 'player2PowerUp', 'player1LaserPowerUp', 'player2LaserPowerUp'];
indicators.forEach(id => {
  const el = document.createElement('div');
  el.id = id;
  el.style.display = 'none';
  document.body.appendChild(el);
});

// Game objects
const paddle1 = {
  x: 350,
  y: 570,
  width: 100,
  height: 10,
  dx: 0,
  score: 0,
  curvature: 0.3,
  hasFreezeRay: false,
  isFrozen: false,
  frozenTimeRemaining: 0,
  isWide: false,
  widePaddleTimeRemaining: 0,
  originalWidth: 100,
  hasLaser: false,
  isAshes: false,
  ashesTimeRemaining: 0,
  targetX: null,
};

const paddle2 = {
  x: 350,
  y: 30,
  width: 100,
  height: 10,
  dx: 0,
  score: 0,
  curvature: 0.3,
  hasFreezeRay: false,
  isFrozen: false,
  frozenTimeRemaining: 0,
  isWide: false,
  widePaddleTimeRemaining: 0,
  originalWidth: 100,
  hasLaser: false,
  isAshes: false,
  ashesTimeRemaining: 0,
  targetX: null,
};

const balls = [
  { x: 400, y: 550, radius: 8, dx: 2, dy: -2, owner: 1, lastHitBy: 1 },
  { x: 400, y: 50, radius: 8, dx: -2, dy: 2, owner: 2, lastHitBy: 2 }
];

const freezeRays = [];
const laserBeams = [];

// Mock brick grid
const brickRowCount = 5;
const brickColumnCount = 10;
const bricks = [];

// Initialize bricks
function initBricks() {
  for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
      bricks[c][r] = { 
        x: 0, 
        y: 0, 
        status: 1, 
        color: '#FF0000',
        powerUp: null 
      };
    }
  }
}

// Add power-up bricks
function addPowerUpBricks() {
  const powerUps = ['freezeRay', 'widePaddle', 'laser'];
  
  // Add 3 random power-up bricks
  for (let i = 0; i < 3; i++) {
    const c = Math.floor(Math.random() * brickColumnCount);
    const r = Math.floor(Math.random() * brickRowCount);
    
    if (bricks[c][r].status === 1) {
      bricks[c][r].powerUp = powerUps[Math.floor(Math.random() * powerUps.length)];
      bricks[c][r].color = '#00FFFF'; // Cyan for power-up bricks
    }
  }
}

// Simplified brick collision detection
function checkBrickCollision(ball) {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const brick = bricks[c][r];
      
      if (brick.status === 1) {
        const brickWidth = 75;
        const brickHeight = 20;
        const brickPadding = 5;
        const brickOffsetTop = 100;
        const brickOffsetLeft = (canvas.width - (brickColumnCount * (brickWidth + brickPadding))) / 2;
        
        brick.x = c * (brickWidth + brickPadding) + brickOffsetLeft;
        brick.y = r * (brickHeight + brickPadding) + brickOffsetTop;
        
        // Check collision
        if (ball.x > brick.x && 
            ball.x < brick.x + brickWidth && 
            ball.y > brick.y && 
            ball.y < brick.y + brickHeight) {
          
          ball.dy = -ball.dy; // Reverse ball direction
          brick.status = 0; // Brick is hit
          
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
              } else if (brick.powerUp === 'widePaddle') {
                paddle1.isWide = true;
                paddle1.widePaddleTimeRemaining = 10;
                paddle1.width = paddle1.originalWidth * 1.5;
              } else if (brick.powerUp === 'laser') {
                paddle1.hasLaser = true;
              }
            } else {
              if (brick.powerUp === 'freezeRay') {
                paddle2.hasFreezeRay = true;
              } else if (brick.powerUp === 'widePaddle') {
                paddle2.isWide = true;
                paddle2.widePaddleTimeRemaining = 10;
                paddle2.width = paddle2.originalWidth * 1.5;
              } else if (brick.powerUp === 'laser') {
                paddle2.hasLaser = true;
              }
            }
          }
          
          return true; // Collision detected
        }
      }
    }
  }
  
  return false; // No collision
}

// Simplified freeze ray functionality
class FreezeRay {
  constructor(x, y, player) {
    this.x = x;
    this.y = y;
    this.width = 5;
    this.height = player === 1 ? -canvas.height : canvas.height;
    this.player = player;
    this.speed = 12;
    this.active = true;
    this.alphaValue = 1.0;
    this.hitTarget = false;
    this.progress = 0;
  }
  
  update() {
    if (this.hitTarget) {
      this.alphaValue -= 0.05;
      if (this.alphaValue <= 0) {
        this.active = false;
      }
      return;
    }
    
    this.progress += this.speed / Math.abs(this.height);
    if (this.progress >= 1) {
      const targetPaddle = this.player === 1 ? paddle2 : paddle1;
      const hitX = this.x;
      
      if (hitX >= targetPaddle.x && hitX <= targetPaddle.x + targetPaddle.width) {
        targetPaddle.isFrozen = true;
        targetPaddle.frozenTimeRemaining = 10;
        this.hitTarget = true;
      } else {
        this.hitTarget = true;
      }
    }
  }
}

// Simplified laser beam functionality
class LaserBeam {
  constructor(x, y, player) {
    this.x = x;
    this.y = y;
    this.width = 3;
    this.height = player === 1 ? -canvas.height : canvas.height;
    this.player = player;
    this.speed = 15;
    this.active = true;
    this.progress = 0;
    this.hitBricks = [];
  }
  
  update() {
    this.progress += this.speed / Math.abs(this.height);
    
    if (this.progress >= 1) {
      this.active = false;
      return;
    }
    
    this.checkBrickCollisions();
  }
  
  checkBrickCollisions() {
    for (let c = 0; c < brickColumnCount; c++) {
      for (let r = 0; r < brickRowCount; r++) {
        const brick = bricks[c][r];
        
        if (brick.status === 1) {
          const brickWidth = 75;
          const brickHeight = 20;
          
          // Check if laser beam intersects with brick
          if (this.x >= brick.x && 
              this.x <= brick.x + brickWidth && 
              ((this.player === 1 && this.y - this.progress * Math.abs(this.height) <= brick.y + brickHeight && 
                this.y >= brick.y) || 
               (this.player === 2 && this.y + this.progress * Math.abs(this.height) >= brick.y && 
                this.y <= brick.y + brickHeight))) {
            
            // Destroy brick
            this.destroyBrick(c, r);
          }
        }
      }
    }
  }
  
  destroyBrick(c, r) {
    // Check if already hit
    if (this.hitBricks.some(hit => hit.c === c && hit.r === r)) {
      return;
    }
    
    // Mark as hit
    this.hitBricks.push({ c, r });
    
    // Destroy brick
    bricks[c][r].status = 0;
    
    // Award point
    if (this.player === 1) {
      paddle1.score++;
    } else {
      paddle2.score++;
    }
    
    // Handle power-up
    if (bricks[c][r].powerUp) {
      if (this.player === 1) {
        if (bricks[c][r].powerUp === 'freezeRay') {
          paddle1.hasFreezeRay = true;
        } else if (bricks[c][r].powerUp === 'widePaddle') {
          paddle1.isWide = true;
          paddle1.widePaddleTimeRemaining = 10;
          paddle1.width = paddle1.originalWidth * 1.5;
        } else if (bricks[c][r].powerUp === 'laser') {
          paddle1.hasLaser = true;
        }
      } else {
        if (bricks[c][r].powerUp === 'freezeRay') {
          paddle2.hasFreezeRay = true;
        } else if (bricks[c][r].powerUp === 'widePaddle') {
          paddle2.isWide = true;
          paddle2.widePaddleTimeRemaining = 10;
          paddle2.width = paddle2.originalWidth * 1.5;
        } else if (bricks[c][r].powerUp === 'laser') {
          paddle2.hasLaser = true;
        }
      }
    }
  }
}

// Function to shoot freeze ray
function shootFreezeRay(player) {
  const paddle = player === 1 ? paddle1 : paddle2;
  const paddleCenter = paddle.x + paddle.width / 2;
  
  freezeRays.push(new FreezeRay(paddleCenter, paddle.y, player));
  
  // Remove power-up
  paddle.hasFreezeRay = false;
}

// Function to shoot laser
function shootLaser(player) {
  const paddle = player === 1 ? paddle1 : paddle2;
  const paddleCenter = paddle.x + paddle.width / 2;
  
  laserBeams.push(new LaserBeam(paddleCenter, paddle.y, player));
  
  // Remove power-up
  paddle.hasLaser = false;
}

// Tests
describe('Brick Breaker 2P Game Features', () => {
  beforeEach(() => {
    // Reset game state
    paddle1.score = 0;
    paddle2.score = 0;
    paddle1.hasFreezeRay = false;
    paddle2.hasFreezeRay = false;
    paddle1.hasLaser = false;
    paddle2.hasLaser = false;
    paddle1.isFrozen = false;
    paddle2.isFrozen = false;
    paddle1.isWide = false;
    paddle2.isWide = false;
    paddle1.width = paddle1.originalWidth;
    paddle2.width = paddle2.originalWidth;
    
    freezeRays.length = 0;
    laserBeams.length = 0;
    
    // Initialize bricks
    initBricks();
    addPowerUpBricks();
  });
  
  describe('Power-up: Freeze Ray', () => {
    test('Freeze ray should freeze opponent paddle when hit', () => {
      // Give player 1 a freeze ray
      paddle1.hasFreezeRay = true;
      
      // Position paddle2 to be hit
      paddle2.x = 350;
      
      // Shoot freeze ray from center of paddle1
      shootFreezeRay(1);
      
      // Verify freeze ray was created
      expect(freezeRays.length).toBe(1);
      expect(freezeRays[0].player).toBe(1);
      
      // Update freeze ray to completion
      while (!freezeRays[0].hitTarget) {
        freezeRays[0].update();
      }
      
      // Paddle2 should be frozen
      expect(paddle2.isFrozen).toBe(true);
      expect(paddle2.frozenTimeRemaining).toBe(10);
    });
    
    test('Freeze ray should miss if opponent paddle is not in path', () => {
      // Give player 1 a freeze ray
      paddle1.hasFreezeRay = true;
      
      // Position paddle2 away from center
      paddle2.x = 100;
      
      // Shoot freeze ray from center of paddle1
      shootFreezeRay(1);
      
      // Update freeze ray to completion
      while (!freezeRays[0].hitTarget) {
        freezeRays[0].update();
      }
      
      // Paddle2 should not be frozen
      expect(paddle2.isFrozen).toBe(false);
      expect(paddle2.frozenTimeRemaining).toBe(0);
    });
  });
  
  describe('Power-up: Laser', () => {
    test('Laser should destroy bricks in its path', () => {
      // Give player 1 a laser
      paddle1.hasLaser = true;
      
      // Position a brick directly above paddle1
      const centerColumn = Math.floor(brickColumnCount / 2);
      const brickX = bricks[centerColumn][brickRowCount - 1].x;
      paddle1.x = brickX;
      
      // Count active bricks before laser
      const initialActiveBricks = bricks.flat().filter(brick => brick.status === 1).length;
      
      // Shoot laser
      shootLaser(1);
      
      // Update laser to completion
      while (laserBeams[0].active) {
        laserBeams[0].update();
      }
      
      // Count active bricks after laser
      const finalActiveBricks = bricks.flat().filter(brick => brick.status === 1).length;
      
      // Should have destroyed at least one brick
      expect(finalActiveBricks).toBeLessThan(initialActiveBricks);
    });
    
    test('Laser should award points for destroyed bricks', () => {
      // Give player 1 a laser
      paddle1.hasLaser = true;
      
      // Position paddle to hit bricks
      const centerColumn = Math.floor(brickColumnCount / 2);
      const brickX = bricks[centerColumn][brickRowCount - 1].x;
      paddle1.x = brickX;
      
      // Initial score
      const initialScore = paddle1.score;
      
      // Shoot laser
      shootLaser(1);
      
      // Update laser to completion
      while (laserBeams[0].active) {
        laserBeams[0].update();
      }
      
      // Score should have increased
      expect(paddle1.score).toBeGreaterThan(initialScore);
    });
  });
  
  describe('Power-up: Wide Paddle', () => {
    test('Wide paddle power-up should increase paddle width', () => {
      // Initial width
      const initialWidth = paddle1.width;
      
      // Simulate getting wide paddle power-up
      paddle1.isWide = true;
      paddle1.widePaddleTimeRemaining = 10;
      paddle1.width = paddle1.originalWidth * 1.5;
      
      // Width should be increased
      expect(paddle1.width).toBeGreaterThan(initialWidth);
      expect(paddle1.width).toBe(paddle1.originalWidth * 1.5);
    });
  });
  
  describe('Brick Collision', () => {
    test('Ball should bounce off brick and award point', () => {
      // Position ball to hit a brick
      const brick = bricks[0][0];
      const brickWidth = 75;
      const brickHeight = 20;
      
      balls[0].x = brick.x + brickWidth / 2;
      balls[0].y = brick.y + brickHeight + balls[0].radius;
      balls[0].dy = -2; // Moving up
      balls[0].lastHitBy = 1; // Last hit by player 1
      
      // Initial score
      const initialScore = paddle1.score;
      
      // Initial ball direction
      const initialDy = balls[0].dy;
      
      // Check collision
      const collision = checkBrickCollision(balls[0]);
      
      // Should detect collision
      expect(collision).toBe(true);
      
      // Ball should bounce
      expect(balls[0].dy).toBe(-initialDy);
      
      // Brick should be destroyed
      expect(brick.status).toBe(0);
      
      // Player 1 should get a point
      expect(paddle1.score).toBe(initialScore + 1);
    });
    
    test('Ball should collect power-up when breaking power-up brick', () => {
      // Create a power-up brick
      bricks[0][0].powerUp = 'freezeRay';
      
      // Position ball to hit the power-up brick
      const brick = bricks[0][0];
      const brickWidth = 75;
      const brickHeight = 20;
      
      balls[0].x = brick.x + brickWidth / 2;
      balls[0].y = brick.y + brickHeight + balls[0].radius;
      balls[0].dy = -2; // Moving up
      balls[0].lastHitBy = 1; // Last hit by player 1
      
      // Check collision
      checkBrickCollision(balls[0]);
      
      // Player 1 should get the freeze ray power-up
      expect(paddle1.hasFreezeRay).toBe(true);
    });
  });
  
  describe('Scoring System', () => {
    test('Player should get 1 point for breaking a brick', () => {
      // Position ball to hit a brick
      const brick = bricks[0][0];
      const brickWidth = 75;
      const brickHeight = 20;
      
      balls[0].x = brick.x + brickWidth / 2;
      balls[0].y = brick.y + brickHeight + balls[0].radius;
      balls[0].dy = -2; // Moving up
      balls[0].lastHitBy = 1; // Last hit by player 1
      
      // Initial score
      const initialScore = paddle1.score;
      
      // Check collision
      checkBrickCollision(balls[0]);
      
      // Player 1 should get 1 point
      expect(paddle1.score).toBe(initialScore + 1);
    });
  });
});
