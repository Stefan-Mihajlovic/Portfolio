import { connectFlightPassage } from '../assets/sky/flight-passage.js';
import {
  backdrop,
  drawPlanets,
  loadPlanets,
  outlineRock,
  drawRock,
  drawFoe,
  drawInterceptor,
} from './art.js';

import { spawnFormation, flyEnemy, waveLength } from './encounters.js';
import { advanceArmor, createBoss, drawBoss, drawEntry, flyBoss, flyEscort } from './bosses.js';
import { createFlightAudio } from './audio.js';

const sound = createFlightAudio();
const volume = document.querySelector('#volume');
const level = document.querySelector('#level');
const mixer = document.querySelector('#mixer');
const fullscreen = document.querySelector('#fullscreen');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const formatScore = (value) => String(value).padStart(6, '0');

volume.value = sound.volume;
level.value = sound.volume + '%';
volume.addEventListener('input', () => {
  sound.setVolume(volume.valueAsNumber);
  level.value = sound.volume + '%';
});
fullscreen.hidden = !document.fullscreenEnabled;
fullscreen.addEventListener('click', async () => {
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
const panel = document.querySelector('#panel'),
  title = document.querySelector('#title');
const message = document.querySelector('#message'),
  action = document.querySelector('#action');
const hud = document.querySelector('#hud'),
  scoreLabel = document.querySelector('#score');
const bestLabel = document.querySelector('#best'),
  shield = document.querySelector('#shield');
const bossHud = document.querySelector('#boss-hud');
const bossArmor = document.querySelector('#boss-armor');
let boss = null,
  nextBossRank = 1;
const pauseButton = document.querySelector('#pause');
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const between = (a, b) => a + Math.random() * (b - a);
const collides = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r;
const stars = Array.from({ length: 130 }, () => ({
  x: Math.random(),
  y: Math.random(),
  z: between(0.2, 1),
}));
const motes = stars.slice(0, 34);
// A distant belt moves as a group behind the playable asteroids.
const belt = Array.from({ length: 38 }, () => ({
  x: Math.random(),
  y: (Math.random() + Math.random() - 1) * 0.13,
  r: between(0.65, 3.4),
  angle: between(0, Math.PI * 2),
  points: outlineRock(),
}));
const keys = new Set();
const player = { x: 0, y: 0, r: 6, vx: 0, vy: 0, bank: 0 };
let enemies = [],
  shots = [],
  sparks = [],
  impacts = [];
let mode = 'intro',
  kills = 0,
  score = 0,
  lives = 3,
  best = 0;
let distance = 0,
  introTime = 0;
let time = 0,
  spawnIn = 0,
  nextShot = 0,
  immune = 0,
  spawnCount = 0;
let frame = 0,
  lastTime = 0,
  pointer = null;
let w = 0,
  h = 700,
  background;
try {
  best = Number(localStorage.getItem('low-orbit-best')) || 0;
} catch {}
bestLabel.textContent = formatScore(best);

function resize() {
  const box = canvas.getBoundingClientRect();
  if (!box.width || !box.height) return;
  const previousWidth = w,
    previousHeight = h;
  // A narrow phone keeps enough room to dodge, while a wide screen supports more traffic.
  h = Math.min(700, (460 * box.height) / box.width + 300);
  w = (h * box.width) / box.height;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(box.width * dpr);
  canvas.height = Math.round(box.height * dpr);
  ctx.setTransform(canvas.width / w, 0, 0, canvas.height / h, 0, 0);
  if (previousWidth) {
    for (const object of [player, ...enemies, ...shots, ...sparks, ...impacts]) {
      object.x *= w / previousWidth;
      object.y *= h / previousHeight;
    }
  }
  pointer = null;
  if (!background || Math.abs(previousWidth / previousHeight - w / h) > 0.001)
    background = backdrop(w, h);
  draw();
}

function paintShip(x, y, width, angle = 0, thrust = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const height = width;
  ctx.scale(mode === 'intro' ? 1 : 1 - Math.abs(angle) * 0.35, 1);
  const tail = height * 0.43;
  const plume = height * (0.22 + 0.24 * thrust) * (1 + 0.08 * Math.sin((introTime + time) * 32));
  const flame = ctx.createLinearGradient(0, tail, 0, tail + plume);
  flame.addColorStop(0, '#fff3c4');
  flame.addColorStop(0.28, '#79dcc9dc');
  flame.addColorStop(1, '#79dcc900');
  ctx.fillStyle = flame;
  ctx.beginPath();
  ctx.moveTo(-width * 0.09, tail);
  ctx.quadraticCurveTo(-width * 0.055, tail + plume * 0.65, 0, tail + plume);
  ctx.quadraticCurveTo(width * 0.055, tail + plume * 0.65, width * 0.09, tail);
  ctx.fill();
  ctx.scale(width / 94, width / 94);
  drawInterceptor(ctx);
  ctx.restore();
}

function draw() {
  if (!background) return;
  const intro = mode === 'intro';
  const travel = intro ? introTime * 12 : distance;
  const pan = intro ? Math.sin(introTime * 0.12) * 0.16 : player.x / w - 0.5;
  // Alternately reflect adjacent cloud tiles for a continuous, rolling nebula.
  const tile = h * 1.18;
  const scroll = travel * 0.12;
  const phase = scroll % tile;
  const index = Math.floor(scroll / tile);
  for (let i = -1; i <= 0; i++) {
    ctx.save();
    const flip = (index - i) % 2 !== 0;
    ctx.translate(-w * (0.08 + pan * 0.09), phase + i * tile + (flip ? tile : 0));
    if (flip) ctx.scale(1, -1);
    ctx.drawImage(background, 0, 0, w * 1.16, tile);
    ctx.restore();
  }
  for (const star of stars) {
    const z = star.z;
    const x = (((star.x * w - pan * z * 30) % w) + w) % w;
    const y = (star.y * h + travel * z * z) % h;
    ctx.fillStyle = '#e8f1fc';
    ctx.globalAlpha = 0.21 + z * 0.51;
    ctx.fillRect(x, y, 0.4 + z, 0.5 + z * (intro ? 1.1 : 2.6));
  }
  const portrait = w < h;
  ctx.globalAlpha = 1;
  drawPlanets(ctx, w, h, distance, pan, intro);
  const beltPhase = (travel / (h * 7) + 0.25) % 1;
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#9da8ae';
  for (const shard of belt) {
    const x = (shard.x - 0.5) * (1 + beltPhase * 0.24) + 0.5 - pan * 0.07;
    const y = beltPhase * 1.65 - 0.39 + (shard.x - 0.5) * 0.54 + shard.y;
    const size = shard.r * (0.6 + beltPhase);
    ctx.save();
    ctx.translate(x * w, y * h);
    ctx.rotate(shard.angle + travel * 0.00028);
    ctx.scale(size * 1.5, size);
    ctx.beginPath();
    for (const [px, py] of shard.points) ctx.lineTo(px, py);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
  // Tiny particles spread from a distant point as the ship passes through the belt.
  ctx.strokeStyle = '#aac4d2';
  for (const mote of motes) {
    const depth = 1.65 - ((mote.z + travel / (h * 2.8)) % 1.5);
    const dx = (mote.x - 0.5) * w,
      dy = (mote.y - 0.39) * h;
    const cx = w * 0.5 - pan * 19,
      cy = h * 0.3;
    ctx.globalAlpha = Math.max(0, (1 - depth / 1.65) * 0.42);
    ctx.lineWidth = 0.55 / depth;
    ctx.beginPath();
    ctx.moveTo(cx + dx / (depth + 0.017), cy + dy / (depth + 0.017));
    ctx.lineTo(cx + dx / depth, cy + dy / depth);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  if (intro) {
    const x = w * (portrait ? 0.42 : 0.64) + Math.sin(introTime * 0.31) * 3;
    const y = h * (portrait ? 0.395 : 0.45) + Math.cos(introTime * 0.39) * 2;
    const size = Math.min(w * (portrait ? 0.29 : 0.19), h * 0.31);
    // The twin exhaust ribbons lead the eye along the interceptor's flight path.
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(0.78);
    ctx.scale(size / 94, size / 94);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 23 - 2, 32);
      ctx.bezierCurveTo(side * 23 - 4, 108, -15, 168, -134, 268);
      ctx.bezierCurveTo(-26, 179, side * 23 + 6, 99, side * 23 + 2, 32);
      ctx.fillStyle = '#8fcabf90';
      ctx.fill();
    }
    ctx.restore();
    paintShip(x, y, size, 0.78, 1.25);
    return;
  }
  for (const enemy of enemies) {
    if (enemy.escort && enemy.age < 0) drawEntry(ctx, enemy, w);
    else if (enemy.kind === 'rock') drawRock(ctx, enemy);
    else if (enemy.kind === 'boss') drawBoss(ctx, enemy, w, h);
    else drawFoe(ctx, enemy);
  }
  for (const s of shots) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(Math.atan2(s.vx, -s.vy));
    ctx.fillStyle = s.hostile ? '#ff874135' : '#6fddff38';
    if (s.hostile) {
      ctx.beginPath();
      ctx.arc(0, 0, 4.8, 0, Math.PI * 2);
      ctx.fillStyle = '#ff8658';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 2.15, 0, Math.PI * 2);
      ctx.fillStyle = '#fff2c9';
      ctx.fill();
      ctx.restore();
      continue;
    }
    ctx.fillRect(-3, -6, 6, 16);
    ctx.fillStyle = s.hostile ? '#ff995f' : '#79def1';
    ctx.fillRect(-1.5, -5, 3, s.hostile ? 10 : 14);
    ctx.fillStyle = '#fff4dc';
    ctx.fillRect(-0.75, -4, 1.5, 6);
    ctx.restore();
  }
  for (const p of sparks) {
    ctx.globalAlpha = Math.min(1, p.life * 3);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - p.vx * 0.035, p.y - p.vy * 0.035);
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 1.7;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (const ring of impacts) {
    const progress = 1 - ring.life / 0.48;
    ctx.save();
    ctx.globalAlpha = (1 - progress) * 0.75;
    ctx.strokeStyle = ring.color;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.radius * (0.35 + progress * 1.6), 0, Math.PI * 2);
    ctx.lineWidth = 2 - progress;
    ctx.stroke();
    if (ring.score) {
      ctx.fillStyle = '#f5eed9';
      ctx.font = '600 12px Cabinet, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('+' + ring.score, ring.x, ring.y - ring.radius - 12 * progress);
    }
    ctx.restore();
  }
  if (lives > 0) {
    ctx.globalAlpha = immune > 0 ? 0.64 : 1;
    paintShip(player.x, player.y, 34, player.bank, clamp(0.75 - player.vy / 370, 0.24, 1.65));
    ctx.globalAlpha = 1;
    if (preciseSteering() || pointer) {
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
      ctx.strokeStyle = '#162d3b';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.fillStyle = '#bdfff2ab';
      ctx.fill();
    }
    if (immune > 0) {
      ctx.beginPath();
      ctx.arc(player.x, player.y, 22, 0, Math.PI * 2);
      ctx.strokeStyle = '#a0ecf3';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  if (mode === 'paused' || mode === 'over') {
    const shade = ctx.createLinearGradient(0, h, w * 0.88, h * 0.12);
    shade.addColorStop(0, '#050a16d6');
    shade.addColorStop(0.58, '#080d197d');
    shade.addColorStop(1, '#0b112438');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, w, h);
  }
}

