// Authored wave choreography, enemy AI, prism beams, fracturing rocks, and proximity mines.
const scores = {
  rock: 15,
  raider: 45,
  kite: 60,
  lancer: 80,
  gunship: 140,
  prism: 160,
  minelayer: 150,
  courier: 200,
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

const phrases = [
  ['vanguard', 'kites', 'rocks', 'lancers', 'courier', 'battery'],
  ['kites', 'prismPair', 'mineline', 'lancers', 'courier', 'battery'],
  ['vanguard', 'prismPair', 'mineline', 'pincer', 'courier', 'fortress'],
  ['pincer', 'prismPair', 'mineline', 'lancers', 'courier', 'fortress'],
];

export const waveLength = 14.5;

export function createEnemy(kind, x, y, wave, overrides = {}) {
  const speed = 1 + Math.log2(Math.max(1, wave)) * 0.15;
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
    rock: 88,
    raider: 102,
    kite: 130,
    lancer: 105,
    gunship: 66,
    prism: 74,
    minelayer: 64,
    courier: 72,
    mine: 36,
  };
  const hpMap = {
    rock: 2,
    raider: 1,
    kite: 1,
    lancer: 2,
    gunship: 6,
    prism: 4,
    minelayer: 5,
    courier: 5,
    mine: 2,
  };
  const shardMap = {
    rock: 1,
    raider: 2,
    kite: 2,
    lancer: 3,
    gunship: 5,
    prism: 5,
    minelayer: 4,
    courier: 6,
    mine: 1,
  };
  const r = overrides.r ?? rMap[kind] ?? 16;
  const hp = overrides.hp ?? hpMap[kind] ?? 1;
  const cruise = (overrides.cruise ?? cruiseMap[kind] ?? 95) * speed;

  return {
    kind,
    r,
    x,
    y,
    vx: kind === 'rock' ? (Math.random() - 0.5) * 38 : 0,
    vy: cruise,
    cruise,
    dir: 1,
    threat: speed,
    age: 0,
    fireIn: kind === 'kite' ? 1.15 : kind === 'prism' ? 1.45 : kind === 'minelayer' ? 1.1 : 1.35,
    aim: 0,
    locked: false,
    flash: 0,
    hp,
    maxHp: hp,
    points: scores[kind] || 40,
    shards: shardMap[kind] || 2,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 1.8,
    split: kind === 'rock' && r >= 20,
    beamWarn: 0,
    beamActive: 0,
    beamAngle: 0,
    fuse: kind === 'mine' ? 4.4 : 0,
    trail: [],
    ...overrides,
  };
}

export function spawnFormation(enemies, w, wave, beat, playerX) {
  const bank = phrases[Math.min(wave - 1, phrases.length - 1)];
  const kind = bank[beat % bank.length];
  const center = Math.max(0.18, Math.min(0.82, (playerX / w) * 0.45 + 0.14 + Math.random() * 0.42));
  const side = Math.random() < 0.5 ? 1 : -1;

  function add(type, lane, delay = 0, dir = side, extra = {}) {
    const r = extra.r ?? { rock: 22, raider: 16, kite: 14, lancer: 15, gunship: 24, prism: 18, minelayer: 22, courier: 20 }[type] ?? 16;
    const x = Math.max(r + 8, Math.min(w - r - 8, lane * w));
    const y = -r - 8 - delay * 95;
    enemies.push(createEnemy(type, x, y, wave, { dir, ...extra }));
  }

  if (kind === 'vanguard') {
    // Classic 3-ship V-echelon of raiders
    add('raider', center, 0);
    add('raider', center - 0.14, 0.35);
    add('raider', center + 0.14, 0.35);
    if (wave >= 3) add('kite', 1 - center, 0.75, -side);
  } else if (kind === 'kites') {
    add('kite', 0.24, 0, 1);
    add('kite', 0.76, 0.22, -1);
    add('kite', 0.5, 0.65, side);
    if (wave >= 2) add('raider', center, 0.9);
  } else if (kind === 'rocks') {
    add('rock', center - 0.22, 0, 1, { r: 24 });
    add('rock', center + 0.18, 0.38, -1, { r: 22 });
    add('raider', center, 0.55);
    add('rock', 1 - center, 0.95, 1, { r: 17, hp: 1, split: false });
  } else if (kind === 'lancers') {
    add('lancer', Math.max(0.15, center - 0.16), 0);
    add('lancer', Math.min(0.85, center + 0.16), 0.42);
    if (wave >= 2) add('raider', 0.5, 0.85);
  } else if (kind === 'prismPair') {
    add('prism', 0.24, 0, 1, { holdY: 0.18 });
    add('prism', 0.76, 0.35, -1, { holdY: 0.22 });
    add('raider', 0.5, 0.7);
  } else if (kind === 'mineline') {
    add('minelayer', side > 0 ? 0.18 : 0.82, 0, side);
    add('kite', side > 0 ? 0.78 : 0.22, 0.45, -side);
    if (wave >= 3) add('lancer', center, 0.85);
  } else if (kind === 'pincer') {
    add('raider', 0.16, 0, 1);
    add('raider', 0.84, 0, -1);
    add('lancer', 0.32, 0.45, 1);
    add('lancer', 0.68, 0.45, -1);
    add('kite', 0.5, 0.85, side);
  } else if (kind === 'courier') {
    // High-value tactical supply pod flanked by two raiders
    const startLane = side > 0 ? 0.22 : 0.78;
    add('courier', startLane, 0, side);
    add('raider', Math.max(0.12, startLane - 0.1), 0.25, side);
    add('raider', Math.min(0.88, startLane + 0.1), 0.25, side);
  } else if (kind === 'battery') {
    add('gunship', center, 0, side);
    add('raider', Math.max(0.12, center - 0.2), 0.45, 1);
    add('raider', Math.min(0.88, center + 0.2), 0.45, -1);
  } else if (kind === 'fortress') {
    add('gunship', 0.32, 0, 1);
    add('gunship', 0.68, 0.32, -1);
    add('prism', 0.5, 0.78, side, { holdY: 0.15 });
  }

  // Ambient orbital debris on wider arenas
  if (kind !== 'rocks' && (wave > 1 || w > 660)) {
    add('rock', center > 0.5 ? 0.12 : 0.88, 0.9, side, { r: 16 + Math.random() * 8 });
  }
}

