import { connectFlightPassage } from './flight-passage.js';
// One visitor per document, including client-side page changes.
export function scheduleShipVisit() {
  const ship = document.createElement('a');
  ship.className = 'visiting-ship';
  ship.href = '/secret-game/';
  ship.setAttribute('aria-label', 'Pilot the ship in Low Orbit');
  ship.hidden = true;
  document.body.append(ship);
  connectFlightPassage(ship);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const visitPeriod = 30_000;
  let nextVisitAt = performance.now() + visitPeriod;
  let flight, timer;
  let fromLeft = Math.random() < 0.5;
  function depart() {
    clearTimeout(timer);
    if (flight) {
      flight.onfinish = null;
      flight.cancel();
      flight = undefined;
    }
    ship.hidden = true;
    if (!document.hidden) timer = setTimeout(visit, Math.max(0, nextVisitAt - performance.now()));
  }
  function visit() {
    if (document.hidden) return;
    if (document.querySelector('dialog[open]') || document.body.classList.contains('menu-open')) {
      timer = setTimeout(visit, 5000);
      return;
    }
    nextVisitAt = performance.now() + visitPeriod;
    fromLeft = !fromLeft;
    ship.style.left = fromLeft ? '0' : 'auto';
    ship.style.right = fromLeft ? 'auto' : '0';
    ship.style.top = 30 + Math.random() * 36 + '%';
    ship.hidden = false;
    if (reduced.matches) {
      ship.style.transform = 'rotate(' + (fromLeft ? 75 : -75) + 'deg)';
      timer = setTimeout(() => {
        if (!ship.matches(':hover, :focus')) depart();
      }, 12000);
      return;
    }
    const sign = fromLeft ? 1 : -1;
    const reach = innerWidth * (0.23 + Math.random() * 0.18);
    const bend = Math.min(innerHeight * 0.14, 108) * (Math.random() < 0.5 ? -1 : 1);
    const ripple = (0.15 + Math.random() * 0.38) * bend;
    const drift = (Math.random() - 0.5) * reach * 0.25;
    // Sample a continuous arc. Its tangent gives the nose its heading, including at the turn.
    let previousHeading;
    const path = Array.from({ length: 81 }, (_, i) => {
      const t = i / 80,
        a = Math.PI * t;
      const x = -82 + (reach + 82) * Math.sin(a) + drift * Math.sin(2 * a);
      const y = bend * Math.cos(a) + ripple * Math.sin(2 * a);
      const dx = sign * ((reach + 82) * Math.cos(a) + 2 * drift * Math.cos(2 * a));
      const dy = -bend * Math.sin(a) + 2 * ripple * Math.cos(2 * a);
      let heading = (Math.atan2(dx, -dy) * 180) / Math.PI;
      if (previousHeading !== undefined) heading += 360 * Math.round((previousHeading - heading) / 360);
      previousHeading = heading;
      return { transform: `translate(${sign * x}px, ${y}px) rotate(${heading}deg)` };
    });
    flight = ship.animate(path, { duration: 8500 + Math.random() * 4400, fill: 'both' });
    flight.onfinish = depart;
  }
  function hold() {
    flight?.pause();
  }
  function release() {
    if (ship.matches(':hover, :focus')) return;
    if (flight) {
      flight.updatePlaybackRate(1);
      flight.play();
    } else if (!ship.hidden) depart();
  }
  ship.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'touch') flight?.updatePlaybackRate(0.18);
  });
  ship.addEventListener('pointerleave', release);
  ship.addEventListener('focus', hold);
  ship.addEventListener('blur', release);
  document.addEventListener('visibilitychange', depart);
  reduced.addEventListener('change', depart);
  if (!document.hidden) timer = setTimeout(visit, 12000);
}
