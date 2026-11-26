// Escalating wave choreography, scaling enemy HP/firepower, prism beams, fracturing rocks, and armored minelayers.
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

const phrases = [
  ['vanguard', 'kites', 'rocks', 'lancers', 'courier', 'battery'],
  ['kites', 'prismPair', 'mineline', 'lancers', 'courier', 'battery'],
  ['vanguard', 'prismPair', 'mineline', 'pincer', 'courier', 'fortress'],
  ['pincer', 'prismTriple', 'doubleMines', 'lancers', 'courier', 'fortress'],
  ['stormFront', 'prismTriple', 'doubleMines', 'pincer', 'courier', 'armada'],
];

export const waveLength = 14;

export function createEnemy(kind, x, y, wave, overrides = {}) {
  const tier = Math.max(0, wave - 1);
  // Progressive difficulty scaling across waves (stays fair & dodgeable, never flat!)
  const speed = 1 + Math.min(0.95, tier * 0.085);
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
    raider: 104,
    kite: 132,
    lancer: 108,
    gunship: 68,
    prism: 76,
    minelayer: 64,
    courier: 74,
    mine: 38,
  };
  // Armor scales steadily on tougher waves so higher sectors demand upgrades & Focus Lance!
  const hpMap = {
    rock: 2 + Math.floor(tier / 3),
    raider: tier >= 4 ? 2 : 1,
    kite: tier >= 5 ? 2 : 1,
    lancer: 2 + Math.floor(tier / 3),
    gunship: 6 + Math.floor(tier * 1.4),
    prism: 4 + Math.floor(tier * 1.1),
    minelayer: 11 + Math.floor(tier * 1.8),
    courier: 5 + Math.floor(tier * 0.8),
    mine: 2 + (tier >= 5 ? 1 : 0),
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
  const hp = overrides.hp ?? hpMap[kind] ?? 1;
  const cruise = (overrides.cruise ?? cruiseMap[kind] ?? 95) * speed;

  return {
    kind,
    r,
    x,
    y,
    vx: kind === 'rock' ? (Math.random() - 0.5) * 40 : 0,
    vy: cruise,
    cruise,
    dir: 1,
    threat: speed,
    wave,
    age: 0,
    fireIn: kind === 'kite' ? 1.1 : kind === 'prism' ? 1.35 : kind === 'minelayer' ? 0.65 : 1.25,
    aim: 0,
    locked: false,
    flash: 0,
    hp,
    maxHp: hp,
    points: Math.round((scores[kind] || 40) * (1 + tier * 0.12)),
    shards: shardMap[kind] || 2,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 1.8,
    split: kind === 'rock' && r >= 20,
    beamWarn: 0,
    beamActive: 0,
    beamAngle: 0,
    fuse: kind === 'mine' ? Math.max(2.9, 4.3 - tier * 0.15) : 0,
    trail: [],
    ...overrides,
  };
}

