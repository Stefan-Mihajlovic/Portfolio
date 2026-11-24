// A silhouette, a firing rhythm and a score belong to each flagship class.
const flagships = [
  {
    name: 'Scythe',
    armor: '#ba6756',
    light: '#ffd398',
    wing: 'M5 -18 L18 -20 39 -9 47 15 49 33 31 13 13 9 6 19Z',
    panel: 'M13 -15 L19 -16 36 -7 43 12 30 3 14 0Z',
  },
  {
    name: 'Bastion',
    armor: '#798a9f',
    light: '#ffbd79',
    wing: 'M4 -20 L23 -25 40 -17 44 -5 41 17 31 25 25 15 14 17 7 8Z',
    panel: 'M14 -16 L24 -20 36 -14 39 -4 29 -7 17 -2Z',
  },
  {
    name: 'Vesper',
    armor: '#ab7b9b',
    light: '#ffd0b4',
    wing: 'M5 -17 L14 -28 28 -34 20 -11 39 4 33 22 19 8 10 21Z',
    panel: 'M11 -15 L23 -28 16 -9 32 5 28 9 16 1Z',
  },
].map((spec) => ({ ...spec, wing: new Path2D(spec.wing), panel: new Path2D(spec.panel) }));

export function createBoss(rank, w) {
  const design = (rank - 1) % flagships.length;
  const maxHp = 3 * (21 + 3 * rank);
  return {
    kind: 'boss',
    rank,
    design,
    name: flagships[design].name,
    r: 39,
    x: w / 2,
    y: -65,
    hp: maxHp,
    maxHp,
    points: 250,
    phase: 1,
    launchIn: 1.8,
    sortie: 0,
    courseTime: 0,
    relayLosses: 0,
    exposedFor: 0,
    dive: null,
    age: 0,
    fireIn: 2.45,
    volley: 0,
    aim: 0,
    flash: 0,
  };
}
// Every route starts outside the arena. Its warning stays on the entry edge until the craft enters.
function escortPosition(e, w, h, t) {
  const sideX = (x) => (e.side === 1 ? x : 1 - x) * w;
  const sweep = Math.sin(Math.PI * t);
  if (e.route === 'gate') {
    return { x: w * e.lane, y: -20 + t * (h + 48) };
  }
  if (e.route === 'helix') {
    return {
      x: sideX(-0.1 + 1.2 * t + 0.115 * Math.sin(t * Math.PI * 2)),
      y: h * (e.lane + t * 0.38 + sweep * Math.cos(t * Math.PI * 2) * 0.19),
    };
  }
  // A single ace drops through the lower half. A whole flight cuts across in a shallow bank.
  const depth = e.route === 'ace' ? 0.42 : 0.17;
  return { x: sideX(-0.12 + 1.24 * t), y: h * (e.lane + sweep * depth + 0.15 * t) };
}

function launchWing(b, enemies, w, h) {
  if (enemies.some((e) => e.escort && !e.dead)) return false;
  const sequence = b.sortie++;
  b.relayLosses = 0;
  const side = sequence % 2 ? -1 : 1;
  const route = b.design === 0 ? (sequence % 2 ? 'ace' : 'crosscut') : b.design === 1 ? 'gate' : 'helix';
  const lanes = Math.max(5, Math.min(11, Math.floor(w / 85)));
  const gap = 1 + ((sequence + b.phase) % (lanes - 2));
  const count = route === 'gate' ? lanes : route === 'ace' ? 1 : 2 + b.phase;
  for (let i = 0; i < count; i++) {
    if (route === 'gate' && i === gap) continue;
    const gate = route === 'gate';
    const e = {
      kind: ['lancer', 'gunship', 'kite'][b.design],
      escort: true,
      route,
      side: route === 'helix' && i % 2 ? -side : side,
      lane: gate ? (i + 0.5) / lanes : 0.16 + (i % 3) * 0.085,
      age: -0.9 - (gate ? 0 : i * 0.31),
      duration: gate ? 6.5 : route === 'ace' ? 4.0 : 5.5,
      r: route === 'ace' ? 14 : 10,
      hp: route === 'ace' ? 4 : gate ? 2 : 1,
      points: route === 'ace' ? 45 : 15,
      flash: 0,
      fireIn: gate ? 1.6 : 2.1,
      bursts: route === 'ace' ? 3 : b.phase === 3 ? 2 : 1,
    };
    Object.assign(e, escortPosition(e, w, h, 0));
    enemies.push(e);
  }
  // Give the formation time to declare its route before the flagship joins the attack.
  b.fireIn = Math.max(b.fireIn, 1.8);
  return true;
}

