import { connectFlightPassage } from '../assets/sky/flight-passage.js';
import {
  PALETTE,
  backdrop,
  drawPlanets,
  loadPlanets,
  getSectorName,
  outlineRock,
  drawRock,
  drawFoe,
  drawMine,
  drawPickup,
  drawInterceptor,
} from './art.js';
import { createEnemy, spawnFormation, flyEnemy, waveLength, waveNames } from './encounters.js';
import {
  advanceArmor,
  aliveBossParts,
  createBoss,
  drawBoss,
  drawEntry,
  flyBoss,
  flyEscort,
} from './bosses.js';
import { createFlightAudio } from './audio.js';

const sound = createFlightAudio();
const volume = document.querySelector('#volume');
const level = document.querySelector('#level');
const mixer = document.querySelector('#mixer');
const fullscreen = document.querySelector('#fullscreen');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const formatScore = (value) => String(Math.floor(value)).padStart(6, '0');
const TAU = Math.PI * 2;

// Three genuinely distinct flight rigs
const RIGS = {
  kestrel: {
    name: 'Kestrel',
    shields: 3,
    speed: 355,
    focusSpeed: 152,
    dashCd: 1.7,
    dashSpeed: 840,
    novaRadius: 260,
    fireRate: 0.135,
    accent: '#79e3d5',
  },
  falcon: {
    name: 'Falcon',
    shields: 2,
    speed: 420,
    focusSpeed: 176,
    dashCd: 1.15,
    dashSpeed: 980,
    novaRadius: 235,
    fireRate: 0.105,
    accent: '#ffd18a',
  },
  aegis: {
    name: 'Aegis',
    shields: 4,
    speed: 305,
    focusSpeed: 138,
    dashCd: 2.05,
    dashSpeed: 740,
    novaRadius: 320,
    fireRate: 0.175,
    accent: '#9be9ff',
  },
};

let selectedRig = 'kestrel';
try {
  const savedRig = localStorage.getItem('low-orbit-rig');
  if (savedRig && RIGS[savedRig]) selectedRig = savedRig;
} catch {}

volume.value = sound.volume;
level.value = sound.volume + '%';
volume.addEventListener('input', () => {
  sound.setVolume(volume.valueAsNumber);
  level.value = sound.volume + '%';
});

fullscreen.hidden = !document.fullscreenEnabled;
fullscreen.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
    syncFullscreen();
  } catch {
    fullscreen.hidden = true;
  }
});
function syncFullscreen() {
  const active = Boolean(document.fullscreenElement);
  fullscreen.dataset.active = String(active);
  fullscreen.title = active ? 'Exit fullscreen' : 'Enter fullscreen';
  fullscreen.setAttribute('aria-label', fullscreen.title);
}
document.addEventListener('fullscreenchange', syncFullscreen);
syncFullscreen();

const canvas = document.querySelector('#arena > canvas');
const ctx = canvas.getContext('2d');
const waveLabel = document.querySelector('#wave');
const panel = document.querySelector('#panel');
const title = document.querySelector('#title');
const message = document.querySelector('#message');
const action = document.querySelector('#action');
const restartMenu = document.querySelector('#restart-menu');
const hud = document.querySelector('#hud');
const scoreLabel = document.querySelector('#score');
const bestLabel = document.querySelector('#best');
const shield = document.querySelector('#shield');
const comboHud = document.querySelector('#combo-hud');
const comboMultEl = document.querySelector('#combo-mult');
const bossHud = document.querySelector('#boss-hud');
const bossArmor = document.querySelector('#boss-armor');
const bossPartsEl = document.querySelector('#boss-parts');
const weaponTierEl = document.querySelector('#weapon-tier');
const fireModeEl = document.querySelector('#fire-mode');
const autofireBtn = document.querySelector('#autofire');
const novaBlock = document.querySelector('#nova-block');
const novaLabel = document.querySelector('#nova-label');
const novaPct = document.querySelector('#nova-pct');
const novaFill = document.querySelector('#nova-fill');
const dashPip = document.querySelector('#dash-pip');
const touchDash = document.querySelector('#touch-dash');
const touchNova = document.querySelector('#touch-nova');
const pauseButton = document.querySelector('#pause');

const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const between = (a, b) => a + Math.random() * (b - a);
const collides = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r;

const stars = Array.from({ length: 145 }, () => ({
  x: Math.random(),
  y: Math.random(),
  z: between(0.18, 1),
  warm: Math.random() < 0.24,
}));
const motes = stars.slice(0, 36);
const belt = Array.from({ length: 34 }, () => ({
  x: Math.random(),
  y: (Math.random() + Math.random() - 1) * 0.13,
  r: between(0.65, 3.2),
  angle: between(0, TAU),
  points: outlineRock(),
}));

const keys = new Set();
const player = {
  x: 0,
  y: 0,
  r: 5.5,
  vx: 0,
  vy: 0,
  bank: 0,
  dashTime: 0,
  dashCd: 0,
  dashDx: 0,
  dashDy: -1,
  muzzle: 0,
  recoil: 0,
  trails: [[], []],
  ghosts: [],
};

let enemies = [];
let shots = [];
let pickups = [];
let sparks = [];
let debris = [];
let smoke = [];
let impacts = [];
let shockwaves = [];
let popups = [];

let boss = null;
let nextBossRank = 1;
let bossScoreThreshold = 750;
let mode = 'intro';
let kills = 0;
let grazes = 0;
let score = 0;
let displayScore = 0;
let lives = 3;
let maxLives = 3;
let best = 0;
let weaponLevel = 1;
let autoFire = false;
let combo = 0;
let comboTimer = 0;
let peakMultiplier = 1;
let novaCharge = 0;
let overdriveTime = 0;
let missileTimer = 0;

let distance = 0;
let introTime = 0;
let introCursorX = 0.5;
let introCursorY = 0.5;
let time = 0;
let currentWave = 1;
let spawnIn = 0;
let nextShot = 0;
let immune = 0;
let spawnCount = 0;
let hitstop = 0;
let shake = 0;
let banner = null;

let frame = 0;
let lastTime = 0;
let pointer = null;
let w = 0;
let h = 700;
let background;

try {
  best = Number(localStorage.getItem('low-orbit-best')) || 0;
} catch {}
bestLabel.textContent = formatScore(best);

function getMultiplier() {
  return Math.min(8, 1 + Math.floor(combo / 3) * 0.25);
}

function addScore(base, x, y, showPopup = false, color = PALETTE.paper) {
  const mult = getMultiplier();
  const gained = Math.round(base * mult);
  score += gained;
  if (showPopup && x !== undefined) {
    popups.push({
      x,
      y,
      text: '+' + gained,
      color,
      life: 0.65,
      maxLife: 0.65,
      size: gained >= 250 ? 15 : 12,
    });
  }
  return gained;
}

function bumpCombo(amount = 1) {
  combo += amount;
  comboTimer = 4.2;
  const mult = getMultiplier();
  if (mult > peakMultiplier) peakMultiplier = mult;
}

function showBanner(kicker, headline, tone = 'teal', duration = 2.4) {
  banner = { kicker, headline, tone, life: duration, maxLife: duration };
}

function addShake(amount) {
  if (reducedMotion.matches) return;
  shake = Math.min(18, Math.max(shake, amount));
}

function triggerHitstop(seconds) {
  if (reducedMotion.matches) return;
  hitstop = Math.max(hitstop, seconds);
}

function resize() {
  const box = canvas.getBoundingClientRect();
  if (!box.width || !box.height) return;
  const previousWidth = w;
  const previousHeight = h;
  h = Math.min(720, (460 * box.height) / box.width + 300);
  w = (h * box.width) / box.height;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(box.width * dpr);
  canvas.height = Math.round(box.height * dpr);
  ctx.setTransform(canvas.width / w, 0, 0, canvas.height / h, 0, 0);
  if (previousWidth) {
    const sx = w / previousWidth;
    const sy = h / previousHeight;
    for (const object of [player, ...enemies, ...shots, ...pickups, ...sparks, ...debris, ...smoke, ...impacts]) {
      object.x *= sx;
      object.y *= sy;
    }
  }
  pointer = null;
  if (!background || Math.abs(previousWidth / previousHeight - w / h) > 0.001) {
    background = backdrop(w, h);
  }
  draw();
}

