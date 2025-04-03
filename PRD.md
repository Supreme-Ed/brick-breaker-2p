# Brick Breaker 2P - Product Requirements Document

## 1. Introduction

### 1.1 Purpose
This document outlines the requirements and specifications for Brick Breaker 2P, a modern multiplayer reimagining of the classic brick breaker arcade game. The game features two-player competitive gameplay, power-ups, multiple control methods, and AI opponents.

### 1.2 Product Overview
Brick Breaker 2P is a web-based game that allows players to compete against each other or AI opponents in a vertically mirrored playing field. Each player controls a paddle and attempts to break bricks while preventing balls from crossing their boundary. The game includes various power-ups, multiple brick patterns, and different control schemes to accommodate player preferences.

### 1.3 Target Audience
- Casual gamers looking for quick, engaging gameplay sessions
- Fans of classic arcade games
- Players who enjoy competitive multiplayer experiences
- Users of all ages and skill levels

## 2. Game Modes

### 2.1 Single Player Mode
- Player 1 (human) controls the bottom paddle
- Player 2 (AI) controls the top paddle
- AI difficulty scales based on player performance
- Choice between keyboard or mouse controls for human player

### 2.2 Two Player Mode
- Two human players compete against each other
- Player 1 controls the bottom paddle
- Player 2 controls the top paddle
- Each player has their own control scheme

### 2.3 AI vs. AI Mode
- Demonstration mode where two AI opponents play against each other
- Useful for learning game mechanics and strategies
- Adjustable AI difficulty and behavior patterns

## 3. Game Mechanics

### 3.1 Core Gameplay
- Each player controls a paddle at opposite ends of the screen
- Players must prevent balls from crossing their boundary
- Players score points by breaking bricks and getting balls past the opponent
- When all bricks are cleared, a new pattern is generated

### 3.2 Scoring System
- 5 points for breaking a brick
- 5 points for lasering a brick
- 10 points for getting a ball past opponent's boundary
- 20 points bonus when all bricks are cleared
- Currently, the game has no score limit or win condition based on points

**Future Enhancement:** Implement a configurable win condition where players can set a target score (e.g., first to reach 10, 20, or 50 points) or a time limit for matches.

### 3.3 Ball Physics
- Frame-independent movement using deltaTime for consistent experience across devices
- Realistic bounce physics with angle calculations based on paddle impact point
- Multiple balls in play simultaneously (one owned by each player)
- Ball speed increases gradually during extended rallies

### 3.4 Paddle Mechanics
- Paddles can move horizontally only
- Paddle curvature affects ball bounce direction
- Paddle movement speed is balanced for fair gameplay
- Paddle size can be affected by power-ups

## 4. Control Schemes

### 4.1 Keyboard Controls
- Player 1 (Bottom):
  - Left/Right Arrow Keys for paddle movement
  - Space to activate power-ups (freeze ray, laser)
- Player 2 (Top):
  - A/D Keys for paddle movement
  - S to activate power-ups (freeze ray, laser)
- 'P' key pauses/resumes the game
- ESC key returns to main menu from gameplay

### 4.2 Mouse Controls
- Available for Player 1 in single-player mode
- Move mouse horizontally to control paddle position
- Mouse button click anywhere on the game canvas to activate power-ups
- Natural and intuitive control method for new players

### 4.3 Touch Controls
- Available for Player 1 in single-player mode (automatically enabled on touch devices)
- Player 1 (Bottom): Tap & Drag lower screen half (Move), Tap lower screen half (Power-up)
- Player 2 (Top - Two Player Mode): Tap & Drag upper screen half (Move), Tap upper screen half (Power-up)
- Responsive design adapts to different screen sizes

## 5. Power-Up System

### 5.1 Freeze Ray
- Temporarily freezes opponent's paddle
- Activated by breaking blue power-up bricks
- Duration: 10 seconds
- Visual effect shows frozen paddle state
- Sound effect indicates activation and deactivation

### 5.2 Wide Paddle
- Temporarily increases paddle width
- Activated by breaking purple power-up bricks
- Duration: 15 seconds
- Visual effect shows enlarged paddle
- Gradual transition between normal and wide states

### 5.3 Laser Power-Up
- Allows player to shoot a laser beam that turns opponent to ashes
- Activated by breaking red power-up bricks
- Temporarily disables opponent's paddle when hit
- Visual beam effect with particle animations
- Strategic timing required for effective use

## 6. Brick Patterns

### 6.1 Standard Pattern
- Classic arrangement of bricks in rows
- Balanced distribution of regular and power-up bricks
- Suitable for beginners and experienced players

