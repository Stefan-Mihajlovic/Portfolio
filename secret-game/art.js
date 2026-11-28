// Shared ink-and-enamel aerospace palette & seamless high-craft multi-sector space backgrounds.
export const PALETTE = {
  ink: '#0d1422',
  deep: '#080c16',
  paper: '#faf1d6',
  cream: '#efe4c6',
  steel: '#8395a3',
  shadow: '#3f5069',
  teal: '#79e3d5',
  cyan: '#9bf3f7',
  vermilion: '#fa754d',
  amber: '#ffbe78',
  rose: '#df7b95',
  violet: '#a88be0',
  gold: '#ffe18c',
};

const { ink, paper, steel, shadow, vermilion, teal, amber, gold } = PALETTE;
const TAU = Math.PI * 2;

function plates(spec) {
  return spec.map(([color, path]) => [color, new Path2D(path)]);
}

function print(ctx, layers, colorMap = null) {
  for (const [color, path] of layers) {
    ctx.fillStyle = (colorMap && colorMap[color]) || color;
    ctx.fill(path);
  }
}

// Unlockable Ship Skins / Liveries (coin sink for maxed hangars!)
export const SHIP_SKINS = [
  {
    id: 'standard',
    name: 'Standard',
    cost: 0,
    swatch: ['#faf1d6', '#8395a3', '#79e3d5'],
    accent: null,
    map: null,
  },
  {
    id: 'solar',
    name: 'Solar Gold',
    cost: 450,
    swatch: ['#fff1c2', '#c49648', '#ff6e42'],
    accent: '#ffe18c',
    map: {
      '#faf1d6': '#fff1c2',
      '#8395a3': '#c49648',
      '#3f5069': '#6b4724',
      '#fa754d': '#ff5c3d',
      '#79e3d5': '#ffe18c',
      '#ffd18a': '#ff9e5e',
      '#9be9ff': '#ffe18c',
      '#e4fff5': '#fffbe0',
    },
  },
  {
    id: 'crimson',
    name: 'Crimson Ace',
    cost: 750,
    swatch: ['#f7e4e4', '#bd4a52', '#ffcf6e'],
    accent: '#ff8b78',
    map: {
      '#faf1d6': '#f7e4e4',
      '#8395a3': '#bd4a52',
      '#3f5069': '#59202e',
      '#fa754d': '#ffcf6e',
      '#79e3d5': '#ff8b78',
      '#ffd18a': '#ff8b78',
      '#9be9ff': '#ff9f8a',
      '#e4fff5': '#fff0ec',
    },
  },
  {
    id: 'stealth',
    name: 'Void Stealth',
    cost: 1200,
    swatch: ['#6c7c94', '#2c374a', '#c89eff'],
    accent: '#c89eff',
    map: {
      '#faf1d6': '#6c7c94',
      '#8395a3': '#2c374a',
      '#3f5069': '#161e2b',
      '#fa754d': '#b388ff',
      '#79e3d5': '#c89eff',
      '#ffd18a': '#c89eff',
      '#9be9ff': '#c89eff',
      '#e4fff5': '#f0e4ff',
    },
  },
];

export function getSkin(skinId = 'standard') {
  return SHIP_SKINS.find((s) => s.id === skinId) || SHIP_SKINS[0];
}

export function getSkinAccent(skinId, fallback) {
  return getSkin(skinId).accent || fallback;
}

// --- PLAYER SHIPS (Hull layers separated from Canopy so 2.5D roll NEVER draws a double cockpit!) ---

const kestrelHull = plates([
  [
    ink,
    'M0 -52 Q5 -49 9 -26 L15 -7 22 0 26 -21 30 -19 31 8 47 26 47 36 30 31 27 41 18 39 15 26 8 26 6 44 -6 44 -8 26 -15 26 -18 39 -27 41 -30 31 -47 36 -47 26 -31 8 -30 -19 -26 -21 -22 0 -15 -7 -9 -26 Q-5 -49 0 -52Z',
  ],
  [steel, 'M-8 -19 -16 2 -44 27 -44 32 -19 25 -7 14Z M8 -19 16 2 44 27 44 32 19 25 7 14Z'],
  [paper, 'M-10 -12 -14 3 -43 28 -25 21 -10 11Z M11 -11 15 4 42 28 24 20 10 10Z'],
  [shadow, 'M-43 32 -19 21 -10 14 -13 23Z M43 32 19 21 10 14 13 23Z'],
  [vermilion, 'M-38 23 -34 19 -30 18 -35 24 -42 28Z M38 23 34 19 30 18 35 24 42 28Z'],
  [
    steel,
    'M-26 -17 -22 2 -18 15 -19 35 -26 38 -27 27 -29 16Z M26 -17 22 2 18 15 19 35 26 38 27 27 29 16Z',
  ],
  [paper, 'M-26 -16 -24 5 -25 26 -28 19Z M26 -16 24 5 25 26 28 19Z'],
  [ink, 'M-26 28 -19 26 -19 33 -26 35Z M26 28 19 26 19 33 26 35Z'],
  [teal, 'M-25 33 -20 32 -20 35 -25 36Z M25 33 20 32 20 35 25 36Z'],
  [steel, 'M0 -49 Q6 -41 9 -20 L13 8 6 32 5 41 -5 41 -6 32 -13 8 -9 -20 Q-5 -42 0 -49Z'],
  [paper, 'M0 -48 -2 -17 -7 1 -7 14 -11 8 -8 -19 Q-5 -40 0 -48Z M2 -42 8 -18 10 -1 5 -15Z'],
  [shadow, 'M0 -34 6 -18 10 9 5 27 0 35 -5 27 -6 11Z'],
  [paper, 'M-7 13 -2 17 -2 26 -5 22Z M7 13 2 17 2 26 5 22Z'],
  [vermilion, 'M-6 27 -2 30 -2 36 -5 32Z M6 27 2 30 2 36 5 32Z'],
  [ink, 'M-5 36 5 36 5 42 -5 42Z'],
  [teal, 'M-4 38 4 38 3 41 -3 41Z'],
]);

const falconHull = plates([
  [
    ink,
    'M0 -56 L8 -28 16 -12 40 -26 44 -14 29 14 33 34 20 31 12 24 7 43 -7 43 -12 24 -20 31 -33 34 -29 14 -44 -14 -40 -26 -16 -12 -8 -28Z',
  ],
  [steel, 'M-11 -10 -38 -22 -41 -13 -24 16 -11 18Z M11 -10 38 -22 41 -13 24 16 11 18Z'],
  [paper, 'M-13 -9 -37 -20 -31 -6 -16 8Z M13 -9 37 -20 31 -6 16 8Z'],
  [vermilion, 'M-36 -20 -40 -13 -32 -4 -29 -10Z M36 -20 40 -13 32 -4 29 -10Z'],
  [shadow, 'M-27 14 -29 29 -19 26 -14 14Z M27 14 29 29 19 26 14 14Z'],
  [steel, 'M0 -52 L7 -26 12 10 6 39 -6 39 -12 10 -7 -26Z'],
  [paper, 'M0 -51 -2 -18 -8 8 -4 26 -10 10 -6 -24Z M2 -45 6 -22 8 2 4 -14Z'],
  [amber, 'M-24 27 -18 28 -18 31 -24 30Z M24 27 18 28 18 31 24 30Z'],
  [ink, 'M-5 35 5 35 5 41 -5 41Z'],
  ['#ffd18a', 'M-4 37 4 37 3 40 -3 40Z'],
]);

const aegisHull = plates([
  [
    ink,
    'M0 -45 L12 -32 16 -14 26 -24 37 -18 45 10 43 34 26 37 22 29 11 33 8 42 -8 42 -11 33 -22 29 -26 37 -43 34 -45 10 -37 -18 -26 -24 -16 -14 -12 -32Z',
  ],
  [steel, 'M-14 -12 -26 -21 -35 -15 -42 10 -40 30 -26 33 -17 18Z M14 -12 26 -21 35 -15 42 10 40 30 26 33 17 18Z'],
  [paper, 'M-26 -19 -33 -14 -39 9 -30 16 -22 -4Z M26 -19 33 -14 39 9 30 16 22 -4Z'],
  [shadow, 'M-40 16 -39 30 -26 32 -23 18Z M40 16 39 30 26 32 23 18Z'],
  [teal, 'M-34 26 -27 28 -27 32 -34 30Z M34 26 27 28 27 32 34 30Z'],
  [steel, 'M0 -42 L10 -29 15 10 9 37 -9 37 -15 10 -10 -29Z'],
  [paper, 'M0 -40 -4 -18 -11 8 -6 24 -12 10 -8 -27Z M3 -35 9 -20 11 4 6 -12Z'],
  [vermilion, 'M-14 6 -9 10 -9 22 -14 18Z M14 6 9 10 9 22 14 18Z'],
  [ink, 'M-7 34 7 34 7 40 -7 40Z'],
  ['#9be9ff', 'M-5 36 5 36 4 39 -4 39Z'],
]);

const shipHulls = {
  kestrel: kestrelHull,
  falcon: falconHull,
  aegis: aegisHull,
};

const shipCanopies = {
  kestrel: plates([
    [ink, 'M0 -22 Q6 -15 6 -4 L4 7 0 12 -5 7 -6 -3 Q-5 -16 0 -22Z'],
    [teal, 'M0 -18 Q3 -13 4 -5 L3 1 -3 -2 Q-3 -12 0 -18Z'],
    ['#e4fff5', 'M0 -16 1 -12 -2 -4Z'],
  ]),
  falcon: plates([
    [ink, 'M0 -24 Q5 -16 5 -2 L3 10 0 15 -3 10 -5 -2 Q-5 -16 0 -24Z'],
    ['#ffd18a', 'M0 -20 Q3 -13 3 -4 L2 4 -2 1 Q-3 -12 0 -20Z'],
    ['#fff8e0', 'M0 -18 1 -13 -1 -5Z'],
  ]),
  aegis: plates([
    [ink, 'M0 -24 Q8 -16 8 -2 L6 10 0 14 -6 10 -8 -2 Q-8 -16 0 -24Z'],
    ['#9be9ff', 'M0 -20 Q5 -13 5 -4 L3 3 -4 1 Q-5 -12 0 -20Z'],
    ['#effcff', 'M-1 -17 2 -11 -2 -5Z'],
  ]),
};

// --- MODULAR CUSTOM SHIP FORGE (10 PWR Budget + Shareable Build Codes LO-XXXXX) ---
export const CUSTOM_MAX_POWER = 10;

