// Scene grid definitions — shared-vertex based calibration

// Build per-tile polygons and centers from a shared vertex grid
function buildTilesFromVertices(vertices, rows, cols) {
  const tiles = {};
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tl = vertices[r][c];
      const tr = vertices[r][c + 1];
      const br = vertices[r + 1][c + 1];
      const bl = vertices[r + 1][c];
      const poly = [
        [tl[0], tl[1]],
        [tr[0], tr[1]],
        [br[0], br[1]],
        [bl[0], bl[1]]
      ];
      const cx = (tl[0] + tr[0] + br[0] + bl[0]) / 4;
      const cy = (tl[1] + tr[1] + bl[1] + br[1]) / 4;
      tiles[r + ',' + c] = { poly, center: [cx, cy] };
    }
  }
  return tiles;
}

// Helper to create a uniform rectangular vertex grid
function createRectVertices(rows, cols, cellW, cellH) {
  const verts = [];
  for (let r = 0; r <= rows; r++) {
    const row = [];
    for (let c = 0; c <= cols; c++) {
      row.push([c * cellW, r * cellH]);
    }
    verts.push(row);
  }
  return verts;
}

export const SCENE_GRIDS = {

  // day: 747x320 image mapped onto 900x540 canvas
  day: {
    imageSize: [747, 320],
    canvasRect: [0, 0, 900, 540],
    rows: 5,
    cols: 9,
    meta: {},
    vertices: [
      // row 0
      [[55,73],[128,64],[198,58],[272,55],[342,54],[416,51],[483,58],[560,64],[620,73],[698,78]],
      // row 1
      [[50,160],[122,159],[194,161],[269,162],[337,161],[411,159],[481,162],[554,166],[629,163],[706,163]],
      // row 2
      [[49,243],[123,247],[191,249],[267,250],[338,253],[409,251],[483,247],[554,252],[627,251],[714,249]],
      // row 3
      [[46,338],[124,344],[194,344],[274,351],[344,354],[407,349],[478,346],[559,344],[628,340],[719,333]],
      // row 4
      [[43,420],[122,429],[197,428],[275,431],[338,426],[415,426],[481,425],[560,421],[627,420],[718,423]],
      // row 5
      [[36,509],[119,515],[193,520],[267,518],[339,516],[414,513],[478,513],[557,514],[623,514],[712,515]]
    ]
  },

  // night & other scenes fall back to rectangular grid
  night: {
    imageSize: [1400, 600],
    canvasRect: [0, 0, 900, 540],
    rows: 5, cols: 9,
    meta: {},
    vertices: createRectVertices(5, 9, 100, 108)
  }
};

// Initialize tiles from vertices (done once at module load)
for (const key of Object.keys(SCENE_GRIDS)) {
  const g = SCENE_GRIDS[key];
  if (g.vertices && !g.tiles) {
    g.tiles = buildTilesFromVertices(g.vertices, g.rows, g.cols);
  }
}

// Rebuild tiles after vertex changes (called during calibration)
export function rebuildTiles(sceneId) {
  const g = SCENE_GRIDS[sceneId];
  if (!g || !g.vertices) return;
  g.tiles = buildTilesFromVertices(g.vertices, g.rows, g.cols);
}

// Per-scene metadata: waterRows, slantedCols, etc.
const SCENE_META = {
  day:        {},
  night:      {},
  pool:       { waterRows: [2, 3] },
  fog:        { waterRows: [2, 3] },
  one:        {},
  three:      {},
  ground:     { noPlace: true },
  dayRoof:    { slantedCols: [0, 1, 2, 3, 4] },
  nightRoof:  { slantedCols: [0, 1, 2, 3, 4] },
};

export function getSceneGrid(sceneId) {
  return SCENE_GRIDS[sceneId] || SCENE_GRIDS['day'];
}

export function getSceneMeta(sceneId) {
  return SCENE_META[sceneId] || {};
}

// Compute the "invisible standard row" Y for a given row — average of all tile center Ys
export function getRowY(grid, row) {
  var sum = 0, count = 0;
  for (var c = 0; c < grid.cols; c++) {
    var tile = grid.tiles[row + ',' + c];
    if (tile) {
      sum += tile.center[1];
      count++;
    }
  }
  return count > 0 ? sum / count : row * 108;
}

export function createDefaultGrid() {
  var tiles = {};
  for (var r = 0; r < 5; r++) {
    for (var c = 0; c < 9; c++) {
      var x1 = c * 100, y1 = r * 108;
      var x2 = (c + 1) * 100, y2 = (r + 1) * 108;
      tiles[r+','+c] = {
        poly: [[x1, y1], [x2, y1], [x2, y2], [x1, y2]],
        center: [x1 + 50, y1 + 54],
      };
    }
  }
  return { rows: 5, cols: 9, tiles };
}