function burst(object, color) {
  impacts.push({ x: object.x, y: object.y, radius: object.r, color, score: object.points, life: 0.48 });
  for (let i = 0; i < 12; i++)
    sparks.push({
      x: object.x,
      y: object.y,
      vx: between(-100, 100),
      vy: between(-100, 100),
      life: between(0.18, 0.5),
      color,
    });
}

function beginBoss() {
  boss = createBoss(nextBossRank++, w);
  enemies = [boss];
  shots = shots.filter((s) => !s.hostile);
  document.querySelector('#boss-name').textContent =
    boss.name + ' / ' + String(boss.rank).padStart(2, '0');
  bossArmor.max = boss.maxHp;
  updateBossArmor();
  bossHud.hidden = false;
  sound.setBoss(boss.rank);
}
function updateBossArmor() {
  bossArmor.value = boss.hp;
  const phaseText = 'Phase ' + boss.phase + '/3';
  document.querySelector('#boss-phase').textContent = phaseText;
  bossArmor.setAttribute('aria-valuetext', boss.hp + ' armor remaining. ' + phaseText);
}
function endBoss() {
  boss = null;
  bossHud.hidden = true;
  for (const e of enemies) if (e.escort) e.dead = true;
  for (const shot of shots) if (shot.hostile) shot.dead = true;
  spawnIn = 1.15;
  sound.setBoss(0);
}
function updateHud() {
  scoreLabel.textContent = formatScore(score);
  Array.from(shield.children).forEach((pip, i) => pip.classList.toggle('spent', i >= lives));
  shield.setAttribute('aria-label', lives + ' shields');
  shield.classList.toggle('critical', lives === 1);
}