### 6.2 Checkerboard Pattern
- Alternating arrangement of bricks
- Creates strategic gaps for ball movement
- Requires more precise aiming

### 6.3 Diamond Pattern
- Bricks arranged in a diamond shape
- Challenging to break center bricks
- Rewards skilled play and strategic thinking

### 6.4 Random Pattern
- Unpredictable arrangement of bricks
- Ensures variety in gameplay
- Different challenge each time

### 6.5 Zigzag Pattern
- Bricks arranged in a zigzag formation
- Creates interesting ball trajectories
- Tests player reflexes and prediction skills

## 7. Visual and Audio Design

### 7.1 Visual Elements
- Clean, modern UI with high contrast for gameplay elements
- Particle effects for brick breaking and power-up activation
- Visual indicators for power-up status
- Smooth animations for all game elements
- Responsive design that works across different screen sizes
- Neon glow effect around game canvas for visual flair
### 7.2 Audio Elements
- Sound effects for all gameplay actions:
  - Paddle hits
  - Wall collisions
  - Brick breaking
  - Power-up activation
  - Scoring
- Audio feedback for game state changes
- Web Audio API implementation for high-quality sound
- Volume control and mute option

## 8. User Interface

### 8.1 Main Menu
- Game title and branding
- Mode selection buttons (Single Player, Two Players, AI vs. AI)
- Control method selection (keyboard/mouse)
- Instructions and controls explanation
- Collapsible "Controls Help" section to keep the initial view clean
- Clean, intuitive layout

### 8.2 In-Game UI
- **Top Bar**: Contains scores and primary game controls.
  - Score display for Player 1 and Player 2.
  - Control Buttons: Menu, Restart, Pause/Resume, Mute.
- **Power-up Indicators**: Displayed near player paddles (implementation details may vary).
- Minimal design focused on gameplay clarity.

### 8.3 Game Over Screen
- Winner announcement
- Final scores
- Option to play again
- Return to main menu button

## 9. Technical Requirements

### 9.1 Platform Support
- Modern web browsers (Chrome, Firefox, Safari, Edge)
- Desktop and laptop computers
- Tablet devices
- Mobile phones (with touch control support)

### 9.2 Performance Requirements
- Consistent 60 FPS gameplay
- Frame-independent physics
- Low latency input handling
- Efficient rendering for smooth animations

### 9.3 Code Architecture
- Modular JavaScript code organization
- Clear separation of concerns:
  - Game state management
  - Rendering
  - Input handling
  - Physics calculations
  - Audio management
- Use of modern JavaScript features (ES Modules, classes)
- Version control with Git
- Development environment using Vite for fast builds and hot module replacement

## 10. Deployment
- Target Platform: Netlify
- Deployment Method: Continuous deployment via GitHub integration
  - Connect Netlify account to GitHub repository (`Supreme-Ed/brick-breaker-2p`)
  - Configure Netlify to build and deploy from the `main` or `refactor-modular` branch (as applicable)
  - Build command: `npm run build` (Uses Vite to create an optimized production build)
  - Publish directory: `dist` (Contains the output of the build process)
- Testing: Ensure deployed version functions correctly across supported browsers and devices.
- Production Build: The Vite build process (`npm run build`) automatically optimizes assets and removes `console.*` debug statements.
## 11. Future Enhancements

### 11.1 Planned Features
- Online multiplayer support
- Additional power-ups and game mechanics
- Customizable paddle and ball appearance
- Tournament mode
- Achievement system
- Leaderboards for high scores

### 11.2 Potential Expansions
- Mobile app versions (iOS, Android)
- Additional game modes (time attack, survival)
- Level editor for custom brick patterns
- Integration with social platforms for sharing
- Seasonal themed content

## 12. Implementation Timeline

### 12.1 Phase 1: Core Gameplay
- Basic game mechanics
- Single player mode
- Keyboard controls
- Standard brick pattern
- Basic UI

### 12.2 Phase 2: Enhanced Features
- Two player mode
- Mouse and touch controls
- Power-up system
- Additional brick patterns
- Improved visuals and audio

### 12.3 Phase 3: Polish and Refinement
- AI vs. AI mode
- Performance optimization
- Bug fixes and quality improvements
- Final UI polish
- Comprehensive testing

## 13. Conclusion

Brick Breaker 2P reimagines the classic arcade game with modern features, competitive multiplayer, and accessible controls. By focusing on smooth gameplay, engaging power-ups, and multiple game modes, the game aims to appeal to both nostalgic fans of the original and new players looking for an entertaining competitive experience.
