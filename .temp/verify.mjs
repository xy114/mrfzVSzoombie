import { chromium } from 'playwright';

const BASE = 'http://localhost:8899';

async function screenshot(path, pageName) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(`${BASE}/browser.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Navigate to the target page if needed
  if (pageName === 'handbook') {
    await page.click('#btn-handbook');
    await page.waitForTimeout(800);
  } else if (pageName === 'enemy-handbook') {
    await page.click('#btn-enemy-handbook');
    await page.waitForTimeout(800);
  }

  await page.screenshot({ path, fullPage: false });
  console.log(`Screenshot saved: ${path}`);
  await browser.close();
}

try {
  await screenshot('.temp/main-page.png', 'main');
  await screenshot('.temp/handbook.png', 'handbook');
  await screenshot('.temp/enemy-handbook.png', 'enemy-handbook');
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
