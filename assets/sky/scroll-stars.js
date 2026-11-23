import { createNebula, nebulaRegion } from './nebula.js';

// Integrate the stars' speed envelope: the clouds start and stop at rest
// and cover the most distance when the star trails are longest.
export function flightDistance(t) {
  if (t >= 1) return 1;
  if (t <= 0) return 0;
  const u = t < .22 ? t / .22 : (t - .22) / .78;
  const distance = u ** 3 * (2 - u);
  return t < .22 ? .22 * distance : .22 + .78 * (2 * u - distance);
}

// The welcome flight starts at the viewport midpoint and settles onto the idle horizon.
export const homeFlightFocusY = remaining => .46 + .04 * remaining;

// Original Spinners star sizes and opacity, projected through a persistent 3D camera.
// Route changes advance the camera; stars never snap back to their starting positions.
export function createScrollStars(host) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const touch = matchMedia('(hover: none) and (pointer: coarse)');
  let touchInput = touch.matches, prefersReduced = reduced.matches;
  let sampledY = window.scrollY;
  touch.addEventListener('change', event => { touchInput = event.matches; });
  const sampleScroll = () => { sampledY = window.scrollY; };
  addEventListener('scroll', sampleScroll, { passive: true });
  let paused = false, ready = false, initializing = false, frame = 0, previous = 0;
  let width = 0, height = 0, scroll = window.scrollY, scrollOffset = 0, velocity = 0;
  let targetScrollOffset = 0, maxScroll = 0, pixelRatio = 0;
  let panX = 0, panY = 0, targetX = 0, targetY = 0;
  let travelStart = -10000, ignoreUntil = 0, elapsed = 0;
  let meteor = null, nextMeteor = 1.5 + Math.random();
  let canvas, ctx, drawNebula, distantStars, stars = [];
  let distantTravel = 0;
  let travelDuration = 1350;
  let centeredFlight = false;
  let destination = nebulaRegion(location.pathname, scroll), flightId = 0;
  const wrap = (n, max) => ((n % max) + max) % max;
  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const smooth = t => t * t * (3 - 2 * t);
  const enabled = () => !paused && !prefersReduced && !document.hidden;
  const updateScrollBounds = () => { maxScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight); };
  const readScroll = () => touchInput ? Math.max(0, Math.min(sampledY, maxScroll)) : sampledY;
  updateScrollBounds();
  new ResizeObserver(updateScrollBounds).observe(document.body);
  addEventListener('resize', updateScrollBounds, { passive: true });
  function envelope(time) {
    const t = (time - travelStart) / travelDuration;
    if (t < 0 || t >= 1) return 0;
    return t < .22 ? smooth(t / .22) : (1 - smooth((t - .22) / .78));
  }
  function createDistantStars() {
    const tile = document.createElement('canvas');
    const size = 1536;
    tile.width = tile.height = size;
    const surface = tile.getContext('2d');
    if (!surface) return null;
    const colors = ['#b9ccdc', '#f0e5cb', '#99b7cc'];
    for (let i = 0; i < 3480; i++) {
      let x = hash(i + 524) * size, y = hash(i + 3701) * size;
      if (i >= 2040) {
        // Irregular knots of distant stars occupy only a fraction of the sky.
        const group = i % 23;
        const angle = x / size * Math.PI * 2;
        const radius = (y / size) ** 1.8 * (22 + hash(group + 16) * 94);
        x = wrap(hash(group + 21) * size + Math.cos(angle) * radius, size);
        y = wrap(hash(group + 54) * size + Math.sin(angle) * radius * .64, size);
      }
      const brightness = hash(i + 94) ** 4;
      surface.globalAlpha = .15 + .72 * brightness;
      surface.fillStyle = colors[i % colors.length];
      surface.beginPath();
      surface.arc(x, y, .36 + brightness * .65, 0, 2 * Math.PI);
      surface.fill();
    }
    return ctx.createPattern(tile, 'repeat');
  }
  function render(dt, time) {
    ctx.clearRect(0, 0, width, height);
    const moving = enabled();
    const warp = moving ? envelope(time) : 0;
    const speed = moving ? .014 + warp * 3.8 : 0;
    const focal = Math.max(width, height) * .72;
    const distance = flightDistance((time - travelStart) / travelDuration);
    const cx = width * .5 + panX;
    const cy = height * (centeredFlight ? homeFlightFocusY(1 - distance) : .46) + panY;
    if (drawNebula && width && height) {
      drawNebula(width, height, dt, scrollOffset, destination, flightId, distance, cx / width, cy / height);
    }
    if (distantStars) {
      distantTravel += dt * (.14 + warp * 4);
      const parallax = Math.max(width, height) * .000013;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1 + warp * .045, 1 + warp * .045);
      ctx.translate(-width * .5 + distantTravel, -height * .46 + scrollOffset * parallax);
      ctx.fillStyle = distantStars;
      // Paint the visible viewport in pattern coordinates, even after long scrolls.
      ctx.fillRect(-distantTravel - 32, -scrollOffset * parallax - 32, width + 64, height + 64);
      ctx.restore();
    }
    ctx.lineCap = 'round';
    // Constant colors plus globalAlpha avoid allocating/parsing a color per star.
    ctx.fillStyle = 'rgb(248,249,255)';
    const scrollPhase = wrap(scrollOffset * .00024, 3.6);
    const advance = speed * dt;
    for (const star of stars) {
      star.z -= advance;
      if (star.z < .14) star.z += 3.8;
      const shiftedY = star.y + scrollPhase;
      const sy = shiftedY < 3.6 ? shiftedY - 1.8 : shiftedY - 5.4;
      const x = cx + star.x / star.z * focal;
      const y = cy + sy / star.z * focal;
      if (x < -100 || x > width + 100 || y < -100 || y > height + 100) continue;
      const fade = Math.min(1, (star.z - .14) * 3, (3.94 - star.z) * 3);
      const alpha = Math.min(.95, star.alpha * (.8 + 1.6 / star.z) * fade * (1 + warp * .65));
      const radius = Math.min(2.1, Math.max(.35, star.radius * .9 / star.z));
      const trailZ = star.z + warp * (.09 + .12 / star.z);
      const tx = cx + star.x / trailZ * focal;
      const ty = cy + sy / trailZ * focal + Math.max(-32, Math.min(32, velocity * .009 / star.z));
      const dx = x - tx, dy = y - ty;
      ctx.globalAlpha = alpha;
      if (dx * dx + dy * dy > 1) {
        const gradient = ctx.createLinearGradient(tx, ty, x, y);
        gradient.addColorStop(0, 'rgba(194,210,239,0)');
        gradient.addColorStop(.65, 'rgba(210,222,244,.35)');
        gradient.addColorStop(1, 'rgb(238,241,250)');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = radius * .9;
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(x, y); ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
      // Sparse Spinners glints: more distant stars remain simple dots.
      if (star.glint && star.z < 2.2 && warp < .2) {
        const size = radius * 3.5;
        ctx.globalAlpha = alpha * (.45 + Math.sin(elapsed * .5 + star.phase) * .15);
        ctx.beginPath();
        ctx.moveTo(x, y - size); ctx.lineTo(x + radius * .45, y - radius * .45);
        ctx.lineTo(x + size, y); ctx.lineTo(x + radius * .45, y + radius * .45);
        ctx.lineTo(x, y + size); ctx.lineTo(x - radius * .45, y + radius * .45);
        ctx.lineTo(x - size, y); ctx.lineTo(x - radius * .45, y - radius * .45);
        ctx.closePath(); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    // A brief, occasional diagonal meteor, separate from the radial travel trails.
    if (moving && warp < .02 && elapsed >= nextMeteor && !meteor) {
      meteor = {
        x: width * (.08 + Math.random() * .55),
        y: height * (.05 + Math.random() * .28),
        vx: Math.max(240, width * .32), vy: Math.max(150, height * .28),
        age: 0, life: 1.2 + Math.random() * .35,
      };
      nextMeteor = elapsed + 3 + Math.random() * 2;
    }
    if (meteor && moving) {
      meteor.age += dt;
      const progress = meteor.age / meteor.life;
      if (progress >= 1 || warp > .05) { meteor = null; return; }
      meteor.x += meteor.vx * dt; meteor.y += meteor.vy * dt;
      const glow = Math.sin(progress * Math.PI) ** 1.5;
      const length = Math.min(190, width * .22) * Math.min(1, progress * 5);
      const angle = Math.atan2(meteor.vy, meteor.vx);
      const tx = meteor.x - Math.cos(angle) * length;
      const ty = meteor.y - Math.sin(angle) * length;
      const trail = ctx.createLinearGradient(tx, ty, meteor.x, meteor.y);
      trail.addColorStop(0, 'rgba(166,193,255,0)');
      trail.addColorStop(.65, `rgba(193,213,255,${glow * .2})`);
      trail.addColorStop(1, `rgba(248,246,237,${glow * .95})`);
      ctx.strokeStyle = trail; ctx.lineWidth = 1.15;
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(meteor.x, meteor.y); ctx.stroke();
      ctx.fillStyle = `rgba(255,254,245,${glow})`;
      ctx.beginPath(); ctx.arc(meteor.x, meteor.y, 1.35, 0, Math.PI * 2); ctx.fill();
    }
  }
  function tick(time) {
    frame = 0;
    const sampledScroll = readScroll();
    // Draw every frame offered by the display, including 120/144Hz screens.
    // Motion remains time-based so a higher refresh rate does not speed it up.
    const dt = previous ? Math.min((time - previous) / 1000, .045) : 0;
    previous = time;
    const moving = enabled();
    if (moving) {
      const delta = time > ignoreUntil ? sampledScroll - scroll : 0;
      targetScrollOffset -= delta;
      const oldOffset = scrollOffset;
      // Interpolate the camera, never the page: sparse native scroll samples
      // and iOS overscroll must not teleport stars or spike their trails.
      scrollOffset = touchInput
        ? scrollOffset + (targetScrollOffset - scrollOffset) * (1 - Math.exp(-dt * 18))
        : targetScrollOffset;
      const cameraDelta = oldOffset - scrollOffset;
      velocity += ((dt ? cameraDelta / dt : 0) - velocity) * (1 - Math.exp(-dt * 10));
      if (!centeredFlight || time >= travelStart + travelDuration) {
        panX += (targetX - panX) * (1 - Math.exp(-dt * 3));
        panY += (targetY - panY) * (1 - Math.exp(-dt * 3));
      }
      elapsed += dt;
    } else velocity = 0;
    scroll = sampledScroll;
    render(moving ? dt : 0, time);
    if (moving) frame = requestAnimationFrame(tick);
  }
  function resume() {
    cancelAnimationFrame(frame); frame = 0; previous = 0; sampleScroll(); scroll = readScroll();
    targetScrollOffset = scrollOffset;
    if (ready) frame = requestAnimationFrame(tick);
  }
  async function initialize() {
    if (ready || initializing) return;
    initializing = true;
    try {
      // The shipped bundle has the same tiles as the static sky, ready on first entry.
      const tiles = typeof __STAR_TILES__ !== 'undefined' ? __STAR_TILES__ : await Promise.all(['far', 'near'].map(async name => {
        const response = await fetch(`/assets/sky/stars-${name}.svg`);
        if (!response.ok) throw Error('Star tile unavailable');
        return response.text();
      }));
      const dots = tiles.flatMap(tile => {
        const svg = new DOMParser().parseFromString(tile, 'image/svg+xml');
        return [...svg.querySelectorAll('circle')].map(dot => ['cx', 'cy', 'r', 'opacity'].map(key => Number(dot.getAttribute(key))));
      });
      canvas = document.createElement('canvas'); canvas.className = 'scroll-star-canvas';
      ctx = canvas.getContext('2d'); if (!ctx) return;
      distantStars = createDistantStars();
      host.prepend(canvas);
      const atmosphere = document.querySelector('.space-atmosphere');
      if (atmosphere) drawNebula = createNebula(atmosphere);
      const count = innerWidth < 768 ? 600 : 1180;
      stars = Array.from({length: count}, (_, i) => {
        const [x, y, radius, alpha] = dots[i % dots.length];
        return {x: (hash(x + i * .37) - .5) * 5.4, y: hash(y + i * .83) * 3.6,
          z: .14 + hash(i + .42) * 3.8, radius, alpha, glint: i % 49 === 0, phase: i};
      });
      new ResizeObserver(() => {
        const nextWidth = host.clientWidth, nextHeight = host.clientHeight;
        const ratio = Math.min(devicePixelRatio || 1, 1.75);
        if (nextWidth === width && nextHeight === height && ratio === pixelRatio) return;
        width = nextWidth; height = nextHeight; pixelRatio = ratio;
        canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0); render(0, performance.now());
      }).observe(host);
      ready = true; host.classList.add('scroll-stars-ready'); resume();
    } catch { /* Original static SVG sky is always available. */ }
    finally { initializing = false; }
  }
  document.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || !enabled()) return;
    targetX = (e.clientX / innerWidth - .5) * -16;
    targetY = (e.clientY / innerHeight - .5) * -12;
  }, {passive: true});
  reduced.addEventListener('change', event => { prefersReduced = event.matches; initialize(); resume(); });
  document.addEventListener('visibilitychange', () => { travelStart = -10000; meteor = null; resume(); });
  initialize();
  return {
    travel(pathname = location.pathname, arrivalScroll = 0, duration = 1350, { centered = false } = {}) {
      const now = performance.now();
      travelDuration = duration;
      centeredFlight = centered;
      if (centered) panX = panY = 0;
      flightId++;
      destination = nebulaRegion(pathname, scrollOffset + arrivalScroll);
      travelStart = enabled() ? now : -10000;
      meteor = null;
      nextMeteor = elapsed + 3 + Math.random() * 3;
      if (!frame) resume();
    },
    setPaused(value) { if (paused === value) return; paused = value; if (value) { travelStart = -10000; meteor = null; } resume(); },
    resetScroll() {
      updateScrollBounds(); sampleScroll(); scroll = readScroll(); targetScrollOffset = scrollOffset;
      velocity = 0; ignoreUntil = performance.now() + 160;
    },
  };
}
