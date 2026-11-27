// Full procedural multi-chassis flagship generator:
// 8 dramatically distinct geometric hull archetypes, shuffled randomly every run,
// paired with procedural palettes, subsystems, movement, volleys, and escalating specials.
import { createEnemy } from './encounters.js';

const TAU = Math.PI * 2;

const BOSS_PALETTES = [
  { armor: '#c86652', secondary: '#823f48', trim: '#322b3d', light: '#ffd494', bullet: '#ff8a5c' },
  { armor: '#6d8ca8', secondary: '#405a78', trim: '#253145', light: '#99f5ea', bullet: '#7ee6ff' },
  { armor: '#b37aa8', secondary: '#6c4270', trim: '#352645', light: '#ffd4be', bullet: '#e0b3ff' },
  { armor: '#cc984d', secondary: '#82582c', trim: '#3d2c22', light: '#fff0ad', bullet: '#ffca6b' },
  { armor: '#5e9e84', secondary: '#346359', trim: '#203838', light: '#b5ffdf', bullet: '#7ef2c2' },
  { armor: '#cf5a74', secondary: '#82304b', trim: '#3d2030', light: '#ffd0da', bullet: '#ff7fa3' },
  { armor: '#8478cc', secondary: '#4d448f', trim: '#27244a', light: '#d6d4ff', bullet: '#b0abff' },
  { armor: '#d47e4c', secondary: '#854534', trim: '#382524', light: '#ffe7a6', bullet: '#ffa863' },
  { armor: '#d9c27a', secondary: '#8a6b38', trim: '#2e2620', light: '#fff8d4', bullet: '#ffe18c' },
  { armor: '#4c9e9b', secondary: '#245863', trim: '#162836', light: '#9effef', bullet: '#6ef5e8' },
];

// 10 genuinely distinct flagship chassis archetypes — concise 2-word classes (3 words max with callsign!)
const CHASSIS_TYPES = [
  {
    id: 'catamaran',
    label: 'TWIN DREADNOUGHT',
    defaultRole: 'turret',
    phases: 3,
    signature: 'beam',
    r: 42,
  },
  {
    id: 'citadel',
    label: 'RING CITADEL',
    defaultRole: 'prism',
    phases: 3,
    signature: 'ringburst',
    r: 40,
  },
  {
    id: 'monolith',
    label: 'PRISM MONOLITH',
    defaultRole: 'lance',
    phases: 2,
    signature: 'blink',
    r: 38,
  },
  {
    id: 'carrier',
    label: 'SIEGE CARRIER',
    defaultRole: 'bay',
    phases: 3,
    signature: 'escortWave',
    r: 44,
  },
  {
    id: 'scythe',
    label: 'BLADE HUNTER',
    defaultRole: 'lance',
    phases: 2,
    signature: 'dive',
    r: 37,
  },
  {
    id: 'leviathan',
    label: 'VOID LEVIATHAN',
    defaultRole: 'pylon',
    phases: 3,
    signature: 'waveCurtain',
    r: 41,
  },
  {
    id: 'hive',
    label: 'SWARM MOTHER',
    defaultRole: 'prism',
    phases: 3,
    signature: 'swarmSurge',
    r: 39,
  },
  {
    id: 'eclipse',
    label: 'SOLAR ECLIPSE',
    defaultRole: 'pylon',
    phases: 2,
    signature: 'gravity',
    r: 40,
  },
  {
    id: 'seraph',
    label: 'HALO CRUISER',
    defaultRole: 'repair',
    phases: 4,
    signature: 'crossBeam',
    r: 43,
  },
  {
    id: 'kraken',
    label: 'ABYSSAL TITAN',
    defaultRole: 'mortar',
    phases: 4,
    signature: 'clusterRain',
    r: 44,
  },
];

const CALLSIGNS = [
  'SCYTHE', 'BASTION', 'VESPER', 'VALKYRIE', 'HYPERION', 'CERBERUS',
  'OBSIDIAN', 'SOLSTICE', 'TEMPEST', 'NEMEAN', 'DRACO', 'AEON',
  'KRAKEN', 'SOVEREIGN', 'PHANTOM', 'GOLIATH', 'HYDRA', 'ORION',
  'TITAN', 'MANTIS', 'REVENANT', 'ZENITH',
];

function makeRng(seed) {
  let s = (seed * 2654435761) >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return (s >>> 0) / 4294967296;
  };
}

// Deterministic per-run shuffle so every run gets a completely different boss order with zero immediate repeats
function pickShuffledIndex(rank, runSeed, length) {
  const cycle = Math.floor((rank - 1) / length);
  const pos = (rank - 1) % length;
  const order = Array.from({ length }, (_, i) => i);
  const rng = makeRng(runSeed * 7919 + cycle * 104729 + 13);
  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order[pos];
}

function buildPartsForChassis(chassis, rank, rng) {
  const partHp = Math.round(24 + rank * 12);
  const parts = [];
  const role = chassis.defaultRole;

  if (chassis.id === 'seraph') {
    // 4 angelic wing emitters: 2 outer shield pylons + 2 inner nano-repair nodes!
    for (const side of [-1, 1]) {
      parts.push({
        id: `${side < 0 ? 'L' : 'R'}-WING-PYLON`,
        role: 'pylon',
        side,
        ox: side * 50,
        oy: -4,
        x: 0,
        y: 0,
        r: 14,
        hp: partHp + 2,
        maxHp: partHp + 2,
        flash: 0,
        dead: false,
      });
      parts.push({
        id: `${side < 0 ? 'L' : 'R'}-REPAIR`,
        role: 'repair',
        side,
        ox: side * 28,
        oy: 22,
        x: 0,
        y: 0,
        r: 13,
        hp: Math.round(partHp * 0.85),
        maxHp: Math.round(partHp * 0.85),
        flash: 0,
        dead: false,
      });
    }
    return parts;
  }

  if (chassis.id === 'kraken') {
    // 4 articulated swaying tentacle-arm pods (2 outer Cluster Mortars + 2 inner Rail-Lance tips!)
    const arms = [
      { side: -1, armIndex: 0, baseOx: -38, baseOy: 18, len: 28, role: 'mortar' },
      { side: 1, armIndex: 1, baseOx: 38, baseOy: 18, len: 28, role: 'mortar' },
      { side: -1, armIndex: 2, baseOx: -20, baseOy: 26, len: 26, role: 'lance' },
      { side: 1, armIndex: 3, baseOx: 20, baseOy: 26, len: 26, role: 'lance' },
    ];
    arms.forEach((a, i) => {
      parts.push({
        id: `ARM-${i + 1}`,
        role: a.role,
        side: a.side,
        tentacle: true,
        armIndex: a.armIndex,
        baseOx: a.baseOx,
        baseOy: a.baseOy,
        armLen: a.len,
        ox: a.baseOx,
        oy: a.baseOy + a.len,
        x: 0,
        y: 0,
        r: 14,
        hp: Math.round(partHp * 0.92),
        maxHp: Math.round(partHp * 0.92),
        aimLock: 0,
        aimAngle: 0,
        flash: 0,
        dead: false,
      });
    });
    return parts;
  }

  if (chassis.id === 'citadel' || chassis.id === 'hive') {
    const count = Math.min(6, 4 + Math.floor(rank / 3));
    const orbitR = chassis.id === 'citadel' ? 58 : 52;
    for (let i = 0; i < count; i++) {
      parts.push({
        id: `NODE-${i + 1}`,
        role: chassis.id === 'hive' && i % 2 === 0 ? 'bay' : 'prism',
        orbitIndex: i,
        orbitCount: count,
        orbitRadius: orbitR,
        orbiting: true,
        x: 0,
        y: 0,
        r: 13,
        hp: Math.round(partHp * 0.8),
        maxHp: Math.round(partHp * 0.8),
        flash: 0,
        dead: false,
      });
    }
    return parts;
  }

  if (chassis.id === 'monolith') {
    // 3 triangular corner emitters: 2 side rail-lances + 1 apex cluster mortar
    const offsets = [
      [0, 34, 'mortar'],
      [-38, -18, 'lance'],
      [38, -18, 'lance'],
    ];
    offsets.forEach(([ox, oy, pRole], i) => {
      parts.push({
        id: `EMITTER-${i + 1}`,
        role: pRole,
        side: ox < 0 ? -1 : ox > 0 ? 1 : 0,
        ox,
        oy,
        x: 0,
        y: 0,
        r: 14,
        hp: Math.round(partHp * 0.85),
        maxHp: Math.round(partHp * 0.85),
        aimLock: 0,
        aimAngle: 0,
        flash: 0,
        dead: false,
      });
    });
    return parts;
  }

  if (chassis.id === 'catamaran' || chassis.id === 'carrier') {
    // Twin heavy outer hulls + inner mortar/repair wings
    for (const side of [-1, 1]) {
      parts.push({
        id: `${side < 0 ? 'L' : 'R'}-POD`,
        role,
        side,
        ox: side * 44,
        oy: chassis.id === 'catamaran' ? 14 : 6,
        x: 0,
        y: 0,
        r: 16,
        hp: partHp + 3,
        maxHp: partHp + 3,
        flash: 0,
        dead: false,
      });
    }
    if (rank >= 2 || chassis.id === 'catamaran') {
      for (const side of [-1, 1]) {
        parts.push({
          id: `${side < 0 ? 'L' : 'R'}-WING`,
          role: chassis.id === 'carrier' ? 'repair' : 'mortar',
          side,
          ox: side * 24,
          oy: -16,
          x: 0,
          y: 0,
          r: 13,
          hp: Math.round(partHp * 0.72),
          maxHp: Math.round(partHp * 0.72),
          flash: 0,
          dead: false,
        });
      }
    }
    return parts;
  }

  // Scythe / Leviathan / Eclipse: symmetric wing mounts + orbiting/repair escorts
  for (const side of [-1, 1]) {
    parts.push({
      id: `${side < 0 ? 'L' : 'R'}-MOUNT`,
      role,
      side,
      ox: side * (chassis.id === 'eclipse' ? 46 : 39),
      oy: chassis.id === 'leviathan' ? 14 : 5,
      x: 0,
      y: 0,
      r: 15,
      hp: partHp + (role === 'pylon' ? 4 : 0),
      maxHp: partHp + (role === 'pylon' ? 4 : 0),
      aimLock: 0,
      aimAngle: 0,
      flash: 0,
      dead: false,
    });
  }
  if (rank >= 2 || chassis.id === 'eclipse') {
    const orbitCount = rank >= 5 ? 3 : 2;
    for (let i = 0; i < orbitCount; i++) {
      parts.push({
        id: `ORB-${i + 1}`,
        role: chassis.id === 'leviathan' && i === 0 ? 'repair' : 'prism',
        orbitIndex: i,
        orbitCount,
        orbitRadius: 62,
        orbiting: true,
        x: 0,
        y: 0,
        r: 12,
        hp: Math.round(partHp * 0.7),
        maxHp: Math.round(partHp * 0.7),
        flash: 0,
        dead: false,
      });
    }
  }
  return parts;
}

