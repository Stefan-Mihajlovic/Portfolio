import { createDustField, createPixelRenderer } from './dust-field.js';

let render, fillPixels;
self.onmessage = ({ data }) => {
  if (data.surface) {
    render = createDustField(data.surface);
    return;
  }
  const start = performance.now();
  if (render) {
    render(data);
    self.postMessage({ cost: performance.now() - start });
    return;
  }
  fillPixels ??= createPixelRenderer();
  const length = data.w * data.h * 4;
  const pixels = data.buffer?.byteLength === length
    ? new Uint8ClampedArray(data.buffer)
    : new Uint8ClampedArray(length).fill(255);
  fillPixels(pixels, data);
  self.postMessage({ buffer: pixels.buffer, cost: performance.now() - start }, [pixels.buffer]);
};