export function drawEntry(ctx, e, w) {
  const gate = e.route === 'gate';
  ctx.save();
  ctx.translate(gate ? e.x : e.side === 1 ? 8 : w - 8, gate ? 10 : e.y);
  ctx.rotate(gate ? Math.PI / 2 : e.side === 1 ? 0 : Math.PI);
  ctx.strokeStyle = '#ffc29a';
  ctx.globalAlpha = Math.max(0.35, 1 - Math.abs(e.age) * 0.38);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-3, -4);
  ctx.lineTo(2, 0);
  ctx.lineTo(-3, 4);
  ctx.moveTo(4, -4);
  ctx.lineTo(9, 0);
  ctx.lineTo(4, 4);
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
    vx: Math.sin(aim) * 155,
    vy: Math.cos(aim) * 155,
    hostile: true,
  });
  if (e.route === 'ace') sound.effect('raider');
  e.fireIn = --e.bursts > 0 ? (e.route === 'ace' ? 0.42 : 1.6) : Infinity;
}

export function advanceArmor(b) {
  const phase = Math.min(3, 1 + Math.floor((b.maxHp - b.hp) / (b.maxHp / 3)));
  if (b.hp <= 0 || phase === b.phase) return false;
  b.phase = phase;
  b.dive = null;
  b.launchIn = 0.65;
  b.fireIn = 1.05;
  return true;
}