export function createBoss(rank, w, runSeed = 1, overclock = false) {
  const rng = makeRng(rank * 1301 + runSeed * 53 + 7);
  // 100% procedural order from Rank 1 onward!
  const chassisIdx = pickShuffledIndex(rank, runSeed, CHASSIS_TYPES.length);
  const chassis = CHASSIS_TYPES[chassisIdx];
  const palIdx = pickShuffledIndex(rank, runSeed + 17, BOSS_PALETTES.length);
  const nameIdx = pickShuffledIndex(rank, runSeed + 41, CALLSIGNS.length);

  const moveStyles = ['figure8', 'stalker', 'pendulum', 'weave', 'orbit'];
  const volleyStyles = ['aimed', 'fan', 'spiral', 'helix', 'cross', 'burst', 'wave'];
  const specialPool = ['dive', 'minefield', 'beam', 'ringburst', 'barrage', 'clusterRain', 'waveCurtain'];

  const moveStyle =
    chassis.id === 'scythe'
      ? 'stalker'
      : chassis.id === 'citadel'
        ? 'orbit'
        : moveStyles[Math.floor(rng() * moveStyles.length)];
  const volleyStyle =
    chassis.id === 'leviathan'
      ? 'wave'
      : chassis.id === 'citadel'
        ? 'spiral'
        : volleyStyles[Math.floor(rng() * volleyStyles.length)];
  // Every boss ALWAYS owns its bespoke signature special as primarySpecial!
  const primarySpecial = chassis.signature;
  const secondarySpecial =
    specialPool[(specialPool.indexOf(primarySpecial) + 1 + Math.floor(rng() * (specialPool.length - 1))) % specialPool.length];

  const palette = BOSS_PALETTES[palIdx];
  const maxPhases = chassis.phases;
  // Balanced durability scaled cleanly across 2-, 3-, and 4-phase bosses
  const phaseHpFactor = maxPhases === 2 ? 0.96 : maxPhases === 4 ? 1.18 : 1;
  const maxHp = Math.round(3 * (42 + rank * 22) * phaseHpFactor * (overclock ? 1.2 : 1));
  const scale = 1 + Math.min(0.24, (rank - 1) * 0.04);

  const boss = {
    kind: 'boss',
    overclock,
    rank,
    seed: rank * 1301 + runSeed * 53,
    chassis: chassis.id,
    palette,
    moveStyle,
    volleyStyle,
    primarySpecial,
    secondarySpecial,
    name: CALLSIGNS[nameIdx],
    designation: chassis.label,
    scale,
    r: Math.round(chassis.r * scale),
    x: w / 2,
    y: -96,
    hp: maxHp,
    maxHp,
    points: 520 + rank * 280 + (maxPhases === 4 ? 180 : 0),
    phase: 1,
    maxPhases,
    isFinalPhase: false,
    entering: 1.5,
    dying: 0,
    deathTick: 0,
    parts: buildPartsForChassis(chassis, rank, rng),
    launchIn: chassis.id === 'carrier' ? 2.1 : 3.2,
    sortie: 0,
    courseTime: 0,
    exposedFor: 0,
    dive: null,
    diveChain: 0,
    diveWakeTick: 0,
    blink: null,
    blinkChain: 0,
    gravityActive: 0,
    gravityWarn: 0,
    beamWarn: 0,
    beamActive: 0,
    beamAngle: 0,
    beamSweep: 0,
    twinBeam: false,
    crossBeam: false,
    ringQueue: 0,
    ringTimer: 0,
    age: 0,
    fireIn: 2.0,
    volley: 0,
    aim: 0,
    flash: 0,
  };
  syncBossParts(boss);
  return boss;
}

export function syncBossParts(b) {
  for (const p of b.parts) {
    if (p.dead) continue;
    if (p.orbiting || p.role === 'prism') {
      const dir = b.chassis === 'hive' ? -1 : 1;
      const speedMult = b.isFinalPhase ? 1.48 : 1 + (b.phase - 1) * 0.22;
      const a = dir * b.age * (0.95 * speedMult + b.rank * 0.05) + (p.orbitIndex * TAU) / p.orbitCount;
      p.x = b.x + Math.cos(a) * p.orbitRadius * b.scale;
      p.y = b.y + Math.sin(a) * (p.orbitRadius * (b.chassis === 'citadel' ? 0.85 : 0.72)) * b.scale;
    } else if (p.tentacle) {
      // Articulated swaying Kraken tentacle arms!
      const sway = Math.sin(b.age * (2.2 + (b.isFinalPhase ? 1.1 : 0)) + p.armIndex * 1.45) * 18;
      const reach = Math.cos(b.age * 1.7 + p.armIndex) * 7;
      p.midX = b.x + (p.baseOx + sway * 0.45) * b.scale;
      p.midY = b.y + (p.baseOy + p.armLen * 0.5) * b.scale;
      p.x = b.x + (p.baseOx + sway) * b.scale;
      p.y = b.y + (p.baseOy + p.armLen + reach) * b.scale;
    } else {
      const spread = (b.phase - 1) * 3;
      p.x = b.x + (p.ox + (p.side || 0) * spread) * b.scale;
      p.y = b.y + p.oy * b.scale;
    }
  }
}

