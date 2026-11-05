import * as THREE from "three";

export function buildBurden(d, M) {
  const g = new THREE.Group();
  const r = d.R - 0.02;
  const upper = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 64), M.burdenUpper);
  const lower = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 64), M.burdenLower);
  const coke = new THREE.Mesh(new THREE.CylinderGeometry(d.pcd / 2 + d.De, d.pcd / 2 + d.De * 1.2, 1, 64), M.coke);
  g.add(upper, lower, coke);
  return {
    group: g,
    /** layer heights from geometry; coke-bed thickness scaled by coke_bed_fill */
    set(y0, fill, temps) {
      const hb = d.Hb;
      lower.scale.y = hb * 0.5; lower.position.y = y0 + hb * 0.25;
      upper.scale.y = hb * 0.5; upper.position.y = y0 + hb * 0.75;
      const hc = 0.8 * Math.min(Math.max(fill ?? 1, 0.2), 2.5);
      coke.scale.y = hc; coke.position.y = y0 + hc / 2;
      lower.userData.info = `Lower burden ${(temps?.B2 - 273.15).toFixed(0)} °C`;
      upper.userData.info = `Upper burden ${(temps?.B1 - 273.15).toFixed(0)} °C`;
      coke.userData.info = `Coke bed: fill ${fill?.toFixed(2)}, ${(temps?.CB - 273.15).toFixed(0)} °C`;
      return y0 + hb;
    },
    meshes: { upper, lower, coke },
  };
}
