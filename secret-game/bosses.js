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
];

// 8 genuinely distinct flagship chassis archetypes
const CHASSIS_TYPES = [
  { id: 'catamaran', label: 'TWIN-HULL DREADNOUGHT', defaultRole: 'turret', r: 42 },
  { id: 'citadel', label: 'ORBITAL RING CITADEL', defaultRole: 'prism', r: 40 },
  { id: 'monolith', label: 'PRISM MONOLITH', defaultRole: 'prism', r: 38 },
  { id: 'carrier', label: 'SIEGE FLEET CARRIER', defaultRole: 'bay', r: 44 },
  { id: 'scythe', label: 'BLADE INTERCEPTOR', defaultRole: 'turret', r: 37 },
  { id: 'leviathan', label: 'CRESCENT LEVIATHAN', defaultRole: 'pylon', r: 41 },
  { id: 'hive', label: 'HEX SWARM CORE', defaultRole: 'prism', r: 39 },
  { id: 'eclipse', label: 'CORONA SINGULARITY', defaultRole: 'pylon', r: 40 },
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

  if (chassis.id === 'citadel' || chassis.id === 'hive') {
    const count = Math.min(6, 3 + Math.floor(rank / 2));
    const orbitR = chassis.id === 'citadel' ? 56 : 52;
    for (let i = 0; i < count; i++) {
      parts.push({
        id: `NODE-${i + 1}`,
        role: 'prism',
        orbitIndex: i,
        orbitCount: count,
        orbitRadius: orbitR,
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
    // 3 triangular corner emitters
    const offsets = [
      [0, 34],
      [-38, -18],
      [38, -18],
    ];
    offsets.forEach(([ox, oy], i) => {
      parts.push({
        id: `EMITTER-${i + 1}`,
        role: 'turret',
        side: ox < 0 ? -1 : ox > 0 ? 1 : 0,
        ox,
        oy,
        x: 0,
        y: 0,
        r: 14,
        hp: Math.round(partHp * 0.85),
        maxHp: Math.round(partHp * 0.85),
        flash: 0,
        dead: false,
      });
    });
    return parts;
  }

  if (chassis.id === 'catamaran' || chassis.id === 'carrier') {
    // Twin heavy outer hulls + rank 2+ extra inner bays/turrets
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
    if (rank >= 2) {
      for (const side of [-1, 1]) {
        parts.push({
          id: `${side < 0 ? 'L' : 'R'}-WING`,
          role: 'turret',
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

  // Scythe / Leviathan / Eclipse: symmetric wing mounts + higher rank orbiting escorts
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
      flash: 0,
      dead: false,
    });
  }
  if (rank >= 3 || (chassis.id === 'eclipse' && rng() < 0.6)) {
    const orbitCount = rank >= 5 ? 3 : 2;
    for (let i = 0; i < orbitCount; i++) {
      parts.push({
        id: `ORB-${i + 1}`,
        role: 'prism',
        orbitIndex: i,
        orbitCount,
        orbitRadius: 62,
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
  const volleyStyles = ['aimed', 'fan', 'spiral', 'helix', 'cross', 'burst'];
  const specialPool = ['dive', 'minefield', 'beam', 'ringburst', 'barrage'];

  const moveStyle = moveStyles[Math.floor(rng() * moveStyles.length)];
  const volleyStyle = volleyStyles[Math.floor(rng() * volleyStyles.length)];
  const primarySpecial = specialPool[Math.floor(rng() * specialPool.length)];
  const secondarySpecial =
    rank >= 2
      ? specialPool[(specialPool.indexOf(primarySpecial) + 1 + Math.floor(rng() * (specialPool.length - 1))) % specialPool.length]
      : null;

  const palette = BOSS_PALETTES[palIdx];
  // Escalating boss durability so multi-phase fights stay dramatic against upgraded MK V–VII ships!
  const maxHp = Math.round(3 * (42 + rank * 22) * (overclock ? 1.2 : 1));
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
    points: 500 + rank * 260,
    phase: 1,
    entering: 1.5,
    dying: 0,
    deathTick: 0,
    parts: buildPartsForChassis(chassis, rank, rng),
    launchIn: 3.0,
    sortie: 0,
    courseTime: 0,
    exposedFor: 0,
    dive: null,
    beamWarn: 0,
    beamActive: 0,
    beamAngle: 0,
    beamSweep: 0,
    twinBeam: false,
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
    if (p.role === 'prism') {
      const dir = b.chassis === 'hive' ? -1 : 1;
      const a = dir * b.age * (0.95 + (b.phase - 1) * 0.32 + b.rank * 0.05) + (p.orbitIndex * TAU) / p.orbitCount;
      p.x = b.x + Math.cos(a) * p.orbitRadius * b.scale;
      p.y = b.y + Math.sin(a) * (p.orbitRadius * (b.chassis === 'citadel' ? 0.85 : 0.72)) * b.scale;
    } else {
      const spread = (b.phase - 1) * 3;
      p.x = b.x + (p.ox + (p.side || 0) * spread) * b.scale;
      p.y = b.y + p.oy * b.scale;
    }
  }
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
  const phase = Math.min(3, 1 + Math.floor((b.maxHp - b.hp) / (b.maxHp / 3)));
  if (b.hp <= 0 || phase === b.phase) return false;
  b.phase = phase;
  b.dive = null;
  b.beamWarn = 0;
  b.beamActive = 0;
  b.ringQueue = 0;
  b.launchIn = 0.65;
  b.fireIn = 0.95;
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
  const speed = (1 + 0.35 * (1 - Math.exp(-(b.rank - 1) * 0.25))) * (b.overclock ? 1.14 : 1);
  const liveParts = aliveBossParts(b);
  b.courseTime += dt * speed * (1 + pressure * 0.08 + (liveParts.length === 0 ? 0.12 : 0));
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

  if (b.beamActive > 0) {
    b.beamActive = Math.max(0, b.beamActive - dt);
    b.beamAngle += (b.beamSweep || 0) * dt;
    b.x += (goalX - b.x) * (1 - Math.exp(-dt * 0.85));
    syncBossParts(b);
    return;
  }
  if (b.beamWarn > 0) {
    b.beamWarn -= dt;
    b.x += (goalX - b.x) * (1 - Math.exp(-dt * 1.2));
    syncBossParts(b);
    if (b.beamWarn <= 0) {
      b.beamActive = 0.95;
      sound.effect('beam');
    }
    return;
  }

  if (b.dive) {
    const dive = b.dive;
    dive.time += dt;
    const progress = Math.min(1, Math.max(0, (dive.time - 0.78) / 0.68));
    const eased = progress * progress * (3 - 2 * progress);
    b.x = w * (dive.fromX + (dive.toX - dive.fromX) * eased);
    b.y = h * (dive.fromY + (dive.toY - dive.fromY) * eased);
    syncBossParts(b);
    if (progress === 1) b.dive = null;
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

  const specialCycle = 4;
  if ((b.volley + 1) % specialCycle === 0) {
    b.volley++;
    const useSecondary = b.secondarySpecial && b.phase >= 2 && b.volley % 2 === 0;
    const spec = useSecondary ? b.secondarySpecial : b.primarySpecial;

    if (spec === 'dive') {
      b.dive = {
        time: 0,
        fromX: b.x / w,
        fromY: b.y / h,
        toX: Math.max(0.14, Math.min(0.86, player.x / w)),
        toY: Math.max(0.42, Math.min(0.68, player.y / h)),
      };
      b.fireIn = 1.75;
      sound.effect('dash');
      return;
    }
    if (spec === 'beam') {
      b.twinBeam = b.phase === 3 && b.rank >= 3;
      b.beamAngle = Math.max(-0.34, Math.min(0.34, b.aim)) - (b.volley % 2 ? 0.28 : -0.28);
      b.beamSweep = (b.volley % 2 ? 0.52 : -0.52);
      b.beamWarn = 0.95;
      b.fireIn = 1.65;
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
    else if (activeSub.role === 'bay' && activeMines < 3 && b.volley % 2 === 0) {
      enemies.push(createEnemy('mine', activeSub.x, activeSub.y + 14, b.rank, { threat: 1.1, fuse: 4.0 }));
    }
  }

  b.volley++;
  const baseInterval = Math.max(1.02, 1.48 - Math.min(0.38, b.rank * 0.04));
  b.fireIn = 0.55 + (baseInterval - 0.35) / (1 + pressure * 0.12);
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
}

export function drawBoss(ctx, b, w, h) {
  const { armor, light } = b.palette;
  const liveParts = aliveBossParts(b);
  const pylonsUp = hasActivePylons(b);

  ctx.save();
  ctx.translate(b.x, b.y);

  // Dive telegraph
  if (b.dive && b.dive.time < 0.78) {
    const tx = b.dive.toX * w - b.x;
    const ty = b.dive.toY * h - b.y;
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
    ctx.arc(tx, ty, 12 + 20 * (1 - b.dive.time / 0.78), 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  // Sweeping thermal beams
  if (b.beamWarn > 0 || b.beamActive > 0) {
    const offsets = b.twinBeam ? [-0.26, 0.26] : [0];
    for (const off of offsets) {
      ctx.save();
      ctx.rotate((b.beamAngle || 0) + off);
      if (b.beamActive > 0) {
        const pulse = 0.82 + 0.18 * Math.sin(b.age * 48);
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = 'rgba(220, 146, 255, 0.25)';
        ctx.fillRect(-18 * pulse, 18, 36 * pulse, 820);
        ctx.fillStyle = 'rgba(246, 210, 255, 0.74)';
        ctx.fillRect(-7 * pulse, 18, 14 * pulse, 820);
        ctx.fillStyle = '#fff9f2';
        ctx.fillRect(-2.5, 18, 5, 820);
        ctx.globalCompositeOperation = 'source-over';
      } else {
        const p = 1 - b.beamWarn / 0.9;
        ctx.strokeStyle = `rgba(232, 180, 255, ${0.28 + p * 0.65})`;
        ctx.lineWidth = 1 + p * 2.6;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(0, 18);
        ctx.lineTo(0, 820);
        ctx.stroke();
        ctx.setLineDash([]);
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

  // Destructible subsystems
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
      ctx.strokeStyle = p.flash > 0 ? '#fff6de' : light;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, p.r * 0.72, 0, TAU);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle =
        p.flash > 0 ? '#fff6de' : p.role === 'pylon' ? '#88e8dc' : p.role === 'bay' ? '#ffd98a' : '#ffab74';
      ctx.beginPath();
      ctx.arc(0, 0, p.r * 0.34, 0, TAU);
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
