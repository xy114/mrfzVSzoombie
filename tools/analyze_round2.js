const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const BASE = 'extra resources/Arknights';
const files = fs.readdirSync(BASE).filter(f => f.endsWith('.png')).sort();

async function analyzeLayout(filePath) {
  const img = sharp(filePath);
  const metadata = await img.metadata();
  const { width, height } = metadata;

  // Resize for analysis
  const stats = await img
    .resize(Math.min(width, 600), Math.min(height, 400), { fit: 'inside' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = stats;

  // Vertical bands: average brightness per column
  const colBrightness = [];
  for (let x = 0; x < info.width; x++) {
    let sum = 0;
    for (let y = 0; y < info.height; y++) {
      const idx = (y * info.width + x) * 3;
      sum += (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
    }
    colBrightness.push(Math.round(sum / info.height));
  }

  // Horizontal bands: average brightness per row
  const rowBrightness = [];
  for (let y = 0; y < info.height; y++) {
    let sum = 0;
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * 3;
      sum += (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
    }
    rowBrightness.push(Math.round(sum / info.width));
  }

  // Find dark vertical bands (potential sidebar panels)
  const darkCols = [];
  let inDark = false, darkStart = 0;
  for (let x = 0; x < colBrightness.length; x++) {
    if (colBrightness[x] < 50 && !inDark) { inDark = true; darkStart = x; }
    if (colBrightness[x] >= 60 && inDark) {
      darkCols.push({ start: Math.round(darkStart/info.width*100), end: Math.round((x-1)/info.width*100), width: Math.round((x-darkStart)/info.width*100) });
      inDark = false;
    }
  }
  if (inDark) darkCols.push({ start: Math.round(darkStart/info.width*100), end: 100, width: Math.round((info.width-darkStart)/info.width*100) });

  // Find dark horizontal bands (potential header/footer bars)
  const darkRows = [];
  inDark = false;
  for (let y = 0; y < rowBrightness.length; y++) {
    if (rowBrightness[y] < 40 && !inDark) { inDark = true; darkStart = y; }
    if (rowBrightness[y] >= 50 && inDark) {
      darkRows.push({ start: Math.round(darkStart/info.height*100), end: Math.round((y-1)/info.height*100), height: Math.round((y-darkStart)/info.height*100) });
      inDark = false;
    }
  }
  if (inDark) darkRows.push({ start: Math.round(darkStart/info.height*100), end: 100, height: Math.round((info.height-darkStart)/info.height*100) });

  return {
    file: path.basename(filePath),
    size: `${width}x${height}`,
    darkVerticalBands: darkCols.filter(d => d.width > 3),
    darkHorizontalBands: darkRows.filter(d => d.height > 3),
    colBrightnessRange: `${Math.min(...colBrightness)}-${Math.max(...colBrightness)}`,
    rowBrightnessRange: `${Math.min(...rowBrightness)}-${Math.max(...rowBrightness)}`,
  };
}

(async () => {
  let globalDarkRight = 0;
  let globalDarkLeft = 0;
  let globalDarkTop = 0;
  let globalDarkBottom = 0;

  for (const file of files) {
    const result = await analyzeLayout(path.join(BASE, file));
    console.log(`\n${'='.repeat(70)}`);
    console.log(`FILE: ${result.file}`);
    console.log(`SIZE: ${result.size}`);
    console.log(`Col brightness: ${result.colBrightnessRange}`);
    console.log(`Row brightness: ${result.rowBrightnessRange}`);

    console.log(`DARK VERTICAL BANDS (>3% width):`);
    result.darkVerticalBands.forEach(b => {
      console.log(`  ${b.start}%-${b.end}% (width ~${b.width}% of screen)`);
      if (b.start < 20) globalDarkLeft++;
      if (b.end > 80) globalDarkRight++;
    });

    console.log(`DARK HORIZONTAL BANDS (>3% height):`);
    result.darkHorizontalBands.forEach(b => {
      console.log(`  ${b.start}%-${b.end}% (height ~${b.height}% of screen)`);
      if (b.start < 10) globalDarkTop++;
      if (b.end > 90) globalDarkBottom++;
    });
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log('AGGREGATE PATTERNS:');
  console.log(`  Left sidebar: ${globalDarkLeft}/9 images`);
  console.log(`  Right sidebar: ${globalDarkRight}/9 images`);
  console.log(`  Top bar: ${globalDarkTop}/9 images`);
  console.log(`  Bottom bar: ${globalDarkBottom}/9 images`);
})();
