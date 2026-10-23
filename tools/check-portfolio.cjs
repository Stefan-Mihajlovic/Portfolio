// Run against a local server: NODE_PATH=/path/to/node_modules node tools/check-portfolio.cjs
// Browser can be selected with PORTFOLIO_BROWSER (defaults to msedge).
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const origin = process.env.PORTFOLIO_URL || "http://127.0.0.1:4173";
(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PORTFOLIO_BROWSER || "msedge",
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  // Sample the animated frames too: settled-page checks miss exit-scale overflow.
  await page.addInitScript(() => {
    window.transitionOverflow = [];
    let frame = 0;
    document.addEventListener('click', event => {
      const link = event.target.closest('a[href]');
      if (!link || link.origin !== location.origin || link.pathname === location.pathname) return;
      cancelAnimationFrame(frame);
      const started = performance.now();
      const sample = () => {
        if (document.body.classList.contains('in-transit')) {
          const excess = document.documentElement.scrollWidth - document.documentElement.clientWidth;
          if (excess > 1) window.transitionOverflow.push(excess);
        }
        if (performance.now() - started < 2000) frame = requestAnimationFrame(sample);
      };
      frame = requestAnimationFrame(sample);
    });
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400 && !response.url().includes("/.netlify/"))
      errors.push(`${response.status()} ${response.url()}`);
  });
  const routes = [
    "/",
    "/projects/",
    "/about/",
    "/skills/",
    "/contact/",
    "/optiflowz/",
    "/crimson-music/",
    "/eaes-video-corner/",
    "/case-studies/palette-pilot/",
    "/case-studies/tab-volume-manager/",
    "/404.html",
  ];
  // The subtitle gives the name a head start, then joins its entrance.
  await page.goto(origin, { waitUntil: "domcontentloaded" });
  await page.locator('.work-card.revealed').first().waitFor();
  assert.equal(await page.locator('h1').evaluate(el => el.classList.contains('name-ready')), false, 'Project enters before title animation ends');
  assert.equal(await page.locator('.hero-details > p').first().evaluate(el => el.classList.contains('revealed')), false, 'Subtitle gives name a head start');
  await page.locator('.hero-details > p.revealed').waitFor();
  assert.equal(await page.locator('h1').evaluate(el => el.classList.contains('name-ready')), false, 'Subtitle starts before name animation ends');
  for (const route of routes) {
    await page.goto(origin + route, { waitUntil: "networkidle" });
    assert.equal(
      await page.locator("h1").count(),
      1,
      route + " has one heading",
    );
    // Load lazy images, checking both image and local link integrity.
    const assets = await page
      .locator("img")
      .evaluateAll((images) => images.map((img) => img.src).filter(Boolean));
    for (const src of assets)
      assert.ok((await context.request.get(src)).ok(), `Missing image: ${src}`);
    const links = await page
      .locator("a[href]")
      .evaluateAll((links) => links.map((a) => a.href));
    for (const href of new Set(
      links.filter((href) => href.startsWith(origin)),
    )) {
      assert.ok(
        (await context.request.get(href)).ok(),
        `Broken local link: ${href}`,
      );
    }
    await page.setViewportSize({ width: 360, height: 800 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      route + " mobile overflow",
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  await page.goto(origin);
  assert.equal(await page.locator(".work-card").count(), 3);
  await page.locator('nav a[href="/projects/"]').click();
  await page.waitForURL("**/projects/");
  await page.waitForTimeout(1000);
  assert.deepEqual(await page.evaluate(() => window.transitionOverflow), [], 'Desktop transitions do not create horizontal scrolling');
  assert.equal(await page.locator(".work-card").count(), 10);
  // Keep the persistent sky through page changes.
  await page
    .locator(".starfield")
    .evaluate((el) => (el.dataset.testPersistent = "true"));
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: "instant" }));
  await page.waitForTimeout(300);
  const scrollBefore = await page.evaluate(() => scrollY);
  await page.locator('nav a[href="/about/"]').click();
  await page.waitForURL("**/about/");
  await page.waitForTimeout(1000);
  assert.equal(
    await page.locator(".starfield").getAttribute("data-test-persistent"),
    "true",
  );
  await page.goBack();
  await page.waitForTimeout(1400);
  assert.ok(
    Math.abs((await page.evaluate(() => scrollY)) - scrollBefore) < 10,
    "Back restores scroll",
  );
  await page.goto(origin + "/optiflowz/");
  await page.locator(".gallery-image").first().click();
  await page.waitForFunction(() => document.querySelector("dialog").open);
  assert.equal(await page.locator("dialog").evaluate((d) => d.open), true);
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector("dialog").open);
  assert.equal(await page.locator("dialog").evaluate((d) => d.open), false);
  await page.goto(origin + "/contact/");
  // Mock both outcomes: no real email is sent by verification.
  await page.route("**/.netlify/functions/contact", (route) =>
    route.fulfill({ status: 200, body: "{}" }),
  );
  const fillForm = async () => {
    await page.locator("#name").fill("Test");
    await page.locator("#email").fill("test@example.com");
    await page.locator("#message").fill("Verification only");
  };
  await fillForm();
  await page.locator("button[type=submit]").click();
  await page.getByRole("status").filter({ hasText: "Message sent" }).waitFor();
  await page.unroute("**/.netlify/functions/contact");
  await page.route("**/.netlify/functions/contact", (route) =>
    route.fulfill({ status: 500, body: "{}" }),
  );
  await fillForm();
  await page.locator("button[type=submit]").click();
  await page.getByRole("status").filter({ hasText: "wasn’t sent" }).waitFor();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(origin);
  await page.waitForTimeout(400);
  assert.ok(
    await page
      .locator(".project-film")
      .evaluateAll((videos) =>
        videos.every((video) => video.paused && !video.currentSrc),
      ),
    "Reduced motion does not load background videos",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.locator('#primary-nav').evaluate(el => getComputedStyle(el).visibility), 'hidden', 'Resize keeps closed menu hidden');
  assert.equal(await page.locator('#primary-nav').evaluate(el => getComputedStyle(el).transitionDuration), '0s', 'Breakpoint has no menu animation');
  const contentBeforeMenu = await page.locator('main').boundingBox();
  await page.locator(".menu-toggle").click();
  const contentWithMenu = await page.locator('main').boundingBox();
  assert.equal(contentWithMenu.x, contentBeforeMenu.x, 'Opening menu keeps content in place');
  assert.equal(contentWithMenu.width, contentBeforeMenu.width, 'Opening menu does not scale content');
  assert.equal(await page.locator('main').evaluate(el => getComputedStyle(el).transform), 'none');
  assert.ok(await page.locator('#primary-nav').evaluate(el => getComputedStyle(el).transitionDuration.includes('0.7s')), 'User toggle retains slide animation');
  await page.setViewportSize({ width: 900, height: 844 });
  // Let the breakpoint change dispatch before crossing back; back-to-back
  // viewport commands can coalesce into a single browser rendering update.
  await page.waitForFunction(() => !document.body.classList.contains("menu-animated"));
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.locator('#primary-nav').evaluate(el => getComputedStyle(el).visibility), 'hidden', 'Resizing an opened menu closes without sliding');
  assert.equal(await page.locator('#primary-nav').evaluate(el => getComputedStyle(el).transitionDuration), '0s', 'Resize clears prior toggle animation');
  await page.locator(".menu-toggle").click();
  assert.equal(
    await page.locator(".menu-toggle").getAttribute("aria-expanded"),
    "true",
  );
  await page.locator('nav a[href="/projects/"]').click();
  await page.waitForURL("**/projects/");
  await page.waitForTimeout(1100);
  assert.deepEqual(await page.evaluate(() => window.transitionOverflow), [], 'Mobile transitions do not create horizontal scrolling');
  assert.equal(
    await page.locator(".menu-toggle").getAttribute("aria-expanded"),
    "false",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: 11 routes, local assets and links, 360px layouts, 3/10 projects, persistent sky, history restoration, gallery, mobile menu, reduced motion, and mocked form success/failure.",
  );
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
