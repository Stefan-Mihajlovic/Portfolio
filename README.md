<h1>
  <img src="images/logo.png" alt="SM logo" width="36" height="36" align="absmiddle">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="images/readme-name-dark.svg">
    <img src="images/readme-name-light.svg" alt="Stefan Mihajlovic" width="320" height="44" align="absmiddle">
  </picture>
</h1>

I'm a web designer and developer based in Belgrade, combining UI/UX design and frontend development to create websites, digital products, and browser extensions.

Design came first; development gave me a way to bring those ideas to life. I enjoy taking projects from the first concept to the final detail, and I'm currently studying at the Faculty of Organizational Sciences in Belgrade.

[Explore my portfolio](https://stefanmihajlovic.com/)

## Local preview

Run `npm ci`, `npm run build`, then `npm run preview` and open `http://127.0.0.1:4174`.
The preview supports compression, video byte ranges, and the site's Netlify headers. It does not send contact messages. For a simple source preview, `python3 -m http.server 4173` still works after a build.

Edit `portfolio.css` and `portfolio.js`, then run `npm run build`. The HTML uses the generated files in `assets/build/`; the build bundles the sky module too. Netlify builds automatically into `dist/`, with content-based CSS/JS version tokens. The published folder excludes tools, reports, dependencies, and scratch files. Existing contact function environment variables stay in Netlify.

When changing source images, run `npm run images` to regenerate responsive previews and HTML `srcset` attributes. Full-size originals are retained for the image viewer. Phone-sized background films are generated with `python3 tools/build-mobile-motion.py` (requires ffmpeg).

## Verification

See the [29 October 2026 performance and SEO audit](docs/performance-audit-2026-10-29.md) for measured results and validation limits.

With the preview running:

```sh
PORTFOLIO_URL=http://127.0.0.1:4174 npm test
PORTFOLIO_URL=http://127.0.0.1:4174 npm run test:motion
CHROME_PATH="/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" npm run audit
```

Browser checks default to installed Microsoft Edge; set `PORTFOLIO_BROWSER` to another installed Playwright Chromium channel. Lighthouse produces HTML/JSON reports under ignored `audit-results/latest/`, auditing all 11 portfolio pages on mobile and desktop. Set `AUDIT_URL`, `AUDIT_LABEL`, `AUDIT_ROUTES` (comma-separated paths), or `AUDIT_MODES` to customize the run. Each report records the actual emulation and throttling settings. Run Lighthouse without other browser tests in parallel to avoid CPU contention.

SEO checks cover all sitemap pages with JavaScript disabled, unique titles/descriptions, canonical URLs, JSON-LD syntax, internal resources, the 404 noindex directive, and metadata after client-side navigation. These checks do not guarantee search rankings or replace real-user Core Web Vitals.

The [design investigation](docs/design-research.md) records 41 reviewed references and the decisions behind the layout. Background films can be regenerated with `tools/generate-motion.py` (Python, NumPy, Pillow and imageio-ffmpeg). Browser checks are in `tools/check-portfolio.cjs` and require Playwright; use `PORTFOLIO_BROWSER` to choose an installed Chromium browser. The contact endpoint runs on Netlify; the local static server cannot send messages.
