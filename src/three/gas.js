import * as THREE from "three";

/** Rising gas markers: count fixed, rise speed proportional to measured dry off-gas flow (data-linked). */
export function buildGas(d) {
  const N = 260;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * d.R * 0.9; pos.set([Math.cos(a) * r, Math.random() * d.Hb, Math.sin(a) * r], i * 3); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x9ccbe6, size: 0.12, transparent: true, opacity: 0.7 }));
  return {
    points: pts,
    tick(dt, flowNm3h, y0, y1) {
      const v = 0.15 + (flowNm3h || 0) / 40000; // m/s visual, scaled from flow
      const p = geo.attributes.position.array;
      for (let i = 0; i < N; i++) { p[i * 3 + 1] += v * dt; if (p[i * 3 + 1] > y1) p[i * 3 + 1] = y0; if (p[i * 3 + 1] < y0) p[i * 3 + 1] = y0; }
      geo.attributes.position.needsUpdate = true;
    },
  };
}