export function flyEnemy(e, dt, w, h, player, shots, sound, enemies) {
  e.age += dt;
  e.flash = Math.max(0, e.flash - dt);

  // Proximity mine behavior
  if (e.kind === 'mine') {
    e.y += e.vy * dt;
    e.x += Math.sin(e.age * 2.5 + e.angle) * 14 * dt;
    e.fuse -= dt;
    if (e.fuse <= 0) {
      e.dead = true;
      const petals = 6;
      const spd = 148 * e.threat;
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

  // Lancer lock-on & hypersonic dive
  if (e.kind === 'lancer' && (e.locked || e.y > h * 0.14)) {
    if (!e.locked) {
      e.locked = true;
      e.fireIn = 0.76;
      e.aim = Math.max(-1.05, Math.min(1.05, Math.atan2(player.x - e.x, Math.max(45, player.y - e.y))));
    }
    const previous = e.fireIn;
    e.fireIn -= dt;
    const diving = e.fireIn <= 0;
    if (diving && previous > 0) sound.effect('dash');
    const target = diving ? 410 * e.threat : 0;
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

  // Prism beam-drone
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
        e.beamActive = 0.58;
        sound.effect('beam');
      }
      return;
    }
    if (e.y > 25 && e.age < 6.8) {
      e.fireIn -= dt;
      if (e.fireIn <= 0) {
        e.beamAngle = Math.max(-0.52, Math.min(0.52, Math.atan2(player.x - e.x, Math.max(120, player.y - e.y))));
        e.beamWarn = 0.9;
        e.fireIn = 2.6 / e.threat;
      }
    }
    return;
  }

  // Minelayer diagonal sweep
  if (e.kind === 'minelayer') {
    e.vx = e.dir * Math.min(110, w * 0.2);
    e.vy = e.cruise * 0.72;
    e.x += e.vx * dt;
    if (e.x < e.r + 16) {
      e.x = e.r + 16;
      e.dir = 1;
    } else if (e.x > w - e.r - 16) {
      e.x = w - e.r - 16;
      e.dir = -1;
    }
    e.y += e.vy * dt;
    e.tilt = -Math.atan2(e.vx, 160) * 0.5;
    if (e.y > 24 && e.y < h * 0.65) {
      e.fireIn -= dt;
      if (e.fireIn <= 0) {
        enemies.push(createEnemy('mine', e.x, e.y + 12, 1, { threat: e.threat }));
        sound.effect('raider');
        e.fireIn = 1.65 / e.threat;
      }
    }
    return;
  }

  // Supply courier sweeps across upper-mid field
  if (e.kind === 'courier') {
    e.vx = e.dir * Math.min(92, w * 0.16);
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
  } else {
    if (e.kind === 'kite') e.vx = e.dir * Math.cos(e.age * 2.05) * Math.min(145, w * 0.34);
    if (e.kind === 'raider') {
      e.vx += (Math.max(-82, Math.min(82, (player.x - e.x) * 0.7)) - e.vx) * (1 - Math.exp(-dt * 2.2));
    }
    if (e.kind === 'gunship') {
      e.vx = e.dir * Math.sin(e.age * 1.25) * 38;
      const arrival = Math.max(0, Math.min(e.cruise, (h * 0.19 - e.y) * 2.2));
      e.vy += ((e.age < 6.5 ? arrival : e.cruise * 1.45) - e.vy) * (1 - Math.exp(-dt * 4));
    }
    const bank = -Math.atan2(e.vx, Math.max(75, e.vy)) * 0.58;
    e.tilt = (e.tilt || 0) + (bank - (e.tilt || 0)) * (1 - Math.exp(-dt * 7));

    if (e.y > 0 && e.y < player.y - 55) {
      e.fireIn -= dt;
      if (!e.locked && e.fireIn <= 0.6) {
        e.aim = e.kind === 'gunship' ? 0 : Math.atan2(player.x - e.x, player.y - e.y);
        e.locked = true;
      }
      if (e.fireIn <= 0) {
        const spread =
          e.kind === 'gunship'
            ? [-0.56, -0.28, 0, 0.28, 0.56]
            : e.kind === 'kite'
              ? [-0.14, 0.14]
              : [0];
        for (const offset of spread) {
          const aim = e.aim + offset;
          const speed = (e.kind === 'gunship' ? 142 : 178) * e.threat;
          shots.push({
            x: e.x,
            y: e.y + e.r * 0.65,
            r: 4.2,
            vx: Math.sin(aim) * speed,
            vy: Math.cos(aim) * speed,
            hostile: true,
          });
        }
        sound.effect(e.kind === 'gunship' ? 'volley' : 'raider');
        e.fireIn = 0.58 + (e.kind === 'gunship' ? 1.48 : 1.85) / e.threat;
        e.locked = false;
      }
    } else if (e.locked) {
      e.locked = false;
      e.fireIn = 0.68;
    }
  }

  e.x = Math.max(e.r, Math.min(w - e.r, e.x + e.vx * dt));
  e.y += e.vy * dt;
}
