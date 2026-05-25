"""
Generate SceneGrid.js with perspective grid coordinates for all 9 scenes.
"""
import json

# Each scene: (filename, canvas_rect, grass_bounds_in_image)
# grass_bounds = (x1, y1, x2, y2) in image pixel space
# canvas_rect = (x, y, w, h) — where the image is drawn on canvas

scenes = {
    'day': {
        'file': 'resources/scene/白天.jpg',
        'imageSize': [747, 320],
        'canvasRect': [0, 0, 900, 540],
        # Detected: rows 32-308, cols 127-746
        'grassBounds': [127, 32, 746, 308],
    },
    'night': {
        'file': 'resources/scene/晚上.jpg',
        'imageSize': [1400, 600],
        'canvasRect': [0, 0, 900, 540],
        # Manual: estimated from weak dark-grass detection and visual similarity to day
        # Grass is dark but has similar layout to day scene
        'grassBounds': [250, 110, 1320, 560],
    },
    'pool': {
        'file': 'resources/scene/泳池.jpg',
        'imageSize': [1400, 600],
        'canvasRect': [0, 0, 900, 540],
        # Detected: rows 41-599, cols 0-1399 — use tighter bounds
        'grassBounds': [60, 48, 1395, 595],
    },
    'fog': {
        'file': 'resources/scene/迷雾.jpg',
        'imageSize': [1400, 600],
        'canvasRect': [0, 0, 900, 540],
        # Detected: rows 110-594, cols 261-983
        'grassBounds': [261, 110, 983, 594],
    },
    'one': {
        'file': 'resources/scene/一条.jpg',
        'imageSize': [1400, 600],
        'canvasRect': [0, 0, 900, 540],
        # Detected: rows 274-378, cols 252-1399 — single narrow lane
        'grassBounds': [252, 274, 1395, 378],
    },
    'three': {
        'file': 'resources/scene/三条.jpg',
        'imageSize': [1400, 600],
        'canvasRect': [0, 0, 900, 540],
        # Detected: rows 173-489, cols 246-1399
        'grassBounds': [246, 173, 1395, 489],
    },
    'ground': {
        'file': 'resources/scene/土地.jpg',
        'imageSize': [1400, 600],
        'canvasRect': [0, 0, 900, 540],
        # Brown ground — brown detector covers everything; use similar proportions to day
        'grassBounds': [180, 100, 1380, 560],
    },
    'dayRoof': {
        'file': 'resources/scene/白天屋顶.jpg',
        'imageSize': [1400, 600],
        'canvasRect': [0, 0, 900, 540],
        # Detected: rows 89-599, cols 46-1373
        'grassBounds': [46, 89, 1373, 599],
    },
    'nightRoof': {
        'file': 'resources/scene/晚上屋顶.jpg',
        'imageSize': [1400, 600],
        'canvasRect': [0, 0, 900, 540],
        # Detected: rows 181-511, cols 254-955
        'grassBounds': [254, 181, 955, 511],
    },
}

ROWS = 5
COLS = 9


def image_to_canvas(ix, iy, img_w, img_h, canvas_rect):
    """Convert image pixel coords to canvas coords."""
    cx, cy, cw, ch = canvas_rect
    sx = cw / img_w
    sy = ch / img_h
    return (cx + ix * sx, cy + iy * sy)


def lerp(a, b, t):
    return a + (b - a) * t


def generate_grid(grass_bounds, img_w, img_h, canvas_rect, perspective_strength=0.35):
    """
    Generate a perspective grid over the grass area.

    perspective_strength: 0 = linear, 1 = full perspective curve
    Higher values make the top rows narrower (perspective effect).
    """
    gx1, gy1, gx2, gy2 = grass_bounds

    # Top edge x-bounds are narrower than bottom for perspective
    # Apply perspective: top is narrower
    top_shrink = perspective_strength * 0.25  # top edge is ~25% narrower at max perspective
    mid_x = (gx1 + gx2) / 2
    top_half_width = (gx2 - gx1) / 2 * (1 - top_shrink)
    top_x1 = mid_x - top_half_width
    top_x2 = mid_x + top_half_width

    tiles = {}

    for row in range(ROWS):
        # Perspective Y interpolation
        t_top = row / ROWS
        t_bot = (row + 1) / ROWS

        # Apply perspective curve to Y
        pt_top = t_top ** (1 + perspective_strength)
        pt_bot = t_bot ** (1 + perspective_strength)

        # Y edges of this row
        row_y1 = lerp(gy1, gy2, pt_top)
        row_y2 = lerp(gy1, gy2, pt_bot)

        # X edges at this row's top and bottom
        row_top_x1 = lerp(top_x1, gx1, pt_top)
        row_top_x2 = lerp(top_x2, gx2, pt_top)
        row_bot_x1 = lerp(top_x1, gx1, pt_bot)
        row_bot_x2 = lerp(top_x2, gx2, pt_bot)

        for col in range(COLS):
            c_left = col / COLS
            c_right = (col + 1) / COLS

            # Top edge corners
            tl_x = lerp(row_top_x1, row_top_x2, c_left)
            tl_y = row_y1
            tr_x = lerp(row_top_x1, row_top_x2, c_right)
            tr_y = row_y1

            # Bottom edge corners
            bl_x = lerp(row_bot_x1, row_bot_x2, c_left)
            bl_y = row_y2
            br_x = lerp(row_bot_x1, row_bot_x2, c_right)
            br_y = row_y2

            # Convert to canvas coords
            c_tl = image_to_canvas(tl_x, tl_y, img_w, img_h, canvas_rect)
            c_tr = image_to_canvas(tr_x, tr_y, img_w, img_h, canvas_rect)
            c_bl = image_to_canvas(bl_x, bl_y, img_w, img_h, canvas_rect)
            c_br = image_to_canvas(br_x, br_y, img_w, img_h, canvas_rect)

            poly = [c_tl, c_tr, c_br, c_bl]  # clockwise or counter-clockwise — ray casting handles both

            # Center for plant placement
            cx_val = (c_tl[0] + c_tr[0] + c_bl[0] + c_br[0]) / 4
            cy_val = (c_tl[1] + c_tr[1] + c_bl[1] + c_br[1]) / 4

            tiles[f'{row},{col}'] = {
                'poly': [[round(p[0], 1), round(p[1], 1)] for p in poly],
                'center': [round(cx_val, 1), round(cy_val, 1)],
            }

    return tiles


