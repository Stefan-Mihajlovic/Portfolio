// Run against the local server using the same NODE_PATH as check-portfolio.cjs.
const { chromium, devices } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const origin = process.env.PORTFOLIO_URL || 'http://127.0.0.1:4173';
(async () => {
  const browser = await chromium.launch({ channel: process.env.PORTFOLIO_BROWSER || 'msedge' });
  try {
    // Feed a controlled display clock to the actual star renderer. This checks
    // frame delivery, not a claim about the test machine's physical refresh rate.
    for (const mobile of [false, true]) {
      const page = await browser.newPage(mobile ? devices['iPhone 13'] : {});
      await page.route('**/motion-check', route => route.fulfill({ contentType: 'text/html', body:
        '<style>body{height:5000px}.starfield{position:fixed;inset:0}</style><div class="starfield"></div>' }));
      await page.goto(origin + '/motion-check');
      await page.evaluate(() => {
        window.clock = 0; window.frames = new Map(); window.frameID = 0; window.sampleY = 0; window.draws = 0;
        Object.defineProperty(window, 'scrollY', { get: () => sampleY });
        window.requestAnimationFrame = callback => { frames.set(++frameID, callback); return frameID; };
        window.cancelAnimationFrame = id => frames.delete(id);
        const clear = CanvasRenderingContext2D.prototype.clearRect;
        CanvasRenderingContext2D.prototype.clearRect = function (...args) { draws++; return clear.apply(this, args); };
        window.step = hz => {
          clock += 1000 / hz;
          const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback(clock));
        };
      });
      const source = fs.readFileSync('assets/sky/scroll-stars.js', 'utf8')
        .replace('export function createScrollStars(host)', 'window.createScrollStars = function(host)')
        .replaceAll('performance.now()', 'window.clock');
      await page.addScriptTag({ content: source });
      await page.evaluate(() => { window.skyTest = createScrollStars(document.querySelector('.starfield')); });
      await page.waitForSelector('.scroll-stars-ready');
      const samples = await page.evaluate(() => {
        const results = [];
        for (const hz of [60, 120, 144]) {
          for (const mode of ['idle', 'scroll', 'travel']) {
            if (mode === 'travel') skyTest.travel();
            const before = draws;
            for (let i = 0; i < 30; i++) {
              if (mode === 'scroll' && i % 5 === 0) sampleY += 20;
              skyTest.setPaused(false); // Route initialization must not reset the loop.
              step(hz);
            }
            results.push({ hz, mode, draws: draws - before });
          }
        }
        skyTest.setPaused(true); step(144);
        const pausedDraws = draws;
        for (let i = 0; i < 10; i++) step(144);
        return { results, pausedDraws: draws - pausedDraws };
      });
      for (const sample of samples.results) assert.equal(sample.draws, 30, JSON.stringify({ mobile, ...sample }));
      assert.equal(samples.pausedDraws, 0, 'Paused sky does not keep rendering');
      console.log(mobile ? 'Touch' : 'Desktop', 'every RAF rendered at 60/120/144Hz, idle/scroll/travel; pause stops rendering');
      await page.close();
    }
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1.animated-title .name-anchor');
    const anchor = await page.locator('h1 .name-anchor').first().boundingBox();
    await page.mouse.move(anchor.x + anchor.width / 2, anchor.y + anchor.height / 2);
    await page.waitForTimeout(50);
    const hover = await page.evaluate(() => {
      const title = document.querySelector('h1'), letter = title.querySelector('.name-char');
      return { entranceStillPlaying: !title.classList.contains('name-ready'), translate: parseFloat(letter.style.translate.split(' ')[1]) };
    });
    assert.equal(hover.entranceStillPlaying, true, 'Hover works before entrance ends');
    assert.ok(hover.translate < -10, 'Title reacts within 50ms');
    // Keep the pointer still across the end of the entrance: hover must not reset.
    await page.locator('h1.name-ready').waitFor();
    assert.ok(await page.locator('h1 .name-char').first().evaluate(el => parseFloat(el.style.translate.split(' ')[1])) < -15,
      'Stationary cursor remains active when entrance finishes');
    await page.evaluate(() => {
      window.lenisRestarts = 0;
      const Original = window.Lenis;
      window.Lenis = class extends Original { constructor(...args) { super(...args); window.lenisRestarts++; } };
    });
    await page.locator('nav a[href="/projects/"]').click();
    await page.waitForURL('**/projects/');
    await page.waitForFunction(() => !document.body.classList.contains('in-transit'));
    assert.equal(await page.evaluate(() => lenisRestarts), 0, 'Navigation preserves scroll engine');
    assert.equal(await page.evaluate(() => scrollY), 0, 'New route starts at top');
    const title = page.locator('h1');
    const point = await title.locator('.name-anchor').nth(2).boundingBox();
    await page.mouse.move(point.x + point.width / 2, point.y + point.height / 2);
    await page.waitForTimeout(50);
    assert.ok(await title.locator('.name-char').nth(2).evaluate(el => parseFloat(el.style.translate.split(' ')[1])) < -10,
      'Real mouse hover responds immediately on the next route');
    assert.equal(await title.locator('.name-char').first().evaluate(el => getComputedStyle(el).filter), 'none');
    assert.deepEqual(errors, []);
    console.log('Title responds during entrance; navigation preserves scroll engine; no page errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
