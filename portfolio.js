import { createScrollStars } from "/assets/sky/scroll-stars.js?v=20261023-1";

const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const touchScroll = matchMedia('(hover: none) and (pointer: coarse)');
// Preserve the mouse position when a new page appears beneath a stationary cursor.
let mousePosition;
document.addEventListener('pointermove', event => {
  if (event.pointerType === 'mouse') mousePosition = { clientX: event.clientX, clientY: event.clientY, pointerType: 'mouse' };
}, { capture: true, passive: true });
window.addEventListener('blur', () => { mousePosition = undefined; });
document.addEventListener('pointerleave', () => { mousePosition = undefined; });
const sky = createScrollStars(document.querySelector(".starfield"));
const planets = document.createElement('div');
planets.className = 'case-planets';
planets.setAttribute('aria-hidden', 'true');
planets.innerHTML = '<span class="case-planet planet-ringed"><i></i></span><span class="case-planet planet-moon"><i></i></span><span class="case-planet planet-distant"><i></i></span>';
document.body.append(planets);
let planetResizeObserver;
function travelPlanets(arriving) {
  planets.getAnimations({ subtree: true }).filter(animation => !animation.animationName).forEach(animation => animation.cancel());
  if (!motionEnabled() || planets.hidden) return;
  for (const planet of planets.children) {
    const rect = planet.getBoundingClientRect();
    const dx = rect.left + rect.width / 2 - innerWidth / 2;
    const dy = rect.top + rect.height / 2 - innerHeight / 2;
    planet.animate(arriving ? [
      { transform: `translate(${-dx * .65}px, ${-dy * .65}px) scale(.35)`, opacity: 0 },
      { transform: 'none', opacity: getComputedStyle(planet).opacity },
    ] : [
      { transform: 'none', opacity: getComputedStyle(planet).opacity },
      { transform: `translate(${dx * 1.4}px, ${dy * 1.4}px) scale(2.4)`, opacity: 0 },
    ], { duration: arriving ? 790 : 560, easing: arriving ? 'cubic-bezier(.16,1,.3,1)' : 'cubic-bezier(.55,0,1,.45)', fill: 'both' });
  }
}
const header = document.querySelector(".site-header");
const menu = document.querySelector(".menu-toggle");
const backToTop = document.querySelector(".back-to-top");
const dialog = document.querySelector(".image-dialog");
let paused = false;
try {
  paused = localStorage.getItem("portfolio-motion") === "paused";
} catch {}
let lenis,
  disposeName = () => {},
  disposeFooter = () => {},
  disposeReveals = () => {},
  disposeScrollCopy = () => {},
  disposeSkills = () => {},
  refreshScrollCopy = () => {},
  revealObserver,
  videoObserver,
  ambientObserver,
  navigating = false,
  returnFocus;
let currentKey = history.state?.portfolioKey || crypto.randomUUID();
history.replaceState({ ...history.state, portfolioKey: currentKey }, "");
history.scrollRestoration = "manual";
const positions = new Map();
const routes = new Set([
  "/",
  "/projects/",
  "/about/",
  "/skills/",
  "/contact/",
  "/optiflowz/",
  "/crimson-music/",
  "/eaes-video-corner/",
  "/case-studies/stefans-spinners/",
  "/case-studies/palette-pilot/",
  "/case-studies/tab-volume-manager/",
]);
const normalize = (path) =>
  path.replace(/index\.html$/, "").replace(/\/?$/, "/");
const motionEnabled = () => !paused && !reduced.matches;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const identity = header.querySelector('.identity');
const monogram = identity.querySelector('.monogram');
let logoTimer;
function playLogo() {
  clearTimeout(logoTimer);
  monogram.classList.remove('logo-playing');
  if (!motionEnabled()) return;
  // Restart deliberately on each click, without changing the logo's layout width.
  void monogram.offsetWidth;
  monogram.classList.add('logo-playing');
  logoTimer = setTimeout(() => monogram.classList.remove('logo-playing'), 2100);
}
identity.addEventListener('click', playLogo);
document.fonts.ready.then(playLogo);

function updateBackToTop() {
  const visible = scrollY > 180;
  backToTop.classList.toggle('is-visible', visible);
  backToTop.tabIndex = visible ? 0 : -1;
  backToTop.setAttribute('aria-hidden', String(!visible));
}
backToTop.addEventListener('click', () => {
  document.querySelector('main').focus({ preventScroll: true });
  if (lenis) lenis.scrollTo(0, { duration: 1.1 });
  else window.scrollTo({ top: 0, behavior: motionEnabled() ? 'smooth' : 'instant' });
});

function closeMenu() {
  const returnToToggle = document.body.classList.contains("menu-open") && header.querySelector("nav").contains(document.activeElement);
  document.body.classList.remove("menu-open");
  menu.setAttribute("aria-expanded", "false");
  menu.setAttribute("aria-label", "Open menu");
  document.querySelector("main").inert = false;
  if (returnToToggle) menu.focus({ preventScroll: true });
  lenis?.start();
}
menu.addEventListener("click", () => {
  document.body.classList.add("menu-animated");
  const open = !document.body.classList.contains("menu-open");
  closeMenu();
  if (open) {
    document.body.classList.add("menu-open");
    menu.setAttribute("aria-expanded", "true");
    menu.setAttribute("aria-label", "Close menu");
    lenis?.stop();
    document.querySelector("main").inert = true;
    header.querySelector("nav > a").focus({ preventScroll: true });
  }
});
document.querySelector(".menu-scrim").addEventListener("click", closeMenu);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && document.body.classList.contains("menu-open")) {
    closeMenu();
    menu.focus({ preventScroll: true });
  }
  if (e.key === "Tab" && document.body.classList.contains("menu-open")) {
    const links = [...header.querySelectorAll("nav a, nav button"), menu].filter(el => el.getClientRects().length);
    const first = links[0],
      last = links.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});
