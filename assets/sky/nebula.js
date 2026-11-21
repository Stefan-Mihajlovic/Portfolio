import { createGpuDust } from './dust-gl.js';
import { createDustField, createDustCompositor } from './dust-field.js';

// A canonical route names a region of the continuous dust field. Keep the
// original home composition and use the full path for case-study identities.
export function nebulaRegion(pathname, scrollOrigin = 0) {
  const path = pathname.replace(/\/index\.html$/, '/').replace(/\/+$/, '');
  if (!path) return { x: 0, y: 0, scale: 1, lightX: .27, lightY: -.19, scrollOrigin };
  let seed = 2166136261;
  for (const char of path) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const angle = random() * Math.PI * 2;
  return { x: random() - .5, y: random() - .5, scale: .78 + random() * .48,
    lightX: .33 * Math.cos(angle), lightY: .30 * Math.sin(angle), scrollOrigin };
}

export function createNebula(host) {
  let canvas = document.createElement('canvas');
  canvas.className = 'nebula-canvas';
  host.prepend(canvas);
  let gpu, worker, local, latestFrame, inFlight;
  let composite, recycledBuffer;
  let cpuCost = 0, phase = 0, sinceDraw = 0;
  let ready = false;
  function markReady() {
    if (ready) return;
    ready = true;
    host.classList.add('dust-ready');
  }
  function recordCost(milliseconds) {
    const seconds = milliseconds / 1000;
    cpuCost = cpuCost ? cpuCost * .8 + seconds * .2 : seconds;
  }
  function paint() {
    if (!latestFrame || inFlight) return;
    if (gpu) gpu(latestFrame);
    else if (worker) {
      inFlight = latestFrame;
      if (recycledBuffer) {
        worker.postMessage({ ...inFlight, buffer: recycledBuffer }, [recycledBuffer]);
        recycledBuffer = undefined;
      } else worker.postMessage(inFlight);
      return;
    } else if (local) {
      const start = performance.now();
      local(latestFrame);
      recordCost(performance.now() - start);
    } else return;
    markReady();
  }

  function replaceCanvas() {
    const replacement = canvas.cloneNode(false);
    canvas.replaceWith(replacement);
    canvas = replacement;
  }
  function useLocalCanvas() {
    worker?.terminate();
    worker = undefined;
    inFlight = undefined;
    replaceCanvas();
    try { local = createDustField(canvas); }
    catch { canvas.remove(); host.classList.remove('dust-ready'); }
    paint();
  }
  function useCpuRenderer() {
    gpu = undefined;
    replaceCanvas();
    if (typeof Worker === 'undefined') {
      useLocalCanvas();
      return;
    }
    try {
      const url = typeof __NEBULA_WORKER_URL__ === 'string' ? __NEBULA_WORKER_URL__ : '/assets/sky/nebula-worker.js';
      worker = new Worker(url, { type: 'module' });
      worker.onmessage = ({ data }) => {
        recordCost(data.cost);
        if (composite) {
          const pixels = new ImageData(new Uint8ClampedArray(data.buffer), inFlight.w, inFlight.h);
          composite(pixels, inFlight);
          recycledBuffer = data.buffer;
        }
        markReady();
        const pending = latestFrame !== inFlight;
        inFlight = undefined;
        if (pending) paint();
      };
      worker.onerror = useLocalCanvas;
      if (canvas.transferControlToOffscreen) {
        const surface = canvas.transferControlToOffscreen();
        worker.postMessage({ surface }, [surface]);
      } else composite = createDustCompositor(canvas);
      paint();
    } catch { useLocalCanvas(); }
  }
  try { gpu = createGpuDust(canvas); } catch { /* CPU rendering is available below. */ }
  if (gpu) canvas.addEventListener('webglcontextlost', useCpuRenderer, {once: true});
  else useCpuRenderer();

  return function draw(width, height, dt, scroll, region, flightId, progress, focusX, focusY) {
    phase += dt * .09;
    sinceDraw += dt;
    if (!width || !height) return;
    // The GPU follows every display tick. Give the CPU-only paths headroom
    // for input and layout, particularly when the worker is unavailable.
    if (!gpu && cpuCost > 0) {
      const interval = cpuCost * (worker ? 1.25 : 3);
      if (dt > 0 && sinceDraw < interval) return;
      sinceDraw %= interval;
    }
    const scale = Math.min(.65, (local || composite ? 400 : 620) / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale)), h = Math.max(1, Math.round(height * scale));
    const camera = region.scrollOrigin - scroll;
    latestFrame = { w, h, phase, camera, region, flightId, progress, focusX, focusY };
    paint();
  };
}