export const CUSTOM_PARTS = {
  nose: [
    { id: 0, name: 'Razor Dart', pwr: 1, hull: 2, speedMod: 25, desc: '2 Hull · Agile needle nose' },
    { id: 1, name: 'Viper Core', pwr: 2, hull: 3, speedMod: 0, desc: '3 Hull · Balanced frame' },
    { id: 2, name: 'Bastion Prow', pwr: 4, hull: 4, speedMod: -22, desc: '4 Hull · Heavy armor prow' },
  ],
  wings: [
    { id: 0, name: 'Needle Blades', pwr: 1, shields: 2, speedMod: 20, dashCd: 1.55, desc: '2 Shield · Fast dash' },
    { id: 1, name: 'Delta Swept', pwr: 2, shields: 3, speedMod: 0, dashCd: 1.85, desc: '3 Shield · Balanced lift' },
    { id: 2, name: 'Forward Canards', pwr: 3, shields: 3, speedMod: 32, dashCd: 1.42, desc: '3 Shield · Peak agility' },
    { id: 3, name: 'Aegis Bulwark', pwr: 4, shields: 4, speedMod: -18, dashCd: 2.15, desc: '4 Shield · Heavy wings' },
  ],
  weapon: [
    { id: 0, name: 'Pulse Twin', pwr: 2, kind: 'pulse', fireRate: 0.132, heatMult: 0.76, desc: 'Cool rapid twin pulse' },
    { id: 1, name: 'Seeker Pods', pwr: 3, kind: 'falcon', fireRate: 0.118, heatMult: 0.92, desc: 'Fast fire + auto seekers' },
    { id: 2, name: 'Rail-Lance', pwr: 3, kind: 'kestrel', fireRate: 0.135, heatMult: 0.96, desc: 'High-velocity piercing' },
    { id: 3, name: 'Tri-Plasma', pwr: 4, kind: 'aegis', fireRate: 0.162, heatMult: 1.08, desc: 'Heavy plasma punch' },
  ],
  engine: [
    { id: 0, name: 'Cryo Drive', pwr: 1, perk: 'cryo', speedMod: 0, heatMult: 0.78, desc: '-22% weapon heat' },
    { id: 1, name: 'Ion Afterburner', pwr: 2, perk: 'falcon', speedMod: 38, heatMult: 1.0, desc: '+Speed · Bullet-Time Dash' },
    { id: 2, name: 'Rail Capacitor', pwr: 3, perk: 'kestrel', speedMod: 8, heatMult: 1.0, desc: 'Nova fires Rail-Beam' },
    { id: 3, name: 'Mirror Core', pwr: 3, perk: 'aegis', speedMod: -6, heatMult: 1.0, desc: 'Nova reflects fire' },
  ],
  paint: [
    {
      id: 0,
      name: 'Titanium',
      accent: '#79e3d5',
      swatch: ['#faf1d6', '#8395a3', '#79e3d5'],
      map: { '#faf1d6': '#faf1d6', '#8395a3': '#8395a3', '#3f5069': '#3f5069', '#79e3d5': '#79e3d5', '#fa754d': '#fa754d', '#e4fff5': '#e4fff5' },
    },
    {
      id: 1,
      name: 'Crimson',
      accent: '#ffd66b',
      swatch: ['#f7e6e2', '#bd4a52', '#ffd66b'],
      map: { '#faf1d6': '#f7e6e2', '#8395a3': '#bd4a52', '#3f5069': '#59202e', '#79e3d5': '#ffd66b', '#fa754d': '#ff7054', '#e4fff5': '#fff8dc' },
    },
    {
      id: 2,
      name: 'Obsidian',
      accent: '#c89eff',
      swatch: ['#8392a8', '#2f3a4f', '#c89eff'],
      map: { '#faf1d6': '#8392a8', '#8395a3': '#2f3a4f', '#3f5069': '#171f2e', '#79e3d5': '#c89eff', '#fa754d': '#ff70a6', '#e4fff5': '#f4e8ff' },
    },
    {
      id: 3,
      name: 'Solar',
      accent: '#ffe18c',
      swatch: ['#fff3cc', '#c49648', '#ff6e42'],
      map: { '#faf1d6': '#fff3cc', '#8395a3': '#c49648', '#3f5069': '#6b4724', '#79e3d5': '#ffe18c', '#fa754d': '#ff5c3d', '#e4fff5': '#fffbe0' },
    },
    {
      id: 4,
      name: 'Emerald',
      accent: '#8effc8',
      swatch: ['#e4f7ee', '#4b8f78', '#8effc8'],
      map: { '#faf1d6': '#e4f7ee', '#8395a3': '#4b8f78', '#3f5069': '#1e423b', '#79e3d5': '#8effc8', '#fa754d': '#ffd166', '#e4fff5': '#ecfff6' },
    },
    {
      id: 5,
      name: 'Cobalt',
      accent: '#8ce6ff',
      swatch: ['#e8f6ff', '#4f7fb8', '#8ce6ff'],
      map: { '#faf1d6': '#e8f6ff', '#8395a3': '#4f7fb8', '#3f5069': '#21395c', '#79e3d5': '#8ce6ff', '#fa754d': '#ff9e70', '#e4fff5': '#f2fbff' },
    },
  ],
};

export const DEFAULT_CUSTOM_BUILD = { nose: 1, wings: 1, weapon: 2, engine: 0, paint: 0 };

export function computeCustomPower(b) {
  const nose = CUSTOM_PARTS.nose[b.nose] || CUSTOM_PARTS.nose[1];
  const wings = CUSTOM_PARTS.wings[b.wings] || CUSTOM_PARTS.wings[1];
  const weapon = CUSTOM_PARTS.weapon[b.weapon] || CUSTOM_PARTS.weapon[2];
  const engine = CUSTOM_PARTS.engine[b.engine] || CUSTOM_PARTS.engine[0];
  return nose.pwr + wings.pwr + weapon.pwr + engine.pwr;
}

export function encodeCustomShip(b = DEFAULT_CUSTOM_BUILD) {
  return `custom:${b.nose}${b.wings}${b.weapon}${b.engine}${b.paint}`;
}

export function formatShareCode(b = DEFAULT_CUSTOM_BUILD) {
  return `LO-${b.nose}${b.wings}${b.weapon}${b.engine}${b.paint}`;
}

export function parseCustomCode(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const cleaned = raw.trim().toLowerCase().replace(/^lo[-:\s]?/, '').replace(/^custom:/, '');
  if (!/^[0-2][0-3][0-3][0-3][0-5]$/.test(cleaned)) return null;
  const build = {
    nose: +cleaned[0],
    wings: +cleaned[1],
    weapon: +cleaned[2],
    engine: +cleaned[3],
    paint: +cleaned[4],
  };
  if (computeCustomPower(build) > CUSTOM_MAX_POWER) return null;
  return build;
}

export function computeCustomStats(b = DEFAULT_CUSTOM_BUILD) {
  const nose = CUSTOM_PARTS.nose[b.nose] || CUSTOM_PARTS.nose[1];
  const wings = CUSTOM_PARTS.wings[b.wings] || CUSTOM_PARTS.wings[1];
  const weapon = CUSTOM_PARTS.weapon[b.weapon] || CUSTOM_PARTS.weapon[2];
  const engine = CUSTOM_PARTS.engine[b.engine] || CUSTOM_PARTS.engine[0];
  const paint = CUSTOM_PARTS.paint[b.paint] || CUSTOM_PARTS.paint[0];
  const speed = Math.max(295, Math.min(445, 365 + nose.speedMod + wings.speedMod + engine.speedMod));
  return {
    name: 'Custom',
    role: weapon.name,
    accent: paint.accent,
    speed,
    focusSpeed: Math.round(speed * 0.56),
    fireRate: weapon.fireRate,
    dashCd: wings.dashCd,
    dashSpeed: Math.round(speed * 2.55),
    hull: nose.hull,
    shields: wings.shields,
    weaponKind: weapon.kind,
    perk: engine.perk,
    heatMult: +(weapon.heatMult * engine.heatMult).toFixed(3),
    power: nose.pwr + wings.pwr + weapon.pwr + engine.pwr,
  };
}

// Modular vector silhouettes for Custom Ship Forge (crisp ink-and-enamel plates!)
const customWingPlates = [
  // 0: Needle Blades
  plates([
    [ink, 'M-8 -10 -47 16 -44 26 -14 19 -7 12Z M8 -10 47 16 44 26 14 19 7 12Z'],
    [steel, 'M-9 -6 -43 17 -41 22 -14 15 -8 9Z M9 -6 43 17 41 22 14 15 8 9Z'],
    [paper, 'M-11 -3 -39 16 -24 14 -10 6Z M11 -3 39 16 24 14 10 6Z'],
    [vermilion, 'M-40 16 -34 14 -37 21 -42 21Z M40 16 34 14 37 21 42 21Z'],
  ]),
  // 1: Delta Swept
  plates([
    [ink, 'M-8 -20 -46 24 -46 36 -18 28 -8 18Z M8 -20 46 24 46 36 18 28 8 18Z'],
    [steel, 'M-9 -16 -43 25 -43 32 -18 25 -8 15Z M9 -16 43 25 43 32 18 25 8 15Z'],
    [paper, 'M-10 -10 -41 26 -24 20 -10 11Z M10 -10 41 26 24 20 10 11Z'],
    [shadow, 'M-42 31 -19 21 -11 15 -14 24Z M42 31 19 21 11 15 14 24Z'],
    [vermilion, 'M-37 22 -32 18 -28 19 -34 25 -41 28Z M37 22 32 18 28 19 34 25 41 28Z'],
  ]),
  // 2: Forward Canards
  plates([
    [ink, 'M-10 -10 -43 -25 -46 -12 -27 16 -32 34 -18 30 -10 18Z M10 -10 43 -25 46 -12 27 16 32 34 18 30 10 18Z'],
    [steel, 'M-11 -8 -39 -21 -42 -12 -24 16 -11 17Z M11 -8 39 -21 42 -12 24 16 11 17Z'],
    [paper, 'M-13 -7 -37 -19 -31 -5 -16 9Z M13 -7 37 -19 31 -5 16 9Z'],
    [shadow, 'M-26 14 -28 29 -19 26 -14 14Z M26 14 28 29 19 26 14 14Z'],
    [vermilion, 'M-37 -19 -41 -12 -33 -3 -30 -9Z M37 -19 41 -12 33 -3 30 -9Z'],
  ]),
  // 3: Aegis Bulwark
  plates([
    [ink, 'M-12 -16 -27 -24 -39 -17 -46 11 -44 35 -25 38 -15 24Z M12 -16 27 -24 39 -17 46 11 44 35 25 38 15 24Z'],
    [steel, 'M-13 -12 -26 -20 -36 -14 -43 11 -41 31 -26 34 -16 18Z M13 -12 26 -20 36 -14 43 11 41 31 26 34 16 18Z'],
    [paper, 'M-26 -18 -34 -13 -39 9 -30 16 -22 -4Z M26 -18 34 -13 39 9 30 16 22 -4Z'],
    [shadow, 'M-40 16 -39 30 -26 32 -23 18Z M40 16 39 30 26 32 23 18Z'],
    [teal, 'M-35 26 -27 28 -27 32 -35 30Z M35 26 27 28 27 32 35 30Z'],
  ]),
];

