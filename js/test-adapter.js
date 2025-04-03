/**
 * Test Adapter for Brick Breaker 2P
 * 
 * This module exposes the modular game components as global variables
 * to maintain compatibility with existing tests.
 */

import { game } from './core/game.js';
import { createBall } from './entities/ball.js';
import { createPaddle } from './entities/paddle_entity.js';

// Expose game components as global variables for tests
window.game = game;
window.paddle1 = game.paddle1;
window.paddle2 = game.paddle2;
window.balls = game.balls;
window.ball = game.balls[0]; // For backward compatibility

// Expose keys object for tests
window.keys = game.input.keys;

// Expose functions for tests
window.movePaddles = function(deltaTime) {
    // Adapter for the old movePaddles function
    game.updatePaddles(deltaTime, game.input.getKeys(), game.input.getMousePosition());
};

window.moveBall = function(deltaTime) {
    // Adapter for the old moveBall function
    game.balls.forEach(ball => ball.update(deltaTime));
};

window.shootAction = function(player) {
    // Adapter for the old shootAction function
    game.shootAction(player);
};

window.shootFreezeRay = function(player) {
    // Adapter for the old shootFreezeRay function
    game.shootFreezeRay(player);
};

window.shootLaser = function(player) {
    // Adapter for the old shootLaser function
    game.shootLaser(player);
};

// Expose other functions needed by tests
window.checkCollision = function(paddle, ball) {
    return game.physics.checkPaddleCollision(ball, paddle, paddle === game.paddle2);
};

window.checkBrickCollision = function(ball) {
    return game.bricks.checkCollision(ball);
};

window.drawBricks = function() {
    game.bricks.draw(game.ctx);
};

window.drawPaddle = function(paddle) {
    paddle.draw(game.ctx);
};

window.drawBall = function() {
    game.balls.forEach(ball => ball.draw(game.ctx));
};

window.drawScore = function() {
    game.renderer.drawScore(game.paddle1, game.paddle2, game.gameState.player1Name, game.gameState.player2Name);
};

window.resetBall = function(ballIndex) {
    game.balls[ballIndex].reset(ballIndex === 0 ? 1 : 2);
};

window.resetBricks = function() {
    game.bricks.initGrid();
};

window.returnToStartScreen = function() {
    game.returnToStartScreen();
};

window.restartGame = function() {
    game.restartGame();
};

// Initialize the test adapter when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('[DEBUG] Test adapter initialized');
});
