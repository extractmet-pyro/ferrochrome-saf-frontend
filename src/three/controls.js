import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export const PRESETS = {
  Isometric: [15, 10, 17], Front: [0, 5, 28], Top: [0.01, 34, 0.01], Taphole: [18, 2, 4], Electrodes: [6, 14, 8],
};
export function makeControls(camera, dom) {
  const c = new OrbitControls(camera, dom);
  c.enableDamping = true; c.target.set(0, 3, 0); c.maxDistance = 90; c.minDistance = 4; c.update();
  return c;
}
export function goPreset(camera, controls, name) { const p = PRESETS[name]; camera.position.set(...p); controls.target.set(0, 3, 0); controls.update(); }
