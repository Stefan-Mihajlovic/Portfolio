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

function print(ctx, layers) {
  for (const [color, path] of layers) {
    ctx.fillStyle = color;
    ctx.fill(path);
  }
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

export function drawInterceptor(ctx, variant = 'kestrel') {
  print(ctx, shipHulls[variant] || kestrelHull);
  print(ctx, shipCanopies[variant] || shipCanopies.kestrel);
}

// 2.5D Chicken Invaders-style longitudinal roll with single parallax cockpit (zero double cockpit!)
export function drawBankedShip(ctx, variant = 'kestrel', roll = 0, tier = 1, accent = teal) {
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
  print(ctx, shipHulls[variant] || kestrelHull);

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
  print(ctx, shipCanopies[variant] || shipCanopies.kestrel);
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
};

export function drawFoe(ctx, e) {
  ctx.save();
  ctx.translate(e.x, e.y);

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

  ctx.rotate(e.tilt || 0);
  const scale = e.r / 18;
  ctx.scale(scale, scale);

  if (e.kind !== 'prism' && e.kind !== 'courier') {
    const flick = 0.75 + 0.25 * Math.sin((e.age || 0) * 28);
    ctx.fillStyle = e.kind === 'lancer' && e.fireIn <= 0 ? '#ffe7b3' : '#ff8c5990';
    ctx.beginPath();
    ctx.moveTo(-4, -14);
    ctx.lineTo(0, -21 - flick * (e.kind === 'lancer' && e.fireIn <= 0 ? 18 : 6));
    ctx.lineTo(4, -14);
    ctx.fill();
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

  print(ctx, foes[e.kind] || foes.raider);

  if (e.flash > 0) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(255, 244, 216, 0.55)';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
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
    ctx.fillStyle = 'rgba(13, 20, 34, 0.78)';
    ctx.fillRect(bx - 1, by - 1, bw + 2, 4.5);
    ctx.fillStyle = e.kind === 'courier' ? teal : amber;
    ctx.fillRect(bx, by, bw * (e.hp / e.maxHp), 2.5);
  }
}

export function drawMine(ctx, m) {
  ctx.save();
  ctx.translate(m.x, m.y);
  const pulse = 0.5 + 0.5 * Math.sin(m.age * (m.fuse < 1.2 ? 22 : 8));
  ctx.strokeStyle = `rgba(255, 134, 88, ${0.22 + pulse * 0.45})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, m.r + 5 + pulse * 4, 0, TAU);
  ctx.stroke();

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

export function drawRock(ctx, e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.rotate(e.angle);
  ctx.scale(e.r, e.r);
  const shades = e.flash > 0
    ? Array(10).fill('#e6dccd')
    : [
        '#6f7182',
        '#55576c',
        '#41475d',
        '#30384d',
        '#535568',
        '#89858d',
        '#aba099',
        '#888592',
        '#a59f9f',
        '#848292',
      ];
  e.shape.forEach(([x, y], i) => {
    const [nx, ny] = e.shape[(i + 1) % e.shape.length];
    ctx.fillStyle = shades[i];
    ctx.beginPath();
    ctx.moveTo(-0.22, -0.24);
    ctx.lineTo(x, y);
    ctx.lineTo(nx, ny);
    ctx.fill();
  });
  ctx.strokeStyle = '#d3c5b8';
  ctx.lineWidth = 0.04;
  ctx.beginPath();
  ctx.moveTo(...e.shape[6]);
  ctx.lineTo(...e.shape[7]);
  ctx.lineTo(...e.shape[8]);
  ctx.stroke();

  if (e.maxHp > 1 && e.hp < e.maxHp) {
    ctx.strokeStyle = '#ffbe78cc';
    ctx.lineWidth = 0.06;
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
    shield: { rim: '#99dcff', core: '#172d44', label: '+S' },
    nova: { rim: '#ffd485', core: '#3c2918', label: 'NV' },
    overshield: { rim: '#ffe27a', core: '#3a224d', label: 'OS' },
  }[p.kind] || { rim: teal, core: '#16343d', label: '+' };

  const scale = 1 + bob;
  ctx.scale(scale, scale);

  if (p.kind === 'overshield') {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 22);
    g.addColorStop(0, 'rgba(255, 230, 130, 0.48)');
    g.addColorStop(1, 'rgba(180, 120, 255, 0)');
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

  // Subtle editorial orbital telemetry arcs drifting slowly in deep space
  const arcOffset = (travel * 0.09) % (h * 1.6);
  ctx.save();
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
