// Formations are paced in seconds so a phone sees the same phrases as a wide monitor.
const scores = { rock: 10, raider: 35, kite: 50, gunship: 100, lancer: 65 };
const phrases = [
  ['rocks', 'patrol', 'kites', 'lancer', 'raider', 'battery'],
  ['kites', 'lancer', 'patrol', 'rocks', 'lancer', 'battery'],
  ['patrol', 'lancer', 'battery', 'kites', 'lancer', 'battery'],
];
export const waveLength = 18;
export function spawnFormation(enemies, w, wave, beat, playerX) {
  const kind = phrases[Math.min(wave - 1, 2)][beat];
  const center = Math.max(0.16, Math.min(0.84, (playerX / w) * 0.48 + Math.random() * 0.52)),
    side = Math.random() < 0.5 ? 1 : -1;
  function add(kind, lane, delay = 0, dir = side) {
    const r = { rock: 15 + Math.random() * 11, raider: 16, kite: 13, lancer: 15, gunship: 23 }[kind];
    const speed = 1 + Math.log2(wave) * 0.16;
    const cruise = { rock: 96, raider: 95, kite: 129, lancer: 100, gunship: 66 }[kind] * speed;
    enemies.push({
      kind,
      r,
      x: Math.max(r, Math.min(w - r, lane * w)),
      y: -r - 2 - delay * 95,
      vx: kind === 'rock' ? (Math.random() - 0.5) * 32 : 0,
      vy: cruise,
      cruise,
      dir,
      threat: speed,
      age: 0,
      fireIn: kind === 'kite' ? 1.35 : 1.6,
      aim: 0,
      locked: false,
      flash: 0,
      hp: kind === 'gunship' ? 4 : 1,
      points: scores[kind],
      angle: Math.random() * 6.28,
      spin: Math.random() * 1.6 - 0.8,
    });
  }
  if (kind === 'rocks') {
    add('rock', center - 0.18);
    add('rock', center + 0.22, 0.42);
  } else if (kind === 'kites') {
    add('kite', 0.28, 0, 1);
    add('kite', 0.72, 0.28, -1);
  } else if (kind === 'patrol') {
    add('raider', center - 0.19);
    add('raider', center + 0.19, 0.5);
  } else if (kind === 'battery') add('gunship', center);
  else add(kind, center);
  if (kind !== 'rocks') add('rock', center > 0.5 ? 0.15 : 0.85, 0.65);
  if (wave >= 4 && beat % 2 === 1) add(wave >= 7 ? 'kite' : 'raider', 1 - center, 0.85, -side);
  if (wave > 1 || w > 650) add('rock', Math.random(), 1.1);
}
export function flyEnemy(e, dt, w, h, player, shots, sound) {
  e.age += dt;
  e.flash = Math.max(0, e.flash - dt);
  if (e.kind === 'lancer' && (e.locked || e.y > h * 0.15)) {
    if (!e.locked) {
      e.locked = true;
      e.fireIn = 0.78;
      e.aim = Math.max(-1.04, Math.min(1.04, Math.atan2(player.x - e.x, Math.max(45, player.y - e.y))));
    }
    const previous = e.fireIn;
    e.fireIn -= dt;
    const diving = e.fireIn <= 0;
    if (diving && previous > 0) sound.effect('dash');
    const target = diving ? 370 * e.threat : 0;
    const blend = -Math.expm1(-dt * (diving ? 10 : 16));
    e.vx += (Math.sin(e.aim) * target - e.vx) * blend;
    e.vy += (Math.cos(e.aim) * target - e.vy) * blend;
    e.tilt = (e.tilt || 0) + (-e.aim - (e.tilt || 0)) * (1 - Math.exp(-dt * 12));
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    return;
  }
  if (e.kind === 'rock') {
    e.angle += e.spin * dt;
  } else if (e.kind !== 'lancer') {
    if (e.kind === 'kite') e.vx = e.dir * Math.cos(e.age * 1.9) * Math.min(135, w * 0.34);
    if (e.kind === 'raider')
      e.vx += (Math.max(-72, Math.min(72, (player.x - e.x) * 0.65)) - e.vx) * (1 - Math.exp(-dt * 2));
    if (e.kind === 'gunship') {
      e.vx = e.dir * Math.sin(e.age * 1.2) * 32;
      const arrival = Math.max(0, Math.min(e.cruise, (h * 0.19 - e.y) * 2.1));
      e.vy += ((e.age < 6 ? arrival : e.cruise * 1.4) - e.vy) * (1 - Math.exp(-dt * 4));
    }
    const bank = -Math.atan2(e.vx, Math.max(75, e.vy)) * 0.6;
    e.tilt = (e.tilt || 0) + (bank - (e.tilt || 0)) * (1 - Math.exp(-dt * 7));
    if (e.y > 0 && e.y < player.y - 55) {
      e.fireIn -= dt;
      if (!e.locked && e.fireIn <= 0.6) {
        e.aim = e.kind === 'gunship' ? 0 : Math.atan2(player.x - e.x, player.y - e.y);
        e.locked = true;
      }
      if (e.fireIn <= 0) {
        const spread =
          e.kind === 'gunship' ? [-0.56, -0.28, 0, 0.28, 0.56] : e.kind === 'kite' ? [-0.12, 0.12] : [0];
        for (const offset of spread) {
          const aim = e.aim + offset,
            speed = (e.kind === 'gunship' ? 136 : 169) * e.threat;
          shots.push({
            x: e.x,
            y: e.y + e.r * 0.65,
            r: 4,
            vx: Math.sin(aim) * speed,
            vy: Math.cos(aim) * speed,
            hostile: true,
          });
        }
        sound.effect(e.kind === 'gunship' ? 'volley' : 'raider');
        e.fireIn = 0.6 + (e.kind === 'gunship' ? 1.55 : 2) / e.threat;
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
