# Portfolio audit — 29 October 2026

The production build passes the automated SEO, accessibility and best-practices audits at **100/100 on all 11 main pages**, on mobile and desktop. Desktop performance is **100/100 throughout**; mobile performance is **84–95**. No measured layout shifts or blocking time occurred in the final navigation audits (CLS 0, TBT 0 ms).

These are local laboratory results, not deployed-site or real-user measurements. The changes have not been deployed.

## Final production build

Lighthouse **13.6.0**, Microsoft Edge **156**, clean navigation runs, one at a time. Tested `dist/` via the production-like preview with gzip, byte ranges and Netlify headers. Mobile uses Lighthouse's default simulated throttling: 150 ms RTT, 1.6 Mbps throughput and 4× CPU slowdown, viewport 412×823 at DPR 1.75. Desktop uses Lighthouse's actual desktop configuration, verified by the runner. Animations and media are enabled; no audit-specific rendering branch is used.

| Page | Mobile performance | Desktop performance | Mobile LCP |
| --- | ---: | ---: | ---: |
| `/` | 90 | 100 | 3.68s |
| `/projects/` | 84 | 100 | 4.58s |
| `/about/` | 89 | 100 | 3.75s |
| `/skills/` | 94 | 100 | 3.15s |
| `/contact/` | 95 | 100 | 3.00s |
| `/crimson-music/` | 93 | 100 | 3.23s |
| `/optiflowz/` | 94 | 100 | 3.15s |
| `/eaes-video-corner/` | 92 | 100 | 3.38s |
| `/case-studies/stefans-spinners/` | 95 | 100 | 3.00s |
| `/case-studies/palette-pilot/` | 92 | 100 | 3.38s |
| `/case-studies/tab-volume-manager/` | 90 | 100 | 3.60s |

All rows score 100 in SEO, accessibility and best practices in both modes. Lighthouse 13's agentic-browsing category also scores 100 throughout.

## Controlled before/after comparison

Both sides below used Lighthouse **12.8.2**, the same browser and production-like preview settings. The baseline came from the repository's original HEAD, before these edits. This separate comparison avoids treating a Lighthouse version change as a performance improvement. The final build was then independently rechecked with Lighthouse 13.6.0 above.

| Page | Mobile performance | Mobile LCP |
| --- | ---: | ---: |
| `/` | 76 → 90 | 8.10s → 3.68s |
| `/projects/` | 75 → 84 | 10.65s → 4.58s |
| `/about/` | 75 → 89 | 8.48s → 3.75s |
| `/skills/` | 84 → 94 | 4.58s → 3.15s |
| `/contact/` | 82 → 95 | 4.88s → 3.00s |
| `/crimson-music/` | 76 → 93 | 7.20s → 3.23s |
| `/case-studies/stefans-spinners/` | 83 → 95 | 4.73s → 3.00s |

## Changes made

- Added responsive WebP image previews, an AVIF portrait, accurate dimensions and `sizes`. Full-resolution originals still load in the image viewer.
- Added 640×360 phone versions of decorative video loops, about 64% smaller, preserving their frame rate and duration. Desktop originals remain in use on larger screens.
- Deferred offscreen background posters and video downloads. Posters appear on entry; new video downloads start when 35% of a card is visible. Videos pause offscreen and respect reduced-motion/save-data preferences.
- Replaced the eager YouTube embed with a local preview. The player loads only on click; the link works without JavaScript.
- Bundled/minified the portfolio JavaScript, sky module and stylesheet. The production build versions CSS/JS URLs by their contents.
- Added a dedicated `dist/` publishing folder, Netlify build configuration, cache rules and basic security headers. Dependencies, reports and development tools stay outside the published directory.
- Fixed the projects heading hierarchy, missing Font Pirate privacy metadata, and sitemap coverage. Client-side navigation now updates all Open Graph/Twitter metadata and JSON-LD.
- Replaced the oversized browser favicon with a small 32px version and added a dedicated Apple touch icon.
- Added repeatable Lighthouse/SEO scripts and upgraded audit/image tooling. `npm audit` reports **0 vulnerabilities** in the installed dependency tree.

## Validation

- `npm run build` succeeds.
- `npm test`: 12 portfolio routes; local assets/links; 360px layouts; project counts; persistent starfield; browser history; gallery; mobile menu; reduced motion; mocked contact success/failure.
- SEO crawler: all **20 sitemap URLs**, **100 internal links/resources**, JavaScript disabled, unique titles/descriptions, canonical URLs, one H1, image alt attributes, JSON-LD syntax, robots/sitemap and 404 noindex. Also checks metadata after client-side navigation.
- `npm run test:motion`: star renderer responds to controlled 60/120/144 Hz RAF input; pause stops rendering; title responds during entrance; navigation preserves the scroll engine. This verifies scheduling, not physical-device FPS.
- Additional WebKit phone-emulation check: rounded/clipped playing video cards, mobile video selection, no horizontal overflow, portrait rendering, no JavaScript errors, no background video source under reduced motion. YouTube makes no initial request and loads on click (player response mocked).
- Production preview returns HTTP 404 for missing URLs and excluded development files, redirects directory URLs, and serves the configured cache/content-type headers.
- `git diff --check` passes.

## Remaining limits

The Projects page remains the heaviest mobile route (84, LCP 4.58s under simulated slow conditions). Its animated visual content is retained. The other mobile pages still have room to improve LCP; a Lighthouse score of 90+ does not itself mean all Core Web Vitals thresholds are met.

The localhost preview cannot reproduce CDN latency, Netlify function execution or actual iPhone hardware. Contact tests mock responses and do not send email. After deployment, rerun against the public URL and check Search Console/real-user Core Web Vitals. Structured-data syntax checks are not a rich-result eligibility guarantee; SEO scores do not guarantee rankings.

## Reproduce

Requires Node 22.19+ and an installed Chromium browser.

```sh
npm ci
npm run build
npm run preview
```

In another terminal:

```sh
PORTFOLIO_URL=http://127.0.0.1:4174 npm test
PORTFOLIO_URL=http://127.0.0.1:4174 npm run test:motion
CHROME_PATH="/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" npm run audit
npm audit
```

To audit the deployed version, set `AUDIT_URL=https://stefanmihajlovic.com`. Run audits sequentially without concurrent browser checks. Results naturally vary between runs.

Full local HTML/JSON evidence is in ignored `audit-results/production-build/`; the controlled comparison is in `audit-results/before/` and `audit-results/final/`. These reports are deliberately excluded from deployment. A compact copy of the scores is stored beside this document in `performance-audit-2026-10-29.json`.