matchMedia("(min-width: 601px)").addEventListener("change", () => {
  // Breakpoint layout changes snap silently; only deliberate toggles animate.
  document.body.classList.remove("menu-animated");
  closeMenu();
});

function updateMotion() {
  if (!motionEnabled()) {
    clearTimeout(logoTimer);
    monogram.classList.remove('logo-playing');
    document.querySelector('.footer-brand')?.classList.remove('logo-playing');
    planets.getAnimations({ subtree: true }).filter(animation => !animation.animationName).forEach(animation => animation.cancel());
  }
  refreshScrollCopy();
  sky.setPaused(!motionEnabled());
  document.body.classList.toggle("motion-paused", !motionEnabled());
  const smoothWheel = motionEnabled() && !touchScroll.matches && window.Lenis;
  if (lenis && !smoothWheel) {
    lenis.destroy();
    lenis = undefined;
  }
  if (!lenis && smoothWheel) {
    lenis = new window.Lenis({
      autoRaf: true,
      duration: 1.15,
      smoothWheel: true,
      syncTouch: false,
    });
  }
  document.querySelectorAll(".motion-toggle").forEach((button) => {
    button.textContent = paused ? "Resume motion" : "Pause motion";
    button.setAttribute("aria-pressed", String(paused));
  });
  document.querySelectorAll(".project-film").forEach(updateVideo);
}
function updateVideo(video) {
  if (
    !motionEnabled() ||
    document.hidden ||
    video.dataset.visible !== "true" ||
    navigator.connection?.saveData
  ) {
    video.pause();
    return;
  }
  if (!video.src) video.src = video.dataset.src;
  video.play().catch(() => {
    /* The poster remains visible when autoplay is unavailable. */
  });
}
reduced.addEventListener("change", updateMotion);
touchScroll.addEventListener('change', updateMotion);
document.addEventListener("visibilitychange", () => {
  document.body.classList.toggle('document-hidden', document.hidden);
  document.querySelectorAll(".project-film").forEach(updateVideo);
});

function initProjectNameStars() {
  const sparkle = '<svg class="name-spark" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M16 0C18 11 21 14 32 16C21 18 18 21 16 32C14 21 11 18 0 16C11 14 14 11 16 0Z" fill="currentColor"/></svg>';
  const decorate = (letter, character) => {
    letter.classList.add(`name-star-${character}`);
    letter.innerHTML = (character === 'i' ? 'ı' : '<span class="j-stem">j</span>') + sparkle;
  };
  document.querySelectorAll('.case-page h1 .name-char, main[data-page="skills"] h1 .name-char').forEach(letter => {
    if (/^[ij]$/.test(letter.textContent)) decorate(letter, letter.textContent);
  });
  document.querySelectorAll('.work-caption h3 a:not([data-starred])').forEach(link => {
    const name = link.textContent;
    link.setAttribute('aria-label', name);
    link.dataset.starred = 'true';
    link.textContent = '';
    name.split(/(\s+)/).forEach(part => {
      if (/^\s+$/.test(part)) { link.append(document.createTextNode(part)); return; }
      const word = document.createElement('span');
      word.className = 'project-name-word';
      word.setAttribute('aria-hidden', 'true');
      for (const character of part) {
        if (/^[ij]$/.test(character)) {
          const letter = document.createElement('span');
          decorate(letter, character);
          word.append(letter);
        } else word.append(document.createTextNode(character));
      }
      link.append(word);
    });
  });
}

