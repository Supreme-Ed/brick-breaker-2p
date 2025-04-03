# Brick Breaker 2P

A two-player version of the classic Brick Breaker game with enhanced features and touch screen controls.

## Features

- **Game Modes**:
  - Player vs Player: Two human players compete against each other
  - Player vs AI: Play against an AI opponent with adjustable difficulty
  - AI vs AI: Watch two AI opponents play against each other (demonstration mode)
- **Improved UI**:
  - Collapsible controls help section on the start screen.
  - In-game top bar displaying scores and control buttons (Menu, Restart, Pause).
- **Ball Physics**: Frame-independent movement with adjustable speed and size
- **Power-ups**:
  - Freeze ray to temporarily disable opponent's paddle
  - Wide paddle to increase paddle size
  - Laser to destroy bricks in a straight line and temporarily turn opponent paddle to ash
- **Pause/Resume**: Pause and resume the game using the 'P' key or the dedicated UI button.
- **Multiple brick patterns**: Standard, Checkerboard, Diamond, Random, Zigzag
- **Audio**: Sound effects using the Web Audio API, loaded from audio files.
- **Scoring System**: 
  - 5 points for breaking a brick
  - 5 points for lasering a brick
  - 10 points for getting a ball past opponent's boundary
  - 20 points bonus when all bricks are cleared
  - Currently no score limit or win condition based on points
- **Controls**:
  - **Keyboard**: 
    - Player 1: Arrow keys for movement, Space to shoot
    - Player 2: A/D keys for movement, S to shoot
  - **Mouse**: Move paddle with mouse (Player 1 in PvA or Single Player mode), Click anywhere on the game canvas to shoot power-up.
  - **Touch**: 
    - Player 1 (Bottom): Touch & Drag lower screen half (Move), Tap lower screen half (Power-up)
    - Player 2 (Top): Touch & Drag upper screen half (Move), Tap upper screen half (Power-up)
  - **Pause/Resume**: 'P' Key or Pause/Resume Button
  - **Return to Menu**: ESC Key or Return to Menu Button

## Getting Started

1. Clone the repository
2. Install dependencies (required for running tests):
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run start
   ```
4. Open the provided URL in your browser (typically http://localhost:5173)
5. Select game mode and start playing!

## Technology

- Vanilla JavaScript for game logic and rendering
- HTML5 Canvas for graphics
- CSS for styling and UI elements
- Vite for development server and production builds
- Jest for unit testing
- Playwright for end-to-end testing

## Testing

The game includes unit tests and end-to-end tests for game logic and touch controls.

To run tests:

```bash
# Install dependencies
npm install

# Run unit tests
npm test

# Run end-to-end tests (requires a running server)
npm run test:e2e
```

## Development

To start the local development server (with hot reloading):

```bash
npm run start
```

## Building for Production

To create an optimized production build (outputs to `dist/` directory, removes debug logs):

```bash
npm run build
```

## License

MIT
