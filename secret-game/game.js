import { connectFlightPassage } from '../assets/sky/flight-passage.js';
import {
  PALETTE,
  drawSpaceBackdrop,
  drawPlanets,
  loadPlanets,
  getSector,
  getSectorName,
  outlineRock,
  drawRock,
  drawFoe,
  drawMine,
  drawPickup,
  drawInterceptor,
  drawBankedShip,
} from './art.js';
import { createEnemy, spawnFormation, flyEnemy, waveLength, waveNames } from './encounters.js';
import {
  advanceArmor,
  aliveBossParts,
  hasActivePylons,
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
    hull: 3,
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
    hull: 3,
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
    hull: 4,
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

// Persistent Coin Bank & Per-Ship Upgrades!
const UPGRADE_DEFS = [
  {
    id: 'weapon',
    name: 'Starting Firepower',
    desc: 'Start runs at MK II → MK VI (unlocks homing seekers at MK IV, piercing bolts at MK V, twin rails at MK VI).',
    costs: [75, 160, 300, 480, 720],
  },
  {
    id: 'hull',
    name: 'Reinforced Hull',
    desc: '+1 permanent red Hull armor block per level for this ship.',
    costs: [70, 150, 280],
  },
  {
    id: 'shield',
    name: 'Shield Capacitors',
    desc: '+1 rechargeable Shield block per level for this ship.',
    costs: [60, 140, 260],
  },
  {
    id: 'thruster',
    name: 'Thruster & Dash',
    desc: '+9% speed and -14% Phase Dash cooldown per level.',
    costs: [50, 120, 230],
  },
  {
    id: 'nova',
    name: 'Nova & Magnet Core',
    desc: '+20% starting Nova charge and +35% wider loot magnet per level.',
    costs: [55, 130, 240],
  },
];

const emptyShipUpgrades = () => ({ weapon: 0, hull: 0, shield: 0, thruster: 0, nova: 0 });
let meta = {
  coins: 0,
  ships: {
    kestrel: emptyShipUpgrades(),
    falcon: emptyShipUpgrades(),
    aegis: emptyShipUpgrades(),
  },
};
try {
  const raw = JSON.parse(localStorage.getItem('low-orbit-meta') || 'null');
  if (raw && typeof raw === 'object') {
    meta.coins = Math.max(0, Math.floor(Number(raw.coins) || 0));
    if (raw.ships && typeof raw.ships === 'object') {
      for (const shipKey of Object.keys(RIGS)) {
        for (const def of UPGRADE_DEFS) {
          meta.ships[shipKey][def.id] = Math.max(
            0,
            Math.min(def.costs.length, Math.floor(Number(raw.ships?.[shipKey]?.[def.id]) || 0)),
          );
        }
      }
    } else if (raw.upgrades && typeof raw.upgrades === 'object') {
      // Cleanly migrate legacy global upgrades to Kestrel so returning players lose nothing!
      for (const def of UPGRADE_DEFS) {
        meta.ships.kestrel[def.id] = Math.max(
          0,
          Math.min(def.costs.length, Math.floor(Number(raw.upgrades[def.id]) || 0)),
        );
      }
    }
  }
} catch {}

function saveMeta() {
  try {
    localStorage.setItem('low-orbit-meta', JSON.stringify(meta));
  } catch {}
}

function getEffectiveRig(key = selectedRig) {
  const base = RIGS[key] || RIGS.kestrel;
  const u = meta.ships[key] || emptyShipUpgrades();
  return {
    ...base,
    hull: base.hull + u.hull,
    shields: base.shields + u.shield,
    speed: Math.round(base.speed * (1 + u.thruster * 0.09)),
    focusSpeed: Math.round(base.focusSpeed * (1 + u.thruster * 0.06)),
    dashCd: +(base.dashCd * Math.pow(0.86, u.thruster)).toFixed(2),
    startWeapon: 1 + u.weapon,
    startNova: Math.min(100, 25 + u.nova * 20),
    magnetScale: 1 + u.nova * 0.35,
  };
}

let selectedRig = 'kestrel';
let hangarRig = 'kestrel';
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
const hangarOpenBtn = document.querySelector('#hangar-open');
const upgradeDot = document.querySelector('#upgrade-dot');
const coinBankBtn = document.querySelector('#coin-bank-btn');
const coinBankEl = document.querySelector('#coin-bank');
const runCoinsHud = document.querySelector('#run-coins-hud');
const restartMenu = document.querySelector('#restart-menu');
const hud = document.querySelector('#hud');
const scoreLabel = document.querySelector('#score');
const bestLabel = document.querySelector('#best');
const vitalsEl = document.querySelector('#vitals');
const shieldHud = document.querySelector('#shield-hud');
const overshieldBadge = document.querySelector('#overshield-badge');
const overshieldTimeEl = document.querySelector('#overshield-time');
const hullCountEl = document.querySelector('#hull-count');
const shieldCount = document.querySelector('#shield-count');
const comboHud = document.querySelector('#combo-hud');
const comboMultEl = document.querySelector('#combo-mult');
const bossHud = document.querySelector('#boss-hud');
const bossArmor = document.querySelector('#boss-armor');
const bossPartsEl = document.querySelector('#boss-parts');
const weaponTierEl = document.querySelector('#weapon-tier');
const fireModeEl = document.querySelector('#fire-mode');
const focusChip = document.querySelector('#focus-chip');
const autofireBtn = document.querySelector('#autofire');
const novaBlock = document.querySelector('#nova-block');
const novaLabel = document.querySelector('#nova-label');
const novaPct = document.querySelector('#nova-pct');
const novaFill = document.querySelector('#nova-fill');
const dashPip = document.querySelector('#dash-pip');
const novaHint = document.querySelector('#nova-hint');
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
let runSeed = 1;
let nextBossAtSpawn = 12; // 2 full waves per sector before each flagship!
let sectorIndex = 0;
let warp = null; // { phase: 'collect'|'depart'|'tunnel'|'arrive', t, nextSector, switched }
let hitFlash = 0;
let mode = 'intro';
let kills = 0;
let grazes = 0;
let score = 0;
let displayScore = 0;
let hull = 3;
let maxHull = 3;
let shields = 3;
let maxShields = 3;
let best = 0;
let weaponLevel = 1;
let autoFire = false;
let combo = 0;
let comboTimer = 0;
let peakMultiplier = 1;
let novaCharge = 0;
let overdriveTime = 0;
let overshieldTime = 0;
let runCoins = 0;
let missileTimer = 0;

let distance = 0;
let introTime = 0;
let introCursorX = 0.5;
let introCursorY = 0.5;
let introShip = { x: 0, y: 0, vx: 0, vy: 0, heading: 0.72, roll: 0, trails: [[], []], ready: false };
let playerDying = 0;
let deathTick = 0;
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
  draw();
}

