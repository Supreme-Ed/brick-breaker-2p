/**
 * Brick management for Brick Breaker 2P
 * Handles brick creation, patterns, and collision detection
 */

export class BrickManager {
    /**
     * @param {number} canvasWidth
     * @param {number} canvasHeight
     */
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.rows = 6;
        this.columns = 10;
        this.padding = 10;
        this.offsetLeft = 30;
        this.brickWidth = (canvasWidth - 2 * this.offsetLeft - (this.columns - 1) * this.padding) / this.columns;
        this.brickHeight = 20;
        
        // Calculate the total height of the brick area
        const totalBrickHeight = this.rows * this.brickHeight + (this.rows - 1) * this.padding;
        
        // Calculate offsetTop to center bricks vertically
        // We leave space for paddles at top and bottom (approximately 100px each)
        const playableHeight = canvasHeight - 200; // 100px for each paddle area
        this.offsetTop = 100 + (playableHeight - totalBrickHeight) / 2;
        
        this.patterns = ['standard', 'checkerboard', 'diamond', 'random', 'zigzag'];
        this.currentPattern = 0;
        this.grid = [];
        
        this.initGrid();
    }

    /**
     * Initialize the brick grid
     */
    initGrid() {
        // Initialize empty grid
        this.grid = [];
        for (let c = 0; c < this.columns; c++) {
            this.grid[c] = [];
            for (let r = 0; r < this.rows; r++) {
                this.grid[c][r] = {
                    x: 0,
                    y: 0,
                    width: this.brickWidth,
                    height: this.brickHeight,
                    status: 0,
                    color: "#3498db",
                    powerUp: null,
                    animation: {
                        active: false,
                        progress: 0,
                        speed: 0.05
                    }
                };
            }
        }
        
        // Apply current pattern
        this.applyPattern(this.patterns[this.currentPattern]);
    }

    /**
     * Apply a pattern to the brick grid
     * @param {string} pattern
     */
    applyPattern(pattern) {
        // Reset all bricks first
        for (let c = 0; c < this.columns; c++) {
            for (let r = 0; r < this.rows; r++) {
                this.grid[c][r].status = 0;
            }
        }
        
        switch (pattern) {
            case 'standard':
                this.createStandardPattern();
                break;
            case 'checkerboard':
                this.createCheckerboardPattern();
                break;
            case 'diamond':
                this.createDiamondPattern();
                break;
            case 'random':
                this.createRandomPattern();
                break;
            case 'zigzag':
                this.createZigzagPattern();
                break;
            default:
                this.createStandardPattern();
        }
        
        // Add power-up bricks
        this.addPowerUpBricks();
        
        // Calculate positions for all bricks
        this.updateBrickPositions();
    }

    /**
     * Update the positions of all bricks in the grid
     */
    updateBrickPositions() {
        for (let c = 0; c < this.columns; c++) {
            for (let r = 0; r < this.rows; r++) {
                this.grid[c][r].x = (c * (this.brickWidth + this.padding)) + this.offsetLeft;
                this.grid[c][r].y = (r * (this.brickHeight + this.padding)) + this.offsetTop;
            }
        }
    }

    /**
     * Create a standard pattern of bricks
     */
    createStandardPattern() {
        for (let c = 0; c < this.columns; c++) {
            for (let r = 0; r < this.rows; r++) {
                this.grid[c][r].status = 1;
                this.grid[c][r].color = "#3498db";
            }
        }
    }

    /**
     * Create a checkerboard pattern of bricks
     */
    createCheckerboardPattern() {
        for (let c = 0; c < this.columns; c++) {
            for (let r = 0; r < this.rows; r++) {
                if ((c + r) % 2 === 0) {
                    this.grid[c][r].status = 1;
                    this.grid[c][r].color = "#3498db";
                }
            }
        }
    }

    /**
     * Create a diamond pattern of bricks
     */
    createDiamondPattern() {
        const centerC = Math.floor(this.columns / 2) - 0.5;
        const centerR = Math.floor(this.rows / 2) - 0.5;
        const maxDistance = Math.min(this.columns, this.rows) / 2;
        
        for (let c = 0; c < this.columns; c++) {
            for (let r = 0; r < this.rows; r++) {
                // Calculate Manhattan distance from center
                const distance = Math.abs(c - centerC) + Math.abs(r - centerR);
                if (distance <= maxDistance) {
                    this.grid[c][r].status = 1;
                    this.grid[c][r].color = "#3498db";
                }
            }
        }
    }

    /**
     * Create a random pattern of bricks
     */
    createRandomPattern() {
        for (let c = 0; c < this.columns; c++) {
            for (let r = 0; r < this.rows; r++) {
                if (Math.random() > 0.4) {
                    this.grid[c][r].status = 1;
                    this.grid[c][r].color = "#3498db";
                }
            }
        }
    }

    /**
     * Create a zigzag pattern of bricks
     */
    createZigzagPattern() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.columns; c++) {
                if ((r % 2 === 0 && c < this.columns - 2) || (r % 2 === 1 && c > 1)) {
                    this.grid[c][r].status = 1;
                    this.grid[c][r].color = "#3498db";
                }
            }
        }
    }

    /**
     * Add power-up bricks to the grid
     */
    addPowerUpBricks() {
        // Add freeze ray power-up bricks (blue)
        for (let i = 0; i < 2; i++) {
            let c, r;
            do {
                c = Math.floor(Math.random() * this.columns);
                r = Math.floor(Math.random() * this.rows);
            } while (this.grid[c][r].status !== 1 || this.grid[c][r].powerUp !== null);
            
            this.grid[c][r].powerUp = 'freezeRay';
            this.grid[c][r].color = "#00BFFF"; // Deep blue for freeze ray
        }
        
        // Add wide paddle power-up bricks (purple)
        for (let i = 0; i < 2; i++) {
            let c, r;
            do {
                c = Math.floor(Math.random() * this.columns);
                r = Math.floor(Math.random() * this.rows);
            } while (this.grid[c][r].status !== 1 || this.grid[c][r].powerUp !== null);
            
            this.grid[c][r].powerUp = 'widePaddle';
            this.grid[c][r].color = "#9932CC"; // Purple for wide paddle
        }
        
        // Add laser power-up bricks (red)
        for (let i = 0; i < 2; i++) {
            let c, r;
            do {
                c = Math.floor(Math.random() * this.columns);
                r = Math.floor(Math.random() * this.rows);
            } while (this.grid[c][r].status !== 1 || this.grid[c][r].powerUp !== null);
            
            this.grid[c][r].powerUp = 'laser';
            this.grid[c][r].color = "#FF4500"; // Red-orange for laser
        }
    }

    /**
     * Count the number of active bricks in the grid
     * @returns {number}
     */
    countActiveBricks() {
        let count = 0;
        for (let c = 0; c < this.columns; c++) {
            for (let r = 0; r < this.rows; r++) {
                if (this.grid[c][r].status === 1) {
                    count++;
                }
            }
        }
        return count;
    }

    /**
     * Switch to the next pattern
     */
    nextPattern() {
        this.currentPattern = (this.currentPattern + 1) % this.patterns.length;
        this.applyPattern(this.patterns[this.currentPattern]);
    }

    /**
     * Draw the brick grid on the canvas
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        for (let c = 0; c < this.columns; c++) {
            for (let r = 0; r < this.rows; r++) {
                const brick = this.grid[c][r];
                if (brick.status === 1) {
                    this.drawBrick(ctx, brick);
                }
            }
        }
    }

    /**
     * Draw a single brick on the canvas
     * @param {CanvasRenderingContext2D} ctx
     * @param {object} brick // Internal brick representation
     */
    drawBrick(ctx, brick) {
        // Get RGB values for color manipulation
        const rgb = this.getRGBfromColor(brick.color);
        
        // Base brick color
        const baseColor = brick.color;
        
        // Lighter color for top/left edges
        const lightColor = this.lightenColor(rgb, 50);
        
        // Darker color for bottom/right edges
        const darkColor = this.darkenColor(rgb, 50);
        
        // Draw brick with 3D effect
        ctx.beginPath();
        
        // Main brick body
        ctx.fillStyle = baseColor;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        
        // Top edge (light)
        ctx.fillStyle = lightColor;
        ctx.beginPath();
        ctx.moveTo(brick.x, brick.y);
        ctx.lineTo(brick.x + brick.width, brick.y);
        ctx.lineTo(brick.x + brick.width - 3, brick.y + 3);
        ctx.lineTo(brick.x + 3, brick.y + 3);
        ctx.closePath();
        ctx.fill();
        
        // Left edge (light)
        ctx.beginPath();
        ctx.moveTo(brick.x, brick.y);
        ctx.lineTo(brick.x, brick.y + brick.height);
        ctx.lineTo(brick.x + 3, brick.y + brick.height - 3);
        ctx.lineTo(brick.x + 3, brick.y + 3);
        ctx.closePath();
        ctx.fill();
        
        // Bottom edge (dark)
        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.moveTo(brick.x, brick.y + brick.height);
        ctx.lineTo(brick.x + brick.width, brick.y + brick.height);
        ctx.lineTo(brick.x + brick.width - 3, brick.y + brick.height - 3);
        ctx.lineTo(brick.x + 3, brick.y + brick.height - 3);
        ctx.closePath();
        ctx.fill();
        
        // Right edge (dark)
        ctx.beginPath();
        ctx.moveTo(brick.x + brick.width, brick.y);
        ctx.lineTo(brick.x + brick.width, brick.y + brick.height);
        ctx.lineTo(brick.x + brick.width - 3, brick.y + brick.height - 3);
        ctx.lineTo(brick.x + brick.width - 3, brick.y + 3);
        ctx.closePath();
        ctx.fill();
        
        // Add power-up indicator if applicable
        if (brick.powerUp) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
            ctx.beginPath();
            
            switch (brick.powerUp) {
                case 'freezeRay':
                    // Snowflake symbol
                    const centerX = brick.x + brick.width / 2;
                    const centerY = brick.y + brick.height / 2;
                    const size = Math.min(brick.width, brick.height) * 0.4;
                    
                    // Draw three crossed lines
                    for (let i = 0; i < 3; i++) {
                        const angle = (Math.PI / 3) * i;
                        ctx.moveTo(centerX - Math.cos(angle) * size, centerY - Math.sin(angle) * size);
                        ctx.lineTo(centerX + Math.cos(angle) * size, centerY + Math.sin(angle) * size);
                    }
                    ctx.stroke();
                    break;
                    
                case 'widePaddle':
                    // Wide paddle symbol
                    ctx.fillRect(brick.x + brick.width * 0.2, brick.y + brick.height * 0.6, brick.width * 0.6, brick.height * 0.2);
                    break;
                    
                case 'laser':
                    // Laser beam symbol
                    const beamWidth = brick.width * 0.1;
                    const beamHeight = brick.height * 0.7;
                    ctx.fillRect(brick.x + (brick.width - beamWidth) / 2, brick.y + (brick.height - beamHeight) / 2, beamWidth, beamHeight);
                    // Laser tip
                    ctx.beginPath();
                    ctx.moveTo(brick.x + brick.width * 0.3, brick.y + brick.height * 0.15);
                    ctx.lineTo(brick.x + brick.width * 0.7, brick.y + brick.height * 0.15);
                    ctx.lineTo(brick.x + brick.width * 0.5, brick.y + brick.height * 0.3);
                    ctx.closePath();
                    ctx.fill();
                    break;
            }
        }
    }

    /**
     * Convert a color to RGB format
     * @param {string} color
     * @returns {string}
     */
    getRGBfromColor(color) {
        // Handle hex colors
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgb(${r}, ${g}, ${b})`;
        }
        
        // Handle rgb colors
        return color;
    }

    /**
     * Lighten a color by a specified amount
     * @param {string} rgb
     * @param {number} amount
     * @returns {string}
     */
    lightenColor(rgb, amount) {
        const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (!match) return rgb;
        
        let r = parseInt(match[1]);
        let g = parseInt(match[2]);
        let b = parseInt(match[3]);
        
        r = Math.min(255, r + amount);
        g = Math.min(255, g + amount);
        b = Math.min(255, b + amount);
        
        return `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * Darken a color by a specified amount
     * @param {string} rgb
     * @param {number} amount
     * @returns {string}
     */
    darkenColor(rgb, amount) {
        const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (!match) return rgb;
        
        let r = parseInt(match[1]);
        let g = parseInt(match[2]);
        let b = parseInt(match[3]);
        
        r = Math.max(0, r - amount);
        g = Math.max(0, g - amount);
        b = Math.max(0, b - amount);
        
        return `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * Check for collision between a ball and the brick grid
     * @param {Ball} ball
     * @returns {{ hit: boolean, brick?: object, column?: number, row?: number, powerUp?: string | null }}
     */
    checkCollision(ball) {
        for (let c = 0; c < this.columns; c++) {
            for (let r = 0; r < this.rows; r++) {
                const brick = this.grid[c][r];
                if (brick.status === 1) {
                    // Check if ball is colliding with this brick
                    if (ball.x + ball.radius > brick.x && 
                        ball.x - ball.radius < brick.x + brick.width && 
                        ball.y + ball.radius > brick.y && 
                        ball.y - ball.radius < brick.y + brick.height) {
                        
                        // Determine collision side (top/bottom/left/right)
                        const ballCenterX = ball.x;
                        const ballCenterY = ball.y;
                        const brickCenterX = brick.x + brick.width / 2;
                        const brickCenterY = brick.y + brick.height / 2;
                        
                        // Calculate distances from ball center to brick center
                        const dx = Math.abs(ballCenterX - brickCenterX);
                        const dy = Math.abs(ballCenterY - brickCenterY);
                        
                        // Calculate the minimum distance needed for collision on each axis
                        const minDistX = brick.width / 2 + ball.radius;
                        const minDistY = brick.height / 2 + ball.radius;
                        
                        // Calculate overlap on each axis
                        const overlapX = minDistX - dx;
                        const overlapY = minDistY - dy;
                        
                        // Determine which side was hit based on overlap
                        if (overlapX < overlapY) {
                            // Horizontal collision (left or right)
                            ball.dx = -ball.dx;
                        } else {
                            // Vertical collision (top or bottom)
                            ball.dy = -ball.dy;
                        }
                        
                        // Mark brick as hit
                        brick.status = 0;
                        
                        // Return collision result with brick info
                        return {
                            hit: true,
                            brick: brick,
                            column: c,
                            row: r,
                            powerUp: brick.powerUp
                        };
                    }
                }
            }
        }
        
        // No collision
        return { hit: false };
    }
}

/**
 * Export a factory function to create the brick manager
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @returns {BrickManager}
 */
export function createBrickManager(canvasWidth, canvasHeight) {
    return new BrickManager(canvasWidth, canvasHeight);
}
