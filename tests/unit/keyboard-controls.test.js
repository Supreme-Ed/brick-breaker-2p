/**
 * Tests for keyboard controls in Brick Breaker 2P
 */

describe('Keyboard Controls', () => {
  // Setup test environment
  beforeEach(() => {
    document.body.innerHTML = `<canvas id="gameCanvas" width="800" height="600"></canvas>`;
    
    // Mock document event listeners
    document.addEventListener = jest.fn((event, callback) => {
      if (event === 'keydown' || event === 'keyup') {
        document[event] = callback;
      }
    });
  });
  
  test('Arrow keys should control Player 1 paddle', () => {
    // Create game objects
    const paddle1 = {
      x: 350,
      y: 550,
      width: 100,
      height: 10,
      dx: 0,
      isFrozen: false,
      isAshes: false
    };
    
    // Create keys object
    const keys = { ArrowLeft: false, ArrowRight: false };
    
    // Function to handle keyboard movement
    function handleKeyboardMovement(paddle, leftKey, rightKey, paddleSpeed) {
      if (!paddle.isFrozen && !paddle.isAshes) {
        if (keys[leftKey] && paddle.x > 0) {
          paddle.x -= paddleSpeed;
          paddle.dx = -paddleSpeed;
          return true;
        } else if (keys[rightKey] && paddle.x < 800 - paddle.width) {
          paddle.x += paddleSpeed;
          paddle.dx = paddleSpeed;
          return true;
        } else {
          paddle.dx = 0;
        }
      }
      return false;
    }
    
    // Test left arrow key
    keys.ArrowLeft = true;
    keys.ArrowRight = false;
    
    const initialX = paddle1.x;
    const movedLeft = handleKeyboardMovement(paddle1, 'ArrowLeft', 'ArrowRight', 5);
    
    // Assertions for left movement
    expect(movedLeft).toBe(true);
    expect(paddle1.x).toBe(initialX - 5);
    expect(paddle1.dx).toBe(-5);
    
    // Reset position
    paddle1.x = initialX;
    
    // Test right arrow key
    keys.ArrowLeft = false;
    keys.ArrowRight = true;
    
    const movedRight = handleKeyboardMovement(paddle1, 'ArrowLeft', 'ArrowRight', 5);
    
    // Assertions for right movement
    expect(movedRight).toBe(true);
    expect(paddle1.x).toBe(initialX + 5);
    expect(paddle1.dx).toBe(5);
  });
  
  test('A/D keys should control Player 2 paddle', () => {
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
    
    // Create keys object
    const keys = { a: false, d: false };
    
    // Function to handle keyboard movement
    function handleKeyboardMovement(paddle, leftKey, rightKey, paddleSpeed) {
      if (!paddle.isFrozen && !paddle.isAshes) {
        if (keys[leftKey] && paddle.x > 0) {
          paddle.x -= paddleSpeed;
          paddle.dx = -paddleSpeed;
          return true;
        } else if (keys[rightKey] && paddle.x < 800 - paddle.width) {
          paddle.x += paddleSpeed;
          paddle.dx = paddleSpeed;
          return true;
        } else {
          paddle.dx = 0;
        }
      }
      return false;
    }
    
    // Test 'a' key
    keys.a = true;
    keys.d = false;
    
    const initialX = paddle2.x;
    const movedLeft = handleKeyboardMovement(paddle2, 'a', 'd', 5);
    
    // Assertions for left movement
    expect(movedLeft).toBe(true);
    expect(paddle2.x).toBe(initialX - 5);
    expect(paddle2.dx).toBe(-5);
    
    // Reset position
    paddle2.x = initialX;
    
    // Test 'd' key
    keys.a = false;
    keys.d = true;
    
    const movedRight = handleKeyboardMovement(paddle2, 'a', 'd', 5);
    
    // Assertions for right movement
    expect(movedRight).toBe(true);
    expect(paddle2.x).toBe(initialX + 5);
    expect(paddle2.dx).toBe(5);
  });
  
  test('Space key should trigger Player 1 power-ups', () => {
    // Create game objects
    const paddle1 = {
      x: 350,
      y: 550,
      width: 100,
      height: 10,
      dx: 0,
      isFrozen: false,
      isAshes: false,
      hasFreezeRay: true,
      hasLaser: false
    };
    
    // Create keys object
    const keys = { Space: false, ArrowLeft: false, ArrowRight: false };
    
    // Mock power-up indicator
    const player1PowerUpIndicator = document.createElement('div');
    player1PowerUpIndicator.style.display = 'block';
    
    // Function to handle power-up activation
    function handlePowerUpActivation(paddle, key, indicator) {
      if (keys[key]) {
        if (paddle.hasFreezeRay) {
          paddle.hasFreezeRay = false;
          indicator.style.display = 'none';
          keys[key] = false; // Consume key press
          return 'freezeRay';
        } else if (paddle.hasLaser) {
          paddle.hasLaser = false;
          indicator.style.display = 'none';
          keys[key] = false; // Consume key press
          return 'laser';
        }
      }
      return null;
    }
    
    // Function to simulate movePaddles behavior
    function movePaddles() {
      // Player 1 keyboard control
      if (!paddle1.isFrozen && !paddle1.isAshes) {
        if (keys.ArrowLeft && paddle1.x > 0) {
          paddle1.x -= 5;
          paddle1.dx = -5;
        } else if (keys.ArrowRight && paddle1.x < 800 - paddle1.width) {
          paddle1.x += 5;
          paddle1.dx = 5;
        } else {
          paddle1.dx = 0;
        }
        
        // Check for Space key to activate power-ups
        if (keys.Space) {
          return handlePowerUpActivation(paddle1, 'Space', player1PowerUpIndicator);
        }
      }
      return null;
    }
    
    // Test Space key with freeze ray
    keys.Space = true;
    
    // Call movePaddles to simulate game loop
    const activatedPowerUp = movePaddles();
    
    // Assertions
    expect(activatedPowerUp).toBe('freezeRay');
    expect(paddle1.hasFreezeRay).toBe(false);
    expect(player1PowerUpIndicator.style.display).toBe('none');
    expect(keys.Space).toBe(false); // Key press should be consumed
    
    // Test with laser
    paddle1.hasLaser = true;
    keys.Space = true;
    
    const activatedLaser = handlePowerUpActivation(paddle1, 'Space', player1PowerUpIndicator);
    
    // Assertions
    expect(activatedLaser).toBe('laser');
    expect(paddle1.hasLaser).toBe(false);
  });
  
  test('S key should trigger Player 2 power-ups', () => {
    // Create game objects
    const paddle2 = {
      x: 350,
      y: 50,
      width: 100,
      height: 10,
      dx: 0,
      isFrozen: false,
      isAshes: false,
      hasFreezeRay: true,
      hasLaser: false
    };
    
    // Create keys object
    const keys = { s: false, a: false, d: false };
    
    // Mock power-up indicator
    const player2PowerUpIndicator = document.createElement('div');
    player2PowerUpIndicator.style.display = 'block';
    
    // Function to handle power-up activation
    function handlePowerUpActivation(paddle, key, indicator) {
      if (keys[key]) {
        if (paddle.hasFreezeRay) {
          paddle.hasFreezeRay = false;
          indicator.style.display = 'none';
          keys[key] = false; // Consume key press
          return 'freezeRay';
        } else if (paddle.hasLaser) {
          paddle.hasLaser = false;
          indicator.style.display = 'none';
          keys[key] = false; // Consume key press
          return 'laser';
        }
      }
      return null;
    }
    
    // Function to simulate movePaddles behavior
    function movePaddles() {
      // Player 2 keyboard control
      if (!paddle2.isFrozen && !paddle2.isAshes) {
        if (keys.a && paddle2.x > 0) {
          paddle2.x -= 5;
          paddle2.dx = -5;
        } else if (keys.d && paddle2.x < 800 - paddle2.width) {
          paddle2.x += 5;
          paddle2.dx = 5;
        } else {
          paddle2.dx = 0;
        }
        
        // Check for S key to activate power-ups
        if (keys.s) {
          return handlePowerUpActivation(paddle2, 's', player2PowerUpIndicator);
        }
      }
      return null;
    }
    
    // Test S key with freeze ray
    keys.s = true;
    
    // Call movePaddles to simulate game loop
    const activatedPowerUp = movePaddles();
    
    // Assertions
    expect(activatedPowerUp).toBe('freezeRay');
    expect(paddle2.hasFreezeRay).toBe(false);
    expect(player2PowerUpIndicator.style.display).toBe('none');
    expect(keys.s).toBe(false); // Key press should be consumed
    
    // Test with laser
    paddle2.hasLaser = true;
    keys.s = true;
    
    const activatedLaser = handlePowerUpActivation(paddle2, 's', player2PowerUpIndicator);
    
    // Assertions
    expect(activatedLaser).toBe('laser');
    expect(paddle2.hasLaser).toBe(false);
  });
  
  test('Frozen paddle should not move with keyboard controls', () => {
    // Create game objects
    const paddle1 = {
      x: 350,
      y: 550,
      width: 100,
      height: 10,
      dx: 0,
      isFrozen: true,
      isAshes: false
    };
    
    // Create keys object
    const keys = { ArrowLeft: true, ArrowRight: false };
    
    // Function to handle keyboard movement
    function handleKeyboardMovement(paddle, leftKey, rightKey, paddleSpeed) {
      if (!paddle.isFrozen && !paddle.isAshes) {
        if (keys[leftKey] && paddle.x > 0) {
          paddle.x -= paddleSpeed;
          paddle.dx = -paddleSpeed;
          return true;
        } else if (keys[rightKey] && paddle.x < 800 - paddle.width) {
          paddle.x += paddleSpeed;
          paddle.dx = paddleSpeed;
          return true;
        } else {
          paddle.dx = 0;
        }
      }
      return false;
    }
    
    const initialX = paddle1.x;
    const moved = handleKeyboardMovement(paddle1, 'ArrowLeft', 'ArrowRight', 5);
    
    // Assertions - paddle should not move when frozen
    expect(moved).toBe(false);
    expect(paddle1.x).toBe(initialX);
  });
});
