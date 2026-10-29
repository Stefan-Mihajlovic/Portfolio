// Audit every sitemap URL as a crawler, without requiring client-side JavaScript.
const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const origin = process.env.PORTFOLIO_URL || 'http://127.0.0.1:4173';
const canonicalOrigin = 'https://stefanmihajlovic.com';
(async () => {
  const sitemap = await fs.readFile('sitemap.xml', 'utf8');
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
  const browser = await chromium.launch({ channel: process.env.PORTFOLIO_BROWSER || 'msedge' });
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const failures = [], titles = new Set(), descriptions = new Set(), resources = new Set();
  const check = (valid, message) => { if (!valid) failures.push(message); };
  try {
    check(new Set(urls).size === urls.length, 'Duplicate URLs in sitemap');
    for (const url of urls) {
      const route = new URL(url).pathname;
      const response = await page.goto(origin + route, { waitUntil: 'domcontentloaded' });
      check(response.ok(), `${route}: HTTP ${response.status()}`);
      const data = await page.evaluate(() => ({
        title: document.title,
        lang: document.documentElement.lang,
        description: document.querySelector('meta[name="description"]')?.content,
        canonical: [...document.querySelectorAll('link[rel="canonical"]')].map(el => el.href),
        robots: document.querySelector('meta[name="robots"]')?.content || '',
        headings: document.querySelectorAll('h1').length,
        missingAlt: [...document.images].filter(img => !img.hasAttribute('alt')).map(img => img.src),
        schemas: [...document.querySelectorAll('script[type="application/ld+json"]')].map(el => el.textContent),
        resources: [...document.querySelectorAll('a[href], img[src], script[src], link[href]')]
          .map(el => el.href || el.src).filter(Boolean),
      }));
      check(data.lang === 'en', `${route}: missing English language declaration`);
      check(data.title && !titles.has(data.title), `${route}: missing/duplicate title`);
      check(data.description && !descriptions.has(data.description), `${route}: missing/duplicate description`);
      titles.add(data.title); descriptions.add(data.description);
      check(data.headings === 1, `${route}: expected one H1, got ${data.headings}`);
      check(data.canonical.length === 1 && data.canonical[0] === url, `${route}: incorrect canonical`);
      check(!data.robots.includes('noindex'), `${route}: sitemap contains a noindex page`);
      check(!data.missingAlt.length, `${route}: images without alt: ${data.missingAlt}`);
      for (const schema of data.schemas) {
        try { const parsed = JSON.parse(schema); check(parsed['@context'] === 'https://schema.org', `${route}: unexpected schema context`); }
        catch { failures.push(`${route}: invalid JSON-LD`); }
      }
      data.resources.forEach(url => {
        if (url.startsWith(origin + '/') || url.startsWith(canonicalOrigin + '/')) {
          const resource = new URL(url);
          if (!resource.hash) resources.add(resource.pathname + resource.search);
        }
      });
    }
    for (const resource of resources) {
      const response = await context.request.get(origin + resource);
      check(response.ok(), `${resource}: broken internal resource (${response.status()})`);
    }
    await page.goto(origin + '/404.html');
    check((await page.locator('meta[name="robots"]').getAttribute('content')).includes('noindex'), '404 must be noindex');
    check((await (await context.request.get(origin + '/robots.txt')).text()).includes(canonicalOrigin + '/sitemap.xml'), 'robots.txt missing sitemap');
    // SPA navigation must update all page-specific metadata, including JSON-LD.
    const interactive = await browser.newPage();
    await interactive.goto(origin);
    await interactive.locator('.site-header nav a[href="/projects/"]').click();
    await interactive.waitForURL('**/projects/');
    await interactive.waitForFunction(() => document.querySelector('script[type="application/ld+json"]')?.textContent.includes('CollectionPage'));
    check(await interactive.locator('meta[name="twitter:title"]').getAttribute('content') === await interactive.title(), 'SPA Twitter title is stale');
    console.log(`SEO: ${urls.length} sitemap pages, ${resources.size} internal resources, no-JS content and SPA metadata checked.`);
    if (failures.length) throw Error(failures.join('\n'));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
