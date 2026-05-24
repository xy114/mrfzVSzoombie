# UI Visibility Fix + Portrait/Card Redesign

## Context

Multiple UI elements are invisible or hard to see due to dark-on-dark color scheme. The main page standee, gear settings button, and handbook buttons all suffer from poor contrast. Additionally, plant/zombie cards need a redesign using PvZ Almanac card backgrounds with cropped character sprites.

## Changes

### 1. Gear Icon — Bright Redraw

**File: `game/js/UIManager.js`** — `drawGearIcon()`
- Replace dark grays (`#4a5568`–`#6d7a90`) with cyan palette (`#7dddfb`–`#4dc9f6`)
- Stroke: `rgba(77, 201, 246, 0.6)`
- Center hole: keep dark, add inner glow ring

### 2. Main Page Standee — Borderless Image Display

**File: `game/css/ui.css`**
- `#standee-frame`: remove `border`, `background`, `box-shadow`, `::before`, `::after` decorations
- Keep flex centering only

**File: `game/js/UIManager.js`** — `refreshDisplayPlant()`
- When plant image is loaded: use `img.naturalWidth`/`naturalHeight` to compute proportional scaling, max width 200px
- Canvas size adjusts to match
- Fallback: programmatic portrait drawing

### 3. All Buttons — Contrast Enhancement

**File: `game/css/ui.css`**
- `.btn-ark`: background `#1a1a3a`, border `rgba(77,201,246,0.35)`
- `#dev-btn`: text `var(--text-secondary)`, border `rgba(255,255,255,0.12)`
- `.combat-plant-card`: background `#1a1a35`
- Ensure all hover states have visible glow

### 4. Handbook Cards — Almanac Card Base + Cropped Sprite

**File: `game/js/AssetManager.js`**
- Add: `plant_card_bg: 'resources/others/Almanac_PlantCard.png'`
- Add: `zombie_card_bg: 'resources/others/Almanac_ZombieCard.png'`

**File: `game/js/UIManager.js`** — `renderHandbook()`, `renderEnemyHandbook()`
- Card structure (3 layers):
  1. Base: Almanac card background image (168x220)
  2. Middle: plant/zombie GIF cropped to upper half (source: `0, 0, img.width, img.height*0.55`), scaled to ~100px wide centered
  3. Top: name text + stars/threat badge
- Locked cards: dark overlay + "???"

### 5. Plant Portrait Without Skin

Already handled by `_drawPortrait()` image-first logic from prior changes. Proportional scaling added per item 2.

## Files Modified

| File | Changes |
|------|---------|
| `game/js/UIManager.js` | `drawGearIcon()` colors, `refreshDisplayPlant()` proportional scaling, `renderHandbook()`/`renderEnemyHandbook()` card redesign |
| `game/css/ui.css` | Standee frame border removal, button contrast, card styles |
| `game/js/AssetManager.js` | Add `plant_card_bg`, `zombie_card_bg` paths |

## Verification

1. Open `browser.html` → gear icon clearly visible in top-left corner
2. Main page standee shows plant GIF (no border frame)
3. Four main-page buttons all visible with clear text and borders
4. Open plant handbook → cards show Almanac card background + cropped plant sprite
5. Open enemy handbook → cards show Almanac card background + cropped zombie sprite
6. Locked cards show dark overlay
