const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const BASE = 'extra resources/Arknights';
const files = fs.readdirSync(BASE).filter(f => f.endsWith('.png')).sort();

async function analyzePalette(filePath) {
  const img = sharp(filePath);
  const metadata = await img.metadata();
  const { width, height } = metadata;

  const stats = await img
    .resize(Math.min(width, 400), Math.min(height, 300), { fit: 'inside' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = stats;

  // Build color histogram (quantized to 32 levels per channel = 32768 buckets)
  const histogram = {};
  let totalPixels = 0;
  for (let i = 0; i < data.length; i += 3) {
    const r = Math.floor(data[i] / 32);
    const g = Math.floor(data[i + 1] / 32);
    const b = Math.floor(data[i + 2] / 32);
    const key = (r << 10) | (g << 5) | b;
    histogram[key] = (histogram[key] || 0) + 1;
    totalPixels++;
  }

  // Sort by frequency
  const sorted = Object.entries(histogram)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30);

  // Decode colors
  const topColors = sorted.map(([key, count]) => {
    const b = (key & 31) * 8 + 4;
    const g = ((key >> 5) & 31) * 8 + 4;
    const r = ((key >> 10) & 31) * 8 + 4;
    const pct = (count / totalPixels * 100).toFixed(1);
    const hsl = rgbToHsl(r, g, b);
    const brightness = (r + g + b) / 3;
    let category;
    if (brightness < 60) category = 'near-black';
    else if (brightness < 120) category = 'dark';
    else if (brightness < 180) category = 'mid-dark';
    else if (brightness < 220) category = 'mid';
    else if (brightness < 250) category = 'light';
    else category = 'near-white';
    return { r, g, b, hex: `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`, pct, hsl, category };
  });

  // Group by hue range
  const hueGroups = { 'red-orange(0-40)': 0, 'orange-yellow(40-70)': 0, 'yellow-green(70-160)': 0, 'green-cyan(160-210)': 0, 'cyan-blue(210-260)': 0, 'blue-purple(260-300)': 0, 'purple-red(300-360)': 0, 'gray(near-zero-sat)': 0 };
  const hueSamples = [];

  // Sample hue across image
  for (let y = 0; y < info.height; y += 4) {
    for (let x = 0; x < info.width; x += 4) {
      const idx = (y * info.width + x) * 3;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      const hsl = rgbToHsl(r, g, b);
      const h = hsl.h, s = hsl.s;
      if (s < 8) hueGroups['gray(near-zero-sat)']++;
      else if (h < 40) hueGroups['red-orange(0-40)']++;
      else if (h < 70) hueGroups['orange-yellow(40-70)']++;
      else if (h < 160) hueGroups['yellow-green(70-160)']++;
      else if (h < 210) hueGroups['green-cyan(160-210)']++;
      else if (h < 260) hueGroups['cyan-blue(210-260)']++;
      else if (h < 300) hueGroups['blue-purple(260-300)']++;
      else hueGroups['purple-red(300-360)']++;
    }
  }

  // Find accent colors: saturated + mid-brightness = typical UI accent
  const accents = topColors.filter(c => {
    const s = c.hsl.s;
    const l = c.hsl.l;
    return s > 20 && l > 15 && l < 85;
  }).slice(0, 5);

  // Background analysis: split into 9 zones (3x3) and get dominant color per zone
  const zoneW = Math.floor(info.width / 3);
  const zoneH = Math.floor(info.height / 3);
  const zones = [];
  for (let zr = 0; zr < 3; zr++) {
    for (let zc = 0; zc < 3; zc++) {
      const sx = zc * zoneW, sy = zr * zoneH;
      let tr = 0, tg = 0, tb = 0, count = 0;
      for (let dy = 0; dy < zoneH; dy += 2) {
        for (let dx = 0; dx < zoneW; dx += 2) {
          const idx = ((sy + dy) * info.width + (sx + dx)) * 3;
          tr += data[idx]; tg += data[idx + 1]; tb += data[idx + 2];
          count++;
        }
      }
      const avgR = Math.round(tr / count), avgG = Math.round(tg / count), avgB = Math.round(tb / count);
      const zoneName = ['top-left','top-center','top-right','mid-left','mid-center','mid-right','bottom-left','bottom-center','bottom-right'][zr * 3 + zc];
      zones.push({ zone: zoneName, color: `rgb(${avgR},${avgG},${avgB})`, brightness: Math.round((avgR + avgG + avgB) / 3) });
    }
  }

  return {
    file: path.basename(filePath),
    size: `${width}x${height}`,
    topColors: topColors.slice(0, 12),
    accents,
    hueDistribution: hueGroups,
    zoneColors: zones,
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
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  return { h, s, l, hsl: `H:${h} S:${s}% L:${l}%` };
}

(async () => {
  for (const file of files) {
    const result = await analyzePalette(path.join(BASE, file));
    console.log(`\n${'='.repeat(80)}`);
    console.log(`FILE: ${result.file}`);
    console.log(`SIZE: ${result.size}`);
    console.log(`\nTOP DOMINANT COLORS:`);
    result.topColors.forEach((c, i) => {
      console.log(`  ${(i + 1).toString().padStart(2)}. ${c.hex} (${c.pct}%) - ${c.category} [${c.hsl.hsl}]`);
    });
    console.log(`\nACCENT CANDIDATES (saturated mid-tone):`);
    result.accents.forEach(c => {
      console.log(`  ${c.hex} - ${c.hsl.hsl} (${c.pct}%)`);
    });
    console.log(`\nHUE DISTRIBUTION:`);
    const totalHue = Object.values(result.hueDistribution).reduce((a, b) => a + b, 0);
    Object.entries(result.hueDistribution).forEach(([k, v]) => {
      const bar = '█'.repeat(Math.round(v / totalHue * 60));
      console.log(`  ${k.padEnd(25)} ${(v / totalHue * 100).toFixed(1)}% ${bar}`);
    });
    console.log(`\nZONE AVERAGE COLORS (3×3 grid):`);
    for (let i = 0; i < 3; i++) {
      const row = result.zoneColors.slice(i * 3, i * 3 + 3);
      console.log(`  ${row.map(z => `${z.zone.padEnd(14)} ${z.color.padEnd(18)} br:${z.brightness}`).join('| ')}`);
    }
  }
  console.log(`\n${'='.repeat(80)}`);
  console.log('ANALYSIS COMPLETE — Round 3');
})();
