const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  const outDir = 'tools/screenshots';
  const fs = require('fs');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // 1. Main page
  await page.goto('http://localhost:8088/browser.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '01-main.png'), fullPage: false });
  console.log('01-main.png captured');

  // 2. Level select
  const btnCombat = await page.$('#btn-combat');
  if (btnCombat) {
    await btnCombat.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, '02-level-select.png'), fullPage: false });
    console.log('02-level-select.png captured');
  }

  // 3. Handbook (plant)
  await page.goto('http://localhost:8088/browser.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const btnHB = await page.$('#btn-handbook');
  if (btnHB) {
    await btnHB.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, '03-handbook.png'), fullPage: false });
    console.log('03-handbook.png captured');
  }

  // 4. Enemy handbook
  await page.goto('http://localhost:8088/browser.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const btnEHB = await page.$('#btn-enemy-handbook');
  if (btnEHB) {
    await btnEHB.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, '04-enemy-handbook.png'), fullPage: false });
    console.log('04-enemy-handbook.png captured');
  }

  // 5. Settings modal
  await page.goto('http://localhost:8088/browser.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const gearBtn = await page.$('#settings-gear-btn');
  if (gearBtn) {
    await gearBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, '05-settings.png'), fullPage: false });
    console.log('05-settings.png captured');
  }

  await browser.close();
  console.log('All screenshots captured.');
})();
