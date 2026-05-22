import { GAME_CONFIG } from './constants.js';

export class Lawn {
  constructor() {
    this.rows = GAME_CONFIG.LAWN_ROWS;
    this.cols = GAME_CONFIG.LAWN_COLS;
    this.cellWidth = GAME_CONFIG.CELL_WIDTH;
    this.cellHeight = GAME_CONFIG.CELL_HEIGHT;
    this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(null));
  }

  canPlant(row, col) {
    return row >= 0 && row < this.rows && col >= 0 && col < this.cols && !this.grid[row][col];
  }

  plant(row, col, plant) {
    if (this.canPlant(row, col)) {
      this.grid[row][col] = plant;
      plant.row = row;
      plant.col = col;
      plant.x = col * this.cellWidth;
      plant.y = row * this.cellHeight;
      return true;
    }
    return false;
  }

  removePlant(row, col) {
    const plant = this.grid[row][col];
    this.grid[row][col] = null;
    return plant;
  }

  getPlant(row, col) {
    return this.grid[row][col];
  }

  getCellFromPosition(x, y) {
    const col = Math.floor(x / this.cellWidth);
    const row = Math.floor(y / this.cellHeight);
    return { row, col };
  }

  render(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, this.rows * this.cellHeight);
    gradient.addColorStop(0, '#4ade80');
    gradient.addColorStop(1, '#22c55e');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.cols * this.cellWidth, this.rows * this.cellHeight);
    
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const x = col * this.cellWidth;
        const y = row * this.cellHeight;
        ctx.strokeRect(x, y, this.cellWidth, this.cellHeight);
      }
    }
  }
}