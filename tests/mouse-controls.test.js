/**
 * Tests for mouse controls in Brick Breaker 2P
 */

describe('Mouse Controls', () => {
  // Setup test environment
  beforeEach(() => {
    document.body.innerHTML = `<canvas id="gameCanvas" width="800" height="600"></canvas>`;
    
    // Mock canvas getBoundingClientRect
    Element.prototype.getBoundingClientRect = jest.fn(() => {
      return {
        left: 0,
        top: 0,
        width: 800,
        height: 600
      };
    });
    
    // Mock document event listeners
    document.addEventListener = jest.fn((event, callback) => {
      if (event === 'mousemove') {
        document[event] = callback;
      }
    });
    
    // Mock canvas event listeners
    HTMLCanvasElement.prototype.addEventListener = jest.fn((event, callback) => {
      if (event === 'mousedown') {
        HTMLCanvasElement.prototype[event] = callback;
      }
    });
  });
  
  test('Mouse movement should update paddle position in mouse control mode', () => {
    // Create game objects
    const paddle1 = {
      x: 350,
      y: 550,
      width: 100,
      height: 10
    };
    
    // Create control method variable
    const player1ControlMethod = 'mouse';
    
    // Function to handle mouse movement
    function handleMouseMove(e, paddle) {
      if (player1ControlMethod === 'mouse') {
        const rect = document.getElementById('gameCanvas').getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        
        // Set paddle position centered on mouse X
        paddle.x = mouseX - paddle.width / 2;
        
        // Keep paddle within bounds
        if (paddle.x < 0) paddle.x = 0;
        if (paddle.x + paddle.width > 800) paddle.x = 800 - paddle.width;
        
        return true;
      }
      return false;
    }
    
    // Create mock mouse event
    const mouseEvent = {
      clientX: 400 // Mouse in center of canvas
    };
    
    // Test mouse movement
    const moved = handleMouseMove(mouseEvent, paddle1);
    
    // Assertions
    expect(moved).toBe(true);
    expect(paddle1.x).toBe(350); // 400 - (100/2)
    
    // Test mouse at left edge
    mouseEvent.clientX = 0;
    handleMouseMove(mouseEvent, paddle1);
    expect(paddle1.x).toBe(0);
    
    // Test mouse at right edge
    mouseEvent.clientX = 800;
    handleMouseMove(mouseEvent, paddle1);
    expect(paddle1.x).toBe(700); // 800 - 100 (paddle width)
  });
  
  test('Mouse movement should not update paddle if control method is not mouse', () => {
    // Create game objects
    const paddle1 = {
      x: 350,
      y: 550,
      width: 100,
      height: 10
    };
    
    // Create control method variable
    const player1ControlMethod = 'keyboard';
    
    // Function to handle mouse movement
    function handleMouseMove(e, paddle) {
      if (player1ControlMethod === 'mouse') {
        const rect = document.getElementById('gameCanvas').getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        
        // Set paddle position centered on mouse X
        paddle.x = mouseX - paddle.width / 2;
        
        return true;
      }
      return false;
    }
    
    // Create mock mouse event
    const mouseEvent = {
      clientX: 400 // Mouse in center of canvas
    };
    
    // Save initial position
    const initialX = paddle1.x;
    
    // Test mouse movement
    const moved = handleMouseMove(mouseEvent, paddle1);
    
    // Assertions
    expect(moved).toBe(false);
    expect(paddle1.x).toBe(initialX); // Position should not change
  });
  
  test('Mouse click should activate power-ups', () => {
    // Create game objects
    const paddle1 = {
      hasFreezeRay: true,
      hasLaser: false,
      x: 350,
      y: 550,
      width: 100
    };
    
    // Mock power-up indicator
    const player1PowerUpIndicator = document.createElement('div');
    player1PowerUpIndicator.style.display = 'block';
    
    // Function to handle mouse click
    function handleMouseDown(e) {
      const rect = document.getElementById('gameCanvas').getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Check if click is in player 1's area (bottom half)
      if (mouseY > 300) {
        if (paddle1.hasFreezeRay) {
          paddle1.hasFreezeRay = false;
          player1PowerUpIndicator.style.display = 'none';
          return 'freezeRay';
        } else if (paddle1.hasLaser) {
          paddle1.hasLaser = false;
          player1PowerUpIndicator.style.display = 'none';
          return 'laser';
        }
      }
      
      return null;
    }
    
    // Create mock mouse event in player 1's area
    const mouseEvent = {
      clientX: 400,
      clientY: 500 // Bottom half
    };
    
    // Test mouse click
    const activatedPowerUp = handleMouseDown(mouseEvent);
    
    // Assertions
    expect(activatedPowerUp).toBe('freezeRay');
    expect(paddle1.hasFreezeRay).toBe(false);
    expect(player1PowerUpIndicator.style.display).toBe('none');
    
    // Test with laser
    paddle1.hasLaser = true;
    
    const activatedLaser = handleMouseDown(mouseEvent);
    
    // Assertions
    expect(activatedLaser).toBe('laser');
    expect(paddle1.hasLaser).toBe(false);
  });
  
  test('Mouse click in player 2 area should not activate player 1 power-ups', () => {
    // Create game objects
    const paddle1 = {
      hasFreezeRay: true,
      hasLaser: false,
      x: 350,
      y: 550,
      width: 100
    };
    
    // Function to handle mouse click
    function handleMouseDown(e) {
      const rect = document.getElementById('gameCanvas').getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Check if click is in player 1's area (bottom half)
      if (mouseY > 300) {
        if (paddle1.hasFreezeRay) {
          paddle1.hasFreezeRay = false;
          return 'freezeRay';
        } else if (paddle1.hasLaser) {
          paddle1.hasLaser = false;
          return 'laser';
        }
      }
      
      return null;
    }
    
    // Create mock mouse event in player 2's area
    const mouseEvent = {
      clientX: 400,
      clientY: 100 // Top half (player 2's area)
    };
    
    // Test mouse click
    const activatedPowerUp = handleMouseDown(mouseEvent);
    
    // Assertions
    expect(activatedPowerUp).toBeNull();
    expect(paddle1.hasFreezeRay).toBe(true); // Should not change
  });
});