function setMode(next) {
  mode = next;
  document.body.dataset.mode = next;
  pauseButton.hidden = next !== 'playing';
  mixer.open = false;
  keys.clear();
  pointer = null;
  cancelAnimationFrame(frame);
  frame = 0;
  lastTime = 0;
  panel.hidden = next === 'playing';
  hud.hidden = next !== 'playing';
  if (next === 'playing') {
    sound.start();
    canvas.focus({ preventScroll: true });
    frame = requestAnimationFrame(tick);
  } else {
    const lost = next === 'over';
    sound.stop();
    if (lost) sound.death();
    title.textContent = lost ? 'Ship lost' : 'Paused';
    message.hidden = true;
    document.querySelector('#debrief').hidden = false;
    document.querySelector('#run-score').textContent = score.toLocaleString();
    document.querySelector('#run-wave').textContent = waveLabel.textContent;
    document.querySelector('#run-kills').textContent = kills;
    document.querySelector('#action-text').textContent = lost ? 'Fly again' : 'Resume flight';
    action.focus({ preventScroll: true });
  }
  draw();
}
function launch() {
  time = 0;
  distance = 0;
  player.vx = player.vy = player.bank = 0;
  score = 0;
  kills = 0;
  lives = 3;
  immune = 1;
  spawnIn = 0.25;
  spawnCount = 0;
  waveLabel.textContent = '01';
  hud.style.setProperty('--wave-progress', '0%');
  sound.setWave(1);
  boss = null;
  nextBossRank = 1;
  bossHud.hidden = true;
  sound.rewind();
  nextShot = 0;
  player.x = w / 2;
  player.y = h * 0.79;
  enemies = [];
  shots = [];
  sparks = [];
  impacts = [];
  updateHud();
  setMode('playing');
}
function hitPlayer() {
  if (immune > 0) return;
  lives--;
  if (lives) sound.effect('shield');
  immune = 1.4;
  burst(player, '#a6eaf1');
  updateHud();
  if (!lives) {
    if (score > best) {
      best = score;
      bestLabel.textContent = formatScore(best);
      try {
        localStorage.setItem('low-orbit-best', String(best));
      } catch {}
    }
    setMode('over');
  }
}
function preciseSteering() {
  return keys.has('ShiftLeft') || keys.has('ShiftRight');
}
function update(dt) {
  time += dt;
  immune = Math.max(0, immune - dt);
  nextShot -= dt;
  if (!boss) spawnIn -= dt;
  let dx =
    Number(keys.has('ArrowRight') || keys.has('KeyD')) -
    Number(keys.has('ArrowLeft') || keys.has('KeyA'));
  let dy =
    Number(keys.has('ArrowDown') || keys.has('KeyS')) - Number(keys.has('ArrowUp') || keys.has('KeyW'));
  const length = Math.hypot(dx, dy);
  const thrust = preciseSteering() ? 145 : 345;
  const offsetX = pointer ? pointer.goalX - player.x : 0;
  const offsetY = pointer ? pointer.goalY - player.y : 0;
  const follow = Math.min(18, 455 / (Math.hypot(offsetX, offsetY) || 1));
  const targetX = pointer ? offsetX * follow : (dx * thrust) / (length || 1);
  const targetY = pointer ? offsetY * follow : (dy * thrust) / (length || 1);
  // Integrate displacement along the acceleration curve, including the frame the input changes.
  function steer(position, velocity, target, min, max) {
    const v = player[velocity];
    const braking = Math.abs(target) < Math.abs(v) || target * v < 0;
    const rate = pointer ? 28 : braking ? 32 : 18;
    const blend = -Math.expm1(-dt * rate);
    player[position] = clamp(player[position] + target * dt + ((v - target) * blend) / rate, min, max);
    player[velocity] = v + (target - v) * blend;
  }
  steer('x', 'vx', targetX, 19, w - 19);
  steer('y', 'vy', targetY, 24, h - 24);
  if (player.x === 19 || player.x === w - 19) player.vx = 0;
  if (player.y === 24 || player.y === h - 24) player.vy = 0;
  player.bank += (clamp(player.vx / 345, -1, 1) * 0.35 - player.bank) * (1 - Math.exp(-dt * 11));
  distance += dt * clamp(120 - player.vy * 0.16, 65, 185) * (reducedMotion.matches ? 0.45 : 1);
  if ((keys.has('Space') || pointer) && nextShot <= 0) {
    const aim = player.bank * 0.15;
    shots.push({
      x: player.x + Math.sin(aim) * 17,
      y: player.y - 17,
      r: 4,
      vx: Math.sin(aim) * 530,
      vy: -Math.cos(aim) * 530,
      hostile: false,
    });
    sound.effect('fire');
    nextShot = 0.15;
  }
  if (!boss && spawnIn <= 0) {
    const wave = Math.floor(spawnCount / 6) + 1;
    const beat = spawnCount % 6;
    hud.style.setProperty('--wave-progress', ((beat + 1) / 6) * 100 + '%');
    if (beat === 0) {
      waveLabel.textContent = String(wave).padStart(2, '0');
      sound.setWave(wave);
    }
    const first = enemies.length;
    spawnFormation(enemies, w, wave, beat, player.x);
    for (const enemy of enemies.slice(first)) if (enemy.kind === 'rock') enemy.shape = outlineRock();
    spawnCount++;
    const cadence = 1 + 0.22 * Math.log2(wave);
    spawnIn += (beat === 5 ? waveLength / 6 + 1.5 : waveLength / 6 - 0.3) / cadence;
  }
  for (const enemy of enemies) {
    if (enemy === boss) flyBoss(enemy, dt, w, h, player, shots, sound, enemies);
    else if (enemy.escort) flyEscort(enemy, dt, w, h, player, shots, sound);
    else flyEnemy(enemy, dt, w, h, player, shots, sound);
  }
  for (const s of shots) {
    if (s.dead) continue;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    if (s.hostile) {
      if (collides(s, player)) {
        s.dead = true;
        hitPlayer();
        if (!lives) return;
      } else if (!immune && !s.grazed) {
        const dx = s.x - player.x,
          dy = s.y - player.y;
        if (dx * dx + dy * dy < 22 * 22 && dx * (s.vx - player.vx) + dy * (s.vy - player.vy) > 0) {
          s.grazed = true;
          score += 5;
          impacts.push({ x: player.x, y: player.y, radius: 9, color: '#9df4df', score: 5, life: 0.48 });
          sound.effect('graze');
          updateHud();
        }
      }
    } else {
      const e = enemies.find((e) => !e.dead && collides(s, e));
      if (e) {
        s.dead = true;
        e.hp = Math.max(0, e.hp - (e === boss && boss.exposedFor > 0 ? 2 : 1));
        if (e === boss) {
          if (advanceArmor(e)) {
            for (const round of shots) if (round.hostile) round.dead = true;
            burst({ x: e.x, y: e.y, r: e.r }, '#ffcd8a');
            sound.effect('breach');
          }
          updateBossArmor();
        }
        e.flash = 0.14;
        if (e.hp > 0) {
          sound.effect('impact');
          continue;
        }
        e.dead = true;
        if (e.escort && boss?.design === 1 && ++boss.relayLosses === 2) {
          boss.exposedFor = 2.4;
          boss.fireIn = Math.max(boss.fireIn, 1.2);
          sound.effect('breach');
          burst({ x: boss.x, y: boss.y, r: boss.r }, '#8de6d7');
        }
        if (e === boss) endBoss();
        sound.effect(e.kind === 'rock' ? 'rock' : 'ship');
        score += e.points;
        if (e.kind !== 'rock') kills++;
        burst(e, e.kind === 'rock' ? '#a89da0' : '#ffae73');
        updateHud();
      }
    }
  }
  for (const e of enemies) {
    if (!e.dead && collides(player, e)) {
      if (e !== boss) e.dead = true;
      hitPlayer();
      if (!lives) return;
    }
  }
  const nextBossScore = nextBossRank === 1 ? 500 : (nextBossRank - 1) * 1000;
  if (!boss && score >= nextBossScore) beginBoss();
  enemies = enemies.filter((e) => !e.dead && e.y < h + e.r);
  shots = shots.filter((s) => !s.dead && s.y > -20 && s.y < h + 20 && s.x > -10 && s.x < w + 10);
  for (const p of sparks) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
  }
  for (const ring of impacts) ring.life -= dt;
  impacts = impacts.filter((ring) => ring.life > 0);
  sparks = sparks.filter((p) => p.life > 0);
}
function tick(now) {
  if (document.hidden || (mode !== 'playing' && mode !== 'intro')) return;
  const dt = lastTime ? Math.min(0.04, (now - lastTime) / 1000) : 0;
  lastTime = now;
  if (mode === 'intro') introTime += dt;
  else update(dt);
  draw();
  if (mode === 'playing' || (mode === 'intro' && !reducedMotion.matches))
    frame = requestAnimationFrame(tick);
}
action.addEventListener('click', () => {
  if (mode === 'paused') setMode('playing');
  else launch();
});
pauseButton.addEventListener('click', () => setMode('paused'));
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
  if (document.querySelector('#manual').open) return;
  if (e.target.closest?.('input, summary, button, a') && !['Escape', 'KeyP'].includes(e.code)) return;
  if ((e.code === 'KeyP' || e.code === 'Escape') && (mode === 'playing' || mode === 'paused')) {
    e.preventDefault();
    if (!e.repeat) setMode(mode === 'playing' ? 'paused' : 'playing');
  } else if (mode === 'playing' && controls.has(e.code)) {
    e.preventDefault();
    keys.add(e.code);
  }
});
window.addEventListener('keyup', (e) => keys.delete(e.code));
mixer.addEventListener('toggle', () => {
  if (!mixer.open && mode === 'playing' && mixer.contains(document.activeElement)) {
    canvas.focus({ preventScroll: true });
  }
});
canvas.addEventListener('pointerdown', (e) => {
  if (mode !== 'playing' || pointer || e.button !== 0) return;
  canvas.setPointerCapture(e.pointerId);
  pointer = { id: e.pointerId, x: e.clientX, y: e.clientY, goalX: player.x, goalY: player.y };
});
canvas.addEventListener('pointermove', (e) => {
  if (!pointer || pointer.id !== e.pointerId) return;
  const bounds = canvas.getBoundingClientRect();
  pointer.goalX = clamp(pointer.goalX + ((e.clientX - pointer.x) * w) / bounds.width, 19, w - 19);
  pointer.goalY = clamp(pointer.goalY + ((e.clientY - pointer.y) * h) / bounds.height, 24, h - 24);
  pointer.x = e.clientX;
  pointer.y = e.clientY;
});
canvas.addEventListener('lostpointercapture', (e) => {
  if (pointer?.id === e.pointerId) pointer = null;
});
function autoPause() {
  if (mode === 'playing') setMode('paused');
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
  if (!arrival.hidden) return;
  cancelAnimationFrame(frame);
  lastTime = 0;
  if (!document.hidden && !reducedMotion.matches) frame = requestAnimationFrame(tick);
}
reducedMotion.addEventListener('change', () => {
  if (mode === 'intro') startIntro();
});