export function spawnFormation(enemies, w, wave, beat, playerX) {
  const bankIdx = Math.min(phrases.length - 1, Math.floor((wave - 1) / 2));
  const kind = phrases[bankIdx][beat % 6];
  const center = Math.max(0.18, Math.min(0.82, (playerX / w) * 0.45 + 0.14 + Math.random() * 0.42));
  const side = Math.random() < 0.5 ? 1 : -1;

  function add(type, lane, delay = 0, dir = side, extra = {}) {
    const r = extra.r ?? { rock: 22, raider: 16, kite: 14, lancer: 15, gunship: 24, prism: 18, minelayer: 22, courier: 20 }[type] ?? 16;
    const x = Math.max(r + 8, Math.min(w - r - 8, lane * w));
    const y = -r - 8 - delay * 95;
    enemies.push(createEnemy(type, x, y, wave, { dir, ...extra }));
  }

  if (kind === 'vanguard') {
    add('raider', center, 0);
    add('raider', center - 0.14, 0.32);
    add('raider', center + 0.14, 0.32);
    if (wave >= 3) add('kite', 1 - center, 0.7, -side);
    if (wave >= 5) add('lancer', center, 0.95);
  } else if (kind === 'kites') {
    add('kite', 0.22, 0, 1);
    add('kite', 0.78, 0.2, -1);
    add('kite', 0.5, 0.55, side);
    if (wave >= 2) add('raider', center, 0.85);
    if (wave >= 5) add('kite', 1 - center, 1.05, -side);
  } else if (kind === 'rocks') {
    add('rock', center - 0.22, 0, 1, { r: 24 });
    add('rock', center + 0.18, 0.35, -1, { r: 23 });
    add('raider', center, 0.52);
    add('rock', 1 - center, 0.9, 1, { r: 17, hp: 1, split: false });
  } else if (kind === 'lancers') {
    add('lancer', Math.max(0.14, center - 0.17), 0);
    add('lancer', Math.min(0.86, center + 0.17), 0.38);
    if (wave >= 3) add('lancer', 0.5, 0.75);
    if (wave >= 2) add('raider', 1 - center, 0.9);
  } else if (kind === 'prismPair') {
    add('prism', 0.24, 0, 1, { holdY: 0.18 });
    add('prism', 0.76, 0.32, -1, { holdY: 0.22 });
    add('raider', 0.5, 0.65);
  } else if (kind === 'prismTriple') {
    add('prism', 0.18, 0, 1, { holdY: 0.17 });
    add('prism', 0.5, 0.28, side, { holdY: 0.14 });
    add('prism', 0.82, 0.52, -1, { holdY: 0.2 });
    add('kite', center, 0.85, -side);
  } else if (kind === 'mineline') {
    add('minelayer', side > 0 ? 0.18 : 0.82, 0, side);
    add('kite', side > 0 ? 0.78 : 0.22, 0.4, -side);
    if (wave >= 3) add('lancer', center, 0.82);
  } else if (kind === 'doubleMines') {
    add('minelayer', 0.2, 0, 1);
    add('minelayer', 0.8, 0.45, -1);
    add('raider', 0.5, 0.85);
  } else if (kind === 'pincer') {
    add('raider', 0.15, 0, 1);
    add('raider', 0.85, 0, -1);
    add('lancer', 0.32, 0.4, 1);
    add('lancer', 0.68, 0.4, -1);
    add('kite', 0.5, 0.78, side);
  } else if (kind === 'courier') {
    const startLane = side > 0 ? 0.22 : 0.78;
    add('courier', startLane, 0, side);
    add('raider', Math.max(0.12, startLane - 0.1), 0.24, side);
    add('raider', Math.min(0.88, startLane + 0.1), 0.24, side);
    if (wave >= 4) add('lancer', 1 - startLane, 0.65, -side);
  } else if (kind === 'battery') {
    add('gunship', center, 0, side);
    add('raider', Math.max(0.12, center - 0.2), 0.42, 1);
    add('raider', Math.min(0.88, center + 0.2), 0.42, -1);
  } else if (kind === 'fortress') {
    add('gunship', 0.3, 0, 1);
    add('gunship', 0.7, 0.3, -1);
    add('prism', 0.5, 0.72, side, { holdY: 0.15 });
  } else if (kind === 'stormFront') {
    add('gunship', 0.5, 0, side);
    add('lancer', 0.18, 0.3, 1);
    add('lancer', 0.82, 0.3, -1);
    add('kite', 0.35, 0.7, 1);
    add('kite', 0.65, 0.7, -1);
  } else if (kind === 'armada') {
    add('gunship', 0.25, 0, 1);
    add('gunship', 0.75, 0.25, -1);
    add('minelayer', 0.5, 0.5, side);
    add('prism', 0.16, 0.85, 1, { holdY: 0.2 });
    add('prism', 0.84, 0.85, -1, { holdY: 0.2 });
  }

  // Escalating reinforcements on Wave 4+
  if (wave >= 4 && beat % 2 === 1) {
    add(wave >= 6 ? 'lancer' : 'raider', 1 - center, 1.05, -side);
  }
  if (kind !== 'rocks' && (wave > 1 || w > 660)) {
    add('rock', center > 0.5 ? 0.12 : 0.88, 0.9, side, { r: 16 + Math.random() * 8 });
  }
}

