const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const BASE = 'extra resources/Arknights';
const files = fs.readdirSync(BASE).filter(f => f.endsWith('.png')).sort();

async function analyzeTexture(filePath) {
  const img = sharp(filePath);
  const metadata = await img.metadata();
  const { width, height } = metadata;

  const stats = await img
    .resize(Math.min(width, 600), Math.min(height, 450), { fit: 'inside' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = stats;

  // Split into 10x7 grid for finer analysis
  const COLS = 10, ROWS = 7;
  const zoneW = Math.floor(info.width / COLS);
  const zoneH = Math.floor(info.height / ROWS);

  const zones = [];
  for (let zr = 0; zr < ROWS; zr++) {
    for (let zc = 0; zc < COLS; zc++) {
      const sx = zc * zoneW, ex = Math.min(sx + zoneW, info.width);
      const sy = zr * zoneH, ey = Math.min(sy + zoneH, info.height);

      // Collect stats
      let avgR = 0, avgG = 0, avgB = 0;
      let minB = 255, maxB = 0;
      let highFreq = 0, totalChecked = 0;

      for (let y = sy; y < ey; y += 3) {
        for (let x = sx; x < ex; x += 3) {
          const idx = (y * info.width + x) * 3;
          const r = data[idx], g = data[idx + 1], b = data[idx + 2];
          avgR += r; avgG += g; avgB += b;
          const br = (r + g + b) / 3;
          minB = Math.min(minB, br);
          maxB = Math.max(maxB, br);

          // Check for high frequency (texture/text) by comparing with neighbor
          if (x + 3 < ex && y + 3 < ey) {
            const nIdx = ((y + 3) * info.width + (x + 3)) * 3;
            const nBr = (data[nIdx] + data[nIdx + 1] + data[nIdx + 2]) / 3;
            if (Math.abs(br - nBr) > 15) highFreq++;
          }
          totalChecked++;
        }
      }

      const pixelCount = (ey - sy) / 3 * (ex - sx) / 3;
      avgR = Math.round(avgR / pixelCount);
      avgG = Math.round(avgG / pixelCount);
      avgB = Math.round(avgB / pixelCount);
      const avgBr = (avgR + avgG + avgB) / 3;
      const contrastRange = maxB - minB;
      const textureRatio = highFreq / totalChecked;

      // Classify zone type
      let zoneType;
      if (textureRatio > 0.25 && contrastRange > 80) zoneType = 'TEXT/UI-heavy';
      else if (textureRatio > 0.15) zoneType = 'TEXT/moderate';
      else if (contrastRange < 25) zoneType = 'FLAT/solid';
      else if (contrastRange < 55) zoneType = 'GRADIENT/subtle';
      else if (textureRatio < 0.05) zoneType = 'IMAGE/smooth';
      else zoneType = 'MIXED';

      zones.push({
        pos: `${zc},${zr}`,
        xPct: Math.round(zc / (COLS - 1) * 100),
        yPct: Math.round(zr / (ROWS - 1) * 100),
        avgColor: { r: avgR, g: avgG, b: avgB },
        avgBr: Math.round(avgBr),
        contrastRange: Math.round(contrastRange),
        textureRatio: Math.round(textureRatio * 100),
        type: zoneType,
      });
    }
  }

  // Count zone types
  const typeCounts = {};
  zones.forEach(z => { typeCounts[z.type] = (typeCounts[z.type] || 0) + 1; });

  // Find clusters of UI zones (TEXT/UI-heavy areas form panels)
  const uiZones = zones.filter(z => z.type === 'TEXT/UI-heavy' || z.type === 'TEXT/moderate');
  const imageZones = zones.filter(z => z.type === 'IMAGE/smooth');
  const flatZones = zones.filter(z => z.type === 'FLAT/solid');

  // Determine layout type from zone distribution
  const leftHalf = zones.filter(z => parseInt(z.pos.split(',')[0]) < COLS / 2);
  const rightHalf = zones.filter(z => parseInt(z.pos.split(',')[0]) >= COLS / 2);
  const topHalf = zones.filter(z => parseInt(z.pos.split(',')[1]) < ROWS / 2);
  const bottomHalf = zones.filter(z => parseInt(z.pos.split(',')[1]) >= ROWS / 2);

  const leftUi = leftHalf.filter(z => z.type === 'TEXT/UI-heavy').length;
  const rightUi = rightHalf.filter(z => z.type === 'TEXT/UI-heavy').length;
  const topUi = topHalf.filter(z => z.type === 'TEXT/UI-heavy').length;
  const bottomUi = bottomHalf.filter(z => z.type === 'TEXT/UI-heavy').length;

  // Detect corners: check the 4 corner zones
  const corners = {
    'top-left': zones.find(z => z.pos === `0,0`),
    'top-right': zones.find(z => z.pos === `${COLS - 1},0`),
    'bottom-left': zones.find(z => z.pos === `0,${ROWS - 1}`),
    'bottom-right': zones.find(z => z.pos === `${COLS - 1},${ROWS - 1}`),
  };

  // Color palette within UI zones only (exclude image zones)
  const uiColorClusters = {};
  uiZones.forEach(z => {
    const key = `${Math.round(z.avgColor.r / 20) * 20},${Math.round(z.avgColor.g / 20) * 20},${Math.round(z.avgColor.b / 20) * 20}`;
    uiColorClusters[key] = (uiColorClusters[key] || 0) + 1;
  });
  const topUiColors = Object.entries(uiColorClusters)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k, v]) => {
      const [r, g, b] = k.split(',').map(Number);
      const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      return { hex, count: v };
    });

  return {
    file: path.basename(filePath),
    zoneTypes: typeCounts,
    layoutBias: {
      leftUi, rightUi,
      uiBias: rightUi > leftUi * 1.5 ? 'RIGHT-HEAVY' : leftUi > rightUi * 1.5 ? 'LEFT-HEAVY' : 'BALANCED',
      topUi, bottomUi,
      vertBias: bottomUi > topUi * 1.5 ? 'BOTTOM-HEAVY' : topUi > bottomUi * 1.5 ? 'TOP-HEAVY' : 'VERT-BALANCED',
    },
    uiZoneColors: topUiColors,
    corners,
    // Full zone type grid for visualization
    typeGrid: Array.from({ length: ROWS }, (_, r) =>
      Array.from({ length: COLS }, (_, c) => {
        const z = zones.find(z => z.pos === `${c},${r}`);
        return z ? z.type.charAt(0) : '?';
      }).join(' ')
    ),
    imageZonePositions: imageZones.map(z => z.pos),
  };
}

