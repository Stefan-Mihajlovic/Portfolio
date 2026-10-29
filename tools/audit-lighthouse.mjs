// Runs real Lighthouse navigation audits, sequentially to avoid CPU contention.
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import * as chromeLauncher from 'chrome-launcher';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const origin = process.env.AUDIT_URL || 'http://127.0.0.1:4174';
const label = (process.env.AUDIT_LABEL || 'latest').replace(/[^a-z0-9_-]/gi, '-');
const routes = (process.env.AUDIT_ROUTES || '/,/projects/,/about/,/skills/,/contact/,/crimson-music/,/optiflowz/,/eaes-video-corner/,/case-studies/stefans-spinners/,/case-studies/palette-pilot/,/case-studies/tab-volume-manager/').split(',');
const modes = (process.env.AUDIT_MODES || 'mobile,desktop').split(',');
const directory = path.resolve('audit-results', label);
await mkdir(directory, { recursive: true });
const chrome = await chromeLauncher.launch({ chromePath: process.env.CHROME_PATH, chromeFlags: ['--headless', '--no-first-run'] });
const summary = JSON.parse(await readFile(path.join(directory, 'summary.json'), 'utf8').catch(() => '{"results":[]}')).results;
try {
  for (const route of routes) for (const mode of modes) {
    const result = await lighthouse(new URL(route, origin).href, {
      port: chrome.port, output: ['json', 'html'], logLevel: 'error',
    }, mode === 'desktop' ? desktopConfig : undefined);
    const { lhr } = result;
    if (lhr.runtimeError) throw Error(`${route}: ${lhr.runtimeError.message}`);
    if (lhr.configSettings.formFactor !== mode) throw Error('Lighthouse form factor does not match the requested audit');
    const name = `${route.replace(/^\/$/, 'home').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}-${mode}`;
    await writeFile(path.join(directory, `${name}.json`), result.report[0]);
    await writeFile(path.join(directory, `${name}.html`), result.report[1]);
    const row = {
      route, mode, version: lhr.lighthouseVersion, timestamp: lhr.fetchTime,
      scores: Object.fromEntries(Object.entries(lhr.categories).map(([key, value]) => [key, Math.round(value.score * 100)])),
      metrics: Object.fromEntries(['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index', 'total-byte-weight'].map(key => [key, lhr.audits[key].numericValue])),
      warnings: lhr.runWarnings,
      failures: Object.values(lhr.categories).flatMap(category => category.auditRefs.filter(ref => ref.weight && lhr.audits[ref.id].score !== null && lhr.audits[ref.id].score < 1).map(ref => ref.id)),
    };
    const previous = summary.findIndex(item => item.route === route && item.mode === mode);
    if (previous >= 0) summary.splice(previous, 1, row); else summary.push(row);
    await writeFile(path.join(directory, 'summary.json'), JSON.stringify({ origin, results: summary }, null, 2) + '\n');
    console.log(`${mode.padEnd(7)} ${route.padEnd(40)} ${Object.values(row.scores).join(' / ')} | LCP ${(row.metrics['largest-contentful-paint'] / 1000).toFixed(2)}s`);
  }
} finally { await chrome.kill(); }
console.log(`Reports: ${directory}`);
