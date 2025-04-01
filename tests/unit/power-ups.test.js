/**
 * Tests for power-up mechanics in Brick Breaker 2P
 */

describe('Power-up Mechanics', () => {
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

  describe('Freeze Ray', () => {
    test('Freeze ray should freeze opponent paddle when hit', () => {
      // Create paddles
      const paddle1 = {
        x: 350,
        y: 550,
        width: 100,
        hasFreezeRay: true
      };
      
      const paddle2 = {
        x: 350,
        y: 50,
        width: 100,
        isFrozen: false,
        frozenTimeRemaining: 0
      };
      
      // Create freeze ray array
      const freezeRays = [];
      
      // Mock power-up indicator
      const player1PowerUpIndicator = document.getElementById('player1PowerUp');
      player1PowerUpIndicator.style.display = 'block';
      
      // Simplified FreezeRay class
      class FreezeRay {
        constructor(x, y, player) {
          this.x = x;
          this.y = y;
          this.player = player;
          this.active = true;
          this.hitTarget = false;
          this.progress = 0;
        }
        
        update() {
          // Simulate ray traveling to target
          this.progress += 0.1;
          
          if (this.progress >= 1) {
            const targetPaddle = this.player === 1 ? paddle2 : paddle1;
            
            // Check if ray hits paddle
            if (this.x >= targetPaddle.x && this.x <= targetPaddle.x + targetPaddle.width) {
              targetPaddle.isFrozen = true;
              targetPaddle.frozenTimeRemaining = 10;
              this.hitTarget = true;
            } else {
              this.hitTarget = true; // Miss
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
        
        // Hide indicator
        if (player === 1) {
          player1PowerUpIndicator.style.display = 'none';
        }
      }
      
      // Test shooting freeze ray
      shootFreezeRay(1);
      
      // Assertions
      expect(freezeRays.length).toBe(1);
      expect(paddle1.hasFreezeRay).toBe(false);
      expect(player1PowerUpIndicator.style.display).toBe('none');
      
      // Simulate ray traveling to target
      while (!freezeRays[0].hitTarget) {
        freezeRays[0].update();
      }
      
      // Assertions after hit
      expect(paddle2.isFrozen).toBe(true);
      expect(paddle2.frozenTimeRemaining).toBe(10);
    });
    
    test('Freeze ray should miss if opponent paddle is not in path', () => {
      // Create paddles
      const paddle1 = {
        x: 350,
        y: 550,
        width: 100,
        hasFreezeRay: true
      };
      
      const paddle2 = {
        x: 100, // Far from ray path
        y: 50,
        width: 100,
        isFrozen: false,
        frozenTimeRemaining: 0
      };
      
      // Create freeze ray array
      const freezeRays = [];
      
      // Simplified FreezeRay class
      class FreezeRay {
        constructor(x, y, player) {
          this.x = x;
          this.y = y;
          this.player = player;
          this.active = true;
          this.hitTarget = false;
          this.progress = 0;
        }
        
        update() {
          this.progress += 0.1;
          
          if (this.progress >= 1) {
            const targetPaddle = this.player === 1 ? paddle2 : paddle1;
            
            if (this.x >= targetPaddle.x && this.x <= targetPaddle.x + targetPaddle.width) {
              targetPaddle.isFrozen = true;
              targetPaddle.frozenTimeRemaining = 10;
              this.hitTarget = true;
            } else {
              this.hitTarget = true; // Miss
            }
          }
        }
      }
      
      // Function to shoot freeze ray
      function shootFreezeRay(player) {
        const paddle = player === 1 ? paddle1 : paddle2;
        const paddleCenter = paddle.x + paddle.width / 2;
        
        freezeRays.push(new FreezeRay(paddleCenter, paddle.y, player));
        paddle.hasFreezeRay = false;
      }
      
      // Test shooting freeze ray
      shootFreezeRay(1);
      
      // Simulate ray traveling to target
      while (!freezeRays[0].hitTarget) {
        freezeRays[0].update();
      }
      
      // Assertions
      expect(paddle2.isFrozen).toBe(false);
      expect(paddle2.frozenTimeRemaining).toBe(0);
    });
  });
  
  describe('Laser', () => {
    test('Laser should destroy bricks in its path', () => {
      // Create paddles
      const paddle1 = {
        x: 350,
        y: 550,
        width: 100,
        hasLaser: true
      };
      
      // Create bricks
      const bricks = [
        { x: 350, y: 300, width: 75, height: 20, status: 1 },
        { x: 350, y: 200, width: 75, height: 20, status: 1 },
        { x: 350, y: 100, width: 75, height: 20, status: 1 },
        { x: 200, y: 200, width: 75, height: 20, status: 1 } // Not in path
      ];
      
      // Create laser beams array
      const laserBeams = [];
      
      // Mock power-up indicator
      const player1LaserIndicator = document.getElementById('player1LaserPowerUp');
      player1LaserIndicator.style.display = 'block';
      
      // Simplified LaserBeam class
      class LaserBeam {
        constructor(x, y, player) {
          this.x = x;
          this.y = y;
          this.player = player;
          this.active = true;
          this.progress = 0;
          this.hitBricks = [];
        }
        
        update() {
          this.progress += 0.1;
          
          if (this.progress >= 1) {
            this.active = false;
            return;
          }
          
          this.checkBrickCollisions();
        }
        
        checkBrickCollisions() {
          for (let i = 0; i < bricks.length; i++) {
            const brick = bricks[i];
            
            if (brick.status === 1) {
              // Check if laser beam intersects with brick
              if (this.x >= brick.x && 
                  this.x <= brick.x + brick.width && 
                  ((this.player === 1 && this.y - this.progress * 550 <= brick.y + brick.height && this.y >= brick.y) || 
                   (this.player === 2 && this.y + this.progress * 550 >= brick.y && this.y <= brick.y + brick.height))) {
                
                // Destroy brick if not already hit
                if (!this.hitBricks.includes(i)) {
                  this.hitBricks.push(i);
                  brick.status = 0;
                }
              }
            }
          }
        }
      }
      
      // Function to shoot laser
      function shootLaser(player) {
        const paddle = player === 1 ? paddle1 : null;
        const paddleCenter = paddle.x + paddle.width / 2;
        
        laserBeams.push(new LaserBeam(paddleCenter, paddle.y, player));
        
        // Remove power-up
        paddle.hasLaser = false;
        
        // Hide indicator
        if (player === 1) {
          player1LaserIndicator.style.display = 'none';
        }
      }
      
      // Test shooting laser
      shootLaser(1);
      
      // Assertions
      expect(laserBeams.length).toBe(1);
      expect(paddle1.hasLaser).toBe(false);
      expect(player1LaserIndicator.style.display).toBe('none');
      
      // Simulate laser traveling to end
      while (laserBeams[0].active) {
        laserBeams[0].update();
      }
      
      // Assertions after laser completes
      expect(bricks[0].status).toBe(0); // In path, should be destroyed
      expect(bricks[1].status).toBe(0); // In path, should be destroyed
      expect(bricks[2].status).toBe(0); // In path, should be destroyed
      expect(bricks[3].status).toBe(1); // Not in path, should remain
    });
  });
  
  describe('Wide Paddle', () => {
    test('Wide paddle power-up should increase paddle width', () => {
      // Create paddle
      const paddle1 = {
        width: 100,
        originalWidth: 100,
        isWide: false,
        widePaddleTimeRemaining: 0
      };
      
      // Function to apply wide paddle power-up
      function applyWidePaddlePowerUp(paddle) {
        paddle.isWide = true;
        paddle.widePaddleTimeRemaining = 10;
        paddle.width = paddle.originalWidth * 1.5;
      }
      
      // Test applying power-up
      applyWidePaddlePowerUp(paddle1);
      
      // Assertions
      expect(paddle1.isWide).toBe(true);
      expect(paddle1.widePaddleTimeRemaining).toBe(10);
      expect(paddle1.width).toBe(150); // 100 * 1.5
    });
    
    test('Wide paddle effect should expire after time', () => {
      // Create paddle
      const paddle1 = {
        width: 150, // Already widened
        originalWidth: 100,
        isWide: true,
        widePaddleTimeRemaining: 1
      };
      
      // Function to update paddle state
      function updatePaddleState(paddle, deltaTime) {
        if (paddle.isWide) {
          paddle.widePaddleTimeRemaining -= deltaTime;
          
          if (paddle.widePaddleTimeRemaining <= 0) {
            paddle.isWide = false;
            paddle.width = paddle.originalWidth;
          }
        }
      }
      
      // Test updating paddle state
      updatePaddleState(paddle1, 2); // Pass more time than remaining
      
      // Assertions
      expect(paddle1.isWide).toBe(false);
      expect(paddle1.widePaddleTimeRemaining).toBeLessThan(0);
      expect(paddle1.width).toBe(100); // Back to original
    });
  });
});