// Returns live laser tether segments owned by the boss (Wing Pod tether + Citadel rotating Laser Cage!)
export function getBossLaserTethers(b) {
  if (!b || b.dead || b.entering > 0 || b.dying > 0) return [];
  const live = aliveBossParts(b);
  const segs = [];
  if (b.chassis === 'citadel' && b.phase >= 2) {
    const orbs = live.filter((p) => p.orbiting).sort((a, c) => a.orbitIndex - c.orbitIndex);
    if (orbs.length >= 2) {
      for (let i = 0; i < orbs.length; i++) {
        const a = orbs[i];
        const c = orbs[(i + 1) % orbs.length];
        if (orbs.length === 2 && i === 1) continue;
        segs.push({ x1: a.x, y1: a.y, x2: c.x, y2: c.y, color: '#9bf3f7' });
      }
    }
    return segs;
  }
  const leftPod = live.find((p) => p.side === -1 && (p.ox || 0) < -20 && !p.tentacle);
  const rightPod = live.find((p) => p.side === 1 && (p.ox || 0) > 20 && !p.tentacle);
  if (b.phase >= 2 && leftPod && rightPod) {
    segs.push({ x1: leftPod.x, y1: leftPod.y, x2: rightPod.x, y2: rightPod.y, color: '#ff5c94' });
  }
  return segs;
}

function escortPosition(e, w, h, t) {
  const sideX = (x) => (e.side === 1 ? x : 1 - x) * w;
  const sweep = Math.sin(Math.PI * t);
  if (e.route === 'gate') return { x: w * e.lane, y: -20 + t * (h + 48) };
  if (e.route === 'helix') {
    return {
      x: sideX(-0.1 + 1.2 * t + 0.115 * Math.sin(t * TAU)),
      y: h * (e.lane + t * 0.38 + sweep * Math.cos(t * TAU) * 0.19),
    };
  }
  const depth = e.route === 'ace' ? 0.42 : 0.17;
  return { x: sideX(-0.12 + 1.24 * t), y: h * (e.lane + sweep * depth + 0.15 * t) };
}

function launchWing(b, enemies, w, h) {
  if (enemies.some((e) => e.escort && !e.dead)) return false;
  const sequence = b.sortie++;
  const side = sequence % 2 ? -1 : 1;
  const routes = ['crosscut', 'gate', 'helix', 'ace'];
  const route = routes[(b.seed + sequence) % routes.length];
  const lanes = Math.max(5, Math.min(10, Math.floor(w / 92)));
  const gap = 1 + ((sequence + b.phase) % (lanes - 2));
  const count = route === 'gate' ? lanes : route === 'ace' ? Math.min(2, 1 + Math.floor(b.rank / 3)) : 2 + b.phase;
  const escortKinds = ['lancer', 'gunship', 'kite', 'raider'];
  const craftKind = escortKinds[(b.seed + sequence) % escortKinds.length];

  for (let i = 0; i < count; i++) {
    if (route === 'gate' && i === gap) continue;
    const gate = route === 'gate';
    const e = {
      kind: craftKind,
      escort: true,
      route,
      side: route === 'helix' && i % 2 ? -side : side,
      lane: gate ? (i + 0.5) / lanes : 0.16 + (i % 3) * 0.085,
      age: -0.9 - (gate ? 0 : i * 0.28),
      duration: gate ? 6.2 : route === 'ace' ? 3.8 : 5.2,
      r: route === 'ace' ? 14 : 11,
      hp: (route === 'ace' ? 4 : gate ? 2 : 1) + Math.floor((b.rank - 1) / 3),
      maxHp: (route === 'ace' ? 4 : gate ? 2 : 1) + Math.floor((b.rank - 1) / 3),
      points: route === 'ace' ? 75 : 30,
      shards: 2,
      flash: 0,
      fireIn: Math.max(0.95, 1.85 - b.rank * 0.08),
      bursts: route === 'ace' ? 3 : b.phase === 3 ? 2 : 1,
    };
    Object.assign(e, escortPosition(e, w, h, 0));
    enemies.push(e);
  }
  b.fireIn = Math.max(b.fireIn, 1.35);
  return true;
}

export function drawEntry(ctx, e, w) {
  const gate = e.route === 'gate';
  ctx.save();
  ctx.translate(gate ? e.x : e.side === 1 ? 10 : w - 10, gate ? 12 : e.y);
  ctx.rotate(gate ? Math.PI / 2 : e.side === 1 ? 0 : Math.PI);
  ctx.strokeStyle = '#ffc29a';
  ctx.globalAlpha = Math.max(0.35, 1 - Math.abs(e.age) * 0.38);
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-3, -4.5);
  ctx.lineTo(2.5, 0);
  ctx.lineTo(-3, 4.5);
  ctx.moveTo(4.5, -4.5);
  ctx.lineTo(10, 0);
  ctx.lineTo(4.5, 4.5);
  ctx.stroke();
  ctx.restore();
}

export function flyEscort(e, dt, w, h, player, shots, sound) {
  e.age += dt;
  const t = Math.max(0, e.age / e.duration);
  const pos = escortPosition(e, w, h, t);
  e.x = pos.x;
  e.y = pos.y;
  if (t >= 1) {
    e.dead = true;
    return;
  }
  if (e.age < 0) return;
  const ahead = escortPosition(e, w, h, t + 0.002);
  e.tilt = -Math.atan2(ahead.x - e.x, ahead.y - e.y);
  e.flash = Math.max(0, e.flash - dt);
  e.fireIn -= dt;
  if (e.fireIn > 0 || e.x < 12 || e.x > w - 12 || e.y > player.y - 50) return;
  const aim = e.route === 'gate' ? 0 : Math.atan2(player.x - e.x, player.y - e.y);
  shots.push({
    x: e.x,
    y: e.y + 8,
    r: 4,
    vx: Math.sin(aim) * 168,
    vy: Math.cos(aim) * 168,
    hostile: true,
  });
  if (e.route === 'ace') sound.effect('raider');
  e.fireIn = --e.bursts > 0 ? (e.route === 'ace' ? 0.4 : 1.45) : Infinity;
}

export function advanceArmor(b) {
  const total = b.maxPhases || 3;
  const phase = Math.min(total, 1 + Math.floor((b.maxHp - b.hp) / (b.maxHp / total)));
  if (b.hp <= 0 || phase === b.phase) return false;
  b.phase = phase;
  b.isFinalPhase = phase === total;
  b.dive = null;
  b.diveChain = 0;
  b.blink = null;
  b.blinkChain = 0;
  b.gravityWarn = 0;
  b.gravityActive = 0;
  b.beamWarn = 0;
  b.beamActive = 0;
  b.crossBeam = false;
  b.ringQueue = 0;
  b.launchIn = 0.65;
  b.fireIn = 0.9;
  return true;
}

export function aliveBossParts(b) {
  return b.parts.filter((p) => !p.dead);
}

export function hasActivePylons(b) {
  return b.parts.some((p) => !p.dead && p.role === 'pylon');
}

