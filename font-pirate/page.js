const descriptions = {
  browse: 'Scroll all 1,950 Google Fonts. Search by name, filter by style, and star the ones you love.',
  detail: 'Your words, in any font. Change the size and weight, then add it to a pairing.',
  pairing: 'Put heading and body fonts together. Save the pairing and take the CSS.'
};
const tabs = [...document.querySelectorAll('[data-shot]')];
const showcase = document.querySelector('.showcase');
const playback = document.querySelector('.gallery-playback');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const duration = 6000;
let activeIndex = 0;
let elapsed = 0;
let previousTime = null;
let visible = false;
let focused = false;
let paused = reducedMotion.matches;

function select(index) {
  activeIndex = index;
  elapsed = 0;
  previousTime = null;
  tabs.forEach((tab, i) => {
    const active = i === index;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    tab.querySelector('.tab-progress > span').style.transform = 'scaleX(0)';
    document.getElementById('shot-' + tab.dataset.shot).hidden = !active;
  });
  document.getElementById('feature-description').textContent = descriptions[tabs[index].dataset.shot];
}
function updatePlayback() {
  const label = paused ? 'Play slideshow' : 'Pause slideshow';
  playback.dataset.paused = String(paused);
  playback.setAttribute('aria-label', label);
  playback.title = label;
  previousTime = null;
}
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => select(i));
  tab.addEventListener('keydown', event => {
    let index;
    if (['ArrowRight', 'ArrowDown'].includes(event.key)) index = (i + 1) % tabs.length;
    if (['ArrowLeft', 'ArrowUp'].includes(event.key)) index = (i + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') index = 0;
    if (event.key === 'End') index = tabs.length - 1;
    if (index !== undefined) {
      event.preventDefault();
      select(index);
      tabs[index].focus();
    }
  });
});
playback.addEventListener('click', () => { paused = !paused; updatePlayback(); });
// Keep a tab stable while someone navigates the gallery with the keyboard.
showcase.addEventListener('focusin', event => { focused = event.target !== playback && event.target.matches(':focus-visible'); });
showcase.addEventListener('focusout', event => {
  focused = showcase.contains(event.relatedTarget) && event.relatedTarget !== playback && event.relatedTarget.matches(':focus-visible');
  previousTime = null;
});
new IntersectionObserver(([entry]) => {
  visible = entry.isIntersecting && entry.intersectionRatio >= 0.25;
  previousTime = null;
}, { threshold: 0.25 }).observe(showcase);
document.addEventListener('visibilitychange', () => { previousTime = null; });
reducedMotion.addEventListener('change', event => { paused = event.matches; updatePlayback(); });
function tick(time) {
  if (visible && !document.hidden && !paused && !focused) {
    if (previousTime !== null) elapsed += time - previousTime;
    previousTime = time;
    if (elapsed >= duration) select((activeIndex + 1) % tabs.length);
    tabs[activeIndex].querySelector('.tab-progress > span').style.transform = `scaleX(${elapsed / duration})`;
  } else previousTime = null;
  requestAnimationFrame(tick);
}
updatePlayback();
requestAnimationFrame(tick);

// Reveal the existing privacy details before following the footer anchor.
document.getElementById('privacy-link').addEventListener('click', () => {
  document.getElementById('privacy').open = true;
});