const customWeaponPlates = [
  // 0: Pulse Twin
  plates([
    [ink, 'M-24 -10 -18 -10 -18 14 -24 14Z M18 -10 24 -10 24 14 18 14Z'],
    [steel, 'M-22.5 -8 -19.5 -8 -19.5 11 -22.5 11Z M19.5 -8 22.5 -8 22.5 11 19.5 11Z'],
    [teal, 'M-22 -8 -20 -8 -20 -1 -22 -1Z M20 -8 22 -8 22 -1 20 -1Z'],
  ]),
  // 1: Seeker Pods
  plates([
    [ink, 'M-30 -6 -20 -6 -19 16 -29 18Z M20 -6 30 -6 29 18 19 16Z'],
    [shadow, 'M-28 -3 -22 -3 -21 13 -27 14Z M22 -3 28 -3 27 14 21 13Z'],
    [vermilion, 'M-27 -2 -23 -2 -23 5 -27 5Z M23 -2 27 -2 27 5 23 5Z'],
    [paper, 'M-26 7 -24 7 -24 11 -26 11Z M24 7 26 7 26 11 24 11Z'],
  ]),
  // 2: Rail-Lance
  plates([
    [ink, 'M-28 -24 -21 -24 -19 18 -27 22Z M21 -24 28 -24 27 22 19 18Z'],
    [steel, 'M-26.5 -21 -22.5 -21 -21 16 -26 18Z M22.5 -21 26.5 -21 26 18 21 16Z'],
    [teal, 'M-25.5 -20 -23.5 -20 -23.5 6 -25.5 6Z M23.5 -20 25.5 -20 25.5 6 23.5 6Z'],
  ]),
  // 3: Tri-Plasma
  plates([
    [ink, 'M-32 -16 -20 -16 -19 20 -31 24Z M20 -16 32 -16 31 24 19 20Z'],
    [steel, 'M-30 -13 -22 -13 -21 17 -29 20Z M22 -13 30 -13 29 20 21 17Z'],
    [teal, 'M-28 -11 -24 -11 -24 9 -28 9Z M24 -11 28 -11 28 9 24 9Z'],
    [vermilion, 'M-28 11 -24 11 -24 16 -28 16Z M24 11 28 11 28 16 24 16Z'],
  ]),
];

const customEnginePlates = [
  // 0: Cryo Drive
  plates([
    [ink, 'M-14 26 -7 26 -7 44 -14 42Z M7 26 14 26 14 42 7 44Z'],
    [teal, 'M-12 34 -9 34 -9 41 -12 40Z M9 34 12 34 12 40 9 41Z'],
  ]),
  // 1: Ion Afterburner
  plates([
    [ink, 'M-18 22 -8 22 -7 46 -17 44Z M8 22 18 22 17 44 7 46Z'],
    [shadow, 'M-16 25 -10 25 -9 41 -15 40Z M10 25 16 25 15 40 9 41Z'],
    [vermilion, 'M-15 37 -10 37 -10 43 -15 42Z M10 37 15 37 15 42 10 43Z'],
  ]),
  // 2: Rail Capacitor
  plates([
    [ink, 'M-11 24 11 24 9 45 -9 45Z'],
    [teal, 'M-7 28 7 28 6 42 -6 42Z'],
    ['#e4fff5', 'M-3 31 3 31 2 40 -2 40Z'],
  ]),
  // 3: Mirror Core
  plates([
    [ink, 'M-16 20 16 20 13 42 -13 42Z'],
    [shadow, 'M-13 23 13 23 10 39 -10 39Z'],
    [teal, 'M-11 32 11 32 9 37 -9 37Z'],
  ]),
];

const customNosePlates = [
  // 0: Razor Dart
  plates([
    [ink, 'M0 -57 Q4 -48 7 -22 L10 10 6 42 -6 42 -10 10 -7 -22 Q-4 -48 0 -57Z'],
    [steel, 'M0 -53 Q3 -44 6 -20 L8 9 5 39 -5 39 -8 9 -6 -20 Q-3 -44 0 -53Z'],
    [paper, 'M0 -51 -2 -18 -6 7 -3 28 -7 9 -5 -19Z M2 -44 5 -18 6 2 3 -14Z'],
    [ink, 'M-4 36 4 36 4 41 -4 41Z'],
    [teal, 'M-3 38 3 38 2 40 -2 40Z'],
  ]),
  // 1: Viper Core
  plates([
    [ink, 'M0 -52 Q6 -45 10 -22 L14 8 7 43 -7 43 -14 8 -10 -22 Q-6 -45 0 -52Z'],
    [steel, 'M0 -48 Q5 -40 8 -20 L12 8 6 40 -6 40 -12 8 -8 -20 Q-5 -40 0 -48Z'],
    [paper, 'M0 -47 -2 -17 -7 2 -6 16 -10 8 -7 -19Z M2 -41 7 -18 9 0 5 -14Z'],
    [shadow, 'M0 -32 6 -16 9 9 4 28 0 35 -4 28 -6 11Z'],
    [vermilion, 'M-6 27 -2 30 -2 36 -5 32Z M6 27 2 30 2 36 5 32Z'],
    [ink, 'M-5 36 5 36 5 41 -5 41Z'],
    [teal, 'M-4 38 4 38 3 40 -3 40Z'],
  ]),
  // 2: Bastion Prow
  plates([
    [ink, 'M0 -46 L13 -32 17 8 10 42 -10 42 -17 8 -13 -32Z'],
    [steel, 'M0 -42 L11 -29 15 8 9 38 -9 38 -15 8 -11 -29Z'],
    [paper, 'M0 -40 -4 -18 -11 8 -6 24 -12 10 -8 -27Z M3 -34 9 -19 11 4 6 -12Z'],
    [vermilion, 'M-14 6 -9 10 -9 22 -14 18Z M14 6 9 10 9 22 14 18Z'],
    [ink, 'M-7 34 7 34 7 40 -7 40Z'],
    [teal, 'M-5 36 5 36 4 39 -4 39Z'],
  ]),
];

const customCanopyPlates = [
  plates([
    [ink, 'M0 -24 Q5 -16 5 -2 L3 10 0 14 -3 10 -5 -2 Q-5 -16 0 -24Z'],
    [teal, 'M0 -20 Q3 -13 3 -4 L2 4 -2 1 Q-3 -12 0 -20Z'],
    ['#e4fff5', 'M0 -18 1 -13 -1 -5Z'],
  ]),
  plates([
    [ink, 'M0 -22 Q6 -15 6 -4 L4 7 0 12 -5 7 -6 -3 Q-5 -16 0 -22Z'],
    [teal, 'M0 -18 Q3 -13 4 -5 L3 1 -3 -2 Q-3 -12 0 -18Z'],
    ['#e4fff5', 'M0 -16 1 -12 -2 -4Z'],
  ]),
  plates([
    [ink, 'M0 -24 Q8 -16 8 -2 L6 10 0 14 -6 10 -8 -2 Q-8 -16 0 -24Z'],
    [teal, 'M0 -20 Q5 -13 5 -4 L3 3 -4 1 Q-5 -12 0 -20Z'],
    ['#e4fff5', 'M-1 -17 2 -11 -2 -5Z'],
  ]),
];

function resolveCustomBuild(variant) {
  if (variant && typeof variant === 'object' && 'nose' in variant) return variant;
  if (typeof variant === 'string' && (variant.startsWith('custom:') || variant.startsWith('LO-'))) {
    return parseCustomCode(variant) || DEFAULT_CUSTOM_BUILD;
  }
  return null;
}

function drawCustomHull(ctx, build, skinId = 'standard') {
  const paint = CUSTOM_PARTS.paint[build.paint] || CUSTOM_PARTS.paint[0];
  const colorMap = skinId && skinId !== 'standard' ? getSkin(skinId).map : paint.map;
  print(ctx, customWingPlates[build.wings] || customWingPlates[1], colorMap);
  print(ctx, customEnginePlates[build.engine] || customEnginePlates[0], colorMap);
  print(ctx, customWeaponPlates[build.weapon] || customWeaponPlates[2], colorMap);
  print(ctx, customNosePlates[build.nose] || customNosePlates[1], colorMap);
}

function drawCustomCanopy(ctx, build, skinId = 'standard') {
  const paint = CUSTOM_PARTS.paint[build.paint] || CUSTOM_PARTS.paint[0];
  const colorMap = skinId && skinId !== 'standard' ? getSkin(skinId).map : paint.map;
  print(ctx, customCanopyPlates[build.nose] || customCanopyPlates[1], colorMap);
}

export function drawInterceptor(ctx, variant = 'kestrel', skinId = 'standard') {
  const custom = resolveCustomBuild(variant);
  if (custom) {
    drawCustomHull(ctx, custom, skinId);
    drawCustomCanopy(ctx, custom, skinId);
    return;
  }
  const colorMap = getSkin(skinId).map;
  print(ctx, shipHulls[variant] || kestrelHull, colorMap);
  print(ctx, shipCanopies[variant] || shipCanopies.kestrel, colorMap);
}