export function flyBoss(b, dt, w, h, player, shots, sound, enemies) {
  b.age += dt;
  b.flash = Math.max(0, b.flash - dt);
  for (const p of b.parts) p.flash = Math.max(0, p.flash - dt);

  if (b.dying > 0) {
    syncBossParts(b);
    return;
  }

  const baseY = w < h ? Math.max(128, h * 0.24) : Math.max(92, h * 0.2);
  if (b.entering > 0) {
    b.entering = Math.max(0, b.entering - dt);
    b.y += (baseY - b.y) * (1 - Math.exp(-dt * 3.4));
    b.x += (w / 2 - b.x) * (1 - Math.exp(-dt * 4));
    syncBossParts(b);
    return;
  }

  const pressure = b.phase - 1;
  // Dramatic Final-Phase Overdrive — especially strong on 2-phase berserkers!
  const finalBoost = b.isFinalPhase ? (b.maxPhases === 2 ? 1.38 : 1.24) : 1;
  const speed = (1 + 0.35 * (1 - Math.exp(-(b.rank - 1) * 0.25))) * (b.overclock ? 1.14 : 1) * finalBoost;
  const liveParts = aliveBossParts(b);
  b.courseTime += dt * speed * (1 + pressure * 0.08 + (liveParts.length === 0 ? 0.12 : 0));

  // Active Nano-Repair subsystems slowly regenerate boss core HP until sniped off!
  const repairNodes = liveParts.filter((p) => p.role === 'repair');
  if (repairNodes.length > 0 && b.hp < b.maxHp) {
    b.hp = Math.min(b.maxHp, b.hp + dt * repairNodes.length * b.maxHp * 0.011);
  }

  // Active Rail-Lance subsystem lock-on countdowns
  for (const p of liveParts) {
    if (p.role === 'lance' && p.aimLock > 0) {
      p.aimLock -= dt;
      if (p.aimLock <= 0) {
        const spd = Math.min(440, 355 + b.rank * 12);
        shots.push({
          x: p.x,
          y: p.y + 10,
          r: 4.5,
          vx: Math.sin(p.aimAngle) * spd,
          vy: Math.cos(p.aimAngle) * spd,
          hostile: true,
          color: '#ff4f64',
        });
        sound.effect('dash');
      }
    }
  }
  const t = b.courseTime;
  const amplitude = Math.max(0, Math.min(w * 0.31, w / 2 - 72));

  let goalX, goalY;
  if (b.moveStyle === 'figure8') {
    goalX = w / 2 + Math.sin(t * 0.8) * amplitude;
    goalY = baseY + Math.cos(t * 1.6) * h * 0.065;
  } else if (b.moveStyle === 'stalker') {
    const track = Math.max(w * 0.2, Math.min(w * 0.8, player.x));
    goalX = track * 0.55 + (w / 2 + Math.sin(t * 0.65) * amplitude * 0.6) * 0.45;
    goalY = baseY + Math.sin(t * 1.1) * 16;
  } else if (b.moveStyle === 'pendulum') {
    goalX = w / 2 + Math.tanh(2.4 * Math.sin(t * 0.46)) * amplitude * 0.8;
    goalY = baseY + Math.sin(t * 0.9) * 12;
  } else if (b.moveStyle === 'orbit') {
    goalX = w / 2 + Math.cos(t * 0.9) * amplitude * 0.82;
    goalY = baseY + Math.sin(t * 0.9) * h * 0.085;
  } else {
    goalX = w / 2 + Math.sin(t * 0.92) * amplitude * 0.88;
    goalY = baseY + Math.sin(t * 1.84) * h * 0.072;
  }

  b.exposedFor = Math.max(0, b.exposedFor - dt);

  if (b.ringQueue > 0) {
    b.ringTimer -= dt;
    if (b.ringTimer <= 0) {
      b.ringTimer = 0.32;
      const petals = Math.min(15, 10 + pressure * 2 + Math.min(2, Math.floor(b.rank / 3)));
      const opening = Math.sin((b.volley + b.ringQueue) * 0.85) * 0.72;
      const spd = Math.min(225, 152 + b.rank * 6 + pressure * 10);
      for (let i = 0; i < petals; i++) {
        const angle = (i / petals - 0.5) * TAU + b.ringQueue * 0.16;
        if (Math.abs(angle - opening) > 0.42) {
          shots.push({
            x: b.x,
            y: b.y + 14,
            r: 4.3,
            vx: Math.sin(angle) * spd,
            vy: Math.cos(angle) * spd,
            hostile: true,
            color: b.palette.bullet,
          });
        }
      }
      sound.effect('volley');
      b.ringQueue--;
    }
  }

  // Monolith Phase-Blink Teleport Special (double-chain in Final Phase!)
  if (b.blink) {
    b.blink.time += dt;
    if (b.blink.time >= 0.62) {
      b.x = b.blink.toX;
      b.y = b.blink.toY;
      b.blink = null;
      sound.effect('blink');
      // Materialization prism nova burst!
      const petals = b.isFinalPhase ? 14 : 10;
      const spd = Math.min(230, 162 + b.rank * 6);
      for (let i = 0; i < petals; i++) {
        const a = (i / petals) * TAU + b.age;
        shots.push({
          x: b.x,
          y: b.y,
          r: 4.3,
          vx: Math.sin(a) * spd,
          vy: Math.cos(a) * spd,
          hostile: true,
          color: b.palette.light,
        });
      }
      if (b.blinkChain > 0) {
        b.blinkChain--;
        b.blink = {
          time: 0,
          toX: w * (b.x < w * 0.5 ? 0.72 + Math.random() * 0.14 : 0.14 + Math.random() * 0.14),
          toY: Math.max(96, h * (0.18 + Math.random() * 0.16)),
        };
      }
    }
    syncBossParts(b);
    return;
  }

  // Eclipse Singularity Gravity Well Special!
  if (b.gravityWarn > 0) {
    b.gravityWarn -= dt;
    b.x += (w / 2 - b.x) * (1 - Math.exp(-dt * 3));
    syncBossParts(b);
    if (b.gravityWarn <= 0) {
      b.gravityActive = b.isFinalPhase ? 3.2 : 2.5;
      sound.effect('gravity');
    }
    return;
  }
  if (b.gravityActive > 0) {
    b.gravityActive = Math.max(0, b.gravityActive - dt);
    b.ringTimer -= dt;
    if (b.ringTimer <= 0) {
      b.ringTimer = b.isFinalPhase ? 0.28 : 0.38;
      const arms = b.isFinalPhase ? 6 : 4;
      const spd = Math.min(210, 148 + b.rank * 6);
      for (let i = 0; i < arms; i++) {
        const a = b.age * 2.2 + (i * TAU) / arms;
        shots.push({
          x: b.x,
          y: b.y,
          r: 4.4,
          vx: Math.sin(a) * spd,
          vy: Math.cos(a) * spd,
          hostile: true,
          color: '#ffb07a',
        });
      }
    }
    if (b.gravityActive <= 0 && b.isFinalPhase) {
      // Phase-2 Finale: Explosive Repulsion Nova ring!
      const petals = 14;
      for (let i = 0; i < petals; i++) {
        const a = (i / petals) * TAU;
        shots.push({
          x: b.x,
          y: b.y,
          r: 4.6,
          vx: Math.sin(a) * 195,
          vy: Math.cos(a) * 195,
          hostile: true,
          color: '#fff0ad',
        });
      }
      sound.effect('volley');
    }
    syncBossParts(b);
    return;
  }

  if (b.beamActive > 0) {
    b.beamActive = Math.max(0, b.beamActive - dt);
    if (b.crossBeam) {
      // Seraph 4-way rotating X-Halo beams!
      b.beamAngle = (b.beamAngle || 0) + (b.beamSweep || 0.72) * dt;
    } else if (b.twinBeam) {
      // Counter-rotating twin scissor beams opening/closing all the way to horizontal!
      b.beamSpread = Math.max(0.14, Math.min(Math.PI * 0.48, (b.beamSpread || 0.35) + (b.beamSweep || 0) * dt));
    } else {
      // Full horizontal-to-horizontal sweeping laser (-86 deg to +86 deg!)
      b.beamAngle = Math.max(-Math.PI * 0.48, Math.min(Math.PI * 0.48, (b.beamAngle || 0) + (b.beamSweep || 0) * dt));
    }
    b.x += (goalX - b.x) * (1 - Math.exp(-dt * 0.85));
    syncBossParts(b);
    return;
  }
  if (b.beamWarn > 0) {
    b.beamWarn -= dt;
    b.x += (goalX - b.x) * (1 - Math.exp(-dt * 1.2));
    syncBossParts(b);
    if (b.beamWarn <= 0) {
      b.beamActive = b.crossBeam ? 2.0 : b.twinBeam ? 1.55 : 1.75;
      sound.effect('beam');
    }
    return;
  }

  if (b.dive) {
    const dive = b.dive;
    dive.time += dt;
    const telegraph = b.isFinalPhase ? 0.62 : 0.78;
    const progress = Math.min(1, Math.max(0, (dive.time - telegraph) / (b.isFinalPhase ? 0.54 : 0.68)));
    const eased = progress * progress * (3 - 2 * progress);
    b.x = w * (dive.fromX + (dive.toX - dive.fromX) * eased);
    b.y = h * (dive.fromY + (dive.toY - dive.fromY) * eased);
    // Scythe signature: leaves glowing plasma wake bullets along its apex slash!
    if (progress > 0.08 && progress < 0.94 && b.chassis === 'scythe') {
      b.diveWakeTick -= dt;
      if (b.diveWakeTick <= 0) {
        b.diveWakeTick = 0.11;
        for (const side of [-1, 1]) {
          shots.push({
            x: b.x,
            y: b.y,
            r: 4,
            vx: side * 72,
            vy: 115,
            hostile: true,
            color: b.palette.light,
          });
        }
      }
    }
    syncBossParts(b);
    if (progress === 1) {
      if (b.diveChain > 0) {
        b.diveChain--;
        b.dive = {
          time: 0,
          fromX: b.x / w,
          fromY: b.y / h,
          toX: Math.max(0.16, Math.min(0.84, player.x / w)),
          toY: Math.max(0.2, Math.min(0.62, b.y > h * 0.4 ? 0.22 : player.y / h)),
        };
        sound.effect('dash');
      } else {
        b.dive = null;
      }
    }
    return;
  }

  b.launchIn -= dt;
  const activeMines = enemies.filter((m) => m.kind === 'mine' && !m.dead).length;
  if (b.launchIn <= 0 && activeMines <= 1) {
    b.launchIn = launchWing(b, enemies, w, h) ? Math.max(7.5, 10.5 - pressure * 0.5) : 0.9;
  }

  b.x += (goalX - b.x) * (1 - Math.exp(-dt * 1.8));
  b.y += (goalY - b.y) * (1 - Math.exp(-dt * 1.7));
  syncBossParts(b);

  b.fireIn -= dt;
  if (b.fireIn > 0.5) b.aim = Math.atan2(player.x - b.x, Math.max(45, player.y - b.y));
  if (b.fireIn > 0) return;

  const specialCycle = b.isFinalPhase ? 3 : 4;
  if ((b.volley + 1) % specialCycle === 0) {
    b.volley++;
    const useSecondary = b.secondarySpecial && b.phase >= 2 && b.volley % 3 === 0;
    const spec = useSecondary ? b.secondarySpecial : b.primarySpecial;

    if (spec === 'blink') {
      b.blink = {
        time: 0,
        toX: w * (b.x < w * 0.5 ? 0.72 + Math.random() * 0.14 : 0.14 + Math.random() * 0.14),
        toY: Math.max(96, h * (0.18 + Math.random() * 0.16)),
      };
      b.blinkChain = b.isFinalPhase ? 1 : 0;
      b.fireIn = 1.65;
      return;
    }
    if (spec === 'gravity') {
      b.gravityWarn = 0.85;
      b.ringTimer = 0.1;
      b.fireIn = 1.9;
      return;
    }
    if (spec === 'crossBeam') {
      b.crossBeam = true;
      b.twinBeam = false;
      b.beamAngle = Math.PI / 4;
      b.beamSweep = (b.volley % 2 ? 1 : -1) * (b.isFinalPhase ? 0.92 : 0.65);
      b.beamWarn = 1.05;
      b.fireIn = 1.95;
      return;
    }
    if (spec === 'clusterRain') {
      const shells = b.isFinalPhase ? 4 : 3;
      const spd = Math.min(185, 136 + b.rank * 5);
      for (let i = 0; i < shells; i++) {
        const a = ((i - (shells - 1) / 2) / Math.max(1, shells - 1)) * 0.72;
        shots.push({
          x: b.x + Math.sin(a) * 28,
          y: b.y + 20,
          r: 7.4,
          vx: Math.sin(a) * spd,
          vy: Math.cos(a) * spd,
          hostile: true,
          cluster: true,
          clusterFuse: 0.95 + (i % 2) * 0.22,
          clusterCount: b.isFinalPhase ? 7 : 6,
          color: '#ffaa54',
        });
      }
      sound.effect('cluster');
      b.fireIn = 1.65;
      return;
    }
    if (spec === 'waveCurtain') {
      const cols = b.isFinalPhase ? 7 : 5;
      const spd = Math.min(205, 148 + b.rank * 5);
      for (let i = 0; i < cols; i++) {
        const off = (i - (cols - 1) / 2) * 0.24;
        shots.push({
          x: b.x + off * 90,
          y: b.y + 18,
          r: 4.5,
          vx: Math.sin(off) * spd * 0.4,
          vy: spd,
          waveAmp: 82,
          waveFreq: 5.2,
          wavePhase: i * 0.85,
          age: 0,
          hostile: true,
          color: '#7ef2e6',
        });
      }
      sound.effect('volley');
      b.fireIn = 1.4;
      return;
    }
    if (spec === 'swarmSurge') {
      const count = b.isFinalPhase ? 5 : 3;
      for (let i = 0; i < count; i++) {
        const ang = ((i - (count - 1) / 2) / Math.max(1, count - 1)) * 0.85;
        enemies.push(
          createEnemy('swarmer', b.x + Math.sin(ang) * 32, b.y + 24, b.rank + 1, {
            dir: i % 2 ? 1 : -1,
            vx: Math.sin(ang) * 145,
            vy: 155,
          }),
        );
      }
      sound.effect('volley');
      b.fireIn = 1.55;
      return;
    }
    if (spec === 'escortWave') {
      // Carrier deploys a synchronized laser-tethered pair or sniper wing!
      const p1 = createEnemy('prism', w * 0.26, b.y + 26, b.rank + 1, {
        tethered: true,
        tetherWarmup: 0.9,
        cruise: 74,
        fireIn: 99,
      });
      const p2 = createEnemy('prism', w * 0.74, b.y + 26, b.rank + 1, {
        tethered: true,
        tetherWarmup: 0.9,
        cruise: 74,
        fireIn: 99,
      });
      p1.linkPartner = p2;
      p2.linkedBy = p1;
      enemies.push(p1, p2);
      sound.effect('volley');
      b.fireIn = 1.75;
      return;
    }
    if (spec === 'dive') {
      b.dive = {
        time: 0,
        fromX: b.x / w,
        fromY: b.y / h,
        toX: Math.max(0.14, Math.min(0.86, player.x / w)),
        toY: Math.max(0.42, Math.min(0.68, player.y / h)),
      };
      b.diveChain = b.isFinalPhase ? 1 : 0;
      b.diveWakeTick = 0.08;
      b.fireIn = 1.65;
      sound.effect('dash');
      return;
    }
    if (spec === 'beam') {
      b.crossBeam = false;
      b.twinBeam = b.phase >= 2 && (b.rank >= 2 || b.volley % 2 === 0 || b.isFinalPhase);
      if (b.twinBeam) {
        // Twin scissor beams: either sweep inward from full horizontal flanks or outward to horizontal!
        const inward = b.volley % 2 === 0;
        b.beamAngle = 0;
        b.beamSpread = inward ? Math.PI * 0.47 : 0.24;
        b.beamSweep = inward ? -0.82 : 0.82;
      } else {
        // Dramatic single full-horizon sweep (-84 deg -> +84 deg or reverse!)
        const leftToRight = b.volley % 2 === 0;
        b.beamAngle = leftToRight ? -Math.PI * 0.47 : Math.PI * 0.47;
        b.beamSweep = leftToRight ? 1.66 : -1.66;
      }
      b.beamWarn = 1.05;
      b.fireIn = 1.8;
      return;
    }
    if (spec === 'minefield') {
      const mines = Math.min(4, Math.max(0, 4 - activeMines));
      for (let i = 0; i < mines; i++) {
        const mx = w * (0.18 + (i / Math.max(1, mines - 1)) * 0.64);
        enemies.push(
          createEnemy('mine', mx, b.y + 34 + (i % 2) * 20, b.rank + 1, {
            threat: 1 + Math.min(0.35, b.rank * 0.06),
            fuse: 3.8 + (i % 2) * 0.5,
          }),
        );
      }
      b.fireIn = 1.5;
      sound.effect('volley');
      return;
    }
    if (spec === 'barrage') {
      const spd = Math.min(230, 160 + b.rank * 6);
      for (const side of [-1, 1]) {
        for (let k = 0; k < 3 + Math.min(1, pressure); k++) {
          const a = b.aim + side * (0.16 + k * 0.13);
          shots.push({
            x: b.x + side * 24,
            y: b.y + 18,
            r: 4.3,
            vx: Math.sin(a) * (spd * (0.86 + k * 0.06)),
            vy: Math.cos(a) * (spd * (0.86 + k * 0.06)),
            hostile: true,
            color: b.palette.light,
          });
        }
      }
      b.fireIn = 1.45;
      sound.effect('volley');
      return;
    }
    if (spec === 'ringburst') {
      b.ringQueue = 2 + Math.min(1, pressure);
      b.ringTimer = 0.05;
      b.fireIn = 1.85;
      return;
    }
  }

  const velocity = Math.min(235, 152 + Math.min(45, b.rank * 7) + pressure * 12);
  const bulletColor = b.palette.bullet;
  function fire(x, y, angle, spd = velocity, color = bulletColor) {
    shots.push({
      x,
      y,
      r: 4.3,
      vx: Math.sin(angle) * spd,
      vy: Math.cos(angle) * spd,
      hostile: true,
      color,
    });
  }

  if (b.volleyStyle === 'aimed') {
    const spreadCount = 1 + Math.min(2, pressure);
    for (let i = -spreadCount; i <= spreadCount; i++) fire(b.x, b.y + 20, b.aim + i * 0.19);
  } else if (b.volleyStyle === 'fan') {
    const width = 2 + Math.min(2, pressure);
    for (let i = -width; i <= width; i++) fire(b.x, b.y + 18, i * 0.24 + (b.volley % 2 ? 0.11 : -0.11));
  } else if (b.volleyStyle === 'spiral') {
    const petals = Math.min(15, 10 + pressure * 2);
    const opening = Math.sin(b.volley * 0.72) * (b.phase === 2 ? -0.82 : 0.82);
    for (let i = 0; i < petals; i++) {
      const angle = (i / petals - 0.5) * TAU + (b.volley % 2 ? 0.12 : -0.12);
      if (Math.abs(angle - opening) > 0.42) fire(b.x, b.y + 12, angle, velocity * 0.94);
    }
  } else if (b.volleyStyle === 'helix') {
    const arms = 2 + pressure;
    for (let i = 0; i < arms; i++) {
      const a = b.aim + (i - (arms - 1) / 2) * 0.3 + Math.sin(b.volley * 0.9) * 0.16;
      fire(b.x, b.y + 18, a, velocity * 1.02);
    }
  } else if (b.volleyStyle === 'burst') {
    for (let k = 0; k < 2; k++) {
      const s = velocity * (0.86 + k * 0.16);
      fire(b.x, b.y + 20, b.aim - 0.16, s);
      fire(b.x, b.y + 20, b.aim, s * 1.05, b.palette.light);
      fire(b.x, b.y + 20, b.aim + 0.16, s);
    }
  } else if (b.volleyStyle === 'wave') {
    const count = 4 + (b.isFinalPhase ? 2 : 0);
    for (let i = 0; i < count; i++) {
      const off = (i - (count - 1) / 2) * 0.24;
      shots.push({
        x: b.x + off * 70,
        y: b.y + 18,
        r: 4.3,
        vx: Math.sin(off) * velocity * 0.35,
        vy: velocity * 0.92,
        waveAmp: 66,
        waveFreq: 4.8,
        wavePhase: i * 1.1 + b.volley,
        age: 0,
        hostile: true,
        color: bulletColor,
      });
    }
  } else {
    for (let i = -2; i <= 2; i++) fire(b.x, b.y + 18, i * 0.28, velocity * 0.92);
    fire(b.x, b.y + 20, b.aim, velocity * 1.12, '#fff0c2');
  }

  // Subsystems take turns firing (staggered by volley index) so patterns stay clean & readable!
  if (liveParts.length > 0) {
    const activeSub = liveParts[b.volley % liveParts.length];
    const pAim = Math.atan2(player.x - activeSub.x, Math.max(60, player.y - activeSub.y));
    if (activeSub.role === 'turret') fire(activeSub.x, activeSub.y + 12, pAim, velocity * 1.02);
    else if (activeSub.role === 'pylon') fire(activeSub.x, activeSub.y + 10, pAim, velocity * 0.88, '#ffd287');
    else if (activeSub.role === 'prism') fire(activeSub.x, activeSub.y, pAim, velocity * 1.0, b.palette.light);
    else if (activeSub.role === 'mortar') {
      shots.push({
        x: activeSub.x,
        y: activeSub.y + 12,
        r: 6.8,
        vx: Math.sin(pAim * 0.65) * 145,
        vy: Math.cos(pAim * 0.65) * 145,
        hostile: true,
        cluster: true,
        clusterFuse: 1.0,
        clusterCount: b.isFinalPhase ? 7 : 5,
        color: '#ffb05c',
      });
      sound.effect('cluster');
    } else if (activeSub.role === 'lance' && !(activeSub.aimLock > 0)) {
      activeSub.aimAngle = Math.max(-0.9, Math.min(0.9, pAim));
      activeSub.aimLock = 0.55;
      sound.effect('sniperLock');
    } else if (activeSub.role === 'bay' && activeMines < 3 && b.volley % 2 === 0) {
      enemies.push(createEnemy('mine', activeSub.x, activeSub.y + 14, b.rank, { threat: 1.1, fuse: 4.0 }));
    }
  }

  b.volley++;
  const baseInterval = Math.max(0.96, 1.46 - Math.min(0.38, b.rank * 0.04));
  const finalRate = b.isFinalPhase ? (b.maxPhases === 2 ? 0.76 : 0.84) : 1;
  b.fireIn = (0.5 + (baseInterval - 0.35) / (1 + pressure * 0.12)) * finalRate;
  sound.effect('volley');
}

