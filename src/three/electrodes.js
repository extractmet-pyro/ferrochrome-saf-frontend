import * as THREE from "three";

export function buildElectrodes(d, M, yBurdenTop) {
  const items = [];
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * d.pcd / 2, z = Math.sin(a) * d.pcd / 2;
    const L = 9;
    const em = M.electrode.clone(); em.clippingPlanes = []; // electrodes stay whole in cutaway
    const e = new THREE.Mesh(new THREE.CylinderGeometry(d.De / 2, d.De / 2, L, 40), em);
    const holder = new THREE.Mesh(new THREE.TorusGeometry(d.De / 2 + 0.15, 0.12, 12, 40), M.holder);
    holder.rotation.x = Math.PI / 2;
    const bus = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 5), M.bus);
    g.add(e, holder, bus);
    items.push({ e, holder, bus, x, z, L });
  }
  return {
    group: g, items,
    /** tip depth below burden surface (m) from backend electrode_depth_m */
    set(depths, currents, yTop = yBurdenTop) {
      items.forEach((it, i) => {
        const tipY = yTop - (depths?.[i] ?? 2);
        it.e.position.set(it.x, tipY + it.L / 2, it.z);
        it.holder.position.set(it.x, yTop + 2.2, it.z);
        it.bus.position.set(it.x, yTop + 4.0, it.z + 2.5);
        it.e.userData.info = `Electrode ${i + 1}: tip ${depths?.[i]?.toFixed(2)} m below burden, ${(currents?.[i] / 1000).toFixed(1)} kA`;
        const glow = Math.min((currents?.[i] || 0) / 130000, 1);
        it.e.material.emissive = new THREE.Color(0x803000); it.e.material.emissiveIntensity = 0.05 + 0.25 * glow;
      });
    },
  };
}
