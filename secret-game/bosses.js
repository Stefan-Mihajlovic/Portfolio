// Multi-part flagship encounters with destructible subsystems, telegraphed beams, and chain deaths.
const TAU = Math.PI * 2;

const flagships = [
  {
    name: 'SCYTHE',
    designation: 'INTERCEPTOR DREADNOUGHT',
    armor: '#bf6856',
    light: '#ffd398',
    wing: 'M5 -18 L18 -20 39 -9 47 15 49 33 31 13 13 9 6 19Z',
    panel: 'M13 -15 L19 -16 36 -7 43 12 30 3 14 0Z',
  },
  {
    name: 'BASTION',
    designation: 'SIEGE CARRIER',
    armor: '#778ba2',
    light: '#ffbd79',
    wing: 'M4 -20 L23 -25 40 -17 44 -5 41 17 31 25 25 15 14 17 7 8Z',
    panel: 'M14 -16 L24 -20 36 -14 39 -4 29 -7 17 -2Z',
  },
  {
    name: 'VESPER',
    designation: 'SOLAR PRISM',
    armor: '#ac7ba0',
    light: '#ffd2b8',
    wing: 'M5 -17 L14 -28 28 -34 20 -11 39 4 33 22 19 8 10 21Z',
    panel: 'M11 -15 L23 -28 16 -9 32 5 28 9 16 1Z',
  },
].map((spec) => ({ ...spec, wing: new Path2D(spec.wing), panel: new Path2D(spec.panel) }));

function buildParts(design, rank) {
  const partHp = 16 + rank * 6;
  if (design === 0) {
    // Scythe twin blade wing turrets
    return [
      { id: 'L-BLADE', side: -1, ox: -36, oy: 6, x: 0, y: 0, r: 15, hp: partHp, maxHp: partHp, flash: 0, dead: false },
      { id: 'R-BLADE', side: 1, ox: 36, oy: 6, x: 0, y: 0, r: 15, hp: partHp, maxHp: partHp, flash: 0, dead: false },
    ];
  }
  if (design === 1) {
    // Bastion twin shield pylons
    return [
      { id: 'L-PYLON', side: -1, ox: -42, oy: 10, x: 0, y: 0, r: 16, hp: partHp + 4, maxHp: partHp + 4, flash: 0, dead: false },
      { id: 'R-PYLON', side: 1, ox: 42, oy: 10, x: 0, y: 0, r: 16, hp: partHp + 4, maxHp: partHp + 4, flash: 0, dead: false },
    ];
  }
  // Vesper 3 orbiting prism nodes
  return [0, 1, 2].map((i) => ({
    id: `PRISM-${i + 1}`,
    orbitIndex: i,
    orbitRadius: 56,
    x: 0,
    y: 0,
    r: 13,
    hp: Math.round(partHp * 0.85),
    maxHp: Math.round(partHp * 0.85),
    flash: 0,
    dead: false,
  }));
}

export function createBoss(rank, w) {
  const design = (rank - 1) % flagships.length;
  const maxHp = 3 * (26 + 5 * rank);
  const spec = flagships[design];
  const boss = {
    kind: 'boss',
    rank,
    design,
    name: spec.name,
    designation: spec.designation,
    r: 36,
    x: w / 2,
    y: -84,
    hp: maxHp,
    maxHp,
    points: 450 + rank * 150,
    phase: 1,
    entering: 1.5,
    dying: 0,
    deathTick: 0,
    parts: buildParts(design, rank),
    launchIn: 2.8,
    sortie: 0,
    courseTime: 0,
    exposedFor: 0,
    dive: null,
    beamWarn: 0,
    beamActive: 0,
    beamAngle: 0,
    age: 0,
    fireIn: 2.2,
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
    if (b.design === 2) {
      const a = b.age * (0.95 + (b.phase - 1) * 0.3) + (p.orbitIndex * TAU) / 3;
      p.x = b.x + Math.cos(a) * p.orbitRadius;
      p.y = b.y + Math.sin(a) * (p.orbitRadius * 0.72);
    } else {
      const spread = (b.phase - 1) * 3;
      p.x = b.x + p.ox + (p.side || 0) * spread;
      p.y = b.y + p.oy;
    }
  }
}

