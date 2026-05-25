const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const BASE = 'extra resources/Arknights';
const files = fs.readdirSync(BASE).filter(f => f.endsWith('.png')).sort();

async function analyzeEdges(filePath) {
  const img = sharp(filePath);
  const metadata = await img.metadata();
  const { width, height } = metadata;

  // Use larger size for better edge detection
  const stats = await img
    .resize(Math.min(width, 800), Math.min(height, 600), { fit: 'inside' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = stats;

  // Sobel edge detection
  const edges = [];
  for (let y = 1; y < info.height - 1; y++) {
    for (let x = 1; x < info.width - 1; x++) {
      const idx = (y * info.width + x) * 3;
      const gx = getGray(data, idx - info.width * 3 - 3) * -1 +
                 getGray(data, idx - info.width * 3 + 3) * 1 +
                 getGray(data, idx - 3) * -2 +
                 getGray(data, idx + 3) * 2 +
                 getGray(data, idx + info.width * 3 - 3) * -1 +
                 getGray(data, idx + info.width * 3 + 3) * 1;
      const gy = getGray(data, idx - info.width * 3 - 3) * -1 +
                 getGray(data, idx - info.width * 3) * -2 +
                 getGray(data, idx - info.width * 3 + 3) * -1 +
                 getGray(data, idx + info.width * 3 - 3) * 1 +
                 getGray(data, idx + info.width * 3) * 2 +
                 getGray(data, idx + info.width * 3 + 3) * 1;
      const mag = Math.sqrt(gx * gx + gy * gy);
      edges.push({ x, y, mag });
    }
  }

  // Classify edges: strong (>80), medium (>40), weak (>15)
  const strongEdges = edges.filter(e => e.mag > 80);
  const mediumEdges = edges.filter(e => e.mag > 40 && e.mag <= 80);

  // Edge density per zone (10x6 grid)
  const zoneW = Math.floor(info.width / 10);
  const zoneH = Math.floor(info.height / 6);
  const zoneDensity = [];
  for (let zr = 0; zr < 6; zr++) {
    for (let zc = 0; zc < 10; zc++) {
      const sx = zc * zoneW, ex = sx + zoneW;
      const sy = zr * zoneH, ey = sy + zoneH;
      let strong = 0, medium = 0;
      for (const e of strongEdges) {
        if (e.x >= sx && e.x < ex && e.y >= sy && e.y < ey) strong++;
      }
      for (const e of mediumEdges) {
        if (e.x >= sx && e.x < ex && e.y >= sy && e.y < ey) medium++;
      }
      const totalPixels = zoneW * zoneH;
      zoneDensity.push({
        zone: `${zc},${zr}`,
        xPct: Math.round(zc / 10 * 100),
        yPct: Math.round(zr / 6 * 100),
        strongPct: (strong / totalPixels * 100).toFixed(2),
        mediumPct: (medium / totalPixels * 100).toFixed(2),
        density: strong + medium * 0.3,
      });
    }
  }

  // Find horizontal lines (UI separators) - scan rows for long edge runs
  const hLines = [];
  for (let y = 0; y < info.height; y++) {
    let edgeRun = 0, maxRun = 0;
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * 3;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      const nextIdx = x + 1 < info.width ? ((y * info.width + x + 1) * 3) : idx;
      const nextB = x + 1 < info.width ? (data[nextIdx] + data[nextIdx + 1] + data[nextIdx + 2]) / 3 : brightness;
      if (Math.abs(brightness - nextB) > 25) {
        edgeRun++;
        maxRun = Math.max(maxRun, edgeRun);
      } else {
        edgeRun = 0;
      }
    }
    if (maxRun > info.width * 0.15) {
      hLines.push({ yPct: Math.round(y / info.height * 100), runLen: Math.round(maxRun / info.width * 100) });
    }
  }

  // Find vertical lines (panel dividers)
  const vLines = [];
  for (let x = 0; x < info.width; x++) {
    let edgeRun = 0, maxRun = 0;
    for (let y = 0; y < info.height; y++) {
      const idx = (y * info.width + x) * 3;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      const nextIdx = y + 1 < info.height ? (((y + 1) * info.width + x) * 3) : idx;
      const nextB = y + 1 < info.height ? (data[nextIdx] + data[nextIdx + 1] + data[nextIdx + 2]) / 3 : brightness;
      if (Math.abs(brightness - nextB) > 25) {
        edgeRun++;
        maxRun = Math.max(maxRun, edgeRun);
      } else {
        edgeRun = 0;
      }
    }
    if (maxRun > info.height * 0.1) {
      vLines.push({ xPct: Math.round(x / info.width * 100), runLen: Math.round(maxRun / info.height * 100) });
    }
  }

  // Calculate contrast ratio for each zone
  const zoneContrast = [];
  for (let zr = 0; zr < 6; zr++) {
    for (let zc = 0; zc < 10; zc++) {
      const sx = zc * zoneW, ex = sx + zoneW;
      const sy = zr * zoneH, ey = sy + zoneH;
      let minB = 255, maxB = 0;
      for (let y = sy; y < ey; y += 2) {
        for (let x = sx; x < ex; x += 2) {
          const idx = (y * info.width + x) * 3;
          const b = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          minB = Math.min(minB, b);
          maxB = Math.max(maxB, b);
        }
      }
      zoneContrast.push({
        zone: `${zc},${zr}`,
        range: maxB - minB,
      });
    }
  }

  return {
    file: path.basename(filePath),
    totalEdges: { strong: strongEdges.length, medium: mediumEdges.length },
    highestDensityZones: zoneDensity.sort((a, b) => b.density - a.density).slice(0, 8),
    lowestDensityZones: zoneDensity.sort((a, b) => a.density - b.density).slice(0, 5),
    hLines: hLines.filter((l, i, arr) => {
      // Merge nearby lines
      return !arr.some((l2, i2) => i2 < i && Math.abs(l2.yPct - l.yPct) < 3);
    }).slice(0, 15),
    vLines: vLines.filter((l, i, arr) => {
      return !arr.some((l2, i2) => i2 < i && Math.abs(l2.xPct - l.xPct) < 3);
    }).slice(0, 15),
    highestContrastZones: zoneContrast.sort((a, b) => b.range - a.range).slice(0, 8),
    lowestContrastZones: zoneContrast.sort((a, b) => a.range - b.range).slice(0, 5),
  };
}

function getGray(data, idx) {
  if (idx < 0 || idx + 2 >= data.length) return 0;
  return (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
}

(async () => {
  for (const file of files) {
    const result = await analyzeEdges(path.join(BASE, file));
    console.log(`\n${'='.repeat(80)}`);
    console.log(`FILE: ${result.file}`);
    console.log(`Strong edges: ${result.totalEdges.strong}  Medium edges: ${result.totalEdges.medium}`);

    console.log(`\nHORIZONTAL LINES (UI separators):`);
    result.hLines.forEach(l => {
      console.log(`  Y: ${l.yPct}%  — run length ${l.runLen}% of width`);
    });

    console.log(`\nVERTICAL LINES (panel dividers):`);
    result.vLines.forEach(l => {
      console.log(`  X: ${l.xPct}%  — run length ${l.runLen}% of height`);
    });

    console.log(`\nHIGHEST EDGE DENSITY (UI-heavy zones):`);
    result.highestDensityZones.forEach(z => {
      const bar = '▓'.repeat(Math.round(z.density * 2));
      console.log(`  [${z.zone}] (${z.xPct}%,${z.yPct}%) strong:${z.strongPct}% medium:${z.mediumPct}% ${bar}`);
    });

    console.log(`\nLOWEST EDGE DENSITY (flat/empty zones):`);
    result.lowestDensityZones.forEach(z => {
      console.log(`  [${z.zone}] (${z.xPct}%,${z.yPct}%) — flat area`);
    });

    console.log(`\nHIGHEST CONTRAST ZONES:`);
    result.highestContrastZones.forEach(z => {
      console.log(`  [${z.zone}] range: ${z.range}/255`);
    });

    console.log(`\nLOWEST CONTRAST ZONES:`);
    result.lowestContrastZones.forEach(z => {
      console.log(`  [${z.zone}] range: ${z.range}/255`);
    });
  }
  console.log(`\n${'='.repeat(80)}`);
  console.log('ANALYSIS COMPLETE — Round 4');
})();
