import { connectFlightPassage } from '../assets/sky/flight-passage.js';
import {
  PALETTE,
  SHIP_SKINS,
  getSkinAccent,
  CUSTOM_MAX_POWER,
  CUSTOM_PARTS,
  DEFAULT_CUSTOM_BUILD,
  computeCustomPower,
  encodeCustomShip,
  formatShareCode,
  parseCustomCode,
  computeCustomStats,
  drawSpaceBackdrop,
  drawPlanets,
  loadPlanets,
  getSector,
  getSectorName,
  getSectorHazard,
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
  getBossLaserTethers,
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

// Four genuinely distinct flight rigs (3 presets + modular Custom Ship Forge!)
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
    fireRate: 0.16,
    accent: '#79e3d5',
    weaponKind: 'kestrel',
    perk: 'kestrel',
    heatMult: 1,
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
    fireRate: 0.14,
    accent: '#ffd18a',
    weaponKind: 'falcon',
    perk: 'falcon',
    heatMult: 1,
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
    fireRate: 0.2,
    accent: '#9be9ff',
    weaponKind: 'aegis',
    perk: 'aegis',
    heatMult: 1,
  },
  custom: {
    ...computeCustomStats(DEFAULT_CUSTOM_BUILD),
    novaRadius: 270,
  },
};

// Persistent Coin Bank & Per-Ship Upgrades!
const UPGRADE_DEFS = [
  {
    id: 'weapon',
    name: 'Starting Firepower',
    desc: 'Start runs at MK II → MK VI (homing seekers at MK IV, piercing bolts at MK V, twin lances at MK VI).',
    costs: [180, 420, 820, 1450, 2300],
  },
  {
    id: 'hull',
    name: 'Reinforced Hull',
    desc: '+1 permanent red Hull armor block per level for this ship.',
    costs: [200, 520, 1050],
  },
  {
    id: 'shield',
    name: 'Shield Capacitors',
    desc: '+1 rechargeable Shield block per level for this ship.',
    costs: [180, 460, 920],
  },
  {
    id: 'thruster',
    name: 'Thruster & Dash',
    desc: '+9% speed and -14% Phase Dash cooldown per level.',
    costs: [150, 380, 780],
  },
  {
    id: 'nova',
    name: 'Nova & Magnet Core',
    desc: '+20% starting Nova charge and +35% wider loot magnet per level.',
    costs: [160, 400, 820],
  },
  {
    id: 'cooling',
    name: 'Cryo Cooling Core',
    desc: 'Reduces weapon heat buildup & boosts cooling per level. Level 4 eliminates overheating completely.',
    costs: [900, 2100, 4200, 7500],
  },
];

const MILESTONE_DEFS = [
  { id: 'sector2', label: 'Reach Sector 02 (Caldera Belt)', reward: 75 },
  { id: 'sector3', label: 'Reach Sector 03 (Opal Expanse)', reward: 120 },
  { id: 'bosses3', label: 'Defeat 3 Flagships (total)', reward: 100 },
  { id: 'flawless', label: 'Flawless Boss Clear (no hit)', reward: 150 },
  { id: 'combo5', label: 'Reach ×5.0 Combo Multiplier', reward: 90 },
  { id: 'wave10', label: 'Reach Wave 10', reward: 160 },
];

const emptyShipUpgrades = () => ({ weapon: 0, hull: 0, shield: 0, thruster: 0, nova: 0, cooling: 0 });
let meta = {
  coins: 0,
  overclock: false,
  customBuild: { ...DEFAULT_CUSTOM_BUILD },
  ships: {
    kestrel: emptyShipUpgrades(),
    falcon: emptyShipUpgrades(),
    aegis: emptyShipUpgrades(),
    custom: emptyShipUpgrades(),
  },
  skins: {
    kestrel: ['standard'],
    falcon: ['standard'],
    aegis: ['standard'],
    custom: ['standard'],
  },
  equippedSkin: {
    kestrel: 'standard',
    falcon: 'standard',
    aegis: 'standard',
    custom: 'standard',
  },
  records: {
    bestWave: 1,
    bestSector: 1,
    bossesDowned: 0,
    flawlessBosses: 0,
  },
  milestones: {},
};
try {
  const raw = JSON.parse(localStorage.getItem('low-orbit-meta') || 'null');
  if (raw && typeof raw === 'object') {
    meta.coins = Math.max(0, Math.floor(Number(raw.coins) || 0));
    meta.overclock = Boolean(raw.overclock);
    if (raw.customBuild && typeof raw.customBuild === 'object') {
      const candidate = {
        nose: Math.max(0, Math.min(2, Math.floor(Number(raw.customBuild.nose) || 0))),
        wings: Math.max(0, Math.min(3, Math.floor(Number(raw.customBuild.wings) || 0))),
        weapon: Math.max(0, Math.min(3, Math.floor(Number(raw.customBuild.weapon) || 0))),
        engine: Math.max(0, Math.min(3, Math.floor(Number(raw.customBuild.engine) || 0))),
        paint: Math.max(0, Math.min(5, Math.floor(Number(raw.customBuild.paint) || 0))),
      };
      if (computeCustomPower(candidate) <= CUSTOM_MAX_POWER) {
        meta.customBuild = candidate;
      }
    }
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
      for (const def of UPGRADE_DEFS) {
        meta.ships.kestrel[def.id] = Math.max(
          0,
          Math.min(def.costs.length, Math.floor(Number(raw.upgrades[def.id]) || 0)),
        );
      }
    }
    if (raw.skins && typeof raw.skins === 'object') {
      const validIds = new Set(SHIP_SKINS.map((s) => s.id));
      for (const shipKey of Object.keys(RIGS)) {
        const owned = Array.isArray(raw.skins[shipKey]) ? raw.skins[shipKey].filter((id) => validIds.has(id)) : [];
        meta.skins[shipKey] = Array.from(new Set(['standard', ...owned]));
      }
    }
    if (raw.equippedSkin && typeof raw.equippedSkin === 'object') {
      for (const shipKey of Object.keys(RIGS)) {
        const eq = raw.equippedSkin[shipKey];
        if (meta.skins[shipKey].includes(eq)) meta.equippedSkin[shipKey] = eq;
      }
    }
    if (raw.records && typeof raw.records === 'object') {
      meta.records.bestWave = Math.max(1, Math.floor(Number(raw.records.bestWave) || 1));
      meta.records.bestSector = Math.max(1, Math.floor(Number(raw.records.bestSector) || 1));
      meta.records.bossesDowned = Math.max(0, Math.floor(Number(raw.records.bossesDowned) || 0));
      meta.records.flawlessBosses = Math.max(0, Math.floor(Number(raw.records.flawlessBosses) || 0));
    }
    if (raw.milestones && typeof raw.milestones === 'object') {
      for (const m of MILESTONE_DEFS) {
        if (raw.milestones[m.id]) meta.milestones[m.id] = true;
      }
    }
  }
} catch {}

function saveMeta() {
  try {
    localStorage.setItem('low-orbit-meta', JSON.stringify(meta));
  } catch {}
}

function getActiveCustomBuild() {
  return forgeActive && forgeDraft ? forgeDraft : meta.customBuild;
}

function getBaseRig(key = selectedRig) {
  if (key === 'custom') {
    return { ...computeCustomStats(getActiveCustomBuild()), novaRadius: 270 };
  }
  return RIGS[key] || RIGS.kestrel;
}

function getRigAccent(key = selectedRig) {
  const base = getBaseRig(key);
  if (key === 'custom') return base.accent;
  return getSkinAccent(meta.equippedSkin[key] || 'standard', base.accent);
}

function completeMilestone(id) {
  if (meta.milestones[id]) return;
  const def = MILESTONE_DEFS.find((m) => m.id === id);
  if (!def) return;
  meta.milestones[id] = true;
  meta.coins += def.reward;
  if (mode === 'playing') runCoins += def.reward;
  saveMeta();
  sound.effect('overshield');
  if (mode === 'playing') {
    popups.push({
      x: w * 0.5,
      y: Math.max(110, player.y - 46),
      text: `MILESTONE +${def.reward} COINS`,
      color: PALETTE.gold,
      life: 1.5,
      maxLife: 1.5,
      size: 14,
    });
  }
}

