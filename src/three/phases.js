import * as THREE from "three";

export function buildPhases(d, M) {
  const r = d.R - 0.02;
  const metal = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 64), M.metal);
  const slag = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 64), M.slag);
  const g = new THREE.Group(); g.add(metal, slag);
  return {
    group: g, meshes: { metal, slag },
    /** layer thicknesses from backend inventories (metal_depth_m, slag_depth_m) */
    set(geo, s) {
      const hm = Math.max(geo.metal_depth_m, 0.05), hs = Math.max(geo.slag_depth_m, 0.05);
      metal.scale.y = hm; metal.position.y = hm / 2;
      slag.scale.y = hs; slag.position.y = hm + hs / 2;
      metal.userData.info = `Metal ${s.metal_inventory_t.toFixed(1)} t, ${(s.zone_temperature_k.MB - 273.15).toFixed(0)} °C, Cr ${s.fecr_cr_wt_pct.toFixed(1)} %`;
      slag.userData.info = `Slag ${s.slag_inventory_t.toFixed(1)} t, ${(s.zone_temperature_k.SL - 273.15).toFixed(0)} °C, Cr2O3-eq ${s.slag_cr2o3_equiv_wt_pct.toFixed(1)} %`;
      return hm + hs;
    },
  };
}
