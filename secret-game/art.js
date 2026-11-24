import { createPixelRenderer } from '../assets/sky/dust-field.js';
import { nebulaRegion } from '../assets/sky/nebula.js';

// The hangar illustration and all flying craft share this ink-and-enamel palette.
const ink = '#111a29',
  paper = '#faf1d6',
  steel = '#81939f',
  shadow = '#42536b';
const vermilion = '#fa754d',
  teal = '#77e1d5',
  tau = Math.PI * 2;
function plates(spec) {
  return spec.map(([color, path]) => [color, new Path2D(path)]);
}
function print(ctx, layers) {
  for (const [color, path] of layers) {
    ctx.fillStyle = color;
    ctx.fill(path);
  }
}
// Broad wings, twin nacelles and a long central canopy remain legible at HUD scale.
const interceptor = plates([
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
  [ink, 'M0 -22 Q6 -15 6 -4 L4 7 0 12 -5 7 -6 -3 Q-5 -16 0 -22Z'],
  [teal, 'M0 -18 Q3 -13 4 -5 L3 1 -3 -2 Q-3 -12 0 -18Z'],
  ['#e0fff1', 'M0 -16 1 -12 -2 -4Z'],
  [paper, 'M-7 13 -2 17 -2 26 -5 22Z M7 13 2 17 2 26 5 22Z'],
  [vermilion, 'M-6 27 -2 30 -2 36 -5 32Z M6 27 2 30 2 36 5 32Z'],
  [ink, 'M-5 36 5 36 5 42 -5 42Z'],
  [teal, 'M-4 38 4 38 3 41 -3 41Z'],
]);
export function drawInterceptor(ctx) {
  print(ctx, interceptor);
}

const foes = {
  lancer: plates([
    [ink, 'M0 24 -8 10 -12 -14 -5 -7 0 -20 5 -7 12 -14 8 10Z'],
    ['#e8996d', 'M0 19 -6 8 -10 -10 -4 -3 0 -14 4 -3 10 -10 6 8Z'],
    ['#8e4550', 'M0 16 -4 5 0 -9 4 5Z'],
    [paper, 'M0 11 -1 4 0 0 1 4Z'],
  ]),

  raider: plates([
    [ink, 'M-20 -11 -7 -5 0 -13 7 -5 20 -11 16 8 7 6 0 18 -7 6 -16 8Z'],
    ['#d66653', 'M-18 -8 -5 -1 0 -9 5 -1 18 -8 14 5 6 3 0 14 -6 3 -14 5Z'],
    ['#763e51', 'M-17 -7 -5 2 0 11 5 2 17 -7 8 1 0 6 -8 1Z'],
  ]),
  kite: plates([
    [ink, 'M0 20 -18 0 -10 -15 -3 -7 0 -19 3 -7 10 -15 18 0Z'],
    ['#ca899a', 'M0 16 -15 0 -10 -11 -5 1 0 -13 5 1 10 -11 15 0Z'],
    ['#694555', 'M-14 0 -3 5 0 13 3 5 14 0 5 1 0 -7 -5 1Z'],
  ]),
  gunship: plates([
    [
      ink,
      'M-22 -9 -15 -15 -6 -12 0 -17 6 -12 15 -15 22 -9 23 10 16 15 10 5 5 9 3 18 -3 18 -5 9 -10 5 -16 15 -23 10Z',
    ],
    [
      '#b86a4c',
      'M-20 -8 -14 -12 -5 -8 0 -13 5 -8 14 -12 20 -8 20 8 16 11 12 2 4 6 2 15 -2 15 -4 6 -12 2 -16 11 -20 8Z',
    ],
    ['#613c48', 'M-14 -10 -13 2 -18 8 -18 -5Z M14 -10 13 2 18 8 18 -5Z M-7 -6 0 -10 7 -6 0 4Z'],
    [paper, 'M-19 -5 -15 -8 -16 -4 -19 -2Z M19 -5 15 -8 16 -4 19 -2Z'],
  ]),
};
export function drawFoe(ctx, e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.rotate(e.tilt || 0);
  ctx.scale(e.r / 18, e.r / 18);
  if (e.kind === 'lancer' && e.locked && e.fireIn > 0) {
    ctx.strokeStyle = '#ffa67999';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.lineTo(0, 160);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  print(ctx, foes[e.kind]);
  const charge = e.fireIn < 0.6 && e.fireIn >= 0;
  ctx.fillStyle = e.flash > 0 || charge ? paper : '#ffab69';
  ctx.beginPath();
  ctx.arc(0, 2, charge ? 2.6 + (1 - e.fireIn / 0.6) * 2.6 : 2.4, 0, tau);
  ctx.fill();
  if (charge) {
    ctx.strokeStyle = '#ffd1a4';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 2, 6 + e.fireIn * 9, 0, tau);
    ctx.stroke();
  }
  ctx.restore();
}