export function flyEnemy(e, dt, w, h, player, shots, sound, enemies) {
  e.age += dt;
  e.flash = Math.max(0, e.flash - dt);
  const wv = e.wave || 1;

  // Proximity mine behavior (more shrapnel petals at higher waves!)
  if (e.kind === 'mine') {
    e.y += e.vy * dt;
    e.x += Math.sin(e.age * 2.5 + e.angle) * 14 * dt;
    e.fuse -= dt;
    if (e.fuse <= 0) {
      e.dead = true;
      const petals = wv >= 5 ? 8 : 6;
      const spd = Math.min(240, 148 * e.threat);
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
      e.fireIn = Math.max(0.54, 0.76 - (wv - 1) * 0.03);
      e.aim = Math.max(-1.05, Math.min(1.05, Math.atan2(player.x - e.x, Math.max(45, player.y - e.y))));
    }
    const previous = e.fireIn;
    e.fireIn -= dt;
    const diving = e.fireIn <= 0;
    if (diving && previous > 0) sound.effect('dash');
    const target = diving ? Math.min(540, 410 * e.threat) : 0;
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
        e.beamActive = 0.6;
        sound.effect('beam');
      }
      return;
    }
    if (e.y > 25 && e.age < 6.8) {
      e.fireIn -= dt;
      if (e.fireIn <= 0) {
        e.beamAngle = Math.max(-0.55, Math.min(0.55, Math.atan2(player.x - e.x, Math.max(120, player.y - e.y))));
        e.beamWarn = Math.max(0.68, 0.9 - (wv - 1) * 0.03);
        e.fireIn = Math.max(1.5, 2.5 / e.threat);
      }
    }
    return;
  }

  // Minelayer armored sweep — lingers longer and lays dense proximity minefields
  if (e.kind === 'minelayer') {
    e.vx = e.dir * Math.min(126, w * 0.22);
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
    if (e.y > 18 && e.y < h * 0.75) {
      e.fireIn -= dt;
      if (e.fireIn <= 0) {
        enemies.push(createEnemy('mine', e.x, e.y + 12, wv, { threat: e.threat }));
        sound.effect('raider');
        e.fireIn = Math.max(0.68, 1.05 / e.threat);
      }
    }
    return;
  }

  // Supply courier sweeps across upper-mid field
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
  } else {
    if (e.kind === 'kite') e.vx = e.dir * Math.cos(e.age * 2.1) * Math.min(155, w * 0.35);
    if (e.kind === 'raider') {
      e.vx += (Math.max(-92, Math.min(92, (player.x - e.x) * 0.72)) - e.vx) * (1 - Math.exp(-dt * 2.3));
    }
    if (e.kind === 'gunship') {
      e.vx = e.dir * Math.sin(e.age * 1.3) * 42;
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
        let spread;
        if (e.kind === 'gunship') {
          spread = wv >= 4 ? [-0.66, -0.44, -0.22, 0, 0.22, 0.44, 0.66] : [-0.56, -0.28, 0, 0.28, 0.56];
        } else if (e.kind === 'kite') {
          spread = wv >= 5 ? [-0.22, 0, 0.22] : [-0.14, 0.14];
        } else {
          spread = wv >= 4 ? [-0.1, 0.1] : [0];
        }
        const spd = Math.min(280, (e.kind === 'gunship' ? 146 : 182) * e.threat);
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
        e.fireIn = Math.max(0.55, 0.52 + (e.kind === 'gunship' ? 1.4 : 1.75) / e.threat);
        e.locked = false;
      }
    } else if (e.locked) {
      e.locked = false;
      e.fireIn = 0.65;
    }
  }

  e.x = Math.max(e.r, Math.min(w - e.r, e.x + e.vx * dt));
  e.y += e.vy * dt;
}
