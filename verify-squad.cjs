const { _electron: electron } = require('playwright');
const path = require('path');

(async () => {
  const electronApp = await electron.launch({
    args: [path.join(__dirname, 'electron/main.js')],
    cwd: __dirname
  });

  // Get all windows, find the app window (not DevTools)
  const allWindows = electronApp.windows();
  console.log('Windows count:', allWindows.length);
  let page;
  for (const w of allWindows) {
    const title = await w.title();
    console.log('Window title:', title);
    if (!title.includes('DevTools') && !title.includes('devtools')) {
      page = w;
      break;
    }
  }
  if (!page) page = allWindows[0];

  await page.waitForTimeout(2000);

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('ERR:', msg.text().substr(0, 200));
  });

  await page.screenshot({ path: 'verify-1.png' });

  // Check active page and modals
  const info = await page.evaluate(() => {
    const pages = document.querySelectorAll('.page');
    const modals = document.querySelectorAll('.modal-overlay');
    const pRes = [];
    pages.forEach(p => pRes.push({ id: p.id, active: p.classList.contains('active') }));
    const mRes = [];
    modals.forEach(m => mRes.push({ id: m.id, active: m.classList.contains('active') }));
    return { pages: pRes, modals: mRes };
  });
  console.log('Info:', JSON.stringify(info, null, 2));

  // List content buttons
  const btns = await page.$$('button');
  for (const b of btns) {
    const t = (await b.textContent()).trim();
    const id = await b.getAttribute('id');
    const v = await b.isVisible();
    if (v && id) console.log(`BTN id="${id}" text="${t.slice(0,20)}"`);
  }

  // Try to directly navigate to squad
  const devInput = await page.$('#dev-input');
  if (devInput) {
    await devInput.fill('114514');
    await devInput.press('Enter');
    console.log('Dev mode enabled');
    await page.waitForTimeout(1500);
  }

  // Use eval to trigger squad select directly
  await page.evaluate(() => {
    // Try to navigate to a level detail that leads to squad
    const levelBtns = document.querySelectorAll('[id*="level"], [class*="level"]');
    console.log('Level elements found:', levelBtns.length);
  });

  // Find start button by class
  const startBtn = await page.$('[class*="btn-start"], [class*="start-btn"]');
  if (startBtn) {
    console.log('Found start button');
    await startBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'verify-2.png' });
  }

  await electronApp.close();
  console.log('Done');
})();
