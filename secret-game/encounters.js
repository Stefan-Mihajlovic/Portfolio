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
  mine: 25,
};

export const waveNames = [
  'ORBITAL ENTRY',
  'VANGUARD SWEEP',
  'PRISM CORRIDOR',
  'CALDERA DRIFT',
  'IRON PHALANX',
  'ECLIPSE INTERCEPT',
  'SOLAR OVERDRIVE',
  'DEEP VOID GAUNTLET',
];

// Clean, readable choreographed encounters (never overlapping random soup)
const phrases = [
  ['echelon', 'crossWeave', 'rocks', 'sniperRun', 'courier', 'anchorBattery'],
  ['crossWeave', 'prismCorridor', 'mineSweep', 'sniperRun', 'courier', 'anchorBattery'],
  ['echelon', 'prismCorridor', 'mineSweep', 'pincerStrike', 'courier', 'shieldWall'],
  ['pincerStrike', 'prismCorridor', 'mineSweep', 'sniperRun', 'courier', 'shieldWall'],
];

export const waveLength = 15.5;

export function createEnemy(kind, x, y, wave, overrides = {}) {
  const tier = Math.max(0, wave - 1);
  const overclock = Boolean(overrides.overclock);
  const sec = (overrides.sectorIndex || 0) % 4;
  // Asymptotic speed curve: climbs smoothly toward ~1.38x (+14% in Overclock, +7% in Eclipse Corona)
  const speed = (1 + 0.38 * (1 - Math.exp(-tier * 0.16))) * (overclock ? 1.14 : 1) * (sec === 3 ? 1.07 : 1);
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
    mine: 1,
  };
  const r = overrides.r ?? rMap[kind] ?? 16;
  const computedHp =
    kind === 'mine'
      ? baseHp.mine
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
    fireIn: overrides.fireIn ?? (kind === 'kite' ? 1.15 : kind === 'prism' ? 1.35 : kind === 'minelayer' ? 0.7 : 1.3),
    aim: 0,
    locked: false,
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
  const { overclock = false, sectorIndex = 0 } = opts;
  const bankIdx = Math.min(phrases.length - 1, Math.floor((wave - 1) / 2));
  const kind = phrases[bankIdx][beat % 6];
  const center = Math.max(0.2, Math.min(0.8, (playerX / w) * 0.4 + 0.18 + Math.random() * 0.36));
  const side = Math.random() < 0.5 ? 1 : -1;

  function add(type, lane, delay = 0, dir = side, extra = {}) {
    const r = extra.r ?? { rock: 22, raider: 16, kite: 14, lancer: 15, gunship: 24, prism: 18, minelayer: 22, courier: 20 }[type] ?? 16;
    const x = Math.max(r + 12, Math.min(w - r - 12, lane * w));
    const y = -r - 10 - delay * 95;
    enemies.push(
      createEnemy(type, x, y, wave, {
        dir,
        overclock,
        sectorIndex,
        molten: type === 'rock' && sectorIndex % 4 === 1,
        ...extra,
      }),
    );
  }

  if (kind === 'echelon') {
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
    // One armored minelayer sweeping across mid-field with 2 agile wingmen
    add('minelayer', side > 0 ? 0.18 : 0.82, 0, side);
    add('raider', side > 0 ? 0.78 : 0.22, 0.45, -side, { fireIn: 1.5 });
    if (wave >= 4) add('kite', 0.5, 0.9, side, { fireIn: 1.8 });
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
  }

  // Light ambient asteroid only if field isn't cluttered
  if (kind !== 'rocks' && enemies.length < 5 && (wave > 1 || w > 720)) {
    add('rock', center > 0.5 ? 0.12 : 0.88, 0.95, side, { r: 16 + Math.random() * 7 });
  }
}

export function flyEnemy(e, dt, w, h, player, shots, sound, enemies, ionWind = 0) {
  e.age += dt;
  e.flash = Math.max(0, e.flash - dt);
  const wv = e.wave || 1;

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
        e.beamAngle = Math.max(-0.5, Math.min(0.5, Math.atan2(player.x - e.x, Math.max(120, player.y - e.y))));
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
