import * as THREE from "three";

/** Static furnace structure: shell, lining, hearth, roof, tap-holes, ladles, chutes, off-gas duct, transformer. */
export function buildFurnace(d, M) {
  const g = new THREE.Group();
  const Rin = d.R, Rout = d.R + d.lining, Htot = d.metal + d.slag + d.Hb + d.fb + 0.6;
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(Rout + 0.05, Rout + 0.05, Htot + d.hearth, 64, 1, true), M.shell);
  shell.position.y = (Htot - d.hearth) / 2; shell.userData.info = `Steel shell, Ø${(2 * (Rout + 0.05)).toFixed(1)} m`; g.add(shell);
  const lining = new THREE.Mesh(new THREE.CylinderGeometry(Rout, Rout, Htot, 64, 1, true), M.lining);
  lining.position.y = Htot / 2; lining.userData.info = `Refractory lining ${(d.lining).toFixed(2)} m (slag band)`; g.add(lining);
  const liningIn = new THREE.Mesh(new THREE.CylinderGeometry(Rin, Rin, Htot, 64, 1, true), M.lining);
  liningIn.position.y = Htot / 2; g.add(liningIn);
  const hearth = new THREE.Mesh(new THREE.CylinderGeometry(Rout, Rout, d.hearth, 64), M.carbon);
  hearth.position.y = -d.hearth / 2; hearth.userData.info = `Hearth: carbon blocks + magnesia, ${d.hearth.toFixed(2)} m`; g.add(hearth);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(Rout + 0.1, Rout + 0.1, 0.35, 64, 1, false), M.roof);
  roof.position.y = Htot + 0.17; roof.userData.info = "Water-cooled roof"; roof.userData.roof = true; g.add(roof);
  // tap-holes and launders to ladles
  const th = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 0.6), M.carbon); th.position.set(Rout + 0.4, d.metal * 0.5, 0); th.userData.info = "Metal/slag tap-hole"; g.add(th);
  const launder = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.15, 0.6), M.chute); launder.position.set(Rout + 2.2, -0.2, 0); launder.rotation.z = -0.12; g.add(launder);
  const ladle = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.85, 1.8, 32), M.ladle); ladle.position.set(Rout + 4.2, -1.3, 0); ladle.userData.info = "Metal ladle"; g.add(ladle);
  const slagPot = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 0.7, 1.4, 32), M.ladle); slagPot.position.set(Rout + 4.2, -1.5, 2.6); slagPot.userData.info = "Slag pot"; g.add(slagPot);
  // charging chutes (feed geometry ring)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 3.5, 12), M.chute);
    ch.position.set(Math.cos(a) * d.R * 0.72, Htot + 1.8, Math.sin(a) * d.R * 0.72); ch.userData.info = "Charging chute"; g.add(ch);
  }
  // off-gas duct
  const duct = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 6, 24), M.duct);
  duct.position.set(-d.R * 0.6, Htot + 3, -d.R * 0.4); duct.userData.info = "Off-gas uptake"; g.add(duct);
  const duct2 = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 8, 24), M.duct);
  duct2.rotation.z = Math.PI / 2; duct2.position.set(-d.R * 0.6 - 4, Htot + 6, -d.R * 0.4); g.add(duct2);
  // transformer & bus
  const tr = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 3), M.transformer); tr.position.set(0, Htot + 4.5, Rout + 4); tr.userData.info = "Furnace transformer"; g.add(tr);
  return { group: g, Htot };
}
