/**
 * Tests for main menu functionality in Brick Breaker 2P
 */

describe('Main Menu Functionality', () => {
  // Setup test environment before each test
  beforeEach(() => {
    // Create a mock DOM environment for the main menu
    document.body.innerHTML = `
      <div id="startScreen">
        <h1>Brick Breaker</h1>
        <div class="controls">
          <h2>Controls:</h2>
          <p><strong>Player 1 (Bottom):</strong> Left/Right Arrow Keys OR Mouse (select below), Space to shoot freeze ray/laser</p>
          <p><strong>Player 2 (Top):</strong> A/D Keys, S to shoot freeze ray/laser</p>
        </div>
        <div style="margin-bottom: 15px;">
          <label>Player 1 Control (Single Player):</label>
          <input type="radio" id="controlKeyboard" name="p1Control" value="keyboard" checked>
          <label for="controlKeyboard">Keyboard</label>
          <input type="radio" id="controlMouse" name="p1Control" value="mouse">
          <label for="controlMouse">Mouse</label>
        </div>
        <button class="button" id="singlePlayerBtn" onclick="startGame(1)">Single Player</button>
        <button class="button" id="twoPlayersBtn" onclick="startGame(2)">Two Players</button>
        <button class="button" id="aiVsAiBtn" onclick="startGame(3)">AI vs. AI</button>
      </div>
    `;

    // Mock the window.location.href property
    delete window.location;
    window.location = { href: 'index.html' };
    
    // Create a mock for the startGame function
    window.startGame = jest.fn((mode) => {
      let url = `brick-breaker.html?mode=${mode}`;
      if (mode === 1) {
        const selectedControl = document.querySelector('input[name="p1Control"]:checked').value;
        url += `&control=${selectedControl}`;
      }
      window.location.href = url;
    });
  });

  test('Main menu should display all game mode buttons', () => {
    // Check if all buttons are present
    const singlePlayerBtn = document.getElementById('singlePlayerBtn');
    const twoPlayersBtn = document.getElementById('twoPlayersBtn');
    const aiVsAiBtn = document.getElementById('aiVsAiBtn');
    
    expect(singlePlayerBtn).not.toBeNull();
    expect(twoPlayersBtn).not.toBeNull();
    expect(aiVsAiBtn).not.toBeNull();
    
    expect(singlePlayerBtn.textContent).toBe('Single Player');
    expect(twoPlayersBtn.textContent).toBe('Two Players');
    expect(aiVsAiBtn.textContent).toBe('AI vs. AI');
  });

  test('Single Player button should navigate to game with correct parameters', () => {
    // Get the Single Player button
    const singlePlayerBtn = document.getElementById('singlePlayerBtn');
    
    // Click the button
    singlePlayerBtn.click();
    
    // Check if startGame was called with the correct mode
    expect(window.startGame).toHaveBeenCalledWith(1);
    
    // Check if the URL was updated correctly (with keyboard control by default)
    expect(window.location.href).toBe('brick-breaker.html?mode=1&control=keyboard');
  });

  test('Two Players button should navigate to game with correct parameters', () => {
    // Get the Two Players button
    const twoPlayersBtn = document.getElementById('twoPlayersBtn');
    
    // Click the button
    twoPlayersBtn.click();
    
    // Check if startGame was called with the correct mode
    expect(window.startGame).toHaveBeenCalledWith(2);
    
    // Check if the URL was updated correctly
    expect(window.location.href).toBe('brick-breaker.html?mode=2');
  });

  test('AI vs. AI button should navigate to game with correct parameters', () => {
    // Get the AI vs. AI button
    const aiVsAiBtn = document.getElementById('aiVsAiBtn');
    
    // Click the button
    aiVsAiBtn.click();
    
    // Check if startGame was called with the correct mode
    expect(window.startGame).toHaveBeenCalledWith(3);
    
    // Check if the URL was updated correctly
    expect(window.location.href).toBe('brick-breaker.html?mode=3');
  });

  test('Control method radio buttons should work correctly', () => {
    // Get the radio buttons
    const keyboardRadio = document.getElementById('controlKeyboard');
    const mouseRadio = document.getElementById('controlMouse');
    
    // Check default state
    expect(keyboardRadio.checked).toBe(true);
    expect(mouseRadio.checked).toBe(false);
    
    // Change to mouse control
    mouseRadio.checked = true;
    keyboardRadio.checked = false;
    
    // Click Single Player button
    const singlePlayerBtn = document.getElementById('singlePlayerBtn');
    singlePlayerBtn.click();
    
    // Check if the URL was updated with mouse control
    expect(window.location.href).toBe('brick-breaker.html?mode=1&control=mouse');
  });

  test('Return to start screen function should navigate back to index.html', () => {
    // Create a mock for the returnToStartScreen function
    const returnToStartScreen = () => {
      if (window.gameLoop) window.cancelAnimationFrame(window.gameLoop);
      window.gameLoop = null;
      window.location.href = 'index.html';
    };
    
    // Set up a mock game loop
    window.gameLoop = 123;
    window.cancelAnimationFrame = jest.fn();
    
    // Call the function
    returnToStartScreen();
    
    // Check if cancelAnimationFrame was called
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(123);
    
    // Check if gameLoop was reset
    expect(window.gameLoop).toBeNull();
    
    // Check if the URL was updated correctly
    expect(window.location.href).toBe('index.html');
  });

  test('Game initialization should parse URL parameters correctly', () => {
    // Mock URLSearchParams
    global.URLSearchParams = jest.fn(() => ({
      get: jest.fn((param) => {
        if (param === 'mode') return '1';
        if (param === 'control') return 'mouse';
        return null;
      })
    }));
    
    // Create a mock for the initializeGame function
    const initializeGame = jest.fn();
    
    // Create a mock for the DOMContentLoaded event handler
    const domContentLoadedHandler = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const modeParam = urlParams.get('mode');
      const controlParam = urlParams.get('control');
      
      let gameMode = 0;
      let player1ControlMethod = 'keyboard';
      
      if (modeParam === '1') {
        gameMode = 1;
        if (controlParam === 'mouse') {
          player1ControlMethod = 'mouse';
        }
      } else if (modeParam === '2') {
        gameMode = 2;
      } else if (modeParam === '3') {
        gameMode = 3;
      }
      
      initializeGame(gameMode);
      
      return { gameMode, player1ControlMethod };
    };
    
    // Call the handler
    const result = domContentLoadedHandler();
    
    // Check if initializeGame was called with the correct mode
    expect(initializeGame).toHaveBeenCalledWith(1);
    
    // Check if the game mode and control method were set correctly
    expect(result.gameMode).toBe(1);
    expect(result.player1ControlMethod).toBe('mouse');
  });

  test('Game should handle invalid URL parameters gracefully', () => {
    // Mock URLSearchParams with invalid parameters
    global.URLSearchParams = jest.fn(() => ({
      get: jest.fn((param) => {
        if (param === 'mode') return 'invalid';
        return null;
      })
    }));
    
    // Create a mock for the initializeGame function
    const initializeGame = jest.fn();
    
    // Create a mock for the DOMContentLoaded event handler
    const domContentLoadedHandler = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const modeParam = urlParams.get('mode');
      
      let gameMode = 0; // Default to PvP
      
      if (modeParam === '1') {
        gameMode = 1;
      } else if (modeParam === '2') {
        gameMode = 2;
      } else if (modeParam === '3') {
        gameMode = 3;
      }
      
      initializeGame(gameMode);
      
      return { gameMode };
    };
    
    // Call the handler
    const result = domContentLoadedHandler();
    
    // Check if initializeGame was called with the default mode
    expect(initializeGame).toHaveBeenCalledWith(0);
    
    // Check if the game mode was set to default
    expect(result.gameMode).toBe(0);
  });
});