export function flyBoss(b, dt, w, h, player, shots, sound, enemies) {
  b.age += dt;
  b.flash = Math.max(0, b.flash - dt);
  const pressure = b.phase - 1;
  const speed = 1 + 0.16 * Math.log2(b.rank);
  b.courseTime += dt * speed * (1 + pressure * 0.07);
  const t = b.courseTime;
  const amplitude = Math.max(0, Math.min(w * 0.29, w / 2 - 52));
  const baseY = Math.max(69, h * 0.19);
  let goalX, goalY;
  if (b.design === 0) {
    goalX = w / 2 + Math.sin(t * 0.73) * amplitude;
    goalY = baseY + Math.cos(t * 1.46) * h * 0.062;
  } else if (b.design === 1) {
    goalX = w / 2 + Math.tanh(2.6 * Math.sin(t * 0.42)) * amplitude * 0.75;
    goalY = baseY + Math.sin(t * 0.8) * 8;
  } else {
    goalX = w / 2 + Math.sin(t * 0.88) * amplitude * 0.87;
    goalY = baseY + Math.sin(t * 1.76) * h * 0.065;
  }
  b.exposedFor = Math.max(0, b.exposedFor - dt);
  if (b.dive) {
    const dive = b.dive;
    dive.time += dt;
    const progress = Math.min(1, Math.max(0, (dive.time - 0.85) / 0.75));
    const eased = progress * progress * (3 - 2 * progress);
    b.x = w * (dive.fromX + (dive.toX - dive.fromX) * eased);
    b.y = h * (dive.fromY + (dive.toY - dive.fromY) * eased);
    if (progress === 1) b.dive = null;
    return;
  }
  b.launchIn -= dt;
  if (b.launchIn <= 0) {
    b.launchIn = launchWing(b, enemies, w, h) ? 9.2 - pressure * 0.5 : 0.65;
  }
  b.x += (goalX - b.x) * (1 - Math.exp(-dt * 1.65));
  b.y += (goalY - b.y) * (1 - Math.exp(-dt * 1.6));
  b.fireIn -= dt;
  if (b.fireIn > 0.55) b.aim = Math.atan2(player.x - b.x, Math.max(45, player.y - b.y));
  if (b.fireIn > 0) return;
  if (b.design === 0 && (b.volley + 1) % 4 === 0) {
    b.volley++;
    b.dive = {
      time: 0,
      fromX: b.x / w,
      fromY: b.y / h,
      toX: Math.max(0.12, Math.min(0.88, player.x / w)),
      toY: Math.max(0.43, Math.min(0.7, player.y / h)),
    };
    b.fireIn = 1.85;
    sound.effect('dash');
    return;
  }
  const velocity = (148 + b.design * 9 + pressure * 11) * speed;
  function fire(offset, angle) {
    shots.push({
      x: b.x + offset,
      y: b.y + 17,
      r: 4,
      vx: Math.sin(angle) * velocity,
      vy: Math.cos(angle) * velocity,
      hostile: true,
    });
  }
  if (b.design === 0) {
    for (const side of [-1, 1]) {
      fire(side * 28, b.aim + side * 0.12);
      if (pressure && (pressure === 2 || b.volley % 2 === 0)) fire(side * 28, b.aim + side * 0.43);
    }
  } else if (b.design === 1) {
    const width = 2 + pressure;
    for (let i = -width; i <= width; i++) fire(0, i * 0.245 + (b.volley % 2 ? 0.11 : -0.11));
  } else {
    // Interlocking broken rings: the opening drifts, then reverses at the next breach.
    const petals = 12 + pressure * 2;
    const opening = Math.sin(b.volley * 0.69) * (b.phase === 2 ? -0.84 : 0.84);
    for (let i = 0; i < petals; i++) {
      const angle = (i / petals - 0.5) * Math.PI * 2 + (b.volley % 2 ? 0.12 : -0.12);
      if (Math.abs(angle - opening) > 0.36) fire(0, angle);
    }
  }
  b.volley++;
  const interval = [1.08, 1.75, 1.67][b.design];
  b.fireIn = 0.55 + (interval - 0.35) / (speed * (1 + pressure * 0.14));
  sound.effect('volley');
}
export function drawBoss(ctx, b, w, h) {
  const { wing, panel, armor, light } = flagships[b.design];
  ctx.save();
  ctx.translate(b.x, b.y);
  if (b.dive && b.dive.time < 0.85) {
    const x = b.dive.toX * w - b.x,
      y = b.dive.toY * h - b.y;
    ctx.save();
    ctx.strokeStyle = '#ffbc91';
    ctx.lineWidth = 1.3;
    ctx.setLineDash([7, 7]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(x, y, 10 + 17 * (1 - b.dive.time / 0.85), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (b.design === 0 && b.fireIn < 0.55) {
    ctx.save();
    ctx.strokeStyle = '#ffc39799';
    ctx.setLineDash([5, 9]);
    ctx.lineWidth = 1;
    for (const side of [-1, 1]) {
      const a = b.aim + side * 0.12;
      ctx.beginPath();
      ctx.moveTo(side * 28, 17);
      ctx.lineTo(side * 28 + Math.sin(a) * 190, 17 + Math.cos(a) * 190);
      ctx.stroke();
    }
    ctx.restore();
  }
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);
    ctx.translate((b.phase - 1) * 2.5, 0);
    ctx.fillStyle = b.flash > 0 ? '#f8d5af' : armor;
    ctx.strokeStyle = '#111927';
    ctx.lineWidth = 3;
    ctx.stroke(wing);
    ctx.fill(wing);
    ctx.fillStyle = '#414055';
    ctx.fill(panel);
    ctx.fillStyle = light;
    ctx.fillRect(18, -9, 7, 2);
    ctx.fillRect(21, -5, 4, 1.5);
    ctx.restore();
  }
  ctx.fillStyle = '#25283b';
  ctx.beginPath();
  ctx.moveTo(0, -28);
  ctx.lineTo(14, -11);
  ctx.lineTo(10, 13);
  ctx.lineTo(0, 25);
  ctx.lineTo(-10, 13);
  ctx.lineTo(-14, -11);
  ctx.fill();
  const charging = Math.max(0, 1 - b.fireIn / 0.55);
  ctx.strokeStyle = light;
  ctx.fillStyle = b.exposedFor > 0 ? '#98ffdc' : b.flash > 0 ? '#fff5dc' : light;
  if (b.exposedFor > 0) {
    ctx.save();
    ctx.fillStyle = '#b6ffe9';
    ctx.textAlign = 'center';
    ctx.font = 'bold 9px ui-monospace, monospace';
    ctx.fillText('CORE OPEN', 0, -33);
    ctx.restore();
  }
  ctx.lineWidth = 1.6;
  if (b.design === 0) {
    // A split lance opens along the keel as armor is shed.
    for (const side of [-1, 1]) {
      const inset = 1 + b.phase;
      ctx.beginPath();
      ctx.moveTo(side * inset, -16);
      ctx.lineTo(side * (8 + charging * 3), -3);
      ctx.lineTo(side * inset, 16 + charging * 3);
      ctx.fill();
    }
  } else if (b.design === 1) {
    for (const side of [-1, 1]) {
      ctx.fillRect(side * 29 - 3, 7, 6, 13 + charging * 5);
      ctx.strokeRect(side * 29 - 5, 5, 10, 10);
    }
    for (let i = 0; i < b.phase; i++) ctx.fillRect(-6, 6 - i * 6, 12, 2);
  } else {
    ctx.rotate(b.age * (0.6 + b.phase * 0.2));
    for (let i = 0; i < 3; i++) {
      ctx.rotate((Math.PI * 2) / 3);
      ctx.beginPath();
      ctx.arc(0, 0, 11 + charging * 2, 0.16, 1.65);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 3 + charging * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