function initName(title = document.querySelector('main h1'), entrance = true) {
  if (title && !title.querySelector('.name-char')) {
    // Preserve explicit line breaks and natural word wrapping, with one accessible label.
    title.setAttribute('aria-label', title.innerText.trim().replace(/\s+/g, ' '));
    let index = 0;
    const split = node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const fragment = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).filter(Boolean).forEach(word => {
          if (/^\s+$/.test(word)) { fragment.append(document.createTextNode(word)); return; }
          const wrapper = document.createElement('span');
          wrapper.className = 'title-word'; wrapper.setAttribute('aria-hidden', 'true');
          [...word].forEach(character => {
            const letter = document.createElement('span'); letter.className = 'name-char';
            letter.style.setProperty('--char', index++); letter.textContent = character;
            const anchor = document.createElement('span'); anchor.className = 'name-anchor';
            anchor.append(letter); wrapper.append(anchor);
          });
          fragment.append(wrapper);
        });
        node.replaceWith(fragment);
      } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'BR') {
        [...node.childNodes].forEach(split);
      }
    };
    [...title.childNodes].forEach(split);
  }
  if (!title) return () => {};
  const letters = [...title.querySelectorAll('.name-char')];
  // Home ships pre-split letters in its HTML; give those the same stable anchors.
  letters.forEach(letter => {
    if (letter.parentElement.classList.contains('name-anchor')) return;
    const anchor = document.createElement('span'); anchor.className = 'name-anchor';
    letter.replaceWith(anchor); anchor.append(letter);
  });
  // Start only after the pre-split home letters have their final DOM structure.
  title.classList.add(entrance ? 'animated-title' : 'name-ready');
  const values = letters.map(() => ({ y: 0, target: 0 }));
  let frame = 0, previous = 0, active = false;
  let centers = [], bounds;
  const finishEntrance = () => {
    if (title.classList.contains('name-ready')) return;
    title.classList.add('name-ready');
    title.dispatchEvent(new Event('title-ready'));
    refreshPointer();
  };
  const onEntranceEnd = event => {
    if (event.animationName === 'name-form' &&
        (event.target === letters.at(-1) || !motionEnabled())) finishEntrance();
  };
  title.addEventListener('animationend', onEntranceEnd);
  title.addEventListener('animationcancel', onEntranceEnd);
  if (!motionEnabled() || !letters.length) finishEntrance();
  function settle(time) {
    frame = 0;
    const dt = Math.max(0, Math.min((time - previous) / 1000, .05));
    previous = time;
    let moving = false;
    values.forEach((value, index) => {
      const target = motionEnabled() ? value.target : 0;
      // Follow immediately, with only a short time-based smoothing of the motion.
      value.y += (target - value.y) * (1 - Math.exp(-40 * dt));
      if (Math.abs(value.y - target) > .025) moving = true;
      else value.y = target;
      // Independent transforms let hover respond even during the entrance animation.
      letters[index].style.translate = `0 ${value.y}px`;
    });
    if (moving) frame = requestAnimationFrame(settle);
  }
  function start() { if (!frame) { previous = performance.now(); frame = requestAnimationFrame(settle); } }
  function measure() {
    bounds = title.getBoundingClientRect();
    // Anchors stay in the text layout while their children enter and react to hover.
    centers = letters.map(el => {
      const r = el.parentElement.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
  }
  function move(e) {
    if (!motionEnabled() || e.pointerType !== 'mouse') return;
    // Only measure letters inside the footer's moving hit area, never on every page move.
    if (!entrance) { bounds = title.getBoundingClientRect(); centers = []; }
    if (!bounds) bounds = title.getBoundingClientRect();
    const inside = e.clientX >= bounds.left && e.clientX <= bounds.right &&
      e.clientY >= bounds.top && e.clientY <= bounds.bottom;
    if (!inside) { if (active) leave(); return; }
    if (!centers.length) measure();
    active = true;
    values.forEach((value, i) => {value.target = -19 * Math.exp(-(((e.clientX - centers[i].x) / 100) ** 2 + ((e.clientY - centers[i].y) / 95) ** 2));});
    start();
  }
  function leave() { active = false; values.forEach(v => v.target = 0); start(); }
  function refreshPointer() { bounds = undefined; centers = []; if (mousePosition) move(mousePosition); }
  let disposed = false;
  document.addEventListener('pointermove', move, { capture: true, passive: true });
  document.addEventListener('pointerleave', leave);
  window.addEventListener('blur', leave);
  window.addEventListener('scroll', refreshPointer, { passive: true });
  window.addEventListener('resize', refreshPointer);
  document.fonts.ready.then(() => { if (!disposed) refreshPointer(); });
  refreshPointer();
  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    title.removeEventListener('animationend', onEntranceEnd);
    title.removeEventListener('animationcancel', onEntranceEnd);
    document.removeEventListener('pointermove', move, true);
    document.removeEventListener('pointerleave', leave);
    window.removeEventListener('blur', leave);
    window.removeEventListener('scroll', refreshPointer);
    window.removeEventListener('resize', refreshPointer);
  };
}

function initFooter() {
  const brand = document.querySelector('.footer-brand');
  if (!brand) return () => {};
  const footer = brand.closest('.site-footer');
  const disposeHover = initName(brand.querySelector('.footer-wordmark'), false);
  let played = false;
  const reset = () => {
    played = false;
    brand.classList.remove('logo-playing');
  };
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      // Let the signature finish naturally; re-arm only after the entire footer leaves.
      if (entry.target === footer) {
        if (!entry.isIntersecting) reset();
        continue;
      }
      if (!entry.isIntersecting || entry.intersectionRatio < .75 || played || !motionEnabled()) continue;
      played = true;
      brand.classList.add('logo-playing');
    }
  }, { threshold: [0, .75] });
  observer.observe(footer);
  observer.observe(brand);
  return () => { observer.disconnect(); reset(); disposeHover(); };
}

