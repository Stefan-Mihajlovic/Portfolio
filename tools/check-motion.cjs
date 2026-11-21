// Run against the local server using the same NODE_PATH as check-portfolio.cjs.
const { chromium, devices } = require('playwright');
const assert = require('node:assert/strict');
const origin = process.env.PORTFOLIO_URL || 'http://127.0.0.1:4173';
(async () => {
  const browser = await chromium.launch({ channel: process.env.PORTFOLIO_BROWSER || 'msedge' });
  try {
    // Feed a controlled display clock to the actual star renderer. This checks
    // frame delivery, not a claim about the test machine's physical refresh rate.
    for (const mobile of [false, true]) {
      const page = await browser.newPage(mobile ? devices['iPhone 13'] : {});
      await page.route('**/motion-check', route => route.fulfill({ contentType: 'text/html', body:
        '<style>body{height:5000px}.starfield{position:fixed;inset:0;width:240px;height:160px}</style><div class="space-atmosphere"></div><div class="starfield"></div>' }));
      await page.goto(origin + '/motion-check');
      await page.evaluate(() => {
        window.clock = 0; window.frames = new Map(); window.frameID = 0; window.sampleY = 0; window.draws = 0;
        Object.defineProperty(window, 'scrollY', { get: () => sampleY });
        window.requestAnimationFrame = callback => { frames.set(++frameID, callback); return frameID; };
        window.cancelAnimationFrame = id => frames.delete(id);
        const clear = CanvasRenderingContext2D.prototype.clearRect;
        CanvasRenderingContext2D.prototype.clearRect = function (...args) { draws++; return clear.apply(this, args); };
        window.gpuDraws = 0;
        if (window.WebGL2RenderingContext) {
          const blit = WebGL2RenderingContext.prototype.blitFramebuffer;
          WebGL2RenderingContext.prototype.blitFramebuffer = function (...args) {
            if (this.canvas.classList.contains('nebula-canvas')) gpuDraws++;
            return blit.apply(this, args);
          };
        }
        window.step = hz => {
          clock += 1000 / hz;
          const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback(clock));
        };
      });
      await page.evaluate(async () => {
        const { createScrollStars } = await import('/assets/sky/scroll-stars.js');
        performance.now = () => window.clock;
        window.skyTest = createScrollStars(document.querySelector('.starfield'));
      });
      await page.waitForSelector('.scroll-stars-ready');
      const samples = await page.evaluate(() => {
        const results = [];
        for (const hz of [60, 120, 144]) {
          for (const mode of ['idle', 'scroll', 'travel']) {
            if (mode === 'travel') skyTest.travel();
            const before = draws, gasBefore = gpuDraws;
            for (let i = 0; i < 30; i++) {
              if (mode === 'scroll' && i % 5 === 0) {
                sampleY += 20;
                window.dispatchEvent(new Event('scroll'));
              }
              skyTest.setPaused(false); // Route initialization must not reset the loop.
              step(hz);
            }
            results.push({ hz, mode, draws: draws - before, gas: gpuDraws - gasBefore });
          }
        }
        skyTest.setPaused(true); step(144);
        const pausedDraws = draws, pausedGas = gpuDraws;
        for (let i = 0; i < 10; i++) step(144);
        return { results, gpu: gpuDraws > 0, pausedDraws: draws - pausedDraws, pausedGas: gpuDraws - pausedGas };
      });
      for (const sample of samples.results) assert.equal(sample.draws, 30, JSON.stringify({ mobile, ...sample }));
      if (samples.gpu) {
        for (const sample of samples.results) assert.equal(sample.gas, 30, 'GPU dust follows every display tick');
        assert.equal(samples.pausedGas, 0);
      }
      assert.equal(samples.pausedDraws, 0, 'Paused sky does not keep rendering');
      console.log(mobile ? 'Touch' : 'Desktop', 'every RAF rendered at 60/120/144Hz, idle/scroll/travel; pause stops rendering');
      await page.close();
    }
    const gasPage = await browser.newPage();
    await gasPage.goto(origin);
    const changes = await gasPage.evaluate(async () => {
      const { createDustField } = await import('/assets/sky/dust-field.js');
      const { nebulaRegion } = await import('/assets/sky/nebula.js');
      const home = nebulaRegion('/');
      const canvas = document.createElement('canvas');
      const draw = createDustField(canvas);
      const sample = (phase, camera, progress, region = home, flightId = 0) => {
        draw({ w: 320, h: 180, phase, camera, progress, region, flightId, focusX: .5, focusY: .46 });
        return canvas.toDataURL();
      };
      const still = sample(0, 0, 1);
      const idle = sample(.1, 0, 1);
      const scrolled = sample(.1, 350, 1);
      const next = nebulaRegion('/case-studies/palette-pilot/');
      const start = sample(.1, 350, 0, next, 1);
      const flight = sample(.1, 350, .45, next, 1);
      const redirect = sample(.1, 350, 0, home, 2);
      const firstCase = sample(0, 0, 1, next, 3);
      const secondCase = sample(0, 0, 1, nebulaRegion('/case-studies/tab-volume-manager/'), 4);
      const revisit = sample(0, 0, 1, nebulaRegion('/case-studies/palette-pilot/index.html'), 5);
      return [still !== idle, idle !== scrolled, scrolled === start, start !== flight, flight === redirect,
        firstCase !== secondCase, firstCase === revisit];
    });
    assert.deepEqual(changes, Array(7).fill(true), 'Route flights preserve their first frame, including on interruption');
    const pixelError = await gasPage.evaluate(async () => {
      const { createGpuDust } = await import('/assets/sky/dust-gl.js');
      const { createDustField } = await import('/assets/sky/dust-field.js');
      const { nebulaRegion } = await import('/assets/sky/nebula.js');
      const gpu = document.createElement('canvas'), cpu = document.createElement('canvas');
      const accelerated = createGpuDust(gpu);
      if (!accelerated) return null;
      const reference = createDustField(cpu);
      const copy = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
      let max = 0, total = 0, count = 0;
      for (const [flightId, progress, w, h] of [[0,1,300,165],[1,0,300,165],[1,.4,300,165],[2,0,300,165],[2,.6,165,300],[2,1,165,300]]) {
        const frame = { w, h, flightId, progress, phase: 4.25, camera: 575, focusX: .51, focusY: .46,
          region: nebulaRegion(['/', '/about/', '/projects/'][flightId]) };
        reference(frame); accelerated(frame);
        copy.canvas.width = w; copy.canvas.height = h;
        copy.drawImage(gpu, 0, 0);
        const a = cpu.getContext('2d').getImageData(0,0,w,h).data;
        const b = copy.getImageData(0,0,w,h).data;
        for (let i = 0; i < a.length; i++) {
          if (i % 4 === 3) continue;
          const difference = Math.abs(a[i] - b[i]);
          max = Math.max(max, difference); total += difference; count++;
        }
      }
      return { max, mean: total / count };
    });
    if (pixelError) {
      assert.ok(pixelError.max <= 3 && pixelError.mean < .5, 'GPU dust matches CPU rendering through interrupted flights and resize');
    }
    // Track the compact luminous core at a fixed turbulence phase. A zoom
    // moves this off-centre landmark horizontally as well as vertically.
    const corePositions = await gasPage.evaluate(async () => {
      const { createDustField } = await import('/assets/sky/dust-field.js');
      const { nebulaRegion } = await import('/assets/sky/nebula.js');
      const canvas = document.createElement('canvas');
      const draw = createDustField(canvas);
      const w = 540, h = 352, region = nebulaRegion('/');
      return [0, 1200, 0].map(camera => {
        draw({ w, h, phase: 0, camera, progress: 1, region, flightId: 0, focusX: .5, focusY: .46 });
        const { data } = canvas.getContext('2d').getImageData(0, 0, w, h);
        const red = (x, y) => data[(y * w + x) * 4];
        let best = -Infinity, point;
        for (let y = 35; y < h / 2; y++) {
          for (let x = w / 2; x < w - 3; x++) {
            const peak = 4 * red(x, y) - red(x-3, y) - red(x+3, y) - red(x, y-3) - red(x, y+3);
            if (peak > best) { best = peak; point = { x, y }; }
          }
        }
        return point;
      });
    });
    const [beforeScroll, afterScroll, returned] = corePositions;
    assert.ok(Math.abs(beforeScroll.x - afterScroll.x) <= 1 && afterScroll.y < beforeScroll.y - 10,
      'Scrolling down translates the nebula upwards without radial zoom');
    assert.deepEqual(returned, beforeScroll, 'Scrolling back restores the cloud position');
    await gasPage.close();
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
    const entrance = await page.locator('h1 .name-char').first().evaluate(el => {
      const style = getComputedStyle(el);
      return { transform: style.transform, rotate: style.rotate, filter: style.filter };
    });
    assert.ok(!entrance.transform.startsWith('matrix3d'), 'Title entrance stays in 2D');
    assert.equal(entrance.rotate, 'none', 'Hover does not add a competing 3D rotation');
    assert.equal(entrance.filter, 'none');
    // Keep the pointer still across the end of the entrance: hover must not reset.
    await page.locator('h1.name-ready').waitFor();
    assert.ok(await page.locator('h1 .name-char').first().evaluate(el => parseFloat(el.style.translate.split(' ')[1])) < -15,
      'Stationary cursor remains active when entrance finishes');
    await page.evaluate(() => {
      window.cloudCanvas = document.querySelector('.nebula-canvas');
      window.cloudFaded = false;
      cloudCanvas.addEventListener('transitionrun', e => {
        if (e.propertyName === 'opacity') window.cloudFaded = true;
      });
      window.lenisRestarts = 0;
      const Original = window.Lenis;
      window.Lenis = class extends Original { constructor(...args) { super(...args); window.lenisRestarts++; } };
    });
    await page.locator('.site-header nav a[href="/projects/"]').click();
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
    assert.ok(await page.evaluate(() => cloudFaded), 'Nebula opacity transitions across the main swap');
    await page.locator('.site-header nav a[href="/about/"]').click();
    await page.waitForURL('**/about/');
    await page.goBack();
    await page.waitForFunction(() => document.querySelector('main').dataset.page === 'projects' && !document.body.classList.contains('in-transit'));
    assert.ok(await page.evaluate(() => window.cloudCanvas === document.querySelector('.nebula-canvas')),
      'Back during arrival preserves the original sky canvas');
    assert.deepEqual(errors, []);
    console.log('Title responds during entrance; navigation preserves scroll engine; no page errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
