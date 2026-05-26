import { GAME_CONFIG } from './constants.js';
import { assetManager } from './AssetManager.js';
import { getSceneGrid, createDefaultGrid, getSceneMeta, getRowY, rebuildTiles } from './SceneGrid.js';

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

    // Standard cell rect — average of all tile sizes, used as reference unit
    this.standardCell = this.getAvgTileSize();

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

      const bodyType = plant.getBodyType ? plant.getBodyType() : 'plant';
      const renderSize = plant.getRenderSize ? plant.getRenderSize() : 80;
      const aspectRatio = plant.getAspectRatio ? plant.getAspectRatio() : 1.0;
      const rect = this.getPlacementRect(bodyType, renderSize, row, col, 0, aspectRatio);
      plant.x = rect.x;
      plant.y = rect.y;
      plant.scale = rect.scale;
      plant.rotation = rect.rotation;

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

  getTileCenter(row, col) {
    if (this.usePolyGrid) {
      const tile = this.sceneGrid.tiles[`${row},${col}`];
      if (tile && tile.center) return { x: tile.center[0], y: tile.center[1] };
    }
    return { x: col * this.cellWidth + this.cellWidth / 2, y: row * this.cellHeight + this.cellHeight / 2 };
  }

  getAvgTileSize() {
    if (this.usePolyGrid) {
      let totalArea = 0, count = 0;
      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.cols; col++) {
          const s = this.getTileSize(row, col);
          totalArea += s.w * s.h;
          count++;
        }
      }
      const avgArea = totalArea / count;
      const side = Math.sqrt(avgArea);
      return { w: side, h: side };
    }
    return { w: this.cellWidth, h: this.cellHeight };
  }

  getPlacementRect(bodyType, renderSize, row, col, footOffset = 0, aspectRatio = 1.0) {
    const sc = this.standardCell;
    const scale = sc.w / this.cellWidth;
    const rw = renderSize * scale;
    const rh = rw * aspectRatio;
    const tile = this.usePolyGrid ? this.sceneGrid.tiles[`${row},${col}`] : null;
    const cx = tile ? tile.center[0] : (col * this.cellWidth + this.cellWidth / 2);
    const cy = tile ? tile.center[1] : (row * this.cellHeight + this.cellHeight / 2);

    // Plant roots and humanoid feet both anchor at tile center
    const x = cx - rw / 2;
    const y = cy - rh - footOffset * scale;

    return {
      x, y,
      w: rw, h: rh,
      scale,
      rotation: this.isSlanted(col) ? -Math.PI / 4 : 0
    };
  }

  findNearestVertex(x, y, threshold) {
    if (!threshold) threshold = 15;
    let best = null;
    let bestDist = threshold;
    const verts = this.sceneGrid.vertices;
    for (let r = 0; r < verts.length; r++) {
      for (let c = 0; c < verts[r].length; c++) {
        const dx = x - verts[r][c][0];
        const dy = y - verts[r][c][1];
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < bestDist) {
          bestDist = dist;
          best = { r, c };
        }
      }
    }
    return best;
  }

  moveVertex(r, c, x, y) {
    const verts = this.sceneGrid.vertices;
    if (!verts[r] || !verts[r][c]) return;
    verts[r][c][0] = x;
    verts[r][c][1] = y;
    // Rebuild all affected tiles (up to 4 tiles share this vertex)
    rebuildTiles(this.sceneId);
  }

  exportGrid() {
    const verts = this.sceneGrid.vertices;
    const out = [];
    for (let r = 0; r < verts.length; r++) {
      const row = [];
      for (let c = 0; c < verts[r].length; c++) {
        row.push([Math.round(verts[r][c][0]), Math.round(verts[r][c][1])]);
      }
      out.push(row);
    }
    console.log('=== VERTEX GRID EXPORT (copy and paste into SceneGrid.js) ===');
    const lines = [];
    for (let r = 0; r < out.length; r++) {
      const inner = out[r].map(p => `[${p[0]},${p[1]}]`).join(',');
      lines.push(`      [${inner}]`);
    }
    console.log('[\n' + lines.join(',\n') + '\n]');
    console.log('=== END EXPORT ===');
  }

  renderDebugGrid(ctx) {
    if (!this.debugGrid || !this.usePolyGrid) return;

    const verts = this.sceneGrid.vertices;
    if (!verts) return;

    // Draw tile polygons
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const tile = this.sceneGrid.tiles[row + ',' + col];
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
        ctx.fillText(row + ',' + col, tile.center[0], tile.center[1]);
        ctx.restore();
      }
    }

    // Draw shared vertex handles (60 points)
    for (let r = 0; r < verts.length; r++) {
      for (let c = 0; c < verts[r].length; c++) {
        const vx = verts[r][c][0];
        const vy = verts[r][c][1];
        ctx.save();
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(vx, vy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#008899';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Small label
        ctx.fillStyle = '#00cccc';
        ctx.font = '7px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(r + ',' + c, vx, vy - 7);
        ctx.restore();
      }
    }

    // Highlight dragged vertex
    if (this._dragVertex) {
      const v = verts[this._dragVertex.r][this._dragVertex.c];
      ctx.save();
      ctx.fillStyle = '#ff4444';
      ctx.beginPath();
      ctx.arc(v[0], v[1], 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
  }

  render(ctx) {
    const bgImg = assetManager.getImage(this.getImageKey()) || assetManager.getImage('lawn_bg');

    if (bgImg && this.usePolyGrid && this.sceneGrid.canvasRect) {
      const [cx, cy, cw, ch] = this.sceneGrid.canvasRect;
      const scale = Math.max(cw / bgImg.naturalWidth, ch / bgImg.naturalHeight);
      const dw = bgImg.naturalWidth * scale;
      const dh = bgImg.naturalHeight * scale;
      const dx = cx + (cw - dw) / 2;
      const dy = cy + (ch - dh) / 2;
      ctx.drawImage(bgImg, dx, dy, dw, dh);
    } else if (bgImg) {
      const canvasW = this.cols * this.cellWidth;
      const canvasH = this.rows * this.cellHeight;
      const scale = Math.max(canvasW / bgImg.naturalWidth, canvasH / bgImg.naturalHeight);
      const dw = bgImg.naturalWidth * scale;
      const dh = bgImg.naturalHeight * scale;
      const dx = (canvasW - dw) / 2;
      const dy = (canvasH - dh) / 2;
      ctx.drawImage(bgImg, dx, dy, dw, dh);
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