function initScrollCopy() {
  const paragraphs = [...document.querySelectorAll('.bio-copy > p, .case-story .story-row > p')];
  if (!paragraphs.length) return () => {};
  const records = paragraphs.map(paragraph => {
    // Wrap text nodes rather than replacing HTML so links keep their semantics.
    const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    const letters = [], words = [];
    nodes.forEach(node => {
      const fragment = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(token => {
        if (!token) return;
        if (/^\s+$/.test(token)) { fragment.append(token); return; }
        const word = document.createElement('span');
        word.className = 'scroll-word';
        Array.from(token).forEach(character => {
          const letter = document.createElement('span');
          letter.className = 'scroll-letter';
          letter.textContent = character;
          word.append(letter);
          letters.push(letter);
        });
        words.push({ element: word, end: letters.length });
        fragment.append(word);
      });
      node.replaceWith(fragment);
    });
    paragraph.classList.add('scroll-copy');
    return { paragraph, letters, words };
  });
  const letters = records.flatMap(record => record.letters);
  let offset = 0;
  const words = records.flatMap(record => {
    const result = record.words.map(word => ({ ...word, end: word.end + offset }));
    offset += record.letters.length;
    return result;
  });
  let lines = [], previousCount = -1;
  let frame = 0, previousTime = 0, disposed = false;
  const clamp = value => Math.max(0, Math.min(1, value));
  function render(time) {
    frame = 0;
    const enabled = motionEnabled();
    // A single reading frontier follows the actual wrapped lines across all paragraphs.
    const frontier = scrollY + innerHeight * .56;
    const targetCount = enabled ? lines.reduce((total, line) =>
      total + clamp((frontier - line.top) / line.height) * line.length, 0) : letters.length;
    // Ease only the color frontier, keeping words still and in reading order.
    // Layout refreshes and reduced motion settle immediately.
    const dt = previousTime && time ? Math.max(0, Math.min((time - previousTime) / 1000, .05)) : 1 / 60;
    previousTime = time || 0;
    const easing = enabled && time && previousCount >= 0;
    const count = easing && Math.abs(targetCount - previousCount) > .02
      ? previousCount + (targetCount - previousCount) * (1 - Math.exp(-dt * 12))
      : targetCount;
    if (Math.abs(count - targetCount) > .02) frame = requestAnimationFrame(render);
    if (count === previousCount) return;
    // Only the interval crossed by the reading frontier can have changed.
    const from = previousCount < 0 ? 0 : Math.floor(Math.min(previousCount, count));
    const to = previousCount < 0 ? letters.length : Math.min(letters.length, Math.ceil(Math.max(previousCount, count)));
    for (let i = from; i < to; i++) {
      const opacity = String(.24 + .76 * clamp(count - i));
      if (letters[i].style.opacity !== opacity) letters[i].style.opacity = opacity;
    }
    previousCount = count;
  }

  function onScroll() {
    if (!frame) { previousTime = performance.now(); frame = requestAnimationFrame(render); }
  }
  function refresh() {
    cancelAnimationFrame(frame);
    lines = [];
    let start = 0;
    const lineHeights = new Map(records.map(({ paragraph }) =>
      [paragraph, parseFloat(getComputedStyle(paragraph).lineHeight)]));
    words.forEach(word => {
      const rect = word.element.getBoundingClientRect();
      const top = rect.top + scrollY;
      let line = lines.at(-1);
      if (!line || Math.abs(line.top - top) > 2) {
        // Fill over the full line spacing, rather than just the glyph height.
        const paragraph = word.element.closest('.scroll-copy');
        line = { top, height: Math.max(rect.height, lineHeights.get(paragraph) || 0), length: 0, end: 0 };
        lines.push(line);
      }
      line.length += word.end - start;
      line.end = word.end;
      start = word.end;
    });
    render();
  }
  refreshScrollCopy = refresh;
  addEventListener('scroll', onScroll, { passive: true });
  let measuredWidth = innerWidth;
  const onResize = () => {
    // Safari's toolbar changes viewport height without rewrapping these lines.
    if (touchScroll.matches && innerWidth === measuredWidth) { onScroll(); return; }
    measuredWidth = innerWidth;
    refresh();
  };
  addEventListener('resize', onResize);
  document.fonts.ready.then(() => { if (!disposed) refresh(); });
  refresh();
  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    removeEventListener('scroll', onScroll);
    removeEventListener('resize', onResize);
    records.forEach(({ paragraph, words }) => {
      words.forEach(({ element }) => element.replaceWith(element.textContent));
      paragraph.normalize();
      paragraph.classList.remove('scroll-copy');
    });
    refreshScrollCopy = () => {};
  };
}

function initCaseMotion() {
  const main = document.querySelector('main');
  if (!main.classList.contains('case-page')) return;
  main.classList.add('case-page');
  main.querySelectorAll('.page-intro > p, .story-row h2, .case-meta h2, .case-trailer h2').forEach(element => {
    if (element.classList.contains('case-type')) return;
    const text = element.textContent.trim().replace(/\s+/g, ' ');
    const accessible = document.createElement('span');
    accessible.className = 'sr-only';
    accessible.textContent = text;
    const visual = document.createElement('span');
    visual.setAttribute('aria-hidden', 'true');
    let index = 0;
    const spread = element.matches('.page-intro > p') ? 550 : 320;
    text.split(/(\s+)/).forEach(token => {
      if (/^\s+$/.test(token)) { visual.append(token); index += token.length; return; }
      const word = document.createElement('span');
      word.className = 'type-word';
      Array.from(token).forEach(character => {
        const letter = document.createElement('span');
        letter.className = 'type-char';
        letter.style.setProperty('--letter-delay', `${Math.round(index++ / Math.max(1, text.length - 1) * spread)}ms`);
        letter.textContent = character;
        word.append(letter);
      });
      visual.append(word);
    });
    element.replaceChildren(accessible, visual);
    element.classList.add('case-type');
  });
  // Each image enters when it is in view, including galleries stacked on mobile.
  main.querySelectorAll('.case-gallery').forEach(gallery => {
    gallery.classList.remove('reveal');
    gallery.querySelectorAll('.gallery-image').forEach(image => image.classList.add('reveal'));
  });
  main.querySelectorAll('.case-trailer').forEach(trailer => trailer.classList.add('reveal'));
}

