// Static production-like preview: gzip, byte ranges, real 404s, and Netlify headers.
// This does not emulate Netlify Functions or deploy anything.
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { gzipSync } = require('node:zlib');
const root = path.resolve(process.env.PREVIEW_ROOT || path.join(__dirname, '../dist'));
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml', '.txt': 'text/plain', '.svg': 'image/svg+xml', '.avif': 'image/avif', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.pdf': 'application/pdf' };
const encoded = new Map();
(async () => {
  const rules = [];
  for (const line of (await fs.readFile(path.join(root, '_headers'), 'utf8').catch(() => '')).split('\n')) {
    if (line.startsWith('/')) rules.push({ pattern: new RegExp('^' + line.trim().replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '.*') + '$'), headers: {} });
    else if (/^\s+\S+:/.test(line) && rules.length) {
      const [key, ...value] = line.trim().split(':'); rules.at(-1).headers[key] = value.join(':').trim();
    }
  }
  http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      let pathname = decodeURIComponent(url.pathname);
      const file = path.resolve(root, '.' + pathname);
      if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403).end(); return; }
      if (pathname.split('/').some(part => part.startsWith('.') || part === 'node_modules')) { res.writeHead(404).end(); return; }
      let target = file, status = 200;
      let stat = await fs.stat(target).catch(() => null);
      if (stat?.isDirectory()) {
        if (!pathname.endsWith('/')) { res.writeHead(301, { Location: pathname + '/' + url.search }).end(); return; }
        target = path.join(target, 'index.html'); stat = await fs.stat(target).catch(() => null);
      }
      if (!stat?.isFile()) { target = path.join(root, '404.html'); stat = await fs.stat(target); status = 404; }
      const type = types[path.extname(target)] || 'application/octet-stream';
      const headers = { 'Content-Type': type, 'Cache-Control': 'public, max-age=0, must-revalidate', 'Accept-Ranges': 'bytes' };
      for (const rule of rules) if (rule.pattern.test(pathname)) Object.assign(headers, rule.headers);
      let data = await fs.readFile(target);
      if (req.headers.range && /^(video|audio)\//.test(type)) {
        const match = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
        if (match) {
          const start = Number(match[1]), end = Math.min(Number(match[2] || data.length - 1), data.length - 1);
          if (start > end) { res.writeHead(416, { 'Content-Range': `bytes */${data.length}` }).end(); return; }
          headers['Content-Range'] = `bytes ${start}-${end}/${data.length}`;
          data = data.subarray(start, end + 1); status = 206;
        }
      } else if (/text|javascript|json|xml/.test(type)) {
        headers.Vary = 'Accept-Encoding';
        if (req.headers['accept-encoding']?.includes('gzip')) {
          const key = target + stat.mtimeMs;
          if (!encoded.has(key)) encoded.set(key, gzipSync(data));
          data = encoded.get(key); headers['Content-Encoding'] = 'gzip';
        }
      }
      headers['Content-Length'] = data.length;
      res.writeHead(status, headers); res.end(req.method === 'HEAD' ? undefined : data);
    } catch { res.writeHead(500).end('Preview error'); }
  }).listen(Number(process.env.PORT || 4174), '127.0.0.1', () => console.log(`Preview: http://127.0.0.1:${process.env.PORT || 4174}`));
})();