function paintShip(x, y, width, angle = 0, thrust = 1, variant = selectedRig, opts = {}) {
  const rig = RIGS[variant] || RIGS.kestrel;
  const roll = opts.roll || 0;
  ctx.save();
  ctx.translate(x, y + (opts.recoil || 0));
  if (angle) ctx.rotate(angle);

  const height = width;

  // Thruster plume (tracks slight horizontal roll shift cleanly behind the tail)
  const tail = height * 0.42;
  const boost = opts.dashing ? 2.1 : opts.overdrive ? 1.45 : 1;
  const plume =
    height * (0.22 + 0.25 * thrust) * boost * (1 + 0.1 * Math.sin((introTime + time) * 34));
  const sway = mode === 'intro' ? 0 : -roll * width * 0.14;
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
  if (opts.pitch) ctx.scale(1, 1 - Math.abs(opts.pitch) * 0.12);

  // Full 2.5D longitudinal roll on both Start screen hero & active flight!
  drawBankedShip(ctx, variant, roll, opts.tier || 1, rig.accent);

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

function getWarpIntensity() {
  if (!warp) return 0;
  if (warp.phase === 'depart') return Math.min(0.65, warp.t * 0.7);
  if (warp.phase === 'tunnel') return 1;
  if (warp.phase === 'arrive') return Math.max(0, 1 - warp.t / 0.85);
  return 0;
}

function draw() {
  if (!w || !h) return;
  const intro = mode === 'intro';
  const travel = intro ? introTime * 14 : distance;
  const pan = intro
    ? Math.sin(introTime * 0.14) * 0.12 + (introCursorX - 0.5) * 0.26
    : player.x / w - 0.5;
  const warpFactor = getWarpIntensity();
  const sector = getSector(intro ? 0 : sectorIndex);

  ctx.save();
  if (shake > 0.2 && mode === 'playing') {
    const sx = (Math.random() - 0.5) * 2 * shake;
    const sy = (Math.random() - 0.5) * 2 * shake;
    ctx.translate(sx, sy);
  }

  // Seamless, razor-sharp multi-sector orbital backdrop (zero low-res seams)
  drawSpaceBackdrop(ctx, w, h, travel, pan, intro ? 0 : sectorIndex, warpFactor);

  // Deep parallax starfield + dramatic lightspeed hyper-streaks during sector warp
  const speedStreak =
    warpFactor > 0
      ? 2.5 + warpFactor * 68
      : overdriveTime > 0
        ? 4.4
        : player.dashTime > 0
          ? 5.2
          : 2.5;
  for (const star of stars) {
    const z = star.z;
    const x = (((star.x * w - pan * z * 34) % w) + w) % w;
    const y = (star.y * h + travel * z * z) % h;
    ctx.fillStyle = warpFactor > 0.35 && z > 0.55 ? sector.warpColor : star.warm ? sector.starAccent : sector.starTint;
    ctx.globalAlpha = Math.min(1, 0.2 + z * (0.56 + warpFactor * 0.35));
    const len = 0.7 + z * (intro ? 1.1 : speedStreak);
    const thick = warpFactor > 0.25 ? 0.8 + z * 1.4 : 0.45 + z * 0.95;
    ctx.fillRect(x, y - len * warpFactor * 0.5, thick, len);
  }

  // Radial lightspeed tunnel lines & transition flash during hyperspace jump
  if (warpFactor > 0.05) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const cx = w * 0.5;
    const cy = h * 0.36;
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * TAU + (travel * 0.00025);
      const phase = ((i * 0.37 + travel * 0.0024) % 1);
      const r0 = 28 + phase * Math.max(w, h) * 0.35;
      const r1 = r0 + (70 + phase * 190) * warpFactor;
      ctx.strokeStyle = i % 3 === 0 ? '#ffffff' : sector.warpColor;
      ctx.globalAlpha = warpFactor * (0.18 + phase * 0.42);
      ctx.lineWidth = 1 + phase * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.stroke();
    }
    if (warp && warp.phase === 'tunnel') {
      const flash = Math.sin(Math.min(1, warp.t / 1.35) * Math.PI);
      ctx.fillStyle = sector.warpColor;
      ctx.globalAlpha = Math.pow(flash, 3) * 0.34;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  }

  ctx.globalAlpha = Math.max(0, 1 - warpFactor * 1.35);
  if (ctx.globalAlpha > 0.01) drawPlanets(ctx, w, h, distance, pan, intro, intro ? 0 : sectorIndex);
  ctx.globalAlpha = 1;

  // Subtle distant orbital debris belt
  const beltPhase = (travel / (h * 7) + 0.25) % 1;
  ctx.save();
  ctx.globalAlpha = 0.2 * Math.max(0, 1 - warpFactor);
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
  ctx.strokeStyle = overdriveTime > 0 ? '#ffd7a1' : sector.warpColor;
  for (const mote of motes) {
    const depth = 1.65 - ((mote.z + travel / (h * 2.6)) % 1.5);
    const dx = (mote.x - 0.5) * w;
    const dy = (mote.y - 0.39) * h;
    const cx = w * 0.5 - pan * 19;
    const cy = h * 0.3;
    ctx.globalAlpha = Math.max(0, (1 - depth / 1.65) * (0.34 + warpFactor * 0.3));
    ctx.lineWidth = (0.55 + warpFactor * 0.9) / depth;
    ctx.beginPath();
    ctx.moveTo(cx + dx / (depth + 0.017 + warpFactor * 0.06), cy + dy / (depth + 0.017 + warpFactor * 0.06));
    ctx.lineTo(cx + dx / depth, cy + dy / depth);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Selected ship actively patrols and flies across the Main Menu space behind the centered UI!
  if (intro) {
    if (!introShip.ready && w && h) {
      introShip.x = w * 0.72;
      introShip.y = h * 0.28;
      introShip.ready = true;
    }
    const rig = RIGS[selectedRig];
    const size = Math.min(w * (w < h ? 0.14 : 0.085), h * 0.125, 84);

    // Sweeping wingtip contrails trailing behind the patrolling ship
    for (const trail of introShip.trails) {
      if (trail.length < 2) continue;
      for (let i = 1; i < trail.length; i++) {
        const a = i / trail.length;
        ctx.strokeStyle = rig.accent;
        ctx.globalAlpha = a * 0.34;
        ctx.lineWidth = 1 + a * 2.4;
        ctx.beginPath();
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
        ctx.lineTo(trail[i].x, trail[i].y);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    paintShip(introShip.x, introShip.y, size, introShip.heading, 1.35, selectedRig, {
      tier: getEffectiveRig().startWeapon,
      roll: introShip.roll,
    });
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

    if (s.pierce > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255, 212, 112, 0.42)';
      ctx.fillRect(-5, -13, 10, 26);
      ctx.fillStyle = '#ffcb6b';
      ctx.fillRect(-2.4, -11, 4.8, 22);
      ctx.fillStyle = '#fffdf2';
      ctx.fillRect(-1.1, -9, 2.2, 14);
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

  // Player ship — hidden during warp tunnel or after exploding in death sequence
  const hideForTunnel = warp && warp.phase === 'tunnel';
  if (hull > 0 && !hideForTunnel && playerDying <= 0) {
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
    ctx.globalAlpha = immune > 0 && player.dashTime <= 0 && !warp ? (Math.sin(time * 20) > 0 ? 0.55 : 0.88) : 1;
    paintShip(
      player.x,
      player.y,
      34,
      0,
      warp && warp.phase === 'depart' ? 2.4 : clamp(0.78 - player.vy / 360, 0.28, 1.7),
      selectedRig,
      {
        dashing: player.dashTime > 0 || (warp && warp.phase === 'depart'),
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
      const frac = 1 - player.dashCd / getEffectiveRig().dashCd;
      ctx.strokeStyle = 'rgba(121, 227, 213, 0.48)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 24, Math.PI * 0.72, Math.PI * 0.72 + frac * Math.PI * 1.56);
      ctx.stroke();
    }

    // Indestructible Overshield hexagonal golden-prismatic barrier
    if (overshieldTime > 0) {
      const warnBlink = overshieldTime < 1.5 ? 0.55 + 0.45 * Math.sin(time * 24) : 1;
      const frac = clamp(overshieldTime / 6.5, 0, 1);
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.globalAlpha = warnBlink;

      ctx.globalCompositeOperation = 'lighter';
      const field = ctx.createRadialGradient(0, 0, 10, 0, 0, 32);
      field.addColorStop(0, 'rgba(255, 226, 128, 0.08)');
      field.addColorStop(0.75, 'rgba(255, 212, 102, 0.24)');
      field.addColorStop(1, 'rgba(182, 134, 255, 0)');
      ctx.fillStyle = field;
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      // Rotating hexagonal forcefield
      ctx.save();
      ctx.rotate(time * 1.8);
      ctx.strokeStyle = '#ffe58f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * TAU) / 6;
        const rx = Math.cos(a) * 26;
        const ry = Math.sin(a) * 26;
        if (i === 0) ctx.moveTo(rx, ry);
        else ctx.lineTo(rx, ry);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // Remaining duration outer progress ring
      ctx.strokeStyle = '#c89eff';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, 30, -Math.PI / 2, -Math.PI / 2 + frac * TAU);
      ctx.stroke();
      ctx.restore();
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

  // Visceral peripheral damage vignette when player takes a hit
  if (hitFlash > 0 && mode === 'playing') {
    const alpha = Math.min(0.55, hitFlash * 0.95);
    const vig = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.28, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
    vig.addColorStop(0, 'rgba(250, 90, 62, 0)');
    vig.addColorStop(1, `rgba(250, 82, 58, ${alpha})`);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
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

function dropCoins(x, y, count) {
  for (let i = 0; i < count; i++) {
    const a = between(0, TAU);
    const spd = between(35, 115);
    pickups.push({
      kind: 'coin',
      x,
      y,
      vx: Math.cos(a) * spd,
      vy: Math.sin(a) * spd - 24,
      r: 5.5,
      age: 0,
      seed: Math.random() * TAU,
      magnet: false,
    });
  }
}

function dropTacticalCell(x, y, forcedKind = null) {
  let kind = forcedKind;
  if (!kind) {
    const roll = Math.random();
    if (roll < 0.25) kind = 'overshield';
    else if (weaponLevel < 7) kind = 'weapon';
    else if (shields < maxShields) kind = 'shield';
    else kind = roll < 0.65 ? 'overshield' : 'nova';
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
  if (mode !== 'playing' || (warp && warp.phase !== 'collect') || player.dashCd > 0 || player.dashTime > 0) return;
  const rig = getEffectiveRig();
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
  if (mode !== 'playing' || (warp && warp.phase !== 'collect') || novaCharge < 50) return;
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
  boss = createBoss(nextBossRank++, w, runSeed);
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
  dropCoins(part.x, part.y, 4);
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
  const armorScale = b.exposedFor > 0 ? 2 : hasActivePylons(b) ? 0.65 : 1;
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
  dropCoins(b.x, b.y, 14 + b.rank * 4);
  dropTacticalCell(b.x - 26, b.y, weaponLevel < 7 ? 'weapon' : 'overshield');
  if (shields < maxShields) dropTacticalCell(b.x + 26, b.y, 'shield');
  addScore(b.points, b.x, b.y, true, PALETTE.gold);
  kills++;
  bumpCombo(6);
  addShake(16);
  sound.effect('nova');
  sound.setBoss(0);
  // Schedule next flagship after 2 full waves in the next sector
  nextBossAtSpawn = spawnCount + 12;
  spawnIn = 1.4;
  // Kick off cinematic Lightspeed Sector Jump after brief loot-magnet grace period
  warp = {
    phase: 'collect',
    t: 0,
    nextSector: sectorIndex + 1,
    switched: false,
  };
  showBanner('FLAGSHIP DESTROYED', `${b.name} NEUTRALIZED`, 'gold', 1.8);
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
  if (!isRock && e.kind !== 'mine') {
    const coinCount =
      e.kind === 'courier' ? 6 : ['gunship', 'prism', 'minelayer'].includes(e.kind) ? 3 : Math.random() < 0.55 ? 1 : 0;
    if (coinCount > 0) dropCoins(e.x, e.y, coinCount);
  }

  // Supply courier always drops a tactical upgrade cell (including Overshield!)
  if (e.kind === 'courier') {
    dropTacticalCell(e.x, e.y);
  } else if (heavy && Math.random() < 0.28) {
    dropTacticalCell(e.x, e.y);
  }

  // Large asteroids fracture into 2 (or 3 from Sector 3+) fast rubble shards
  if (isRock && e.split) {
    const dirs = sectorIndex >= 2 ? [-1, 0, 1] : [-1, 1];
    for (const dir of dirs) {
      const child = createEnemy('rock', e.x + dir * 10, e.y, currentWave, {
        r: Math.max(10, e.r * 0.54),
        hp: 1,
        maxHp: 1,
        split: false,
        vx: dir * between(48, 98),
        vy: between(100, 155),
        points: 10,
        shards: 1,
      });
      child.shape = outlineRock();
      enemies.push(child);
    }
  }
}

function renderVitals() {
  vitalsEl.innerHTML = '';
  // Red Hull health blocks (permanent, cannot be regenerated)
  for (let i = 0; i < maxHull; i++) {
    const pip = document.createElement('i');
    pip.className = 'hull-pip' + (i >= hull ? ' spent' : '');
    vitalsEl.append(pip);
  }
  // Subtle tactical divider between Hull and Shield layers
  const sep = document.createElement('span');
  sep.className = 'vitals-sep';
  sep.setAttribute('aria-hidden', 'true');
  vitalsEl.append(sep);
  // Cyan Shield blocks (absorb hits first, rechargeable with +S cells)
  for (let i = 0; i < maxShields; i++) {
    const pip = document.createElement('i');
    pip.className = 'shield-pip' + (i >= shields ? ' spent' : '');
    vitalsEl.append(pip);
  }
  const critical = shields === 0 && hull <= 1;
  vitalsEl.setAttribute('aria-label', `${hull} of ${maxHull} hull, ${shields} of ${maxShields} shields`);
  vitalsEl.classList.toggle('critical', critical);
  hullCountEl.textContent = `${hull}/${maxHull}`;
  shieldCount.textContent = `${shields}/${maxShields}`;
  shieldHud.classList.toggle('is-critical', critical);
  shieldHud.classList.toggle('is-hit', hitFlash > 0.08);
  shieldHud.classList.toggle('is-overshield', overshieldTime > 0);
  overshieldBadge.hidden = overshieldTime <= 0;
  if (overshieldTime > 0) overshieldTimeEl.textContent = `${overshieldTime.toFixed(1)}s`;
}

function updateHud() {
  scoreLabel.textContent = formatScore(displayScore);
  runCoinsHud.textContent = runCoins.toLocaleString();
  renderVitals();

  // Combo indicator
  const mult = getMultiplier();
  comboHud.hidden = combo < 2;
  if (!comboHud.hidden) {
    comboMultEl.textContent = `×${mult.toFixed(2).replace(/\.00$/, '.0')}`;
    comboHud.dataset.tier = mult >= 3 ? 'high' : 'base';
    comboHud.style.setProperty('--combo-life', `${Math.max(0, (comboTimer / 4.2) * 100)}%`);
  }

  // Weapon & mode dock (supports MK I through MK VII!)
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][clamp(weaponLevel - 1, 0, 6)];
  weaponTierEl.textContent = `MK ${roman}`;
  const focused = preciseSteering();
  fireModeEl.textContent = overdriveTime > 0 ? 'OVERDRIVE' : focused ? 'LANCE' : 'WIDE';
  fireModeEl.classList.toggle('focus-on', focused && overdriveTime <= 0);
  fireModeEl.classList.toggle('overdrive-on', overdriveTime > 0);
  focusChip.dataset.active = String(focused);
  autofireBtn.setAttribute('aria-pressed', String(autoFire));

  // Nova / Overdrive dock
  const pct = overdriveTime > 0 ? Math.min(100, (overdriveTime / 4.8) * 100) : Math.min(100, novaCharge);
  novaFill.style.width = `${pct.toFixed(1)}%`;
  novaPct.textContent = overdriveTime > 0 ? `${overdriveTime.toFixed(1)}s` : `${Math.floor(novaCharge)}%`;
  novaLabel.textContent = overdriveTime > 0 ? 'OVERDRIVE' : novaCharge >= 50 ? 'NOVA READY' : 'NOVA';
  novaBlock.dataset.ready = String(novaCharge >= 50);
  novaBlock.dataset.overdrive = String(overdriveTime > 0);
  dashPip.dataset.ready = String(player.dashCd <= 0);
  novaHint.dataset.ready = String(novaCharge >= 50);
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
    warp = null;
    sectorIndex = 0;
    hitFlash = 0;
    overshieldTime = 0;
    playerDying = 0;
    deathTick = 0;
    bossHud.hidden = true;
    title.textContent = 'Low Orbit';
    message.hidden = false;
    document.querySelector('#debrief').hidden = true;
    document.querySelector('#action-text').textContent = 'Play';
    syncMetaUi();
    action.focus({ preventScroll: true });
    startIntro();
  } else {
    const lost = next === 'over';
    sound.stop();
    title.textContent = lost ? 'Ship lost' : 'Paused';
    message.hidden = true;
    document.querySelector('#debrief').hidden = false;
    document.querySelector('#run-rank').textContent = computeRank();
    document.querySelector('#run-score').textContent = Math.floor(score).toLocaleString();
    document.querySelector('#run-coins').textContent = '+' + runCoins.toLocaleString();
    document.querySelector('#run-wave').textContent = waveLabel.textContent;
    document.querySelector('#run-kills').textContent = kills;
    document.querySelector('#run-combo').textContent = `×${peakMultiplier.toFixed(1)}`;
    document.querySelector('#action-text').textContent = lost ? 'Play again' : 'Resume';
    syncMetaUi();
    action.focus({ preventScroll: true });
  }
  draw();
}

function launch() {
  const rig = getEffectiveRig();
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
  runCoins = 0;
  kills = 0;
  grazes = 0;
  combo = 0;
  comboTimer = 0;
  peakMultiplier = 1;
  novaCharge = rig.startNova;
  overdriveTime = 0;
  overshieldTime = 0;
  weaponLevel = rig.startWeapon;
  maxHull = rig.hull;
  hull = rig.hull;
  maxShields = rig.shields;
  shields = rig.shields;
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
  runSeed = Math.floor(Math.random() * 99999) + 1;
  nextBossAtSpawn = 12;
  sectorIndex = 0;
  warp = null;
  hitFlash = 0;
  playerDying = 0;
  deathTick = 0;
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
  showBanner(`SECTOR 01 // ${getSectorName(0)}`, `WAVE 01 — ${waveNames[0]}`, 'teal', 2.2);
  updateHud();
  setMode('playing');
}

function hitPlayer() {
  if (immune > 0 || player.dashTime > 0 || overshieldTime > 0 || warp || playerDying > 0) return;
  combo = Math.floor(combo * 0.35);
  immune = 1.65;

  if (shields > 0) {
    shields--;
    hitFlash = 0.42;
    sound.effect('shield', shields);
    addShake(13);
    triggerHitstop(0.065);
    burst(player, '#8ef0e8', true);
    shockwaves.push({ x: player.x, y: player.y, radius: 135, color: '#8ef0e8', life: 0.34, maxLife: 0.34 });
    if (shields === 0) {
      popups.push({
        x: player.x,
        y: player.y - 26,
        text: 'SHIELD DOWN',
        color: PALETTE.vermilion,
        life: 0.95,
        maxLife: 0.95,
        size: 13,
      });
    }
  } else {
    hull--;
    hitFlash = 0.65;
    if (weaponLevel > 1) weaponLevel--;
    if (hull > 0) {
      sound.effect('hull', hull);
      addShake(16);
      triggerHitstop(0.08);
      burst(player, '#ff5c4d', true);
      shockwaves.push({ x: player.x, y: player.y, radius: 150, color: '#ff5c4d', life: 0.38, maxLife: 0.38 });
      popups.push({
        x: player.x,
        y: player.y - 26,
        text: 'HULL BREACH',
        color: '#ff7d6b',
        life: 0.95,
        maxLife: 0.95,
        size: 13,
      });
    } else {
      // Dramatic multi-stage ship explosion sequence before transitioning to Game Over!
      playerDying = reducedMotion.matches ? 0.55 : 1.45;
      deathTick = 0;
      sound.stop();
      sound.death();
      addShake(18);
      triggerHitstop(0.09);
      burst({ x: player.x, y: player.y, r: 28 }, '#ff8f66', true);
      shockwaves.push({ x: player.x, y: player.y, radius: 220, color: '#ff9c6e', life: 0.55, maxLife: 0.55 });
      if (score > best) {
        best = Math.floor(score);
        bestLabel.textContent = formatScore(best);
        try {
          localStorage.setItem('low-orbit-best', String(best));
        } catch {}
      }
      updateHud();
      return;
    }
  }

  for (const s of shots) {
    if (s.hostile && Math.hypot(s.x - player.x, s.y - player.y) < 145) s.dead = true;
  }
  updateHud();
}

function preciseSteering() {
  return keys.has('ShiftLeft') || keys.has('ShiftRight');
}

function firePlayerWeapons(focused) {
  const rig = getEffectiveRig();
  const od = overdriveTime > 0;
  const tierScale = 1 + Math.max(0, weaponLevel - 4) * 0.14;
  const dmgBoost = (focused ? 1.28 : 1) * (od ? 1.25 : 1) * tierScale;
  const aimBase = 0;

  function shoot(ox, oy, angle, speed, dmg, opts = {}) {
    shots.push({
      x: player.x + ox,
      y: player.y + oy,
      r: opts.heavy ? 5.6 : opts.pierce ? 5.2 : 4.2,
      vx: Math.sin(angle) * speed,
      vy: -Math.cos(angle) * speed,
      dmg,
      hostile: false,
      focused,
      overdrive: od,
      pierce: opts.pierce || 0,
      hitIds: opts.pierce ? new Set() : null,
      ...opts,
    });
  }

  if (selectedRig === 'aegis') {
    if (focused) {
      shoot(-7, -17, 0, 660, 1.45 * dmgBoost, { heavy: true });
      shoot(7, -17, 0, 660, 1.45 * dmgBoost, { heavy: true });
      if (weaponLevel >= 3) shoot(0, -22, 0, 700, 1.3 * dmgBoost, { heavy: true });
      if (weaponLevel >= 5) {
        shoot(-16, -10, 0, 720, 1.35 * dmgBoost, { pierce: 2 });
        shoot(16, -10, 0, 720, 1.35 * dmgBoost, { pierce: 2 });
      }
      if (weaponLevel >= 7) shoot(0, -26, 0, 780, 1.65 * dmgBoost, { pierce: 3 });
    } else {
      shoot(0, -19, aimBase, 600, 1.35 * dmgBoost, { heavy: true });
      shoot(-13, -10, -0.14, 575, 1.05 * dmgBoost, { heavy: weaponLevel >= 3 });
      shoot(13, -10, 0.14, 575, 1.05 * dmgBoost, { heavy: weaponLevel >= 3 });
      if (weaponLevel >= 2) {
        shoot(-18, -5, -0.27, 545, 0.9 * dmgBoost);
        shoot(18, -5, 0.27, 545, 0.9 * dmgBoost);
      }
      if (weaponLevel >= 4) {
        shoot(-7, -16, -0.05, 630, 1.0 * dmgBoost);
        shoot(7, -16, 0.05, 630, 1.0 * dmgBoost);
      }
      if (weaponLevel >= 5) {
        shoot(-22, -2, -0.38, 600, 1.1 * dmgBoost, { pierce: 2 });
        shoot(22, -2, 0.38, 600, 1.1 * dmgBoost, { pierce: 2 });
      }
      if (weaponLevel >= 7) {
        shoot(0, -24, 0, 700, 1.5 * dmgBoost, { pierce: 3 });
      }
    }
  } else if (selectedRig === 'falcon') {
    if (focused) {
      shoot(-5, -18, 0, 730, 0.95 * dmgBoost);
      shoot(5, -18, 0, 730, 0.95 * dmgBoost);
      if (weaponLevel >= 2) shoot(0, -22, 0, 760, 0.9 * dmgBoost);
      if (weaponLevel >= 4) {
        shoot(-11, -12, 0, 710, 0.8 * dmgBoost);
        shoot(11, -12, 0, 710, 0.8 * dmgBoost);
      }
      if (weaponLevel >= 6) {
        shoot(-17, -7, 0, 750, 1.15 * dmgBoost, { pierce: 2 });
        shoot(17, -7, 0, 750, 1.15 * dmgBoost, { pierce: 2 });
      }
    } else {
      shoot(-7, -16, -0.04, 680, 0.85 * dmgBoost);
      shoot(7, -16, 0.04, 680, 0.85 * dmgBoost);
      if (weaponLevel >= 2) {
        shoot(-15, -8, -0.18, 640, 0.78 * dmgBoost);
        shoot(15, -8, 0.18, 640, 0.78 * dmgBoost);
      }
      if (weaponLevel >= 4) shoot(0, -21, 0, 700, 0.9 * dmgBoost);
      if (weaponLevel >= 5) {
        shoot(-20, -3, -0.32, 660, 0.95 * dmgBoost, { pierce: 2 });
        shoot(20, -3, 0.32, 660, 0.95 * dmgBoost, { pierce: 2 });
      }
      if (weaponLevel >= 7) {
        shoot(-10, -18, -0.09, 720, 1.0 * dmgBoost, { pierce: 2 });
        shoot(10, -18, 0.09, 720, 1.0 * dmgBoost, { pierce: 2 });
      }
    }
  } else {
    // Kestrel balanced pulse + focused rail-lance + MK V-VII piercing wing lances
    if (focused) {
      shoot(-4.5, -19, 0, 745, 1.1 * dmgBoost);
      shoot(4.5, -19, 0, 745, 1.1 * dmgBoost);
      if (weaponLevel >= 3) {
        shoot(-11, -12, 0, 715, 0.9 * dmgBoost);
        shoot(11, -12, 0, 715, 0.9 * dmgBoost);
      }
      if (weaponLevel >= 5) {
        shoot(-17, -8, 0, 760, 1.2 * dmgBoost, { pierce: 2 });
        shoot(17, -8, 0, 760, 1.2 * dmgBoost, { pierce: 2 });
      }
      if (weaponLevel >= 7) shoot(0, -25, 0, 810, 1.55 * dmgBoost, { pierce: 3 });
    } else {
      if (weaponLevel === 1) {
        shoot(-6, -16, -0.03, 625, 1.0 * dmgBoost);
        shoot(6, -16, 0.03, 625, 1.0 * dmgBoost);
      } else {
        shoot(0, -19, 0, 645, 1.0 * dmgBoost);
        shoot(-12, -12, -0.12, 615, 0.9 * dmgBoost);
        shoot(12, -12, 0.12, 615, 0.9 * dmgBoost);
        if (weaponLevel >= 3) {
          shoot(-18, -6, -0.24, 590, 0.85 * dmgBoost);
          shoot(18, -6, 0.24, 590, 0.85 * dmgBoost);
        }
        if (weaponLevel >= 4) {
          shoot(-6, -17, -0.04, 665, 0.9 * dmgBoost);
          shoot(6, -17, 0.04, 665, 0.9 * dmgBoost);
        }
        if (weaponLevel >= 5) {
          shoot(-22, -2, -0.35, 635, 1.05 * dmgBoost, { pierce: 2 });
          shoot(22, -2, 0.35, 635, 1.05 * dmgBoost, { pierce: 2 });
        }
        if (weaponLevel >= 6) {
          shoot(-11, -16, 0, 720, 1.15 * dmgBoost, { pierce: 2 });
          shoot(11, -16, 0, 720, 1.15 * dmgBoost, { pierce: 2 });
        }
      }
    }
  }

  player.muzzle = 0.09;
  player.recoil = 2.6;
  sound.effect(focused ? 'focusFire' : 'fire');
  nextShot = rig.fireRate * (od ? 0.68 : 1) * (weaponLevel >= 6 ? 0.9 : 1);
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

  // Cinematic slow-motion player destruction sequence before Game Over screen!
  if (playerDying > 0) {
    playerDying -= dt;
    deathTick -= dt;
    hitFlash = Math.max(0, hitFlash - dt * 0.7);
    if (deathTick <= 0 && playerDying > 0.22) {
      deathTick = 0.2;
      const ox = between(-22, 22);
      const oy = between(-22, 22);
      burst({ x: player.x + ox, y: player.y + oy, r: 16 }, Math.random() < 0.5 ? '#ff9d6e' : '#ffe39c', false);
      smoke.push({
        x: player.x + ox,
        y: player.y + oy,
        vx: between(-35, 35),
        vy: between(-35, 35),
        r: between(6, 13),
        color: '#6b7585',
        life: 0.75,
        maxLife: 0.75,
      });
      addShake(9);
    }
    const slowDt = dt * 0.35;
    distance += slowDt * 120;
    for (const s of shots) {
      s.x += s.vx * slowDt;
      s.y += s.vy * slowDt;
    }
    for (const p of sparks) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.exp(-dt * 3);
      p.vy *= Math.exp(-dt * 3);
      p.life -= dt;
    }
    for (const d of debris) {
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.angle += d.spin * dt;
      d.life -= dt;
    }
    for (const puff of smoke) {
      puff.x += puff.vx * dt;
      puff.y += puff.vy * dt;
      puff.life -= dt;
    }
    for (const ring of impacts) ring.life -= dt;
    for (const sw of shockwaves) sw.life -= dt;
    sparks = sparks.filter((p) => p.life > 0);
    debris = debris.filter((d) => d.life > 0);
    smoke = smoke.filter((p) => p.life > 0);
    impacts = impacts.filter((ring) => ring.life > 0);
    shockwaves = shockwaves.filter((sw) => sw.life > 0);

    if (playerDying <= 0) {
      setMode('over');
    }
    return;
  }

  time += dt;
  immune = Math.max(0, immune - dt);
  hitFlash = Math.max(0, hitFlash - dt);
  nextShot -= dt;
  missileTimer -= dt;
  player.dashCd = Math.max(0, player.dashCd - dt);
  player.muzzle = Math.max(0, player.muzzle - dt);
  player.recoil *= Math.exp(-dt * 26);

  if (overdriveTime > 0) {
    overdriveTime = Math.max(0, overdriveTime - dt);
  }
  if (overshieldTime > 0) {
    overshieldTime = Math.max(0, overshieldTime - dt);
  }
  if (comboTimer > 0 && !warp) {
    comboTimer -= dt;
    if (comboTimer <= 0) combo = 0;
  }
  if (banner) {
    banner.life -= dt;
    if (banner.life <= 0) banner = null;
  }

  // Feed dynamic intensity to the music engine
  sound.setIntensity(clamp((getMultiplier() - 1) / 5 + (overdriveTime > 0 ? 0.45 : 0), 0, 1));

  // --- CINEMATIC LIGHTSPEED WARP SEQUENCE BETWEEN SECTORS ---
  if (warp) {
    warp.t += dt;
    immune = Math.max(immune, 0.5);
    const shortMotion = reducedMotion.matches;

    if (warp.phase === 'collect') {
      // Auto-vacuum all boss drops while player can still steer briefly
      for (const p of pickups) p.magnet = true;
      if (warp.t >= (shortMotion ? 0.45 : 0.9)) {
        warp.phase = 'depart';
        warp.t = 0;
        warp.startX = player.x;
        warp.startY = player.y;
        enemies = [];
        shots = [];
        sound.effect('warp');
      }
    } else if (warp.phase === 'depart') {
      // Smoothly center horizontally and accelerate straight up off the top edge
      const dur = shortMotion ? 0.45 : 0.95;
      const p = clamp(warp.t / dur, 0, 1);
      const easeIn = p * p * p;
      player.x += (w * 0.5 - player.x) * (1 - Math.exp(-dt * 6));
      player.y = warp.startY + (-110 - warp.startY) * easeIn;
      player.vx = 0;
      player.vy = -420 * p;
      player.bank *= Math.exp(-dt * 12);
      distance += dt * (220 + p * 1450);
      if (p >= 1) {
        warp.phase = 'tunnel';
        warp.t = 0;
        player.trails = [[], []];
      }
    } else if (warp.phase === 'tunnel') {
      // Blazing hyperspace tunnel -> color space transitions cleanly at midpoint!
      const dur = shortMotion ? 0.5 : 1.35;
      distance += dt * 2100;
      if (!warp.switched && warp.t >= dur * 0.48) {
        warp.switched = true;
        sectorIndex = warp.nextSector;
        pickups = [];
      }
      if (warp.t >= dur) {
        warp.phase = 'arrive';
        warp.t = 0;
        player.x = w * 0.5;
        player.y = h + 86;
        player.vy = -320;
      }
    } else if (warp.phase === 'arrive') {
      // Ship flies smoothly in from bottom of the brand-new colored sector!
      const dur = shortMotion ? 0.45 : 0.95;
      const p = clamp(warp.t / dur, 0, 1);
      const easeOut = 1 - Math.pow(1 - p, 3);
      player.x = w * 0.5;
      player.y = h + 86 + (h * 0.79 - (h + 86)) * easeOut;
      player.vx = 0;
      player.vy = -320 * (1 - p);
      player.bank = 0;
      distance += dt * (150 + (1 - p) * 1200);
      if (p >= 1) {
        warp = null;
        player.y = h * 0.79;
        player.vy = 0;
        spawnIn = 0.8;
        const secNum = String(sectorIndex + 1).padStart(2, '0');
        showBanner(`SECTOR ${secNum} // ${getSectorName(sectorIndex)}`, 'NEW ORBIT REACHED', 'teal', 2.2);
      }
    }
  }

  // Steering / Phase Dash (locked cleanly during depart/tunnel/arrive warp phases)
  const rig = getEffectiveRig();
  const focused = preciseSteering();
  const controlsLocked = warp && warp.phase !== 'collect';

  if (controlsLocked) {
    // Ship position is driven by the warp choreography above
  } else if (player.dashTime > 0) {
    player.dashTime = Math.max(0, player.dashTime - dt);
    player.vx = player.dashDx * rig.dashSpeed;
    player.vy = player.dashDy * rig.dashSpeed;
    player.x = clamp(player.x + player.vx * dt, 19, w - 19);
    player.y = clamp(player.y + player.vy * dt, 24, h - 24);
    if (pointer) {
      pointer.goalX = player.x;
      pointer.goalY = player.y;
    }
    player.ghosts.push({ x: player.x, y: player.y, bank: player.bank, life: 0.24 });
    if (player.ghosts.length > 6) player.ghosts.shift();
  } else if (pointer) {
    // 1:1 instant touch & mouse tracking (ZERO lag!), computing velocity purely for crisp 2.5D roll bank
    const prevX = player.x;
    const prevY = player.y;
    player.x = clamp(pointer.goalX, 19, w - 19);
    player.y = clamp(pointer.goalY, 24, h - 24);
    const instVx = dt > 0.001 ? (player.x - prevX) / dt : 0;
    const instVy = dt > 0.001 ? (player.y - prevY) / dt : 0;
    player.vx += (clamp(instVx, -rig.speed * 1.4, rig.speed * 1.4) - player.vx) * (1 - Math.exp(-dt * 24));
    player.vy += (clamp(instVy, -rig.speed * 1.4, rig.speed * 1.4) - player.vy) * (1 - Math.exp(-dt * 24));
  } else {
    const dx =
      Number(keys.has('ArrowRight') || keys.has('KeyD')) -
      Number(keys.has('ArrowLeft') || keys.has('KeyA'));
    const dy =
      Number(keys.has('ArrowDown') || keys.has('KeyS')) - Number(keys.has('ArrowUp') || keys.has('KeyW'));
    const length = Math.hypot(dx, dy);
    const thrust = focused ? rig.focusSpeed : rig.speed;
    const targetX = (dx * thrust) / (length || 1);
    const targetY = (dy * thrust) / (length || 1);

    function steer(position, velocity, target, min, max) {
      const v = player[velocity];
      const braking = Math.abs(target) < Math.abs(v) || target * v < 0;
      const rate = braking ? 34 : 20;
      const blend = -Math.expm1(-dt * rate);
      player[position] = clamp(player[position] + target * dt + ((v - target) * blend) / rate, min, max);
      player[velocity] = v + (target - v) * blend;
    }
    steer('x', 'vx', targetX, 19, w - 19);
    steer('y', 'vy', targetY, 24, h - 24);
    if (player.x === 19 || player.x === w - 19) player.vx = 0;
    if (player.y === 24 || player.y === h - 24) player.vy = 0;
  }

  if (!controlsLocked) {
    // Full [-1, 1] roll signal for crisp 2.5D Chicken Invaders banking around the center axis
    const targetRoll = clamp(player.vx / (rig.speed * 0.85), -1, 1);
    player.bank += (targetRoll - player.bank) * (1 - Math.exp(-dt * 14));
    distance +=
      dt *
      clamp(128 - player.vy * 0.16, 70, 210) *
      (overdriveTime > 0 ? 1.35 : 1) *
      (reducedMotion.matches ? 0.45 : 1);
  }

  // Update wingtip contrails & ghosts
  if (!warp || warp.phase !== 'tunnel') {
    for (let sideIdx = 0; sideIdx < 2; sideIdx++) {
      const sign = sideIdx === 0 ? -1 : 1;
      const trail = player.trails[sideIdx];
      trail.push({ x: player.x + sign * 14 * (1 - Math.abs(player.bank) * 0.3), y: player.y + 11 });
      if (trail.length > 10) trail.shift();
      for (const pt of trail) pt.y += dt * (warp ? 420 : 150);
    }
  }
  for (const g of player.ghosts) g.life -= dt;
  player.ghosts = player.ghosts.filter((g) => g.life > 0);

  // Firing logic
  const isFiring = !controlsLocked && (keys.has('Space') || Boolean(pointer) || autoFire);
  if (isFiring && nextShot <= 0) {
    firePlayerWeapons(focused);
  }

  // Automatic Homing Seeker Missiles (Falcon from MK I, ALL ships from MK IV+, quad swarms at MK VI+!)
  const hasMissiles = selectedRig === 'falcon' || weaponLevel >= 4 || (weaponLevel >= 3 && overdriveTime > 0);
  if (isFiring && hasMissiles && missileTimer <= 0 && enemies.length > 0) {
    const quadSalvo = (selectedRig === 'falcon' && weaponLevel >= 4) || weaponLevel >= 6;
    const interval = selectedRig === 'falcon' ? (weaponLevel >= 3 ? 0.42 : 0.62) : weaponLevel >= 6 ? 0.54 : 0.72;
    const launchers = quadSalvo ? [-20, -10, 10, 20] : [-14, 14];
    for (const ox of launchers) {
      const side = Math.sign(ox);
      shots.push({
        x: player.x + ox,
        y: player.y + (Math.abs(ox) > 15 ? 6 : 1),
        r: 4.5,
        vx: side * (Math.abs(ox) > 15 ? 195 : 120),
        vy: -185,
        dmg: selectedRig === 'falcon' ? 1.55 : 1.35,
        hostile: false,
        homing: true,
        age: 0,
      });
    }
    sound.effect('missile');
    missileTimer = interval * (overdriveTime > 0 ? 0.72 : 1);
  }

  // Smart Wave Director with Crowd Budget (prevents overwhelming pileups on endless waves!)
  if (!boss && !warp) {
    spawnIn -= dt;
    const combatHostiles = enemies.filter((e) => !e.dead && e.kind !== 'rock' && e.kind !== 'mine');
    const heavyCount = combatHostiles.filter((e) => ['gunship', 'prism', 'minelayer'].includes(e.kind)).length;
    if (spawnCount >= nextBossAtSpawn) {
      if (combatHostiles.length === 0 && spawnIn <= 0.4) {
        beginBoss();
      }
    } else {
      if (combatHostiles.length === 0 && spawnIn > 0.6) {
        spawnIn = 0.6;
      }
      // Hold next squad cleanly if arena already has heavy threats or >= 5 active combat craft
      const arenaCrowded = combatHostiles.length >= 5 || heavyCount >= 2;
      if (spawnIn <= 0 && !arenaCrowded) {
        const wave = Math.floor(spawnCount / 6) + 1;
        const beat = spawnCount % 6;
        hud.style.setProperty('--wave-progress', ((beat + 1) / 6) * 100 + '%');
        if (beat === 0) {
          currentWave = wave;
          waveLabel.textContent = String(wave).padStart(2, '0');
          sound.setWave(wave);
          if (wave > 1) {
            const opName = waveNames[(wave - 1) % waveNames.length];
            const secNum = String(sectorIndex + 1).padStart(2, '0');
            showBanner(`SECTOR ${secNum} // ${getSectorName(sectorIndex)}`, `WAVE ${String(wave).padStart(2, '0')} — ${opName}`, 'teal', 2.1);
          }
        }
        const first = enemies.length;
        spawnFormation(enemies, w, wave, beat, player.x);
        for (const enemy of enemies.slice(first)) {
          if (enemy.kind === 'rock') enemy.shape = outlineRock();
        }
        spawnCount++;
        // Smooth asymptotic pacing ceiling (never spawns exponentially faster!)
        const cadence = 1 + 0.36 * (1 - Math.exp(-(wave - 1) * 0.2));
        spawnIn = (beat === 5 ? waveLength / 6 + 1.25 : waveLength / 6) / cadence;
      }
    }
  }

  // Subtle hull smoke when shields are down and hull is damaged
  if (shields === 0 && hull < maxHull && !controlsLocked && Math.random() < dt * 11) {
    smoke.push({
      x: player.x + between(-7, 7),
      y: player.y + between(2, 10),
      vx: between(-18, 18),
      vy: between(25, 65),
      r: between(2.5, 5.5),
      color: hull === 1 ? '#ff7d6b' : '#7b8796',
      life: 0.4,
      maxLife: 0.4,
    });
  }

  // Active thermal beam collision check (Prism & Vesper)
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

    // Active thermal beam collision check (Prism single beam & Boss single/twin scissor beams!)
    if (!enemy.dead && enemy.beamActive > 0) {
      const halfWidth = enemy === boss ? 14 : 10;
      const offsets = enemy === boss && enemy.twinBeam ? [-0.26, 0.26] : [0];
      for (const off of offsets) {
        if (pointHitsBeam(player.x, player.y, enemy.x, enemy.y, (enemy.beamAngle || 0) + off, halfWidth + player.r)) {
          hitPlayer();
          if (hull <= 0) return;
          break;
        }
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
      // Indestructible Overshield vaporizes bullets on contact!
      if (overshieldTime > 0 && Math.hypot(s.x - player.x, s.y - player.y) < 30 + s.r) {
        s.dead = true;
        addScore(10);
        sparks.push({
          x: s.x,
          y: s.y,
          vx: (s.x - player.x) * 4,
          vy: (s.y - player.y) * 4,
          life: 0.2,
          color: '#ffe58f',
        });
        continue;
      }
      if (collides(s, player)) {
        if (player.dashTime <= 0) {
          s.dead = true;
          hitPlayer();
          if (hull <= 0) return;
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

      const e = enemies.find((cand) => cand !== boss && !cand.dead && !s.hitIds?.has(cand) && collides(s, cand));
      if (e) {
        if (s.pierce > 0) {
          s.pierce--;
          s.hitIds?.add(e);
          if (s.pierce <= 0) s.dead = true;
        } else {
          s.dead = true;
        }
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

  // Enemy hull collision with player (Overshield rams enemies for heavy damage!)
  for (const e of enemies) {
    if (e.dead || (e === boss && (e.entering > 0 || e.dying > 0))) continue;
    const hitDist = overshieldTime > 0 ? 28 + e.r : player.r + e.r;
    if (Math.hypot(player.x - e.x, player.y - e.y) < hitDist && player.dashTime <= 0) {
      if (overshieldTime > 0) {
        if (e === boss) {
          damageBossCore(e, 4);
        } else {
          e.hp -= 10;
          e.flash = 0.16;
          if (e.hp <= 0) killEnemy(e);
        }
        addShake(5);
        continue;
      }
      if (e !== boss) {
        e.hp = 0;
        killEnemy(e);
      }
      hitPlayer();
      if (hull <= 0) return;
    }
  }

  // Salvage, Coin & Pickup physics + smart magnet vacuum
  const magnetRadius =
    (overdriveTime > 0 ? 520 : player.dashTime > 0 ? 280 : !isFiring ? 225 : 120) * rig.magnetScale;
  for (const p of pickups) {
    p.age += dt;
    const dx = player.x - p.x;
    const dy = player.y - p.y;
    const dist = Math.hypot(dx, dy);

    if ((p.kind === 'shard' || p.kind === 'coin') && (p.magnet || dist < magnetRadius)) {
      p.magnet = true;
      const pull = Math.min(760, 340 + p.age * 440);
      p.vx += ((dx / (dist || 1)) * pull - p.vx) * (1 - Math.exp(-dt * 12));
      p.vy += ((dy / (dist || 1)) * pull - p.vy) * (1 - Math.exp(-dt * 12));
    } else {
      p.vx *= Math.exp(-dt * 2.5);
      p.vy += (92 - p.vy) * (1 - Math.exp(-dt * 2.2));
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    if (dist < p.r + 20) {
      p.dead = true;
      if (p.kind === 'shard') {
        bumpCombo(1);
        novaCharge = Math.min(100, novaCharge + (p.nova ? 3.0 : 2.2));
        addScore(p.nova ? 20 : 12);
        sound.effect('shard', Math.min(10, Math.floor(combo / 2)));
      } else if (p.kind === 'coin') {
        const value = 2 + sectorIndex;
        runCoins += value;
        meta.coins += value;
        saveMeta();
        sound.effect('coin');
      } else if (p.kind === 'overshield') {
        overshieldTime = 6.5;
        shockwaves.push({ x: player.x, y: player.y, radius: 130, color: '#ffe58f', life: 0.36, maxLife: 0.36 });
        popups.push({
          x: player.x,
          y: player.y - 26,
          text: 'OVERSHIELD 6.5s',
          color: '#ffe58f',
          life: 1.1,
          maxLife: 1.1,
          size: 14,
        });
        sound.effect('overshield');
      } else if (p.kind === 'weapon') {
        if (weaponLevel < 7) {
          weaponLevel++;
          const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][weaponLevel - 1];
          popups.push({
            x: player.x,
            y: player.y - 24,
            text: `WEAPON MK ${roman}`,
            color: weaponLevel >= 5 ? PALETTE.gold : PALETTE.teal,
            life: 1.0,
            maxLife: 1.0,
            size: 14,
          });
        } else {
          addScore(450, player.x, player.y - 22, true, PALETTE.gold);
          novaCharge = Math.min(100, novaCharge + 35);
        }
        sound.effect('upgrade');
      } else if (p.kind === 'shield') {
        // Only Shields regenerate; red Hull health is permanent!
        if (shields < maxShields) {
          shields++;
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

  // Pull pickups strongly during warp collect phase too
  for (const p of pickups) {
    if (warp && warp.phase === 'collect' && p.kind !== 'shard') {
      const dx = player.x - p.x;
      const dy = player.y - p.y;
      const dist = Math.hypot(dx, dy) || 1;
      p.x += (dx / dist) * 420 * dt;
      p.y += (dy / dist) * 420 * dt;
    }
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

function updateIntroFlight(dt) {
  introTime += dt;
  if (!introShip.ready && w && h) {
    introShip.x = w * 0.22;
    introShip.y = h * 0.34;
    introShip.ready = true;
  }
  // Smooth figure-8 patrol loop across the open sky + gentle attraction toward mouse cursor!
  const portrait = w < h;
  const patrolX = w * (0.5 + Math.sin(introTime * 0.48) * 0.34);
  const patrolY = portrait
    ? h * (0.21 + Math.sin(introTime * 0.96) * 0.08)
    : h * (0.28 + Math.sin(introTime * 0.96) * 0.14);
  const mouseX = introCursorX * w;
  const mouseY = clamp(introCursorY * h, h * 0.1, h * 0.68);
  const targetX = patrolX * 0.62 + mouseX * 0.38;
  const targetY = patrolY * 0.62 + mouseY * 0.38;

  const dx = targetX - introShip.x;
  const dy = targetY - introShip.y;
  const desiredVx = clamp(dx * 2.2, -320, 320);
  const desiredVy = clamp(dy * 2.2, -240, 240);
  const prevVx = introShip.vx;
  introShip.vx += (desiredVx - introShip.vx) * (1 - Math.exp(-dt * 3.4));
  introShip.vy += (desiredVy - introShip.vy) * (1 - Math.exp(-dt * 3.4));
  introShip.x += introShip.vx * dt;
  introShip.y += introShip.vy * dt;

  const spd = Math.hypot(introShip.vx, introShip.vy);
  if (spd > 14) {
    const targetHeading = Math.atan2(introShip.vx, -introShip.vy);
    let diff = targetHeading - introShip.heading;
    while (diff > Math.PI) diff -= TAU;
    while (diff < -Math.PI) diff += TAU;
    introShip.heading += diff * (1 - Math.exp(-dt * 6.5));
    const turnRoll = clamp(diff * 1.7 + (introShip.vx - prevVx) * 0.015, -0.92, 0.92);
    introShip.roll += (turnRoll - introShip.roll) * (1 - Math.exp(-dt * 6.5));
  }

  // Record wingtip contrails behind the flying ship
  const cos = Math.cos(introShip.heading);
  const sin = Math.sin(introShip.heading);
  const span = Math.min(w * (w < h ? 0.14 : 0.078), h * 0.115, 76) * 0.33 * Math.cos(introShip.roll * 0.72);
  for (let i = 0; i < 2; i++) {
    const s = i === 0 ? -1 : 1;
    const wx = introShip.x + cos * (s * span) - sin * 14;
    const wy = introShip.y + sin * (s * span) + cos * 14;
    const trail = introShip.trails[i];
    trail.push({ x: wx, y: wy });
    if (trail.length > 26) trail.shift();
  }
}

function tick(now) {
  if (document.hidden || (mode !== 'playing' && mode !== 'intro')) return;
  const dt = lastTime ? Math.min(0.04, (now - lastTime) / 1000) : 0;
  lastTime = now;
  if (mode === 'intro') {
    updateIntroFlight(dt);
  } else {
    update(dt);
  }
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
    hangarRig = selectedRig;
    try {
      localStorage.setItem('low-orbit-rig', selectedRig);
    } catch {}
    syncRigButtons();
    syncMetaUi();
    introShip.trails = [[], []];
    draw();
  });
}

action.addEventListener('click', () => {
  if (mode === 'paused') setMode('playing');
  else launch();
});
restartMenu.addEventListener('click', () => setMode('intro'));
pauseButton.addEventListener('click', () => {
  if (playerDying <= 0) setMode('paused');
});
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
  if (manual.open || hangar.open) return;
  if (e.target.closest?.('input, summary, button, a') && !['Escape', 'KeyP'].includes(e.code)) return;

  if ((e.code === 'KeyP' || e.code === 'Escape') && (mode === 'playing' || mode === 'paused') && playerDying <= 0) {
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
window.addEventListener('pointermove', (e) => {
  if (mode !== 'intro') return;
  const bounds = canvas.getBoundingClientRect();
  if (bounds.width && bounds.height) {
    introCursorX = clamp((e.clientX - bounds.left) / bounds.width, 0, 1);
    introCursorY = clamp((e.clientY - bounds.top) / bounds.height, 0, 1);
    if (reducedMotion.matches) draw();
  }
});
canvas.addEventListener('pointermove', (e) => {
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
  if (mode === 'playing' && playerDying <= 0) setMode('paused');
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

// --- MODAL DIALOGS (Field Guide + Hangar Upgrades with closedby & top-layer exit fallbacks) ---
const manual = document.querySelector('#manual');
const hangar = document.querySelector('#hangar');
const hangarCoinsEl = document.querySelector('#hangar-coins');
const upgradeListEl = document.querySelector('#upgrade-list');
const refundBtn = document.querySelector('#refund-upgrades');

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

function wireModal(dialog) {
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeTopLayer(dialog);
  });
  dialog.querySelector('form')?.addEventListener('submit', (event) => {
    if (!supportsTopLayerExit()) {
      event.preventDefault();
      closeTopLayer(dialog);
    }
  });
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isContent =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!isContent) closeTopLayer(dialog);
    });
  }
}
wireModal(manual);
wireModal(hangar);

function renderRigPips() {
  for (const container of document.querySelectorAll('[data-pips]')) {
    const key = container.dataset.pips;
    const eff = getEffectiveRig(key);
    container.innerHTML = '';
    for (let i = 0; i < eff.hull; i++) {
      const pip = document.createElement('i');
      pip.className = 'hp';
      container.append(pip);
    }
    const sep = document.createElement('em');
    sep.setAttribute('aria-hidden', 'true');
    container.append(sep);
    for (let i = 0; i < eff.shields; i++) {
      const pip = document.createElement('i');
      pip.className = 'sp';
      container.append(pip);
    }
    container.setAttribute('aria-label', `${eff.hull} hull, ${eff.shields} shields`);
  }
}

function canAffordAnyUpgrade() {
  const shipUpgrades = meta.ships[selectedRig] || emptyShipUpgrades();
  return UPGRADE_DEFS.some((def) => {
    const lvl = shipUpgrades[def.id] || 0;
    return lvl < def.costs.length && meta.coins >= def.costs[lvl];
  });
}

// Render tiny ship icons inside the per-ship Hangar tabs
for (const thumb of document.querySelectorAll('.tab-preview')) {
  const c = thumb.getContext('2d');
  c.save();
  c.translate(32, 32);
  c.scale(0.5, 0.5);
  drawInterceptor(c, thumb.dataset.ship);
  c.restore();
}

for (const tab of document.querySelectorAll('.hangar-tab')) {
  tab.addEventListener('click', () => {
    hangarRig = tab.dataset.tab;
    renderUpgrades();
  });
}

function renderUpgrades() {
  hangarCoinsEl.textContent = meta.coins.toLocaleString();
  for (const tab of document.querySelectorAll('.hangar-tab')) {
    tab.setAttribute('aria-selected', String(tab.dataset.tab === hangarRig));
  }
  const shipUpgrades = meta.ships[hangarRig] || emptyShipUpgrades();
  upgradeListEl.innerHTML = '';
  let totalSpent = 0;

  for (const def of UPGRADE_DEFS) {
    const lvl = shipUpgrades[def.id] || 0;
    for (let i = 0; i < lvl; i++) totalSpent += def.costs[i];
    const maxed = lvl >= def.costs.length;
    const cost = maxed ? 0 : def.costs[lvl];
    const affordable = !maxed && meta.coins >= cost;

    const row = document.createElement('div');
    row.className = 'upgrade-row';

    const info = document.createElement('div');
    info.className = 'upgrade-info';
    info.innerHTML = `<strong>${def.name}</strong><p>${def.desc}</p>`;

    const pips = document.createElement('div');
    pips.className = 'upgrade-pips';
    for (let i = 0; i < def.costs.length; i++) {
      const pip = document.createElement('i');
      if (i < lvl) pip.classList.add('filled');
      pips.append(pip);
    }
    info.append(pips);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'buy-btn' + (maxed ? ' maxed' : '');
    btn.disabled = maxed || !affordable;
    btn.innerHTML = maxed ? 'MAXED' : `<i class="coin-dot" aria-hidden="true"></i>${cost}`;
    if (!maxed) {
      btn.addEventListener('click', () => {
        if (meta.coins < cost) return;
        meta.coins -= cost;
        meta.ships[hangarRig][def.id] = lvl + 1;
        saveMeta();
        sound.uiBuy();
        syncMetaUi();
        renderUpgrades();
      });
    }

    row.append(info, btn);
    upgradeListEl.append(row);
  }
  refundBtn.disabled = totalSpent === 0;
  refundBtn.textContent = `Refund ${RIGS[hangarRig].name} (${totalSpent} coins)`;
}

function syncMetaUi() {
  coinBankEl.textContent = meta.coins.toLocaleString();
  upgradeDot.hidden = !canAffordAnyUpgrade();
  renderRigPips();
}

function openHangar() {
  hangarRig = selectedRig;
  renderUpgrades();
  hangar.showModal();
}

refundBtn.addEventListener('click', () => {
  const shipUpgrades = meta.ships[hangarRig];
  if (!shipUpgrades) return;
  let refund = 0;
  for (const def of UPGRADE_DEFS) {
    const lvl = shipUpgrades[def.id] || 0;
    for (let i = 0; i < lvl; i++) refund += def.costs[i];
    shipUpgrades[def.id] = 0;
  }
  if (!refund) return;
  meta.coins += refund;
  saveMeta();
  sound.uiBuy();
  syncMetaUi();
  renderUpgrades();
});

document.querySelector('#guide-open').addEventListener('click', () => manual.showModal());
hangarOpenBtn.addEventListener('click', openHangar);
coinBankBtn.addEventListener('click', () => {
  if (mode !== 'playing') openHangar();
});
syncMetaUi();

for (const preview of manual.querySelectorAll('[data-craft]')) {
  drawFoe(preview.getContext('2d'), { kind: preview.dataset.craft, x: 44, y: 44, r: 30, fireIn: 2, age: 0 });
}

// Instant launch into live orbital canvas — zero artificial delay!
loadPlanets(true, draw);
resize();
startIntro();
