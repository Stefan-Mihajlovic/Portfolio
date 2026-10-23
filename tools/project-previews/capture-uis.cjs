// Capture real extension markup with local presentation data; extension repos stay untouched.
const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 400, height: 600 }, deviceScaleFactor: 2 });
  await page.route('http://127.0.0.1:4173/__extension/**', async route => {
    const parts = new URL(route.request().url()).pathname.split('/').slice(2);
    const repo = parts.shift() === 'palette' ? 'PalettePilot' : 'Tab-Volume-Manager';
    const file = path.join(root, '..', repo, ...parts);
    if (repo === 'Tab-Volume-Manager' && file.endsWith('.js')) return route.fulfill({ body: '', contentType: 'text/javascript' });
    const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp' };
    await route.fulfill({ body: await fs.readFile(file), contentType: types[path.extname(file)] || 'application/octet-stream' });
  });
  await page.goto('http://127.0.0.1:4173/__extension/tvm/popup.html');
  await page.evaluate(() => {
    document.body.classList.remove('licensePending');
    document.querySelector('#siteName').textContent = 'YouTube';
    document.querySelector('#siteFavicon').src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="5" fill="#ff0033"/><path d="m10 8 6 4-6 4" fill="white"/></svg>');
    document.querySelector('#volumePC input').value = '125';
    document.querySelector('#volumeSlider').value = '125';
    document.querySelector('.tabNavigation').style.setProperty('--tab-index', '0');
    document.querySelector('#powerToggle').disabled = false;
  });
  await page.addStyleTag({ content: 'html,body{height:auto!important;min-height:0!important}*{animation:none!important;transition:none!important}' });
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.appWrapper').screenshot({ path: path.join(root, 'assets/covers/ui/tvm-volume.png') });
  await page.evaluate(() => {
    document.querySelector('#volumePanel').classList.add('hidden');
    document.querySelector('#equalizerPanel').classList.remove('hidden');
    document.querySelector('#volumeTab').classList.remove('selected');
    document.querySelector('#equalizerTab').classList.add('selected');
    document.querySelector('.tabNavigation').style.setProperty('--tab-index', '2');
    const values = [5, 4, 0, 1, 0, -2, 0, 3, 5, 0];
    document.querySelectorAll('.eqSlider').forEach((el, i) => {
      el.value = values[i];
      document.querySelector('#eqValue' + i).textContent = (values[i] > 0 ? '+' : '') + values[i] + ' dB';
    });
  });
  await page.locator('.equalizerBoard').screenshot({ path: path.join(root, 'assets/covers/ui/tvm-eq-board.png') });
  await page.addInitScript(() => {
    localStorage.setItem('colors-list', JSON.stringify(['#FF006A', '#FF8DBD', '#F7D8E7', '#7D2254', '#39223D', '#171321']));
    localStorage.setItem('palettePilotWorkspaceV2', JSON.stringify({ folders: [{ id: 'default', name: 'My Palettes' }], palettes: [{ id: 'demo', folderId: 'default', name: 'After hours', colors: ['#FF006A', '#FF8DBD', '#F7D8E7', '#7D2254', '#39223D', '#171321'], favorite: true }], activePaletteId: 'demo' }));
    localStorage.setItem('palettePilotExportFormat', 'css');
  });
  await page.goto('http://127.0.0.1:4173/__extension/palette/index.html');
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: '*{animation:none!important;transition:none!important}.workspace-view{max-height:none!important;overflow:visible!important}body{min-height:0!important}' });
  await page.locator('.app-shell').screenshot({ path: path.join(root, 'assets/covers/ui/palette-home.png') });
  await page.locator('[data-view-target="create"]').click();
  await page.locator('.app-shell').screenshot({ path: path.join(root, 'assets/covers/ui/palette-create.png') });
  await browser.close();
  console.log('Captured four real UI views.');
})().catch(error => { console.error(error); process.exit(1); });