function escortPosition(e, w, h, t) {
  const sideX = (x) => (e.side === 1 ? x : 1 - x) * w;
  const sweep = Math.sin(Math.PI * t);
  if (e.route === 'gate') {
    return { x: w * e.lane, y: -20 + t * (h + 48) };
  }
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
  const route = b.design === 0 ? (sequence % 2 ? 'ace' : 'crosscut') : b.design === 1 ? 'gate' : 'helix';
  const lanes = Math.max(5, Math.min(10, Math.floor(w / 92)));
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
      age: -0.9 - (gate ? 0 : i * 0.3),
      duration: gate ? 6.4 : route === 'ace' ? 4.0 : 5.4,
      r: route === 'ace' ? 14 : 11,
      hp: route === 'ace' ? 4 : gate ? 2 : 1,
      maxHp: route === 'ace' ? 4 : gate ? 2 : 1,
      points: route === 'ace' ? 60 : 25,
      shards: 2,
      flash: 0,
      fireIn: gate ? 1.55 : 1.95,
      bursts: route === 'ace' ? 3 : b.phase === 3 ? 2 : 1,
    };
    Object.assign(e, escortPosition(e, w, h, 0));
    enemies.push(e);
  }
  b.fireIn = Math.max(b.fireIn, 1.5);
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
    vx: Math.sin(aim) * 162,
    vy: Math.cos(aim) * 162,
    hostile: true,
  });
  if (e.route === 'ace') sound.effect('raider');
  e.fireIn = --e.bursts > 0 ? (e.route === 'ace' ? 0.42 : 1.55) : Infinity;
}

export function advanceArmor(b) {
  const phase = Math.min(3, 1 + Math.floor((b.maxHp - b.hp) / (b.maxHp / 3)));
  if (b.hp <= 0 || phase === b.phase) return false;
  b.phase = phase;
  b.dive = null;
  b.beamWarn = 0;
  b.beamActive = 0;
  b.launchIn = 0.7;
  b.fireIn = 1.05;
  return true;
}

export function aliveBossParts(b) {
  return b.parts.filter((p) => !p.dead);
}

