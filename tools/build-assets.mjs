import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('../', import.meta.url));
await build({
  absWorkingDir: root,
  entryPoints: ['portfolio.js'],
  bundle: true,
  minify: true,
  format: 'esm',
  target: ['safari16', 'chrome110', 'firefox115'],
  outfile: 'assets/build/portfolio.min.js',
  plugins: [{ name: 'local-sky', setup(builder) {
    builder.onResolve({ filter: /^\/assets\/sky\// }, args => ({ path: path.join(root, args.path.split('?')[0]) }));
  } }],
});
await build({
  absWorkingDir: root,
  entryPoints: ['portfolio.css'],
  minify: true,
  outfile: 'assets/build/portfolio.min.css',
});
console.log('Built portfolio CSS and JS (including the sky module).');

// Publish only website files, never audit reports, development dependencies or tools.
const destination = path.join(root, 'dist');
await rm(destination, { recursive: true, force: true });
await mkdir(destination);
const directories = ['about', 'assets', 'case-studies', 'contact', 'crimson-music', 'eaes-video-corner', 'font-pirate', 'fonts', 'images', 'optiflowz', 'palette-pilot', 'privacypolicies', 'projects', 'resumes', 'skills', 'tab-volume-manager', 'vendor'];
for (const name of directories) await cp(path.join(root, name), path.join(destination, name), { recursive: true });
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (entry.isFile() && (/\.(html|css|js|xml|txt|webmanifest)$/.test(entry.name) || ['_headers', '_redirects'].includes(entry.name))) {
    await cp(path.join(root, entry.name), path.join(destination, entry.name));
  }
}
const versions = {};
for (const extension of ['css', 'js']) {
  versions[extension] = createHash('sha256').update(await readFile(path.join(root, `assets/build/portfolio.min.${extension}`))).digest('hex').slice(0, 12);
}
async function versionPages(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await versionPages(file);
    else if (file.endsWith('.html')) {
      const html = await readFile(file, 'utf8');
      await writeFile(file, html.replace(/\/assets\/build\/portfolio\.min\.(css|js)\?v=[^"\s]+/g, (_, extension) => `/assets/build/portfolio.min.${extension}?v=${versions[extension]}`));
    }
  }
}
await versionPages(destination);
console.log('Prepared dist/ with content-versioned asset URLs.');