def generate_js():
    """Generate the complete SceneGrid.js file content."""

    lines = []
    lines.append('// Auto-generated scene grid definitions')
    lines.append('// Each scene has a 5x9 perspective grid mapped to canvas coordinates')
    lines.append('export const SCENE_GRIDS = {')

    for scene_id, cfg in scenes.items():
        img_w, img_h = cfg['imageSize']
        grass = cfg['grassBounds']
        canvas_rect = cfg['canvasRect']

        # Adjust perspective strength per scene
        if scene_id in ('one',):
            ps = 0.15  # Less perspective for single lane
        elif scene_id in ('dayRoof', 'nightRoof'):
            ps = 0.45  # More perspective for roof (sloped)
        elif scene_id == 'pool':
            ps = 0.30
        elif scene_id == 'fog':
            ps = 0.30
        else:
            ps = 0.35

        tiles = generate_grid(grass, img_w, img_h, canvas_rect, ps)

        # Calculate row edges and col edges for convenience
        row_edges = []
        for r in range(ROWS + 1):
            t = r / ROWS
            pt = t ** (1 + ps)
            row_edges.append(round(lerp(grass[1], grass[3], pt), 1))

        col_edges = []
        top_shrink = ps * 0.25
        mid_x_img = (grass[0] + grass[2]) / 2
        top_hw = (grass[2] - grass[0]) / 2 * (1 - top_shrink)
        top_x1 = mid_x_img - top_hw
        top_x2 = mid_x_img + top_hw

        for c in range(COLS + 1):
            t = c / COLS
            col_edges.append(round(lerp(top_x1, grass[0], 0) if c == 0 else lerp(top_x1, grass[0], 0) if False else 0, 1))

        # Simplified: just store the bounds
        lines.append(f'')
        lines.append(f'  // {scene_id}: {img_w}x{img_h} image, grass bounds in image: {grass}')
        lines.append(f'  {scene_id}: {{')
        lines.append(f'    imageSize: [{img_w}, {img_h}],')
        lines.append(f'    canvasRect: {canvas_rect},')
        lines.append(f'    rows: {ROWS},')
        lines.append(f'    cols: {COLS},')
        lines.append(f'    tiles: {{')

        for key in sorted(tiles.keys(), key=lambda k: (int(k.split(',')[0]), int(k.split(',')[1]))):
            t = tiles[key]
            poly_str = json.dumps(t['poly'])
            center_str = json.dumps(t['center'])
            lines.append(f'      "{key}": {{ poly: {poly_str}, center: {center_str} }},')

        lines.append(f'    }}')
        lines.append(f'  }},')

    lines.append('};')
    lines.append('')
    lines.append('/**')
    lines.append(' * Get the scene grid definition for a scene ID.')
    lines.append(' * Falls back to day scene if the requested scene is not found.')
    lines.append(' */')
    lines.append('export function getSceneGrid(sceneId) {')
    lines.append('  return SCENE_GRIDS[sceneId] || SCENE_GRIDS[\'day\'];')
    lines.append('}')
    lines.append('')
    lines.append('/**')
    lines.append(' * Default grid: uniform rectangular 5x9 grid (fallback when no scene grid is loaded).')
    lines.append(' * Cell size: 100x108, canvas: 900x540.')
    lines.append(' */')
    lines.append('export function createDefaultGrid() {')
    lines.append('  const tiles = {};')
    lines.append('  for (let r = 0; r < 5; r++) {')
    lines.append('    for (let c = 0; c < 9; c++) {')
    lines.append('      const x1 = c * 100;')
    lines.append('      const y1 = r * 108;')
    lines.append('      const x2 = (c + 1) * 100;')
    lines.append('      const y2 = (r + 1) * 108;')
    lines.append('      tiles[`${r},${c}`] = {')
    lines.append('        poly: [[x1, y1], [x2, y1], [x2, y2], [x1, y2]],')
    lines.append('        center: [x1 + 50, y1 + 54],')
    lines.append('      };')
    lines.append('    }')
    lines.append('  }')
    lines.append('  return { rows: 5, cols: 9, tiles };')
    lines.append('}')

    return '\n'.join(lines)


if __name__ == '__main__':
    js_code = generate_js()
    print(js_code)

    # Also print summary
    print('\n// --- Summary ---')
    for scene_id, cfg in scenes.items():
        img_w, img_h = cfg['imageSize']
        grass = cfg['grassBounds']
        cx, cy, cw, ch = cfg['canvasRect']
        # Convert grass to canvas coords
        sx = cw / img_w
        sy = ch / img_h
        cgx1 = cx + grass[0] * sx
        cgy1 = cy + grass[1] * sy
        cgx2 = cx + grass[2] * sx
        cgy2 = cy + grass[3] * sy
        print(f'// {scene_id}: canvas grass=({cgx1:.0f},{cgy1:.0f})-({cgx2:.0f},{cgy2:.0f}), size={cgx2-cgx1:.0f}x{cgy2-cgy1:.0f}')