export function outlineRock() {
  return Array.from({ length: 10 }, (_, i) => {
    const a = (i * tau) / 10,
      r = 0.74 + Math.random() * 0.26;
    return [Math.cos(a) * r, Math.sin(a) * r];
  });
}
export function drawRock(ctx, e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.rotate(e.angle);
  ctx.scale(e.r, e.r);
  const shades = [
    '#6f7080',
    '#55566b',
    '#42475d',
    '#333c51',
    '#555568',
    '#8a858a',
    '#aaa09b',
    '#888591',
    '#a6a0a0',
    '#858392',
  ];
  e.shape.forEach(([x, y], i) => {
    const [nx, ny] = e.shape[(i + 1) % e.shape.length];
    ctx.fillStyle = shades[i];
    ctx.beginPath();
    ctx.moveTo(-0.24, -0.26);
    ctx.lineTo(x, y);
    ctx.lineTo(nx, ny);
    ctx.fill();
  });
  ctx.strokeStyle = '#c6b9ae';
  ctx.lineWidth = 0.035;
  ctx.beginPath();
  ctx.moveTo(...e.shape[6]);
  ctx.lineTo(...e.shape[7]);
  ctx.lineTo(...e.shape[8]);
  ctx.stroke();
  ctx.restore();
}

// The same paintings are used at two exposures: a bright cover and subdued scenery behind combat.
const worlds = [
  { file: 'pelagic', lane: 0.71, width: 0.46 },
  { file: 'caldera', lane: 0.2, width: 0.28 },
  { file: 'opal', lane: 0.67, width: 0.59 },
];

export function loadPlanets(inFlight, redraw) {
  for (const world of inFlight ? worlds : worlds.slice(0, 1)) {
    if (world.image) continue;
    const image = new Image();
    world.image = image;
    image.onload = () => {
      const plate = document.createElement('canvas');
      plate.width = Math.min(640, image.naturalWidth);
      plate.height = Math.round((plate.width * image.naturalHeight) / image.naturalWidth);
      const c = plate.getContext('2d');
      c.drawImage(image, 0, 0, plate.width, plate.height);
      c.globalCompositeOperation = 'source-atop';
      c.fillStyle = '#10192e52';
      c.fillRect(0, 0, plate.width, plate.height);
      world.distant = plate;
      redraw();
    };
    image.src = new URL('./planets/' + world.file + '.webp', import.meta.url).href;
  }
}

function paintGlobe(ctx, image, x, y, width) {
  const height = (width * image.height) / image.width;
  ctx.drawImage(image, x - width / 2, y - height / 2, width, height);
}

export function drawPlanets(ctx, w, h, distance, pan, intro) {
  if (intro) {
    const world = worlds[0];
    if (world.distant) {
      const portrait = w < h;
      paintGlobe(
        ctx,
        world.image,
        w * (portrait ? 0.59 : 0.74),
        h * (portrait ? 0.28 : 0.35),
        Math.min(w * (portrait ? 0.79 : 0.41), h * 0.57),
      );
    }
    return;
  }
  // Two overlapping passes allow the next world to rise while the last one recedes out of view.
  const route = distance / 2200 + 0.43;
  const current = Math.floor(route);
  for (let i = Math.max(0, current - 1); i <= current; i++) {
    const world = worlds[i % worlds.length];
    if (!world.distant) continue;
    const t = route - i;
    const width = Math.min(w, h) * world.width * (0.9 + t * 0.18);
    const x = w * world.lane + (t - 0.5) * width * 0.23 - pan * width * 0.12;
    const y = h * (-0.24 + t * 1.08);
    if (y - width / 2 < h && y + width / 2 > 0) paintGlobe(ctx, world.distant, x, y, width);
  }
}

let paintDust;
export function backdrop(w, h) {
  const plate = document.createElement('canvas');
  const scale = 540 / Math.max(w, h);
  plate.width = Math.max(1, Math.round(w * scale));
  plate.height = Math.max(1, Math.round(h * scale));
  const c = plate.getContext('2d');
  const pixels = c.createImageData(plate.width, plate.height);
  paintDust ??= createPixelRenderer();
  paintDust(pixels.data, {
    w: plate.width,
    h: plate.height,
    region: nebulaRegion('/'),
    phase: 1.4,
    camera: 0,
    progress: 1,
    focusX: 0.5,
    focusY: 0.5,
  });
  // Lift the portfolio's dust lanes into the indigo, copper and sea-green flight palette.
  const data = pixels.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    data[i] = 5 + r * 1.36 + g * 0.08;
    data[i + 1] = 6 + g * 1.24;
    data[i + 2] = 11 + b * 1.17 + r * 0.15;
    data[i + 3] = 255;
  }
  c.putImageData(pixels, 0, 0);
  let seed = 229;
  const roll = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  // Small associations of stars trace the gas, baked once at this aspect ratio.
  for (let cluster = 0; cluster < 16; cluster++) {
    const cx = roll() * plate.width,
      cy = roll() * plate.height;
    const spread = 5 + roll() * 24;
    const warm = roll() < 0.33;
    for (let i = 0; i < 30; i++) {
      const x = cx + (roll() - roll()) * spread;
      const y = cy + (roll() - roll()) * spread * 0.48 + (x - cx) * 0.36;
      c.globalAlpha = 0.14 + roll() * 0.46;
      c.fillStyle = warm ? '#ffcdb0' : '#b6deed';
      const size = 0.35 + roll() ** 4 * 0.9;
      c.fillRect(x, y, size, size);
    }
    if (cluster % 4 === 0) {
      c.globalAlpha = 1;
      const halo = c.createRadialGradient(cx, cy, 0, cx, cy, 5);
      halo.addColorStop(0, '#fff1cc');
      halo.addColorStop(0.17, warm ? '#f4ba8d99' : '#b0dce399');
      halo.addColorStop(1, '#adc7d200');
      c.fillStyle = halo;
      c.fillRect(cx - 5, cy - 5, 10, 10);
    }
  }
  return plate;
}
