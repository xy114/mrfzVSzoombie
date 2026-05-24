import { GAME_CONFIG } from './constants.js';
import { assetManager } from './AssetManager.js';
import { getSceneGrid, createDefaultGrid, getSceneMeta, getRowY } from './SceneGrid.js';

export class Lawn {
  constructor(sceneId = 'day') {
    this.rows = GAME_CONFIG.LAWN_ROWS;
    this.cols = GAME_CONFIG.LAWN_COLS;
    this.cellWidth = GAME_CONFIG.CELL_WIDTH;
    this.cellHeight = GAME_CONFIG.CELL_HEIGHT;
    this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(null));

    this.sceneId = sceneId;
    this.sceneGrid = getSceneGrid(sceneId);
    this.usePolyGrid = !!this.sceneGrid;
    this.meta = getSceneMeta(sceneId);

    // Update rows/cols from scene grid (varies per scene)
    this.rows = this.sceneGrid.rows || this.rows;
    this.cols = this.sceneGrid.cols || this.cols;
    this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(null));

    // Pre-compute invisible standard row Y values
    this.rowY = [];
    for (var r = 0; r < this.rows; r++) {
      this.rowY.push(getRowY(this.sceneGrid, r));
    }

    this.debugGrid = (typeof localStorage !== 'undefined' && localStorage.getItem('debugGrid') === '1') ||
      (typeof URLSearchParams !== 'undefined' &&
      new URLSearchParams(location.search).get('debugGrid') === '1');
  }

  getImageKey() {
    return `lawn_bg_${this.sceneId}`;
  }

  canPlant(row, col) {
    if (this.meta.noPlace) return false;
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return false;
    if (this.grid[row][col]) return false;
    if (this.meta.waterRows && this.meta.waterRows.includes(row)) return false;
    if (!this.sceneGrid.tiles[row + ',' + col]) return false;
    return true;
  }

  isWater(row) {
    return this.meta.waterRows && this.meta.waterRows.includes(row);
  }

  isSlanted(col) {
    return this.meta.slantedCols && this.meta.slantedCols.includes(col);
  }

  getRowY(row) {
    return this.rowY[row] !== undefined ? this.rowY[row] : row * this.cellHeight;
  }

  plant(row, col, plant) {
    if (this.canPlant(row, col)) {
      this.grid[row][col] = plant;
      plant.row = row;
      plant.col = col;
      if (this.usePolyGrid) {
        const tile = this.sceneGrid.tiles[`${row},${col}`];
        if (tile) {
          plant.x = tile.center[0];
          plant.y = tile.center[1];
        } else {
          plant.x = col * this.cellWidth;
          plant.y = row * this.cellHeight;
        }
      } else {
        plant.x = col * this.cellWidth;
        plant.y = row * this.cellHeight;
      }
      const avgSize = this.getAvgTileSize();
      plant.scale = avgSize.w / this.cellWidth;
      if (this.isSlanted(col)) {
        plant.rotation = -Math.PI / 4; // 45° left tilt for roof slant
      }
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

  pointInPolygon(px, py, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1];
      const xj = polygon[j][0], yj = polygon[j][1];
      if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  }

  getCellFromPosition(x, y) {
    if (this.usePolyGrid) {
      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.cols; col++) {
          const tile = this.sceneGrid.tiles[`${row},${col}`];
          if (tile && this.pointInPolygon(x, y, tile.poly)) {
            return { row, col };
          }
        }
      }
      return { row: -1, col: -1 };
    }
    const col = Math.floor(x / this.cellWidth);
    const row = Math.floor(y / this.cellHeight);
    return { row, col };
  }

  getTileSize(row, col) {
    if (this.usePolyGrid) {
      const tile = this.sceneGrid.tiles[`${row},${col}`];
      if (tile) {
        const xs = tile.poly.map(p => p[0]);
        const ys = tile.poly.map(p => p[1]);
        const w = Math.max(...xs) - Math.min(...xs);
        const h_val = Math.max(...ys) - Math.min(...ys);
        return { w, h: h_val };
      }
    }
    return { w: this.cellWidth, h: this.cellHeight };
  }

  getAvgTileSize() {
    if (this.usePolyGrid) {
      let totalW = 0, totalH = 0, count = 0;
      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.cols; col++) {
          const s = this.getTileSize(row, col);
          totalW += s.w;
          totalH += s.h;
          count++;
        }
      }
      return { w: totalW / count, h: totalH / count };
    }
    return { w: this.cellWidth, h: this.cellHeight };
  }

  renderDebugGrid(ctx) {
    if (!this.debugGrid || !this.usePolyGrid) return;

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const tile = this.sceneGrid.tiles[`${row},${col}`];
        if (!tile) continue;

        ctx.save();
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tile.poly[0][0], tile.poly[0][1]);
        for (let i = 1; i < tile.poly.length; i++) {
          ctx.lineTo(tile.poly[i][0], tile.poly[i][1]);
        }
        ctx.closePath();
        ctx.stroke();

        // Semi-transparent fill
        ctx.fillStyle = 'rgba(255, 0, 255, 0.08)';
        ctx.fill();

        // Row,Col label at center
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${row},${col}`, tile.center[0], tile.center[1]);
        ctx.restore();
      }
    }
  }

  render(ctx) {
    const bgKey = this.getImageKey();
    const bgImg = assetManager.getImage(bgKey) || assetManager.getImage('lawn_bg');

    if (bgImg && this.usePolyGrid && this.sceneGrid.canvasRect) {
      const [cx, cy, cw, ch] = this.sceneGrid.canvasRect;
      ctx.drawImage(bgImg, cx, cy, cw, ch);
    } else if (bgImg) {
      ctx.drawImage(bgImg, 0, 0, this.cols * this.cellWidth, this.rows * this.cellHeight);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, this.rows * this.cellHeight);
      gradient.addColorStop(0, '#4a7a3a');
      gradient.addColorStop(0.5, '#3a6a2a');
      gradient.addColorStop(1, '#2a4a1a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.cols * this.cellWidth, this.rows * this.cellHeight);

      for (let row = 0; row < this.rows; row++) {
        ctx.fillStyle = row % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)';
        ctx.fillRect(0, row * this.cellHeight, this.cols * this.cellWidth, this.cellHeight);
      }
    }

    // Legacy grid lines (only when not using poly grid)
    if (!this.usePolyGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.cols; col++) {
          const x = col * this.cellWidth;
          const y = row * this.cellHeight;
          ctx.strokeRect(x, y, this.cellWidth, this.cellHeight);
        }
      }
    }

    // Debug grid overlay
    this.renderDebugGrid(ctx);
  }
}