export function flyBoss(b, dt, w, h, player, shots, sound, enemies) {
  b.age += dt;
  b.flash = Math.max(0, b.flash - dt);
  for (const p of b.parts) p.flash = Math.max(0, p.flash - dt);

  if (b.dying > 0) {
    syncBossParts(b);
    return;
  }

  const baseY = Math.max(78, h * 0.19);
  if (b.entering > 0) {
    b.entering = Math.max(0, b.entering - dt);
    b.y += (baseY - b.y) * (1 - Math.exp(-dt * 3.4));
    b.x += (w / 2 - b.x) * (1 - Math.exp(-dt * 4));
    syncBossParts(b);
    return;
  }

  const pressure = b.phase - 1;
  const speed = 1 + 0.14 * Math.log2(b.rank);
  const liveParts = aliveBossParts(b);
  b.courseTime += dt * speed * (1 + pressure * 0.08 + (liveParts.length === 0 ? 0.12 : 0));
  const t = b.courseTime;
  const amplitude = Math.max(0, Math.min(w * 0.3, w / 2 - 64));

  let goalX, goalY;
  if (b.design === 0) {
    goalX = w / 2 + Math.sin(t * 0.78) * amplitude;
    goalY = baseY + Math.cos(t * 1.56) * h * 0.06;
  } else if (b.design === 1) {
    goalX = w / 2 + Math.tanh(2.4 * Math.sin(t * 0.44)) * amplitude * 0.76;
    goalY = baseY + Math.sin(t * 0.85) * 9;
  } else {
    goalX = w / 2 + Math.sin(t * 0.88) * amplitude * 0.86;
    goalY = baseY + Math.sin(t * 1.76) * h * 0.065;
  }

  b.exposedFor = Math.max(0, b.exposedFor - dt);

  // Active thermal beam sequence (Vesper & Scythe Phase 2+)
  if (b.beamActive > 0) {
    b.beamActive = Math.max(0, b.beamActive - dt);
    b.beamAngle += (b.beamSweep || 0) * dt;
    b.x += (goalX - b.x) * (1 - Math.exp(-dt * 0.8));
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

  // Scythe high-speed dive ram
  if (b.dive) {
    const dive = b.dive;
    dive.time += dt;
    const progress = Math.min(1, Math.max(0, (dive.time - 0.82) / 0.72));
    const eased = progress * progress * (3 - 2 * progress);
    b.x = w * (dive.fromX + (dive.toX - dive.fromX) * eased);
    b.y = h * (dive.fromY + (dive.toY - dive.fromY) * eased);
    syncBossParts(b);
    if (progress === 1) b.dive = null;
    return;
  }

  b.launchIn -= dt;
  if (b.launchIn <= 0 && (b.design !== 1 || liveParts.length > 0)) {
    b.launchIn = launchWing(b, enemies, w, h) ? 9.5 - pressure * 0.55 : 0.7;
  }

  b.x += (goalX - b.x) * (1 - Math.exp(-dt * 1.7));
  b.y += (goalY - b.y) * (1 - Math.exp(-dt * 1.6));
  syncBossParts(b);

  b.fireIn -= dt;
  if (b.fireIn > 0.55) b.aim = Math.atan2(player.x - b.x, Math.max(45, player.y - b.y));
  if (b.fireIn > 0) return;

  // Scythe dive every 4th volley
  if (b.design === 0 && (b.volley + 1) % 4 === 0) {
    b.volley++;
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

  // Vesper sweeping thermal lance in Phase 2+
  if (b.design === 2 && b.phase >= 2 && (b.volley + 1) % 3 === 0) {
    b.volley++;
    b.beamAngle = Math.max(-0.4, Math.min(0.4, b.aim)) - (b.volley % 2 ? 0.28 : -0.28);
    b.beamSweep = b.volley % 2 ? 0.52 : -0.52;
    b.beamWarn = 0.95;
    b.fireIn = 1.65;
    return;
  }

  const velocity = (154 + b.design * 10 + pressure * 12) * speed;
  function fire(x, y, angle, spd = velocity, color) {
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

  if (b.design === 0) {
    // Central keel burst
    fire(b.x, b.y + 20, b.aim);
    if (pressure >= 1) {
      fire(b.x, b.y + 20, b.aim - 0.22);
      fire(b.x, b.y + 20, b.aim + 0.22);
    }
    // Surviving blade wings add flanking lances
    for (const p of liveParts) {
      fire(p.x, p.y + 12, b.aim + p.side * 0.14, velocity * 1.08);
      if (pressure === 2) fire(p.x, p.y + 12, b.aim + p.side * 0.42, velocity * 0.95);
    }
  } else if (b.design === 1) {
    const width = 2 + pressure;
    for (let i = -width; i <= width; i++) {
      fire(b.x, b.y + 18, i * 0.24 + (b.volley % 2 ? 0.11 : -0.11));
    }
    // Surviving pylons fire slow aimed mortar orbs
    for (const p of liveParts) {
      const pAim = Math.atan2(player.x - p.x, Math.max(60, player.y - p.y));
      fire(p.x, p.y + 10, pAim, velocity * 0.88, '#ffd287');
    }
  } else {
    // Vesper interlocking broken rings
    const petals = 10 + pressure * 2 + liveParts.length;
    const opening = Math.sin(b.volley * 0.68) * (b.phase === 2 ? -0.84 : 0.84);
    for (let i = 0; i < petals; i++) {
      const angle = (i / petals - 0.5) * TAU + (b.volley % 2 ? 0.12 : -0.12);
      if (Math.abs(angle - opening) > 0.38) fire(b.x, b.y + 12, angle, velocity * 0.96, '#dfb8ff');
    }
    // Orbiting prism nodes fire targeted pinpoints
    for (const p of liveParts) {
      const pAim = Math.atan2(player.x - p.x, Math.max(60, player.y - p.y));
      fire(p.x, p.y, pAim, velocity * 1.05, '#e8ceff');
    }
  }

  b.volley++;
  const interval = [1.05, 1.65, 1.55][b.design];
  b.fireIn = 0.52 + (interval - 0.34) / (speed * (1 + pressure * 0.14));
  sound.effect('volley');
}

export function drawBoss(ctx, b, w, h) {
  const { wing, panel, armor, light } = flagships[b.design];
  const liveParts = aliveBossParts(b);

  ctx.save();
  ctx.translate(b.x, b.y);

  // Dive telegraph
  if (b.dive && b.dive.time < 0.82) {
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
    ctx.arc(tx, ty, 12 + 20 * (1 - b.dive.time / 0.82), 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  // Sweeping thermal beam telegraph / active beam
  if (b.beamWarn > 0 || b.beamActive > 0) {
    ctx.save();
    ctx.rotate(b.beamAngle || 0);
    if (b.beamActive > 0) {
      const pulse = 0.82 + 0.18 * Math.sin(b.age * 48);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(220, 146, 255, 0.25)';
      ctx.fillRect(-18 * pulse, 18, 36 * pulse, 800);
      ctx.fillStyle = 'rgba(246, 210, 255, 0.72)';
      ctx.fillRect(-7 * pulse, 18, 14 * pulse, 800);
      ctx.fillStyle = '#fff9f2';
      ctx.fillRect(-2.5, 18, 5, 800);
      ctx.globalCompositeOperation = 'source-over';
    } else {
      const p = 1 - b.beamWarn / 0.95;
      ctx.strokeStyle = `rgba(232, 180, 255, ${0.28 + p * 0.65})`;
      ctx.lineWidth = 1 + p * 2.6;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(0, 18);
      ctx.lineTo(0, 800);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  // Scythe sightlines before volley
  if (b.design === 0 && b.fireIn < 0.55 && !b.dive && b.entering <= 0) {
    ctx.save();
    ctx.strokeStyle = '#ffc39788';
    ctx.setLineDash([5, 9]);
    ctx.lineWidth = 1.1;
    for (const p of liveParts) {
      const a = b.aim + p.side * 0.14;
      const ox = p.x - b.x;
      const oy = p.y - b.y + 10;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + Math.sin(a) * 210, oy + Math.cos(a) * 210);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Bastion energy shield arcs while pylons live
  if (b.design === 1 && liveParts.length > 0 && b.entering <= 0) {
    ctx.save();
    ctx.strokeStyle = 'rgba(136, 232, 220, 0.42)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, b.r + 12, 0.15, Math.PI - 0.15);
    ctx.stroke();
    for (const p of liveParts) {
      ctx.strokeStyle = 'rgba(136, 232, 220, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(p.x - b.x, p.y - b.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Main flagship wings (reflecting intact vs broken subsystems)
  for (const side of [-1, 1]) {
    const part = b.parts.find((pt) => pt.side === side);
    const broken = part && part.dead;
    ctx.save();
    ctx.scale(side, 1);
    ctx.translate((b.phase - 1) * 2.5, 0);
    ctx.globalAlpha = broken ? 0.38 : 1;
    ctx.fillStyle = b.flash > 0 ? '#f8d5af' : broken ? '#363a4c' : armor;
    ctx.strokeStyle = '#0f1624';
    ctx.lineWidth = 3;
    ctx.stroke(wing);
    ctx.fill(wing);
    ctx.fillStyle = '#383b50';
    ctx.fill(panel);
    if (!broken) {
      ctx.fillStyle = light;
      ctx.fillRect(18, -9, 7, 2);
      ctx.fillRect(21, -5, 4, 1.5);
    }
    ctx.restore();
  }

  // Central reactor hull
  ctx.fillStyle = '#222638';
  ctx.strokeStyle = '#0f1624';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, -30);
  ctx.lineTo(15, -12);
  ctx.lineTo(11, 14);
  ctx.lineTo(0, 27);
  ctx.lineTo(-11, 14);
  ctx.lineTo(-15, -12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const charging = Math.max(0, 1 - b.fireIn / 0.55);
  ctx.strokeStyle = light;
  ctx.fillStyle = b.exposedFor > 0 ? '#98ffdc' : b.flash > 0 ? '#fff5dc' : light;

  if (b.exposedFor > 0) {
    ctx.save();
    ctx.strokeStyle = 'rgba(152, 255, 220, 0.72)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, b.r + 6 + Math.sin(b.age * 16) * 2, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = '#b6ffe9';
    ctx.textAlign = 'center';
    ctx.font = '700 9px ui-monospace, monospace';
    ctx.fillText('CORE EXPOSED ×2', 0, -37);
    ctx.restore();
  }

  ctx.lineWidth = 1.6;
  if (b.design === 0) {
    for (const side of [-1, 1]) {
      const inset = 1 + b.phase;
      ctx.beginPath();
      ctx.moveTo(side * inset, -16);
      ctx.lineTo(side * (8 + charging * 3), -3);
      ctx.lineTo(side * inset, 16 + charging * 3);
      ctx.fill();
    }
  } else if (b.design === 1) {
    for (let i = 0; i < b.phase; i++) ctx.fillRect(-7, 7 - i * 6, 14, 2.2);
    ctx.beginPath();
    ctx.arc(0, -2, 5 + charging * 3, 0, TAU);
    ctx.fill();
  } else {
    ctx.save();
    ctx.rotate(b.age * (0.7 + b.phase * 0.25));
    for (let i = 0; i < 3; i++) {
      ctx.rotate(TAU / 3);
      ctx.beginPath();
      ctx.arc(0, 0, 12 + charging * 2.5, 0.16, 1.65);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 3.5 + charging * 3.5, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Draw destructible subsystems in world space
  for (const p of liveParts) {
    ctx.save();
    ctx.translate(p.x, p.y);
    if (b.design === 2) {
      // Orbiting prism tether + crystal node
      ctx.strokeStyle = 'rgba(218, 178, 255, 0.28)';
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

      ctx.fillStyle = p.flash > 0 ? '#fff5dc' : '#b789df';
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
      // Wing turret / shield pylon pod
      ctx.fillStyle = '#0f1624';
      ctx.strokeStyle = p.flash > 0 ? '#fff6de' : light;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, p.r * 0.72, 0, TAU);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = p.flash > 0 ? '#fff6de' : b.design === 1 ? '#88e8dc' : '#ffab74';
      ctx.beginPath();
      ctx.arc(0, 0, p.r * 0.34, 0, TAU);
      ctx.fill();
    }

    // Mini subsystem HP bar
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
