export const tileSize = 128;

export function createDustNoise() {
  const mask = tileSize - 1;
  const noise = new Float32Array(tileSize * tileSize);
  let seed = 8701;
  for (let step = 32; step >= 1; step /= 2) {
    const grid = new Float32Array(noise.length);
    for (let y = 0; y < tileSize; y += step) {
      for (let x = 0; x < tileSize; x += step) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        grid[y * tileSize + x] = seed / 4294967296 - .5;
      }
    }
    for (let y = 0; y < tileSize; y++) {
      const top = (y - y % step) * tileSize;
      const bottom = ((y - y % step + step) & mask) * tileSize;
      const fy = (y % step) / step;
      const v = fy * fy * (3 - 2 * fy);
      for (let x = 0; x < tileSize; x++) {
        const left = x - x % step, right = (left + step) & mask;
        const fx = (x % step) / step;
        const u = fx * fx * (3 - 2 * fx);
        const a = grid[top + left] * (1 - u) + grid[top + right] * u;
        const b = grid[bottom + left] * (1 - u) + grid[bottom + right] * u;
        noise[y * tileSize + x] += (a + (b - a) * v) * (step / 32) ** .78;
      }
    }
  }
  return noise;
}
