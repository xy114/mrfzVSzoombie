const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const BASE = 'extra resources/Arknights';
const files = fs.readdirSync(BASE).filter(f => f.endsWith('.png')).sort();

async function analyzeImage(filePath) {
  const img = sharp(filePath);
  const metadata = await img.metadata();
  const { width, height } = metadata;

  // Get raw pixel data at reduced size for analysis
  const stats = await img
    .resize(Math.min(width, 400), Math.min(height, 300), { fit: 'inside' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = stats;

  // Sample grid: divide into 8x6 regions
  const regions = [];
  const gw = Math.floor(info.width / 8);
  const gh = Math.floor(info.height / 6);
  for (let ry = 0; ry < 6; ry++) {
    for (let rx = 0; rx < 8; rx++) {
      const sx = rx * gw;
      const sy = ry * gh;
      let r = 0, g = 0, b = 0, count = 0;
      for (let dy = 0; dy < gh; dy++) {
        for (let dx = 0; dx < gw; dx++) {
          const idx = ((sy + dy) * info.width + (sx + dx)) * 3;
          r += data[idx]; g += data[idx + 1]; b += data[idx + 2];
          count++;
        }
      }
      regions.push({
        pos: `(${rx},${ry})`, xPct: Math.round(rx / 7 * 100), yPct: Math.round(ry / 5 * 100),
        color: `rgb(${Math.round(r/count)},${Math.round(g/count)},${Math.round(b/count)})`,
        hsl: rgbToHsl(Math.round(r/count), Math.round(g/count), Math.round(b/count))
      });
    }
  }

  // Dominant dark/light regions
  const darks = regions.filter(r => {
    const m = r.color.match(/rgb\((\d+),(\d+),(\d+)\)/);
    return m && (+m[1] + +m[2] + +m[3]) < 200;
  });
  const lights = regions.filter(r => {
    const m = r.color.match(/rgb\((\d+),(\d+),(\d+)\)/);
    return m && (+m[1] + +m[2] + +m[3]) > 500;
  });

  return {
    file: path.basename(filePath),
    size: `${width}x${height}`,
    aspectRatio: (width / height).toFixed(2),
    regions,
    darkZones: darks.map(r => r.pos),
    lightZones: lights.map(r => r.pos),
    overallBrightness: Math.round(regions.reduce((s, r) => {
      const m = r.color.match(/rgb\((\d+),(\d+),(\d+)\)/);
      return s + (+m[1] + +m[2] + +m[3]);
    }, 0) / regions.length)
  };
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `hsl(${Math.round(h*360)},${Math.round(s*100)}%,${Math.round(l*100)}%)`;
}

(async () => {
  for (const file of files) {
    const result = await analyzeImage(path.join(BASE, file));
    console.log(`\n${'='.repeat(80)}`);
    console.log(`FILE: ${result.file}`);
    console.log(`SIZE: ${result.size}  Aspect: ${result.aspectRatio}`);
    console.log(`OVERALL BRIGHTNESS: ${result.overallBrightness}/765`);

    // Show dark zones (likely UI panels/bars)
    console.log(`DARK ZONES: ${result.darkZones.join(', ')}`);
    console.log(`LIGHT ZONES: ${result.lightZones.join(', ')}`);

    // Color summary: group by hue
    console.log(`\nCOLOR MAP (8×6 grid, rgb):`);
    for (let ry = 0; ry < 6; ry++) {
      const row = result.regions.filter(r => parseInt(r.pos.match(/\((\d+)/)[1]) === ry || r.yPct === Math.round(ry/5*100));
      // Actually just group by yPct
      const rowRegions = [];
      for (let rx = 0; rx < 8; rx++) {
        const r = result.regions.find(r => r.pos === `(${rx},${ry})`);
        if (r) rowRegions.push(r.color.padEnd(18));
      }
      if (rowRegions.length > 0) console.log(`  Row ${ry}: ${rowRegions.join('| ')}`);
    }
  }
  console.log('\nDone.');
})();