connectFlightPassage(document.querySelector('.back'));
const manual = document.querySelector('#manual');
document.querySelector('#guide-open').addEventListener('click', () => manual.showModal());
for (const preview of manual.querySelectorAll('[data-craft]')) {
  drawFoe(preview.getContext('2d'), { kind: preview.dataset.craft, x: 48, y: 48, r: 33, fireIn: 2 });
}
const arrival = document.querySelector('#arrival');
const course = arrival.querySelector('.arrival-track');
const percent = arrival.querySelector('output');
const miniature = arrival.querySelector('canvas').getContext('2d');
miniature.translate(56, 40);
miniature.rotate(Math.PI / 2);
miniature.scale(0.73, 0.73);
drawInterceptor(miniature);
loadPlanets(true, draw);
resize();
const arrivalStart = performance.now();
function approachOrbit(now) {
  const progress = Math.min(1, (now - arrivalStart) / 3000);
  const value = Math.floor(progress * 100);
  if (progress > 0.94 && !reducedMotion.matches) arrival.style.opacity = (1 - progress) / 0.06;
  course.style.setProperty('--progress', progress * 100 + '%');
  if (Number(course.getAttribute('aria-valuenow')) !== value) {
    course.setAttribute('aria-valuenow', value);
    percent.value = value + '%';
  }
  if (progress < 1) return requestAnimationFrame(approachOrbit);
  arrival.hidden = true;
  document.querySelector('#arena').inert = false;
  startIntro();
}
requestAnimationFrame(approachOrbit);
