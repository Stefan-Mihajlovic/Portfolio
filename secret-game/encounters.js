// Smart, endlessly playable wave choreography:
// Sub-linear asymptotic scaling so difficulty gets sharper and smarter forever without ever turning into undodgeable spam.
const scores = {
  rock: 15,
  raider: 45,
  kite: 60,
  lancer: 80,
  gunship: 145,
  prism: 165,
  minelayer: 220,
  courier: 210,
  dreadcourier: 420,
  ace: 520,
  volatile: 65,
  shieldgen: 260,
  gravmine: 195,
  turretbarge: 280,
  vanguard: 230,
  swarmpod: 200,
  swarmer: 30,
  sniper: 175,
  orbiter: 165,
  bomber: 245,
  phantom: 190,
  healer: 235,
  mine: 25,
};

export const waveNames = [
  'ORBITAL ENTRY',
  'FLANKER BLITZ',
  'ASTEROID CANYON',
  'LASER GAUNTLET',
  'TREASURE CONVOY',
  'PHANTOM AMBUSH',
  'ACE INTERCEPT',
  'COMBINED ASSAULT',
];

const WAVE_ARCHETYPES = [
  {
    id: 'assault',
    title: 'COMBINED ASSAULT',
    tone: 'teal',
    cadenceMult: 1.0,
    pool: ['echelon', 'sideRibbon', 'shieldFortress', 'orbiterRing', 'turretCrossfire', 'clusterSiege', 'gravityTrap', 'courier', 'healerPhalanx'],
  },
  {
    id: 'blitz',
    title: 'FLANKER BLITZ',
    tone: 'teal',
    cadenceMult: 1.28,
    pool: ['sideRibbon', 'pincerFlank', 'crossWeave', 'pincerStrike', 'sideRibbon', 'courier'],
  },
  {
    id: 'canyon',
    title: 'ASTEROID CANYON',
    tone: 'gold',
    cadenceMult: 1.12,
    pool: ['asteroidRiver', 'volatileRocks', 'sniperRun', 'gravityTrap', 'railSniper', 'courier'],
  },
  {
    id: 'gauntlet',
    title: 'LASER GAUNTLET',
    tone: 'teal',
    cadenceMult: 0.96,
    pool: ['laserLink', 'prismCorridor', 'turretCrossfire', 'crossLaserGate', 'orbiterRing', 'mineSweep'],
  },
  {
    id: 'convoy',
    title: 'TREASURE CONVOY',
    tone: 'gold',
    cadenceMult: 0.95,
    pool: ['sideRibbon', 'treasureConvoy', 'shieldFortress', 'healerPhalanx', 'pincerFlank', 'anchorBattery'],
  },
  {
    id: 'ambush',
    title: 'PHANTOM AMBUSH',
    tone: 'warn',
    cadenceMult: 1.08,
    pool: ['blinkAmbush', 'gravityTrap', 'phantomSniper', 'pincerFlank', 'swarmDrop', 'clusterSiege'],
  },
  {
    id: 'ace',
    title: 'ACE INTERCEPT',
    tone: 'warn',
    cadenceMult: 0.88,
    pool: ['sideRibbon', 'aceDuel', 'echelon', 'pincerFlank', 'courier', 'sniperRun'],
  },
  {
    id: 'fortress',
    title: 'SIEGE FORTRESS',
    tone: 'warn',
    cadenceMult: 0.92,
    pool: ['shieldFortress', 'turretCrossfire', 'gravityTrap', 'healerPhalanx', 'volatileRocks', 'clusterSiege'],
  },
];

function waveRng(seed) {
  let s = (seed * 2654435761) >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return (s >>> 0) / 4294967296;
  };
}

// Deterministic per-run shuffled wave archetype selector — never repeats back-to-back & feels unique every run!
export function getWaveProfile(wave, runSeed = 1, sectorIndex = 0) {
  if (wave <= 1) {
    // Wave 1: lively opener (alternates Assault vs Flanker Blitz across runs!)
    const startIdx = runSeed % 2 === 0 ? 0 : 1;
    const base = WAVE_ARCHETYPES[startIdx];
    return { ...base, title: wave === 1 ? 'ORBITAL ENTRY' : base.title };
  }
  const cycle = Math.floor((wave - 2) / WAVE_ARCHETYPES.length);
  const pos = (wave - 2) % WAVE_ARCHETYPES.length;
  const order = WAVE_ARCHETYPES.map((_, i) => i);
  const rng = waveRng(runSeed * 6151 + cycle * 9973 + 19);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  // Avoid repeating Wave 1's archetype immediately on Wave 2
  if (cycle === 0 && order[0] === (runSeed % 2 === 0 ? 0 : 1)) {
    [order[0], order[1]] = [order[1], order[0]];
  }
  return WAVE_ARCHETYPES[order[pos]];
}

export const waveLength = 15.0;

export function createEnemy(kind, x, y, wave, overrides = {}) {
  const tier = Math.max(0, wave - 1);
  const overclock = Boolean(overrides.overclock);
  const sec = (overrides.sectorIndex || 0) % 8;
  // Asymptotic speed curve: climbs smoothly toward ~1.38x (+14% in Overclock, +7% in Eclipse, +10% in Event Horizon)
  const speed =
    (1 + 0.38 * (1 - Math.exp(-tier * 0.16))) *
    (overclock ? 1.14 : 1) *
    (sec === 3 ? 1.07 : sec === 7 ? 1.1 : 1);
  // Smoothly escalating HP across ALL enemy tiers so higher waves stay engaging even at MK V–VII!
  const hpMult = (1 + tier * 0.24 + Math.log2(1 + tier * 0.65) * 0.35) * (overclock ? 1.2 : 1);

  const rMap = {
    rock: 18 + Math.random() * 10,
    raider: 16,
    kite: 14,
    lancer: 15,
    gunship: 24,
    prism: 18,
    minelayer: 22,
    courier: 20,
    dreadcourier: 27,
    ace: 24,
    volatile: 17,
    shieldgen: 20,
    gravmine: 17,
    turretbarge: 25,
    vanguard: 23,
    swarmpod: 20,
    swarmer: 10,
    sniper: 17,
    orbiter: 18,
    bomber: 24,
    phantom: 16,
    healer: 19,
    mine: 10,
  };
  const cruiseMap = {
    rock: 86,
    raider: 102,
    kite: 128,
    lancer: 106,
    gunship: 66,
    prism: 74,
    minelayer: 62,
    courier: 72,
    dreadcourier: 56,
    ace: 118,
    volatile: 64,
    shieldgen: 62,
    gravmine: 52,
    turretbarge: 50,
    vanguard: 58,
    swarmpod: 64,
    swarmer: 175,
    sniper: 82,
    orbiter: 88,
    bomber: 56,
    phantom: 98,
    healer: 68,
    mine: 36,
  };
  const baseHp = {
    rock: 2,
    raider: 1.35,
    kite: 1.5,
    lancer: 2.5,
    gunship: 7,
    prism: 5,
    minelayer: 12,
    courier: 6,
    dreadcourier: 22,
    ace: 26,
    volatile: 2.2,
    shieldgen: 6.2,
    gravmine: 5.5,
    turretbarge: 11,
    vanguard: 8,
    swarmpod: 6.5,
    swarmer: 1,
    sniper: 4.5,
    orbiter: 5.2,
    bomber: 9.5,
    phantom: 4.2,
    healer: 6.5,
    mine: 2,
  };
  const shardMap = {
    rock: 1,
    raider: 2,
    kite: 2,
    lancer: 3,
    gunship: 5,
    prism: 5,
    minelayer: 6,
    courier: 6,
    dreadcourier: 12,
    ace: 12,
    volatile: 3,
    shieldgen: 6,
    gravmine: 5,
    turretbarge: 7,
    vanguard: 6,
    swarmpod: 5,
    swarmer: 1,
    sniper: 4,
    orbiter: 5,
    bomber: 7,
    phantom: 5,
    healer: 6,
    mine: 1,
  };
  const r = overrides.r ?? rMap[kind] ?? 16;
  const computedHp =
    kind === 'mine' || kind === 'swarmer'
      ? baseHp[kind]
      : kind === 'rock'
        ? Math.max(2, Math.round(baseHp.rock * (1 + tier * 0.12)))
        : Math.max(1, Math.round((baseHp[kind] || 1) * hpMult));
  const hp = overrides.hp ?? computedHp;
  const cruise = (overrides.cruise ?? cruiseMap[kind] ?? 95) * speed;

  return {
    kind,
    r,
    x,
    y,
    vx: kind === 'rock' ? (Math.random() - 0.5) * 36 : 0,
    vy: cruise,
    cruise,
    dir: 1,
    threat: speed,
    wave,
    age: 0,
    fireIn:
      overrides.fireIn ??
      (kind === 'kite'
        ? 1.15
        : kind === 'prism'
          ? 1.35
          : kind === 'minelayer'
            ? 0.7
            : kind === 'sniper'
              ? 1.4
              : kind === 'orbiter'
                ? 1.05
                : kind === 'bomber'
                  ? 1.45
                  : kind === 'phantom'
                    ? 1.25
                    : 1.3),
    aim: 0,
    aimAngle: 0,
    aimLock: 0,
    locked: false,
    frontShield: kind === 'vanguard',
    shieldFlash: 0,
    hatchIn: kind === 'swarmpod' ? 3.4 : 0,
    blinkCd: kind === 'phantom' ? 1.55 : 0,
    blinkTelegraph: 0,
    blinkTargetX: undefined,
    blinkTargetY: undefined,
    healTarget: null,
    healTargets: [],
    healPulseIn: kind === 'healer' ? 1.35 : 0,
    flash: 0,
    hp,
    maxHp: hp,
    points: Math.round((scores[kind] || 40) * (1 + Math.log2(1 + tier) * 0.25)),
    shards: shardMap[kind] || 2,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 1.6,
    split: kind === 'rock' && r >= 20,
    beamWarn: 0,
    beamActive: 0,
    beamAngle: 0,
    fuse: kind === 'mine' ? Math.max(3.2, 4.4 - Math.min(1.0, tier * 0.1)) : 0,
    trail: [],
    ...overrides,
  };
}

