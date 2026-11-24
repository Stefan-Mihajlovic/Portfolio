// Older engines can still fade between the two independent documents.
export function connectFlightPassage(link) {
  if ('CSSViewTransitionRule' in window && 'onpagereveal' in window) return;
  const motion = matchMedia('(prefers-reduced-motion: no-preference)');
  const key = 'low-orbit-arrival';
  let curtain,
    departing = false;
  function cover() {
    curtain?.remove();
    curtain = document.createElement('div');
    curtain.setAttribute('aria-hidden', 'true');
    Object.assign(curtain.style, {
      position: 'fixed',
      inset: '0',
      background: '#101723',
      zIndex: 2147483646,
      pointerEvents: 'none',
    });
    document.body.append(curtain);
    return curtain;
  }
  function arrive() {
    departing = false;
    curtain?.remove();
    try {
      if (sessionStorage.getItem(key) !== location.pathname) return;
      sessionStorage.removeItem(key);
    } catch {
      return;
    }
    if (motion.matches) {
      const overlay = cover();
      overlay
        .animate([{ opacity: 1 }, { opacity: 0 }], { duration: 780, easing: 'cubic-bezier(.16,1,.3,1)' })
        .finished.then(() => overlay.remove());
    }
  }
  arrive();
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) arrive();
  });
  link.addEventListener('click', async (e) => {
    if (
      !motion.matches ||
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    )
      return;
    e.preventDefault();
    if (departing) return;
    departing = true;
    const target = new URL(link.href);
    try {
      sessionStorage.setItem(key, target.pathname);
    } catch {}
    const overlay = cover();
    await overlay.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 500,
      easing: 'ease-in',
      fill: 'forwards',
    }).finished;
    location.assign(target);
  });
}
