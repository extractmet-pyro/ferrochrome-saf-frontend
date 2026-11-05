/** Data-linked temperature colour scale (K): shared by schematic and 3D views. Pure function, no DOM. */
export function heatColor(T, lo = 400, hi = 2200) {
  const stops = [[0, [44, 74, 122]], [0.3, [60, 143, 138]], [0.55, [217, 178, 60]], [0.8, [240, 122, 42]], [1, [255, 232, 192]]];
  const f = Math.min(Math.max((T - lo) / (hi - lo), 0), 1);
  for (let i = 1; i < stops.length; i++) if (f <= stops[i][0]) {
    const [a, ca] = stops[i - 1], [b, cb] = stops[i]; const t = (f - a) / (b - a);
    return `rgb(${ca.map((c, j) => Math.round(c + t * (cb[j] - c))).join(",")})`;
  }
  return "rgb(255,232,192)";
}
