// Real production UI captures, composed into three portfolio images.
// Run with the portfolio server on 4173 and Playwright + Sharp available.
const { chromium } = require('playwright');
const sharp = require('sharp');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const origin = process.env.PORTFOLIO_URL || 'http://127.0.0.1:4173';
(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  try {
    if (!process.argv.includes('--compose-only')) {
      const page = await browser.newPage({ viewport: { width: 1600, height: 1100 }, deviceScaleFactor: 2 });
      await page.goto('https://spinners.stefanmihajlovic.com/spinners/bloom', { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const editor = page.locator('#live-code textarea');
      await editor.fill('import { Bloom } from "stefans-spinners";\nexport function Demo() { return <Bloom size={72} color="#74648e" />; }');
      await editor.blur();
      await page.mouse.move(0, 0);
      await sharp(await page.locator('.controls').screenshot())
        .webp({ quality: 96 })
        .toFile(path.join(root, 'assets/covers/ui/spinners-bloom-controls.webp'));
      await page.close();
    }
    const composition = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
    const selectedView = process.argv.find(arg => arg.startsWith('--view='))?.split('=')[1];
    for (const view of (selectedView ? [selectedView] : ['gallery', 'playground', 'workflow'])) {
      await composition.goto(`${origin}/tools/project-previews/spinners.html?view=${view}`);
      await composition.waitForFunction(() => window.compositionReady);
      await composition.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(img => img.decode())); });
      await sharp(await composition.screenshot()).webp({ quality: 92 }).toFile(path.join(root, `images/stefans-spinners-${view}.webp`));
      console.log('Rendered', view);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