// --- 8 DISTINCT ARCHITECTURAL CHASSIS RENDERERS ---
function drawChassisBody(ctx, b, charging) {
  const { armor, secondary, trim, light } = b.palette;
  const fill = b.flash > 0 ? '#fff0d4' : armor;
  const coreFill = b.exposedFor > 0 ? '#98ffdc' : b.flash > 0 ? '#fff5dc' : light;
  ctx.strokeStyle = '#0c1320';
  ctx.lineWidth = 3;

  if (b.chassis === 'catamaran') {
    // Twin massive parallel pontoons linked by glowing reactor bridge
    ctx.fillStyle = trim;
    ctx.fillRect(-34, -8, 68, 18);
    ctx.strokeRect(-34, -8, 68, 18);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.scale(side, 1);
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(22, -36);
      ctx.lineTo(48, -22);
      ctx.lineTo(52, 26);
      ctx.lineTo(36, 38);
      ctx.lineTo(22, 22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = secondary;
      ctx.fillRect(28, -20, 14, 34);
      ctx.fillStyle = light;
      ctx.fillRect(32, -26, 6, 4);
      ctx.restore();
    }
    ctx.fillStyle = coreFill;
    ctx.fillRect(-20, -3, 40, 8 + charging * 4);
  } else if (b.chassis === 'citadel') {
    // Rotating octagonal orbital ring fortress with glowing eye
    ctx.save();
    ctx.rotate(b.age * (0.45 + b.phase * 0.18));
    ctx.fillStyle = fill;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * TAU) / 8;
      const rad = i % 2 === 0 ? 44 : 38;
      if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
      else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = trim;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, TAU);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = light;
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const a = (i * TAU) / 4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 26, Math.sin(a) * 26);
      ctx.lineTo(Math.cos(a) * 40, Math.sin(a) * 40);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = coreFill;
    ctx.beginPath();
    ctx.arc(0, 0, 10 + charging * 5, 0, TAU);
    ctx.fill();
  } else if (b.chassis === 'monolith') {
    // Brutalist downward-pointing armored triangle dreadnought
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, 44);
    ctx.lineTo(48, -26);
    ctx.lineTo(22, -34);
    ctx.lineTo(0, -24);
    ctx.lineTo(-22, -34);
    ctx.lineTo(-48, -26);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = secondary;
    ctx.beginPath();
    ctx.moveTo(0, 28);
    ctx.lineTo(30, -18);
    ctx.lineTo(-30, -18);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = trim;
    ctx.beginPath();
    ctx.moveTo(0, 14);
    ctx.lineTo(15, -10);
    ctx.lineTo(-15, -10);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = coreFill;
    ctx.beginPath();
    ctx.moveTo(0, 10 + charging * 4);
    ctx.lineTo(8 + charging * 2, -6);
    ctx.lineTo(-8 - charging * 2, -6);
    ctx.closePath();
    ctx.fill();
  } else if (b.chassis === 'carrier') {
    // Broad flat-top battleship flight deck with central command tower
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(-54, -18);
    ctx.lineTo(54, -18);
    ctx.lineTo(58, 12);
    ctx.lineTo(42, 26);
    ctx.lineTo(-42, 26);
    ctx.lineTo(-58, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Dual launch runways
    ctx.fillStyle = trim;
    ctx.fillRect(-46, -10, 20, 28);
    ctx.fillRect(26, -10, 20, 28);
    ctx.fillStyle = light;
    for (let y = -4; y <= 12; y += 8) {
      ctx.fillRect(-39, y, 6, 2);
      ctx.fillRect(33, y, 6, 2);
    }
    // Command citadel
    ctx.fillStyle = secondary;
    ctx.fillRect(-18, -26, 36, 46);
    ctx.strokeRect(-18, -26, 36, 46);
    ctx.fillStyle = coreFill;
    ctx.fillRect(-10, -4, 20, 10 + charging * 4);
  } else if (b.chassis === 'leviathan') {
    // Wide sweeping crescent-horn manta flagship
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.quadraticCurveTo(38, -28, 56, 20);
    ctx.quadraticCurveTo(34, 6, 18, 26);
    ctx.lineTo(0, 16);
    ctx.lineTo(-18, 26);
    ctx.quadraticCurveTo(-34, 6, -56, 20);
    ctx.quadraticCurveTo(-38, -28, 0, -32);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = secondary;
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.quadraticCurveTo(24, -16, 38, 8);
    ctx.lineTo(14, 12);
    ctx.lineTo(0, 4);
    ctx.lineTo(-14, 12);
    ctx.lineTo(-38, 8);
    ctx.quadraticCurveTo(-24, -16, 0, -22);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = coreFill;
    ctx.beginPath();
    ctx.ellipse(0, -6, 11 + charging * 3, 6 + charging * 2, 0, 0, TAU);
    ctx.fill();
  } else if (b.chassis === 'hive') {
    // Hexagonal honeycomb swarm-mother
    ctx.fillStyle = fill;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * TAU) / 6 - Math.PI / 6;
      const rad = 42;
      if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
      else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = secondary;
    for (let i = 0; i < 6; i++) {
      const a = (i * TAU) / 6;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 22, Math.sin(a) * 22, 8, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = trim;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, TAU);
    ctx.fill();
    ctx.fillStyle = coreFill;
    ctx.beginPath();
    ctx.arc(0, 0, 8 + charging * 4, 0, TAU);
    ctx.fill();
  } else if (b.chassis === 'seraph') {
    // Seraphim Halo Cruiser: golden swept angelic wings + rotating sacred ring halo!
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.scale(side, 1);
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(8, -24);
      ctx.lineTo(58, -14);
      ctx.lineTo(48, 2);
      ctx.lineTo(54, 14);
      ctx.lineTo(28, 22);
      ctx.lineTo(10, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = secondary;
      ctx.beginPath();
      ctx.moveTo(14, -14);
      ctx.lineTo(44, -8);
      ctx.lineTo(34, 8);
      ctx.lineTo(14, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.save();
    ctx.rotate(b.age * (b.isFinalPhase ? 2.4 : 1.1));
    ctx.strokeStyle = coreFill;
    ctx.lineWidth = 2.4;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    ctx.fillStyle = trim;
    ctx.beginPath();
    ctx.moveTo(0, -36);
    ctx.lineTo(16, -6);
    ctx.lineTo(10, 34);
    ctx.lineTo(0, 42);
    ctx.lineTo(-10, 34);
    ctx.lineTo(-16, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = coreFill;
    ctx.beginPath();
    ctx.arc(0, 2, 9 + charging * 4, 0, TAU);
    ctx.fill();
  } else if (b.chassis === 'kraken') {
    // Leviathan Kraken: armored domed cephalopod mantle + glowing optic crown
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, -40);
    ctx.quadraticCurveTo(44, -32, 42, 14);
    ctx.lineTo(24, 28);
    ctx.lineTo(-24, 28);
    ctx.lineTo(-42, 14);
    ctx.quadraticCurveTo(-44, -32, 0, -40);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = secondary;
    ctx.beginPath();
    ctx.ellipse(0, -8, 26, 20, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = trim;
    ctx.fillRect(-18, 6, 36, 16);
    ctx.fillStyle = coreFill;
    for (const ox of [-10, 0, 10]) {
      ctx.beginPath();
      ctx.arc(ox, 14, (ox === 0 ? 5.5 : 3.5) + charging * 2, 0, TAU);
      ctx.fill();
    }
  } else if (b.chassis === 'eclipse') {
    // Spinning solar corona blades around dark obsidian singularity
    ctx.save();
    ctx.rotate(-b.age * (0.8 + b.phase * 0.35));
    ctx.fillStyle = fill;
    for (let i = 0; i < 6; i++) {
      ctx.rotate(TAU / 6);
      ctx.beginPath();
      ctx.moveTo(16, -6);
      ctx.lineTo(48, -14);
      ctx.lineTo(38, 8);
      ctx.lineTo(16, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = '#0e121e';
    ctx.strokeStyle = coreFill;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, TAU);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = coreFill;
    ctx.beginPath();
    ctx.arc(0, 0, 6 + charging * 5, 0, TAU);
    ctx.fill();
  } else {
    // Scythe swept-blade hunter
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.scale(side, 1);
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(5, -20);
      ctx.lineTo(22, -24);
      ctx.lineTo(46, -10);
      ctx.lineTo(54, 18);
      ctx.lineTo(52, 34);
      ctx.lineTo(32, 14);
      ctx.lineTo(14, 10);
      ctx.lineTo(6, 22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = secondary;
      ctx.beginPath();
      ctx.moveTo(14, -15);
      ctx.lineTo(38, -6);
      ctx.lineTo(43, 12);
      ctx.lineTo(24, 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = trim;
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(15, -10);
    ctx.lineTo(11, 16);
    ctx.lineTo(0, 30);
    ctx.lineTo(-11, 16);
    ctx.lineTo(-15, -10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = coreFill;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 2, -17);
      ctx.lineTo(side * (9 + charging * 3), -2);
      ctx.lineTo(side * 2, 18 + charging * 3);
      ctx.fill();
    }
  }
  if (b.isFinalPhase) {
    // Final-Phase Enraged Visual: glowing reactor cracks + pulsing heat aura across stripped hull!
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const pulse = 0.65 + 0.35 * Math.sin(b.age * 24);
    const glow = ctx.createRadialGradient(0, 0, 6, 0, 0, 44);
    glow.addColorStop(0, `rgba(255, 196, 120, ${0.42 * pulse})`);
    glow.addColorStop(0.55, `rgba(255, 76, 56, ${0.22 * pulse})`);
    glow.addColorStop(1, 'rgba(255, 48, 48, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 44, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 232, 168, ${0.72 * pulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-22, -12);
    ctx.lineTo(-6, -2);
    ctx.lineTo(-16, 16);
    ctx.moveTo(22, -12);
    ctx.lineTo(6, -2);
    ctx.lineTo(18, 14);
    ctx.stroke();
    ctx.restore();
  }
}

export function drawBoss(ctx, b, w, h) {
  const { armor, light } = b.palette;
  const liveParts = aliveBossParts(b);
  const pylonsUp = hasActivePylons(b);

  ctx.save();
  ctx.translate(b.x, b.y);

  // Monolith Phase-Blink destination telegraph!
  if (b.blink) {
    const tx = b.blink.toX - b.x;
    const ty = b.blink.toY - b.y;
    const p = Math.min(1, b.blink.time / 0.62);
    ctx.save();
    ctx.strokeStyle = `rgba(176, 152, 255, ${0.4 + p * 0.6})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(tx, ty, b.r * (1.2 - p * 0.35), 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  // Eclipse Singularity Gravity Well aura!
  if (b.gravityWarn > 0 || b.gravityActive > 0) {
    const active = b.gravityActive > 0;
    const rad = active ? 220 : 120 + (1 - b.gravityWarn / 0.85) * 90;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, 14, 0, 0, rad);
    g.addColorStop(0, active ? 'rgba(255, 162, 92, 0.34)' : 'rgba(200, 140, 255, 0.22)');
    g.addColorStop(0.55, active ? 'rgba(170, 72, 224, 0.16)' : 'rgba(130, 80, 200, 0.08)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, TAU);
    ctx.fill();
    ctx.rotate(-b.age * (active ? 3.8 : 1.8));
    ctx.strokeStyle = active ? 'rgba(255, 210, 138, 0.55)' : 'rgba(216, 178, 255, 0.4)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([16, 14]);
    ctx.beginPath();
    ctx.arc(0, 0, rad * 0.68, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Dive telegraph
  if (b.dive && b.dive.time < (b.isFinalPhase ? 0.62 : 0.78)) {
    const tx = b.dive.toX * w - b.x;
    const ty = b.dive.toY * h - b.y;
    const maxT = b.isFinalPhase ? 0.62 : 0.78;
    ctx.save();
    ctx.strokeStyle = '#ffbc91';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([7, 7]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(tx, ty, 12 + 20 * (1 - b.dive.time / maxT), 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  // Full-horizon sweeping thermal beams (Single, Twin Scissor, OR Seraph 4-way X-Cross Halo!)
  if (b.beamWarn > 0 || b.beamActive > 0) {
    const beamLen = Math.hypot(w, h) + 140;
    const angles = b.crossBeam
      ? [
          b.beamAngle || 0,
          (b.beamAngle || 0) + Math.PI / 2,
          (b.beamAngle || 0) + Math.PI,
          (b.beamAngle || 0) + (Math.PI * 3) / 2,
        ]
      : b.twinBeam
        ? [-(b.beamSpread || 0.35), b.beamSpread || 0.35]
        : [b.beamAngle || 0];
    for (const ang of angles) {
      ctx.save();
      ctx.rotate(ang);
      if (b.beamActive > 0) {
        const pulse = 0.84 + 0.16 * Math.sin(b.age * 48);
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = b.crossBeam ? 'rgba(255, 214, 108, 0.26)' : 'rgba(220, 146, 255, 0.26)';
        ctx.fillRect(-18 * pulse, 18, 36 * pulse, beamLen);
        ctx.fillStyle = b.crossBeam ? 'rgba(255, 240, 182, 0.78)' : 'rgba(246, 210, 255, 0.76)';
        ctx.fillRect(-7 * pulse, 18, 14 * pulse, beamLen);
        ctx.fillStyle = '#fff9f2';
        ctx.fillRect(-2.6, 18, 5.2, beamLen);
        ctx.globalCompositeOperation = 'source-over';
      } else {
        const p = 1 - b.beamWarn / 1.05;
        ctx.strokeStyle = b.crossBeam
          ? `rgba(255, 224, 138, ${0.32 + p * 0.65})`
          : `rgba(232, 180, 255, ${0.3 + p * 0.65})`;
        ctx.lineWidth = 1.2 + p * 2.6;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.moveTo(0, 18);
        ctx.lineTo(0, beamLen);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }
    // Curved sweep-direction telegraph arc so player clearly reads horizontal/rotational sweep direction!
    if (b.beamWarn > 0 && !b.crossBeam) {
      const p = 1 - b.beamWarn / 1.05;
      ctx.save();
      ctx.strokeStyle = `rgba(255, 210, 140, ${0.3 + p * 0.55})`;
      ctx.lineWidth = 2;
      if (b.twinBeam) {
        const sp = b.beamSpread || 0.35;
        const dir = Math.sign(b.beamSweep || 1);
        for (const s of [-1, 1]) {
          const a0 = Math.PI / 2 - s * sp;
          const a1 = a0 - s * dir * 0.42;
          ctx.beginPath();
          ctx.arc(0, 0, b.r + 24, Math.min(a0, a1), Math.max(a0, a1));
          ctx.stroke();
        }
      } else {
        const a0 = Math.PI / 2 - (b.beamAngle || 0);
        const a1 = a0 - Math.sign(b.beamSweep || 1) * 0.55;
        ctx.beginPath();
        ctx.arc(0, 0, b.r + 26, Math.min(a0, a1), Math.max(a0, a1));
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // Shield pylon barrier
  if (pylonsUp && b.entering <= 0) {
    ctx.save();
    ctx.strokeStyle = 'rgba(136, 232, 220, 0.44)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, b.r + 12, 0.14, Math.PI - 0.14);
    ctx.stroke();
    for (const p of liveParts) {
      if (p.role !== 'pylon') continue;
      ctx.strokeStyle = 'rgba(136, 232, 220, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(p.x - b.x, p.y - b.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  const charging = Math.max(0, 1 - b.fireIn / 0.55);
  ctx.save();
  ctx.scale(b.scale, b.scale);
  drawChassisBody(ctx, b, charging);

  if (b.exposedFor > 0) {
    ctx.save();
    ctx.strokeStyle = 'rgba(152, 255, 220, 0.78)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, 42 + Math.sin(b.age * 16) * 2, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = '#b6ffe9';
    ctx.textAlign = 'center';
    ctx.font = '700 9px ui-monospace, monospace';
    ctx.fillText('CORE EXPOSED ×2', 0, -44);
    ctx.restore();
  }
  ctx.restore();
  ctx.restore();

  // Boss Laser Tethers (Wing Pod tether OR Citadel rotating Laser Ring Cage!)
  const tethers = getBossLaserTethers(b);
  for (const seg of tethers) {
    ctx.save();
    const pulse = 0.78 + 0.22 * Math.sin(b.age * 36);
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = seg.color === '#9bf3f7' ? 'rgba(121, 227, 213, 0.36)' : 'rgba(255, 92, 148, 0.36)';
    ctx.lineWidth = 10 * pulse;
    ctx.beginPath();
    ctx.moveTo(seg.x1, seg.y1);
    ctx.lineTo(seg.x2, seg.y2);
    ctx.stroke();
    ctx.strokeStyle = seg.color === '#9bf3f7' ? '#d4fff8' : '#ffbbe0';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(seg.x1, seg.y1);
    ctx.lineTo(seg.x2, seg.y2);
    ctx.stroke();
    ctx.restore();
  }

  // Kraken articulated tentacle arm joints + Repair Node emerald regen beams
  for (const p of liveParts) {
    if (p.tentacle) {
      ctx.save();
      ctx.strokeStyle = '#0c1320';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(b.x + p.baseOx * 0.7 * b.scale, b.y + p.baseOy * 0.7 * b.scale);
      ctx.quadraticCurveTo(p.midX ?? p.x, p.midY ?? p.y, p.x, p.y);
      ctx.stroke();
      ctx.strokeStyle = b.palette.secondary;
      ctx.lineWidth = 5.5;
      ctx.stroke();
      ctx.restore();
    }
    if (p.role === 'repair') {
      ctx.save();
      const pulse = 0.65 + 0.35 * Math.sin(b.age * 14);
      ctx.strokeStyle = `rgba(110, 255, 178, ${0.42 * pulse})`;
      ctx.lineWidth = 3.2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
    if (p.role === 'lance' && p.aimLock > 0) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.aimAngle || 0);
      ctx.strokeStyle = 'rgba(255, 78, 92, 0.85)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.lineTo(0, 1200);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Destructible subsystems (7 distinct tactical roles!)
  for (const p of liveParts) {
    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.role === 'prism') {
      ctx.strokeStyle = light + '44';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(b.x - p.x, b.y - p.y);
      ctx.stroke();

      ctx.rotate(b.age * 2.2);
      ctx.fillStyle = '#0f1624';
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(12, 0);
      ctx.lineTo(0, 14);
      ctx.lineTo(-12, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = p.flash > 0 ? '#fff5dc' : armor;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(8.5, 0);
      ctx.lineTo(0, 10);
      ctx.lineTo(-8.5, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#f8ebff';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = '#0f1624';
      ctx.strokeStyle =
        p.flash > 0
          ? '#fff6de'
          : p.role === 'repair'
            ? '#7ef2a8'
            : p.role === 'lance'
              ? '#ff6b7a'
              : p.role === 'mortar'
                ? '#ffaa54'
                : light;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, p.r * 0.76, 0, TAU);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle =
        p.flash > 0
          ? '#fff6de'
          : p.role === 'pylon'
            ? '#88e8dc'
            : p.role === 'bay'
              ? '#ffd98a'
              : p.role === 'repair'
                ? '#7ef2a8'
                : p.role === 'mortar'
                  ? '#ff9d47'
                  : p.role === 'lance'
                    ? '#ff5468'
                    : '#ffab74';
      ctx.beginPath();
      ctx.arc(0, 0, p.r * 0.36, 0, TAU);
      ctx.fill();
    }

    if (p.hp < p.maxHp) {
      const bw = 22;
      ctx.fillStyle = 'rgba(12, 18, 30, 0.85)';
      ctx.fillRect(-bw / 2 - 1, -p.r - 8, bw + 2, 4);
      ctx.fillStyle = '#88e8dc';
      ctx.fillRect(-bw / 2, -p.r - 7, bw * (p.hp / p.maxHp), 2);
    }
    ctx.restore();
  }
}
