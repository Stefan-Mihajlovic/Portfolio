(() => {
  const header = document.querySelector('.floating-header');
  const hero = document.querySelector('.hero-copy');
  if (!header || !hero) return;
  let queued = false;
  const update = () => {
    const visible = hero.getBoundingClientRect().bottom < 80;
    header.classList.toggle('is-visible', visible);
    header.inert = !visible;
    queued = false;
  };
  const requestUpdate = () => {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  };
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  window.addEventListener('pageshow', requestUpdate);
  update();
})();

// Animate the curves themselves; each layer has its own travelling wave.
(() => {
  const svg = document.querySelector('.hero-waves');
  if (!svg) return;
  const layers = [
    { name: 'cyan', base: 190, amplitude: 62, phase: .3, speed: .5 },
    { name: 'blue', base: 305, amplitude: 48, phase: 2, speed: .4 },
    { name: 'amber', base: 215, amplitude: 65, phase: 3.7, speed: -.46 },
    { name: 'silver', base: 400, amplitude: 32, phase: 1.8, speed: .32 },
  ].map(layer => ({ ...layer, path: svg.querySelector(`[data-wave="${layer.name}"]`) }));
  const frequency = Math.PI * 2 / 2200;
  const draw = seconds => {
    for (const layer of layers) {
      const phase = seconds * layer.speed + layer.phase;
      const y = x => layer.base + layer.amplitude * Math.sin(x * frequency + phase)
        + 16 * Math.sin(x * frequency * 1.7 - phase * .8);
      const slope = x => layer.amplitude * frequency * Math.cos(x * frequency + phase)
        + 16 * frequency * 1.7 * Math.cos(x * frequency * 1.7 - phase * .8);
      const point = (x, value) => `${x.toFixed(2)} ${value.toFixed(2)}`;
      let d = `M${point(-100, y(-100))}`;
      // Cubic segments share tangents, keeping the entire wave smooth.
      for (let x = -100; x < 1700; x += 200) {
        const end = x + 200;
        d += `C${point(x + 200 / 3, y(x) + slope(x) * 200 / 3)} `
          + `${point(end - 200 / 3, y(end) - slope(end) * 200 / 3)} ${point(end, y(end))}`;
      }
      layer.path.setAttribute('d', `${d}V620H-100Z`);
    }
  };
  animateVisibleWaves(svg, draw);
})();

// Keep the footer composition, gently bending each colored layer in place.
(() => {
  const svg = document.querySelector('.footer-waves');
  if (!svg) return;
  const paths = [...svg.querySelectorAll('[data-footer-wave]')].map(path => ({
    path,
    layer: Number(path.dataset.footerWave),
    segments: path.getAttribute('d').match(/[A-Za-z][^A-Za-z]*/g).map(segment => ({
      command: segment[0],
      values: (segment.slice(1).match(/-?\d+(?:\.\d+)?/g) || []).map(Number),
    })),
  }));
  const draw = seconds => {
    for (const { path, layer, segments } of paths) {
      const phase = layer * 1.7;
      const speed = [.38, -.31, .34, -.27][layer];
      const amplitude = [20, 15, 22, 12][layer];
      const offset = x => amplitude * (Math.sin(x / 390 + seconds * speed + phase) - Math.sin(x / 390 + phase));
      const d = segments.map(({ command, values }) => {
        // Leave the closing edges outside the visible artwork fixed.
        if (!'MCS'.includes(command)) return command + values.join(' ');
        return command + values.map((value, i) => (i % 2 ? value + offset(values[i - 1]) : value).toFixed(2)).join(' ');
      }).join('');
      path.setAttribute('d', d);
    }
  };
  animateVisibleWaves(svg, draw);
})();

// Both backgrounds stop when out of view or when reduced motion is requested.
function animateVisibleWaves(svg, draw) {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let previous = null;
  let elapsed = 0;
  let visible = false;
  const tick = now => {
    if (previous !== null) elapsed += Math.min(now - previous, 64) / 1000;
    previous = now;
    draw(elapsed);
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    cancelAnimationFrame(frame);
    previous = null;
    if (reducedMotion.matches) draw(0);
    else if (visible && !document.hidden) frame = requestAnimationFrame(tick);
  };
  draw(0);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }).observe(svg);
  reducedMotion.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
}

// Small scroll-relative offsets add depth without moving the section layout.
(() => {
  const sections = [...document.querySelectorAll('.feature-section, .remember-section')];
  if (!sections.length) return;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  const update = () => {
    frame = 0;
    const mobile = innerWidth <= 650;
    const limit = mobile ? 12 : 28;
    const positions = sections.map(section => {
      const rect = section.getBoundingClientRect();
      return { section, distance: innerHeight / 2 - (rect.top + rect.height / 2) };
    });
    for (const { section, distance } of positions) {
      for (const element of section.children) {
        const isImage = element.tagName === 'FIGURE';
        const speed = isImage ? .065 : (mobile ? 0 : -.025);
        const offset = reducedMotion.matches ? 0 : Math.max(-limit, Math.min(limit, distance * speed));
        element.style.setProperty('--section-offset', `${offset.toFixed(2)}px`);
      }
    }
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('pageshow', schedule);
  reducedMotion.addEventListener('change', schedule);
  document.fonts.ready.then(schedule);
  update();
})();
