// Keep full-resolution originals for the lightbox; serve appropriately sized previews.
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
async function pages(dir) {
  const result = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || ['node_modules', 'tools', 'audit-results', 'dist'].includes(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await pages(file));
    else if (file.endsWith('.html') && (await fs.readFile(file, 'utf8')).includes('data-portfolio')) result.push(file);
  }
  return result;
}
(async () => {
  await fs.mkdir(path.join(root, 'images/responsive'), { recursive: true });
  const cache = new Map();
  for (const file of await pages(root)) {
    let html = await fs.readFile(file, 'utf8');
    for (const match of [...html.matchAll(/<img\b[^>]*>/g)]) {
      const source = match[0].match(/\bsrc="(\/(?:images|assets\/covers)\/[^"?]+)(?:\?[^" ]*)?"/)?.[1];
      if (!source) continue;
      if (!cache.has(source)) {
        const input = path.join(root, source);
        const metadata = await sharp(input).metadata();
        const sizes = [];
        for (const width of [160, 400, 800, 1200]) {
          if (width >= metadata.width || (width === 160 && !source.includes('mePhoto'))) continue;
          const url = `/images/responsive/${path.parse(source).name}-${width}.webp`;
          await sharp(input).resize({ width }).webp({ quality: 85, effort: 6 }).toFile(path.join(root, url));
          sizes.push(`${url} ${width}w`);
        }
        sizes.push(`${source} ${metadata.width}w`);
        cache.set(source, { metadata, srcset: sizes.join(', ') });
      }
      const { metadata, srcset } = cache.get(source);
      let sizes;
      if (file.endsWith('/contact/index.html')) sizes = '72px';
      else if (file.endsWith('/about/index.html')) sizes = source.includes('mePhoto')
        ? '(max-width: 600px) calc(100vw - 36px), 420px'
        : '(max-width: 600px) calc((100vw - 54px) / 2), 300px';
      else if (html.includes('class="case-page"')) {
        const first = html.indexOf(match[0]) === html.indexOf('<img', html.indexOf('class="case-gallery"'));
        const twoImages = (html.match(/class="gallery-image reveal"/g) || []).length === 2;
        sizes = (first && !twoImages) || source.includes("tvm-trailer")
          ? '(max-width: 600px) calc(100vw - 36px), (max-width: 1152px) calc(100vw - 112px), 1040px'
          : '(max-width: 600px) calc(100vw - 36px), (max-width: 1152px) calc((100vw - 136px) / 2), 508px';
      } else sizes = '(max-width: 600px) calc((100vw - 36px) * .84), (max-width: 1152px) calc((100vw - 112px) * .74), 770px';
      const tag = match[0].replace(/\s(?:srcset|sizes|decoding)="[^"]*"/g, '')
        .replace(/\bwidth="\d+"/, `width="${metadata.width}"`)
        .replace(/\bheight="\d+"/, `height="${metadata.height}"`)
        .replace(/\s*\/?>$/, ` srcset="${srcset}" sizes="${sizes}" decoding="async" />`);
      html = html.replace(match[0], tag);
      if (file.endsWith('/about/index.html') && source.includes('mePhoto')) {
        const variants = [];
        for (const width of [400, 800, 1200]) {
          const url = `/images/responsive/mePhoto-${width}.avif`;
          await sharp(path.join(root, source)).resize({ width }).avif({ quality: 60, effort: 6 }).toFile(path.join(root, url));
          variants.push(`${url} ${width}w`);
        }
        const sourceTag = `<source type="image/avif" srcset="${variants.join(', ')}" sizes="${sizes}">`;
        // Replace an earlier generated picture too, so rerunning stays idempotent.
        const existing = /<picture data-responsive-portrait>[\s\S]*?<\/picture>/;
        if (existing.test(html)) html = html.replace(existing, `<picture data-responsive-portrait>${sourceTag}${tag}</picture>`);
        else html = html.replace(tag, `<picture data-responsive-portrait>${sourceTag}${tag}</picture>`);
      }
    }
    await fs.writeFile(file, html);
  }
  console.log(`Generated responsive previews for ${cache.size} images.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