// 2.5D Chicken Invaders-style longitudinal roll with single parallax cockpit (zero double cockpit!)
export function drawBankedShip(ctx, variant = 'kestrel', roll = 0, tier = 1, accent = teal, skinId = 'standard') {
  const custom = resolveCustomBuild(variant);
  const colorMap = getSkin(skinId).map;
  const r = Math.max(-1, Math.min(1, roll));
  const absR = Math.abs(r);
  const scaleX = Math.cos(r * 0.72);
  const skewY = r * 0.24;

  ctx.save();
  ctx.transform(scaleX, skewY, 0, 1, 0, 0);

  // Subtle underside hull rim exposed on lifted side during roll
  if (absR > 0.06) {
    ctx.save();
    ctx.translate(-r * 7, 2.5);
    ctx.globalAlpha = absR * 0.56;
    ctx.fillStyle = '#25354b';
    ctx.beginPath();
    ctx.ellipse(0, 6, 30, 34, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  // Wing weapon pods scale up visually with weapon tiers MK II -> MK VII!
  if (tier >= 2) {
    ctx.fillStyle = ink;
    ctx.fillRect(-35, 1, 7, 17);
    ctx.fillRect(28, 1, 7, 17);
    ctx.fillStyle = tier >= 5 ? gold : accent;
    ctx.fillRect(-33.5, 3, 4, 12);
    ctx.fillRect(29.5, 3, 4, 12);
  }
  if (tier >= 4) {
    // Seeker missile pods
    ctx.fillStyle = ink;
    ctx.fillRect(-43, 12, 6, 14);
    ctx.fillRect(37, 12, 6, 14);
    ctx.fillStyle = tier >= 6 ? '#ffe694' : amber;
    ctx.fillRect(-41.5, 14, 3, 10);
    ctx.fillRect(38.5, 14, 3, 10);
  }

  // Draw hull ONLY (no baked-in canopy!)
  if (custom) drawCustomHull(ctx, custom, skinId);
  else print(ctx, shipHulls[variant] || kestrelHull, colorMap);

  // Directional 3D roll shading across wings
  if (absR > 0.06) {
    const shade = ctx.createLinearGradient(-44, 0, 44, 0);
    if (r > 0) {
      shade.addColorStop(0, `rgba(255, 250, 232, ${absR * 0.22})`);
      shade.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
      shade.addColorStop(1, `rgba(6, 12, 24, ${absR * 0.34})`);
    } else {
      shade.addColorStop(0, `rgba(6, 12, 24, ${absR * 0.34})`);
      shade.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
      shade.addColorStop(1, `rgba(255, 250, 232, ${absR * 0.22})`);
    }
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.moveTo(0, -52);
    ctx.lineTo(47, 30);
    ctx.lineTo(0, 44);
    ctx.lineTo(-47, 30);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Single elevated canopy drawn ONCE with clean 3D depth parallax!
  ctx.save();
  ctx.translate(r * 4.5, 0);
  ctx.transform(Math.max(0.74, scaleX), skewY * 0.45, 0, 1, 0, 0);
  if (custom) drawCustomCanopy(ctx, custom, skinId);
  else print(ctx, shipCanopies[variant] || shipCanopies.kestrel, colorMap);
  ctx.restore();
}

// --- ENEMY SILHOUETTES ---

const foes = {
  raider: plates([
    [ink, 'M-21 -12 -7 -5 0 -14 7 -5 21 -12 17 9 7 7 0 19 -7 7 -17 9Z'],
    ['#d96854', 'M-18 -9 -5 -1 0 -10 5 -1 18 -9 14 6 6 3 0 15 -6 3 -14 6Z'],
    ['#753d50', 'M-16 -7 -5 2 0 11 5 2 16 -7 8 1 0 6 -8 1Z'],
    [paper, 'M-14 -7 -10 -5 -12 -1Z M14 -7 10 -5 12 -1Z'],
  ]),
  kite: plates([
    [ink, 'M0 21 -19 0 -11 -16 -3 -7 0 -20 3 -7 11 -16 19 0Z'],
    ['#cf899e', 'M0 17 -16 0 -10 -12 -5 1 0 -14 5 1 10 -12 16 0Z'],
    ['#684254', 'M-14 0 -3 5 0 13 3 5 14 0 5 1 0 -7 -5 1Z'],
    [paper, 'M0 -12 -2 -4 0 -1 2 -4Z'],
  ]),
  lancer: plates([
    [ink, 'M0 26 -9 10 -14 -15 -5 -7 0 -22 5 -7 14 -15 9 10Z'],
    ['#ee9a69', 'M0 21 -6 8 -11 -11 -4 -3 0 -16 4 -3 11 -11 6 8Z'],
    ['#8d424e', 'M0 17 -4 5 0 -10 4 5Z'],
    [paper, 'M0 12 -2 4 0 -2 2 4Z'],
  ]),
  gunship: plates([
    [
      ink,
      'M-23 -10 -15 -16 -6 -12 0 -18 6 -12 15 -16 23 -10 24 11 16 16 10 6 5 10 3 19 -3 19 -5 10 -10 6 -16 16 -24 11Z',
    ],
    [
      '#bf6d4d',
      'M-20 -8 -14 -13 -5 -8 0 -14 5 -8 14 -13 20 -8 21 9 16 12 12 3 4 7 2 16 -2 16 -4 7 -12 3 -16 12 -21 9Z',
    ],
    ['#5c3a47', 'M-15 -10 -13 2 -19 8 -19 -5Z M15 -10 13 2 19 8 19 -5Z M-7 -6 0 -11 7 -6 0 5Z'],
    [paper, 'M-19 -5 -15 -9 -16 -4 -19 -2Z M19 -5 15 -9 16 -4 19 -2Z'],
  ]),
  prism: plates([
    [ink, 'M0 -21 18 -7 18 7 0 21 -18 7 -18 -7Z'],
    ['#9881d4', 'M0 -17 14 -6 14 6 0 17 -14 6 -14 -6Z'],
    ['#4a3c74', 'M0 -12 10 -4 10 4 0 12 -10 4 -10 -4Z'],
    ['#e7ddff', 'M0 -15 3 -5 0 -1 -3 -5Z M0 15 3 5 0 1 -3 5Z'],
  ]),
  minelayer: plates([
    [ink, 'M-22 -8 -10 -16 10 -16 22 -8 20 12 8 18 -8 18 -20 12Z'],
    ['#7f8c7a', 'M-19 -6 -9 -13 9 -13 19 -6 17 10 7 15 -7 15 -17 10Z'],
    ['#424d4a', 'M-13 -4 13 -4 11 9 -11 9Z'],
    [amber, 'M-16 -2 -12 -2 -12 5 -16 5Z M12 -2 16 -2 16 5 12 5Z'],
    [paper, 'M-6 -11 6 -11 4 -7 -4 -7Z'],
  ]),
  courier: plates([
    [ink, 'M0 -20 17 -10 21 4 12 16 0 20 -12 16 -21 4 -17 -10Z'],
    [gold, 'M0 -16 13 -8 17 3 9 13 0 16 -9 13 -17 3 -13 -8Z'],
    ['#3d5a63', 'M-10 -6 10 -6 12 4 0 10 -12 4Z'],
    [teal, 'M0 -11 6 -2 0 7 -6 -2Z'],
    [paper, 'M-14 -7 -9 -9 -10 -3Z M14 -7 9 -9 10 -3Z'],
  ]),
  vanguard: plates([
    [ink, 'M-24 -8 -14 -18 14 -18 24 -8 22 14 10 20 -10 20 -22 14Z'],
    ['#54789c', 'M-20 -6 -12 -14 12 -14 20 -6 18 11 8 16 -8 16 -18 11Z'],
    ['#2b3d57', 'M-14 -5 14 -5 12 11 -12 11Z'],
    [teal, 'M-17 10 -8 15 -10 17 -19 12Z M17 10 8 15 10 17 19 12Z'],
    [paper, 'M-8 -11 8 -11 5 -6 -5 -6Z'],
  ]),
  swarmpod: plates([
    [ink, 'M0 -21 19 -10 19 10 0 21 -19 10 -19 -10Z'],
    ['#7f5c8a', 'M0 -17 15 -8 15 8 0 17 -15 8 -15 -8Z'],
    ['#3c2a4d', 'M0 -11 10 -5 10 5 0 11 -10 5 -10 -5Z'],
    ['#ff9866', 'M0 -6 5 0 0 6 -5 0Z'],
  ]),
  swarmer: plates([
    [ink, 'M0 14 -11 -4 0 -13 11 -4Z'],
    ['#ff8b66', 'M0 10 -8 -3 0 -9 8 -3Z'],
    ['#612c3c', 'M0 5 -4 -2 0 -5 4 -2Z'],
  ]),
  sniper: plates([
    [ink, 'M0 24 -7 12 -18 -8 -12 -18 -4 -10 0 -22 4 -10 12 -18 18 -8 7 12Z'],
    ['#c94b5a', 'M0 19 -5 9 -14 -7 -10 -14 -3 -6 0 -17 3 -6 10 -14 14 -7 5 9Z'],
    ['#4f2030', 'M0 14 -3 5 0 -10 3 5Z'],
    ['#ffd8c2', 'M-12 -8 -8 -12 -8 -5Z M12 -8 8 -12 8 -5Z'],
  ]),
  orbiter: plates([
    [ink, 'M0 -21 15 -15 21 0 15 15 0 21 -15 15 -21 0 -15 -15Z'],
    ['#54b5b8', 'M0 -17 12 -12 17 0 12 12 0 17 -12 12 -17 0 -12 -12Z'],
    ['#214252', 'M0 -11 11 0 0 11 -11 0Z'],
    [amber, 'M0 -16 3 -8 -3 -8Z M0 16 3 8 -3 8Z M-16 0 -8 -3 -8 3Z M16 0 8 -3 8 3Z'],
  ]),
  bomber: plates([
    [ink, 'M-25 -14 -13 -19 -6 -10 0 -16 6 -10 13 -19 25 -14 23 15 13 19 8 11 0 18 -8 11 -13 19 -23 15Z'],
    ['#c77a38', 'M-21 -11 -12 -15 -6 -6 0 -12 6 -6 12 -15 21 -11 19 12 12 15 7 7 0 14 -7 7 -12 15 -19 12Z'],
    ['#5c3523', 'M-17 -7 -11 -10 -11 9 -17 7Z M17 -7 11 -10 11 9 17 7Z M-6 -4 6 -4 4 8 -4 8Z'],
    ['#ffe09c', 'M-4 -9 4 -9 3 -5 -3 -5Z'],
  ]),
  phantom: plates([
    [ink, 'M0 24 -8 6 -22 -14 -9 -6 0 -22 9 -6 22 -14 8 6Z'],
    ['#7d63c9', 'M0 19 -6 4 -17 -10 -7 -3 0 -17 7 -3 17 -10 6 4Z'],
    ['#2b204d', 'M0 13 -4 2 0 -11 4 2Z'],
    ['#d8c2ff', 'M-14 -9 -9 -5 -11 -2Z M14 -9 9 -5 11 -2Z'],
  ]),
  healer: plates([
    [ink, 'M0 -20 14 -12 20 0 14 14 0 20 -14 14 -20 0 -14 -12Z'],
    ['#4ca87a', 'M0 -16 11 -9 16 0 11 11 0 16 -11 11 -16 0 -11 -9Z'],
    ['#1d4a3b', 'M-10 -6 10 -6 10 6 -10 6Z'],
    ['#c8ffdf', 'M-3 -9 3 -9 3 -3 9 -3 9 3 3 3 3 9 -3 9 -3 3 -9 3 -9 -3 -3 -3Z'],
  ]),
};

const SECTOR_FOE_TINTS = [
  null,
  { '#d96854': '#e66442', '#cf899e': '#e08b63', '#bf6d4d': '#cc5a3b' },
  { '#d96854': '#c26db8', '#cf899e': '#b294e8', '#bf6d4d': '#9668b8' },
  { '#d96854': '#d98948', '#cf899e': '#e0a969', '#bf6d4d': '#b87638' },
  { '#d96854': '#4ec2b4', '#cf899e': '#8c96ff', '#bf6d4d': '#3f9c98' },
  { '#d96854': '#70a8d8', '#cf899e': '#a4d8f5', '#bf6d4d': '#5a8ab8' },
  { '#d96854': '#c98842', '#cf899e': '#c2a374', '#bf6d4d': '#9e6935' },
  { '#d96854': '#e04f64', '#cf899e': '#ff946b', '#bf6d4d': '#b33c52' },
];

export function drawFoe(ctx, e, sectorIndex = 0) {
  ctx.save();
  ctx.translate(e.x, e.y);

  if (e.kind === 'sniper' && (e.aimLock > 0 || e.fireIn < 1.2)) {
    ctx.save();
    ctx.rotate(-(e.aimAngle || 0));
    const locked = (e.aimLock || 0) > 0;
    const p = locked ? 1 - e.aimLock / 0.55 : 0.35;
    ctx.strokeStyle = locked
      ? `rgba(255, 76, 86, ${0.55 + p * 0.45})`
      : 'rgba(255, 118, 108, 0.28)';
    ctx.lineWidth = locked ? 1.5 + p * 1.4 : 1;
    if (!locked) ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(0, 14);
    ctx.lineTo(0, 1400);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  if (e.kind === 'lancer' && e.locked && e.fireIn > 0) {
    ctx.save();
    ctx.rotate(e.tilt || 0);
    const charge = Math.max(0, 1 - e.fireIn / 0.78);
    ctx.strokeStyle = `rgba(255, 166, 121, ${0.28 + charge * 0.55})`;
    ctx.lineWidth = 1 + charge * 1.4;
    ctx.setLineDash([5, 6]);
    ctx.beginPath();
    ctx.moveTo(0, 14);
    ctx.lineTo(0, 290);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  if (e.kind === 'prism' && (e.beamWarn > 0 || e.beamActive > 0)) {
    ctx.save();
    ctx.rotate(e.beamAngle || 0);
    if (e.beamActive > 0) {
      const pulse = 0.8 + 0.2 * Math.sin(e.age * 45);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(182, 134, 255, 0.24)';
      ctx.fillRect(-13 * pulse, 12, 26 * pulse, 760);
      ctx.fillStyle = 'rgba(232, 198, 255, 0.65)';
      ctx.fillRect(-5 * pulse, 12, 10 * pulse, 760);
      ctx.fillStyle = '#fff9f0';
      ctx.fillRect(-2, 12, 4, 760);
      ctx.globalCompositeOperation = 'source-over';
    } else {
      const p = 1 - e.beamWarn / 0.9;
      ctx.strokeStyle = `rgba(218, 174, 255, ${0.25 + p * 0.65})`;
      ctx.lineWidth = 0.8 + p * 2.2;
      ctx.setLineDash([7, 7]);
      ctx.beginPath();
      ctx.moveTo(0, 12);
      ctx.lineTo(0, 760);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  if (e.kind === 'phantom' && e.blinkTelegraph > 0 && e.blinkTargetX !== undefined) {
    // Crisp phase-blink arrival ghost outline so player can read the teleport!
    ctx.save();
    const dx = e.blinkTargetX - e.x;
    const dy = (e.blinkTargetY ?? e.y) - e.y;
    const p = 1 - e.blinkTelegraph / 0.45;
    ctx.strokeStyle = `rgba(196, 152, 255, ${0.35 + p * 0.6})`;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(dx, dy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(dx, dy, 12 + (1 - p) * 14, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  const punch = e.hitPunch || 0;
  if (punch > 0.01) {
    ctx.translate((e.hitKickX || 0) * punch, (e.hitKickY || 0) * punch);
  }
  ctx.rotate(e.kind === 'orbiter' ? (e.age || 0) * 3.4 : e.tilt || 0);
  const scale = e.r / 18;
  ctx.scale(scale * (1 + punch * 0.16), scale * (1 - punch * 0.14));

  if (e.kind === 'phantom' && e.blinkTelegraph > 0) {
    ctx.globalAlpha = 0.42 + 0.35 * Math.sin((e.age || 0) * 36);
  }

  if (e.kind !== 'prism' && e.kind !== 'courier' && e.kind !== 'orbiter' && e.kind !== 'healer') {
    const flick = 0.75 + 0.25 * Math.sin((e.age || 0) * 28);
    ctx.fillStyle = e.kind === 'lancer' && e.fireIn <= 0 ? '#ffe7b3' : '#ff8c5990';
    ctx.beginPath();
    ctx.moveTo(-4, -14);
    ctx.lineTo(0, -21 - flick * (e.kind === 'lancer' && e.fireIn <= 0 ? 18 : 6));
    ctx.lineTo(4, -14);
    ctx.fill();
  }

  if (e.kind === 'healer') {
    const pulse = 0.65 + 0.35 * Math.sin((e.age || 0) * 7);
    ctx.save();
    ctx.strokeStyle = `rgba(130, 255, 192, ${0.32 + pulse * 0.35})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, 23 + pulse * 3, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  if (e.kind === 'vanguard' && e.frontShield) {
    // Curved cyan frontal armor shield (blocks normal frontal shots; pierce or flank to counter!)
    ctx.save();
    const glow = e.shieldFlash > 0 ? '#ffffff' : '#8ef5eb';
    ctx.strokeStyle = glow;
    ctx.lineWidth = e.shieldFlash > 0 ? 4.2 : 2.8;
    ctx.beginPath();
    ctx.arc(0, 4, 24, Math.PI * 0.14, Math.PI * 0.86);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(121, 227, 213, 0.26)';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(0, 4, 24, Math.PI * 0.16, Math.PI * 0.84);
    ctx.stroke();
    ctx.restore();
  }

  if (e.kind === 'swarmpod' && e.hatchIn > 0) {
    // Pulsing bio-hatch countdown ring
    const frac = Math.max(0, 1 - e.hatchIn / 3.4);
    ctx.save();
    ctx.strokeStyle = frac > 0.72 ? '#ff6c5c' : '#ffad73';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 22, -Math.PI / 2, -Math.PI / 2 + frac * TAU);
    ctx.stroke();
    ctx.restore();
  }

  if (e.kind === 'courier') {
    ctx.save();
    ctx.rotate((e.age || 0) * 1.8);
    ctx.strokeStyle = 'rgba(121, 227, 213, 0.52)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, 23, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  print(
    ctx,
    foes[e.kind] || foes.raider,
    e.kind === 'courier' || e.kind === 'healer' || e.kind === 'phantom'
      ? null
      : SECTOR_FOE_TINTS[sectorIndex % SECTOR_FOE_TINTS.length],
  );

  if (e.flash > 0) {
    const f = Math.min(1, e.flash / 0.13);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.65 * f;
    const foeShape = foes[e.kind] || foes.raider;
    ctx.fillStyle = '#fff5df';
    for (const [, path] of foeShape) {
      ctx.fill(path);
    }
    ctx.globalAlpha = 0.45 * f;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 17, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  const charge = e.fireIn < 0.6 && e.fireIn >= 0 && e.kind !== 'courier';
  const coreColor =
    e.kind === 'courier'
      ? '#b8fff3'
      : e.kind === 'prism'
        ? '#e9d6ff'
        : e.flash > 0 || charge
          ? paper
          : '#ffab69';
  ctx.fillStyle = coreColor;
  ctx.beginPath();
  ctx.arc(0, 2, charge ? 2.6 + (1 - e.fireIn / 0.6) * 2.8 : 2.3, 0, TAU);
  ctx.fill();

  if (charge) {
    ctx.strokeStyle = e.kind === 'prism' ? '#dec6ff' : '#ffd1a4';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(0, 2, 6 + e.fireIn * 9.5, 0, TAU);
    ctx.stroke();
  }

  ctx.restore();

  if (e.maxHp > 1 && e.hp < e.maxHp && e.hp > 0) {
    const bw = Math.max(24, e.r * 1.45);
    const bx = e.x - bw / 2;
    const by = e.y - e.r - 9;
    ctx.fillStyle = 'rgba(13, 20, 34, 0.82)';
    ctx.fillRect(bx - 1, by - 1, bw + 2, 4.8);
    const trailHp = Math.max(e.hp, e.hpTrail ?? e.hp);
    if (trailHp > e.hp + 0.02) {
      ctx.fillStyle = 'rgba(255, 244, 218, 0.9)';
      ctx.fillRect(bx, by, bw * Math.min(1, trailHp / e.maxHp), 2.8);
    }
    ctx.fillStyle = e.flash > 0 ? '#fff6e0' : e.kind === 'courier' ? teal : amber;
    ctx.fillRect(bx, by, bw * (e.hp / e.maxHp), 2.8);
  }
}

export function drawMine(ctx, m) {
  ctx.save();
  ctx.translate(m.x, m.y);
  const pulse = 0.5 + 0.5 * Math.sin(m.age * (m.fuse < 1.5 ? 20 : 8));

  // Exact 6-vector burst trajectory lines during the final 1.5s before proximity mine detonation!
  if (m.fuse > 0 && m.fuse < 1.5) {
    const prog = Math.max(0, Math.min(1, 1 - m.fuse / 1.5));
    const rayLen = 48 + prog * 78;
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.lineDashOffset = -m.age * (26 + prog * 36);
    ctx.lineWidth = 1.2 + prog * 0.7;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + m.angle;
      const dx = Math.sin(a);
      const dy = Math.cos(a);
      const sx = dx * (m.r + 5);
      const sy = dy * (m.r + 5);
      const ex = dx * rayLen;
      const ey = dy * rayLen;
      const grad = ctx.createLinearGradient(sx, sy, ex, ey);
      grad.addColorStop(0, `rgba(255, 198, 122, ${0.42 + prog * 0.52})`);
      grad.addColorStop(0.75, `rgba(255, 124, 72, ${0.26 + prog * 0.36})`);
      grad.addColorStop(1, 'rgba(255, 110, 62, 0)');
      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      ctx.setLineDash([]);
      const tipD = m.r + 14 + prog * 28;
      ctx.fillStyle = `rgba(255, 224, 152, ${0.46 + prog * 0.52})`;
      ctx.beginPath();
      ctx.arc(dx * tipD, dy * tipD, 1.8 + prog * 0.8, 0, TAU);
      ctx.fill();
      ctx.setLineDash([5, 4]);
    }
    ctx.setLineDash([]);
    // Synchronized detonation ring filling 0 -> 100% right as fuse hits 0!
    ctx.strokeStyle = `rgba(255, 206, 124, ${0.48 + prog * 0.48})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, m.r + 6, -Math.PI / 2, -Math.PI / 2 + TAU * prog);
    ctx.stroke();
    ctx.restore();
  } else {
    ctx.strokeStyle = `rgba(255, 134, 88, ${0.22 + pulse * 0.45})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, m.r + 5 + pulse * 4, 0, TAU);
    ctx.stroke();
  }

  ctx.rotate(m.age * 1.3);
  ctx.fillStyle = ink;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * TAU) / 8;
    const rad = i % 2 === 0 ? m.r + 2 : m.r * 0.62;
    ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = m.flash > 0 ? paper : '#5d4759';
  ctx.beginPath();
  ctx.arc(0, 0, m.r * 0.68, 0, TAU);
  ctx.fill();

  ctx.fillStyle = m.fuse < 1.2 ? '#fff0c7' : '#ff7b52';
  ctx.beginPath();
  ctx.arc(0, 0, m.r * (0.28 + pulse * 0.14), 0, TAU);
  ctx.fill();
  ctx.restore();
}

export function outlineRock() {
  return Array.from({ length: 10 }, (_, i) => {
    const a = (i * TAU) / 10;
    const r = 0.72 + Math.random() * 0.28;
    return [Math.cos(a) * r, Math.sin(a) * r];
  });
}

export function drawRock(ctx, e, sectorIndex = 0) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.rotate(e.angle);
  ctx.scale(e.r, e.r);
  const sec = sectorIndex % SECTORS.length;
  const molten = e.molten || sec === 1;
  const cryo = e.cryo || sec === 5;
  const shades = e.flash > 0
    ? Array(10).fill('#e6dccd')
    : molten
      ? ['#57312e', '#472526', '#331c21', '#26141a', '#4f2b28', '#733e34', '#944f3c', '#6e3b31', '#8a4c3b', '#63332d']
      : cryo
        ? ['#6ea8c9', '#5082a8', '#396285', '#284563', '#5f96bd', '#8ac4e3', '#bceaff', '#85bee0', '#a8ddf7', '#6da6c9']
        : sec === 2
          ? ['#6e678f', '#57507a', '#443e66', '#312d4f', '#5b537d', '#887ea8', '#a89ac7', '#867ca8', '#9e92bd', '#7c739e']
          : sec === 4
            ? ['#2d6b6d', '#224f57', '#1a3c45', '#122b33', '#2a5f63', '#3d8b8c', '#63c4bd', '#3a8485', '#4fa8a6', '#2d6c70']
            : sec === 6
              ? ['#6b5643', '#544336', '#3d3129', '#2b221e', '#594738', '#876b50', '#ab8964', '#80644a', '#997a5c', '#6e5844']
              : sec === 7
                ? ['#4a2a38', '#38202c', '#26151f', '#1a0d16', '#3f2431', '#693647', '#944a5c', '#5e3040', '#7a3d4e', '#472734']
                : sec === 3
                  ? ['#61534a', '#4c403a', '#38302c', '#292321', '#4d413b', '#7a6859', '#99826c', '#776557', '#8f7965', '#6e5d50']
                  : ['#6f7182', '#55576c', '#41475d', '#30384d', '#535568', '#89858d', '#aba099', '#888592', '#a59f9f', '#848292'];
  e.shape.forEach(([x, y], i) => {
    const [nx, ny] = e.shape[(i + 1) % e.shape.length];
    ctx.fillStyle = shades[i];
    ctx.beginPath();
    ctx.moveTo(-0.22, -0.24);
    ctx.lineTo(x, y);
    ctx.lineTo(nx, ny);
    ctx.fill();
  });
  ctx.strokeStyle = molten ? '#ff9c63' : sec === 2 ? '#d6c8ff' : '#d3c5b8';
  ctx.lineWidth = molten ? 0.055 : 0.04;
  ctx.beginPath();
  ctx.moveTo(...e.shape[6]);
  ctx.lineTo(...e.shape[7]);
  ctx.lineTo(...e.shape[8]);
  ctx.stroke();

  if (molten || (e.maxHp > 1 && e.hp < e.maxHp)) {
    ctx.strokeStyle = molten ? '#ff9d57e0' : '#ffbe78cc';
    ctx.lineWidth = molten ? 0.075 : 0.06;
    ctx.beginPath();
    ctx.moveTo(-0.35, -0.15);
    ctx.lineTo(0.05, 0.08);
    ctx.lineTo(0.42, -0.22);
    ctx.moveTo(0.05, 0.08);
    ctx.lineTo(-0.08, 0.55);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawPickup(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  const bob = Math.sin(p.age * 7) * 0.12;
  if (p.kind === 'shard') {
    ctx.rotate(p.age * 3.4 + p.seed);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = p.nova ? 'rgba(255, 225, 140, 0.25)' : 'rgba(121, 227, 213, 0.22)';
    ctx.beginPath();
    ctx.arc(0, 0, p.r * 1.9, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = p.nova ? gold : teal;
    ctx.beginPath();
    ctx.moveTo(0, -p.r);
    ctx.lineTo(p.r * 0.72, 0);
    ctx.lineTo(0, p.r);
    ctx.lineTo(-p.r * 0.72, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff9e8';
    ctx.beginPath();
    ctx.arc(0, 0, p.r * 0.34, 0, TAU);
    ctx.fill();
    ctx.restore();
    return;
  }

  // Spinning golden Credit Coin pickup
  if (p.kind === 'coin') {
    const spinW = 0.45 + 0.55 * Math.abs(Math.cos(p.age * 6 + p.seed));
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(255, 212, 102, 0.22)';
    ctx.beginPath();
    ctx.arc(0, 0, p.r * 1.85, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.scale(spinW, 1);
    ctx.fillStyle = '#33220d';
    ctx.beginPath();
    ctx.arc(0, 0, p.r + 1.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffd566';
    ctx.beginPath();
    ctx.arc(0, 0, p.r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#fff5cc';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, p.r * 0.65, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = '#fff7d4';
    ctx.fillRect(-1.2, -p.r * 0.42, 2.4, p.r * 0.84);
    ctx.restore();
    return;
  }

  const palette = {
    weapon: { rim: '#88f0de', core: '#16343d', label: 'W+' },
    rapid: { rim: '#8eff85', core: '#163826', label: 'RF' },
    shield: { rim: '#99dcff', core: '#172d44', label: '+S' },
    nova: { rim: '#ffd485', core: '#3c2918', label: 'NV' },
    overshield: { rim: '#ffe27a', core: '#3a224d', label: 'OS' },
  }[p.kind] || { rim: teal, core: '#16343d', label: '+' };

  const scale = 1 + bob;
  ctx.scale(scale, scale);

  if (p.kind === 'overshield' || p.kind === 'rapid') {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 22);
    if (p.kind === 'rapid') {
      g.addColorStop(0, 'rgba(142, 255, 133, 0.45)');
      g.addColorStop(1, 'rgba(84, 224, 175, 0)');
    } else {
      g.addColorStop(0, 'rgba(255, 230, 130, 0.48)');
      g.addColorStop(1, 'rgba(180, 120, 255, 0)');
    }
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.rotate(p.age * (p.kind === 'overshield' ? 2.4 : 1.4));
  ctx.strokeStyle = palette.rim;
  ctx.lineWidth = p.kind === 'overshield' ? 2 : 1.5;
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.arc(0, 0, 15, -0.35, 0.35);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = palette.core;
  ctx.strokeStyle = palette.rim;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * TAU) / 6 - Math.PI / 6;
    const rx = Math.cos(a) * 11;
    const ry = Math.sin(a) * 11;
    if (i === 0) ctx.moveTo(rx, ry);
    else ctx.lineTo(rx, ry);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = paper;
  ctx.font = '700 9px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(palette.label, 0, 0.5);
  ctx.restore();
}

// --- 4 DISTINCT ORBITAL SECTORS (Cohesive graphic-novel space skies + planets, zero low-res seams) ---

export const SECTORS = [
  {
    name: 'PELAGIC RIM',
    skyTop: '#060c18',
    skyBottom: '#0b1829',
    veilA: 'rgba(34, 118, 138, 0.22)',
    veilB: 'rgba(26, 62, 118, 0.24)',
    veilC: 'rgba(116, 224, 210, 0.11)',
    starTint: '#d8f4ff',
    starAccent: '#ffe2c2',
    arcColor: 'rgba(121, 227, 213, 0.08)',
    warpColor: '#9af5ec',
    lane: 0.74,
    width: 0.46,
    base: ['#0e2438', '#1b4a62', '#449ea2', '#b9f3df'],
    rim: '#8ceee0',
    bands: 6,
    ring: false,
    eclipse: false,
    seed: 17,
  },
  {
    name: 'CALDERA BELT',
    skyTop: '#12080d',
    skyBottom: '#231015',
    veilA: 'rgba(186, 74, 48, 0.24)',
    veilB: 'rgba(110, 34, 52, 0.24)',
    veilC: 'rgba(255, 178, 108, 0.12)',
    starTint: '#ffe8d6',
    starAccent: '#ffb380',
    arcColor: 'rgba(255, 170, 112, 0.09)',
    warpColor: '#ffbe82',
    lane: 0.22,
    width: 0.38,
    base: ['#281218', '#622629', '#bf5138', '#f7b377'],
    rim: '#ff9d6b',
    bands: 4,
    ring: false,
    eclipse: false,
    fissures: true,
    seed: 43,
  },
  {
    name: 'OPAL EXPANSE',
    skyTop: '#0b0817',
    skyBottom: '#1a1332',
    veilA: 'rgba(124, 86, 198, 0.24)',
    veilB: 'rgba(184, 88, 146, 0.18)',
    veilC: 'rgba(156, 218, 255, 0.11)',
    starTint: '#ece2ff',
    starAccent: '#ffc2e0',
    arcColor: 'rgba(200, 176, 255, 0.09)',
    warpColor: '#d2b8ff',
    lane: 0.7,
    width: 0.56,
    base: ['#191632', '#3a346b', '#7666aa', '#d7c6f7'],
    rim: '#c8b8ff',
    bands: 9,
    ring: true,
    eclipse: false,
    seed: 79,
  },
  {
    name: 'ECLIPSE CORONA',
    skyTop: '#08090f',
    skyBottom: '#191418',
    veilA: 'rgba(220, 134, 62, 0.2)',
    veilB: 'rgba(148, 42, 54, 0.2)',
    veilC: 'rgba(255, 222, 138, 0.11)',
    starTint: '#fff2d8',
    starAccent: '#ff9c70',
    arcColor: 'rgba(255, 206, 130, 0.09)',
    warpColor: '#ffe099',
    lane: 0.28,
    width: 0.44,
    base: ['#0a0d16', '#151929', '#2a2b3f', '#ffb878'],
    rim: '#ffbe7d',
    bands: 0,
    ring: false,
    eclipse: true,
    seed: 109,
  },
  {
    name: 'ASTRAL RIFT',
    skyTop: '#050c14',
    skyBottom: '#0b1e28',
    veilA: 'rgba(42, 206, 186, 0.22)',
    veilB: 'rgba(118, 66, 224, 0.24)',
    veilC: 'rgba(154, 255, 232, 0.12)',
    starTint: '#c8fff5',
    starAccent: '#d6a8ff',
    arcColor: 'rgba(92, 244, 218, 0.13)',
    warpColor: '#76ffe8',
    lane: 0.78,
    width: 0.42,
    base: ['#0c1c2c', '#184b5c', '#3ea6ad', '#b8fff2'],
    rim: '#6effe6',
    bands: 5,
    ring: true,
    eclipse: false,
    dimension: 'rift',
    seed: 137,
  },
  {
    name: 'CRYO NEBULA',
    skyTop: '#07111e',
    skyBottom: '#10243d',
    veilA: 'rgba(96, 182, 245, 0.24)',
    veilB: 'rgba(140, 218, 255, 0.16)',
    veilC: 'rgba(220, 248, 255, 0.12)',
    starTint: '#e6f8ff',
    starAccent: '#99dcff',
    arcColor: 'rgba(166, 228, 255, 0.11)',
    warpColor: '#b8ecff',
    lane: 0.24,
    width: 0.48,
    base: ['#10243a', '#28567d', '#6fb7de', '#e6faff'],
    rim: '#b8f0ff',
    bands: 7,
    ring: true,
    eclipse: false,
    dimension: 'cryo',
    seed: 173,
  },
  {
    name: 'IRON GRAVEYARD',
    skyTop: '#100c0b',
    skyBottom: '#211914',
    veilA: 'rgba(176, 118, 62, 0.2)',
    veilB: 'rgba(98, 72, 58, 0.22)',
    veilC: 'rgba(255, 198, 128, 0.1)',
    starTint: '#f5e4cc',
    starAccent: '#ffaa66',
    arcColor: 'rgba(224, 168, 108, 0.1)',
    warpColor: '#ffca85',
    lane: 0.72,
    width: 0.4,
    base: ['#1c1512', '#47362b', '#87674d', '#d9b589'],
    rim: '#ebb97f',
    bands: 3,
    ring: false,
    eclipse: false,
    fissures: true,
    dimension: 'graveyard',
    seed: 211,
  },
  {
    name: 'EVENT HORIZON',
    skyTop: '#050409',
    skyBottom: '#160914',
    veilA: 'rgba(224, 62, 92, 0.24)',
    veilB: 'rgba(130, 36, 168, 0.22)',
    veilC: 'rgba(255, 194, 112, 0.14)',
    starTint: '#ffe8f0',
    starAccent: '#ffb870',
    arcColor: 'rgba(255, 126, 134, 0.12)',
    warpColor: '#ff7a98',
    lane: 0.5,
    width: 0.52,
    base: ['#040408', '#090712', '#1c1026', '#ff8b66'],
    rim: '#ff9668',
    bands: 0,
    ring: true,
    eclipse: true,
    dimension: 'singularity',
    seed: 257,
  },
];

function seededRandom(seed) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

function buildWorldPlate(spec, isCover = false) {
  const size = isCover ? 520 : 380;
  const pad = spec.ring ? size * 0.38 : size * 0.16;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(size + pad * 2);
  canvas.height = Math.round(size + pad * 2);
  const c = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = size * 0.46;
  const rand = seededRandom(spec.seed);

  const drawRings = (front) => {
    if (!spec.ring) return;
    c.save();
    c.translate(cx, cy);
    c.rotate(-0.34);
    c.beginPath();
    if (front) c.rect(-canvas.width, 0, canvas.width * 2, canvas.height);
    else c.rect(-canvas.width, -canvas.height, canvas.width * 2, canvas.height);
    c.clip();

    for (let i = 0; i < 16; i++) {
      const t = i / 15;
      const rx = r * (1.28 + t * 0.62);
      const ry = rx * 0.25;
      c.strokeStyle =
        i % 4 === 0
          ? `rgba(246, 232, 206, ${0.08 + (1 - t) * 0.2})`
          : `rgba(176, 165, 224, ${0.06 + Math.sin(t * Math.PI) * 0.18})`;
      c.lineWidth = 1.5 + rand() * 3.2;
      c.beginPath();
      c.ellipse(0, 0, rx, ry, 0, 0, TAU);
      c.stroke();
    }
    c.restore();
  };

  drawRings(false);

  const halo = c.createRadialGradient(cx - r * 0.22, cy - r * 0.22, r * 0.72, cx, cy, r * 1.28);
  halo.addColorStop(0, spec.eclipse ? 'rgba(255, 174, 102, 0.48)' : spec.rim + '3c');
  halo.addColorStop(0.58, spec.eclipse ? 'rgba(250, 117, 77, 0.16)' : spec.rim + '14');
  halo.addColorStop(1, 'rgba(8, 12, 22, 0)');
  c.fillStyle = halo;
  c.beginPath();
  c.arc(cx, cy, r * 1.28, 0, TAU);
  c.fill();

  c.save();
  c.beginPath();
  c.arc(cx, cy, r, 0, TAU);
  c.clip();

  const lit = c.createRadialGradient(
    cx - r * 0.44,
    cy - r * 0.44,
    r * 0.08,
    cx - r * 0.08,
    cy - r * 0.08,
    r * 1.25,
  );
  lit.addColorStop(0, spec.base[3]);
  lit.addColorStop(0.28, spec.base[2]);
  lit.addColorStop(0.64, spec.base[1]);
  lit.addColorStop(1, spec.base[0]);
  c.fillStyle = lit;
  c.fillRect(cx - r, cy - r, r * 2, r * 2);

  if (spec.bands > 0) {
    c.save();
    c.translate(cx, cy);
    c.rotate(-0.32);
    for (let i = 0; i < spec.bands; i++) {
      const y = -r * 0.85 + (i / spec.bands) * r * 1.7;
      const bandH = r * (0.07 + rand() * 0.11);
      c.fillStyle = i % 2 === 0 ? spec.base[3] + '38' : spec.base[0] + '34';
      c.beginPath();
      c.moveTo(-r * 1.2, y);
      for (let x = -r; x <= r; x += r * 0.25) {
        c.quadraticCurveTo(x - r * 0.12, y + (rand() - 0.5) * 14, x, y + Math.sin(x * 0.03 + i) * 7);
      }
      c.lineTo(r * 1.2, y + bandH);
      c.lineTo(-r * 1.2, y + bandH);
      c.closePath();
      c.fill();
    }
    c.restore();
  }

  if (spec.fissures) {
    c.strokeStyle = 'rgba(255, 174, 102, 0.52)';
    c.lineWidth = 2;
    for (let i = 0; i < 10; i++) {
      let x = cx + (rand() - 0.4) * r * 1.1;
      let y = cy + (rand() - 0.4) * r * 1.1;
      c.beginPath();
      c.moveTo(x, y);
      for (let s = 0; s < 5; s++) {
        x += (rand() - 0.35) * r * 0.24;
        y += (rand() - 0.4) * r * 0.22;
        c.lineTo(x, y);
      }
      c.stroke();
    }
  } else if (!spec.eclipse) {
    for (let i = 0; i < 7; i++) {
      const angle = rand() * TAU;
      const dist = rand() * r * 0.65;
      const cr = r * (0.05 + rand() * 0.1);
      c.fillStyle = i % 2 === 0 ? spec.base[3] + '24' : spec.base[0] + '2c';
      c.beginPath();
      c.ellipse(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, cr * 1.35, cr * 0.8, -0.35, 0, TAU);
      c.fill();
    }
  }

  const term = c.createLinearGradient(cx - r * 0.72, cy - r * 0.72, cx + r * 0.68, cy + r * 0.68);
  if (spec.eclipse) {
    term.addColorStop(0, 'rgba(10, 14, 24, 0.38)');
    term.addColorStop(0.28, 'rgba(8, 11, 20, 0.92)');
    term.addColorStop(1, 'rgba(6, 9, 17, 0.98)');
  } else {
    term.addColorStop(0, 'rgba(8, 12, 22, 0)');
    term.addColorStop(0.46, 'rgba(8, 12, 22, 0.14)');
    term.addColorStop(0.72, 'rgba(7, 11, 21, 0.74)');
    term.addColorStop(1, 'rgba(6, 9, 17, 0.94)');
  }
  c.fillStyle = term;
  c.fillRect(cx - r, cy - r, r * 2, r * 2);

  c.strokeStyle = spec.rim + (isCover ? '34' : '1c');
  c.lineWidth = 1;
  c.beginPath();
  c.ellipse(cx, cy, r * 0.99, r * 0.36, -0.34, 0, TAU);
  c.stroke();

  c.strokeStyle = spec.rim + (spec.eclipse ? 'e0' : 'b8');
  c.lineWidth = spec.eclipse ? 4 : 2.6;
  c.beginPath();
  c.arc(cx, cy, r - 1.2, Math.PI * 0.72, Math.PI * 1.72);
  c.stroke();

  if (!isCover) {
    c.fillStyle = 'rgba(8, 12, 22, 0.24)';
    c.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  c.restore();

  drawRings(true);
  return canvas;
}

const worldCache = SECTORS.map((spec) => ({
  ...spec,
  cover: null,
  distant: null,
}));

export function loadPlanets(_inFlight, redraw) {
  for (const world of worldCache) {
    if (!world.cover) world.cover = buildWorldPlate(world, true);
    if (!world.distant) world.distant = buildWorldPlate(world, false);
  }
  redraw?.();
}

export function getSector(index) {
  return SECTORS[Math.max(0, index) % SECTORS.length];
}

export function getSectorHazard(index) {
  const hazards = [
    'STANDARD ORBIT',
    'MOLTEN ASTEROIDS',
    'ION CURRENT DRIFT',
    'SOLAR SURGE',
    'GRAVITY ANOMALY // +NOVA',
    'SUB-ZERO // +35% COOLING',
    'EMP PULSE STORMS',
    'SINGULARITY // +25% SCORE',
  ];
  return hazards[Math.max(0, index) % hazards.length];
}

export function getSectorName(index) {
  return getSector(index).name;
}

// Seamless, razor-sharp layered nebula ribbons & orbital cartography (zero pixelation, zero mirror seams)
const skyLayers = SECTORS.map((spec) => {
  const rand = seededRandom(spec.seed + 313);
  const ribbons = Array.from({ length: 7 }, (_, i) => ({
    x: 0.1 + rand() * 0.8,
    y: i / 7 + rand() * 0.1,
    rx: 0.28 + rand() * 0.36,
    ry: 0.16 + rand() * 0.22,
    rot: (rand() - 0.5) * 1.1,
    color: i % 3 === 0 ? spec.veilA : i % 3 === 1 ? spec.veilB : spec.veilC,
  }));
  const clusters = Array.from({ length: 10 }, () => ({
    x: rand(),
    y: rand(),
    dots: Array.from({ length: 8 }, () => ({
      dx: (rand() - 0.5) * 0.08,
      dy: (rand() - 0.5) * 0.06,
      s: 0.6 + rand() * 1.4,
      a: 0.18 + rand() * 0.45,
      warm: rand() < 0.32,
    })),
  }));
  return { ribbons, clusters };
});

export function drawSpaceBackdrop(ctx, w, h, travel, pan, sectorIndex, warpFactor = 0) {
  const idx = Math.max(0, sectorIndex) % SECTORS.length;
  const spec = SECTORS[idx];
  const layer = skyLayers[idx];

  // Crisp deep sky base gradient
  const grad = ctx.createLinearGradient(0, 0, w * 0.25, h);
  grad.addColorStop(0, spec.skyTop);
  grad.addColorStop(1, spec.skyBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Silky seamless wrapping nebula clouds (no mirroring, no pixelation!)
  const spanY = h * 1.5;
  const offset = (travel * 0.18) % spanY;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (const rb of layer.ribbons) {
    const baseY = ((rb.y * spanY + offset) % spanY) - spanY * 0.25;
    const cx = (rb.x - pan * 0.08) * w;
    const rx = rb.rx * Math.max(w, h);
    const ry = rb.ry * Math.max(w, h);
    // Draw wrapped copies so transition across top/bottom edge is 100% invisible
    for (const wy of [baseY, baseY - spanY, baseY + spanY]) {
      if (wy + ry < -60 || wy - ry > h + 60) continue;
      ctx.save();
      ctx.translate(cx, wy);
      ctx.rotate(rb.rot);
      ctx.scale(1, ry / rx);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      g.addColorStop(0, rb.color);
      g.addColorStop(0.55, rb.color.replace(/[\d.]+\)$/, '0.06)'));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, rx, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();

  // Subtle editorial orbital telemetry arcs + bespoke dimension architecture!
  const arcOffset = (travel * 0.09) % (h * 1.6);
  ctx.save();
  ctx.strokeStyle = spec.arcColor;
  ctx.lineWidth = 1;
  if (spec.dimension === 'rift') {
    // Astral Rift: hyper-dimensional perspective neon warp grid!
    const gridSpacing = 54;
    const gOff = (travel * 0.55) % gridSpacing;
    ctx.strokeStyle = 'rgba(104, 245, 224, 0.08)';
    for (let y = gOff; y < h; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    const cols = 7;
    for (let i = 0; i <= cols; i++) {
      const gx = (i / cols) * w - pan * 36;
      ctx.beginPath();
      ctx.moveTo(w * 0.5 + (gx - w * 0.5) * 0.55, 0);
      ctx.lineTo(gx, h);
      ctx.stroke();
    }
  } else if (spec.dimension === 'cryo') {
    // Cryo Nebula: drifting hexagonal frost crystal filaments
    ctx.strokeStyle = 'rgba(196, 240, 255, 0.1)';
    for (let i = 0; i < 6; i++) {
      const hx = (((i * 0.21 + 0.1 - pan * 0.06) % 1) + 1) % 1 * w;
      const hy = ((travel * (0.14 + (i % 3) * 0.05) + i * 165) % (h + 120)) - 60;
      const hr = 18 + (i % 3) * 14;
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = (k * TAU) / 6 + travel * 0.002 * (i % 2 ? 1 : -1);
        if (k === 0) ctx.moveTo(hx + Math.cos(a) * hr, hy + Math.sin(a) * hr);
        else ctx.lineTo(hx + Math.cos(a) * hr, hy + Math.sin(a) * hr);
      }
      ctx.closePath();
      ctx.stroke();
    }
  } else if (spec.dimension === 'graveyard') {
    // Iron Graveyard: colossal broken orbital girder struts spanning deep space
    ctx.strokeStyle = 'rgba(224, 170, 112, 0.12)';
    ctx.lineWidth = 2;
    const beamY = ((travel * 0.08) % (h + 360)) - 180;
    ctx.beginPath();
    ctx.moveTo(-20, beamY);
    ctx.lineTo(w + 20, beamY + 130);
    ctx.moveTo(-20, beamY + 18);
    ctx.lineTo(w + 20, beamY + 148);
    ctx.stroke();
    ctx.lineWidth = 1;
  } else if (spec.dimension === 'singularity') {
    // Event Horizon: naturally scrolling relativistic stardust lensing arcs (no static center black hole!)
    const lensSpan = h + 280;
    ctx.strokeStyle = 'rgba(255, 146, 108, 0.14)';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 3; i++) {
      const ly = ((travel * (0.11 + i * 0.03) + i * (lensSpan / 3)) % lensSpan) - 140;
      ctx.beginPath();
      ctx.ellipse(w * 0.5 - pan * (14 + i * 5), ly, w * (0.48 + i * 0.1), 54 + i * 18, -0.14, 0, TAU);
      ctx.stroke();
    }
    ctx.lineWidth = 1;
  }
  ctx.strokeStyle = spec.arcColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(w * 0.86 - pan * 28, arcOffset - h * 0.2, Math.min(w, h) * 0.62, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([4, 12]);
  ctx.beginPath();
  ctx.arc(w * 0.14 - pan * 18, ((arcOffset + h * 0.8) % (h * 1.6)) - h * 0.2, Math.min(w, h) * 0.44, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Ultra-distant deep-space megastructure & carrier silhouettes in deep parallax (pure atmospheric depth!)
  if (warpFactor < 0.6) {
    const megaAlpha = (1 - warpFactor * 1.6) * 0.34;
    const my1 = ((travel * 0.065 + idx * 230) % (h + 440)) - 220;
    const mx1 = w * (idx % 2 === 0 ? 0.18 : 0.82) - pan * 14;
    ctx.save();
    ctx.globalAlpha = megaAlpha;
    ctx.translate(mx1, my1);
    ctx.rotate(idx % 2 === 0 ? 0.26 : -0.24);
    // Distant orbital ring relay station silhouette
    ctx.fillStyle = '#0c1628';
    ctx.strokeStyle = spec.rim + '30';
    ctx.lineWidth = 1;
    ctx.fillRect(-72, -3, 144, 6);
    ctx.fillRect(-16, -28, 32, 56);
    ctx.beginPath();
    ctx.ellipse(0, 0, 52, 16, 0, 0, TAU);
    ctx.stroke();
    // Tiny blinking distant nav beacon
    if (Math.sin(travel * 0.04 + idx) > 0.25) {
      ctx.fillStyle = spec.rim;
      ctx.globalAlpha = megaAlpha * 1.6;
      ctx.fillRect(-70, -1.5, 3, 3);
      ctx.fillRect(67, -1.5, 3, 3);
    }
    ctx.restore();

    const my2 = ((travel * 0.048 + h * 0.55 + idx * 170) % (h + 500)) - 250;
    const mx2 = w * (idx % 2 === 0 ? 0.78 : 0.24) - pan * 10;
    ctx.save();
    ctx.globalAlpha = megaAlpha * 0.75;
    ctx.translate(mx2, my2);
    ctx.rotate(idx % 2 === 0 ? -0.18 : 0.22);
    // Distant friendly dreadnought cruiser silhouette
    ctx.fillStyle = '#0b1424';
    ctx.beginPath();
    ctx.moveTo(0, -64);
    ctx.lineTo(18, -20);
    ctx.lineTo(42, 18);
    ctx.lineTo(24, 52);
    ctx.lineTo(10, 44);
    ctx.lineTo(0, 56);
    ctx.lineTo(-10, 44);
    ctx.lineTo(-24, 52);
    ctx.lineTo(-42, 18);
    ctx.lineTo(-18, -20);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = spec.arcColor;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  // Crisp distant star clusters (subtle depth, fades cleanly during warp)
  if (warpFactor < 0.7) {
    const clusterAlpha = 1 - warpFactor * 1.2;
    const cOffset = (travel * 0.14) % h;
    for (const cl of layer.clusters) {
      const bx = (((cl.x - pan * 0.05) % 1) + 1) % 1;
      const by = (cl.y * h + cOffset) % h;
      for (const dot of cl.dots) {
        ctx.globalAlpha = dot.a * clusterAlpha;
        ctx.fillStyle = dot.warm ? spec.starAccent : spec.starTint;
        ctx.fillRect(bx * w + dot.dx * w, by + dot.dy * h, dot.s, dot.s);
      }
    }
    ctx.globalAlpha = 1;
  }
}

function paintGlobe(ctx, image, x, y, width) {
  const height = (width * image.height) / image.width;
  ctx.drawImage(image, x - width / 2, y - height / 2, width, height);
}

export function drawPlanets(ctx, w, h, distance, pan, intro, sectorIndex = 0) {
  const world = worldCache[Math.max(0, sectorIndex) % worldCache.length];
  if (intro) {
    if (world.cover) {
      const portrait = w < h;
      paintGlobe(
        ctx,
        world.cover,
        w * (portrait ? 0.62 : 0.73),
        h * (portrait ? 0.22 : 0.36),
        Math.min(w * (portrait ? 0.8 : 0.5), h * (portrait ? 0.44 : 0.72)),
      );
    }
    return;
  }
  if (!world.distant) return;
  const t = ((distance / 2600 + 0.32) % 1.35);
  const width = Math.min(w, h) * world.width * (0.94 + t * 0.14);
  const x = w * world.lane + (t - 0.5) * width * 0.16 - pan * width * 0.1;
  const y = h * (-0.28 + t * 1.05);
  if (y - width / 2 < h && y + width / 2 > 0) paintGlobe(ctx, world.distant, x, y, width);
}
