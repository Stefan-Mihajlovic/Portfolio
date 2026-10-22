// Original Spinners star sizes and opacity, projected through a persistent 3D camera.
// Route changes advance the camera; stars never snap back to their starting positions.
export function createScrollStars(host) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const touch = matchMedia('(hover: none) and (pointer: coarse)');
  let paused = false, ready = false, initializing = false, frame = 0, previous = 0;
  let width = 0, height = 0, scroll = window.scrollY, scrollOffset = 0, velocity = 0;
  let targetScrollOffset = 0, maxScroll = 0, pixelRatio = 0;
  let panX = 0, panY = 0, targetX = 0, targetY = 0;
  let travelStart = -10000, ignoreUntil = 0, elapsed = 0;
  let meteor = null, nextMeteor = 3 + Math.random() * 2;
  let canvas, ctx, stars = [];
  const DURATION = 1350;
  const wrap = (n, max) => ((n % max) + max) % max;
  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const smooth = t => t * t * (3 - 2 * t);
  const enabled = () => !paused && !reduced.matches && !document.hidden;
  const updateScrollBounds = () => { maxScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight); };
  const readScroll = () => touch.matches ? Math.max(0, Math.min(window.scrollY, maxScroll)) : window.scrollY;
  updateScrollBounds();
  new ResizeObserver(updateScrollBounds).observe(document.body);
  addEventListener('resize', updateScrollBounds, { passive: true });
  function envelope(time) {
    const t = (time - travelStart) / DURATION;
    if (t < 0 || t >= 1) return 0;
    return t < .22 ? smooth(t / .22) : (1 - smooth((t - .22) / .78));
  }
  function render(dt, time) {
    ctx.clearRect(0, 0, width, height);
    const moving = enabled();
    const warp = moving ? envelope(time) : 0;
    const speed = moving ? .014 + warp * 3.8 : 0;
    const focal = Math.max(width, height) * .72;
    const cx = width * .5 + panX, cy = height * .46 + panY;
    ctx.lineCap = 'round';
    // Constant colors plus globalAlpha avoid allocating/parsing a color per star.
    ctx.fillStyle = 'rgb(248,249,255)';
    for (const star of stars) {
      star.z -= speed * dt;
      if (star.z < .14) star.z += 3.8;
      const sy = wrap(star.y + scrollOffset * .00024, 3.6) - 1.8;
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
      nextMeteor = elapsed + 6 + Math.random() * 5;
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
    const interacting = Math.abs(sampledScroll - scroll) > .1 ||
      Math.abs(targetScrollOffset - scrollOffset) > .1 || Math.abs(velocity) > .5 || envelope(time) > 0 || meteor;
    // Save power at rest, but never impose a 30fps ceiling on a swipe or warp.
    if ((touch.matches || innerWidth < 768) && previous && time - previous < (interacting ? 14 : 30)) {
      frame = requestAnimationFrame(tick); return;
    }
    const dt = previous ? Math.min((time - previous) / 1000, .045) : 0;
    previous = time;
    const moving = enabled();
    if (moving) {
      const delta = time > ignoreUntil ? sampledScroll - scroll : 0;
      targetScrollOffset -= delta;
      const oldOffset = scrollOffset;
      // Interpolate the camera, never the page: sparse native scroll samples
      // and iOS overscroll must not teleport stars or spike their trails.
      scrollOffset = touch.matches
        ? scrollOffset + (targetScrollOffset - scrollOffset) * (1 - Math.exp(-dt * 18))
        : targetScrollOffset;
      const cameraDelta = oldOffset - scrollOffset;
      velocity += ((dt ? cameraDelta / dt : 0) - velocity) * (1 - Math.exp(-dt * 10));
      panX += (targetX - panX) * (1 - Math.exp(-dt * 3));
      panY += (targetY - panY) * (1 - Math.exp(-dt * 3));
      elapsed += dt;
    } else velocity = 0;
    scroll = sampledScroll;
    render(moving ? dt : 0, time);
    if (moving) frame = requestAnimationFrame(tick);
  }
  function resume() {
    cancelAnimationFrame(frame); frame = 0; previous = 0; scroll = readScroll();
    targetScrollOffset = scrollOffset;
    if (ready) frame = requestAnimationFrame(tick);
  }
  async function initialize() {
    if (ready || initializing || reduced.matches) return;
    initializing = true;
    try {
      const patterns = await Promise.all(['far', 'near'].map(async name => {
        const response = await fetch(`/assets/sky/stars-${name}.svg`);
        if (!response.ok) throw Error('Star tile unavailable');
        const svg = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
        return [...svg.querySelectorAll('circle')].map(dot => ['cx', 'cy', 'r', 'opacity'].map(key => Number(dot.getAttribute(key))));
      }));
      canvas = document.createElement('canvas'); canvas.className = 'scroll-star-canvas';
      ctx = canvas.getContext('2d'); if (!ctx) return;
      host.prepend(canvas);
      const dots = patterns.flat();
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
  reduced.addEventListener('change', () => { initialize(); resume(); });
  document.addEventListener('visibilitychange', () => { travelStart = -10000; meteor = null; resume(); });
  initialize();
  return {
    travel() { if (!enabled()) return; meteor = null; nextMeteor = elapsed + 3 + Math.random() * 3; travelStart = performance.now(); resume(); },
    setPaused(value) { paused = value; if (value) { travelStart = -10000; meteor = null; } resume(); },
    resetScroll() {
      updateScrollBounds(); scroll = readScroll(); targetScrollOffset = scrollOffset;
      velocity = 0; ignoreUntil = performance.now() + 160;
    },
  };
}