(async () => {
  for (const file of files) {
    const result = await analyzeTexture(path.join(BASE, file));
    console.log(`\n${'='.repeat(80)}`);
    console.log(`FILE: ${result.file}`);
    console.log(`\nZONE TYPE DISTRIBUTION:`);
    Object.entries(result.zoneTypes).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
      const bar = '█'.repeat(v);
      console.log(`  ${k.padEnd(18)} ${v.toString().padStart(2)}/70 ${bar}`);
    });

    console.log(`\nLAYOUT BIAS:`);
    console.log(`  UI zones: left=${result.layoutBias.leftUi} right=${result.layoutBias.rightUi} → ${result.layoutBias.uiBias}`);
    console.log(`  UI zones: top=${result.layoutBias.topUi} bottom=${result.layoutBias.bottomUi} → ${result.layoutBias.vertBias}`);

    console.log(`\nUI ZONE DOMINANT COLORS (non-image UI areas):`);
    result.uiZoneColors.forEach(c => {
      console.log(`  ${c.hex} (${c.count} zones)`);
    });

    console.log(`\nCORNER ZONES:`);
    Object.entries(result.corners).forEach(([k, v]) => {
      if (v) console.log(`  ${k.padEnd(14)} ${v.type.padEnd(18)} avg:rgb(${v.avgColor.r},${v.avgColor.g},${v.avgColor.b}) br:${v.avgBr}`);
    });

    console.log(`\nZONE TYPE GRID (T=TEXT, M=moderate, F=FLAT, G=GRADIENT, I=IMAGE, X=MIXED):`);
    result.typeGrid.forEach(row => console.log(`  ${row}`));

    console.log(`\nIMAGE/SMOOTH ZONE POSITIONS (character art areas):`);
    console.log(`  ${result.imageZonePositions.join(', ')}`);
  }
  console.log(`\n${'='.repeat(80)}`);
  console.log('ANALYSIS COMPLETE — Round 5 (Final)');
})();