function paintShip(x, y, width, angle = 0, thrust = 1, variant = selectedRig, opts = {}) {
  const rig = RIGS[variant] || RIGS.kestrel;
  const roll = opts.roll || 0;
  ctx.save();
  ctx.translate(x, y + (opts.recoil || 0));
  if (angle) ctx.rotate(angle);

  const height = width;
  // Chicken Invaders-style banking: nose stays locked straight up while wings foreshorten slightly on roll
  ctx.scale(mode === 'intro' ? 1 : 1 - Math.abs(roll) * 0.24, 1);

  // Thruster plume
  const tail = height * 0.42;
  const boost = opts.dashing ? 2.1 : opts.overdrive ? 1.45 : 1;
  const plume =
    height * (0.22 + 0.25 * thrust) * boost * (1 + 0.1 * Math.sin((introTime + time) * 34));
  const sway = mode === 'intro' ? 0 : -roll * width * 0.16;
  const flame = ctx.createLinearGradient(0, tail, sway, tail + plume);
  flame.addColorStop(0, '#fff7d4');
  flame.addColorStop(0.3, opts.overdrive ? '#ffba73e0' : rig.accent + 'dc');
  flame.addColorStop(1, rig.accent + '00');
  ctx.fillStyle = flame;
  ctx.beginPath();
  ctx.moveTo(-width * 0.1, tail);
  ctx.quadraticCurveTo(-width * 0.055 + sway * 0.5, tail + plume * 0.65, sway, tail + plume);
  ctx.quadraticCurveTo(width * 0.055 + sway * 0.5, tail + plume * 0.65, width * 0.1, tail);
  ctx.fill();

  // Overdrive aura
  if (opts.overdrive) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const aura = ctx.createRadialGradient(0, 0, width * 0.1, 0, 0, width * 0.72);
    aura.addColorStop(0, 'rgba(255, 224, 148, 0.26)');
    aura.addColorStop(1, 'rgba(255, 178, 102, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, width * 0.72, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  ctx.scale(width / 94, width / 94);

  // Visual wing weapon pods for upgraded MK II+ tiers
  if (opts.tier >= 2) {
    ctx.fillStyle = PALETTE.ink;
    ctx.fillRect(-35, 1, 7, 17);
    ctx.fillRect(28, 1, 7, 17);
    ctx.fillStyle = opts.tier >= 4 ? PALETTE.gold : rig.accent;
    ctx.fillRect(-33.5, 3, 4, 12);
    ctx.fillRect(29.5, 3, 4, 12);
  }

  drawInterceptor(ctx, variant);

  // Muzzle flash
  if (opts.muzzle > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = opts.overdrive ? 'rgba(255, 218, 138, 0.85)' : 'rgba(155, 243, 247, 0.8)';
    ctx.beginPath();
    ctx.ellipse(0, -54, 8 + opts.muzzle * 8, 13 + opts.muzzle * 12, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function draw() {
  if (!background) return;
  const intro = mode === 'intro';
  const travel = intro ? introTime * 14 : distance;
  const pan = intro
    ? Math.sin(introTime * 0.14) * 0.12 + (introCursorX - 0.5) * 0.26
    : player.x / w - 0.5;

  ctx.save();
  if (shake > 0.2 && mode === 'playing') {
    const sx = (Math.random() - 0.5) * 2 * shake;
    const sy = (Math.random() - 0.5) * 2 * shake;
    ctx.translate(sx, sy);
  }

  // Seamless rolling nebula backdrop
  const tile = h * 1.18;
  const scroll = travel * 0.12;
  const phase = scroll % tile;
  const index = Math.floor(scroll / tile);
  for (let i = -1; i <= 0; i++) {
    ctx.save();
    const flip = (index - i) % 2 !== 0;
    ctx.translate(-w * (0.08 + pan * 0.09), phase + i * tile + (flip ? tile : 0));
    if (flip) ctx.scale(1, -1);
    ctx.drawImage(background, 0, 0, w * 1.16, tile);
    ctx.restore();
  }

  // Deep parallax starfield
  const speedStreak = overdriveTime > 0 ? 4.4 : player.dashTime > 0 ? 5.2 : 2.5;
  for (const star of stars) {
    const z = star.z;
    const x = (((star.x * w - pan * z * 34) % w) + w) % w;
    const y = (star.y * h + travel * z * z) % h;
    ctx.fillStyle = star.warm ? '#ffe1c4' : '#e8f3ff';
    ctx.globalAlpha = 0.2 + z * 0.56;
    ctx.fillRect(x, y, 0.45 + z * 0.95, 0.6 + z * (intro ? 1.1 : speedStreak));
  }

  ctx.globalAlpha = 1;
  drawPlanets(ctx, w, h, distance, pan, intro);

  // Subtle distant orbital debris belt
  const beltPhase = (travel / (h * 7) + 0.25) % 1;
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#9aa7b0';
  for (const shard of belt) {
    const x = (shard.x - 0.5) * (1 + beltPhase * 0.24) + 0.5 - pan * 0.07;
    const y = beltPhase * 1.65 - 0.39 + (shard.x - 0.5) * 0.54 + shard.y;
    const size = shard.r * (0.6 + beltPhase);
    ctx.save();
    ctx.translate(x * w, y * h);
    ctx.rotate(shard.angle + travel * 0.00028);
    ctx.scale(size * 1.45, size);
    ctx.beginPath();
    for (const [px, py] of shard.points) ctx.lineTo(px, py);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Perspective speed motes
  ctx.strokeStyle = overdriveTime > 0 ? '#ffd7a1' : '#a6c4d4';
  for (const mote of motes) {
    const depth = 1.65 - ((mote.z + travel / (h * 2.6)) % 1.5);
    const dx = (mote.x - 0.5) * w;
    const dy = (mote.y - 0.39) * h;
    const cx = w * 0.5 - pan * 19;
    const cy = h * 0.3;
    ctx.globalAlpha = Math.max(0, (1 - depth / 1.65) * 0.38);
    ctx.lineWidth = 0.55 / depth;
    ctx.beginPath();
    ctx.moveTo(cx + dx / (depth + 0.017), cy + dy / (depth + 0.017));
    ctx.lineTo(cx + dx / depth, cy + dy / depth);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Interactive Hangar / Intro hero flyover
  if (intro) {
    const portrait = w < h;
    const x =
      w * (portrait ? 0.48 : 0.65) +
      Math.sin(introTime * 0.45) * 5 +
      (introCursorX - 0.5) * (portrait ? 12 : 24);
    const y =
      h * (portrait ? 0.25 : 0.43) +
      Math.cos(introTime * 0.55) * 4 +
      (introCursorY - 0.5) * 14;
    const size = Math.min(w * (portrait ? 0.25 : 0.19), h * (portrait ? 0.2 : 0.31));
    const rig = RIGS[selectedRig];

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(0.76);
    ctx.scale(size / 94, size / 94);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 23 - 2, 32);
      ctx.bezierCurveTo(side * 23 - 4, 108, -15, 168, -138, 272);
      ctx.bezierCurveTo(-26, 179, side * 23 + 6, 99, side * 23 + 2, 32);
      ctx.fillStyle = rig.accent + '66';
      ctx.fill();
    }
    ctx.restore();
    paintShip(x, y, size, 0.76 + (introCursorX - 0.5) * 0.08, 1.25, selectedRig, { tier: 2 });
    ctx.restore();
    return;
  }

  // Smoke & missile wakes
  for (const puff of smoke) {
    const t = puff.life / puff.maxLife;
    ctx.globalAlpha = t * 0.36;
    ctx.fillStyle = puff.color;
    ctx.beginPath();
    ctx.arc(puff.x, puff.y, puff.r * (1.7 - t * 0.7), 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Expanding Nova / breach shockwaves
  for (const wave of shockwaves) {
    const p = 1 - wave.life / wave.maxLife;
    const r = wave.radius * (0.1 + p * 0.9);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = (1 - p) * 0.85;
    ctx.strokeStyle = wave.color;
    ctx.lineWidth = Math.max(1.5, (1 - p) * 8);
    ctx.beginPath();
    ctx.arc(wave.x, wave.y, r, 0, TAU);
    ctx.stroke();

    ctx.globalAlpha = (1 - p) * 0.14;
    ctx.fillStyle = wave.color;
    ctx.beginPath();
    ctx.arc(wave.x, wave.y, r, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  // Salvage & tactical pickups
  for (const p of pickups) drawPickup(ctx, p);

  // Lancer afterimages + all enemies
  for (const enemy of enemies) {
    if (enemy.trail?.length) {
      for (let i = 0; i < enemy.trail.length; i++) {
        const g = enemy.trail[i];
        ctx.save();
        ctx.globalAlpha = ((i + 1) / enemy.trail.length) * 0.25;
        ctx.translate(g.x, g.y);
        ctx.rotate(g.tilt || 0);
        ctx.fillStyle = '#ff9d6e';
        ctx.beginPath();
        ctx.moveTo(0, 14);
        ctx.lineTo(-7, -10);
        ctx.lineTo(7, -10);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
    if (enemy.escort && enemy.age < 0) drawEntry(ctx, enemy, w);
    else if (enemy.kind === 'rock') drawRock(ctx, enemy);
    else if (enemy.kind === 'mine') drawMine(ctx, enemy);
    else if (enemy.kind === 'boss') drawBoss(ctx, enemy, w, h);
    else drawFoe(ctx, enemy);
  }

  // Spinning armor debris chunks
  for (const d of debris) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, (d.life / d.maxLife) * 1.4);
    ctx.translate(d.x, d.y);
    ctx.rotate(d.angle);
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.moveTo(-d.s, -d.s * 0.6);
    ctx.lineTo(d.s * 0.9, -d.s * 0.3);
    ctx.lineTo(d.s * 0.4, d.s);
    ctx.lineTo(-d.s * 0.7, d.s * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Projectiles with crisp bullet-hell contrast
  for (const s of shots) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(Math.atan2(s.vx, -s.vy));
    if (s.hostile) {
      // High-contrast outline + warm glow + white-hot core
      ctx.fillStyle = '#120b16';
      ctx.beginPath();
      ctx.arc(0, 0, s.r + 1.8, 0, TAU);
      ctx.fill();

      ctx.fillStyle = s.color || '#ff7d52';
      ctx.beginPath();
      ctx.arc(0, 0, s.r + 0.5, 0, TAU);
      ctx.fill();

      ctx.fillStyle = '#fff5dc';
      ctx.beginPath();
      ctx.arc(0, 0, s.r * 0.48, 0, TAU);
      ctx.fill();
      ctx.restore();
      continue;
    }

    if (s.homing) {
      ctx.fillStyle = '#ffd18a';
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(3.2, 4);
      ctx.lineTo(0, 2);
      ctx.lineTo(-3.2, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff9e6';
      ctx.fillRect(-1, -6, 2, 6);
      ctx.restore();
      continue;
    }

    ctx.globalCompositeOperation = 'lighter';
    const bw = s.heavy ? 4.4 : s.focused ? 2.6 : 2.1;
    const bh = s.focused ? 22 : s.heavy ? 16 : 15;
    ctx.fillStyle = s.color || (s.focused ? '#99f7ff55' : '#6fddff45');
    ctx.fillRect(-bw * 1.6, -bh * 0.55, bw * 3.2, bh * 1.15);
    ctx.fillStyle = s.overdrive ? '#ffcf7d' : s.focused ? '#96f6ff' : '#7ae2f2';
    ctx.fillRect(-bw * 0.7, -bh * 0.5, bw * 1.4, bh);
    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(-bw * 0.32, -bh * 0.42, bw * 0.64, bh * 0.56);
    ctx.restore();
  }

  // Directional spark streaks
  for (const p of sparks) {
    ctx.globalAlpha = Math.min(1, p.life * 2.8);
    ctx.strokeStyle = p.color;
    ctx.lineWidth = p.w || 1.7;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Impact rings
  for (const ring of impacts) {
    const progress = 1 - ring.life / ring.maxLife;
    ctx.save();
    ctx.globalAlpha = (1 - progress) * 0.78;
    ctx.strokeStyle = ring.color;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.radius * (0.35 + progress * 1.75), 0, TAU);
    ctx.lineWidth = Math.max(0.6, 2.2 - progress * 1.6);
    ctx.stroke();
    ctx.restore();
  }

  // Wingtip contrails & Dash afterimages
  if (lives > 0) {
    const rig = RIGS[selectedRig];
    for (const trail of player.trails) {
      if (trail.length < 2) continue;
      ctx.beginPath();
      for (let i = 0; i < trail.length; i++) {
        const pt = trail[i];
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = overdriveTime > 0 ? 'rgba(255, 206, 128, 0.28)' : rig.accent + '36';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }

    for (const g of player.ghosts) {
      ctx.save();
      ctx.globalAlpha = (g.life / 0.24) * 0.36;
      paintShip(g.x, g.y, 34, 0, 1.4, selectedRig, { dashing: true, roll: g.bank });
      ctx.restore();
    }

    // Player ship — nose always straight ahead like Chicken Invaders, subtle roll foreshortening
    ctx.globalAlpha = immune > 0 && player.dashTime <= 0 ? (Math.sin(time * 20) > 0 ? 0.55 : 0.88) : 1;
    paintShip(
      player.x,
      player.y,
      34,
      0,
      clamp(0.78 - player.vy / 360, 0.28, 1.7),
      selectedRig,
      {
        dashing: player.dashTime > 0,
        overdrive: overdriveTime > 0,
        tier: weaponLevel,
        muzzle: player.muzzle,
        recoil: player.recoil,
        roll: player.bank,
      },
    );
    ctx.globalAlpha = 1;

    // Diegetic dash cooldown arc directly beneath ship when recharging
    if (player.dashCd > 0) {
      const frac = 1 - player.dashCd / rig.dashCd;
      ctx.strokeStyle = 'rgba(121, 227, 213, 0.48)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 24, Math.PI * 0.72, Math.PI * 0.72 + frac * Math.PI * 1.56);
      ctx.stroke();
    }

    // Focus hitbox core & graze ring
    if (preciseSteering() || pointer) {
      ctx.strokeStyle = 'rgba(121, 227, 213, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 23, 0, TAU);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r, 0, TAU);
      ctx.strokeStyle = '#112633';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.fillStyle = '#c4fff4d8';
      ctx.fill();
    }

    if (immune > 0 && player.dashTime <= 0) {
      ctx.beginPath();
      ctx.arc(player.x, player.y, 23, 0, TAU);
      ctx.strokeStyle = '#9ff0f6';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }

  // Floating score & callout popups
  for (const pop of popups) {
    const p = 1 - pop.life / pop.maxLife;
    ctx.save();
    ctx.globalAlpha = Math.min(1, (1 - p) * 1.6);
    ctx.fillStyle = pop.color;
    ctx.font = `700 ${pop.size}px ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(pop.text, pop.x, pop.y - p * 22);
    ctx.restore();
  }

  // Diegetic Sector / Boss Warning Banner
  if (banner && mode === 'playing') {
    const p = 1 - banner.life / banner.maxLife;
    const alpha = p < 0.15 ? p / 0.15 : p > 0.76 ? (1 - p) / 0.24 : 1;
    const accent = banner.tone === 'warn' ? '#ff9368' : banner.tone === 'gold' ? '#ffe08a' : '#79e3d5';
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    const cy = h * 0.24;

    ctx.fillStyle = banner.tone === 'warn' ? 'rgba(32, 12, 18, 0.58)' : 'rgba(9, 15, 26, 0.42)';
    ctx.fillRect(0, cy - 27, w, 54);
    ctx.fillStyle = accent;
    ctx.fillRect(0, cy - 27, w, 1.5);
    ctx.fillRect(0, cy + 25.5, w, 1.5);

    ctx.textAlign = 'center';
    ctx.font = '700 10px ui-monospace, monospace';
    ctx.fillStyle = accent;
    ctx.fillText(banner.kicker, w / 2, cy - 8);

    ctx.font = '800 22px Cabinet, sans-serif';
    ctx.fillStyle = '#faf1d6';
    ctx.fillText(banner.headline, w / 2, cy + 14);
    ctx.restore();
  }

  // Pause / Game Over atmospheric vignette
  if (mode === 'paused' || mode === 'over') {
    const shade = ctx.createLinearGradient(0, h, w * 0.88, h * 0.12);
    shade.addColorStop(0, '#050a16e0');
    shade.addColorStop(0.58, '#080d198a');
    shade.addColorStop(1, '#0b112442');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.restore();
}

function burst(object, color, heavy = false) {
  const count = heavy ? 22 : 13;
  impacts.push({
    x: object.x,
    y: object.y,
    radius: object.r || 16,
    color,
    life: heavy ? 0.52 : 0.42,
    maxLife: heavy ? 0.52 : 0.42,
  });
  for (let i = 0; i < count; i++) {
    const a = between(0, TAU);
    const spd = between(heavy ? 70 : 45, heavy ? 230 : 140);
    sparks.push({
      x: object.x,
      y: object.y,
      vx: Math.cos(a) * spd,
      vy: Math.sin(a) * spd,
      life: between(0.2, heavy ? 0.58 : 0.44),
      color: i % 3 === 0 ? '#fff4d6' : color,
      w: heavy ? 2.1 : 1.6,
    });
  }
  const chunkCount = heavy ? 8 : 4;
  for (let i = 0; i < chunkCount; i++) {
    const a = between(0, TAU);
    const spd = between(35, heavy ? 140 : 90);
    const life = between(0.35, 0.72);
    debris.push({
      x: object.x,
      y: object.y,
      vx: Math.cos(a) * spd,
      vy: Math.sin(a) * spd,
      angle: between(0, TAU),
      spin: between(-8, 8),
      s: between(2.5, heavy ? 6.5 : 4.5),
      color: i % 2 === 0 ? color : '#3f5069',
      life,
      maxLife: life,
    });
  }
}

function dropShards(x, y, count, nova = false) {
  for (let i = 0; i < count; i++) {
    const a = between(0, TAU);
    const spd = between(30, 95);
    pickups.push({
      kind: 'shard',
      nova,
      x,
      y,
      vx: Math.cos(a) * spd,
      vy: Math.sin(a) * spd - 20,
      r: nova ? 5.2 : 4.4,
      age: 0,
      seed: Math.random() * TAU,
      magnet: false,
    });
  }
}

function dropTacticalCell(x, y, forcedKind = null) {
  let kind = forcedKind;
  if (!kind) {
    if (weaponLevel < 4) kind = 'weapon';
    else if (lives < maxLives) kind = 'shield';
    else kind = 'nova';
  }
  pickups.push({
    kind,
    x,
    y,
    vx: between(-24, 24),
    vy: -30,
    r: 13,
    age: 0,
    seed: 0,
    magnet: false,
  });
}

function triggerPhaseDash() {
  if (mode !== 'playing' || player.dashCd > 0 || player.dashTime > 0) return;
  const rig = RIGS[selectedRig];
  let dx =
    Number(keys.has('ArrowRight') || keys.has('KeyD')) -
    Number(keys.has('ArrowLeft') || keys.has('KeyA'));
  let dy =
    Number(keys.has('ArrowDown') || keys.has('KeyS')) - Number(keys.has('ArrowUp') || keys.has('KeyW'));
  if (!dx && !dy) {
    if (Math.hypot(player.vx, player.vy) > 35) {
      dx = player.vx;
      dy = player.vy;
    } else {
      dx = 0;
      dy = -1;
    }
  }
  const len = Math.hypot(dx, dy) || 1;
  player.dashDx = dx / len;
  player.dashDy = dy / len;
  player.dashTime = 0.2;
  player.dashCd = rig.dashCd;
  immune = Math.max(immune, 0.26);
  sound.effect('phaseDash');
  impacts.push({ x: player.x, y: player.y, radius: 14, color: rig.accent, life: 0.3, maxLife: 0.3 });
}

function triggerNovaPulse() {
  if (mode !== 'playing' || novaCharge < 50) return;
  const rig = RIGS[selectedRig];
  const power = novaCharge >= 98 ? 1.15 : 0.85;
  const radius = rig.novaRadius * power;
  novaCharge = 0;
  overdriveTime = 4.8 * power;
  immune = Math.max(immune, 0.75);
  shockwaves.push({
    x: player.x,
    y: player.y,
    radius,
    color: '#ffe299',
    life: 0.55,
    maxLife: 0.55,
  });
  addShake(11);
  triggerHitstop(0.05);
  sound.effect('nova');
  popups.push({
    x: player.x,
    y: player.y - 24,
    text: 'OVERDRIVE',
    color: PALETTE.gold,
    life: 0.9,
    maxLife: 0.9,
    size: 14,
  });

  // Cancel enemy bullets inside radius into golden score crystals
  let cancelled = 0;
  for (const s of shots) {
    if (!s.hostile || s.dead) continue;
    if (Math.hypot(s.x - player.x, s.y - player.y) <= radius * 1.08) {
      s.dead = true;
      dropShards(s.x, s.y, 1, true);
      cancelled++;
    }
  }
  if (cancelled > 0) bumpCombo(Math.min(8, Math.ceil(cancelled / 2)));

  // Shockwave damage to enemies & boss parts
  for (const e of enemies) {
    if (e.dead) continue;
    if (e === boss) {
      if (e.entering > 0 || e.dying > 0) continue;
      for (const part of aliveBossParts(e)) {
        if (Math.hypot(part.x - player.x, part.y - player.y) <= radius + part.r) {
          damageBossPart(e, part, 6);
        }
      }
      if (Math.hypot(e.x - player.x, e.y - player.y) <= radius + e.r) {
        damageBossCore(e, 8);
      }
    } else if (Math.hypot(e.x - player.x, e.y - player.y) <= radius + e.r) {
      e.hp -= 8;
      e.flash = 0.2;
      if (e.hp <= 0) killEnemy(e);
    }
  }
  updateHud();
}

function beginBoss() {
  boss = createBoss(nextBossRank++, w);
  enemies = [boss, ...enemies.filter((e) => e.kind === 'rock')];
  for (const s of shots) if (s.hostile) s.dead = true;
  document.querySelector('#boss-name').textContent =
    `${boss.name} // ${String(boss.rank).padStart(2, '0')}`;
  bossArmor.max = boss.maxHp;
  updateBossArmor();
  bossHud.hidden = false;
  sound.effect('warning');
  sound.setBoss(boss.rank);
  showBanner('WARNING // FLAGSHIP DETECTED', `${boss.name} — ${boss.designation}`, 'warn', 2.8);
}

function updateBossArmor() {
  if (!boss) return;
  bossArmor.value = boss.hp;
  const phaseText = `PHASE ${boss.phase}/3`;
  document.querySelector('#boss-phase').textContent = phaseText;
  const live = aliveBossParts(boss);
  bossPartsEl.textContent =
    boss.exposedFor > 0
      ? 'CORE EXPOSED — DOUBLE DAMAGE'
      : live.length > 0
        ? `${live.length} SUBSYSTEM${live.length > 1 ? 'S' : ''} ONLINE`
        : 'SUBSYSTEMS CLEARED';
  bossArmor.setAttribute('aria-valuetext', `${boss.hp} armor remaining. ${phaseText}`);
}

function damageBossPart(b, part, dmg) {
  part.hp = Math.max(0, part.hp - dmg);
  part.flash = 0.14;
  if (part.hp > 0) {
    sound.effect('impact');
    return;
  }
  part.dead = true;
  burst({ x: part.x, y: part.y, r: part.r * 1.4 }, '#ffbe78', true);
  dropShards(part.x, part.y, 6, true);
  addScore(180, part.x, part.y, true, PALETTE.gold);
  bumpCombo(3);
  addShake(9);
  triggerHitstop(0.055);
  sound.effect('breach');

  // Clear bullets nearby for rewarding tactile payoff
  for (const round of shots) {
    if (round.hostile && Math.hypot(round.x - part.x, round.y - part.y) < 220) {
      round.dead = true;
      dropShards(round.x, round.y, 1, true);
    }
  }

  // If all subsystems are destroyed, expose flagship core for 5 seconds!
  if (aliveBossParts(b).length === 0) {
    b.exposedFor = 5.2;
    b.fireIn = Math.max(b.fireIn, 1.25);
    shockwaves.push({ x: b.x, y: b.y, radius: 140, color: '#98ffdc', life: 0.4, maxLife: 0.4 });
    popups.push({
      x: b.x,
      y: b.y - 36,
      text: 'CORE EXPOSED!',
      color: '#98ffdc',
      life: 1.1,
      maxLife: 1.1,
      size: 14,
    });
  }
  updateBossArmor();
}

function damageBossCore(b, dmg) {
  const live = aliveBossParts(b);
  const armorScale = b.exposedFor > 0 ? 2 : b.design === 1 && live.length > 0 ? 0.65 : 1;
  b.hp = Math.max(0, b.hp - dmg * armorScale);
  b.flash = 0.12;
  if (advanceArmor(b)) {
    for (const round of shots) {
      if (round.hostile) {
        round.dead = true;
        dropShards(round.x, round.y, 1, true);
      }
    }
    burst({ x: b.x, y: b.y, r: b.r * 1.2 }, '#ffcd8a', true);
    shockwaves.push({ x: b.x, y: b.y, radius: 190, color: '#ffbe78', life: 0.45, maxLife: 0.45 });
    addShake(10);
    triggerHitstop(0.06);
    sound.effect('breach');
  }
  updateBossArmor();
  if (b.hp <= 0 && b.dying <= 0) {
    b.dying = 1.25;
    b.deathTick = 0;
    for (const e of enemies) if (e.escort) e.dead = true;
    for (const s of shots) if (s.hostile) s.dead = true;
    triggerHitstop(0.075);
    addShake(14);
    sound.effect('breach');
  } else if (b.hp > 0) {
    sound.effect('impact');
  }
}

function finishBossCollapse(b) {
  b.dead = true;
  boss = null;
  bossHud.hidden = true;
  burst({ x: b.x, y: b.y, r: b.r * 1.8 }, '#ffd28f', true);
  shockwaves.push({ x: b.x, y: b.y, radius: 280, color: '#ffe5a3', life: 0.6, maxLife: 0.6 });
  dropShards(b.x, b.y, 14, true);
  dropTacticalCell(b.x - 24, b.y, weaponLevel < 4 ? 'weapon' : 'nova');
  if (lives < maxLives) dropTacticalCell(b.x + 24, b.y, 'shield');
  addScore(b.points, b.x, b.y, true, PALETTE.gold);
  kills++;
  bumpCombo(6);
  addShake(16);
  sound.effect('nova');
  sound.setBoss(0);
  bossScoreThreshold = score + 1400 + nextBossRank * 450;
  spawnIn = 1.6;
  showBanner('FLAGSHIP DESTROYED', `${b.name} NEUTRALIZED`, 'gold', 2.2);
  updateHud();
}

function killEnemy(e) {
  if (e.dead) return;
  e.dead = true;
  const isRock = e.kind === 'rock';
  const heavy = ['gunship', 'prism', 'minelayer', 'courier'].includes(e.kind);
  sound.effect(isRock ? 'rock' : 'ship');
  addScore(e.points, e.x, e.y, true, e.kind === 'courier' ? PALETTE.gold : PALETTE.paper);
  if (!isRock) {
    kills++;
    bumpCombo(heavy ? 2 : 1);
  }
  burst(e, isRock ? '#a79fa3' : e.kind === 'prism' ? '#cba8ff' : e.kind === 'courier' ? PALETTE.gold : '#ffad73', heavy);
  if (heavy) {
    addShake(6);
    triggerHitstop(0.028);
  } else {
    addShake(2.2);
  }
  dropShards(e.x, e.y, e.shards || 2);

  // Supply courier always drops a tactical upgrade cell
  if (e.kind === 'courier') {
    dropTacticalCell(e.x, e.y);
  } else if (heavy && Math.random() < 0.24) {
    dropTacticalCell(e.x, e.y);
  }

  // Large asteroids fracture into 2 fast rubble shards
  if (isRock && e.split) {
    for (const dir of [-1, 1]) {
      const child = createEnemy('rock', e.x + dir * 10, e.y, currentWave, {
        r: Math.max(10, e.r * 0.54),
        hp: 1,
        maxHp: 1,
        split: false,
        vx: dir * between(45, 95),
        vy: between(95, 145),
        points: 10,
        shards: 1,
      });
      child.shape = outlineRock();
      enemies.push(child);
    }
  }
}

function renderShieldPips() {
  shield.innerHTML = '';
  for (let i = 0; i < maxLives; i++) {
    const pip = document.createElement('i');
    if (i >= lives) pip.classList.add('spent');
    shield.append(pip);
  }
  shield.setAttribute('aria-label', `${lives} of ${maxLives} shields`);
  shield.classList.toggle('critical', lives === 1);
}

function updateHud() {
  scoreLabel.textContent = formatScore(displayScore);
  renderShieldPips();

  // Combo indicator
  const mult = getMultiplier();
  comboHud.hidden = combo < 2;
  if (!comboHud.hidden) {
    comboMultEl.textContent = `×${mult.toFixed(2).replace(/\.00$/, '.0')}`;
    comboHud.dataset.tier = mult >= 3 ? 'high' : 'base';
    comboHud.style.setProperty('--combo-life', `${Math.max(0, (comboTimer / 4.2) * 100)}%`);
  }

  // Weapon & mode badges
  const roman = ['I', 'II', 'III', 'IV'][clamp(weaponLevel - 1, 0, 3)];
  weaponTierEl.textContent = `MK ${roman}`;
  const focused = preciseSteering();
  fireModeEl.textContent = overdriveTime > 0 ? 'OVERDRIVE' : focused ? 'LANCE' : 'WIDE';
  fireModeEl.classList.toggle('focus-on', focused || overdriveTime > 0);
  autofireBtn.setAttribute('aria-pressed', String(autoFire));

  // Nova / Overdrive gauge
  const pct = overdriveTime > 0 ? Math.min(100, (overdriveTime / 4.8) * 100) : Math.min(100, novaCharge);
  novaFill.style.width = `${pct.toFixed(1)}%`;
  novaPct.textContent = overdriveTime > 0 ? `${overdriveTime.toFixed(1)}s` : `${Math.floor(novaCharge)}%`;
  novaLabel.textContent = overdriveTime > 0 ? 'OVERDRIVE' : novaCharge >= 50 ? 'NOVA READY' : 'NOVA';
  novaBlock.dataset.ready = String(novaCharge >= 50);
  novaBlock.dataset.overdrive = String(overdriveTime > 0);
  dashPip.dataset.ready = String(player.dashCd <= 0);
  touchNova.disabled = novaCharge < 50;
  touchDash.disabled = player.dashCd > 0;
}

function computeRank() {
  if (score >= 12000) return 'S';
  if (score >= 6500) return 'A';
  if (score >= 3000) return 'B';
  if (score >= 1200) return 'C';
  return 'D';
}

function setMode(next) {
  mode = next;
  document.body.dataset.mode = next;
  pauseButton.hidden = next !== 'playing';
  restartMenu.hidden = next !== 'paused';
  mixer.open = false;
  keys.clear();
  pointer = null;
  cancelAnimationFrame(frame);
  frame = 0;
  lastTime = 0;
  panel.hidden = next === 'playing';
  hud.hidden = next !== 'playing';

  if (next === 'playing') {
    sound.start();
    canvas.focus({ preventScroll: true });
    frame = requestAnimationFrame(tick);
  } else if (next === 'intro') {
    sound.stop();
    sound.rewind();
    boss = null;
    bossHud.hidden = true;
    title.textContent = 'Low Orbit';
    message.hidden = false;
    document.querySelector('#debrief').hidden = true;
    document.querySelector('#action-text').textContent = 'Play';
    action.focus({ preventScroll: true });
    startIntro();
  } else {
    const lost = next === 'over';
    sound.stop();
    if (lost) sound.death();
    title.textContent = lost ? 'Ship lost' : 'Paused';
    message.hidden = true;
    document.querySelector('#debrief').hidden = false;
    document.querySelector('#run-rank').textContent = computeRank();
    document.querySelector('#run-score').textContent = Math.floor(score).toLocaleString();
    document.querySelector('#run-wave').textContent = waveLabel.textContent;
    document.querySelector('#run-kills').textContent = kills;
    document.querySelector('#run-combo').textContent = `×${peakMultiplier.toFixed(1)}`;
    document.querySelector('#action-text').textContent = lost ? 'Play again' : 'Resume';
    action.focus({ preventScroll: true });
  }
  draw();
}

function launch() {
  const rig = RIGS[selectedRig];
  time = 0;
  distance = 0;
  player.vx = player.vy = player.bank = 0;
  player.dashTime = 0;
  player.dashCd = 0;
  player.muzzle = 0;
  player.recoil = 0;
  player.trails = [[], []];
  player.ghosts = [];
  score = 0;
  displayScore = 0;
  kills = 0;
  grazes = 0;
  combo = 0;
  comboTimer = 0;
  peakMultiplier = 1;
  novaCharge = 25;
  overdriveTime = 0;
  weaponLevel = 1;
  maxLives = rig.shields;
  lives = rig.shields;
  immune = 1.1;
  currentWave = 1;
  spawnIn = 0.45;
  spawnCount = 0;
  waveLabel.textContent = '01';
  hud.style.setProperty('--wave-progress', '0%');
  sound.setWave(1);
  sound.setIntensity(0);
  boss = null;
  nextBossRank = 1;
  bossScoreThreshold = 750;
  bossHud.hidden = true;
  sound.rewind();
  nextShot = 0;
  missileTimer = 0;
  hitstop = 0;
  shake = 0;
  player.x = w / 2;
  player.y = h * 0.79;
  enemies = [];
  shots = [];
  pickups = [];
  sparks = [];
  debris = [];
  smoke = [];
  impacts = [];
  shockwaves = [];
  popups = [];
  showBanner(`SECTOR 01 // ${getSectorName(1)}`, `WAVE 01 — ${waveNames[0]}`, 'teal', 2.2);
  updateHud();
  setMode('playing');
}

function hitPlayer() {
  if (immune > 0 || player.dashTime > 0) return;
  lives--;
  combo = Math.floor(combo * 0.35);
  if (weaponLevel > 1) weaponLevel--;
  if (lives > 0) sound.effect('shield');
  immune = 1.65;
  addShake(12);
  triggerHitstop(0.065);
  burst(player, '#a6eaf1', true);
  // Clear immediate danger bullets around player so you never get double-tapped
  for (const s of shots) {
    if (s.hostile && Math.hypot(s.x - player.x, s.y - player.y) < 130) s.dead = true;
  }
  updateHud();
  if (lives <= 0) {
    if (score > best) {
      best = Math.floor(score);
      bestLabel.textContent = formatScore(best);
      try {
        localStorage.setItem('low-orbit-best', String(best));
      } catch {}
    }
    setMode('over');
  }
}

function preciseSteering() {
  return keys.has('ShiftLeft') || keys.has('ShiftRight');
}

function firePlayerWeapons(focused) {
  const rig = RIGS[selectedRig];
  const od = overdriveTime > 0;
  const dmgBoost = (focused ? 1.28 : 1) * (od ? 1.25 : 1);
  // Always fire straight ahead (no nose tilt skew)
  const aimBase = 0;

  function shoot(ox, oy, angle, speed, dmg, opts = {}) {
    shots.push({
      x: player.x + ox,
      y: player.y + oy,
      r: opts.heavy ? 5.5 : 4.2,
      vx: Math.sin(angle) * speed,
      vy: -Math.cos(angle) * speed,
      dmg,
      hostile: false,
      focused,
      overdrive: od,
      ...opts,
    });
  }

  if (selectedRig === 'aegis') {
    // Heavy tri-plasma cannons
    if (focused) {
      shoot(-7, -17, aimBase * 0.4, 650, 1.45 * dmgBoost, { heavy: true });
      shoot(7, -17, aimBase * 0.4, 650, 1.45 * dmgBoost, { heavy: true });
      if (weaponLevel >= 3) shoot(0, -21, aimBase * 0.3, 690, 1.25 * dmgBoost, { heavy: true });
    } else {
      shoot(0, -19, aimBase, 590, 1.35 * dmgBoost, { heavy: true });
      shoot(-13, -10, aimBase - 0.14, 570, 1.05 * dmgBoost, { heavy: weaponLevel >= 3 });
      shoot(13, -10, aimBase + 0.14, 570, 1.05 * dmgBoost, { heavy: weaponLevel >= 3 });
      if (weaponLevel >= 2) {
        shoot(-18, -5, aimBase - 0.27, 540, 0.9 * dmgBoost);
        shoot(18, -5, aimBase + 0.27, 540, 0.9 * dmgBoost);
      }
      if (weaponLevel >= 4) {
        shoot(-7, -16, aimBase - 0.05, 620, 1.0 * dmgBoost);
        shoot(7, -16, aimBase + 0.05, 620, 1.0 * dmgBoost);
      }
    }
  } else if (selectedRig === 'falcon') {
    // High-cadence twin/quad needles + seeker missiles
    if (focused) {
      shoot(-5, -18, 0, 720, 0.95 * dmgBoost);
      shoot(5, -18, 0, 720, 0.95 * dmgBoost);
      if (weaponLevel >= 2) shoot(0, -22, 0, 750, 0.85 * dmgBoost);
      if (weaponLevel >= 4) {
        shoot(-11, -12, 0, 700, 0.75 * dmgBoost);
        shoot(11, -12, 0, 700, 0.75 * dmgBoost);
      }
    } else {
      shoot(-7, -16, aimBase - 0.04, 670, 0.85 * dmgBoost);
      shoot(7, -16, aimBase + 0.04, 670, 0.85 * dmgBoost);
      if (weaponLevel >= 2) {
        shoot(-15, -8, aimBase - 0.18, 630, 0.75 * dmgBoost);
        shoot(15, -8, aimBase + 0.18, 630, 0.75 * dmgBoost);
      }
      if (weaponLevel >= 4) {
        shoot(0, -21, aimBase, 690, 0.85 * dmgBoost);
      }
    }
  } else {
    // Kestrel balanced pulse + focused rail-lance
    if (focused) {
      shoot(-4.5, -19, 0, 740, 1.1 * dmgBoost);
      shoot(4.5, -19, 0, 740, 1.1 * dmgBoost);
      if (weaponLevel >= 3) {
        shoot(-11, -12, 0, 710, 0.85 * dmgBoost);
        shoot(11, -12, 0, 710, 0.85 * dmgBoost);
      }
    } else {
      if (weaponLevel === 1) {
        shoot(-6, -16, aimBase - 0.03, 620, 1.0 * dmgBoost);
        shoot(6, -16, aimBase + 0.03, 620, 1.0 * dmgBoost);
      } else {
        shoot(0, -19, aimBase, 640, 1.0 * dmgBoost);
        shoot(-12, -12, aimBase - 0.12, 610, 0.9 * dmgBoost);
        shoot(12, -12, aimBase + 0.12, 610, 0.9 * dmgBoost);
        if (weaponLevel >= 3) {
          shoot(-18, -6, aimBase - 0.24, 585, 0.85 * dmgBoost);
          shoot(18, -6, aimBase + 0.24, 585, 0.85 * dmgBoost);
        }
        if (weaponLevel >= 4) {
          shoot(-6, -17, aimBase - 0.04, 660, 0.85 * dmgBoost);
          shoot(6, -17, aimBase + 0.04, 660, 0.85 * dmgBoost);
        }
      }
    }
  }

  player.muzzle = 0.09;
  player.recoil = 2.6;
  sound.effect(focused ? 'focusFire' : 'fire');
  nextShot = rig.fireRate * (od ? 0.68 : 1);
}

function pointHitsBeam(px, py, bx, by, angle, halfWidth) {
  const dx = px - bx;
  const dy = py - by;
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  // Rotate point into beam-local coordinates (beam runs along +Y in rotated space)
  const localX = dx * cos + dy * sin;
  const localY = -dx * sin + dy * cos;
  return localY > 14 && localY < 780 && Math.abs(localX) < halfWidth;
}

function update(dt) {
  // Smooth score roll & camera trauma decay always advance
  displayScore += (score - displayScore) * (1 - Math.exp(-dt * 14));
  if (Math.abs(score - displayScore) < 0.6) displayScore = score;
  shake *= Math.exp(-dt * 12);

  if (hitstop > 0) {
    hitstop = Math.max(0, hitstop - dt);
    return;
  }

  time += dt;
  immune = Math.max(0, immune - dt);
  nextShot -= dt;
  missileTimer -= dt;
  player.dashCd = Math.max(0, player.dashCd - dt);
  player.muzzle = Math.max(0, player.muzzle - dt);
  player.recoil *= Math.exp(-dt * 26);

  if (overdriveTime > 0) {
    overdriveTime = Math.max(0, overdriveTime - dt);
  }
  if (comboTimer > 0) {
    comboTimer -= dt;
    if (comboTimer <= 0) combo = 0;
  }
  if (banner) {
    banner.life -= dt;
    if (banner.life <= 0) banner = null;
  }

  // Feed dynamic intensity to the music engine
  sound.setIntensity(clamp((getMultiplier() - 1) / 5 + (overdriveTime > 0 ? 0.45 : 0), 0, 1));

  // Steering / Phase Dash
  const rig = RIGS[selectedRig];
  const focused = preciseSteering();

  if (player.dashTime > 0) {
    player.dashTime = Math.max(0, player.dashTime - dt);
    player.vx = player.dashDx * rig.dashSpeed;
    player.vy = player.dashDy * rig.dashSpeed;
    player.x = clamp(player.x + player.vx * dt, 19, w - 19);
    player.y = clamp(player.y + player.vy * dt, 24, h - 24);
    player.ghosts.push({ x: player.x, y: player.y, bank: player.bank, life: 0.24 });
    if (player.ghosts.length > 6) player.ghosts.shift();
  } else {
    const dx =
      Number(keys.has('ArrowRight') || keys.has('KeyD')) -
      Number(keys.has('ArrowLeft') || keys.has('KeyA'));
    const dy =
      Number(keys.has('ArrowDown') || keys.has('KeyS')) - Number(keys.has('ArrowUp') || keys.has('KeyW'));
    const length = Math.hypot(dx, dy);
    const thrust = focused ? rig.focusSpeed : rig.speed;
    const offsetX = pointer ? pointer.goalX - player.x : 0;
    const offsetY = pointer ? pointer.goalY - player.y : 0;
    const follow = Math.min(19, 490 / (Math.hypot(offsetX, offsetY) || 1));
    const targetX = pointer ? offsetX * follow : (dx * thrust) / (length || 1);
    const targetY = pointer ? offsetY * follow : (dy * thrust) / (length || 1);

    function steer(position, velocity, target, min, max) {
      const v = player[velocity];
      const braking = Math.abs(target) < Math.abs(v) || target * v < 0;
      const rate = pointer ? 30 : braking ? 34 : 20;
      const blend = -Math.expm1(-dt * rate);
      player[position] = clamp(player[position] + target * dt + ((v - target) * blend) / rate, min, max);
      player[velocity] = v + (target - v) * blend;
    }
    steer('x', 'vx', targetX, 19, w - 19);
    steer('y', 'vy', targetY, 24, h - 24);
    if (player.x === 19 || player.x === w - 19) player.vx = 0;
    if (player.y === 24 || player.y === h - 24) player.vy = 0;
  }

  player.bank += (clamp(player.vx / rig.speed, -1, 1) * 0.36 - player.bank) * (1 - Math.exp(-dt * 12));
  distance +=
    dt *
    clamp(128 - player.vy * 0.16, 70, 210) *
    (overdriveTime > 0 ? 1.35 : 1) *
    (reducedMotion.matches ? 0.45 : 1);

  // Update wingtip contrails & ghosts
  for (let sideIdx = 0; sideIdx < 2; sideIdx++) {
    const sign = sideIdx === 0 ? -1 : 1;
    const trail = player.trails[sideIdx];
    trail.push({ x: player.x + sign * 14 * (1 - Math.abs(player.bank) * 0.3), y: player.y + 11 });
    if (trail.length > 10) trail.shift();
    for (const pt of trail) pt.y += dt * 150;
  }
  for (const g of player.ghosts) g.life -= dt;
  player.ghosts = player.ghosts.filter((g) => g.life > 0);

  // Firing logic
  const isFiring = keys.has('Space') || Boolean(pointer) || autoFire;
  if (isFiring && nextShot <= 0) {
    firePlayerWeapons(focused);
  }

  // Falcon (or MK III+ Kestrel/Aegis in Overdrive) homing micro-missiles
  const hasMissiles = selectedRig === 'falcon' || (weaponLevel >= 3 && overdriveTime > 0);
  if (isFiring && hasMissiles && missileTimer <= 0 && enemies.length > 0) {
    const interval = selectedRig === 'falcon' ? (weaponLevel >= 3 ? 0.42 : 0.62) : 0.7;
    for (const side of [-1, 1]) {
      shots.push({
        x: player.x + side * 14,
        y: player.y + 2,
        r: 4.5,
        vx: side * 130,
        vy: -180,
        dmg: selectedRig === 'falcon' ? 1.5 : 1.15,
        hostile: false,
        homing: true,
        age: 0,
      });
    }
    sound.effect('missile');
    missileTimer = interval * (overdriveTime > 0 ? 0.72 : 1);
  }

  // Smart Wave Director (zero dead air!)
  if (!boss) {
    spawnIn -= dt;
    const activeHostiles = enemies.filter((e) => e.kind !== 'rock' && !e.dead).length;
    if (activeHostiles === 0 && spawnIn > 0.55) {
      spawnIn = 0.55;
    }
    if (spawnIn <= 0) {
      const wave = Math.floor(spawnCount / 6) + 1;
      const beat = spawnCount % 6;
      hud.style.setProperty('--wave-progress', ((beat + 1) / 6) * 100 + '%');
      if (beat === 0) {
        currentWave = wave;
        waveLabel.textContent = String(wave).padStart(2, '0');
        sound.setWave(wave);
        if (wave > 1) {
          const opName = waveNames[(wave - 1) % waveNames.length];
          showBanner(`SECTOR 0${((Math.floor((wave - 1) / 2)) % 4) + 1} // ${getSectorName(wave)}`, `WAVE ${String(wave).padStart(2, '0')} — ${opName}`, 'teal', 2.2);
        }
      }
      const first = enemies.length;
      spawnFormation(enemies, w, wave, beat, player.x);
      for (const enemy of enemies.slice(first)) {
        if (enemy.kind === 'rock') enemy.shape = outlineRock();
      }
      spawnCount++;
      const cadence = 1 + 0.19 * Math.log2(wave);
      spawnIn += (beat === 5 ? waveLength / 6 + 1.1 : waveLength / 6 - 0.25) / cadence;
    }
  }

  // Update enemies & boss chain death
  for (const enemy of enemies) {
    if (enemy === boss) {
      if (boss.dying > 0) {
        boss.dying -= dt;
        boss.deathTick -= dt;
        if (boss.deathTick <= 0) {
          boss.deathTick = 0.14;
          const ox = between(-boss.r, boss.r);
          const oy = between(-boss.r * 0.8, boss.r * 0.8);
          burst({ x: boss.x + ox, y: boss.y + oy, r: 18 }, '#ffbe78', false);
          addShake(7);
          sound.effect('ship');
        }
        if (boss.dying <= 0) {
          finishBossCollapse(boss);
          continue;
        }
      }
      flyBoss(enemy, dt, w, h, player, shots, sound, enemies);
    } else if (enemy.escort) {
      flyEscort(enemy, dt, w, h, player, shots, sound);
    } else {
      flyEnemy(enemy, dt, w, h, player, shots, sound, enemies);
    }

    // Emit damage smoke on wounded heavy craft / boss
    if (
      !enemy.dead &&
      enemy.maxHp >= 4 &&
      enemy.hp < enemy.maxHp * 0.55 &&
      Math.random() < dt * 12
    ) {
      smoke.push({
        x: enemy.x + between(-enemy.r * 0.45, enemy.r * 0.45),
        y: enemy.y + between(-enemy.r * 0.3, enemy.r * 0.3),
        vx: between(-18, 18),
        vy: between(-15, 25),
        r: between(3, 7),
        color: '#6b7585',
        life: 0.48,
        maxLife: 0.48,
      });
    }

    // Active thermal beam collision check (Prism & Vesper)
    if (!enemy.dead && enemy.beamActive > 0) {
      const halfWidth = enemy === boss ? 14 : 10;
      if (pointHitsBeam(player.x, player.y, enemy.x, enemy.y, enemy.beamAngle || 0, halfWidth + player.r)) {
        hitPlayer();
        if (lives <= 0) return;
      }
    }
  }

  // Update projectiles
  for (const s of shots) {
    if (s.dead) continue;
    if (s.homing) {
      s.age += dt;
      // Pick closest live enemy or boss part
      let target = null;
      let bestDist = Infinity;
      for (const e of enemies) {
        if (e.dead || (e === boss && (e.entering > 0 || e.dying > 0))) continue;
        if (e === boss) {
          for (const part of aliveBossParts(e)) {
            const d = Math.hypot(part.x - s.x, part.y - s.y);
            if (d < bestDist) {
              bestDist = d;
              target = part;
            }
          }
        }
        const d = Math.hypot(e.x - s.x, e.y - s.y);
        if (d < bestDist) {
          bestDist = d;
          target = e;
        }
      }
      if (target) {
        const desiredA = Math.atan2(target.x - s.x, target.y - s.y);
        const curSpeed = Math.min(540, Math.hypot(s.vx, s.vy) + 420 * dt);
        const curA = Math.atan2(s.vx, s.vy);
        let diff = desiredA - curA;
        while (diff > Math.PI) diff -= TAU;
        while (diff < -Math.PI) diff += TAU;
        const turn = clamp(diff, -dt * 7.5, dt * 7.5);
        const nextA = curA + turn;
        s.vx = Math.sin(nextA) * curSpeed;
        s.vy = Math.cos(nextA) * curSpeed;
      } else {
        s.vy -= 420 * dt;
      }
      if (Math.random() < dt * 26) {
        smoke.push({
          x: s.x,
          y: s.y,
          vx: between(-10, 10),
          vy: between(10, 35),
          r: 2.8,
          color: '#ffdcb0',
          life: 0.25,
          maxLife: 0.25,
        });
      }
    }

    s.x += s.vx * dt;
    s.y += s.vy * dt;

    if (s.hostile) {
      if (collides(s, player)) {
        if (player.dashTime <= 0) {
          s.dead = true;
          hitPlayer();
          if (lives <= 0) return;
        }
      } else if (!s.grazed && (immune <= 0 || player.dashTime > 0)) {
        const dx = s.x - player.x;
        const dy = s.y - player.y;
        const grazeR = player.dashTime > 0 ? 34 : 25;
        if (dx * dx + dy * dy < grazeR * grazeR) {
          s.grazed = true;
          grazes++;
          novaCharge = Math.min(100, novaCharge + 3.2);
          bumpCombo(1);
          addScore(15, player.x, player.y - 12, false);
          impacts.push({ x: player.x, y: player.y, radius: 10, color: '#9df4df', life: 0.3, maxLife: 0.3 });
          sound.effect('graze', Math.min(8, combo / 3));
        }
      }
    } else {
      // Check boss subsystems first so wing turrets / shield pylons intercept cleanly
      let hitSomething = false;
      if (boss && !boss.dead && boss.entering <= 0 && boss.dying <= 0) {
        for (const part of aliveBossParts(boss)) {
          if (collides(s, part)) {
            s.dead = true;
            damageBossPart(boss, part, s.dmg || 1);
            hitSomething = true;
            break;
          }
        }
        if (!hitSomething && collides(s, boss)) {
          s.dead = true;
          damageBossCore(boss, s.dmg || 1);
          hitSomething = true;
        }
      }
      if (hitSomething) continue;

      const e = enemies.find((cand) => cand !== boss && !cand.dead && collides(s, cand));
      if (e) {
        s.dead = true;
        e.hp = Math.max(0, e.hp - (s.dmg || 1));
        e.flash = 0.13;
        if (e.hp > 0) {
          sound.effect('impact');
          sparks.push({
            x: s.x,
            y: s.y,
            vx: between(-90, 90),
            vy: between(20, 100),
            life: 0.16,
            color: '#fff2cf',
          });
        } else {
          killEnemy(e);
        }
      }
    }
  }

  // Enemy hull collision with player
  for (const e of enemies) {
    if (e.dead || (e === boss && (e.entering > 0 || e.dying > 0))) continue;
    if (collides(player, e) && player.dashTime <= 0) {
      if (e !== boss) {
        e.hp = 0;
        killEnemy(e);
      }
      hitPlayer();
      if (lives <= 0) return;
    }
  }

  // Salvage & Pickup physics + smart magnet vacuum
  const magnetRadius =
    overdriveTime > 0 ? 520 : player.dashTime > 0 ? 280 : !isFiring ? 220 : 115;
  for (const p of pickups) {
    p.age += dt;
    const dx = player.x - p.x;
    const dy = player.y - p.y;
    const dist = Math.hypot(dx, dy);

    if (p.kind === 'shard' && (p.magnet || dist < magnetRadius)) {
      p.magnet = true;
      const pull = Math.min(720, 320 + p.age * 420);
      p.vx += ((dx / (dist || 1)) * pull - p.vx) * (1 - Math.exp(-dt * 12));
      p.vy += ((dy / (dist || 1)) * pull - p.vy) * (1 - Math.exp(-dt * 12));
    } else {
      p.vx *= Math.exp(-dt * 2.5);
      p.vy += (92 - p.vy) * (1 - Math.exp(-dt * 2.2));
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    if (dist < p.r + 18) {
      p.dead = true;
      if (p.kind === 'shard') {
        bumpCombo(1);
        novaCharge = Math.min(100, novaCharge + (p.nova ? 3.0 : 2.2));
        addScore(p.nova ? 20 : 12);
        sound.effect('shard', Math.min(10, Math.floor(combo / 2)));
      } else if (p.kind === 'weapon') {
        if (weaponLevel < 4) {
          weaponLevel++;
          popups.push({
            x: player.x,
            y: player.y - 24,
            text: `WEAPON MK ${['I', 'II', 'III', 'IV'][weaponLevel - 1]}`,
            color: PALETTE.teal,
            life: 1.0,
            maxLife: 1.0,
            size: 14,
          });
        } else {
          addScore(350, player.x, player.y - 22, true, PALETTE.gold);
          novaCharge = Math.min(100, novaCharge + 30);
        }
        sound.effect('upgrade');
      } else if (p.kind === 'shield') {
        if (lives < maxLives) {
          lives++;
          popups.push({
            x: player.x,
            y: player.y - 24,
            text: '+SHIELD',
            color: '#99dcff',
            life: 1.0,
            maxLife: 1.0,
            size: 14,
          });
        } else {
          addScore(300, player.x, player.y - 22, true, '#99dcff');
        }
        sound.effect('upgrade');
      } else if (p.kind === 'nova') {
        novaCharge = Math.min(100, novaCharge + 45);
        popups.push({
          x: player.x,
          y: player.y - 24,
          text: '+45% NOVA',
          color: PALETTE.gold,
          life: 1.0,
          maxLife: 1.0,
          size: 14,
        });
        sound.effect('upgrade');
      }
    }
  }

  // Trigger flagship encounter at threshold
  if (!boss && score >= bossScoreThreshold) {
    beginBoss();
  }

  // Cleanup arrays
  enemies = enemies.filter((e) => !e.dead && e.y < h + e.r + 40 && e.x > -120 && e.x < w + 120);
  shots = shots.filter((s) => !s.dead && s.y > -40 && s.y < h + 40 && s.x > -40 && s.x < w + 40);
  pickups = pickups.filter((p) => !p.dead && p.y < h + 30);

  for (const p of sparks) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= Math.exp(-dt * 3.5);
    p.vy *= Math.exp(-dt * 3.5);
    p.life -= dt;
  }
  for (const d of debris) {
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.angle += d.spin * dt;
    d.vx *= Math.exp(-dt * 1.4);
    d.vy *= Math.exp(-dt * 1.4);
    d.life -= dt;
  }
  for (const puff of smoke) {
    puff.x += puff.vx * dt;
    puff.y += puff.vy * dt;
    puff.life -= dt;
  }
  for (const ring of impacts) ring.life -= dt;
  for (const sw of shockwaves) sw.life -= dt;
  for (const pop of popups) pop.life -= dt;

  sparks = sparks.filter((p) => p.life > 0);
  debris = debris.filter((d) => d.life > 0);
  smoke = smoke.filter((p) => p.life > 0);
  impacts = impacts.filter((ring) => ring.life > 0);
  shockwaves = shockwaves.filter((sw) => sw.life > 0);
  popups = popups.filter((pop) => pop.life > 0);

  updateHud();
}

function tick(now) {
  if (document.hidden || (mode !== 'playing' && mode !== 'intro')) return;
  const dt = lastTime ? Math.min(0.04, (now - lastTime) / 1000) : 0;
  lastTime = now;
  if (mode === 'intro') introTime += dt;
  else update(dt);
  draw();
  if (mode === 'playing' || (mode === 'intro' && !reducedMotion.matches)) {
    frame = requestAnimationFrame(tick);
  }
}

// --- CONTROLS & UI EVENTS ---

function syncRigButtons() {
  for (const btn of document.querySelectorAll('.rig-option')) {
    btn.setAttribute('aria-pressed', String(btn.dataset.rig === selectedRig));
  }
}
syncRigButtons();

// Render crisp ship illustrations inside each ship picker button
for (const thumb of document.querySelectorAll('.rig-preview')) {
  const c = thumb.getContext('2d');
  const rigKey = thumb.dataset.ship;
  const rig = RIGS[rigKey] || RIGS.kestrel;
  c.save();
  c.translate(56, 56);
  const glow = c.createRadialGradient(0, 6, 4, 0, 6, 44);
  glow.addColorStop(0, rig.accent + '36');
  glow.addColorStop(1, rig.accent + '00');
  c.fillStyle = glow;
  c.beginPath();
  c.arc(0, 6, 44, 0, TAU);
  c.fill();
  c.scale(0.84, 0.84);
  drawInterceptor(c, rigKey);
  c.restore();
}

for (const btn of document.querySelectorAll('.rig-option')) {
  btn.addEventListener('click', () => {
    selectedRig = btn.dataset.rig;
    try {
      localStorage.setItem('low-orbit-rig', selectedRig);
    } catch {}
    syncRigButtons();
    draw();
  });
}

action.addEventListener('click', () => {
  if (mode === 'paused') setMode('playing');
  else launch();
});
restartMenu.addEventListener('click', () => setMode('intro'));
pauseButton.addEventListener('click', () => setMode('paused'));
autofireBtn.addEventListener('click', () => {
  autoFire = !autoFire;
  updateHud();
  canvas.focus({ preventScroll: true });
});
touchDash.addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  triggerPhaseDash();
});
touchNova.addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  triggerNovaPulse();
});

const controls = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'Space',
  'ShiftLeft',
  'ShiftRight',
]);

window.addEventListener('keydown', (e) => {
  if (manual.open) return;
  if (e.target.closest?.('input, summary, button, a') && !['Escape', 'KeyP'].includes(e.code)) return;

  if ((e.code === 'KeyP' || e.code === 'Escape') && (mode === 'playing' || mode === 'paused')) {
    e.preventDefault();
    if (!e.repeat) setMode(mode === 'playing' ? 'paused' : 'playing');
    return;
  }
  if (mode !== 'playing') return;

  if (controls.has(e.code)) {
    e.preventDefault();
    keys.add(e.code);
  } else if (!e.repeat && (e.code === 'KeyC' || e.code === 'KeyK')) {
    e.preventDefault();
    triggerPhaseDash();
  } else if (!e.repeat && (e.code === 'KeyE' || e.code === 'KeyX' || e.code === 'KeyQ')) {
    e.preventDefault();
    triggerNovaPulse();
  } else if (!e.repeat && e.code === 'KeyF') {
    e.preventDefault();
    autoFire = !autoFire;
    updateHud();
  }
});
window.addEventListener('keyup', (e) => keys.delete(e.code));

mixer.addEventListener('toggle', () => {
  if (!mixer.open && mode === 'playing' && mixer.contains(document.activeElement)) {
    canvas.focus({ preventScroll: true });
  }
});

canvas.addEventListener('contextmenu', (e) => {
  if (mode === 'playing') {
    e.preventDefault();
    triggerPhaseDash();
  }
});

canvas.addEventListener('pointerdown', (e) => {
  if (mode !== 'playing') return;
  if (e.button === 2) {
    e.preventDefault();
    triggerPhaseDash();
    return;
  }
  if (pointer || e.button !== 0) return;
  canvas.setPointerCapture(e.pointerId);
  pointer = { id: e.pointerId, x: e.clientX, y: e.clientY, goalX: player.x, goalY: player.y };
});
canvas.addEventListener('pointermove', (e) => {
  if (mode === 'intro') {
    const bounds = canvas.getBoundingClientRect();
    if (bounds.width && bounds.height) {
      introCursorX = clamp((e.clientX - bounds.left) / bounds.width, 0, 1);
      introCursorY = clamp((e.clientY - bounds.top) / bounds.height, 0, 1);
      if (reducedMotion.matches) draw();
    }
    return;
  }
  if (!pointer || pointer.id !== e.pointerId) return;
  const bounds = canvas.getBoundingClientRect();
  pointer.goalX = clamp(pointer.goalX + ((e.clientX - pointer.x) * w) / bounds.width, 19, w - 19);
  pointer.goalY = clamp(pointer.goalY + ((e.clientY - pointer.y) * h) / bounds.height, 24, h - 24);
  pointer.x = e.clientX;
  pointer.y = e.clientY;
});
canvas.addEventListener('lostpointercapture', (e) => {
  if (pointer?.id === e.pointerId) pointer = null;
});

function autoPause() {
  if (mode === 'playing') setMode('paused');
  else if (mode === 'over') sound.stop();
}
window.addEventListener('blur', autoPause);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) autoPause();
  if (mode === 'intro') startIntro();
});
window.addEventListener('pagehide', autoPause);
new ResizeObserver(resize).observe(canvas);

function startIntro() {
  cancelAnimationFrame(frame);
  lastTime = 0;
  if (!document.hidden && !reducedMotion.matches) frame = requestAnimationFrame(tick);
}
reducedMotion.addEventListener('change', () => {
  if (mode === 'intro') startIntro();
});

connectFlightPassage(document.querySelector('.back'));

// --- FIELD GUIDE DIALOG (with closedby + top-layer exit fallbacks) ---
const manual = document.querySelector('#manual');
let supportsDisplayTransition;
function canTransitionDisplay() {
  if (supportsDisplayTransition !== undefined) return supportsDisplayTransition;
  if (!window.CSS?.supports?.('transition-behavior', 'allow-discrete') || !document.body) {
    return false;
  }
  const probe = document.createElement('div');
  probe.style.cssText = 'transition: display 1s allow-discrete !important; display: block;';
  document.body.appendChild(probe);
  getComputedStyle(probe).display;
  probe.style.display = 'none';
  supportsDisplayTransition = getComputedStyle(probe).display === 'block';
  probe.remove();
  return supportsDisplayTransition;
}
function supportsTopLayerExit() {
  return Boolean(window.CSS?.supports?.('overlay', 'auto') && canTransitionDisplay());
}
async function closeTopLayer(element) {
  if (!supportsTopLayerExit()) {
    element.setAttribute('data-closing', '');
    const animations = element.getAnimations({ subtree: true });
    if (animations.length > 0) {
      await Promise.race([
        Promise.allSettled(animations.map((a) => a.finished)),
        new Promise((r) => setTimeout(r, 1000)),
      ]);
    }
    if (!element.hasAttribute('data-closing')) return;
    element.removeAttribute('data-closing');
  }
  element.close();
}

document.querySelector('#guide-open').addEventListener('click', () => manual.showModal());
manual.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeTopLayer(manual);
});
manual.querySelector('form').addEventListener('submit', (event) => {
  if (!supportsTopLayerExit()) {
    event.preventDefault();
    closeTopLayer(manual);
  }
});
// Fallback for browsers without <dialog closedby="any"> support (Safari)
if (!('closedBy' in HTMLDialogElement.prototype)) {
  manual.addEventListener('click', (event) => {
    if (event.target !== manual) return;
    const rect = manual.getBoundingClientRect();
    const isContent =
      rect.top <= event.clientY &&
      event.clientY <= rect.top + rect.height &&
      rect.left <= event.clientX &&
      event.clientX <= rect.left + rect.width;
    if (!isContent) closeTopLayer(manual);
  });
}

for (const preview of manual.querySelectorAll('[data-craft]')) {
  drawFoe(preview.getContext('2d'), { kind: preview.dataset.craft, x: 44, y: 44, r: 30, fireIn: 2, age: 0 });
}

// Instant launch into live orbital canvas — zero artificial delay!
loadPlanets(true, draw);
resize();
startIntro();