function getEffectiveRig(key = selectedRig) {
  const base = getBaseRig(key);
  const u = meta.ships[key] || emptyShipUpgrades();
  const coolLvl = clamp(u.cooling || 0, 0, 4);
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
    heatScale: [1, 0.78, 0.56, 0.34, 0][coolLvl],
    coolScale: [1, 1.2, 1.45, 1.75, 2.5][coolLvl],
    noOverheat: coolLvl >= 4,
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
  sound.uiClick();
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
const overclockHudBadge = document.querySelector('#overclock-hud-badge');
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
const rapidBadgeEl = document.querySelector('#rapid-badge');
const heatLabelEl = document.querySelector('#heat-label');
const heatBlockEl = document.querySelector('#heat-block');
const heatFillEl = document.querySelector('#heat-fill');
const heatPctEl = document.querySelector('#heat-pct');
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
let runIsNewBest = false;
let runShip = 'kestrel';
let runOverclock = false;
let runDuration = 0;

// Persistent anonymous pilot profile for Global Leaderboard (only submits on personal best!)
function loadLbProfile() {
  let profile = { playerId: '', name: '', submittedBest: 0, submittedShip: 'kestrel' };
  try {
    const raw = JSON.parse(localStorage.getItem('low-orbit-lb-profile') || '{}');
    if (raw && typeof raw === 'object') {
      if (typeof raw.playerId === 'string' && raw.playerId.length >= 8) profile.playerId = raw.playerId;
      if (typeof raw.name === 'string') profile.name = raw.name;
      if (Number.isFinite(raw.submittedBest)) profile.submittedBest = Math.max(0, Math.floor(raw.submittedBest));
      if (typeof raw.submittedShip === 'string') profile.submittedShip = raw.submittedShip;
    }
  } catch {}
  if (!profile.playerId) {
    profile.playerId =
      globalThis.crypto?.randomUUID?.().replace(/-/g, '') ||
      `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
    try {
      localStorage.setItem('low-orbit-lb-profile', JSON.stringify(profile));
    } catch {}
  }
  return profile;
}
const lbProfile = loadLbProfile();
function saveLbProfile() {
  try {
    localStorage.setItem('low-orbit-lb-profile', JSON.stringify(lbProfile));
  } catch {}
}
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
let rapidFireTime = 0;
let weaponDropCooldown = 0;
let overshieldTime = 0;
let overshieldBossRammed = false;
let railBeamTime = 0;
let railBeamTick = 0;
let reflectShieldTime = 0;
let bulletTime = 0;
let bossHitTaken = false;
let ionWind = 0;
let meteorTimer = 4.5;
let riftWell = null;
let riftTimer = 4.0;
let empWave = null;
let empTimer = 5.5;
let runCoins = 0;
let missileTimer = 0;
let weaponHeat = 0;
let weaponOverheated = false;
let heatCoolDelay = 0;
let ventAttempted = false;
let ventBoostTime = 0;

let distance = 0;
let introTime = 0;
let introCursorX = 0.5;
let introCursorY = 0.5;
let introShip = { x: 0, y: 0, vx: 0, vy: 0, heading: 0.72, roll: 0, muzzle: 0, recoil: 0, trails: [[], []], ready: false };
let forgeActive = false;
let forgeBlend = 0;
let forgeDraft = null;
let forgePushedHistory = false;
let suppressNextForgePop = false;
let forgeDemoShots = [];
let forgeDemoTimer = 0;
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
  const dimBonus = sectorIndex % 8 === 7 ? 1.25 : 1;
  const mult = getMultiplier() * (meta.overclock ? 1.35 : 1) * dimBonus;
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
  if (mult >= 5) completeMilestone('combo5');
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
  const accent = getRigAccent(variant);
  const skinId = meta.equippedSkin[variant] || 'standard';
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
  flame.addColorStop(0.3, opts.overdrive ? '#ffba73e0' : accent + 'dc');
  flame.addColorStop(1, accent + '00');
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

  // Full 2.5D longitudinal roll with equipped livery skin (or modular Custom Ship!)
  const drawVariant = variant === 'custom' ? encodeCustomShip(getActiveCustomBuild()) : variant;
  drawBankedShip(ctx, drawVariant, roll, opts.tier || 1, accent, variant === 'custom' ? 'standard' : skinId);

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
  const pan = intro ? Math.sin(introTime * 0.14) * 0.12 : player.x / w - 0.5;
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

  // Selected ship actively patrols across Main Menu space — and flies left into the live Blueprint Forge dock!
  if (intro || forgeActive || forgeBlend > 0.01) {
    if (!introShip.ready && w && h) {
      introShip.x = w * 0.72;
      introShip.y = h * 0.24;
      introShip.ready = true;
    }
    const accent = getRigAccent(selectedRig);
    const desktopForge = w >= 860;
    const baseSize = Math.min(w * (w < h ? 0.14 : 0.085), h * 0.125, 84);
    const forgeSize = desktopForge ? Math.min(w * 0.16, h * 0.27, 174) : Math.min(w * 0.32, h * 0.19, 126);
    const size = baseSize + (forgeSize - baseSize) * forgeBlend;

    // Sweeping wingtip contrails (fade gently as the ship settles into holographic inspection dock)
    const trailAlpha = clamp(1 - forgeBlend * 1.15, 0, 1);
    if (trailAlpha > 0.02) {
      for (const trail of introShip.trails) {
        if (trail.length < 2) continue;
        for (let i = 1; i < trail.length; i++) {
          const a = i / trail.length;
          ctx.strokeStyle = accent;
          ctx.globalAlpha = a * 0.34 * trailAlpha;
          ctx.lineWidth = 1 + a * 2.4;
          ctx.beginPath();
          ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
          ctx.lineTo(trail[i].x, trail[i].y);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }

    // Live holographic orbital reticle & scan rings around the docked ship
    if (forgeBlend > 0.03) {
      ctx.save();
      ctx.translate(introShip.x, introShip.y);
      const rOuter = size * 0.76 * (0.7 + 0.3 * forgeBlend);
      const rInner = size * 0.56 * (0.7 + 0.3 * forgeBlend);

      const halo = ctx.createRadialGradient(0, 0, size * 0.1, 0, 0, rOuter * 1.2);
      halo.addColorStop(0, accent + '26');
      halo.addColorStop(1, accent + '00');
      ctx.globalAlpha = forgeBlend;
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, 0, rOuter * 1.2, 0, TAU);
      ctx.fill();

      // Rotating outer blueprint ring
      ctx.save();
      ctx.rotate(introTime * 0.22);
      ctx.strokeStyle = `rgba(121, 227, 213, ${0.3 * forgeBlend})`;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([7, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, rOuter, 0, TAU);
      ctx.stroke();
      ctx.restore();

      // Inner calibration ring + subtle crosshairs
      ctx.strokeStyle = `rgba(121, 227, 213, ${0.18 * forgeBlend})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, rInner, 0, TAU);
      ctx.moveTo(-rOuter * 1.08, 0);
      ctx.lineTo(-rInner * 0.85, 0);
      ctx.moveTo(rInner * 0.85, 0);
      ctx.lineTo(rOuter * 1.08, 0);
      ctx.moveTo(0, -rOuter * 1.08);
      ctx.lineTo(0, -rInner * 0.85);
      ctx.moveTo(0, rInner * 0.85);
      ctx.lineTo(0, rOuter * 1.08);
      ctx.stroke();
      ctx.restore();
    }

    // Live Forge weapon test-fire projectiles shooting straight out of the docked ship!
    if (forgeDemoShots.length > 0) {
      for (const s of forgeDemoShots) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(Math.atan2(s.vx, -s.vy));
        if (s.homing) {
          // Glowing thruster streak behind seeker missile
          ctx.globalCompositeOperation = 'lighter';
          const mg = ctx.createLinearGradient(0, 4, 0, 26);
          mg.addColorStop(0, 'rgba(255, 210, 138, 0.85)');
          mg.addColorStop(1, 'rgba(255, 160, 88, 0)');
          ctx.fillStyle = mg;
          ctx.fillRect(-2.2, 4, 4.4, 22);
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = '#ffd18a';
          ctx.beginPath();
          ctx.moveTo(0, -10);
          ctx.lineTo(4, 5);
          ctx.lineTo(0, 2.5);
          ctx.lineTo(-4, 5);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#fff9e6';
          ctx.fillRect(-1.2, -7.5, 2.4, 7.5);
        } else if (s.pierce > 0) {
          ctx.globalAlpha = 0.92;
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = 'rgba(255, 212, 112, 0.36)';
          ctx.fillRect(-5.6, -18, 11.2, 36);
          ctx.fillStyle = '#ffcb6b';
          ctx.fillRect(-2.6, -15, 5.2, 30);
          ctx.fillStyle = '#fffdf2';
          ctx.fillRect(-1.2, -12, 2.4, 20);
        } else {
          ctx.globalAlpha = 0.9;
          ctx.globalCompositeOperation = 'lighter';
          const bw = s.heavy ? 5.4 : 2.8;
          const bh = s.heavy ? 22 : 18;
          ctx.fillStyle = s.heavy ? 'rgba(155, 233, 255, 0.36)' : 'rgba(121, 227, 213, 0.34)';
          ctx.fillRect(-bw * 1.5, -bh * 0.55, bw * 3.0, bh * 1.15);
          ctx.fillStyle = s.heavy ? '#9be9ff' : '#7ae2f2';
          ctx.fillRect(-bw * 0.68, -bh * 0.5, bw * 1.36, bh);
          ctx.fillStyle = '#fffaf0';
          ctx.fillRect(-bw * 0.3, -bh * 0.42, bw * 0.6, bh * 0.54);
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    paintShip(introShip.x, introShip.y, size, introShip.heading, forgeBlend > 0.5 ? 1.15 : 1.35, selectedRig, {
      tier: getEffectiveRig().startWeapon,
      roll: introShip.roll,
      muzzle: introShip.muzzle,
      recoil: introShip.recoil,
    });

    // Progressive glowing schematic leader lines radiating OUT FROM THE SHIP to visible callout cards (desktop & mobile!)
    if (forgeBlend > 0.08 && forgeNodesEl) {
      const cRect = canvas.getBoundingClientRect();
      const sx = cRect.width ? w / cRect.width : 1;
      const sy = cRect.height ? h / cRect.height : 1;
      const slotOrder = ['nose', 'weapon', 'wings', 'engine'];
      ctx.save();
      for (let idx = 0; idx < slotOrder.length; idx++) {
        const slotKey = slotOrder[idx];
        const spec = FORGE_SLOTS[slotKey];
        if (activeForgeSlot && slotKey !== activeForgeSlot) continue;
        const nodeEl = forgeNodesEl.querySelector(`.forge-node[data-slot="${slotKey}"]`);
        if (!spec || !nodeEl) continue;

        const rawP = clamp((forgeBlend - 0.08 - idx * 0.055) / 0.56, 0, 1);
        if (rawP <= 0) continue;
        const p = 1 - Math.pow(1 - rawP, 3);

        const isActive = slotKey === activeForgeSlot;
        const nRect = nodeEl.getBoundingClientRect();
        if (!nRect.width || !nRect.height) continue;
        const x0 = introShip.x + spec.anchor[0] * size;
        const y0 = introShip.y + spec.anchor[1] * size;

        let x1, y1, x2, y2;
        if (desktopForge) {
          const isLeft = spec.side === 'left';
          x2 = isLeft ? (nRect.right - cRect.left) * sx + 3 : (nRect.left - cRect.left) * sx - 3;
          y2 = (nRect.top - cRect.top + nRect.height * 0.5) * sy;
          const elbowStep = Math.min(62, Math.max(24, Math.abs(y2 - y0) * 0.72));
          x1 = isLeft ? Math.max(x2 + 22, x0 - elbowStep - 24) : Math.min(x2 - 22, x0 + elbowStep + 24);
          y1 = y2;
        } else {
          // Mobile radial layout: top row cards connect on their bottom edge; bottom row / active card on top edge!
          const isTopCard = !isActive && (slotKey === 'nose' || slotKey === 'weapon');
          const pinFrac = isActive ? 0.28 : slotKey === 'nose' || slotKey === 'wings' ? 0.62 : 0.38;
          x2 = (nRect.left - cRect.left + nRect.width * pinFrac) * sx;
          y2 = isTopCard
            ? (nRect.bottom - cRect.top) * sy + 3
            : (nRect.top - cRect.top) * sy - 3;
          x1 = x2;
          y1 = y0 + (y2 - y0) * 0.52;
        }

        const seg1 = Math.hypot(x1 - x0, y1 - y0);
        const seg2 = Math.hypot(x2 - x1, y2 - y1);
        const totalLen = seg1 + seg2;
        const drawLen = totalLen * p;

        ctx.save();
        ctx.strokeStyle = isActive ? `rgba(121, 227, 213, ${0.95 * rawP})` : `rgba(121, 227, 213, ${0.42 * rawP})`;
        ctx.lineWidth = isActive ? 2.1 : 1.3;
        ctx.setLineDash(isActive ? [] : [5, 4]);
        if (isActive) {
          ctx.shadowColor = 'rgba(121, 227, 213, 0.78)';
          ctx.shadowBlur = 10;
        }
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        if (drawLen <= seg1) {
          const t1 = seg1 > 0 ? drawLen / seg1 : 0;
          ctx.lineTo(x0 + (x1 - x0) * t1, y0 + (y1 - y0) * t1);
        } else {
          ctx.lineTo(x1, y1);
          const t2 = seg2 > 0 ? (drawLen - seg1) / seg2 : 1;
          ctx.lineTo(x1 + (x2 - x1) * t2, y1 + (y2 - y1) * t2);
        }
        ctx.stroke();
        ctx.restore();

        // Target reticle dot locked onto the actual part of the live ship!
        ctx.beginPath();
        ctx.arc(x0, y0, isActive ? 7.5 : 5, 0, TAU);
        ctx.strokeStyle = isActive ? `rgba(255, 214, 107, ${0.88 * rawP})` : `rgba(121, 227, 213, ${0.4 * rawP})`;
        ctx.lineWidth = 1.25;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x0, y0, isActive ? 3.6 : 2.7, 0, TAU);
        ctx.fillStyle = isActive ? '#ffe18c' : '#0b1424';
        ctx.fill();
        ctx.strokeStyle = isActive ? '#fff7d6' : `rgba(121, 227, 213, ${0.8 * rawP})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // Crisp square connector pin at the callout card edge once line arrives
        if (p > 0.92) {
          ctx.fillStyle = isActive ? '#79e3d5' : 'rgba(121, 227, 213, 0.62)';
          ctx.fillRect(x2 - 2.5, y2 - 2.5, 5, 5);
        }
      }
      ctx.restore();
    }

    if (intro) {
      ctx.restore();
      return;
    }
  }

  // Sector 3 (Opal Expanse) subtle visual ion drift current streaks
  if (sectorIndex % 4 === 2 && !warp && Math.abs(ionWind) > 6) {
    ctx.save();
    ctx.strokeStyle = 'rgba(196, 172, 255, 0.14)';
    ctx.lineWidth = 1.2;
    const dir = Math.sign(ionWind);
    const shift = ((time * ionWind * 2.2) % w + w) % w;
    for (let i = 0; i < 14; i++) {
      const sy = ((i + 0.5) / 14) * h;
      const sx = (((i * 193) + shift) % (w + 120)) - 60;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + dir * 46, sy + 6);
      ctx.stroke();
    }
    ctx.restore();
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

  // Dimension Hazards: Astral Rift Gravity Anomaly + Iron Graveyard EMP Pulse Storm!
  if (riftWell && mode === 'playing') {
    const fade = Math.min(1, riftWell.life * 1.4, (riftWell.maxLife - riftWell.life) * 2.5);
    ctx.save();
    ctx.translate(riftWell.x, riftWell.y);
    ctx.globalAlpha = fade;
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, 8, 0, 0, riftWell.r);
    g.addColorStop(0, 'rgba(116, 255, 232, 0.34)');
    g.addColorStop(0.5, 'rgba(138, 86, 240, 0.18)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, riftWell.r, 0, TAU);
    ctx.fill();
    ctx.rotate(time * 2.4);
    ctx.strokeStyle = 'rgba(134, 255, 236, 0.58)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.arc(0, 0, riftWell.r * 0.62, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
  if (empWave && mode === 'playing') {
    const gapL = empWave.gapX - empWave.gapHalf;
    const gapR = empWave.gapX + empWave.gapHalf;
    ctx.save();
    if (empWave.warn > 0) {
      const p = 1 - empWave.warn / 1.25;
      ctx.strokeStyle = `rgba(255, 206, 112, ${0.32 + p * 0.65})`;
      ctx.lineWidth = 1.5 + p * 2;
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      if (gapL > 0) {
        ctx.moveTo(0, empWave.y);
        ctx.lineTo(gapL, empWave.y);
      }
      if (gapR < w) {
        ctx.moveTo(gapR, empWave.y);
        ctx.lineTo(w, empWave.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      // Highlight open safe corridor in cyan!
      ctx.strokeStyle = `rgba(121, 227, 213, ${0.45 + p * 0.5})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(gapL, empWave.y - 10);
      ctx.lineTo(gapL, empWave.y + 10);
      ctx.moveTo(gapR, empWave.y - 10);
      ctx.lineTo(gapR, empWave.y + 10);
      ctx.stroke();
      ctx.fillStyle = '#98ffdc';
      ctx.font = '700 10px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SAFE GAP', empWave.gapX, Math.max(24, empWave.y - 9));
    } else {
      ctx.globalCompositeOperation = 'lighter';
      const drawSeg = (x1, x2) => {
        if (x2 <= x1) return;
        ctx.fillStyle = 'rgba(121, 227, 213, 0.24)';
        ctx.fillRect(x1, empWave.y - 14, x2 - x1, 28);
        ctx.fillStyle = 'rgba(255, 218, 130, 0.85)';
        ctx.fillRect(x1, empWave.y - 3, x2 - x1, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x1, empWave.y - 1.2, x2 - x1, 2.4);
      };
      drawSeg(0, gapL);
      drawSeg(gapR, w);
      // Glowing emitter nodes framing the safe gap
      ctx.fillStyle = '#98ffdc';
      ctx.beginPath();
      ctx.arc(gapL, empWave.y, 5, 0, TAU);
      ctx.arc(gapR, empWave.y, 5, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  // Healer Repair Drone multi-target emerald repair beams + heal pulse rings!
  for (const e of enemies) {
    if (e.healFlash > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, e.healFlash * 3.5);
      ctx.strokeStyle = '#7ef2a8';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r + 6 + (0.28 - e.healFlash) * 32, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = '#b8ffcf';
      ctx.font = '700 11px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('+', e.x, e.y - e.r - 12);
      ctx.restore();
    }
    if (e.dead || e.kind !== 'healer') continue;
    const targets = e.healTargets?.length ? e.healTargets : e.healTarget ? [e.healTarget] : [];
    for (const t of targets) {
      if (!t || t.dead) continue;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(92, 255, 168, 0.38)';
      ctx.lineWidth = 8.5;
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(t.x, t.y);
      ctx.stroke();
      ctx.strokeStyle = '#d4ffe6';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([6, 6]);
      ctx.lineDashOffset = -time * 58;
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(t.x, t.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  // Laser-tethered enemy plasma links (connecting synchronized gate drones!)
  for (const e of enemies) {
    const p = e.linkPartner;
    if (!p || e.dead || p.dead || e.y < -12 || p.y < -12) continue;
    const armed = (e.tetherWarmup || 0) <= 0;
    ctx.save();
    if (!armed) {
      const prog = 1 - clamp((e.tetherWarmup || 0) / 1.05, 0, 1);
      ctx.strokeStyle = `rgba(255, 130, 175, ${0.25 + prog * 0.55})`;
      ctx.lineWidth = 1.2 + prog * 1.8;
      ctx.setLineDash([7, 7]);
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      const pulse = 0.8 + 0.2 * Math.sin(time * 42);
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(255, 76, 138, 0.34)';
      ctx.lineWidth = 14 * pulse;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 140, 195, 0.85)';
      ctx.lineWidth = 5 * pulse;
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();

      // Crackling electric filament along the tether
      ctx.strokeStyle = '#fff5fa';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      const segs = 7;
      for (let i = 1; i < segs; i++) {
        const t = i / segs;
        const jx = (Math.sin(time * 38 + i * 2.7) * 4.5);
        const jy = (Math.cos(time * 34 + i * 3.1) * 4.5);
        ctx.lineTo(e.x + (p.x - e.x) * t + jx, e.y + (p.y - e.y) * t + jy);
      }
      ctx.lineTo(p.x, p.y);
      ctx.stroke();

      // Emitter rings on both nodes
      ctx.strokeStyle = '#ff99be';
      ctx.lineWidth = 1.6;
      for (const node of [e, p]) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r * 0.55, 0, TAU);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

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
    else if (enemy.kind === 'rock') drawRock(ctx, enemy, sectorIndex);
    else if (enemy.kind === 'mine') drawMine(ctx, enemy);
    else if (enemy.kind === 'boss') drawBoss(ctx, enemy, w, h);
    else drawFoe(ctx, enemy, sectorIndex);
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

  // PASS 1: Friendly projectiles (subtle translucency on high MK tiers so incoming enemy fire stays 100% readable!)
  for (const s of shots) {
    if (s.hostile) continue;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(Math.atan2(s.vx, -s.vy));

    if (s.homing) {
      ctx.globalAlpha = 0.92;
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

    if (s.reflected) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(130, 245, 255, 0.45)';
      ctx.beginPath();
      ctx.arc(0, 0, 8.5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#9bf3f7';
      ctx.fillRect(-2.4, -10, 4.8, 20);
      ctx.fillStyle = '#fffef4';
      ctx.fillRect(-1.1, -8, 2.2, 13);
      ctx.restore();
      continue;
    }

    if (s.pierce > 0) {
      ctx.globalAlpha = 0.86;
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255, 212, 112, 0.34)';
      ctx.fillRect(-4.6, -13, 9.2, 26);
      ctx.fillStyle = '#ffcb6b';
      ctx.fillRect(-2.2, -11, 4.4, 22);
      ctx.fillStyle = '#fffdf2';
      ctx.fillRect(-1, -9, 2, 14);
      ctx.restore();
      continue;
    }

    ctx.globalAlpha = weaponLevel >= 5 ? 0.68 : 0.8;
    ctx.globalCompositeOperation = 'lighter';
    const bw = s.heavy ? 4.2 : s.focused ? 2.5 : 2.0;
    const bh = s.focused ? 21 : s.heavy ? 16 : 14;
    ctx.fillStyle = s.color || (s.focused ? '#99f7ff48' : '#6fddff3a');
    ctx.fillRect(-bw * 1.5, -bh * 0.55, bw * 3.0, bh * 1.12);
    ctx.fillStyle = s.overdrive ? '#ffcf7d' : s.focused ? '#96f6ff' : '#7ae2f2';
    ctx.fillRect(-bw * 0.68, -bh * 0.5, bw * 1.36, bh);
    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(-bw * 0.3, -bh * 0.42, bw * 0.6, bh * 0.54);
    ctx.restore();
  }

  // Kestrel Signature Perk: Full-Screen Forward Orbital Rail-Beam during Nova!
  if (railBeamTime > 0 && hull > 0 && playerDying <= 0) {
    const pulse = 0.85 + 0.15 * Math.sin(time * 54);
    const fade = Math.min(1, railBeamTime / 0.25);
    const bw = 22 * pulse * fade;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(121, 227, 213, ${0.24 * fade})`;
    ctx.fillRect(player.x - bw * 1.45, 0, bw * 2.9, player.y - 16);
    ctx.fillStyle = `rgba(175, 250, 245, ${0.65 * fade})`;
    ctx.fillRect(player.x - bw * 0.62, 0, bw * 1.24, player.y - 16);
    ctx.fillStyle = `rgba(255, 253, 244, ${0.95 * fade})`;
    ctx.fillRect(player.x - bw * 0.24, 0, bw * 0.48, player.y - 16);
    // Muzzle flare
    const g = ctx.createRadialGradient(player.x, player.y - 18, 2, player.x, player.y - 18, bw * 2.1);
    g.addColorStop(0, `rgba(255, 254, 245, ${0.9 * fade})`);
    g.addColorStop(1, 'rgba(121, 227, 213, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(player.x, player.y - 18, bw * 2.1, 0, TAU);
    ctx.fill();
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

  // Impact rings + crisp 4-point star contact glints
  for (const ring of impacts) {
    const progress = 1 - ring.life / ring.maxLife;
    ctx.save();
    if (ring.star) {
      const s = ring.radius * (0.55 + progress * 0.95);
      const a = 1 - progress;
      ctx.translate(ring.x, ring.y);
      ctx.rotate(ring.angle || 0);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a * 0.95;
      ctx.strokeStyle = ring.color || '#fff6dc';
      ctx.lineWidth = Math.max(0.8, (1 - progress) * 2.4);
      ctx.beginPath();
      ctx.moveTo(-s, 0);
      ctx.lineTo(s, 0);
      ctx.moveTo(0, -s);
      ctx.lineTo(0, s);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(1.2, (1 - progress) * 4.2), 0, TAU);
      ctx.fill();
    } else {
      ctx.globalAlpha = (1 - progress) * 0.78;
      ctx.strokeStyle = ring.color;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius * (0.35 + progress * 1.75), 0, TAU);
      ctx.lineWidth = Math.max(0.6, 2.2 - progress * 1.6);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Player ship — hidden during warp tunnel or after exploding in death sequence
  const hideForTunnel = warp && warp.phase === 'tunnel';
  if (hull > 0 && !hideForTunnel && playerDying <= 0) {
    const accent = getRigAccent(selectedRig);
    for (const trail of player.trails) {
      if (trail.length < 2) continue;
      ctx.beginPath();
      for (let i = 0; i < trail.length; i++) {
        const pt = trail[i];
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = overdriveTime > 0 ? 'rgba(255, 206, 128, 0.28)' : accent + '36';
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

    // Diegetic weapon thermal gauge arc directly around ship when running hot or overheated!
    if (weaponOverheated || weaponHeat >= 62) {
      const hFrac = clamp(weaponHeat / 100, 0, 1);
      const inSweet = weaponOverheated && !ventAttempted && weaponHeat >= 34 && weaponHeat <= 54;
      const blink = weaponOverheated ? 0.65 + 0.35 * Math.sin(time * 22) : 0.85;
      ctx.save();
      ctx.globalAlpha = blink;
      ctx.strokeStyle = inSweet ? '#98ffdc' : weaponOverheated ? '#ff4642' : weaponHeat >= 84 ? '#ff7d47' : '#ffbe78';
      ctx.lineWidth = inSweet ? 3.2 : weaponOverheated ? 2.6 : 2.0;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 28, -Math.PI * 0.84, -Math.PI * 0.84 + hFrac * Math.PI * 0.68);
      ctx.stroke();
      // Sweet-spot bracket on diegetic arc during Perfect Vent window
      if (weaponOverheated && !ventAttempted) {
        ctx.strokeStyle = inSweet ? '#ffffff' : 'rgba(121, 227, 213, 0.72)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(player.x, player.y, 32, -Math.PI * 0.84 + 0.34 * Math.PI * 0.68, -Math.PI * 0.84 + 0.54 * Math.PI * 0.68);
        ctx.stroke();
      }
      ctx.restore();
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

    // Aegis Signature Perk: Reflective Mirror Octagon Shield during Nova!
    if (reflectShieldTime > 0) {
      const blink = reflectShieldTime < 0.8 ? 0.45 + 0.55 * Math.sin(time * 28) : 1;
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.globalAlpha = blink;
      ctx.rotate(-time * 2.2);
      ctx.strokeStyle = '#9bf3f7';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * TAU) / 8;
        const rx = Math.cos(a) * 35;
        const ry = Math.sin(a) * 35;
        if (i === 0) ctx.moveTo(rx, ry);
        else ctx.lineTo(rx, ry);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = 'rgba(155, 243, 247, 0.1)';
      ctx.fill();
      ctx.restore();
    }

    // Focus hitbox core & graze ring (brighter tactical lock ring when Focus / LANCE is engaged!)
    const isFocusedDraw = preciseSteering();
    if (isFocusedDraw || pointer) {
      ctx.save();
      ctx.strokeStyle = isFocusedDraw ? 'rgba(150, 246, 255, 0.56)' : 'rgba(121, 227, 213, 0.25)';
      ctx.lineWidth = isFocusedDraw ? 1.5 : 1;
      ctx.beginPath();
      ctx.arc(player.x, player.y, isFocusedDraw ? 21 : 23, 0, TAU);
      ctx.stroke();

      if (isFocusedDraw) {
        // 4 crisp focus reticle brackets around hitbox
        ctx.strokeStyle = 'rgba(196, 255, 244, 0.85)';
        ctx.lineWidth = 1.4;
        for (let i = 0; i < 4; i++) {
          const a = (i * TAU) / 4 + Math.PI / 4;
          ctx.beginPath();
          ctx.moveTo(player.x + Math.cos(a) * 16, player.y + Math.sin(a) * 16);
          ctx.lineTo(player.x + Math.cos(a) * 23, player.y + Math.sin(a) * 23);
          ctx.stroke();
        }
      }

      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r, 0, TAU);
      ctx.strokeStyle = '#112633';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.fillStyle = isFocusedDraw ? '#e6fffb' : '#c4fff4d8';
      ctx.fill();
      ctx.restore();
    }

    if (immune > 0 && player.dashTime <= 0) {
      ctx.beginPath();
      ctx.arc(player.x, player.y, 23, 0, TAU);
      ctx.strokeStyle = '#9ff0f6';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }

  // PASS 2: Hostile bullets rendered ABOVE player lasers, sparks, and debris so enemy fire is ALWAYS crisp and readable!
  for (const s of shots) {
    if (!s.hostile) continue;
    ctx.save();
    ctx.translate(s.x, s.y);
    if (s.cluster) {
      // Exact locked radial detonation trajectory lines synchronized 1:1 with sub-orb burst angles & fuse!
      const count = s.clusterCount || 6;
      if (s.clusterAngle === undefined) s.clusterAngle = Math.atan2(s.vx, s.vy);
      if (s.clusterMaxFuse === undefined) s.clusterMaxFuse = Math.max(0.1, s.clusterFuse || 1.25);
      const baseA = s.clusterAngle;
      const prog = clamp(1 - (s.clusterFuse || 0) / s.clusterMaxFuse, 0, 1);
      const rayLen = 58 + prog * 96;

      ctx.save();
      ctx.setLineDash([6, 4]);
      ctx.lineDashOffset = -time * (30 + prog * 44);
      ctx.lineWidth = 1.25 + prog * 0.75;
      for (let i = 0; i < count; i++) {
        const a = baseA + (i / count) * TAU;
        const dx = Math.sin(a);
        const dy = Math.cos(a);
        const sx = dx * (s.r + 5);
        const sy = dy * (s.r + 5);
        const ex = dx * rayLen;
        const ey = dy * rayLen;
        const grad = ctx.createLinearGradient(sx, sy, ex, ey);
        grad.addColorStop(0, `rgba(255, 212, 134, ${0.46 + prog * 0.5})`);
        grad.addColorStop(0.75, `rgba(255, 138, 76, ${0.28 + prog * 0.38})`);
        grad.addColorStop(1, 'rgba(255, 118, 66, 0)');
        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        // Crisp directional indicator dot moving outward along exact burst lane
        ctx.setLineDash([]);
        const tipD = s.r + 16 + prog * 34;
        ctx.fillStyle = `rgba(255, 228, 158, ${0.5 + prog * 0.48})`;
        ctx.beginPath();
        ctx.arc(dx * tipD, dy * tipD, 1.9 + prog * 0.85, 0, TAU);
        ctx.fill();
        ctx.setLineDash([6, 4]);
      }
      ctx.setLineDash([]);

      // Synchronized detonation countdown ring filling 0 -> 100% right when shell explodes!
      ctx.strokeStyle = `rgba(255, 204, 118, ${0.48 + prog * 0.5})`;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, s.r + 5.5, -Math.PI / 2, -Math.PI / 2 + TAU * prog);
      ctx.stroke();

      // Mini HP bar once chipped by player fire so it clearly reads as shootable/destructible!
      if (s.clusterMaxHp && s.clusterHp < s.clusterMaxHp) {
        const bw = 20;
        const hpFrac = clamp(s.clusterHp / s.clusterMaxHp, 0, 1);
        ctx.fillStyle = 'rgba(10, 14, 24, 0.82)';
        ctx.fillRect(-bw * 0.5, -s.r - 12, bw, 3.2);
        ctx.fillStyle = '#ffe08a';
        ctx.fillRect(-bw * 0.5, -s.r - 12, bw * hpFrac, 3.2);
      }
      ctx.restore();
    }
    ctx.fillStyle = '#0e0814';
    ctx.beginPath();
    ctx.arc(0, 0, s.r + 2.0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = s.flash > 0 ? '#ffffff' : s.color || '#ff7d52';
    ctx.beginPath();
    ctx.arc(0, 0, s.r + 0.6, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#fff7e0';
    ctx.beginPath();
    ctx.arc(0, 0, s.r * 0.5, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  // Falcon Bullet-Time subtle edge shimmer
  if (bulletTime > 0 && mode === 'playing') {
    const a = Math.min(0.24, bulletTime * 0.45);
    const bt = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.34, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
    bt.addColorStop(0, 'rgba(121, 227, 213, 0)');
    bt.addColorStop(1, `rgba(121, 227, 213, ${a})`);
    ctx.fillStyle = bt;
    ctx.fillRect(0, 0, w, h);
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

function spawnHitFeedback(x, y, target, shot) {
  const heavyHit = Boolean(shot?.heavy || shot?.pierce > 0 || shot?.reflected || shot?.homing);
  const dmgProg = target?.maxHp ? clamp(1 - target.hp / target.maxHp, 0, 1) : 0.35;
  if (target) {
    const kMag = heavyHit ? 5.6 : 3.6;
    const sv = Math.hypot(shot?.vx || 0, shot?.vy || -1) || 1;
    target.hitPunch = 1;
    target.hitKickX = ((shot?.vx || 0) / sv) * kMag;
    target.hitKickY = ((shot?.vy || -1) / sv) * kMag;
    if (target.hpTrail === undefined) target.hpTrail = target.maxHp || target.hp;
  }
  const glintColor = shot?.pierce > 0 || shot?.overdrive ? '#ffdf8c' : shot?.heavy ? '#a8f0ff' : '#fff5d8';
  impacts.push({
    x,
    y,
    radius: heavyHit ? 12.5 : 8.5,
    color: glintColor,
    star: true,
    angle: between(-0.45, 0.45),
    life: 0.11,
    maxLife: 0.11,
  });
  const count = heavyHit ? 6 : 4;
  for (let k = 0; k < count; k++) {
    const spread = between(-1.15, 1.15);
    const spd = between(heavyHit ? 115 : 85, heavyHit ? 255 : 195);
    sparks.push({
      x,
      y,
      vx: Math.sin(spread) * spd,
      vy: Math.abs(Math.cos(spread)) * spd * 0.72 + between(-25, 45),
      life: between(0.12, heavyHit ? 0.25 : 0.2),
      color: k === 0 ? '#ffffff' : k % 2 === 0 ? glintColor : '#ffbc6b',
      w: heavyHit ? 2.1 : 1.65,
    });
  }
  addShake(heavyHit ? 0.72 : 0.32);
  sound.effect('impact', dmgProg);
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
    // Rarer MK weapon progression: diminishing chance per MK tier + pacing cooldown between W+ cells!
    const canDropWeapon = weaponLevel < 7 && weaponDropCooldown <= 0;
    const weaponChance = weaponLevel <= 2 ? 0.3 : weaponLevel <= 4 ? 0.22 : 0.16;
    if (canDropWeapon && roll < weaponChance) {
      kind = 'weapon';
      weaponDropCooldown = 12 + weaponLevel * 3.5;
    } else if (roll < 0.56) {
      kind = 'rapid';
    } else if (roll < 0.74) {
      kind = 'overshield';
    } else if (shields < maxShields && roll < 0.9) {
      kind = 'shield';
    } else {
      kind = 'nova';
    }
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
  impacts.push({ x: player.x, y: player.y, radius: 14, color: getRigAccent(selectedRig), life: 0.3, maxLife: 0.3 });

  // Falcon / Ion Afterburner Signature Perk: Phase Dash triggers 0.6s Bullet-Time + fires a 4-missile micro-seeker burst!
  if (rig.perk === 'falcon') {
    bulletTime = Math.max(bulletTime, 0.6);
    for (const ox of [-20, -9, 9, 20]) {
      shots.push({
        x: player.x + ox,
        y: player.y,
        r: 4.5,
        vx: Math.sign(ox) * 165,
        vy: -195,
        dmg: 1.5,
        hostile: false,
        homing: true,
        age: 0,
      });
    }
    sound.effect('missile');
    popups.push({
      x: player.x,
      y: player.y - 24,
      text: 'BULLET TIME',
      color: '#9bf3f7',
      life: 0.75,
      maxLife: 0.75,
      size: 12,
    });
  }
}

function triggerNovaPulse() {
  if (mode !== 'playing' || (warp && warp.phase !== 'collect') || novaCharge < 50) return;
  const rig = getBaseRig(selectedRig);
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

  // Distinct Ship Signature Nova Perks!
  let callout = 'OVERDRIVE';
  if (rig.perk === 'kestrel') {
    railBeamTime = 1.2 * power;
    railBeamTick = 0;
    sound.effect('beam');
    callout = 'RAIL-BEAM OVERDRIVE';
  } else if (rig.perk === 'aegis') {
    reflectShieldTime = 3.4 * power;
    callout = 'REFLECT SHIELD';
  }
  popups.push({
    x: player.x,
    y: player.y - 24,
    text: callout,
    color: rig.perk === 'aegis' ? '#9bf3f7' : PALETTE.gold,
    life: 0.95,
    maxLife: 0.95,
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
  bossHitTaken = false;
  overshieldBossRammed = false;
  boss = createBoss(nextBossRank++, w, runSeed, meta.overclock);
  enemies = [boss, ...enemies.filter((e) => e.kind === 'rock')];
  for (const s of shots) if (s.hostile) s.dead = true;
  document.querySelector('#boss-name').textContent = `${boss.name} // ${boss.designation}`;
  // Dynamically construct 2, 3, or 4 distinct visual armor bars matching this flagship!
  const totalBars = boss.maxPhases || 3;
  bossArmor.innerHTML = '';
  for (let i = 0; i < totalBars; i++) {
    const seg = document.createElement('span');
    seg.className = 'boss-bar-seg';
    seg.dataset.tier = String(i);
    seg.append(document.createElement('i'));
    bossArmor.append(seg);
  }
  bossArmor.setAttribute('aria-valuemax', String(boss.maxHp));
  updateBossArmor();
  bossHud.hidden = false;
  sound.effect('warning');
  sound.setBoss(boss.rank);
  showBanner('WARNING // FLAGSHIP', `${boss.name} — ${boss.designation}`, 'warn', 2.6);
}

function updateBossArmor() {
  if (!boss) return;
  const totalBars = boss.maxPhases || 3;
  const segHp = boss.maxHp / totalBars;
  const segs = bossArmor.querySelectorAll('.boss-bar-seg');
  segs.forEach((seg, i) => {
    const fill = clamp((boss.hp - i * segHp) / segHp, 0, 1);
    const bar = seg.firstElementChild;
    if (bar) bar.style.width = `${(fill * 100).toFixed(1)}%`;
    seg.classList.toggle('is-empty', fill <= 0.001);
    seg.classList.toggle('is-enraged', i === 0 && boss.isFinalPhase && fill > 0);
  });
  const phaseEl = document.querySelector('#boss-phase');
  phaseEl.textContent = boss.isFinalPhase ? 'ENRAGED' : '';
  phaseEl.classList.toggle('is-final', Boolean(boss.isFinalPhase));
  const live = aliveBossParts(boss);
  bossPartsEl.textContent =
    boss.exposedFor > 0
      ? 'CORE EXPOSED — DOUBLE DAMAGE'
      : live.length > 0
        ? `${live.length} SUBSYSTEM${live.length > 1 ? 'S' : ''} ONLINE`
        : 'SUBSYSTEMS CLEARED';
  bossArmor.setAttribute('aria-valuenow', String(Math.ceil(boss.hp)));
  bossArmor.setAttribute('aria-valuetext', `${Math.ceil(boss.hp)} armor remaining across ${totalBars} bars`);
}

function damageBossPart(b, part, dmg, shot) {
  part.hp = Math.max(0, part.hp - dmg);
  part.flash = 0.14;
  if (part.hp > 0) {
    spawnHitFeedback(shot ? shot.x : part.x, shot ? shot.y : part.y, part, shot);
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

function damageBossCore(b, dmg, shot) {
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
    // Final-Phase Armor Shedding + Dynamic Boss Soundtrack Escalation!
    if (b.isFinalPhase) {
      sound.setBossPhase(true);
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU + between(-0.2, 0.2);
        const spd = between(110, 220);
        debris.push({
          x: b.x + Math.cos(a) * b.r * 0.5,
          y: b.y + Math.sin(a) * b.r * 0.5,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          angle: a,
          spin: between(-7, 7),
          s: between(8, 13),
          color: i % 2 === 0 ? b.palette.armor : b.palette.secondary,
          life: 1.05,
          maxLife: 1.05,
        });
      }
      popups.push({
        x: b.x,
        y: b.y - b.r - 12,
        text: 'FINAL BAR — ENRAGED!',
        color: '#ff9668',
        life: 1.35,
        maxLife: 1.35,
        size: 13,
      });
    } else {
      popups.push({
        x: b.x,
        y: b.y - b.r - 12,
        text: 'ARMOR BAR BROKEN',
        color: '#ffe099',
        life: 1.05,
        maxLife: 1.05,
        size: 12,
      });
    }
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
    spawnHitFeedback(shot ? shot.x : b.x, shot ? shot.y : b.y, b, shot);
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
  sound.effect('victory');
  sound.setBoss(0);

  // Track persistent boss & flawless records + skill-based +1 Hull reward!
  meta.records.bossesDowned++;
  if (meta.records.bossesDowned >= 3) completeMilestone('bosses3');
  if (!bossHitTaken) {
    meta.records.flawlessBosses++;
    completeMilestone('flawless');
    const bonusCoins = Math.round((25 * b.rank) * (meta.overclock ? 1.6 : 1));
    runCoins += bonusCoins;
    meta.coins += bonusCoins;
    if (hull < maxHull) {
      hull++;
      popups.push({
        x: player.x,
        y: player.y - 34,
        text: 'FLAWLESS +1 HULL',
        color: '#98ffdc',
        life: 1.5,
        maxLife: 1.5,
        size: 14,
      });
    } else {
      addScore(1200, player.x, player.y - 34, true, '#98ffdc');
    }
    popups.push({
      x: b.x,
      y: b.y - 26,
      text: `NO-HIT +${bonusCoins} COINS`,
      color: PALETTE.gold,
      life: 1.4,
      maxLife: 1.4,
      size: 14,
    });
  }
  saveMeta();

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
  showBanner(
    bossHitTaken ? 'FLAGSHIP DESTROYED' : 'FLAWLESS FLAGSHIP CLEAR',
    `${b.name} NEUTRALIZED`,
    'gold',
    1.8,
  );
  updateHud();
}

function killEnemy(e) {
  if (e.dead) return;
  e.dead = true;
  const isRock = e.kind === 'rock';
  const heavy = [
    'gunship',
    'prism',
    'minelayer',
    'courier',
    'vanguard',
    'swarmpod',
    'sniper',
    'orbiter',
    'bomber',
    'phantom',
    'healer',
  ].includes(e.kind);
  sound.effect(isRock ? 'rock' : 'ship', Math.min(8, combo / 2));
  addScore(e.points, e.x, e.y, true, e.kind === 'courier' ? PALETTE.gold : PALETTE.paper);
  if (!isRock) {
    kills++;
    bumpCombo(heavy ? 2 : 1);
  }
  const killColor = isRock
    ? e.cryo
      ? '#9ee8ff'
      : '#a79fa3'
    : e.kind === 'prism' || e.kind === 'phantom'
      ? '#cba8ff'
      : e.kind === 'healer'
        ? '#7ef2a8'
        : e.kind === 'courier'
          ? PALETTE.gold
          : '#ffad73';
  burst(e, killColor, heavy);
  shockwaves.push({
    x: e.x,
    y: e.y,
    radius: heavy ? 74 : 44,
    color: killColor,
    life: heavy ? 0.3 : 0.22,
    maxLife: heavy ? 0.3 : 0.22,
  });
  impacts.push({
    x: e.x,
    y: e.y,
    radius: heavy ? 24 : 15,
    color: '#fff9e6',
    star: true,
    angle: between(-0.6, 0.6),
    life: 0.16,
    maxLife: 0.16,
  });
  // Sector 6 Cryo Asteroids shatter into 4 crisp ice needles when broken!
  if (isRock && e.cryo && e.split) {
    for (let i = 0; i < 4; i++) {
      const a = (i * TAU) / 4 + Math.PI / 4;
      shots.push({
        x: e.x,
        y: e.y,
        r: 3.8,
        vx: Math.sin(a) * 145,
        vy: Math.cos(a) * 145,
        hostile: true,
        color: '#9ee8ff',
      });
    }
  }
  if (heavy) {
    addShake(7.5);
    triggerHitstop(0.036);
  } else {
    addShake(3.0);
    if (!isRock && combo >= 4) triggerHitstop(0.014);
  }
  dropShards(e.x, e.y, e.shards || 2);
  if (!isRock && e.kind !== 'mine') {
    const coinCount =
      e.kind === 'courier' ? 6 : ['gunship', 'prism', 'minelayer'].includes(e.kind) ? 3 : Math.random() < 0.55 ? 1 : 0;
    if (coinCount > 0) dropCoins(e.x, e.y, coinCount);
  }

  if (e.linkPartner && !e.linkPartner.dead) {
    const p = e.linkPartner;
    const mx = (e.x + p.x) * 0.5;
    const my = (e.y + p.y) * 0.5;
    burst({ x: mx, y: my, r: 16 }, '#ff7aa8', false);
    addScore(110, mx, my, true, '#ff9cc0');
    popups.push({ x: mx, y: my - 18, text: 'LINK SEVERED', color: '#ff9cc0', life: 0.9, maxLife: 0.9, size: 12 });
    e.linkPartner = null;
  }
  if (e.linkedBy && !e.linkedBy.dead) {
    const p = e.linkedBy;
    const mx = (e.x + p.x) * 0.5;
    const my = (e.y + p.y) * 0.5;
    burst({ x: mx, y: my, r: 16 }, '#ff7aa8', false);
    addScore(110, mx, my, true, '#ff9cc0');
    p.linkPartner = null;
  }

  // Supply courier always drops a tactical cell; Repair Drones can drop Shield cells (34%); heavy craft 12%!
  if (e.kind === 'courier') {
    dropTacticalCell(e.x, e.y);
  } else if (e.kind === 'healer' && Math.random() < 0.34) {
    dropTacticalCell(e.x, e.y, 'shield');
  } else if (heavy && Math.random() < 0.12) {
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

  // Weapon & mode dock (supports MK I through MK VII + Chicken Invaders thermal gauge!)
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][clamp(weaponLevel - 1, 0, 6)];
  weaponTierEl.textContent = `MK ${roman}`;
  const focused = preciseSteering();
  fireModeEl.textContent = weaponOverheated ? 'LOCKED' : overdriveTime > 0 ? 'OVERDRIVE' : focused ? 'LANCE' : 'WIDE';
  fireModeEl.classList.toggle('focus-on', focused && overdriveTime <= 0 && !weaponOverheated);
  fireModeEl.classList.toggle('overdrive-on', overdriveTime > 0 && !weaponOverheated);
  rapidBadgeEl.hidden = rapidFireTime <= 0;
  if (rapidFireTime > 0) rapidBadgeEl.textContent = `RAPID ${rapidFireTime.toFixed(1)}s`;
  focusChip.dataset.active = String(focused);
  autofireBtn.setAttribute('aria-pressed', String(autoFire));

  const effRig = getEffectiveRig();
  const heatState = weaponOverheated ? 'overheat' : ventBoostTime > 0 ? 'vent' : weaponHeat >= 70 ? 'warm' : 'cool';
  heatBlockEl.dataset.state = heatState;
  heatBlockEl.dataset.vent = String(weaponOverheated && !ventAttempted);
  heatFillEl.style.width = `${clamp(weaponHeat, 0, 100).toFixed(1)}%`;
  heatPctEl.textContent = effRig.noOverheat ? 'CRYO' : `${Math.round(weaponHeat)}%`;
  heatLabelEl.textContent =
    effRig.noOverheat
      ? 'NO HEAT'
      : weaponOverheated && !ventAttempted
        ? 'VENT [SPACE]'
        : weaponOverheated
          ? 'OVERHEAT'
          : ventBoostTime > 0
            ? 'VENT BOOST'
            : overdriveTime > 0
              ? 'NO HEAT'
              : 'HEAT';
  heatLabelEl.classList.toggle('is-overheat', weaponOverheated);
  heatLabelEl.classList.toggle('is-warm', !weaponOverheated && weaponHeat >= 70);

  // Nova / Overdrive dock
  const pct = overdriveTime > 0 ? Math.min(100, (overdriveTime / 4.8) * 100) : Math.min(100, novaCharge);
  novaFill.style.width = `${pct.toFixed(1)}%`;
  novaPct.textContent = overdriveTime > 0 ? `${overdriveTime.toFixed(1)}s` : `${Math.floor(novaCharge)}%`;
  novaLabel.textContent = overdriveTime > 0 ? 'OVERDRIVE' : novaCharge >= 50 ? 'NOVA READY' : 'NOVA';
  novaBlock.dataset.ready = String(novaCharge >= 50);
  novaBlock.dataset.overdrive = String(overdriveTime > 0);
  dashPip.dataset.ready = String(player.dashCd <= 0);
  novaHint.dataset.ready = String(novaCharge >= 50);
  const dashReady = player.dashCd <= 0;
  const dashMaxCd = Math.max(0.4, getEffectiveRig().dashCd);
  const dashFill = dashReady ? 100 : clamp((1 - player.dashCd / dashMaxCd) * 100, 0, 100);
  const novaReady = novaCharge >= 50;
  touchDash.disabled = !dashReady;
  touchDash.dataset.ready = String(dashReady);
  touchDash.style.setProperty('--fill', `${dashFill.toFixed(1)}%`);
  touchNova.disabled = !novaReady;
  touchNova.dataset.ready = String(novaReady);
  touchNova.dataset.full = String(novaCharge >= 99.5);
  touchNova.style.setProperty('--fill', `${Math.min(100, novaCharge).toFixed(1)}%`);
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
    forgeActive = false;
    forgeBlend = 0;
    forgeDraft = null;
    forgeDemoShots = [];
    clearTimeout(forgeDemoTimer);
    delete document.body.dataset.forge;
    delete forgeScreen?.dataset.activeSide;
    forgeScreen?.setAttribute('aria-hidden', 'true');
    if (location.hash === '#forge') {
      history.replaceState(null, '', location.pathname + location.search);
      forgePushedHistory = false;
    }
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
    rapidFireTime = 0;
    weaponDropCooldown = 0;
    railBeamTime = 0;
    reflectShieldTime = 0;
    bulletTime = 0;
    ionWind = 0;
    playerDying = 0;
    deathTick = 0;
    bossHud.hidden = true;
    title.textContent = 'Low Orbit';
    message.hidden = false;
    document.querySelector('#debrief').hidden = true;
    if (recordDialog.open) recordDialog.close();
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
    if (lost && runIsNewBest && Math.floor(score) > 0) {
      openRecordDialog();
    }
    // Keep live ambient drifting space running smoothly on Ship lost!
    if (lost && !document.hidden && !reducedMotion.matches) {
      frame = requestAnimationFrame(tick);
    }
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
  runIsNewBest = false;
  runShip = selectedRig === 'custom' ? encodeCustomShip(meta.customBuild) : selectedRig;
  runOverclock = Boolean(meta.overclock);
  runDuration = 0;
  runCoins = 0;
  kills = 0;
  grazes = 0;
  combo = 0;
  comboTimer = 0;
  peakMultiplier = 1;
  novaCharge = rig.startNova;
  overdriveTime = 0;
  rapidFireTime = 0;
  weaponDropCooldown = 0;
  overshieldTime = 0;
  overshieldBossRammed = false;
  railBeamTime = 0;
  railBeamTick = 0;
  reflectShieldTime = 0;
  bulletTime = 0;
  bossHitTaken = false;
  ionWind = 0;
  meteorTimer = 4.5;
  riftWell = null;
  riftTimer = 4.0;
  empWave = null;
  empTimer = 5.5;
  overclockHudBadge.hidden = !meta.overclock;
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
  sound.setSector(0);
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
  weaponHeat = 0;
  weaponOverheated = false;
  heatCoolDelay = 0;
  ventAttempted = false;
  ventBoostTime = 0;
  hitstop = 0;
  shake = 0;
  player.x = w / 2;
  player.y = h * (w < h ? 0.66 : 0.7);
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
  if (boss && !boss.dead) bossHitTaken = true;
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
      runDuration = Math.max(2, Math.round(time));
      const finalScore = Math.floor(score);
      // Prompt leaderboard submission whenever this run beats either local best OR the player's current leaderboard best (including unranked players)!
      const isLocalBest = finalScore > best;
      runIsNewBest = finalScore > 0 && (isLocalBest || finalScore > (lbProfile.submittedBest || 0));
      if (isLocalBest) {
        best = finalScore;
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
  return keys.has('ShiftLeft') || keys.has('ShiftRight') || Boolean(pointer?.focused);
}

function attemptPerfectVent() {
  if (mode !== 'playing' || !weaponOverheated || ventAttempted || weaponHeat >= 86) return false;
  ventAttempted = true;
  if (weaponHeat >= 34 && weaponHeat <= 54) {
    // PERFECT VENT! Instant cool + 1.9s cryo overdrive burst!
    weaponHeat = 0;
    weaponOverheated = false;
    ventBoostTime = 1.9;
    shockwaves.push({ x: player.x, y: player.y, radius: 110, color: '#98ffdc', life: 0.34, maxLife: 0.34 });
    popups.push({
      x: player.x,
      y: player.y - 26,
      text: 'PERFECT VENT!',
      color: '#98ffdc',
      life: 0.95,
      maxLife: 0.95,
      size: 13,
    });
    sound.effect('perfectVent');
    updateHud();
    return true;
  }
  weaponHeat = Math.min(100, weaponHeat + 18);
  popups.push({
    x: player.x,
    y: player.y - 24,
    text: 'JAMMED',
    color: '#ff7d6b',
    life: 0.75,
    maxLife: 0.75,
    size: 12,
  });
  sound.effect('ventFail');
  updateHud();
  return true;
}

function firePlayerWeapons(focused) {
  const rig = getEffectiveRig();
  const od = overdriveTime > 0;
  const vb = ventBoostTime > 0;
  // Clean, measured damage scaling across MK I–VII (evolves bolts instead of flooding the screen!)
  const tierScale = 1 + (weaponLevel - 1) * 0.08;
  const dmgBoost = (focused ? 1.24 : 1) * (od ? 1.2 : 1) * (vb ? 1.2 : 1) * tierScale;

  function shoot(ox, oy, angle, speed, dmg, opts = {}) {
    shots.push({
      x: player.x + ox,
      y: player.y + oy,
      r: opts.heavy ? 5.2 : opts.pierce ? 4.8 : 4.0,
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

  const wKind = rig.weaponKind || selectedRig;
  if (wKind === 'aegis') {
    if (focused) {
      // Max 3 clean heavy plasma lances
      const outerPierce = weaponLevel >= 6 ? 1 : 0;
      shoot(-8, -17, 0, 650, 1.35 * dmgBoost, { heavy: true, pierce: outerPierce });
      shoot(8, -17, 0, 650, 1.35 * dmgBoost, { heavy: true, pierce: outerPierce });
      if (weaponLevel >= 3) {
        shoot(0, -22, 0, 700, 1.3 * dmgBoost, { heavy: true, pierce: weaponLevel >= 5 ? 2 : 0 });
      }
    } else {
      // Max 5 clean plasma bolts (MK V–VII evolve outer/center bolts into piercing!)
      shoot(0, -19, 0, 610, 1.25 * dmgBoost, { heavy: true, pierce: weaponLevel >= 7 ? 2 : 0 });
      shoot(-13, -11, -0.14, 575, 1.0 * dmgBoost, { heavy: weaponLevel >= 3 });
      shoot(13, -11, 0.14, 575, 1.0 * dmgBoost, { heavy: weaponLevel >= 3 });
      if (weaponLevel >= 2) {
        const wingPierce = weaponLevel >= 5 ? 1 : 0;
        shoot(-19, -5, -0.28, 560, 0.9 * dmgBoost, { pierce: wingPierce });
        shoot(19, -5, 0.28, 560, 0.9 * dmgBoost, { pierce: wingPierce });
      }
    }
  } else if (wKind === 'falcon') {
    if (focused) {
      // Max 3 razor-tight needle bolts
      const outerPierce = weaponLevel >= 5 ? 1 : 0;
      shoot(-7, -17, 0, 720, 0.92 * dmgBoost, { pierce: outerPierce });
      shoot(7, -17, 0, 720, 0.92 * dmgBoost, { pierce: outerPierce });
      if (weaponLevel >= 3) {
        shoot(0, -22, 0, 760, 0.95 * dmgBoost, { pierce: weaponLevel >= 7 ? 2 : 0 });
      }
    } else {
      // Max 5 crisp bolts (outer evolve to piercing at MK V, center lance unlocks at MK VI)
      shoot(-7, -16, -0.05, 675, 0.85 * dmgBoost);
      shoot(7, -16, 0.05, 675, 0.85 * dmgBoost);
      if (weaponLevel >= 2) {
        const wingPierce = weaponLevel >= 5 ? 1 : 0;
        shoot(-16, -8, -0.2, 645, 0.8 * dmgBoost, { pierce: wingPierce });
        shoot(16, -8, 0.2, 645, 0.8 * dmgBoost, { pierce: wingPierce });
      }
      if (weaponLevel >= 6) {
        shoot(0, -21, 0, 720, 1.0 * dmgBoost, { pierce: 2 });
      }
    }
  } else if (wKind === 'pulse') {
    // Cool rapid twin/quad pulse cannons (low heat, smooth sustained DPS!)
    if (focused) {
      const p = weaponLevel >= 5 ? 1 : 0;
      shoot(-6, -18, 0, 700, 0.88 * dmgBoost, { pierce: p });
      shoot(6, -18, 0, 700, 0.88 * dmgBoost, { pierce: p });
      if (weaponLevel >= 4) {
        shoot(0, -22, 0, 730, 0.86 * dmgBoost, { pierce: weaponLevel >= 6 ? 2 : 0 });
      }
    } else {
      shoot(-9, -15, -0.04, 650, 0.84 * dmgBoost);
      shoot(9, -15, 0.04, 650, 0.84 * dmgBoost);
      if (weaponLevel >= 2) {
        shoot(-17, -8, -0.17, 620, 0.78 * dmgBoost, { pierce: weaponLevel >= 5 ? 1 : 0 });
        shoot(17, -8, 0.17, 620, 0.78 * dmgBoost, { pierce: weaponLevel >= 5 ? 1 : 0 });
      }
    }
  } else {
    // Kestrel: crisp 2 -> 3 Focused Rail-Lance, 2 -> 5 Wide Pulse with evolved piercing tiers
    if (focused) {
      const outerPierce = weaponLevel >= 5 ? 1 : 0;
      shoot(-7, -18, 0, 735, 1.05 * dmgBoost, { pierce: outerPierce });
      shoot(7, -18, 0, 735, 1.05 * dmgBoost, { pierce: outerPierce });
      if (weaponLevel >= 3) {
        shoot(0, -23, 0, 770, 1.1 * dmgBoost, { pierce: weaponLevel >= 6 ? 2 : 0 });
      }
    } else {
      if (weaponLevel === 1) {
        shoot(-6, -16, -0.03, 625, 1.0 * dmgBoost);
        shoot(6, -16, 0.03, 625, 1.0 * dmgBoost);
      } else {
        shoot(0, -19, 0, 650, 1.0 * dmgBoost, { pierce: weaponLevel >= 6 ? 2 : 0 });
        shoot(-12, -12, -0.12, 615, 0.9 * dmgBoost);
        shoot(12, -12, 0.12, 615, 0.9 * dmgBoost);
        if (weaponLevel >= 3) {
          const wingPierce = weaponLevel >= 5 ? 1 : 0;
          shoot(-19, -5, -0.25, 600, 0.88 * dmgBoost, { pierce: wingPierce });
          shoot(19, -5, 0.25, 600, 0.88 * dmgBoost, { pierce: wingPierce });
        }
      }
    }
  }

  player.muzzle = 0.08;
  player.recoil = 2.4;
  sound.effect(focused ? 'focusFire' : 'fire');
  const rf = rapidFireTime > 0;
  nextShot = rig.fireRate * (od ? 0.74 : vb ? 0.8 : 1) * (rf ? 0.67 : 1);

  // Chicken Invaders Weapon Heat accumulation (exponential with weapon MK tier; Overdrive, Vent Boost & Maxed Cryo Core fire heat-free!)
  if (!od && !vb && !rig.noOverheat) {
    const baseHeat = wKind === 'aegis' ? 3.5 : wKind === 'falcon' ? 2.45 : wKind === 'pulse' ? 2.35 : 2.85;
    const expMult = Math.pow(1.135, weaponLevel - 1);
    const touchEase = pointer?.isTouch ? 0.88 : 1;
    const rfEase = rf ? 0.78 : 1;
    const partHeat = rig.heatMult || 1;
    weaponHeat = Math.min(100, weaponHeat + baseHeat * expMult * rig.heatScale * partHeat * touchEase * rfEase);
    heatCoolDelay = 0.15;

    if (weaponHeat >= 100) {
      weaponOverheated = true;
      ventAttempted = false;
      sound.effect('overheat');
      addShake(5);
      popups.push({
        x: player.x,
        y: player.y - 26,
        text: 'OVERHEATED!',
        color: '#ff6e62',
        life: 1.05,
        maxLife: 1.05,
        size: 13,
      });
      for (let i = 0; i < 8; i++) {
        smoke.push({
          x: player.x + between(-14, 14),
          y: player.y - 8,
          vx: between(-45, 45),
          vy: between(-65, -15),
          r: between(4, 9),
          color: i % 2 ? '#c4cdd6' : '#ff9866',
          life: 0.55,
          maxLife: 0.55,
        });
      }
    } else if (weaponHeat >= 78) {
      sound.effect('heatWarn', (weaponHeat - 78) / 22);
    }
  }
}

function pointHitsBeam(px, py, bx, by, angle, halfWidth, maxLen = 1800) {
  const dx = px - bx;
  const dy = py - by;
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  // Rotate point into beam-local coordinates (beam runs along +Y in rotated space)
  const localX = dx * cos + dy * sin;
  const localY = -dx * sin + dy * cos;
  return localY > 14 && localY < maxLen && Math.abs(localX) < halfWidth;
}

function pointToSegmentDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-4) return Math.hypot(px - x1, py - y1);
  const t = clamp(((px - x1) * dx + (py - y1) * dy) / lenSq, 0, 1);
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
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
  if (rapidFireTime > 0) {
    rapidFireTime = Math.max(0, rapidFireTime - dt);
  }
  if (weaponDropCooldown > 0) {
    weaponDropCooldown = Math.max(0, weaponDropCooldown - dt);
  }
  if (overshieldTime > 0) {
    overshieldTime = Math.max(0, overshieldTime - dt);
  }
  if (railBeamTime > 0) {
    railBeamTime = Math.max(0, railBeamTime - dt);
  }
  if (reflectShieldTime > 0) {
    reflectShieldTime = Math.max(0, reflectShieldTime - dt);
  }
  if (bulletTime > 0) {
    bulletTime = Math.max(0, bulletTime - dt);
  }
  if (ventBoostTime > 0) {
    ventBoostTime = Math.max(0, ventBoostTime - dt);
  }
  const worldDt = bulletTime > 0 ? dt * 0.36 : dt;

  // Sector-specific environmental effects across all 8 Dimensions!
  const secMod = sectorIndex % 8;
  ionWind = secMod === 2 && !warp ? Math.sin(time * 0.75) * 44 : 0;
  // Sector 4 (Eclipse Corona): Diagonal molten meteor surges
  if (secMod === 3 && !warp && !boss) {
    meteorTimer -= worldDt;
    if (meteorTimer <= 0) {
      meteorTimer = between(3.6, 5.4);
      const fromLeft = Math.random() < 0.5;
      const m = createEnemy('rock', fromLeft ? -18 : w + 18, between(40, h * 0.32), currentWave, {
        r: between(14, 19),
        hp: 2,
        maxHp: 2,
        split: false,
        molten: true,
        vx: (fromLeft ? 1 : -1) * between(165, 225),
        vy: between(120, 175),
        points: 85,
        shards: 3,
        overclock: meta.overclock,
        sectorIndex,
      });
      m.shape = outlineRock();
      enemies.push(m);
    }
  }
  // Sector 5 (Astral Rift): Periodic Gravity Anomaly Well curving bullets & charging Nova nearby!
  if (secMod === 4 && !warp && !boss) {
    if (riftWell) {
      riftWell.life -= worldDt;
      const distP = Math.hypot(riftWell.x - player.x, riftWell.y - player.y);
      if (distP < riftWell.r * 1.15 && distP > 14 && player.dashTime <= 0) {
        novaCharge = Math.min(100, novaCharge + dt * 9);
        const pull = 36 * worldDt;
        player.x = clamp(player.x + ((riftWell.x - player.x) / distP) * pull, 19, w - 19);
        player.y = clamp(player.y + ((riftWell.y - player.y) / distP) * pull, 24, h - 24);
      }
      if (riftWell.life <= 0) riftWell = null;
    } else {
      riftTimer -= worldDt;
      if (riftTimer <= 0) {
        riftTimer = between(5.5, 7.5);
        riftWell = {
          x: between(w * 0.22, w * 0.78),
          y: between(h * 0.26, h * 0.54),
          r: 118,
          life: 6.2,
          maxLife: 6.2,
        };
        sound.effect('gravity');
      }
    }
  } else {
    riftWell = null;
  }
  // Sector 7 (Iron Graveyard): Segmented horizontal EMP Pulse Barrier with a clear Safe Gap (dodge through gap OR Phase Dash the bar for bonus!)
  if (secMod === 6 && !warp && !boss) {
    if (empWave) {
      if (empWave.warn > 0) {
        empWave.warn -= worldDt;
        if (empWave.warn <= 0) sound.effect('emp');
      } else {
        empWave.y += 285 * worldDt;
        const inGap = Math.abs(player.x - empWave.gapX) < Math.max(24, empWave.gapHalf - player.r);
        if (!inGap && Math.abs(player.y - empWave.y) < player.r + 8) {
          if (player.dashTime > 0 || overshieldTime > 0) {
            if (!empWave.grazed) {
              empWave.grazed = true;
              bumpCombo(3);
              novaCharge = Math.min(100, novaCharge + 12);
              weaponHeat = Math.max(0, weaponHeat - 16);
              addScore(140, player.x, player.y - 20, true, '#ffe099');
              popups.push({ x: player.x, y: player.y - 34, text: 'EMP PHASE!', color: '#ffe099', life: 0.85, maxLife: 0.85, size: 12 });
              sound.effect('graze', 8);
            }
          } else {
            hitPlayer();
            if (hull <= 0) return;
          }
        }
        if (empWave.y > h + 30) empWave = null;
      }
    } else {
      empTimer -= worldDt;
      if (empTimer <= 0) {
        empTimer = between(6.5, 8.6);
        const gapHalf = Math.min(82, Math.max(62, w * 0.14));
        const gapX = between(gapHalf + 24, w - gapHalf - 24);
        empWave = { y: 42, warn: 1.25, grazed: false, gapX, gapHalf };
      }
    }
  } else {
    empWave = null;
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
        sound.setSector(sectorIndex);
        pickups = [];
      }
      if (warp.t >= dur) {
        warp.phase = 'arrive';
        warp.t = 0;
        player.x = w * 0.5;
        player.y = h + 86;
        player.vy = -320;
        sound.effect('warpExit');
      }
    } else if (warp.phase === 'arrive') {
      // Ship flies smoothly in from bottom of the brand-new colored sector to a comfortable mid-lower stance!
      const dur = shortMotion ? 0.45 : 0.95;
      const p = clamp(warp.t / dur, 0, 1);
      const easeOut = 1 - Math.pow(1 - p, 3);
      const targetY = h * (w < h ? 0.66 : 0.7);
      player.x = w * 0.5;
      player.y = h + 86 + (targetY - (h + 86)) * easeOut;
      player.vx = 0;
      player.vy = -320 * (1 - p);
      player.bank = 0;
      distance += dt * (150 + (1 - p) * 1200);
      if (p >= 1) {
        warp = null;
        player.y = targetY;
        player.vy = 0;
        spawnIn = 0.8;
        const secNum = String(sectorIndex + 1).padStart(2, '0');
        if (sectorIndex + 1 > meta.records.bestSector) {
          meta.records.bestSector = sectorIndex + 1;
          saveMeta();
        }
        if (sectorIndex + 1 >= 2) completeMilestone('sector2');
        if (sectorIndex + 1 >= 3) completeMilestone('sector3');
        showBanner(`SECTOR ${secNum} // ${getSectorName(sectorIndex)}`, getSectorHazard(sectorIndex), 'teal', 2.4);
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
    // 1:1 instant touch & mouse tracking (ZERO lag!), with smooth touch finger-lift so thumb never hides ship!
    if (pointer.lift && Math.abs(pointer.lift) > 0.2) {
      const step = pointer.lift * (1 - Math.exp(-dt * 26));
      pointer.goalY = clamp(pointer.goalY + step, 24, h - 24);
      pointer.lift -= step;
    }
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

  // Firing logic + Chicken Invaders Thermal Cooling & Overheat Lockout!
  const wantsFire = !controlsLocked && (keys.has('Space') || Boolean(pointer) || autoFire);
  const isFiring = wantsFire && !weaponOverheated;

  // Cryo Nebula (Sector 6) sub-zero atmosphere cools weapons +35% faster!
  const cryoCoolBonus = sectorIndex % 8 === 5 ? 1.35 : 1;

  if (overdriveTime > 0 || rig.noOverheat) {
    // Nova Overdrive or Level 4 Cryo Cooling Core keeps barrels ice-cool!
    weaponOverheated = false;
    weaponHeat = Math.max(0, weaponHeat - dt * 140);
  } else if (weaponOverheated) {
    weaponHeat = Math.max(0, weaponHeat - dt * 44 * rig.coolScale * cryoCoolBonus);
    if (Math.random() < dt * 22) {
      smoke.push({
        x: player.x + (Math.random() < 0.5 ? -10 : 10),
        y: player.y - 10,
        vx: between(-24, 24),
        vy: between(-48, -12),
        r: between(3, 6.5),
        color: '#c8d2dc',
        life: 0.42,
        maxLife: 0.42,
      });
    }
    if (weaponHeat <= 0) {
      weaponOverheated = false;
      sound.effect('coolReady');
      popups.push({
        x: player.x,
        y: player.y - 24,
        text: 'WEAPONS COOL',
        color: PALETTE.teal,
        life: 0.75,
        maxLife: 0.75,
        size: 11,
      });
    }
  } else {
    if (heatCoolDelay > 0) {
      heatCoolDelay = Math.max(0, heatCoolDelay - dt);
    } else if (weaponHeat > 0) {
      // Feathering/pausing fire cools rapidly (boosted further by Cryo Cooling Core & Cryo Nebula!)
      const coolRate = (isFiring ? 8.5 : 58) * rig.coolScale * cryoCoolBonus;
      weaponHeat = Math.max(0, weaponHeat - dt * coolRate);
    }
    if (weaponHeat >= 78 && Math.random() < dt * 14) {
      sparks.push({
        x: player.x + (Math.random() < 0.5 ? -9 : 9),
        y: player.y - 12,
        vx: between(-28, 28),
        vy: between(-40, 10),
        life: 0.2,
        color: '#ff9c57',
      });
    }
  }

  if (isFiring && nextShot <= 0) {
    firePlayerWeapons(focused);
  }

  // Measured Homing Seeker Missiles (only fire when visible enemies are on-screen; never solo-clears waves!)
  const isSeekerRig = (rig.weaponKind || selectedRig) === 'falcon';
  const hasMissiles = isSeekerRig || weaponLevel >= 4 || (weaponLevel >= 3 && overdriveTime > 0);
  const visibleEnemies = enemies.some((e) => !e.dead && e.y > 10);
  if (isFiring && hasMissiles && missileTimer <= 0 && visibleEnemies) {
    const tripleSalvo = isSeekerRig && weaponLevel >= 6;
    const interval = isSeekerRig ? (weaponLevel >= 5 ? 0.82 : 0.98) : weaponLevel >= 6 ? 1.05 : 1.28;
    const launchers = tripleSalvo ? [-17, 0, 17] : [-15, 15];
    for (const ox of launchers) {
      const side = Math.sign(ox);
      shots.push({
        x: player.x + ox,
        y: player.y + (ox === 0 ? -12 : 2),
        r: 4.2,
        vx: side * 135,
        vy: -175,
        dmg: isSeekerRig ? 1.05 : 0.95,
        hostile: false,
        homing: true,
        age: 0,
      });
    }
    sound.effect('missile');
    missileTimer = interval * (overdriveTime > 0 ? 0.78 : 1);
  }

  // Smart Wave Director with Crowd Budget (keeps arena lively & challenging without unfair overlap!)
  if (!boss && !warp) {
    spawnIn -= worldDt;
    const combatHostiles = enemies.filter((e) => !e.dead && e.kind !== 'rock' && e.kind !== 'mine');
    const heavyCount = combatHostiles.filter((e) => ['gunship', 'prism', 'minelayer'].includes(e.kind)).length;
    if (spawnCount >= nextBossAtSpawn) {
      if (combatHostiles.length === 0 && spawnIn <= 0.35) {
        beginBoss();
      }
    } else {
      if (combatHostiles.length === 0 && spawnIn > 0.28) {
        spawnIn = 0.28;
      }
      const maxActive = currentWave >= 6 ? 7 : 6;
      const arenaCrowded = combatHostiles.length >= maxActive || heavyCount >= 3;
      if (spawnIn <= 0 && !arenaCrowded) {
        const wave = Math.floor(spawnCount / 6) + 1;
        const beat = spawnCount % 6;
        hud.style.setProperty('--wave-progress', ((beat + 1) / 6) * 100 + '%');
        if (beat === 0) {
          currentWave = wave;
          waveLabel.textContent = String(wave).padStart(2, '0');
          sound.setWave(wave);
          if (wave > meta.records.bestWave) {
            meta.records.bestWave = wave;
            saveMeta();
          }
          if (wave >= 10) completeMilestone('wave10');
          if (wave > 1) {
            const opName = waveNames[(wave - 1) % waveNames.length];
            const secNum = String(sectorIndex + 1).padStart(2, '0');
            showBanner(`SECTOR ${secNum} // ${getSectorName(sectorIndex)}`, `WAVE ${String(wave).padStart(2, '0')} — ${opName}`, 'teal', 2.1);
          }
        }
        const first = enemies.length;
        spawnFormation(enemies, w, wave, beat, player.x, { overclock: meta.overclock, sectorIndex });
        for (const enemy of enemies.slice(first)) {
          if (enemy.kind === 'rock') enemy.shape = outlineRock();
        }
        spawnCount++;
        // Smooth asymptotic pacing ceiling (never spawns exponentially faster!)
        const cadence = (1 + 0.36 * (1 - Math.exp(-(wave - 1) * 0.2))) * (meta.overclock ? 1.12 : 1);
        spawnIn = (beat === 5 ? waveLength / 6 + 1.25 : waveLength / 6) / cadence;
      }
    }
  }

  // Kestrel Signature Perk: Forward Orbital Rail-Beam melts bullets & slices enemies/bosses in its column!
  if (railBeamTime > 0 && hull > 0 && playerDying <= 0) {
    for (const s of shots) {
      if (s.hostile && !s.dead && s.y < player.y && Math.abs(s.x - player.x) < 26 + s.r) {
        s.dead = true;
        dropShards(s.x, s.y, 1, true);
      }
    }
    railBeamTick -= dt;
    if (railBeamTick <= 0) {
      railBeamTick = 0.075;
      for (const e of enemies) {
        if (e.dead || e.y > player.y) continue;
        if (e === boss) {
          if (e.entering > 0 || e.dying > 0) continue;
          for (const part of aliveBossParts(e)) {
            if (Math.abs(part.x - player.x) < 24 + part.r) damageBossPart(e, part, 2.2);
          }
          if (Math.abs(e.x - player.x) < 24 + e.r) damageBossCore(e, 2.6);
        } else if (Math.abs(e.x - player.x) < 24 + e.r) {
          e.hp -= 2.8;
          e.flash = 0.14;
          if (e.hp <= 0) killEnemy(e);
        }
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
    if (enemy.hitPunch > 0) {
      enemy.hitPunch *= Math.exp(-dt * 20);
      if (enemy.hitPunch < 0.01) enemy.hitPunch = 0;
    }
    if (enemy.hpTrail !== undefined && enemy.hpTrail > enemy.hp) {
      enemy.hpTrail += (enemy.hp - enemy.hpTrail) * (1 - Math.exp(-dt * 6.5));
      if (enemy.hpTrail - enemy.hp < 0.02) enemy.hpTrail = enemy.hp;
    }
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
      flyBoss(enemy, worldDt, w, h, player, shots, sound, enemies);
    } else if (enemy.escort) {
      flyEscort(enemy, worldDt, w, h, player, shots, sound);
    } else {
      if (enemy.healFlash > 0) enemy.healFlash = Math.max(0, enemy.healFlash - dt);
      flyEnemy(enemy, worldDt, w, h, player, shots, sound, enemies, ionWind);
    }

    // Sector 2 & 4 Molten Asteroid ember trail
    if (!enemy.dead && enemy.molten && Math.random() < worldDt * 18) {
      sparks.push({
        x: enemy.x + between(-enemy.r * 0.4, enemy.r * 0.4),
        y: enemy.y + between(-enemy.r * 0.4, enemy.r * 0.4),
        vx: -enemy.vx * 0.25 + between(-20, 20),
        vy: -enemy.vy * 0.25 + between(-15, 15),
        life: 0.28,
        color: Math.random() < 0.5 ? '#ff9d57' : '#ffe099',
      });
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

    // Eclipse Boss Gravity Well gentle pull on player ship!
    if (enemy === boss && !enemy.dead && enemy.gravityActive > 0 && player.dashTime <= 0 && !controlsLocked) {
      const gx = enemy.x - player.x;
      const gy = enemy.y - player.y;
      const gd = Math.hypot(gx, gy) || 1;
      if (gd > 48 && gd < 420) {
        const pull = (enemy.isFinalPhase ? 95 : 72) * worldDt;
        player.x = clamp(player.x + (gx / gd) * pull, 19, w - 19);
        player.y = clamp(player.y + (gy / gd) * pull, 24, h - 24);
      }
    }

    // Boss Laser Tethers collision & Phase-Dash graze (Wing Pod tether + Citadel Rotating Laser Cage!)
    if (enemy === boss && !enemy.dead) {
      for (const seg of getBossLaserTethers(enemy)) {
        const d = pointToSegmentDist(player.x, player.y, seg.x1, seg.y1, seg.x2, seg.y2);
        if (d < player.r + 5) {
          if (player.dashTime > 0 || overshieldTime > 0) {
            if (!enemy.bossTetherGrazeCd || enemy.bossTetherGrazeCd <= 0) {
              enemy.bossTetherGrazeCd = 0.5;
              bumpCombo(2);
              novaCharge = Math.min(100, novaCharge + 6);
              weaponHeat = Math.max(0, weaponHeat - 10);
              addScore(75, player.x, player.y - 16, true, '#9bf3f7');
              sound.effect('graze', 7);
            }
          } else {
            hitPlayer();
            if (hull <= 0) return;
          }
        }
      }
      if (enemy.bossTetherGrazeCd > 0) enemy.bossTetherGrazeCd = Math.max(0, enemy.bossTetherGrazeCd - dt);
    }

    // Active thermal beam collision check (Prism single beam, Boss single/twin scissor, & Seraph 4-way X-Cross Halo!)
    if (!enemy.dead && enemy.beamActive > 0) {
      const halfWidth = enemy === boss ? 13.5 : 10;
      const beamReach = Math.hypot(w, h) + 140;
      const angles =
        enemy === boss && enemy.crossBeam
          ? [
              enemy.beamAngle || 0,
              (enemy.beamAngle || 0) + Math.PI / 2,
              (enemy.beamAngle || 0) + Math.PI,
              (enemy.beamAngle || 0) + (Math.PI * 3) / 2,
            ]
          : enemy === boss && enemy.twinBeam
            ? [-(enemy.beamSpread || 0.35), enemy.beamSpread || 0.35]
            : [enemy.beamAngle || 0];
      for (const ang of angles) {
        if (pointHitsBeam(player.x, player.y, enemy.x, enemy.y, ang, halfWidth + player.r, beamReach)) {
          hitPlayer();
          if (hull <= 0) return;
          break;
        }
      }
    }

    // Active Laser-Tether collision between linked gate drones!
    if (!enemy.dead && enemy.linkPartner && !enemy.linkPartner.dead && (enemy.tetherWarmup || 0) <= 0) {
      const d = pointToSegmentDist(player.x, player.y, enemy.x, enemy.y, enemy.linkPartner.x, enemy.linkPartner.y);
      if (d < player.r + 5) {
        if (player.dashTime > 0 || overshieldTime > 0) {
          if (!enemy.tetherGrazed) {
            enemy.tetherGrazed = true;
            bumpCombo(2);
            novaCharge = Math.min(100, novaCharge + 6);
            weaponHeat = Math.max(0, weaponHeat - 10);
            addScore(60, player.x, player.y - 16, true, '#ff9cc0');
            sound.effect('graze', 7);
          }
        } else {
          hitPlayer();
          if (hull <= 0) return;
        }
      }
    }
  }

  // Update projectiles
  for (const s of shots) {
    if (s.dead) continue;
    if (s.homing) {
      s.age += dt;
      // Pick closest VISIBLE live enemy or boss part (never lock onto off-screen spawns!)
      let target = null;
      let bestDist = Infinity;
      for (const e of enemies) {
        if (e.dead || e.y < 10 || (e === boss && (e.entering > 0 || e.dying > 0))) continue;
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

    const stepDt = s.hostile ? worldDt : dt;
    if (s.hostile && s.waveAmp) {
      s.age = (s.age || 0) + stepDt;
      s.x += Math.cos(s.age * (s.waveFreq || 5) + (s.wavePhase || 0)) * s.waveAmp * stepDt;
    }
    if (s.hostile && riftWell) {
      const dx = riftWell.x - s.x;
      const dy = riftWell.y - s.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < riftWell.r * 1.4 && d > 12) {
        s.vx += (dx / d) * 145 * stepDt;
        s.vy += (dy / d) * 145 * stepDt;
      }
    }
    if (s.hostile && s.cluster) {
      if (s.clusterAngle === undefined) s.clusterAngle = Math.atan2(s.vx, s.vy);
      if (s.clusterMaxFuse === undefined) s.clusterMaxFuse = Math.max(0.1, s.clusterFuse || 1.25);
      if (s.clusterHp === undefined) {
        s.clusterMaxHp = 3.0;
        s.clusterHp = s.clusterMaxHp;
      }
      if (s.flash > 0) s.flash = Math.max(0, s.flash - stepDt);
      s.clusterFuse -= stepDt;
      if (s.clusterFuse <= 0) {
        s.dead = true;
        const count = s.clusterCount || 6;
        const baseA = s.clusterAngle;
        burst({ x: s.x, y: s.y, r: 10 }, '#ffb45c', false);
        sound.effect('volley');
        for (let i = 0; i < count; i++) {
          const a = baseA + (i / count) * TAU;
          shots.push({
            x: s.x,
            y: s.y,
            r: 4.0,
            vx: Math.sin(a) * 175,
            vy: Math.cos(a) * 175,
            hostile: true,
            color: '#ff9654',
          });
        }
        continue;
      }
    }
    s.x += s.vx * stepDt;
    s.y += s.vy * stepDt;

    if (s.hostile) {
      // Aegis Signature Perk: Reflective Mirror bounces enemy bullets right back at them!
      if (reflectShieldTime > 0 && Math.hypot(s.x - player.x, s.y - player.y) < 37 + s.r) {
        s.hostile = false;
        s.reflected = true;
        s.pierce = 1;
        s.hitIds = new Set();
        s.dmg = 2.8;
        s.vx = -s.vx * 0.55;
        s.vy = -Math.max(460, Math.abs(s.vy) * 2.2);
        addScore(25);
        bumpCombo(1);
        impacts.push({ x: s.x, y: s.y, radius: 11, color: '#9bf3f7', life: 0.24, maxLife: 0.24 });
        sound.effect('graze', 6);
        continue;
      }
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
          // Graze cools weapon barrels (-8% heat) for high-skill risk/reward!
          weaponHeat = Math.max(0, weaponHeat - 8);
          bumpCombo(1);
          addScore(15, player.x, player.y - 12, false);
          impacts.push({ x: player.x, y: player.y, radius: 10, color: '#9df4df', life: 0.3, maxLife: 0.3 });
          sound.effect('graze', Math.min(8, combo / 3));
        }
      }
    } else {
      // Allow player shots to shoot down & defuse hostile cluster bombs before they split!
      const clusterOrb = shots.find(
        (c) =>
          c.hostile &&
          c.cluster &&
          !c.dead &&
          !s.hitIds?.has(c) &&
          Math.hypot(s.x - c.x, s.y - c.y) < s.r + c.r + 5,
      );
      if (clusterOrb) {
        if (clusterOrb.clusterHp === undefined) {
          clusterOrb.clusterMaxHp = 3.0;
          clusterOrb.clusterHp = clusterOrb.clusterMaxHp;
        }
        clusterOrb.clusterHp -= s.dmg || 1;
        clusterOrb.flash = 0.12;
        if (s.pierce > 0) {
          s.pierce--;
          s.hitIds?.add(clusterOrb);
          if (s.pierce <= 0) s.dead = true;
        } else {
          s.dead = true;
        }
        if (clusterOrb.clusterHp <= 0) {
          clusterOrb.dead = true;
          burst({ x: clusterOrb.x, y: clusterOrb.y, r: 14 }, '#ffd18a', false);
          impacts.push({
            x: clusterOrb.x,
            y: clusterOrb.y,
            radius: 20,
            color: '#98ffdc',
            life: 0.28,
            maxLife: 0.28,
          });
          bumpCombo(1);
          addScore(120, clusterOrb.x, clusterOrb.y - 14, true, '#98ffdc');
          sound.effect('burst');
        } else {
          sound.effect('impact');
          for (let k = 0; k < 3; k++) {
            sparks.push({
              x: s.x,
              y: s.y,
              vx: between(-110, 110),
              vy: between(-90, 90),
              life: 0.16,
              color: '#ffe29c',
            });
          }
        }
        if (s.dead) continue;
      }

      // Check boss subsystems first so wing turrets / shield pylons intercept cleanly
      let hitSomething = false;
      if (boss && !boss.dead && boss.entering <= 0 && boss.dying <= 0) {
        for (const part of aliveBossParts(boss)) {
          if (collides(s, part)) {
            s.dead = true;
            damageBossPart(boss, part, s.dmg || 1, s);
            hitSomething = true;
            break;
          }
        }
        if (!hitSomething && collides(s, boss)) {
          s.dead = true;
          damageBossCore(boss, s.dmg || 1, s);
          hitSomething = true;
        }
      }
      if (hitSomething) continue;

      const e = enemies.find(
        (cand) => cand !== boss && !cand.dead && cand.y > -4 && !s.hitIds?.has(cand) && collides(s, cand),
      );
      if (e) {
        // Shielded Vanguard deflects non-piercing frontal shots (pierce, flank, or use homing seekers!)
        const blockedByFrontShield =
          e.kind === 'vanguard' &&
          e.frontShield &&
          !(s.pierce > 0) &&
          !s.homing &&
          !s.reflected &&
          s.y > e.y + 3 &&
          Math.abs(s.x - e.x) < e.r * 0.92;
        if (blockedByFrontShield) {
          s.dead = true;
          e.shieldFlash = 0.14;
          e.hp = Math.max(0, e.hp - (s.dmg || 1) * 0.18);
          sound.effect('impact');
          for (let k = 0; k < 3; k++) {
            sparks.push({
              x: s.x,
              y: s.y,
              vx: between(-130, 130),
              vy: between(55, 145),
              life: 0.18,
              color: '#9bf3f7',
            });
          }
          if (e.hp <= 0) killEnemy(e);
          continue;
        }
        if (s.pierce > 0) {
          s.pierce--;
          s.hitIds?.add(e);
          if (s.pierce <= 0) s.dead = true;
        } else {
          s.dead = true;
        }
        if (e.hpTrail === undefined) e.hpTrail = e.hp;
        e.hp = Math.max(0, e.hp - (s.dmg || 1));
        e.flash = 0.13;
        if (e.hp > 0) {
          spawnHitFeedback(s.x, s.y, e, s);
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
          // One-time modest ram impact per Overshield + clean repulsion bounce (never insta-melts boss!)
          if (!overshieldBossRammed) {
            overshieldBossRammed = true;
            const ramDmg = Math.min(12, Math.max(5, Math.round(e.maxHp * 0.08)));
            damageBossCore(e, ramDmg);
            shockwaves.push({ x: player.x, y: player.y, radius: 110, color: '#ffe58f', life: 0.32, maxLife: 0.32 });
            popups.push({
              x: e.x,
              y: e.y + e.r + 12,
              text: 'RAM IMPACT',
              color: '#ffe58f',
              life: 0.85,
              maxLife: 0.85,
              size: 13,
            });
            addShake(8);
          }
          const rx = player.x - e.x;
          const ry = player.y - e.y;
          const rd = Math.hypot(rx, ry) || 1;
          const pushDist = hitDist + 10;
          player.x = clamp(e.x + (rx / rd) * pushDist, 19, w - 19);
          player.y = clamp(e.y + (ry / rd) * pushDist, 24, h - 24);
          player.vx = (rx / rd) * 260;
          player.vy = Math.max(160, (ry / rd) * 260);
          if (pointer) {
            pointer.goalX = player.x;
            pointer.goalY = player.y;
          }
        } else {
          e.hp -= 10;
          e.flash = 0.16;
          if (e.hp <= 0) killEnemy(e);
          addShake(5);
        }
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
        const baseVal = 2 + sectorIndex;
        const value = meta.overclock ? Math.round(baseVal * 1.6) : baseVal;
        runCoins += value;
        meta.coins += value;
        saveMeta();
        sound.effect('coin');
      } else if (p.kind === 'rapid') {
        const cooled = weaponOverheated || weaponHeat >= 15;
        rapidFireTime = Math.min(11, rapidFireTime + 7.5);
        weaponHeat = 0;
        weaponOverheated = false;
        heatCoolDelay = 0;
        ventAttempted = false;
        shockwaves.push({ x: player.x, y: player.y, radius: 105, color: '#8eff85', life: 0.32, maxLife: 0.32 });
        popups.push({
          x: player.x,
          y: player.y - 26,
          text: cooled ? 'RAPID FIRE + COOLED!' : 'RAPID FIRE!',
          color: '#8eff85',
          life: 1.0,
          maxLife: 1.0,
          size: 14,
        });
        sound.effect('rapidFire');
      } else if (p.kind === 'overshield') {
        overshieldTime = 6.5;
        overshieldBossRammed = false;
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
  shots = shots.filter((s) => !s.dead && s.y > -14 && s.y < h + 40 && s.x > -40 && s.x < w + 40);
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
  const portrait = w < h;
  const desktopForge = w >= 860;
  if (!introShip.ready && w && h) {
    introShip.x = w * 0.74;
    introShip.y = h * (portrait ? 0.16 : 0.22);
    introShip.ready = true;
  }

  // Smoothly blend between orbital patrol (0) and left-side live Forge dock (1)
  const targetBlend = forgeActive ? 1 : 0;
  forgeBlend += (targetBlend - forgeBlend) * (1 - Math.exp(-dt * 5.2));
  if (Math.abs(targetBlend - forgeBlend) < 0.002) forgeBlend = targetBlend;

  // Calm autonomous outer orbit vs crisp left-side holographic showcase dock
  const orbitA = introTime * 0.44;
  const orbitX = w * (0.5 + Math.cos(orbitA) * (portrait ? 0.35 : 0.39));
  const orbitY = portrait
    ? h * (0.17 + Math.sin(orbitA * 2) * 0.055)
    : h * (0.2 + Math.sin(orbitA * 2) * 0.08);
  const activeSide = activeForgeSlot ? FORGE_SLOTS[activeForgeSlot]?.side : null;
  const dockX = desktopForge ? w * (activeSide === 'left' ? 0.68 : activeSide === 'right' ? 0.32 : 0.5) : w * 0.5;
  let dockY = h * 0.48 + Math.sin(introTime * 1.9) * 4.5;
  if (!desktopForge) {
    // Dynamically center the live ship inside the exact open space between the mobile HUD & callout cards!
    let centerY = h * 0.5;
    if (forgeNodesEl) {
      const cRect = canvas.getBoundingClientRect();
      const sy = cRect.height ? h / cRect.height : 1;
      const stageRect = forgeNodesEl.getBoundingClientRect();
      if (activeForgeSlot) {
        const activeWrap = forgeNodesEl.querySelector(`.forge-slot-wrap[data-slot="${activeForgeSlot}"]`);
        const aRect = activeWrap ? activeWrap.getBoundingClientRect() : null;
        if (aRect && aRect.height > 0 && stageRect.height > 0) {
          centerY = ((stageRect.top + aRect.top) * 0.5 - cRect.top) * sy;
        } else {
          centerY = h * 0.34;
        }
      } else {
        const topEl = forgeNodesEl.querySelector('.forge-slot-wrap[data-slot="nose"]');
        const botEl = forgeNodesEl.querySelector('.forge-slot-wrap[data-slot="wings"]');
        const tRect = topEl ? topEl.getBoundingClientRect() : null;
        const bRect = botEl ? botEl.getBoundingClientRect() : null;
        if (tRect && bRect && tRect.height > 0 && bRect.height > 0) {
          centerY = ((tRect.bottom + bRect.top) * 0.5 - cRect.top) * sy;
        }
      }
    }
    dockY = clamp(centerY, h * 0.24, h * 0.62) + Math.sin(introTime * 1.9) * 3;
  }

  const targetX = forgeActive ? dockX : orbitX;
  const targetY = forgeActive ? dockY : orbitY;

  const dx = targetX - introShip.x;
  const dy = targetY - introShip.y;
  const maxSpd = forgeActive ? 620 : 240;
  const pull = forgeActive ? 5.6 : 2.0;
  const desiredVx = clamp(dx * pull, -maxSpd, maxSpd);
  const desiredVy = clamp(dy * pull, -maxSpd, maxSpd);
  const prevVx = introShip.vx;
  introShip.vx += (desiredVx - introShip.vx) * (1 - Math.exp(-dt * (forgeActive ? 7.5 : 3.0)));
  introShip.vy += (desiredVy - introShip.vy) * (1 - Math.exp(-dt * (forgeActive ? 7.5 : 3.0)));
  introShip.x = clamp(introShip.x + introShip.vx * dt, 24, w - 24);
  introShip.y = clamp(introShip.y + introShip.vy * dt, 30, h - 46);

  const spd = Math.hypot(introShip.vx, introShip.vy);
  const distToDock = Math.hypot(dx, dy);
  if (forgeActive && (forgeBlend > 0.35 || distToDock < 110)) {
    // Keep nose smoothly upright while gracefully banking sideways as ship slides left/right!
    let diff = 0 - introShip.heading;
    while (diff > Math.PI) diff -= TAU;
    while (diff < -Math.PI) diff += TAU;
    introShip.heading += diff * (1 - Math.exp(-dt * 11));
    const slideBank = clamp(introShip.vx * 0.0018, -0.55, 0.55);
    const inspectRoll = reducedMotion.matches ? 0 : Math.sin(introTime * 1.45) * 0.2 + slideBank;
    introShip.roll += (inspectRoll - introShip.roll) * (1 - Math.exp(-dt * 7.5));
  } else if (spd > 14) {
    const targetHeading = Math.atan2(introShip.vx, -introShip.vy);
    let diff = targetHeading - introShip.heading;
    while (diff > Math.PI) diff -= TAU;
    while (diff < -Math.PI) diff += TAU;
    introShip.heading += diff * (1 - Math.exp(-dt * 6.5));
    const turnRoll = clamp(diff * 1.7 + (introShip.vx - prevVx) * 0.015, -0.92, 0.92);
    introShip.roll += (turnRoll - introShip.roll) * (1 - Math.exp(-dt * 6.5));
  }

  // Decay test-fire muzzle flash & recoil, and advance live Forge weapon demo shots
  if (introShip.muzzle > 0) introShip.muzzle = Math.max(0, introShip.muzzle - dt * 1.1);
  if (introShip.recoil > 0) introShip.recoil = Math.max(0, introShip.recoil - dt * 28);
  if (forgeDemoShots.length > 0) {
    for (const s of forgeDemoShots) {
      s.age = (s.age || 0) + dt;
      if (s.homing) {
        // Authentic side-eject then curve gracefully upward like Falcon Seekers!
        const targetVx = Math.sin(s.age * 7 + s.side) * 28;
        s.vx += (targetVx - s.vx) * (1 - Math.exp(-dt * 6.5));
        s.vy += (-560 - s.vy) * (1 - Math.exp(-dt * 4.2));
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
    }
    forgeDemoShots = forgeDemoShots.filter((s) => s.life > 0 && s.y > -60 && s.x > -60 && s.x < w + 60);
  }

  // Record wingtip contrails behind the flying ship
  const cos = Math.cos(introShip.heading);
  const sin = Math.sin(introShip.heading);
  const span = Math.min(w * (portrait ? 0.14 : 0.085), h * 0.125, 84) * 0.33 * Math.cos(introShip.roll * 0.72);
  for (let i = 0; i < 2; i++) {
    const s = i === 0 ? -1 : 1;
    const wx = introShip.x + cos * (s * span) - sin * 14;
    const wy = introShip.y + sin * (s * span) + cos * 14;
    const trail = introShip.trails[i];
    trail.push({ x: wx, y: wy });
    if (trail.length > 26) trail.shift();
  }
}

function updateOverDrift(dt) {
  // Keep space gently drifting and lingering death particles fading smoothly on Ship lost!
  distance += dt * 32;
  for (const p of sparks) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
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
  for (const pop of popups) pop.life -= dt;
  sparks = sparks.filter((p) => p.life > 0);
  debris = debris.filter((d) => d.life > 0);
  smoke = smoke.filter((p) => p.life > 0);
  impacts = impacts.filter((ring) => ring.life > 0);
  shockwaves = shockwaves.filter((sw) => sw.life > 0);
  popups = popups.filter((pop) => pop.life > 0);
}

function tick(now) {
  if (document.hidden || (mode !== 'playing' && mode !== 'intro' && mode !== 'over')) return;
  const dt = lastTime ? Math.min(0.04, (now - lastTime) / 1000) : 0;
  lastTime = now;
  if (mode === 'intro') {
    updateIntroFlight(dt);
  } else if (mode === 'over') {
    updateOverDrift(dt);
    if (forgeActive || forgeBlend > 0.01) updateIntroFlight(dt);
  } else {
    update(dt);
  }
  draw();
  if (mode === 'playing' || ((mode === 'intro' || mode === 'over') && !reducedMotion.matches)) {
    frame = requestAnimationFrame(tick);
  }
}

// --- CONTROLS & UI EVENTS ---

function syncRigButtons() {
  for (const btn of document.querySelectorAll('.rig-option')) {
    btn.setAttribute('aria-pressed', String(btn.dataset.rig === selectedRig));
  }
  document.body.dataset.rig = selectedRig;
  const sub = document.querySelector('#custom-rig-sub');
  if (sub) sub.textContent = formatShareCode(meta.customBuild);
}
syncRigButtons();

// Render crisp ship illustrations inside each ship picker button & hangar tab (reflecting equipped livery / custom build!)
function renderShipPreviews() {
  for (const thumb of document.querySelectorAll('.rig-preview')) {
    const c = thumb.getContext('2d');
    const rigKey = thumb.dataset.ship;
    const accent = getRigAccent(rigKey);
    const drawKey = rigKey === 'custom' ? encodeCustomShip(meta.customBuild) : rigKey;
    const skinId = rigKey === 'custom' ? 'standard' : meta.equippedSkin[rigKey] || 'standard';
    c.clearRect(0, 0, thumb.width, thumb.height);
    c.save();
    c.translate(56, 56);
    const glow = c.createRadialGradient(0, 6, 4, 0, 6, 44);
    glow.addColorStop(0, accent + '36');
    glow.addColorStop(1, accent + '00');
    c.fillStyle = glow;
    c.beginPath();
    c.arc(0, 6, 44, 0, TAU);
    c.fill();
    c.scale(0.84, 0.84);
    drawInterceptor(c, drawKey, skinId);
    c.restore();
  }
  for (const thumb of document.querySelectorAll('.tab-preview')) {
    const c = thumb.getContext('2d');
    const rigKey = thumb.dataset.ship;
    const drawKey = rigKey === 'custom' ? encodeCustomShip(meta.customBuild) : rigKey;
    const skinId = rigKey === 'custom' ? 'standard' : meta.equippedSkin[rigKey] || 'standard';
    c.clearRect(0, 0, thumb.width, thumb.height);
    c.save();
    c.translate(32, 32);
    c.scale(0.5, 0.5);
    drawInterceptor(c, drawKey, skinId);
    c.restore();
  }
}
renderShipPreviews();

for (const btn of document.querySelectorAll('.rig-option')) {
  btn.addEventListener('click', () => {
    const nextRig = btn.dataset.rig;
    selectedRig = nextRig;
    hangarRig = selectedRig;
    sound.uiShip(selectedRig === 'custom' ? 'kestrel' : selectedRig);
    try {
      localStorage.setItem('low-orbit-rig', selectedRig);
    } catch {}
    syncRigButtons();
    syncMetaUi();
    introShip.trails = [[], []];
    draw();
  });
}

document.querySelector('#custom-edit-btn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  sound.uiClick();
  openForge();
});

action.addEventListener('click', () => {
  sound.uiLaunch(meta.overclock && mode !== 'paused');
  if (mode === 'paused') setMode('playing');
  else launch();
});
restartMenu.addEventListener('click', () => {
  sound.uiClose();
  setMode('intro');
});
pauseButton.addEventListener('click', () => {
  if (playerDying <= 0) {
    sound.uiClose();
    setMode('paused');
  }
});
autofireBtn.addEventListener('click', () => {
  sound.uiClick();
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
  if (manual.open || hangar.open || leaderboardDialog.open || recordDialog.open || unsavedDialog.open) return;
  if (forgeActive) {
    if (e.code === 'Escape') {
      e.preventDefault();
      if (activeForgeSlot) {
        requestCloseSlot();
      } else {
        requestCloseForge();
      }
    }
    return;
  }
  if (e.target.closest?.('input, summary, button, a') && !['Escape', 'KeyP'].includes(e.code)) return;

  if ((e.code === 'KeyP' || e.code === 'Escape') && (mode === 'playing' || mode === 'paused') && playerDying <= 0) {
    e.preventDefault();
    if (!e.repeat) setMode(mode === 'playing' ? 'paused' : 'playing');
    return;
  }
  if (mode !== 'playing') return;

  if (controls.has(e.code)) {
    e.preventDefault();
    if (!e.repeat && e.code === 'Space' && weaponOverheated) {
      attemptPerfectVent();
    }
    keys.add(e.code);
  } else if (!e.repeat && (e.code === 'KeyC' || e.code === 'KeyK')) {
    e.preventDefault();
    triggerPhaseDash();
  } else if (!e.repeat && (e.code === 'KeyE' || e.code === 'KeyX' || e.code === 'KeyQ')) {
    e.preventDefault();
    triggerNovaPulse();
  } else if (!e.repeat && e.code === 'KeyF') {
    e.preventDefault();
    if (weaponOverheated && attemptPerfectVent()) return;
    autoFire = !autoFire;
    updateHud();
  }
});
window.addEventListener('keyup', (e) => keys.delete(e.code));

mixer.querySelector('summary')?.addEventListener('click', () => sound.uiClick());
document.querySelector('.back')?.addEventListener('click', () => sound.uiClose());
document.querySelector('.info-btn')?.addEventListener('click', () => sound.uiClick());

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

// Suppress iOS Safari double-tap-and-hold magnifier loupe & mobile double-tap/pinch zoom on the playfield!
const blockCanvasGesture = (e) => {
  if (mode === 'playing') e.preventDefault();
};
canvas.addEventListener('touchstart', blockCanvasGesture, { passive: false });
canvas.addEventListener('touchmove', blockCanvasGesture, { passive: false });
canvas.addEventListener('touchend', blockCanvasGesture, { passive: false });
canvas.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
canvas.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
canvas.addEventListener('dblclick', (e) => e.preventDefault());
canvas.addEventListener('selectstart', (e) => e.preventDefault());

let lastTouchDown = { time: 0, x: 0, y: 0 };

canvas.addEventListener('pointerdown', (e) => {
  if (forgeActive && e.button === 0) {
    const bounds = canvas.getBoundingClientRect();
    if (bounds.width && bounds.height) {
      const cx = ((e.clientX - bounds.left) * w) / bounds.width;
      const cy = ((e.clientY - bounds.top) * h) / bounds.height;
      const size = w >= 860 ? Math.min(w * 0.16, h * 0.27, 174) : Math.min(w * 0.3, 108);
      if (Math.hypot(cx - introShip.x, cy - introShip.y) <= size * 0.9) {
        let nearest = 'nose';
        let bestD = Infinity;
        for (const [slotKey, spec] of Object.entries(FORGE_SLOTS)) {
          const ax = introShip.x + spec.anchor[0] * size;
          const ay = introShip.y + spec.anchor[1] * size;
          const d = Math.hypot(cx - ax, cy - ay);
          if (d < bestD) {
            bestD = d;
            nearest = slotKey;
          }
        }
        activeForgeSlot = nearest;
        sound.uiClick();
        renderForge();
        draw();
      } else if (activeForgeSlot) {
        requestCloseSlot();
      }
    }
    return;
  }
  if (mode !== 'playing') return;
  if (e.button === 2) {
    e.preventDefault();
    triggerPhaseDash();
    return;
  }
  if (pointer || e.button !== 0) return;
  if (weaponOverheated) attemptPerfectVent();
  try {
    canvas.setPointerCapture(e.pointerId);
  } catch {}
  let lift = 0;
  let touchFocused = false;
  // Touch & Pointer Double-Tap & Hold Focus (LANCE) + Hybrid Touch Finger Offset!
  if (e.pointerType === 'touch') {
    const now = performance.now();
    const dtTap = now - lastTouchDown.time;
    const distTap = Math.hypot(e.clientX - lastTouchDown.x, e.clientY - lastTouchDown.y);
    if (dtTap > 0 && dtTap <= 340 && distTap <= 84) {
      touchFocused = true;
      lastTouchDown.time = 0;
      sound.uiClick();
      popups.push({
        x: player.x,
        y: player.y - 28,
        text: 'LANCE FOCUS',
        color: '#96f6ff',
        life: 0.72,
        maxLife: 0.72,
        size: 11,
      });
    } else {
      lastTouchDown = { time: now, x: e.clientX, y: e.clientY };
    }
    const bounds = canvas.getBoundingClientRect();
    if (bounds.width && bounds.height) {
      const tx = ((e.clientX - bounds.left) * w) / bounds.width;
      const ty = ((e.clientY - bounds.top) * h) / bounds.height;
      if (Math.hypot(tx - player.x, ty - player.y) < 62) {
        lift = Math.min(0, ty - 46 - player.y);
      }
    }
  }
  pointer = {
    id: e.pointerId,
    x: e.clientX,
    y: e.clientY,
    goalX: player.x,
    goalY: player.y,
    lift,
    isTouch: e.pointerType === 'touch',
    focused: touchFocused,
  };
  if (touchFocused) updateHud();
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
function releasePointer(e) {
  if (pointer?.id === e.pointerId) {
    const wasFocused = pointer.focused;
    pointer = null;
    if (wasFocused) updateHud();
  }
}
canvas.addEventListener('lostpointercapture', releasePointer);
canvas.addEventListener('pointerup', releasePointer);
canvas.addEventListener('pointercancel', releasePointer);

// Unlock subtle Main Menu orbital ambient music on first interaction
window.addEventListener(
  'pointerdown',
  () => {
    if (mode === 'intro') sound.startAmbient();
  },
  { passive: true },
);

function autoPause() {
  sound.stopAmbient();
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
const forgeScreen = document.querySelector('#forge-screen');
const forgeNodesEl = document.querySelector('#forge-nodes');
const forgeBackBtn = document.querySelector('#forge-back');
const forgePaintsEl = document.querySelector('#forge-paints');
const forgeCodeVal = document.querySelector('#forge-code-val');
const forgeCopyBtn = document.querySelector('#forge-copy-btn');
const forgePwrText = document.querySelector('#forge-pwr-text');
const forgePwrBars = document.querySelector('#forge-pwr-bars');
const forgeStatsEl = document.querySelector('#forge-stats');
const forgeImportForm = document.querySelector('#forge-import-form');
const forgeImportInput = document.querySelector('#forge-import-input');
const forgeEquipBtn = document.querySelector('#forge-equip');
const forgeStatusEl = document.querySelector('#forge-status');
const unsavedDialog = document.querySelector('#forge-unsaved');
const unsavedApplyBtn = document.querySelector('#unsaved-apply');
const unsavedDiscardBtn = document.querySelector('#unsaved-discard');
const unsavedCancelBtn = document.querySelector('#unsaved-cancel');
const skinSectionLabel = document.querySelector('#skin-section-label');
const recordDialog = document.querySelector('#record-dialog');
const leaderboardDialog = document.querySelector('#leaderboard');
const lbListEl = document.querySelector('#lb-list');
const lbMeEl = document.querySelector('#lb-me');
const lbSubEl = document.querySelector('#lb-sub');
const lbCountEl = document.querySelector('#lb-count');
const lbMoreBtn = document.querySelector('#lb-more');
const recordSubmitForm = document.querySelector('#record-submit');
const recordShipIcon = document.querySelector('#record-ship-icon');
const recordShipTag = document.querySelector('#record-ship-tag');
const recordWaveVal = document.querySelector('#record-wave-val');
const recordScoreVal = document.querySelector('#record-score-val');
const pilotNameInput = document.querySelector('#pilot-name');
const saveRecordBtn = document.querySelector('#save-record-btn');
const recordStatusEl = document.querySelector('#record-status');
const hangarCoinsEl = document.querySelector('#hangar-coins');
const upgradeListEl = document.querySelector('#upgrade-list');
const skinListEl = document.querySelector('#skin-list');
const overclockToggle = document.querySelector('#overclock-toggle');
const refundBtn = document.querySelector('#refund-upgrades');
const recWaveEl = document.querySelector('#rec-wave');
const recSectorEl = document.querySelector('#rec-sector');
const recBossesEl = document.querySelector('#rec-bosses');
const recFlawlessEl = document.querySelector('#rec-flawless');
const milestoneListEl = document.querySelector('#milestone-list');

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
    sound.uiClose();
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
wireModal(recordDialog);
wireModal(leaderboardDialog);
wireModal(unsavedDialog);

async function copyBuildCode(code, buttonEl) {
  let ok = false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(code);
      ok = true;
    }
  } catch {}
  if (!ok) {
    try {
      const ta = document.createElement('textarea');
      ta.value = code;
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.append(ta);
      ta.select();
      ok = document.execCommand('copy');
      ta.remove();
    } catch {}
  }
  sound.uiClick();
  if (buttonEl) {
    const prev = buttonEl.textContent;
    buttonEl.classList.add('is-copied');
    buttonEl.textContent = ok ? 'COPIED!' : code;
    clearTimeout(buttonEl._copyTimer);
    buttonEl._copyTimer = setTimeout(() => {
      buttonEl.classList.remove('is-copied');
      buttonEl.textContent = prev;
    }, 1500);
  }
  return ok;
}

function getShipDisplayLabel(shipKey) {
  if (typeof shipKey === 'string' && shipKey.startsWith('custom:')) {
    const parsed = parseCustomCode(shipKey);
    return parsed ? formatShareCode(parsed) : 'CUSTOM';
  }
  return RIGS[shipKey]?.name || 'Kestrel';
}

function openRecordDialog() {
  const isCustom = typeof runShip === 'string' && runShip.startsWith('custom:');
  const label = isCustom ? `CUSTOM · ${getShipDisplayLabel(runShip)}` : (RIGS[runShip]?.name || runShip).toUpperCase();
  const kickerEl = recordDialog.querySelector('.record-kicker');
  if (kickerEl) {
    kickerEl.textContent =
      Math.floor(score) >= best
        ? 'NEW PERSONAL BEST'
        : lbProfile.submittedBest === 0
          ? 'JOIN GLOBAL LEADERBOARD'
          : 'NEW LEADERBOARD BEST';
  }
  recordShipTag.textContent = `${label}${runOverclock ? ' ⚡' : ''}`;
  recordWaveVal.textContent = String(currentWave).padStart(2, '0');
  recordScoreVal.textContent = Math.floor(score).toLocaleString();
  if (recordShipIcon) {
    const c = recordShipIcon.getContext('2d');
    c.clearRect(0, 0, recordShipIcon.width, recordShipIcon.height);
    c.save();
    c.translate(24, 24);
    c.scale(0.42, 0.42);
    const drawKey = isCustom ? runShip : RIGS[runShip] ? runShip : 'kestrel';
    const skinId = isCustom ? 'standard' : meta.equippedSkin[runShip] || 'standard';
    drawInterceptor(c, drawKey, skinId);
    c.restore();
  }
  pilotNameInput.value = lbProfile.name || '';
  pilotNameInput.disabled = false;
  saveRecordBtn.disabled = false;
  saveRecordBtn.textContent = 'SAVE RANK';
  recordStatusEl.textContent = '';
  recordStatusEl.classList.remove('is-error');
  setTimeout(() => {
    if (mode !== 'over' || !runIsNewBest || recordDialog.open) return;
    recordDialog.removeAttribute('data-closing');
    recordDialog.showModal();
    pilotNameInput.focus({ preventScroll: true });
    pilotNameInput.select();
  }, 240);
}

// --- GLOBAL LEADERBOARD CLIENT (Netlify DB /api/leaderboard + Local Dev Preview Fallback) ---
let lbOffset = 0;
let lbTotal = 0;
let lbOffline = false;

function readLocalFallbackLb() {
  try {
    const raw = JSON.parse(localStorage.getItem('low-orbit-local-lb') || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function saveLocalFallbackScore(payload) {
  const rows = readLocalFallbackLb();
  const idx = rows.findIndex((r) => r.playerId === payload.playerId);
  if (idx >= 0) {
    if (payload.score <= rows[idx].score) {
      return { ok: true, saved: false, reason: 'not_best', me: { ...rows[idx], rank: idx + 1 }, total: rows.length };
    }
    rows[idx] = { ...payload, updatedAt: Date.now() };
  } else {
    rows.push({ ...payload, updatedAt: Date.now() });
  }
  rows.sort((a, b) => b.score - a.score || a.updatedAt - b.updatedAt);
  const trimmed = rows.slice(0, 1000);
  try {
    localStorage.setItem('low-orbit-local-lb', JSON.stringify(trimmed));
  } catch {}
  const myIdx = trimmed.findIndex((r) => r.playerId === payload.playerId);
  return {
    ok: true,
    saved: myIdx >= 0,
    local: true,
    me: myIdx >= 0 ? { ...trimmed[myIdx], rank: myIdx + 1 } : null,
    total: trimmed.length,
  };
}

function paintMiniShip(canvasEl, shipKey) {
  const c = canvasEl.getContext('2d');
  c.clearRect(0, 0, canvasEl.width, canvasEl.height);
  c.save();
  c.translate(20, 20);
  c.scale(0.34, 0.34);
  const drawKey = typeof shipKey === 'string' && shipKey.startsWith('custom:') && parseCustomCode(shipKey)
    ? shipKey
    : RIGS[shipKey] && shipKey !== 'custom'
      ? shipKey
      : 'kestrel';
  drawInterceptor(c, drawKey, 'standard');
  c.restore();
}

function buildLbRow(entry) {
  const row = document.createElement('div');
  row.className = 'lb-row' + (entry.isMe ? ' is-me' : '');
  row.dataset.rank = String(entry.rank);
  row.setAttribute('role', 'listitem');

  const rankEl = document.createElement('span');
  rankEl.className = 'lb-rank';
  rankEl.textContent = `#${entry.rank}`;

  const pilotEl = document.createElement('span');
  pilotEl.className = 'lb-pilot';
  const nameEl = document.createElement('span');
  nameEl.className = 'lb-pilot-name';
  nameEl.textContent = entry.name;
  pilotEl.append(nameEl);
  if (entry.overclock) {
    const oc = document.createElement('span');
    oc.className = 'lb-oc';
    oc.title = 'Overclock run';
    oc.textContent = '⚡';
    pilotEl.append(oc);
  }

  const shipEl = document.createElement('span');
  shipEl.className = 'lb-ship';
  const icon = document.createElement('canvas');
  icon.className = 'lb-ship-icon';
  icon.width = 40;
  icon.height = 40;
  icon.setAttribute('aria-hidden', 'true');
  paintMiniShip(icon, entry.ship);
  const parsedCustom = typeof entry.ship === 'string' && entry.ship.startsWith('custom:') ? parseCustomCode(entry.ship) : null;
  if (parsedCustom) {
    const code = formatShareCode(parsedCustom);
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'lb-code-btn';
    copyBtn.title = `Copy build code ${code}`;
    copyBtn.textContent = code;
    copyBtn.addEventListener('click', () => copyBuildCode(code, copyBtn));
    shipEl.append(icon, copyBtn);
  } else {
    const shipName = document.createElement('span');
    shipName.textContent = RIGS[entry.ship]?.name || 'Kestrel';
    shipEl.append(icon, shipName);
  }

  const waveEl = document.createElement('span');
  waveEl.className = 'lb-wave';
  waveEl.textContent = `W${String(entry.wave || 1).padStart(2, '0')}`;

  const scoreEl = document.createElement('span');
  scoreEl.className = 'lb-score';
  scoreEl.textContent = Math.floor(entry.score || 0).toLocaleString();

  row.append(rankEl, pilotEl, shipEl, waveEl, scoreEl);
  return row;
}

function renderLbMe(me) {
  if (!me) {
    lbMeEl.hidden = true;
    return;
  }
  lbMeEl.hidden = false;
  lbMeEl.innerHTML = '';
  const left = document.createElement('span');
  left.className = 'lb-me-left';
  const rankSpan = document.createElement('span');
  rankSpan.className = 'lb-me-rank';
  rankSpan.textContent = `YOUR RANK #${me.rank}`;
  const infoSpan = document.createElement('span');
  const parsedCustom = typeof me.ship === 'string' && me.ship.startsWith('custom:') ? parseCustomCode(me.ship) : null;
  const shipLabel = parsedCustom ? formatShareCode(parsedCustom) : (RIGS[me.ship]?.name || 'Kestrel').toUpperCase();
  infoSpan.textContent = `${me.name} · ${shipLabel}${me.overclock ? ' ⚡' : ''}`;
  left.append(rankSpan, infoSpan);
  if (parsedCustom) {
    const code = formatShareCode(parsedCustom);
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'lb-code-btn';
    copyBtn.title = `Copy your build code ${code}`;
    copyBtn.textContent = 'COPY';
    copyBtn.addEventListener('click', () => copyBuildCode(code, copyBtn));
    left.append(copyBtn);
  }

  const right = document.createElement('span');
  right.className = 'lb-me-score';
  right.textContent = `${Math.floor(me.score).toLocaleString()} PTS`;
  lbMeEl.append(left, right);
}

async function fetchLeaderboardPage(append = false, opts = {}) {
  const { highlightMe = false } = opts;
  if (!append) {
    lbOffset = 0;
    lbListEl.innerHTML = '<div class="lb-empty">CONNECTING TO ORBITAL RANKINGS...</div>';
    lbMoreBtn.hidden = true;
  } else {
    lbMoreBtn.disabled = true;
  }

  let data = null;
  try {
    const res = await fetch(
      `/api/leaderboard?limit=100&offset=${lbOffset}&playerId=${encodeURIComponent(lbProfile.playerId)}`,
      { cache: 'no-store' },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
    lbOffline = false;
    // Keep local submittedBest synced with the live global leaderboard so unranked players can always submit!
    const liveMyScore = data.me ? Math.max(0, Math.floor(Number(data.me.score) || 0)) : 0;
    if (liveMyScore !== lbProfile.submittedBest) {
      lbProfile.submittedBest = liveMyScore;
      saveLbProfile();
    }
  } catch {
    // Clean local fallback when previewing statically without `netlify dev`
    lbOffline = true;
    const rows = readLocalFallbackLb();
    const slice = rows.slice(lbOffset, lbOffset + 100);
    const myIdx = rows.findIndex((r) => r.playerId === lbProfile.playerId);
    data = {
      entries: slice.map((r, i) => ({
        rank: lbOffset + i + 1,
        name: r.name,
        score: r.score,
        wave: r.wave,
        ship: r.ship,
        overclock: Boolean(r.overclock),
        isMe: r.playerId === lbProfile.playerId,
      })),
      total: rows.length,
      me: myIdx >= 0 ? { ...rows[myIdx], rank: myIdx + 1 } : null,
    };
  }

  if (!append) lbListEl.innerHTML = '';
  lbTotal = data.total || 0;
  lbSubEl.textContent = lbOffline
    ? 'Local preview mode · Live DB activates on Netlify deploy'
    : 'Top 1,000 pilots worldwide · Personal bests only';
  renderLbMe(data.me);
  lbMeEl.classList.toggle('is-just-saved', Boolean(highlightMe && data.me));

  if (data.entries?.length) {
    const frag = document.createDocumentFragment();
    for (const entry of data.entries) frag.append(buildLbRow(entry));
    lbListEl.append(frag);
    lbOffset += data.entries.length;
  } else if (!append) {
    lbListEl.innerHTML = '<div class="lb-empty">NO PILOTS RECORDED YET — SET A NEW RECORD TO CLAIM #1!</div>';
  }

  if (highlightMe) {
    const myRow = lbListEl.querySelector('.lb-row.is-me');
    if (myRow) {
      myRow.classList.add('is-just-saved');
      requestAnimationFrame(() => myRow.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    }
  }

  lbCountEl.textContent = `${lbTotal.toLocaleString()} / 1,000 PILOTS`;
  lbMoreBtn.hidden = lbOffset >= lbTotal || lbOffset >= 1000;
  lbMoreBtn.disabled = false;
}

function openLeaderboard(opts = {}) {
  if (!opts.silent) sound.uiClick();
  leaderboardDialog.removeAttribute('data-closing');
  if (!leaderboardDialog.open) leaderboardDialog.showModal();
  fetchLeaderboardPage(false, opts);
}

document.querySelector('#ranks-open')?.addEventListener('click', () => openLeaderboard());
document.querySelector('#ranks-open-top')?.addEventListener('click', () => openLeaderboard());
lbMoreBtn?.addEventListener('click', () => {
  sound.uiClick();
  fetchLeaderboardPage(true);
});

recordSubmitForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const rawName = pilotNameInput.value.trim().replace(/\s+/g, ' ');
  if (rawName.length < 2 || rawName.length > 14 || !/^[\p{L}\p{N} _-]+$/u.test(rawName)) {
    recordStatusEl.textContent = 'Use 2-14 letters, numbers, spaces, - or _.';
    recordStatusEl.classList.add('is-error');
    return;
  }

  saveRecordBtn.disabled = true;
  pilotNameInput.disabled = true;
  saveRecordBtn.textContent = 'SAVING...';
  recordStatusEl.textContent = '';
  recordStatusEl.classList.remove('is-error');

  const payload = {
    playerId: lbProfile.playerId,
    name: rawName,
    score: Math.floor(score),
    wave: currentWave,
    kills,
    durationSec: runDuration,
    ship: runShip,
    overclock: runOverclock,
  };

  try {
    let data;
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      data = json;
    } catch (netErr) {
      // Only fall back to local preview on localhost when Functions server isn't running
      const isLocal = location.hostname === '127.0.0.1' || location.hostname === 'localhost';
      if (isLocal) {
        data = saveLocalFallbackScore(payload);
      } else {
        throw netErr;
      }
    }

    lbProfile.name = rawName;
    if (data.saved || data.me) {
      lbProfile.submittedBest = Math.max(lbProfile.submittedBest, payload.score);
      lbProfile.submittedShip = runShip;
      runIsNewBest = false;
    }
    saveLbProfile();
    sound.uiBuy();

    if (data.reason === 'below_cutoff') {
      saveRecordBtn.textContent = 'OUT OF TOP 1K';
      recordStatusEl.textContent = `Score below Top 1,000 cutoff (${(data.cutoff || 0).toLocaleString()}).`;
      return;
    }

    // Close the compact popup and immediately open the Leaderboard with your rank lit up!
    if (recordDialog.open) recordDialog.close();
    openLeaderboard({ highlightMe: true, silent: true });
  } catch (err) {
    saveRecordBtn.disabled = false;
    pilotNameInput.disabled = false;
    saveRecordBtn.textContent = 'SAVE RANK';
    recordStatusEl.textContent = err.message || 'Could not save score. Try again.';
    recordStatusEl.classList.add('is-error');
  }
});

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

for (const tab of document.querySelectorAll('.hangar-tab')) {
  tab.addEventListener('click', () => {
    hangarRig = tab.dataset.tab;
    sound.uiShip(hangarRig);
    renderUpgrades();
  });
}

overclockToggle.addEventListener('click', () => {
  meta.overclock = !meta.overclock;
  saveMeta();
  if (meta.overclock) sound.overclockOn();
  else sound.overclockOff();
  syncMetaUi();
});

function renderRecordsAndMilestones() {
  recWaveEl.textContent = String(meta.records.bestWave).padStart(2, '0');
  recSectorEl.textContent = String(meta.records.bestSector).padStart(2, '0');
  recBossesEl.textContent = String(meta.records.bossesDowned);
  recFlawlessEl.textContent = String(meta.records.flawlessBosses);
  milestoneListEl.innerHTML = '';
  for (const def of MILESTONE_DEFS) {
    const done = Boolean(meta.milestones[def.id]);
    const item = document.createElement('div');
    item.className = 'milestone-item' + (done ? ' done' : '');
    item.innerHTML = `<span>${def.label}</span><span class="milestone-reward">${done ? '✓ DONE' : '+' + def.reward}</span>`;
    milestoneListEl.append(item);
  }
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
    btn.innerHTML = maxed ? 'MAXED' : `<i class="coin-dot" aria-hidden="true"></i>${cost.toLocaleString()}`;
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

  // Render unlockable per-ship Liveries / Skins with actual live ship preview illustrations!
  skinListEl.innerHTML = '';
  if (hangarRig === 'custom') {
    if (skinSectionLabel) skinSectionLabel.textContent = 'Custom Hull Paint';
    skinListEl.style.display = 'block';
    const note = document.createElement('div');
    note.className = 'hangar-custom-note';
    note.innerHTML = `<span>Custom hull parts &amp; paint (${formatShareCode(meta.customBuild)}) are configured in Ship Forge.</span>`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'OPEN FORGE';
    btn.addEventListener('click', () => {
      hangar.close();
      openForge();
    });
    note.append(btn);
    skinListEl.append(note);
  } else {
    if (skinSectionLabel) skinSectionLabel.textContent = 'Ship Livery';
    skinListEl.style.display = '';
    const ownedSkins = meta.skins[hangarRig] || ['standard'];
    const equipped = meta.equippedSkin[hangarRig] || 'standard';
    for (const skin of SHIP_SKINS) {
      const isOwned = ownedSkins.includes(skin.id);
      const isEquipped = equipped === skin.id;
      const canBuy = !isOwned && meta.coins >= skin.cost;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'skin-btn';
      btn.setAttribute('aria-pressed', String(isEquipped));
      btn.disabled = !isOwned && !canBuy;

      const preview = document.createElement('canvas');
      preview.className = 'skin-preview';
      preview.width = 88;
      preview.height = 88;
      preview.setAttribute('aria-hidden', 'true');
      const pc = preview.getContext('2d');
      const accent = getSkinAccent(skin.id, getBaseRig(hangarRig).accent);
      pc.save();
      pc.translate(44, 44);
      const glow = pc.createRadialGradient(0, 4, 3, 0, 4, 34);
      glow.addColorStop(0, accent + '36');
      glow.addColorStop(1, accent + '00');
      pc.fillStyle = glow;
      pc.beginPath();
      pc.arc(0, 4, 34, 0, TAU);
      pc.fill();
      pc.scale(0.68, 0.68);
      drawInterceptor(pc, hangarRig, skin.id);
      pc.restore();

      const nameEl = document.createElement('span');
      nameEl.textContent = skin.name;
      const costEl = document.createElement('span');
      costEl.className = 'skin-cost' + (isOwned ? ' owned' : '');
      costEl.textContent = isEquipped ? 'ACTIVE' : isOwned ? 'EQUIP' : skin.cost.toLocaleString();

      btn.append(preview, nameEl, costEl);
      btn.addEventListener('click', () => {
        const bought = !isOwned;
        if (bought) {
          if (meta.coins < skin.cost) return;
          meta.coins -= skin.cost;
          meta.skins[hangarRig].push(skin.id);
        }
        meta.equippedSkin[hangarRig] = skin.id;
        saveMeta();
        if (bought) sound.uiBuy();
        else sound.uiClick();
        renderShipPreviews();
        syncMetaUi();
        renderUpgrades();
        draw();
      });
      skinListEl.append(btn);
    }
  }

  refundBtn.disabled = totalSpent === 0;
  refundBtn.textContent = `Refund ${getBaseRig(hangarRig).name} (${totalSpent.toLocaleString()} coins)`;
}

// --- LIVE CENTERED EXPLODED-VIEW SHIP FORGE (SHIP IN CENTER + 4 RADIAL CALLOUTS AROUND IT!) ---
const FORGE_STAT_ICONS = {
  speed:
    '<svg class="forge-stat-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 17 11 12 5 7"/><path d="M12 17 18 12 12 7"/><path d="M19 15.5 22 12 19 8.5" opacity="0.55"/></svg>',
  fire:
    '<svg class="forge-stat-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/><path d="M12 2.5v3.2M12 18.3v3.2M2.5 12h3.2M18.3 12h3.2"/></svg>',
  cool:
    '<svg class="forge-stat-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.5v19M3.8 7.25l16.4 9.5M20.2 7.25l-16.4 9.5"/><path d="M9.6 4.8 12 7l2.4-2.2M9.6 19.2 12 17l2.4 2.2M4.8 10.6 7.6 9.5 6.4 6.7M19.2 13.4 16.4 14.5 17.6 17.3M17.6 6.7 16.4 9.5 19.2 10.6M6.4 17.3 7.6 14.5 4.8 13.4"/></svg>',
};

const FORGE_PART_ICONS = {
  nose:
    '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2.5 21 12.5 19.5 23.5 14 25.5 8.5 23.5 7 12.5Z" fill="currentColor" fill-opacity="0.12"/><path d="M14 8.5 16.8 13.5 14 18.2 11.2 13.5Z" fill="currentColor" fill-opacity="0.45"/><path d="M10.2 20.5h7.6" opacity="0.65"/></svg>',
  wings:
    '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 5.5 16.5 11v10.5L14 23l-2.5-1.5V11Z" opacity="0.55"/><path d="M11.5 11.5 2.5 18.5 3.5 22.5 11.5 19.5Z" fill="currentColor" fill-opacity="0.18"/><path d="M16.5 11.5 25.5 18.5 24.5 22.5 16.5 19.5Z" fill="currentColor" fill-opacity="0.18"/><path d="M6.2 8.2a11.5 11.5 0 0 1 15.6 0" stroke-dasharray="2.5 2.5" opacity="0.78"/></svg>',
  weapon:
    '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6.5" y="7.5" width="4.2" height="14.5" rx="1" fill="currentColor" fill-opacity="0.16"/><rect x="17.3" y="7.5" width="4.2" height="14.5" rx="1" fill="currentColor" fill-opacity="0.16"/><path d="M10.7 15.5h6.6M8.6 3.2v2.4M19.4 3.2v2.4"/><path d="M14 9.5v4M12 11.5h4" opacity="0.72"/></svg>',
  engine:
    '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 4.5h9l1.8 7.5-2.3 3.5h-8L7.7 12Z" fill="currentColor" fill-opacity="0.15"/><circle cx="14" cy="10" r="2.2" fill="currentColor" fill-opacity="0.45"/><path d="M10.8 18.2 14 25.2l3.2-7" fill="currentColor" fill-opacity="0.28"/><path d="M14 18.2v3.6" opacity="0.85"/></svg>',
};

const FORGE_SLOTS = {
  nose: { label: 'Nose / Hull', full: 'Nose / Hull Frame', items: CUSTOM_PARTS.nose, cols: 'cols-3', anchor: [0, -0.44], side: 'left', icon: FORGE_PART_ICONS.nose },
  wings: { label: 'Wings / Shield', full: 'Wings / Shield Array', items: CUSTOM_PARTS.wings, cols: '', anchor: [-0.37, 0.14], side: 'left', icon: FORGE_PART_ICONS.wings },
  weapon: { label: 'Weapon System', full: 'Primary Weapon System', items: CUSTOM_PARTS.weapon, cols: '', anchor: [0.24, -0.13], side: 'right', icon: FORGE_PART_ICONS.weapon },
  engine: { label: 'Engine / Perk', full: 'Engine Core / Perk', items: CUSTOM_PARTS.engine, cols: '', anchor: [0, 0.36], side: 'right', icon: FORGE_PART_ICONS.engine },
};
let activeForgeSlot = null;

let pendingForgeExitAction = null;

function hasForgeChanges() {
  if (!forgeDraft) return false;
  const saved = meta.customBuild;
  return (
    forgeDraft.nose !== saved.nose ||
    forgeDraft.wings !== saved.wings ||
    forgeDraft.weapon !== saved.weapon ||
    forgeDraft.engine !== saved.engine ||
    forgeDraft.paint !== saved.paint
  );
}

function applyForgeDraft(silent = false) {
  if (!forgeDraft) return;
  meta.customBuild = { ...forgeDraft };
  saveMeta();
  if (!silent) sound.uiBuy();
  syncRigButtons();
  renderShipPreviews();
  syncMetaUi();
}

function discardForgeDraft() {
  forgeDraft = { ...meta.customBuild };
}

function requestCloseSlot() {
  if (!activeForgeSlot) return;
  if (hasForgeChanges()) {
    pendingForgeExitAction = 'slot';
    sound.uiClick();
    unsavedDialog.removeAttribute('data-closing');
    if (!unsavedDialog.open) unsavedDialog.showModal();
    return;
  }
  activeForgeSlot = null;
  sound.uiClose();
  renderForge();
  draw();
}

function renderForge() {
  const b = getActiveCustomBuild();
  const stats = computeCustomStats(b);
  const pwr = stats.power;
  const freePwr = CUSTOM_MAX_POWER - pwr;
  const shareCode = formatShareCode(b);
  const dirty = hasForgeChanges();

  forgeCodeVal.textContent = shareCode;
  forgePwrText.textContent = `${pwr} / ${CUSTOM_MAX_POWER} PWR`;
  forgePwrText.classList.toggle('is-max', pwr >= CUSTOM_MAX_POWER);

  forgePwrBars.innerHTML = '';
  for (let i = 0; i < CUSTOM_MAX_POWER; i++) {
    const seg = document.createElement('i');
    if (i < pwr) {
      seg.classList.add('on');
      if (i >= CUSTOM_MAX_POWER - 2) seg.classList.add('hot');
    }
    forgePwrBars.append(seg);
  }

  forgeStatsEl.innerHTML = '';

  // In-game style HULL + SHIELD vitals gauge (glowing skewed crimson & cyan pips + divider!)
  const vitalsChip = document.createElement('div');
  vitalsChip.className = 'forge-vitals-chip';
  const maxHullPips = 4;
  const maxShieldPips = 4;
  let hullPipsHtml = '';
  for (let i = 0; i < maxHullPips; i++) {
    hullPipsHtml += `<i class="hull-pip${i >= stats.hull ? ' spent' : ''}"></i>`;
  }
  let shieldPipsHtml = '';
  for (let i = 0; i < maxShieldPips; i++) {
    shieldPipsHtml += `<i class="shield-pip${i >= stats.shields ? ' spent' : ''}"></i>`;
  }
  vitalsChip.innerHTML =
    `<div class="forge-vitals-head"><span class="hull-stat">HULL <b>${stats.hull}</b></span><span class="shield-stat">SHIELD <b>${stats.shields}</b></span></div>` +
    `<div class="forge-vitals-bars" aria-label="${stats.hull} hull, ${stats.shields} shield">${hullPipsHtml}<span class="vitals-sep" aria-hidden="true"></span>${shieldPipsHtml}</div>`;
  forgeStatsEl.append(vitalsChip);

  const statChips = [
    { label: 'SPEED', val: `${stats.speed}`, cls: 'speed', icon: FORGE_STAT_ICONS.speed },
    { label: 'FIRE', val: `${(1 / stats.fireRate).toFixed(1)}/s`, cls: 'gold', icon: FORGE_STAT_ICONS.fire },
    { label: 'COOL', val: `${Math.round((1 / stats.heatMult) * 100)}%`, cls: 'cool', icon: FORGE_STAT_ICONS.cool },
  ];
  for (const s of statChips) {
    const chip = document.createElement('div');
    chip.className = `forge-stat-chip ${s.cls}`.trim();
    chip.innerHTML = `<span class="forge-stat-icon-wrap">${s.icon}</span><span class="forge-stat-text"><small>${s.label}</small><b>${s.val}</b></span>`;
    forgeStatsEl.append(chip);
  }

  // Tell CSS which side is expanded so ship shifts opposite & opposite cards glide away!
  const activeSide = activeForgeSlot ? FORGE_SLOTS[activeForgeSlot]?.side || '' : '';
  if (activeSide) forgeScreen.dataset.activeSide = activeSide;
  else delete forgeScreen.dataset.activeSide;

  // Update the 4 surrounding callout nodes; when one is selected, hide its sibling & place X above + red APPLY below!
  for (const [slotKey, spec] of Object.entries(FORGE_SLOTS)) {
    const wrap = forgeNodesEl.querySelector(`.forge-slot-wrap[data-slot="${slotKey}"]`);
    const node = forgeNodesEl.querySelector(`.forge-node[data-slot="${slotKey}"]`);
    const picker = forgeNodesEl.querySelector(`.forge-inline-picker[data-picker="${slotKey}"]`);
    if (!wrap || !node || !picker) continue;
    const part = spec.items[b[slotKey]] || spec.items[0];
    const isSelected = slotKey === activeForgeSlot;
    wrap.dataset.state = !activeForgeSlot ? 'idle' : isSelected ? 'active' : 'hidden';

    wrap.querySelector('.forge-slot-topbar')?.remove();

    node.setAttribute('aria-pressed', String(isSelected));
    node.innerHTML =
      `<span class="forge-node-left">` +
        `<span class="forge-node-head"><span class="forge-node-kicker">${spec.label}</span><span class="forge-pwr-tag">${part.pwr} PWR</span></span>` +
        `<strong>${part.name}</strong>` +
        `<small>${part.desc}</small>` +
      `</span>` +
      `<span class="forge-node-right">` +
        `<span class="forge-node-icon" aria-hidden="true">${spec.icon}</span>` +
        `${isSelected ? '' : '<span class="forge-node-edit">EDIT</span>'}` +
      `</span>`;

    if (!isSelected) {
      picker.hidden = true;
      picker.innerHTML = '';
      continue;
    }

    const topbar = document.createElement('div');
    topbar.className = 'forge-slot-topbar';
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'forge-slot-close';
    closeBtn.setAttribute('aria-label', 'Close module picker');
    closeBtn.innerHTML = '<span aria-hidden="true">×</span> CLOSE';
    closeBtn.addEventListener('click', () => requestCloseSlot());
    topbar.append(closeBtn);
    wrap.prepend(topbar);

    picker.hidden = false;
    picker.innerHTML = '';

    const head = document.createElement('div');
    head.className = 'forge-tray-head';
    head.innerHTML = `<span>Select Module</span><b>${freePwr > 0 ? `${freePwr} PWR FREE` : 'MAX REACTOR'}</b>`;

    const grid = document.createElement('div');
    grid.className = `forge-options ${spec.cols}`.trim();
    for (const opt of spec.items) {
      const selected = b[slotKey] === opt.id;
      const nextPwr = pwr - part.pwr + opt.pwr;
      const overBudget = !selected && nextPwr > CUSTOM_MAX_POWER;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'forge-opt' + (overBudget ? ' over-budget' : '');
      btn.setAttribute('aria-pressed', String(selected));
      btn.disabled = overBudget;
      btn.dataset.partKey = slotKey;
      btn.dataset.partId = String(opt.id);
      btn.innerHTML = `<span class="forge-opt-top"><strong>${opt.name}</strong><span class="forge-pwr-tag">${opt.pwr} PWR</span></span><small>${opt.desc}</small>`;
      btn.addEventListener('click', () => {
        if (overBudget) return;
        if (selected) {
          if (slotKey === 'weapon') fireForgeWeaponDemo(opt.kind);
          return;
        }
        forgeDraft = { ...b, [slotKey]: opt.id };
        if (slotKey === 'weapon') {
          fireForgeWeaponDemo(opt.kind);
        } else {
          sound.uiClick();
        }
        forgeStatusEl.textContent = '';
        forgeStatusEl.classList.remove('is-error');
        renderForge();
        draw();
      });
      grid.append(btn);
    }

    picker.append(head, grid);

    // Vivid red APPLY button right beneath the module options when changed!
    if (dirty) {
      const actions = document.createElement('div');
      actions.className = 'forge-picker-actions';
      const applyBtn = document.createElement('button');
      applyBtn.type = 'button';
      applyBtn.id = 'forge-apply';
      applyBtn.className = 'forge-apply-btn';
      applyBtn.textContent = 'APPLY';
      applyBtn.addEventListener('click', () => {
        applyForgeDraft();
        activeForgeSlot = null;
        forgeStatusEl.textContent = `Applied ${formatShareCode(meta.customBuild)}!`;
        forgeStatusEl.classList.remove('is-error');
        renderForge();
        draw();
      });
      actions.append(applyBtn);
      picker.append(actions);
    }
  }

  // Paint swatches in the bottom dock (0 PWR — applies immediately!)
  forgePaintsEl.innerHTML = '';
  for (const p of CUSTOM_PARTS.paint) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'forge-paint-chip';
    btn.title = `${p.name} Paint (0 PWR)`;
    btn.setAttribute('aria-label', `${p.name} paint`);
    btn.setAttribute('aria-pressed', String(b.paint === p.id));
    btn.dataset.partKey = 'paint';
    btn.dataset.partId = String(p.id);
    btn.innerHTML = `<i style="background:${p.swatch[0]}"></i><i style="background:${p.swatch[1]}"></i><i style="background:${p.swatch[2]}"></i>`;
    btn.addEventListener('click', () => {
      if (b.paint === p.id) return;
      meta.customBuild = { ...meta.customBuild, paint: p.id };
      if (forgeDraft) forgeDraft.paint = p.id;
      saveMeta();
      sound.uiClick();
      renderForge();
      syncRigButtons();
      renderShipPreviews();
      draw();
    });
    forgePaintsEl.append(btn);
  }
}

for (const node of forgeNodesEl.querySelectorAll('.forge-node')) {
  node.addEventListener('click', () => {
    const slot = node.dataset.slot;
    if (activeForgeSlot === slot) {
      requestCloseSlot();
      return;
    }
    activeForgeSlot = slot;
    sound.uiClick();
    renderForge();
    draw();
  });
}

function fireForgeWeaponDemo(kind) {
  if (!forgeActive) return;
  clearTimeout(forgeDemoTimer);
  const desktopForge = w >= 860;
  const size = desktopForge ? Math.min(w * 0.16, h * 0.27, 174) : Math.min(w * 0.3, 108);
  const sc = size / 94;
  const ox0 = introShip.x;
  const oy0 = introShip.y;

  const emit = (ox, oy, angle, speed, opts = {}) => {
    forgeDemoShots.push({
      x: ox0 + ox * sc,
      y: oy0 + oy * sc,
      vx: Math.sin(angle) * speed,
      vy: -Math.cos(angle) * speed,
      life: 1.4,
      age: 0,
      ...opts,
    });
  };

  introShip.muzzle = 0.14;
  introShip.recoil = kind === 'aegis' ? 6.5 : 4.2;
  sound.uiWeaponPreview(kind);

  if (kind === 'aegis') {
    emit(0, -48, 0, 620, { heavy: true });
    emit(-24, -26, -0.15, 585, { heavy: true });
    emit(24, -26, 0.15, 585, { heavy: true });
  } else if (kind === 'falcon') {
    emit(-14, -44, -0.04, 680);
    emit(14, -44, 0.04, 680);
    emit(-28, -10, -0.82, 270, { homing: true, side: -1 });
    emit(28, -10, 0.82, 270, { homing: true, side: 1 });
  } else if (kind === 'pulse') {
    emit(-16, -42, -0.03, 660);
    emit(16, -42, 0.03, 660);
    forgeDemoTimer = setTimeout(() => {
      if (!forgeActive) return;
      introShip.muzzle = 0.12;
      introShip.recoil = 3.2;
      forgeDemoShots.push(
        { x: introShip.x - 16 * sc, y: introShip.y - 42 * sc, vx: -20, vy: -660, life: 1.4, age: 0 },
        { x: introShip.x + 16 * sc, y: introShip.y - 42 * sc, vx: 20, vy: -660, life: 1.4, age: 0 },
      );
    }, 115);
  } else {
    emit(0, -52, 0, 790, { pierce: 2 });
    emit(-22, -32, -0.09, 690, { pierce: 1 });
    emit(22, -32, 0.09, 690, { pierce: 1 });
  }
}

function openForge(opts = {}) {
  selectedRig = 'custom';
  hangarRig = 'custom';
  activeForgeSlot = null;
  forgeDraft = { ...meta.customBuild };
  forgeDemoShots = [];
  clearTimeout(forgeDemoTimer);
  try {
    localStorage.setItem('low-orbit-rig', 'custom');
  } catch {}
  syncRigButtons();
  syncMetaUi();
  forgeActive = true;
  if (reducedMotion.matches) forgeBlend = 1;
  document.body.dataset.forge = 'true';
  forgeScreen.setAttribute('aria-hidden', 'false');
  forgeStatusEl.textContent = '';
  forgeStatusEl.classList.remove('is-error');
  forgeImportInput.value = '';
  if (!opts.fromPopstate && location.hash !== '#forge') {
    try {
      history.pushState({ forge: true }, '', '#forge');
      forgePushedHistory = true;
    } catch {}
  }
  renderForge();
  if (!frame && (mode === 'intro' || mode === 'over') && !reducedMotion.matches) {
    lastTime = 0;
    frame = requestAnimationFrame(tick);
  }
  draw();
}

function closeForge(opts = {}) {
  if (!forgeActive) return;
  if (!opts.silent) sound.uiClose();
  forgeActive = false;
  activeForgeSlot = null;
  forgeDraft = null;
  forgeDemoShots = [];
  clearTimeout(forgeDemoTimer);
  if (reducedMotion.matches) forgeBlend = 0;
  delete document.body.dataset.forge;
  delete forgeScreen.dataset.activeSide;
  forgeScreen.setAttribute('aria-hidden', 'true');
  syncRigButtons();
  renderShipPreviews();
  syncMetaUi();
  if (!opts.fromPopstate && location.hash === '#forge') {
    try {
      if (forgePushedHistory) {
        forgePushedHistory = false;
        suppressNextForgePop = true;
        history.back();
      } else {
        history.replaceState(null, '', location.pathname + location.search);
      }
    } catch {}
  } else if (opts.fromPopstate) {
    forgePushedHistory = false;
  }
  draw();
}

function requestCloseForge(opts = {}) {
  if (!forgeActive) return;
  if (hasForgeChanges()) {
    pendingForgeExitAction = 'forge';
    if (opts.fromPopstate && location.hash !== '#forge') {
      try {
        history.pushState({ forge: true }, '', '#forge');
        forgePushedHistory = true;
      } catch {}
    }
    sound.uiClick();
    unsavedDialog.removeAttribute('data-closing');
    if (!unsavedDialog.open) unsavedDialog.showModal();
    return;
  }
  closeForge(opts);
}

window.addEventListener('popstate', () => {
  if (suppressNextForgePop) {
    suppressNextForgePop = false;
    return;
  }
  if (forgeActive && location.hash !== '#forge') {
    requestCloseForge({ fromPopstate: true });
  } else if (!forgeActive && location.hash === '#forge' && mode !== 'playing') {
    openForge({ fromPopstate: true });
  }
});

forgeBackBtn?.addEventListener('click', () => requestCloseForge());

unsavedApplyBtn?.addEventListener('click', () => {
  const actionKind = pendingForgeExitAction;
  pendingForgeExitAction = null;
  applyForgeDraft();
  if (unsavedDialog.open) unsavedDialog.close();
  if (actionKind === 'slot') {
    activeForgeSlot = null;
    forgeStatusEl.textContent = `Applied ${formatShareCode(meta.customBuild)}!`;
    forgeStatusEl.classList.remove('is-error');
    renderForge();
    draw();
  } else {
    closeForge({ silent: true });
  }
});

unsavedDiscardBtn?.addEventListener('click', () => {
  const actionKind = pendingForgeExitAction;
  pendingForgeExitAction = null;
  discardForgeDraft();
  if (unsavedDialog.open) unsavedDialog.close();
  if (actionKind === 'slot') {
    activeForgeSlot = null;
    sound.uiClose();
    renderForge();
    draw();
  } else {
    closeForge();
  }
});

unsavedCancelBtn?.addEventListener('click', () => {
  pendingForgeExitAction = null;
  sound.uiClose();
  closeTopLayer(unsavedDialog);
});

forgeCopyBtn?.addEventListener('click', () => {
  const code = formatShareCode(getActiveCustomBuild());
  copyBuildCode(code, forgeCopyBtn);
  forgeStatusEl.textContent = `Copied ${code} — share it with friends to import your ship!`;
  forgeStatusEl.classList.remove('is-error');
});

forgeImportForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const parsed = parseCustomCode(forgeImportInput.value);
  if (!parsed) {
    sound.uiClose();
    forgeStatusEl.textContent = 'Invalid code or exceeds 10 PWR limit (example: LO-11200).';
    forgeStatusEl.classList.add('is-error');
    return;
  }
  meta.customBuild = parsed;
  forgeDraft = { ...parsed };
  saveMeta();
  sound.uiBuy();
  const code = formatShareCode(parsed);
  forgeImportInput.value = '';
  forgeStatusEl.textContent = `Loaded & applied blueprint ${code} (${computeCustomPower(parsed)} / ${CUSTOM_MAX_POWER} PWR)!`;
  forgeStatusEl.classList.remove('is-error');
  renderForge();
  syncRigButtons();
  renderShipPreviews();
  syncMetaUi();
  draw();
});

forgeEquipBtn?.addEventListener('click', () => {
  if (hasForgeChanges()) applyForgeDraft(true);
  selectedRig = 'custom';
  hangarRig = 'custom';
  try {
    localStorage.setItem('low-orbit-rig', 'custom');
  } catch {}
  syncRigButtons();
  syncMetaUi();
  renderShipPreviews();
  sound.uiLaunch(meta.overclock);
  launch();
});

function syncMetaUi() {
  coinBankEl.textContent = meta.coins.toLocaleString();
  upgradeDot.hidden = !canAffordAnyUpgrade();
  overclockToggle.setAttribute('aria-pressed', String(meta.overclock));
  document.body.dataset.overclock = String(meta.overclock);
  renderRigPips();
}

function openHangar() {
  sound.uiClick();
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
  sound.uiRefund();
  syncMetaUi();
  renderUpgrades();
});

document.querySelector('#guide-open').addEventListener('click', () => {
  sound.uiClick();
  renderRecordsAndMilestones();
  manual.showModal();
});
hangarOpenBtn.addEventListener('click', openHangar);
coinBankBtn.addEventListener('click', () => {
  if (mode !== 'playing') openHangar();
});
syncMetaUi();

for (const preview of manual.querySelectorAll('[data-craft]')) {
  const craft = preview.dataset.craft;
  drawFoe(preview.getContext('2d'), {
    kind: craft,
    x: 44,
    y: 44,
    r: 30,
    fireIn: 2,
    age: 0,
    frontShield: craft === 'vanguard',
    hatchIn: craft === 'swarmpod' ? 1.8 : 0,
  });
}

// Instant launch into live orbital canvas — zero artificial delay!
loadPlanets(true, draw);
resize();
startIntro();
if (location.hash === '#forge') openForge({ fromPopstate: true });