export function spawnFormation(enemies, w, wave, beat, playerX, opts = {}) {
  const { overclock = false, sectorIndex = 0, runSeed = 1, h = 700 } = opts;
  const profile = getWaveProfile(wave, runSeed, sectorIndex);
  let kind;
  if (profile.id === 'convoy' || profile.id === 'ace') {
    // Choreographed event beats: warm-up -> marquee event on beat 1 -> escalating follow-ups
    kind = profile.pool[beat % profile.pool.length];
  } else {
    // Deterministically shuffled non-repeating sequence per wave & run!
    const rng = waveRng(runSeed * 3571 + wave * 919 + sectorIndex * 73);
    const shuffled = [...profile.pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    kind = shuffled[beat % shuffled.length];
    // On Wave 1 beat 0, ensure an approachable, fun opening formation
    if (wave === 1 && beat === 0) kind = runSeed % 2 === 0 ? 'echelon' : 'sideRibbon';
    // Keep high-complexity healers/cross-gates for Wave 2+
    if (wave === 1 && (kind === 'healerPhalanx' || kind === 'crossLaserGate')) kind = 'laserLink';
  }
  const center = Math.max(0.2, Math.min(0.8, (playerX / w) * 0.4 + 0.18 + Math.random() * 0.36));
  const side = Math.random() < 0.5 ? 1 : -1;

  function add(type, lane, delay = 0, dir = side, extra = {}) {
    const r =
      extra.r ??
      { rock: 22, raider: 16, kite: 14, lancer: 15, gunship: 24, prism: 18, minelayer: 22, courier: 20, dreadcourier: 27, ace: 24, volatile: 17 }[type] ??
      16;
    const x = extra.x ?? Math.max(r + 12, Math.min(w - r - 12, lane * w));
    const y = extra.y ?? -r - 10 - delay * 95;
    const foe = createEnemy(type, x, y, wave, {
      dir,
      overclock,
      sectorIndex,
      molten: type === 'rock' && (sectorIndex % 8 === 1 || sectorIndex % 8 === 3),
      cryo: type === 'rock' && sectorIndex % 8 === 5,
      ...extra,
    });
    enemies.push(foe);
    return foe;
  }

  function addFlanker(type, fromSide, yFrac, wait, extra = {}) {
    const r = type === 'ace' ? 24 : type === 'kite' ? 14 : 16;
    const startX = fromSide < 0 ? -r - 18 : w + r + 18;
    const startY = Math.max(68, Math.min(h * 0.48, h * yFrac));
    return add(type, 0.5, 0, -fromSide, {
      x: startX,
      y: startY,
      flank: {
        fromSide,
        wait,
        baseY: startY,
        amp: extra.flankAmp ?? 42,
        freq: extra.flankFreq ?? 2.6,
        speedX: extra.flankSpeed ?? Math.min(220, Math.max(155, w * 0.34)),
      },
      ...extra,
    });
  }

  if (kind === 'sideRibbon') {
    // Classic arcade curved ribbon of 4-5 nimble fighters sweeping in from the LEFT or RIGHT edge!
    const fromSide = side;
    const count = wave >= 4 ? 5 : 4;
    const baseY = 0.16 + Math.random() * 0.14;
    for (let i = 0; i < count; i++) {
      addFlanker(i % 2 === 0 ? 'kite' : 'raider', fromSide, baseY + i * 0.025, 0.45 + i * 0.24, {
        fireIn: 0.95 + i * 0.28,
        flankAmp: 46,
        flankFreq: 2.9,
      });
    }
  } else if (kind === 'pincerFlank') {
    // Mirrored left+right crossing ribbons squeezing the mid-field!
    for (let i = 0; i < 3; i++) {
      addFlanker('kite', -1, 0.17 + i * 0.05, 0.45 + i * 0.28, { fireIn: 1.05 + i * 0.35, flankAmp: 34 });
      addFlanker('kite', 1, 0.22 + i * 0.05, 0.55 + i * 0.28, { fireIn: 1.25 + i * 0.35, flankAmp: 34 });
    }
  } else if (kind === 'asteroidRiver') {
    // Dense asteroid canyon corridor with an open slalom channel + ambush sniper/lancer!
    const gapLane = Math.max(0.24, Math.min(0.76, center));
    for (let i = 0; i < 5; i++) {
      const lane = 0.1 + i * 0.2;
      if (Math.abs(lane - gapLane) < 0.14) continue;
      add('rock', lane, i * 0.16, side, { r: 21 + Math.random() * 8 });
    }
    add('rock', gapLane + (gapLane > 0.5 ? -0.22 : 0.22), 0.72, -side, { r: 24 });
    add(wave >= 3 ? 'sniper' : 'lancer', gapLane, 0.48, side, { holdY: 0.17, fireIn: 1.3 });
    if (sectorIndex % 8 === 6 || wave >= 3) {
      add('volatile', Math.max(0.18, Math.min(0.82, 1 - gapLane)), 0.32, side);
    }
  } else if (kind === 'volatileRocks') {
    // Explosive derelict reactor drums nestled inside an enemy squad — shoot the drum for chain kills!
    add('volatile', center, 0.15, side);
    add('raider', Math.max(0.14, center - 0.16), 0.1, 1, { fireIn: 1.25 });
    add('raider', Math.min(0.86, center + 0.16), 0.1, -1, { fireIn: 1.6 });
    add('rock', Math.max(0.12, center - 0.28), 0.45, 1, { r: 22 });
    add('rock', Math.min(0.88, center + 0.28), 0.45, -1, { r: 22 });
  } else if (kind === 'treasureConvoy') {
    // High-value Gold Dread-Courier escorted by Shield Vanguard & Healer!
    const startLane = side > 0 ? 0.2 : 0.8;
    add('dreadcourier', startLane, 0, side);
    add('vanguard', Math.max(0.16, Math.min(0.84, startLane + side * 0.14)), 0.22, side, { fireIn: 1.4 });
    add('healer', Math.max(0.18, Math.min(0.82, startLane - side * 0.14)), 0.38, -side, { holdY: 0.22 });
  } else if (kind === 'aceDuel') {
    // Mini-Boss Event: Elite Crimson-Gold Ace Interceptor enters from the flank!
    addFlanker('ace', side, 0.2, 0.75, {
      fireIn: 1.15,
      dashCd: 2.1,
      flankSpeed: 210,
      flankAmp: 16,
    });
    add('raider', side > 0 ? 0.22 : 0.78, 0.35, -side, { fireIn: 1.5 });
  } else if (kind === 'shieldFortress') {
    // Tactical Priority Puzzle: Shield Generator projecting 75% armor bubbles over Turret Barge & flankers!
    add('turretbarge', center, 0, side, { holdY: 0.2, fireIn: 1.35 });
    add('shieldgen', Math.max(0.18, Math.min(0.82, center + side * 0.24)), 0.25, -side, { holdY: 0.23 });
    add('raider', Math.max(0.14, Math.min(0.86, center - side * 0.24)), 0.45, side, { fireIn: 1.65 });
  } else if (kind === 'gravityTrap') {
    // Spatial Synergy Trap: Gravity Mine tugging ship + Cluster Bomber or Lancers!
    add('gravmine', center, 0.1, side, { holdY: 0.3 });
    add(wave >= 3 ? 'bomber' : 'gunship', Math.max(0.2, Math.min(0.8, 1 - center)), 0.25, -side, { fireIn: 1.4 });
    add('kite', side > 0 ? 0.16 : 0.84, 0.4, side, { fireIn: 1.5 });
  } else if (kind === 'turretCrossfire') {
    // Dual Rotating Artillery Barges locking lanes from opposite corners (flank their turret turn speed!)
    add('turretbarge', 0.22, 0, 1, { holdY: 0.19, fireIn: 1.15 });
    add('turretbarge', 0.78, 0.35, -1, { holdY: 0.22, fireIn: 1.95 });
    add('volatile', 0.5, 0.55, side);
  } else if (kind === 'laserLink') {
    // Synchronized laser-tethered drone gate! Shoot either anchor node to snap the live plasma beam!
    const span = Math.min(0.32, Math.max(0.22, 230 / Math.max(360, w)));
    const mid = Math.max(0.26, Math.min(0.74, center));
    const leftNode = add('prism', Math.max(0.12, mid - span * 0.55), 0, side, {
      tethered: true,
      tetherWarmup: 1.05,
      cruise: 70,
      fireIn: 99,
    });
    const rightNode = add('prism', Math.min(0.88, mid + span * 0.55), 0, side, {
      tethered: true,
      tetherWarmup: 1.05,
      cruise: 70,
      fireIn: 99,
    });
    leftNode.linkPartner = rightNode;
    rightNode.linkedBy = leftNode;
    // On Wave 5+, add a third linked node forming an angled dual-beam chevron!
    if (wave >= 5) {
      const topNode = add('raider', mid, 0.42, side, {
        tethered: true,
        tetherWarmup: 1.15,
        cruise: 70,
        fireIn: 2.0,
      });
      rightNode.linkPartner = topNode;
      topNode.linkedBy = rightNode;
    } else {
      add('raider', mid > 0.5 ? 0.2 : 0.8, 0.55, -side, { fireIn: 1.6 });
    }
  } else if (kind === 'vanguardWall') {
    // Shielded Vanguard heavy + flanking Raiders (pierce through front shield or flank from sides!)
    add('vanguard', center, 0, side, { fireIn: 1.35 });
    add('raider', Math.max(0.14, center - 0.24), 0.35, 1, { fireIn: 1.65 });
    add('raider', Math.min(0.86, center + 0.24), 0.35, -1, { fireIn: 2.05 });
  } else if (kind === 'swarmDrop') {
    // Armored Swarm Pod(s) — focus them down before their countdown cracks open!
    add('swarmpod', Math.max(0.24, Math.min(0.76, center)), 0, side);
    if (wave >= 5) add('swarmpod', 1 - center, 0.55, -side);
    add('kite', side > 0 ? 0.18 : 0.82, 0.3, side, { fireIn: 1.4 });
  } else if (kind === 'railSniper') {
    // Precision Rail Snipers locking red targeting beams from the upper flanks!
    add('sniper', 0.2, 0, 1, { holdY: 0.16, fireIn: 1.25 });
    add('sniper', 0.8, 0.25, -1, { holdY: 0.19, fireIn: 2.05 });
    add('raider', 0.5, 0.65, side, { fireIn: 1.6 });
  } else if (kind === 'echelon') {
    // Synchronized V-chevron with staggered firing cadence so shots arrive in a readable rhythm
    add('raider', center, 0, side, { fireIn: 1.15 });
    add('raider', center - 0.14, 0.35, 1, { fireIn: 1.55 });
    add('raider', center + 0.14, 0.35, -1, { fireIn: 1.95 });
    if (wave >= 4) add('kite', 1 - center, 0.85, -side, { fireIn: 1.6 });
  } else if (kind === 'crossWeave') {
    // Clean mirrored twin-sine dancers
    add('kite', 0.24, 0, 1, { fireIn: 1.15 });
    add('kite', 0.76, 0.18, -1, { fireIn: 1.55 });
    add('raider', 0.5, 0.65, side, { fireIn: 1.85 });
  } else if (kind === 'rocks') {
    add('rock', center - 0.22, 0, 1, { r: 24 });
    add('rock', center + 0.2, 0.4, -1, { r: 22 });
    add('raider', center, 0.6, side);
  } else if (kind === 'sniperRun') {
    // Rhythmically staggered Lancer dives (0.0s -> 0.6s -> 1.2s) so every lock-on is cleanly dodgeable
    add('lancer', Math.max(0.16, center - 0.18), 0, 1);
    add('lancer', Math.min(0.84, center + 0.18), 0.55, -1);
    if (wave >= 3) add('lancer', 0.5, 1.1, side);
  } else if (kind === 'prismCorridor') {
    // Alternating thermal beams (staggered fireIn so the two beams never lock down the whole arena at once!)
    add('prism', 0.24, 0, 1, { holdY: 0.18, fireIn: 1.1 });
    add('prism', 0.76, 0.25, -1, { holdY: 0.21, fireIn: 2.35 });
    add('raider', 0.5, 0.75, side, { fireIn: 1.7 });
  } else if (kind === 'mineSweep') {
    // Armored minelayer sweeping across mid-field (twin staggered sweepers from Wave 8+!)
    add('minelayer', side > 0 ? 0.18 : 0.82, 0, side);
    if (wave >= 8) {
      add('minelayer', side > 0 ? 0.82 : 0.18, 0.75, -side);
      add('kite', 0.5, 0.5, side, { fireIn: 1.7 });
    } else {
      add('raider', side > 0 ? 0.78 : 0.22, 0.45, -side, { fireIn: 1.5 });
      if (wave >= 4) add('kite', 0.5, 0.9, side, { fireIn: 1.8 });
    }
  } else if (kind === 'pincerStrike') {
    // Outer flankers + staggered dive team
    add('raider', 0.16, 0, 1, { fireIn: 1.2 });
    add('raider', 0.84, 0, -1, { fireIn: 1.65 });
    add('lancer', 0.34, 0.55, 1);
    add('lancer', 0.66, 1.05, -1);
  } else if (kind === 'courier') {
    const startLane = side > 0 ? 0.22 : 0.78;
    add('courier', startLane, 0, side);
    add('raider', Math.max(0.12, startLane - 0.1), 0.25, side, { fireIn: 1.3 });
    add('raider', Math.min(0.88, startLane + 0.1), 0.25, side, { fireIn: 1.75 });
  } else if (kind === 'anchorBattery') {
    add('gunship', center, 0, side, { fireIn: 1.25 });
    add('kite', Math.max(0.14, center - 0.24), 0.5, 1, { fireIn: 1.7 });
    add('kite', Math.min(0.86, center + 0.24), 0.5, -1, { fireIn: 2.1 });
  } else if (kind === 'shieldWall') {
    // Staggered dual gunships (never firing on the exact same frame!)
    add('gunship', 0.3, 0, 1, { fireIn: 1.2 });
    add('gunship', 0.7, 0.35, -1, { fireIn: 2.15 });
    if (wave >= 4) add('lancer', 0.5, 0.95, side);
  } else if (kind === 'orbiterRing') {
    // Twin spinning Pulse Orbiters firing rotating cross-volleys + agile wingman
    add('orbiter', 0.28, 0, 1, { holdY: 0.24, fireIn: 1.05 });
    add('orbiter', 0.72, 0.28, -1, { holdY: 0.28, fireIn: 1.75 });
    add('raider', 0.5, 0.7, side, { fireIn: 1.6 });
  } else if (kind === 'clusterSiege') {
    // Heavy Cluster Bomber lobbing mid-air shrapnel shells escorted by flanked raiders
    add('bomber', center, 0, side, { fireIn: 1.35 });
    add('kite', Math.max(0.14, center - 0.26), 0.35, 1, { fireIn: 1.55 });
    add('kite', Math.min(0.86, center + 0.26), 0.35, -1, { fireIn: 2.0 });
  } else if (kind === 'blinkAmbush') {
    // Teleporting Phase Phantoms that blink across lanes before firing 3-bolt bursts
    add('phantom', 0.24, 0, 1, { fireIn: 1.25 });
    add('phantom', 0.76, 0.32, -1, { fireIn: 1.9 });
    add('lancer', 0.5, 0.85, side);
  } else if (kind === 'healerPhalanx') {
    // Shielded Vanguard or Bomber backed by an emerald Repair Drone — prioritize the Healer!
    add(wave >= 4 ? 'bomber' : 'vanguard', center, 0, side, { fireIn: 1.45 });
    add('healer', Math.max(0.18, Math.min(0.82, center + side * 0.22)), 0.32, -side, { holdY: 0.2 });
    add('raider', Math.max(0.14, Math.min(0.86, center - side * 0.24)), 0.55, side, { fireIn: 1.75 });
  } else if (kind === 'crossLaserGate') {
    // Dual staggered diagonal laser-tether gates!
    const a1 = add('prism', 0.18, 0, 1, { tethered: true, tetherWarmup: 1.0, cruise: 68, fireIn: 99 });
    const a2 = add('prism', 0.52, 0.25, 1, { tethered: true, tetherWarmup: 1.0, cruise: 68, fireIn: 99 });
    a1.linkPartner = a2;
    a2.linkedBy = a1;
    const b1 = add('prism', 0.82, 0.75, -1, { tethered: true, tetherWarmup: 1.05, cruise: 68, fireIn: 99 });
    const b2 = add('prism', 0.48, 1.0, -1, { tethered: true, tetherWarmup: 1.05, cruise: 68, fireIn: 99 });
    b1.linkPartner = b2;
    b2.linkedBy = b1;
  } else if (kind === 'phantomSniper') {
    // High-pressure precision combo: Rail Sniper + blinking Phantom flanker
    add('sniper', side > 0 ? 0.2 : 0.8, 0, side, { holdY: 0.17, fireIn: 1.3 });
    add('phantom', side > 0 ? 0.76 : 0.24, 0.2, -side, { fireIn: 1.65 });
    add('orbiter', 0.5, 0.75, side, { holdY: 0.26, fireIn: 1.5 });
  }

  // Light ambient asteroid only if field isn't cluttered
  if (kind !== 'rocks' && enemies.length < 5 && (wave > 1 || w > 720)) {
    add('rock', center > 0.5 ? 0.12 : 0.88, 0.95, side, { r: 16 + Math.random() * 7 });
  }
}

export function flyEnemy(e, rawDt, w, h, player, shots, sound, enemies, ionWind = 0) {
  if (e.frozen > 0) e.frozen = Math.max(0, e.frozen - rawDt);
  const dt = e.frozen > 0 ? rawDt * 0.45 : rawDt;
  e.age += dt;
  e.flash = Math.max(0, e.flash - rawDt);
  if (e.shieldFlash > 0) e.shieldFlash = Math.max(0, e.shieldFlash - rawDt);
  const wv = e.wave || 1;

  // Side-entry curved ribbon flankers (enter from LEFT/RIGHT with off-screen warning telegraph!)
  if (e.flank && e.kind !== 'ace') {
    const f = e.flank;
    if (f.wait > 0) {
      f.wait -= rawDt;
      return;
    }
    const dir = -f.fromSide;
    e.vx = dir * f.speedX * Math.min(1.25, e.threat);
    const waveT = (e.age - 0.1) * f.freq;
    e.vy = Math.cos(waveT) * f.amp * 2.2 + 42;
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    e.tilt = -Math.atan2(e.vx, Math.max(60, Math.abs(e.vy) + 70)) * 0.72;
    if ((dir > 0 && e.x > w + e.r + 48) || (dir < 0 && e.x < -e.r - 48)) {
      e.dead = true;
      return;
    }
    if (e.x > 16 && e.x < w - 16 && e.y > 16 && e.y < player.y - 60) {
      e.fireIn -= dt;
      if (e.fireIn <= 0) {
        const aim = Math.atan2(player.x - e.x, Math.max(60, player.y - e.y));
        const spd = Math.min(220, 168 * e.threat);
        shots.push({
          x: e.x,
          y: e.y + 8,
          r: 4,
          vx: Math.sin(aim) * spd,
          vy: Math.cos(aim) * spd,
          hostile: true,
          color: '#ff9c6e',
        });
        sound.effect('raider');
        e.fireIn = Math.max(1.35, 1.95 / e.threat);
      }
    }
    return;
  }

  // Mini-Boss: Elite Ace Interceptor (enters from flank, dashes across arena with laser telegraph, aimed bursts!)
  if (e.kind === 'ace') {
    if (e.flank && e.flank.wait > 0) {
      e.flank.wait -= rawDt;
      return;
    }
    if (e.flank) {
      const targetX = e.flank.fromSide < 0 ? w * 0.28 : w * 0.72;
      e.x += (targetX - e.x) * (1 - Math.exp(-dt * 4.5));
      e.y += (h * 0.22 - e.y) * (1 - Math.exp(-dt * 4.5));
      e.tilt = -Math.sign(targetX - e.x) * 0.35;
      if (Math.abs(targetX - e.x) < 18) e.flank = null;
      return;
    }
    if (e.dashTelegraph > 0) {
      e.dashTelegraph -= dt;
      e.vx *= Math.exp(-dt * 10);
      e.vy *= Math.exp(-dt * 10);
      if (e.dashTelegraph <= 0) {
        e.dashing = 0.36;
        e.dashStartX = e.x;
        e.dashStartY = e.y;
        sound.effect('dash');
      }
      return;
    }
    if (e.dashing > 0) {
      e.dashing -= dt;
      const p = 1 - Math.max(0, e.dashing / 0.36);
      const eased = p * p * (3 - 2 * p);
      const prevX = e.x;
      e.x = e.dashStartX + (e.dashTargetX - e.dashStartX) * eased;
      e.y = e.dashStartY + (e.dashTargetY - e.dashStartY) * eased;
      e.tilt = -Math.atan2(e.x - prevX, 14) * 0.5;
      e.trail.push({ x: e.x, y: e.y, tilt: e.tilt, life: 0.22 });
      if (e.trail.length > 7) e.trail.shift();
      if (e.dashing <= 0) {
        // Snap-fire crisp 5-bolt fan right after dash stop!
        const aim = Math.atan2(player.x - e.x, Math.max(70, player.y - e.y));
        const spd = Math.min(240, 184 * e.threat);
        for (const off of [-0.34, -0.17, 0, 0.17, 0.34]) {
          shots.push({
            x: e.x,
            y: e.y + 12,
            r: 4.3,
            vx: Math.sin(aim + off) * spd,
            vy: Math.cos(aim + off) * spd,
            hostile: true,
            color: '#ffd56b',
          });
        }
        sound.effect('volley');
        e.dashCd = Math.max(2.1, 2.8 / e.threat);
      }
      return;
    }
    // Agile stalking orbit in upper field
    const trackX = Math.max(w * 0.16, Math.min(w * 0.84, player.x * 0.65 + (w * 0.5 + Math.sin(e.age * 1.8) * w * 0.22) * 0.35));
    const goalY = e.age < 13.5 ? h * (0.2 + Math.sin(e.age * 1.6) * 0.06) : h + 80;
    e.vx = (trackX - e.x) * 2.6;
    e.vy = (goalY - e.y) * (e.age < 13.5 ? 2.6 : 1.1);
    e.x = Math.max(e.r + 14, Math.min(w - e.r - 14, e.x + e.vx * dt));
    e.y += e.vy * dt;
    e.tilt = -Math.atan2(e.vx, 220) * 0.55;
    if (e.age < 12.5) {
      e.dashCd = (e.dashCd ?? 2.2) - dt;
      if (e.dashCd <= 0) {
        e.dashTargetX = e.x < w * 0.5 ? w * (0.68 + Math.random() * 0.16) : w * (0.16 + Math.random() * 0.16);
        e.dashTargetY = h * (0.18 + Math.random() * 0.2);
        e.dashTelegraph = 0.55;
        sound.effect('sniperLock');
        return;
      }
      e.fireIn -= dt;
      if (e.fireIn <= 0) {
        const aim = Math.atan2(player.x - e.x, Math.max(70, player.y - e.y));
        const spd = Math.min(235, 178 * e.threat);
        for (const off of [-0.14, 0, 0.14]) {
          shots.push({
            x: e.x,
            y: e.y + 12,
            r: 4.1,
            vx: Math.sin(aim + off) * spd,
            vy: Math.cos(aim + off) * spd,
            hostile: true,
            color: '#ff6e7a',
          });
        }
        sound.effect('raider');
        e.fireIn = Math.max(1.15, 1.55 / e.threat);
      }
    }
    return;
  }

  if (e.kind === 'dreadcourier') {
    // High-value Gold Convoy barge weaving slowly across the arena (defensive twin bursts)
    e.vx = e.dir * Math.min(82, w * 0.15);
    e.vy = e.cruise * (e.y < h * 0.2 ? 1.1 : 0.42);
    e.x += e.vx * dt;
    if (e.x < e.r + 22) e.dir = 1;
    if (e.x > w - e.r - 22) e.dir = -1;
    e.y += e.vy * dt;
    e.tilt = Math.sin(e.age * 2.0) * 0.08;
    if (e.y > 24 && e.y < player.y - 80) {
      e.fireIn -= dt;
      if (e.fireIn <= 0) {
        for (const off of [-0.25, 0.25]) {
          shots.push({
            x: e.x + Math.sign(off) * 16,
            y: e.y + 14,
            r: 4.2,
            vx: Math.sin(off) * 155,
            vy: Math.cos(off) * 155,
            hostile: true,
            color: '#ffd56b',
          });
        }
        e.fireIn = 1.95;
      }
    }
    return;
  }

  if (e.kind === 'volatile') {
    e.x = Math.max(e.r + 12, Math.min(w - e.r - 12, e.x + (Math.sin(e.age * 1.4 + e.angle) * 18 + ionWind * 0.45) * dt));
    e.y += e.vy * dt;
    return;
  }

  if (e.kind === 'shieldgen') {
    // Projects hard-light cyan shield bubbles onto up to 2 nearby allies — snipe this first!
    const holdY = h * (e.holdY || 0.23);
    const arrival = Math.max(0, Math.min(e.cruise, (holdY - e.y) * 2.2));
    e.vy += ((e.age < 10.5 ? arrival : e.cruise * 1.4) - e.vy) * (1 - Math.exp(-dt * 4));
    e.vx = e.dir * Math.sin(e.age * 1.1) * 44;
    e.x = Math.max(e.r + 16, Math.min(w - e.r - 16, e.x + e.vx * dt));
    e.y += e.vy * dt;

    // Clear stale shield pointers owned by this generator, then re-link closest 2 allies
    for (const ally of enemies) {
      if (ally.shieldedBy === e) ally.shieldedBy = null;
    }
    const candidates = [];
    for (const ally of enemies) {
      if (ally === e || ally.dead || ally.kind === 'rock' || ally.kind === 'mine' || ally.kind === 'shieldgen' || ally.kind === 'volatile' || ally.kind === 'boss') continue;
      const d = Math.hypot(ally.x - e.x, ally.y - e.y);
      if (d < 360) candidates.push({ ally, d });
    }
    candidates.sort((a, b) => a.d - b.d);
    e.shieldTargets = candidates.slice(0, 2).map((c) => c.ally);
    for (const ally of e.shieldTargets) ally.shieldedBy = e;
    return;
  }

  if (e.kind === 'gravmine') {
    // Drifts to mid-field, pulls player & curves nearby bullets until shot down!
    const holdY = h * (e.holdY || 0.3);
    const arrival = Math.max(0, Math.min(e.cruise, (holdY - e.y) * 1.9));
    e.vy += ((e.age < 9.5 ? arrival : e.cruise * 1.4) - e.vy) * (1 - Math.exp(-dt * 3.5));
    e.vx = e.dir * Math.sin(e.age * 0.9) * 24;
    e.x = Math.max(e.r + 18, Math.min(w - e.r - 18, e.x + e.vx * dt));
    e.y += e.vy * dt;
    return;
  }

  if (e.kind === 'turretbarge') {
    // Heavy slow armored barge with a rotating dual turret that turns at finite angular speed (flank its blind spot!)
    const holdY = h * (e.holdY || 0.2);
    const arrival = Math.max(0, Math.min(e.cruise, (holdY - e.y) * 2.0));
    e.vy += ((e.age < 9.2 ? arrival : e.cruise * 1.35) - e.vy) * (1 - Math.exp(-dt * 3.5));
    e.vx = e.dir * Math.sin(e.age * 0.75) * 24;
    e.x = Math.max(e.r + 18, Math.min(w - e.r - 18, e.x + e.vx * dt));
    e.y += e.vy * dt;

    const desired = Math.max(-1.05, Math.min(1.05, Math.atan2(player.x - e.x, Math.max(55, player.y - e.y))));
    const cur = e.turretAngle || 0;
    const maxTurn = 1.45 * dt;
    e.turretAngle = cur + Math.max(-maxTurn, Math.min(maxTurn, desired - cur));

    if (e.y > 22 && e.age < 8.4) {
      e.fireIn -= dt;
      if (e.fireIn <= 0) {
        const a = e.turretAngle || 0;
        const spd = Math.min(230, 178 * e.threat);
        const perpX = Math.cos(a) * 6;
        const perpY = -Math.sin(a) * 6;
        for (const s of [-1, 1]) {
          shots.push({
            x: e.x + Math.sin(a) * 16 + perpX * s,
            y: e.y + Math.cos(a) * 16 + perpY * s,
            r: 4.1,
            vx: Math.sin(a) * spd,
            vy: Math.cos(a) * spd,
            hostile: true,
            color: '#ff9d5c',
          });
        }
        sound.effect('raider');
        e.burstLeft = (e.burstLeft ?? 2) - 1;
        if (e.burstLeft > 0) {
          e.fireIn = 0.22;
        } else {
          e.burstLeft = 3;
          e.fireIn = Math.max(1.5, 2.05 / e.threat);
        }
      }
    }
    return;
  }

  if (e.kind === 'orbiter') {
    // Drops to mid-field, spins rapidly, fires rotating 4-point cross volleys!
    const holdY = h * (e.holdY || 0.25);
    const arrival = Math.max(0, Math.min(e.cruise, (holdY - e.y) * 2.4));
    e.vy += ((e.age < 7.4 ? arrival : e.cruise * 1.45) - e.vy) * (1 - Math.exp(-dt * 4));
    e.vx = e.dir * Math.sin(e.age * 1.5) * 46;
    e.x = Math.max(e.r + 14, Math.min(w - e.r - 14, e.x + e.vx * dt));
    e.y += e.vy * dt;
    if (e.y > 20 && e.age < 6.8) {
      e.fireIn -= dt;
      if (e.fireIn <= 0) {
        const baseA = e.age * 2.1;
        const spd = Math.min(210, 152 * e.threat);
        for (let i = 0; i < 4; i++) {
          const a = baseA + (i * Math.PI) / 2;
          shots.push({
            x: e.x + Math.sin(a) * 10,
            y: e.y + Math.cos(a) * 10,
            r: 4.1,
            vx: Math.sin(a) * spd,
            vy: Math.cos(a) * spd,
            hostile: true,
            color: '#7ef2e6',
          });
        }
        sound.effect('volley');
        e.fireIn = Math.max(1.05, 1.5 / e.threat);
      }
    }
    return;
  }

  if (e.kind === 'bomber') {
    // Armored siege twin-boom bomber firing slow Cluster Shells that burst mid-flight into 6 sub-shots!
    e.vx = e.dir * Math.sin(e.age * 0.9) * 38;
    const holdY = h * 0.2;
    const arrival = Math.max(0, Math.min(e.cruise, (holdY - e.y) * 2.1));
    e.vy += ((e.age < 7.8 ? arrival : e.cruise * 1.35) - e.vy) * (1 - Math.exp(-dt * 3.8));
    e.x = Math.max(e.r + 16, Math.min(w - e.r - 16, e.x + e.vx * dt));
    e.y += e.vy * dt;
    e.tilt = -Math.atan2(e.vx, 220) * 0.35;
    if (e.y > 20 && e.age < 7.0) {
      e.fireIn -= dt;
      if (e.fireIn <= 0) {
        const aim = Math.atan2(player.x - e.x, Math.max(80, player.y - e.y)) * 0.55;
        const spd = Math.min(185, 138 * e.threat);
        const vx = Math.sin(aim) * spd;
        const vy = Math.cos(aim) * spd;
        shots.push({
          x: e.x,
          y: e.y + 16,
          r: 7.2,
          vx,
          vy,
          hostile: true,
          cluster: true,
          clusterFuse: 1.32,
          clusterMaxFuse: 1.32,
          clusterAngle: Math.atan2(vx, vy),
          clusterCount: wv >= 6 ? 7 : 6,
          color: '#ffb45c',
        });
        sound.effect('cluster');
        e.fireIn = Math.max(1.75, 2.35 / e.threat);
      }
    }
    return;
  }

  if (e.kind === 'phantom') {
    // Phase-blinking stealth striker: telegraphs destination for 0.45s, teleports, then fires 3-bolt fan!
    if (e.blinkTelegraph > 0) {
      e.blinkTelegraph -= dt;
      e.vx *= Math.exp(-dt * 10);
      e.vy *= Math.exp(-dt * 10);
      if (e.blinkTelegraph <= 0) {
        e.x = e.blinkTargetX ?? e.x;
        e.y = e.blinkTargetY ?? e.y;
        e.blinkTargetX = undefined;
        e.blinkTargetY = undefined;
        sound.effect('blink');
        // Snap-fire 3-bolt fan immediately on materializing!
        const aim = Math.atan2(player.x - e.x, Math.max(60, player.y - e.y));
        const spd = Math.min(235, 182 * e.threat);
        for (const off of [-0.18, 0, 0.18]) {
          shots.push({
            x: e.x,
            y: e.y + 10,
            r: 4.1,
            vx: Math.sin(aim + off) * spd,
            vy: Math.cos(aim + off) * spd,
            hostile: true,
            color: '#cfa6ff',
          });
        }
        e.blinkCd = Math.max(1.9, 2.6 / e.threat);
      }
      return;
    }

    e.vx = e.dir * Math.sin(e.age * 1.9) * 58;
    e.vy = e.cruise * (e.y < h * 0.26 ? 0.95 : 0.48);
    e.x = Math.max(e.r + 14, Math.min(w - e.r - 14, e.x + e.vx * dt));
    e.y += e.vy * dt;
    e.tilt = -Math.atan2(e.vx, 200) * 0.45;
    if (e.y > 28 && e.y < player.y - 110 && e.age < 7.2) {
      e.blinkCd -= dt;
      if (e.blinkCd <= 0) {
        // Pick a fresh horizontal lane across the upper arena
        const shift = (e.x < w * 0.5 ? 1 : -1) * (w * (0.24 + Math.random() * 0.24));
        e.blinkTargetX = Math.max(28, Math.min(w - 28, e.x + shift));
        e.blinkTargetY = Math.max(42, Math.min(h * 0.44, e.y + 24));
        e.blinkTelegraph = 0.45;
      }
    }
    return;
  }

  if (e.kind === 'healer') {
    // Support Repair Drone: orbits upper-mid field and channels strong emerald repair beams into up to 2 nearby allies!
    const holdY = h * (e.holdY || 0.22);
    const arrival = Math.max(0, Math.min(e.cruise, (holdY - e.y) * 2.2));
    e.vy += ((e.age < 10.5 ? arrival : e.cruise * 1.4) - e.vy) * (1 - Math.exp(-dt * 4));
    e.vx = e.dir * Math.sin(e.age * 1.2) * 54;
    e.x = Math.max(e.r + 16, Math.min(w - e.r - 16, e.x + e.vx * dt));
    e.y += e.vy * dt;
    e.tilt = Math.sin(e.age * 2.2) * 0.14;

    // Find up to 2 closest live wounded allies within 380px (or nearest live combat ally to stay tethered!)
    const candidates = [];
    for (const ally of enemies) {
      if (ally === e || ally.dead || ally.kind === 'rock' || ally.kind === 'mine' || ally.kind === 'healer' || ally.kind === 'boss') continue;
      const d = Math.hypot(ally.x - e.x, ally.y - e.y);
      if (d < 380) {
        candidates.push({ ally, d, missing: ally.maxHp - ally.hp });
      }
    }
    candidates.sort((a, b) => (b.missing > 0) - (a.missing > 0) || a.d - b.d);
    const linked = candidates.slice(0, 2).map((c) => c.ally);
    e.healTargets = linked;
    e.healTarget = linked[0] || null;

    // Strong percentage-based continuous heal (~24% maxHp/sec) + periodic +14% burst mend pulse!
    e.healPulseIn = (e.healPulseIn ?? 1.4) - dt;
    const doBurst = e.healPulseIn <= 0;
    if (doBurst) e.healPulseIn = 1.65;
    for (const ally of linked) {
      if (ally.hp < ally.maxHp) {
        const steadyHeal = Math.max(4.5, ally.maxHp * 0.24) * dt;
        const burstHeal = doBurst ? Math.max(3, ally.maxHp * 0.14) : 0;
        ally.hp = Math.min(ally.maxHp, ally.hp + steadyHeal + burstHeal);
        if (doBurst) ally.healFlash = 0.28;
      }
    }
    if (e.y > 20 && e.age < 9.5) {
      e.fireIn -= dt;
      if (e.fireIn <= 0) {
        const aim = Math.atan2(player.x - e.x, Math.max(80, player.y - e.y));
        const spd = Math.min(190, 148 * e.threat);
        shots.push({
          x: e.x,
          y: e.y + 12,
          r: 4,
          vx: Math.sin(aim) * spd,
          vy: Math.cos(aim) * spd,
          hostile: true,
          color: '#7ef2a8',
        });
        sound.effect('raider');
        e.fireIn = Math.max(1.8, 2.35 / e.threat);
      }
    }
    return;
  }

  if (e.kind === 'vanguard') {
    // Advances slowly behind its frontal energy barrier, firing twin side plasma bolts
    e.vx = e.dir * Math.sin(e.age * 0.9) * 32;
    e.vy = e.cruise * (e.y < h * 0.28 ? 1 : 0.72);
    e.x = Math.max(e.r + 14, Math.min(w - e.r - 14, e.x + e.vx * dt));
    e.y += e.vy * dt;
    e.tilt = 0; // Keeps frontal shield pointed straight down!
    if (e.y > 16 && e.y < player.y - 70) {
      e.fireIn -= dt;
      if (e.fireIn <= 0) {
        for (const ox of [-15, 15]) {
          const aim = Math.atan2(player.x - (e.x + ox), Math.max(80, player.y - e.y)) * 0.45;
          shots.push({
            x: e.x + ox,
            y: e.y + 12,
            r: 4.3,
            vx: Math.sin(aim) * Math.min(210, 156 * e.threat),
            vy: Math.cos(aim) * Math.min(210, 156 * e.threat),
            hostile: true,
            color: '#7ef2e6',
          });
        }
        sound.effect('raider');
        e.fireIn = Math.max(1.3, 1.9 / e.threat);
      }
    }
    return;
  }

  if (e.kind === 'swarmpod') {
    e.vx = e.dir * Math.sin(e.age * 1.4) * 38;
    e.vy = e.cruise * (e.y < h * 0.25 ? 0.95 : 0.45);
    e.x = Math.max(e.r + 14, Math.min(w - e.r - 14, e.x + e.vx * dt));
    e.y += e.vy * dt;
    e.tilt = Math.sin(e.age * 2.6) * 0.14;
    if (e.y > 24 && e.hatchIn > 0) {
      e.hatchIn -= dt;
      if (e.hatchIn <= 0) {
        e.dead = true;
        sound.effect('volley');
        for (let i = 0; i < 4; i++) {
          const ang = ((i - 1.5) / 1.5) * 0.8;
          enemies.push(
            createEnemy('swarmer', e.x + Math.sin(ang) * 14, e.y + Math.cos(ang) * 10, wv, {
              dir: i % 2 ? 1 : -1,
              vx: Math.sin(ang) * 140,
              vy: 145,
            }),
          );
        }
      }
    }
    return;
  }

  if (e.kind === 'swarmer') {
    const chase = Math.max(-135, Math.min(135, (player.x - e.x) * 1.15)) + Math.sin(e.age * 8 + e.dir) * 58;
    e.vx += (chase - e.vx) * (1 - Math.exp(-dt * 4));
    e.vy = e.cruise;
    e.x = Math.max(e.r + 8, Math.min(w - e.r - 8, e.x + e.vx * dt));
    e.y += e.vy * dt;
    e.tilt = -Math.atan2(e.vx, e.vy) * 0.7;
    return;
  }

  if (e.kind === 'sniper') {
    const holdY = h * (e.holdY || 0.17);
    const arrival = Math.max(0, Math.min(e.cruise, (holdY - e.y) * 2.5));
    e.vy += ((e.age < 7.2 ? arrival : e.cruise * 1.5) - e.vy) * (1 - Math.exp(-dt * 4.5));
    e.vx = e.aimLock > 0 ? e.vx * Math.exp(-dt * 9) : e.dir * Math.sin(e.age * 1.1) * 34;
    e.x = Math.max(e.r + 14, Math.min(w - e.r - 14, e.x + e.vx * dt));
    e.y += e.vy * dt;

    if (e.aimLock > 0) {
      e.aimLock -= dt;
      e.tilt = -e.aimAngle;
      if (e.aimLock <= 0) {
        const spd = Math.min(470, 390 * e.threat);
        shots.push({
          x: e.x,
          y: e.y + 12,
          r: 4.4,
          vx: Math.sin(e.aimAngle) * spd,
          vy: Math.cos(e.aimAngle) * spd,
          hostile: true,
          color: '#ff4d5e',
        });
        sound.effect('dash');
        e.fireIn = Math.max(1.85, 2.5 / e.threat);
      }
      return;
    }

    const desired = Math.max(-0.85, Math.min(0.85, Math.atan2(player.x - e.x, Math.max(70, player.y - e.y))));
    e.aimAngle = (e.aimAngle || 0) + (desired - (e.aimAngle || 0)) * (1 - Math.exp(-dt * 6));
    e.tilt = -e.aimAngle;
    if (e.y > 20 && e.age < 6.4) {
      e.fireIn -= dt;
      if (e.fireIn <= 0) {
        e.aimLock = 0.55;
        sound.effect('sniperLock');
      }
    }
    return;
  }

  if (e.tethered) {
    // Laser-linked tether anchor drones descend in tight formation with gentle synchronized sway
    if (e.y > 0 && e.tetherWarmup > 0) e.tetherWarmup = Math.max(0, e.tetherWarmup - dt);
    e.vx = e.dir * Math.sin(e.age * 1.15) * Math.min(62, w * 0.1);
    e.vy = e.cruise;
    e.x = Math.max(e.r + 12, Math.min(w - e.r - 12, e.x + e.vx * dt));
    e.y += e.vy * dt;
    e.tilt = -Math.atan2(e.vx, 220) * 0.3;
    return;
  }

  if (e.kind === 'mine') {
    e.y += e.vy * dt;
    e.x = Math.max(e.r + 10, Math.min(w - e.r - 10, e.x + (Math.sin(e.age * 2.5 + e.angle) * 14 + ionWind * 0.7) * dt));
    e.fuse -= dt;
    if (e.fuse <= 0) {
      e.dead = true;
      const petals = 6;
      const spd = Math.min(205, 145 * e.threat);
      for (let i = 0; i < petals; i++) {
        const a = (i / petals) * Math.PI * 2 + e.angle;
        shots.push({
          x: e.x,
          y: e.y,
          r: 4,
          vx: Math.sin(a) * spd,
          vy: Math.cos(a) * spd,
          hostile: true,
          color: '#ff9661',
        });
      }
      sound.effect('volley');
    }
    return;
  }

  if (e.kind === 'lancer' && (e.locked || e.y > h * 0.14)) {
    if (!e.locked) {
      e.locked = true;
      e.fireIn = Math.max(0.62, 0.8 - Math.min(0.18, (wv - 1) * 0.02));
      e.aim = Math.max(-1.02, Math.min(1.02, Math.atan2(player.x - e.x, Math.max(45, player.y - e.y))));
    }
    const previous = e.fireIn;
    e.fireIn -= dt;
    const diving = e.fireIn <= 0;
    if (diving && previous > 0) sound.effect('dash');
    const target = diving ? Math.min(480, 390 * e.threat) : 0;
    const blend = -Math.expm1(-dt * (diving ? 11 : 16));
    e.vx += (Math.sin(e.aim) * target - e.vx) * blend;
    e.vy += (Math.cos(e.aim) * target - e.vy) * blend;
    e.tilt = (e.tilt || 0) + (-e.aim - (e.tilt || 0)) * (1 - Math.exp(-dt * 12));
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    if (diving) {
      e.trail.push({ x: e.x, y: e.y, tilt: e.tilt, life: 0.22 });
      if (e.trail.length > 7) e.trail.shift();
    }
    return;
  }

  if (e.kind === 'prism') {
    const holdY = h * (e.holdY || 0.2);
    const arrival = Math.max(0, Math.min(e.cruise, (holdY - e.y) * 2.4));
    e.vy += ((e.age < 7.5 ? arrival : e.cruise * 1.45) - e.vy) * (1 - Math.exp(-dt * 4));
    e.vx = e.beamActive > 0 || e.beamWarn > 0 ? e.vx * Math.exp(-dt * 8) : e.dir * Math.sin(e.age * 1.3) * 38;
    e.x = Math.max(e.r + 12, Math.min(w - e.r - 12, e.x + e.vx * dt));
    e.y += e.vy * dt;
    e.tilt = e.beamActive > 0 ? e.beamAngle : e.tilt * 0.92;

    if (e.beamActive > 0) {
      e.beamActive = Math.max(0, e.beamActive - dt);
      return;
    }
    if (e.beamWarn > 0) {
      e.beamWarn -= dt;
      if (e.beamWarn <= 0) {
        e.beamActive = 0.56;
        sound.effect('beam');
      }
      return;
    }
    if (e.y > 25 && e.age < 6.8) {
      e.fireIn -= dt;
      if (e.fireIn <= 0) {
        e.beamAngle = -Math.max(-0.5, Math.min(0.5, Math.atan2(player.x - e.x, Math.max(120, player.y - e.y))));
        e.beamWarn = 0.88;
        e.fireIn = Math.max(2.0, 2.75 / e.threat);
      }
    }
    return;
  }

  if (e.kind === 'minelayer') {
    e.vx = e.dir * Math.min(124, w * 0.22);
    e.vy = e.cruise * (e.y < h * 0.24 ? 0.7 : 0.4);
    e.x += e.vx * dt;
    if (e.x < e.r + 18) {
      e.x = e.r + 18;
      e.dir = 1;
    } else if (e.x > w - e.r - 18) {
      e.x = w - e.r - 18;
      e.dir = -1;
    }
    e.y += e.vy * dt;
    e.tilt = -Math.atan2(e.vx, 180) * 0.42;
    if (e.y > 18 && e.y < h * 0.74) {
      e.fireIn -= dt;
      const activeMines = enemies.filter((m) => m.kind === 'mine' && !m.dead).length;
      if (e.fireIn <= 0 && activeMines < 5) {
        enemies.push(createEnemy('mine', e.x, e.y + 12, wv, { threat: e.threat }));
        sound.effect('raider');
        e.fireIn = Math.max(0.95, 1.25 / e.threat);
      }
    }
    return;
  }

  if (e.kind === 'courier') {
    e.vx = e.dir * Math.min(96, w * 0.17);
    e.vy = e.cruise * (e.y < h * 0.22 ? 1.15 : 0.58);
    e.x += e.vx * dt;
    if (e.x < e.r + 20) e.dir = 1;
    if (e.x > w - e.r - 20) e.dir = -1;
    e.y += e.vy * dt;
    e.tilt = Math.sin(e.age * 2.4) * 0.12;
    return;
  }

  if (e.kind === 'rock') {
    e.angle += e.spin * dt;
    if (ionWind) e.vx += (ionWind * 0.55 - e.vx) * (1 - Math.exp(-dt * 1.4));
  } else {
    if (e.kind === 'kite') e.vx = e.dir * Math.cos(e.age * 2.05) * Math.min(150, w * 0.34);
    if (e.kind === 'raider') {
      // Smarter lateral flanking instead of mindless clumping
      const leadTarget = player.x + (e.dir || 1) * 55;
      e.vx += (Math.max(-92, Math.min(92, (leadTarget - e.x) * 0.72)) - e.vx) * (1 - Math.exp(-dt * 2.2));
    }
    if (e.kind === 'gunship') {
      e.vx = e.dir * Math.sin(e.age * 1.25) * 42;
      const arrival = Math.max(0, Math.min(e.cruise, (h * 0.19 - e.y) * 2.2));
      e.vy += ((e.age < 6.5 ? arrival : e.cruise * 1.45) - e.vy) * (1 - Math.exp(-dt * 4));
    }
    const bank = -Math.atan2(e.vx, Math.max(75, e.vy)) * 0.58;
    e.tilt = (e.tilt || 0) + (bank - (e.tilt || 0)) * (1 - Math.exp(-dt * 7));

    if (e.y > 0 && e.y < player.y - 60) {
      e.fireIn -= dt;
      if (!e.locked && e.fireIn <= 0.6) {
        e.aim = e.kind === 'gunship' ? 0 : Math.atan2(player.x - e.x, player.y - e.y);
        e.locked = true;
      }
      if (e.fireIn <= 0) {
        let spread;
        if (e.kind === 'gunship') {
          spread = wv >= 5 ? [-0.6, -0.36, -0.12, 0.12, 0.36, 0.6] : [-0.54, -0.27, 0, 0.27, 0.54];
        } else if (e.kind === 'kite') {
          spread = [-0.14, 0.14];
        } else {
          spread = wv >= 5 ? [-0.09, 0.09] : [0];
        }
        const spd = Math.min(238, (e.kind === 'gunship' ? 142 : 176) * e.threat);
        for (const offset of spread) {
          const aim = e.aim + offset;
          shots.push({
            x: e.x,
            y: e.y + e.r * 0.65,
            r: 4.2,
            vx: Math.sin(aim) * spd,
            vy: Math.cos(aim) * spd,
            hostile: true,
          });
        }
        sound.effect(e.kind === 'gunship' ? 'volley' : 'raider');
        e.fireIn = Math.max(0.95, 0.65 + (e.kind === 'gunship' ? 1.65 : 1.95) / e.threat);
        e.locked = false;
      }
    } else if (e.locked) {
      e.locked = false;
      e.fireIn = 0.7;
    }
  }

  e.x = Math.max(e.r, Math.min(w - e.r, e.x + e.vx * dt));
  e.y += e.vy * dt;
}
