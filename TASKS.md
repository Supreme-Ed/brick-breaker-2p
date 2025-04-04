# Brick Breaker 2P - Development Tasks

This document tracks current and future development tasks for the Brick Breaker 2P project.

## Current Tasks

- [ ] Fix Wide Paddle power-up physics boundary (doesn't match visual size)
- [ ] Add 'score' sound effect file and integrate with audio manager
- [ ] Perform security audit
- [ ] Fix TypeScript "possibly null" warnings in JavaScript files
- [ ] Implement configurable win conditions (score limit or time limit)
- [ ] Verify scoring implementation matches PRD specifications

## Completed Tasks

- [x] Implement basic game mechanics
- [x] Create multiple brick patterns
- [x] Add power-up system
- [x] Implement AI opponent
- [x] Add touch controls
- [x] Set up testing infrastructure
- [x] Fix power-up activation issues with keyboard controls
- [x] Improve power-up system reliability during extended gameplay
- [x] Fix Netlify deployment 404 errors with proper path configuration
- [x] Set Mouse as default control for Single Player
- [x] Implement Pause functionality (button and 'P' key)
- [x] Refactor UI: Add top bar for scores/controls and collapsible controls help on start screen
- [x] Refactor mouse power-up activation (removed Y-position check)
- [x] Configure Vite build process for production (removes debug logs, handles multiple HTML files)
- [x] Rework sound system to support sound files for game sounds
- [x] Fix audio system initialization issues after sound file rework (see DEBUG-AudioFix.md)
- [x] Integrate Matter.js for core physics and brick fragmentation (see DEBUG-MatterJS_Integration.md)
- [x] Add particle effects when bricks are broken (via Matter.js fragmentation)

## Future Enhancements

### High Priority
- [ ] Implement basic high score list, will need python backend and will be stored in supabase
- [ ] Add screen size check and associated adjustments for different screen sizes and platforms
- [ ] Implement difficulty levels for AI
- [ ] Add visual effects for power-ups (beyond basic indicators/fragmentation)
- [ ] Create a proper game over screen
- [ ] Optimize sound files and convert to MP3, optimize loading/loading progress bar


### Medium Priority
- [ ] Add support for Bluetooth controllers
- [ ] Implement additional power-ups
- [ ] Create additional brick patterns
- [ ] Add customization options for paddles and balls

### Low Priority
- [ ] Add online multiplayer capability
- [ ] Create a level editor
- [ ] Add achievements system
- [ ] Further enhance start screen aesthetics (beyond collapsible controls)

## Bug Fixes

- [x] Fix keyboard power-up activation (spacebar and 's' key) issues
- [x] Resolve power-up visual and functional failures during extended gameplay
- [x] Fix Netlify deployment 404 errors with path configuration and redirects
- [x] Fix erratic AI paddle movement due to missing deltaTime
- [ ] Address TypeScript "possibly null" warnings
- [ ] Ensure consistent game performance across different devices
- [x] Fix any touch control issues on mobile devices (coordinate scaling)
- [x] Restore missing glow effect on game canvas
- [x] Fix audio system initialization issues after sound file rework (see DEBUG-AudioFix.md)
- [x] Fix brick breaking / ghost collision issues after Matter.js integration
- [x] Fix ball slowdown issues after Matter.js integration
- [x] Fix various JS errors during Matter.js integration (`matterWorld is not defined`, `deltaTime is not defined`, `this.gameState.pauseGame is not a function`, `Matter.World.get is not a function`, `ball is not defined`)

## Notes

- The "possibly null" TypeScript warnings should be addressed using best practices (optional chaining, nullish coalescing, or explicit null checks) rather than using non-null assertions.
- When implementing new features, follow the existing code patterns and architecture.
- All new features should include appropriate tests.