function initSkills() {
  const buttons = [...document.querySelectorAll('.skill-name')];
  if (!buttons.length) return () => {};
  const events = new AbortController();
  const card = document.createElement('div');
  card.className = 'skill-preview';
  card.id = 'skill-preview';
  card.role = 'tooltip';
  card.setAttribute('aria-hidden', 'true');
  card.innerHTML = '<div class="skill-preview-content"><div class="skill-preview-art"><img alt="" width="64" height="64"></div><strong></strong><p></p></div>';
  document.body.append(card);
  const content = card.querySelector('.skill-preview-content');
  buttons.forEach(button => { const image = new Image(); image.src = button.dataset.skillIcon; });
  let active = null, hideTimer, contentAnimation;
  const on = (el, event, fn) => el.addEventListener(event, fn, { signal: events.signal });
  const position = () => {
    if (!active) return;
    const rect = active.getBoundingClientRect();
    const width = card.offsetWidth, height = card.offsetHeight;
    const left = Math.max(16, Math.min(innerWidth - width - 16, rect.left + rect.width / 2 - width / 2));
    const above = rect.top - height - 14;
    const top = above > header.getBoundingClientRect().bottom + 12 ? above : rect.bottom + 14;
    card.style.left = `${left}px`;
    card.style.top = `${Math.max(12, Math.min(innerHeight - height - 12, top))}px`;
  };
  const hide = () => {
    clearTimeout(hideTimer);
    contentAnimation?.cancel();
    active?.removeAttribute('aria-describedby');
    active?.classList.remove('skill-active');
    active = null;
    card.classList.remove('is-visible');
    card.setAttribute('aria-hidden', 'true');
  };
  const show = (button) => {
    clearTimeout(hideTimer);
    if (active !== button) {
      const changing = active && card.classList.contains('is-visible');
      active?.removeAttribute('aria-describedby');
      active?.classList.remove('skill-active');
      active = button;
      card.querySelector('img').src = button.dataset.skillIcon;
      card.querySelector('strong').textContent = button.textContent;
      card.querySelector('p').textContent = button.dataset.skillDescription;
      card.style.setProperty('--skill-color', button.dataset.skillColor);
      contentAnimation?.cancel();
      if (changing && motionEnabled()) {
        contentAnimation = content.animate([
          { opacity: .15, transform: 'translateY(6px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ], { duration: 300, easing: 'cubic-bezier(.22, 1, .36, 1)' });
      }
    }
    button.setAttribute('aria-describedby', card.id);
    button.classList.add('skill-active');
    card.setAttribute('aria-hidden', 'false');
    position();
    card.classList.add('is-visible');
  };
  const leave = () => { hideTimer = setTimeout(hide, 220); };
  for (const button of buttons) {
    on(button, 'pointerenter', e => { if (e.pointerType !== 'touch') show(button); });
    on(button, 'pointerleave', leave);
    on(button, 'focus', () => show(button));
    on(button, 'blur', leave);
    on(button, 'click', () => show(button));
  }
  on(card, 'pointerenter', () => clearTimeout(hideTimer));
  on(card, 'pointerleave', leave);
  on(document, 'keydown', e => { if (e.key === 'Escape') hide(); });
  on(document, 'pointerdown', e => { if (!e.target.closest('.skill-name, .skill-preview')) hide(); });
  on(window, 'scroll', hide);
  on(window, 'resize', hide);
  return () => { hide(); events.abort(); card.remove(); };
}

function initPage() {
  const theme = document.querySelector('main').dataset.spaceTheme;
  if (theme) document.body.dataset.spaceTheme = theme;
  else delete document.body.dataset.spaceTheme;
  const casePage = document.querySelector('main.case-page');
  planetResizeObserver?.disconnect();
  planets.hidden = !casePage;
  if (casePage) {
    const sizePlanets = () => { planets.style.height = `${casePage.offsetTop + casePage.offsetHeight}px`; };
    sizePlanets();
    planetResizeObserver = new ResizeObserver(sizePlanets);
    planetResizeObserver.observe(casePage);
    travelPlanets(true);
  }
  disposeSkills();
  disposeSkills = initSkills();
  initCaseMotion();
  disposeScrollCopy();
  disposeScrollCopy = initScrollCopy();
  updateBackToTop();
  disposeName();
  disposeName = initName();
  disposeFooter();
  disposeFooter = initFooter();
  initProjectNameStars();
  disposeReveals();
  revealObserver?.disconnect();
  videoObserver?.disconnect();
  ambientObserver?.disconnect();
  if ("IntersectionObserver" in window) {
    document.documentElement.classList.add("js-motion");
    document.documentElement.dataset.motionReady = 'true';
    const main = document.querySelector('main');
    const title = main.querySelector('h1');
    const intro = title?.closest('.home-intro, .page-intro, .contact-details');
    const supporting = intro ? [...intro.children].filter(el => el !== title).flatMap(el =>
      el.classList.contains('hero-details') ? [...el.children] : [el]) : [];
    supporting.forEach(el => el.classList.add('reveal', 'intro-step'));
    // The heading owns the opening beat; its surrounding section must not mask it.
    intro?.classList.add('revealed');
    main.classList.add('sequence-ready');
    const started = performance.now();
    // Content starts alongside the title, independent of its animation length.
    const introStart = 160;
    const supportingStart = intro?.classList.contains('home-intro') ? 900 : introStart;
    const atTop = scrollY < 120;
    const contentStart = atTop ? started + introStart + (supporting.length ? (supporting.length - 1) * 80 + 120 : 100) : started;
    const pending = new Map();
    let nextSlot = contentStart;
    const show = el => {
      pending.delete(el);
      el.classList.add('revealed');
      revealObserver?.unobserve(el);
    };
    revealObserver = new IntersectionObserver(entries => {
      entries.sort((a, b) => a.target === b.target ? 0 : a.target.compareDocumentPosition(b.target) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
      entries.forEach(entry => {
        const el = entry.target;
        if (!entry.isIntersecting) {
          if (pending.has(el)) { clearTimeout(pending.get(el)); pending.delete(el); }
          return;
        }
        if (el.classList.contains('revealed') || pending.has(el)) return;
        if (!motionEnabled()) { show(el); return; }
        const now = performance.now();
        if (!pending.size) nextSlot = Math.max(now, contentStart);
        const introIndex = supporting.indexOf(el);
        const due = introIndex >= 0 && atTop
          ? Math.max(now, started + supportingStart + introIndex * 80)
          : Math.max(now, contentStart, nextSlot);
        if (introIndex < 0) nextSlot = due + 80;
        pending.set(el, setTimeout(() => show(el), due - now));
      });
    }, { threshold: 0.06 });
    main.querySelectorAll('.reveal:not(.revealed)').forEach(el => revealObserver.observe(el));
    const revealFocused = event => {
      let el = event.target;
      while (el && el !== main) {
        if (el.classList.contains('reveal')) {
          clearTimeout(pending.get(el)); show(el);
        }
        el = el.parentElement;
      }
    };
    main.addEventListener('focusin', revealFocused);
    disposeReveals = () => {
      pending.forEach(clearTimeout);
      pending.clear();
      main.removeEventListener('focusin', revealFocused);
    };
    videoObserver = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          entry.target.dataset.visible = String(entry.isIntersecting);
          updateVideo(entry.target);
        }),
      { rootMargin: "80px", threshold: 0 },
    );
    document
      .querySelectorAll(".project-film")
      .forEach((el) => videoObserver.observe(el));
    // Keep all visible motion, but suspend decorative loops outside the viewport.
    ambientObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('motion-offscreen', !entry.isIntersecting));
    }, { rootMargin: '80px' });
    main.querySelectorAll('.name-spark, .about-title-spark, .portrait-strip figure').forEach(el => ambientObserver.observe(el));
  }
  document.querySelectorAll(".site-header nav a, .footer-links a").forEach((link) => {
    link.removeAttribute("aria-current");
    if (normalize(link.pathname) === normalize(location.pathname))
      link.setAttribute("aria-current", "page");
  });
  document
    .querySelectorAll("[data-year]")
    .forEach((el) => (el.textContent = new Date().getFullYear()));
  document.querySelector(".motion-toggle")?.addEventListener("click", () => {
    paused = !paused;
    try {
      localStorage.setItem("portfolio-motion", paused ? "paused" : "playing");
    } catch {}
    updateMotion();
  });
  document.querySelectorAll(".gallery-image").forEach((button) =>
    button.addEventListener("click", () => openViewer(button)),
  );
  document
    .querySelector("#contactForm")
    ?.addEventListener("submit", submitContact);
  document.querySelectorAll('.copy-email').forEach(button => {
    if (button.dataset.bound) return;
    button.dataset.bound = 'true';
    const label = button.textContent;
    button.setAttribute('aria-label', label);
    button.title = label;
    button.setAttribute('aria-live', 'polite');
    button.addEventListener('click', async () => {
      if (button.disabled) return;
      button.disabled = true;
      try {
        await navigator.clipboard.writeText('stefan@optiflowz.com');
        button.textContent = 'Copied';
        button.dataset.copyState = 'copied';
        button.setAttribute('aria-label', 'Email copied');
      } catch {
        button.textContent = 'Use the email link';
        button.dataset.copyState = 'error';
        button.setAttribute('aria-label', 'Could not copy. Use the email link.');
      }
      setTimeout(() => {
        if (button.isConnected) { button.textContent = label; button.disabled = false; delete button.dataset.copyState; button.setAttribute('aria-label', label); }
      }, 2200);
    });
  });
  document.querySelectorAll('.social-copy').forEach(button => {
    if (button.dataset.bound) return;
    button.dataset.bound = 'true';
    button.addEventListener('click', async () => {
      const status = button.querySelector('[role="status"]');
      try {
        await navigator.clipboard.writeText(button.dataset.copyText);
        status.textContent = 'Discord username copied';
        button.title = 'Copied: ' + button.dataset.copyText;
      } catch {
        status.textContent = 'Discord: ' + button.dataset.copyText;
        button.title = status.textContent;
      }
    });
  });
  updateMotion();
}
const viewerImage = dialog.querySelector('img');
let viewerSource, viewerAnimation, viewerClosing = false, viewerToken = 0;
function viewerFit() {
  const availableWidth = innerWidth - (innerWidth <= 600 ? 32 : 96);
  const availableHeight = innerHeight - 144;
  const ratio = viewerImage.naturalWidth / viewerImage.naturalHeight || 16 / 9;
  const width = Math.min(availableWidth, availableHeight * ratio);
  const height = width / ratio;
  Object.assign(viewerImage.style, {
    width: `${width}px`, height: `${height}px`,
    left: `${(innerWidth - width) / 2}px`, top: `${(innerHeight - height) / 2}px`,
  });
}
function viewerTransform(rect) {
  const width = parseFloat(viewerImage.style.width), height = parseFloat(viewerImage.style.height);
  return `translate(${rect.left - parseFloat(viewerImage.style.left)}px, ${rect.top - parseFloat(viewerImage.style.top)}px) scale(${rect.width / width}, ${rect.height / height})`;
}
async function openViewer(button) {
  if (viewerClosing) return;
  const token = ++viewerToken;
  const image = button.querySelector('img');
  const wasOpen = dialog.open;
  viewerAnimation?.cancel();
  if (viewerSource) viewerSource.style.visibility = '';
  viewerSource = image;
  returnFocus = button;
  viewerImage.src = image.currentSrc || image.src;
  viewerImage.alt = image.alt;
  try { await viewerImage.decode(); } catch { /* Keep the loaded thumbnail if decoding is unavailable. */ }
  if (token !== viewerToken) return;
  const sourceRect = image.getBoundingClientRect();
  viewerFit();
  if (!wasOpen) dialog.showModal();
  lenis?.stop();
  document.documentElement.classList.add('viewer-open');
  image.style.visibility = 'hidden';
  const images = [...document.querySelectorAll('.gallery-image')];
  dialog.querySelector('.viewer-count').textContent = `${images.indexOf(button) + 1} / ${images.length}`;
  dialog.querySelectorAll('.viewer-prev, .viewer-next').forEach(control => { control.hidden = images.length < 2; });
  void dialog.offsetWidth;
  dialog.classList.add('is-viewing');
  if (motionEnabled()) {
    viewerAnimation = viewerImage.animate(wasOpen ? [
      { opacity: 0, transform: 'scale(.985)' }, { opacity: 1, transform: 'none' },
    ] : [
      { transform: viewerTransform(sourceRect), borderRadius: '16px' },
      { transform: 'none', borderRadius: '4px' },
    ], { duration: wasOpen ? 280 : 650, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'both' });
  }
}
async function closeViewer(immediate = false) {
  ++viewerToken;
  if (!dialog.open || viewerClosing) return;
  viewerClosing = true;
  const current = viewerImage.getBoundingClientRect();
  viewerAnimation?.cancel();
  dialog.classList.remove('is-viewing');
  if (!immediate && motionEnabled() && viewerSource?.isConnected) {
    const target = viewerSource.getBoundingClientRect();
    const inView = target.bottom > 0 && target.top < innerHeight;
    viewerAnimation = viewerImage.animate([
      { transform: viewerTransform(current), opacity: 1 },
      { transform: inView ? viewerTransform(target) : 'scale(.98)', opacity: inView ? 1 : 0, borderRadius: '16px' },
    ], { duration: 450, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'both' });
    try { await viewerAnimation.finished; } catch {}
  }
  dialog.close();
}
function stepViewer(direction) {
  if (viewerClosing) return;
  const images = [...document.querySelectorAll('.gallery-image')];
  if (images.length < 2) return;
  const index = (images.indexOf(returnFocus) + direction + images.length) % images.length;
  openViewer(images[index]);
}
dialog.querySelector('.dialog-close').addEventListener('click', () => closeViewer());
dialog.querySelector('.viewer-prev').addEventListener('click', () => stepViewer(-1));
dialog.querySelector('.viewer-next').addEventListener('click', () => stepViewer(1));
dialog.addEventListener('click', e => { if (e.target === dialog) closeViewer(); });
dialog.addEventListener('cancel', e => { e.preventDefault(); closeViewer(); });
dialog.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); stepViewer(e.key === 'ArrowLeft' ? -1 : 1); }
});
window.addEventListener('resize', () => {
  if (dialog.open && !viewerClosing) { viewerAnimation?.cancel(); viewerFit(); }
});
dialog.addEventListener('close', () => {
  viewerAnimation?.cancel();
  if (viewerSource) viewerSource.style.visibility = '';
  viewerSource = null;
  viewerClosing = false;
  dialog.classList.remove('is-viewing');
  document.documentElement.classList.remove('viewer-open');
  lenis?.start();
  if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
});

