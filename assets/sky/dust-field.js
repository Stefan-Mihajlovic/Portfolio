import { createDustNoise, tileSize } from './dust-noise.js';

// A seamless turbulence field supplies the dust density, dark lanes and emission
// detail. Each is sampled at a different scale and advected through the volume.
export function createPixelRenderer() {
  const mask = tileSize - 1;
  const noise = createDustNoise();

  function sample(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const left = ix & mask, right = (ix + 1) & mask;
    const top = (iy & mask) * tileSize, bottom = ((iy + 1) & mask) * tileSize;
    const u = x - ix, v = y - iy;
    const a = noise[top + left] + u * (noise[top + right] - noise[top + left]);
    const b = noise[bottom + left] + u * (noise[bottom + right] - noise[bottom + left]);
    return a + v * (b - a);
  }

  return function fillPixels(data, { w, h, phase, camera, region, progress, focusX, focusY }) {
    const span = Math.max(w, h);
    const fieldScale = region.scale;
    const aspectX = w / span, aspectY = h / span;
    // Only route travel changes perspective. Scroll translates each sheet along
    // Y in the same direction as the stars, with less motion at greater depth.
    const remaining = 1 - progress;
    const farStep = (1 + remaining * 1.65) / span;
    const midStep = (1 + remaining * 3.2) / span;
    const nearStep = (1 + remaining * 5) / span;
    const farY = camera * .0000055, midY = camera * .000034, nearY = camera * .000095;
    const cx = w * focusX, cy = h * focusY;

    for (let y = 0, i = 0; y < h; y++) {
      const row = y - cy;
      const py = row * farStep + farY;
      const my = row * midStep + midY;
      const ny = row * nearStep + nearY;
      const coreY = my - region.lightY * aspectY;
      for (let x = 0; x < w; x++, i += 4) {
        const col = x - cx;
        const px = col * farStep, mx = col * midStep, nx = col * nearStep;
        const sx = (px * fieldScale + region.x * .55) * 194 + 47, sy = (py * fieldScale + region.y * .55) * 194 + 18;
        const swirl = sample(sx * .72 + phase, sy * .72);
        const eddy = sample(sy * .89 + 63, sx * .89 - phase * .72);
        const fx = sx + swirl * 34, fy = sy + eddy * 31;
        const gas = sample(fx - phase * .45, fy + phase * .37);
        const wisps = sample(fx * 2.8 + eddy * 21, fy * 3.1 + gas * 25 - phase);
        const grit = sample(fx * 8.1 + wisps * 13, fy * 7.6 + phase);
        const mass = Math.max(0, .24 + gas * .92 + wisps * .25);
        const dust = Math.max(.08, Math.min(1, .74 + eddy * 1.8 - grit * .16));
        const fold = gas + .33 * wisps + .09 * grit;
        const filament = 1 / (1 + 520 * (fold - .13) ** 2);
        // Irregular pockets of reflected starlight amid the absorbing dust.
        const blueX = (px - region.lightX * aspectX * .9 + swirl * .13) * 4.8;
        const blueY = (py - region.lightY * aspectY + eddy * .09) * 6.9;
        const blue = 1 / (1 + blueX * blueX + blueY * blueY) ** 2;
        const ax = (px + region.lightX * aspectX + eddy * .18) * 3.4;
        const ay = (py + region.lightY * aspectY * 1.25 + swirl * .16) * 4.8;
        const amber = 1 / (1 + ax * ax + ay * ay) ** 2;
        const glow = dust * (mass * mass + .30 * filament * Math.max(0, .65 + wisps));
        // A broken shell of ionized gas around a young star in the middle
        // distance. Moving noise folds its bright rim back into the cloud.
        const coreX = mx - region.lightX * aspectX;
        const radius2 = coreX * coreX + coreY * coreY;
        const light = 1 / (1 + radius2 * 150);
        const middle = sample((mx + region.x) * 264 + phase * 1.7 + 53, (my + region.y) * 240 - phase + 96);
        const lace = sample(mx * 797 + middle * 24, my * 676 - phase * 2);
        const shell = radius2 * 81 - .53 + .85 * middle + .23 * lace;
        const rim = light / (1 + 57 * shell * shell);
        const plasma = Math.max(0, .35 + middle + .54 * lace) * (rim * .95 + light * .36);
        const core = 1 / (1 + radius2 * 210000);
        // Broad nearby dust drifts across the luminous material and occasionally
        // catches its light. Its silhouette slides independently of the shell.
        const dustShape = sample((nx + region.x * 1.4) * 123 - phase * 1.4 + 78, (ny + region.y * 1.4) * 147 + phase * .7 + 29);
        const dustEdge = sample(nx * 324 + dustShape * 35, ny * 365 + 21 - phase);
        const veil = Math.min(1, Math.max(0, (dustShape + .34 * dustEdge - .04) * 2.6));
        const transmission = 1 - veil * .78;
        const rimLight = veil * (1 - veil) * (.15 + blue + .5 * amber);
        const reflection = glow * blue, ember = glow * amber;
        data[i]     = 6  + transmission * (glow * 32 + reflection * 45  + ember * 160 + plasma * 68  + core * 212) + rimLight * 38;
        data[i + 1] = 8  + transmission * (glow * 37 + reflection * 119 + ember * 81  + plasma * 146 + core * 227) + rimLight * 23;
        data[i + 2] = 14 + transmission * (glow * 50 + reflection * 148 + ember * 46  + plasma * 171 + core * 223) + rimLight * 24;
      }
    }
  };
}

// On browsers without transferable canvases the worker sends only the new gas
// pixels. Snapshot capture and route blending still use the last visible frame.
export function createDustCompositor(canvas) {
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Dust canvas unavailable');
  let previousFlight, outgoing;
  return function composite(pixels, { w, h, flightId, progress, focusX, focusY }) {
    if (flightId !== previousFlight && previousFlight !== undefined && progress < 1) {
      // Capture the actual last frame, including a partially completed trip if
      // history navigation interrupted it. Its features keep their bearings.
      outgoing ??= typeof OffscreenCanvas === 'function'
        ? new OffscreenCanvas(canvas.width, canvas.height)
        : document.createElement('canvas');
      outgoing.width = canvas.width;
      outgoing.height = canvas.height;
      outgoing.getContext('2d').drawImage(canvas, 0, 0);
    }
    previousFlight = flightId;
    if (w !== canvas.width || h !== canvas.height) {
      canvas.width = w; canvas.height = h;
    }
    context.putImageData(pixels, 0, 0);
    if (outgoing && progress < 1) {
      // The old cloud moves past the viewer while the next three sheets grow
      // from the same vanishing point. Neither projection ever zooms backwards.
      const cx = w * focusX, cy = h * focusY;
      const zoom = 1 / (1 - .89 * progress);
      context.globalAlpha = 1 - progress * progress * (3 - 2 * progress);
      context.drawImage(outgoing, cx * (1 - zoom), cy * (1 - zoom), w * zoom, h * zoom);
      context.globalAlpha = 1;
    } else outgoing = undefined;
  };
}

export function createDustField(canvas) {
  const fill = createPixelRenderer();
  const composite = createDustCompositor(canvas);
  let pixels;
  return function render(frame) {
    if (!pixels || frame.w !== pixels.width || frame.h !== pixels.height) {
      pixels = new ImageData(frame.w, frame.h);
      pixels.data.fill(255);
    }
    fill(pixels.data, frame);
    composite(pixels, frame);
  };
}
