# Brick Breaker 2P

A two-player version of the classic Brick Breaker game with enhanced features and touch screen controls.

## Features

- **Two-player gameplay**: Play against a friend or AI
- **Ball Physics**: Frame-independent movement with adjustable speed and size
- **Power-ups**:
  - Freeze ray to temporarily disable opponent's paddle
  - Wide paddle to increase paddle size
  - Laser to destroy bricks in a straight line
- **Multiple brick patterns**: Standard, Checkerboard, Diamond, Random, Zigzag
- **Scoring System**: 
  - 1 point for breaking a brick
  - 2 points for getting a ball past opponent's border
- **Controls**:
  - **Keyboard**: 
    - Player 1: Arrow keys for movement, Space to shoot
    - Player 2: A/D keys for movement, S to shoot
  - **Mouse**: Move paddle with mouse (Player 1 in PvA mode)
  - **Touch**: 
    - Bottom half of screen controls Player 1
    - Top half of screen controls Player 2
    - Tap in center area to shoot power-ups

## Getting Started

1. Clone the repository
2. Open `index.html` in your browser
3. Select game mode and start playing!

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

To start a local development server:

```bash
npx http-server -c-1
```

## License

MIT