async function submitContact(e) {
  e.preventDefault();
  const form = e.currentTarget,
    button = form.querySelector("button[type=submit]"),
    status = form.querySelector("#form-status");
  if (button.disabled) return;
  button.disabled = true;
  button.textContent = "Sending…";
  status.textContent = "";
  const data = Object.fromEntries(new FormData(form));
  try {
    const response = await fetch("/.netlify/functions/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw Error("Message could not be sent");
    status.textContent =
      "Message sent. Thanks for reaching out — I’ll be in touch.";
    form.reset();
  } catch {
    status.innerHTML =
      'Your message wasn’t sent. Please try again or email <a href="mailto:stefan@optiflowz.com">stefan@optiflowz.com</a>.';
  } finally {
    button.disabled = false;
    button.textContent = "Send message";
  }
}

async function navigate(url, { pop = false, key, point } = {}) {
  if (navigating) return;
  if (dialog.open) await closeViewer(true);
  navigating = true;
  closeMenu();
  const oldMain = document.querySelector("main");
  const animate = motionEnabled();
  try {
    // Fetch first, so slow connections never leave an empty page behind.
    const response = await fetch(url, {
      headers: { "X-Portfolio-Navigation": "1" },
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw Error("Navigation unavailable");
    const next = new DOMParser().parseFromString(
      await response.text(),
      "text/html",
    );
    const nextMain = next.querySelector("body[data-portfolio] main");
    if (!nextMain) throw Error("External page");
    if (animate) {
      document.body.classList.add("in-transit");
      oldMain.classList.add("is-leaving");
      sky.travel();
      travelPlanets(false);
      await wait(560);
    }
    oldMain.querySelectorAll("video").forEach((v) => v.pause());
    if (!pop) {
      key = crypto.randomUUID();
      history.pushState({ portfolioKey: key }, "", url);
    }
    currentKey = key || crypto.randomUUID();
    document.title = next.title;
    for (const selector of [
      'meta[name="description"]',
      'link[rel="canonical"]',
      'meta[property="og:title"]',
      'meta[property="og:url"]',
      'meta[property="og:description"]',
    ]) {
      const replacement = next.querySelector(selector),
        existing = document.querySelector(selector);
      if (replacement && existing) existing.replaceWith(replacement);
    }
    // Prepare the new DOM invisibly; no uninitialized content can flash on screen.
    nextMain.classList.add('route-preparing');
    oldMain.replaceWith(nextMain);
    const top = pop ? positions.get(currentKey) || 0 : 0;
    if (lenis) { lenis.resize(); lenis.scrollTo(top, { immediate: true, force: true }); }
    else window.scrollTo({ top, behavior: "instant" });
    sky.resetScroll();
    initPage();
    if (animate) nextMain.classList.add("is-arriving");
    nextMain.classList.remove('route-preparing');
    nextMain.focus({ preventScroll: true });
    if (url.hash) {
      const target = document.getElementById(
        decodeURIComponent(url.hash.slice(1)),
      );
      if (target) {
        if (lenis) lenis.scrollTo(target, { immediate: true, offset: -110 });
        else target.scrollIntoView();
      }
    }
    if (animate) {
      const arrival = nextMain.getAnimations().find(animation => animation.animationName === 'page-arrive');
      if (arrival) await arrival.finished.catch(() => {});
    }
    nextMain.classList.remove("is-arriving");
  } catch {
    location.assign(url.href);
  } finally {
    navigating = false;
    document.body.classList.remove("in-transit");
    oldMain.classList.remove("is-leaving");
  }
}
document.addEventListener("click", (e) => {
  const link = e.target.closest("a[href]");
  if (
    !link ||
    e.defaultPrevented ||
    e.button !== 0 ||
    e.metaKey ||
    e.ctrlKey ||
    e.shiftKey ||
    e.altKey ||
    link.target === "_blank" ||
    link.hasAttribute("download")
  )
    return;
  const url = new URL(link.href);
  if (url.origin !== location.origin || !routes.has(normalize(url.pathname)))
    return;
  if (url.pathname === location.pathname && url.search === location.search) {
    if (url.hash) {
      const target = document.getElementById(
        decodeURIComponent(url.hash.slice(1)),
      );
      if (!target) return;
      e.preventDefault();
      closeMenu();
      if (lenis) lenis.scrollTo(target, { offset: -110 });
      else
        target.scrollIntoView({
          behavior: motionEnabled() ? "smooth" : "instant",
        });
    } else {
      e.preventDefault();
      closeMenu();
      if (lenis) lenis.scrollTo(0);
      else
        window.scrollTo({
          top: 0,
          behavior: motionEnabled() ? "smooth" : "instant",
        });
    }
    return;
  }
  e.preventDefault();
  navigate(url, {
    point: { x: e.clientX || innerWidth / 2, y: e.clientY || innerHeight / 2 },
  });
});
window.addEventListener("popstate", (e) => {
  if (navigating) {
    location.reload();
    return;
  }
  navigate(new URL(location.href), { pop: true, key: e.state?.portfolioKey });
});
window.addEventListener(
  "scroll",
  () => {
    header.classList.toggle("scrolled", scrollY > 30);
    updateBackToTop();
    if (!navigating) positions.set(currentKey, scrollY);
  },
  { passive: true },
);
window.addEventListener("pageshow", (e) => {
  if (e.persisted) {
    closeMenu();
    document.body.classList.remove("in-transit");
    initPage();
  }
});
initPage();
