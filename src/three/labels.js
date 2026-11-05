import * as THREE from "three";

export function makePicker(camera, dom, root, tip) {
  const ray = new THREE.Raycaster(), m = new THREE.Vector2();
  const onMove = (e) => {
    const r = dom.getBoundingClientRect();
    m.x = ((e.clientX - r.left) / r.width) * 2 - 1; m.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(m, camera);
    const hit = ray.intersectObjects(root.children, true).find((h) => h.object.userData.info && h.object.visible);
    if (hit) { tip.style.display = "block"; tip.style.left = `${e.clientX - r.left + 12}px`; tip.style.top = `${e.clientY - r.top + 12}px`; tip.textContent = hit.object.userData.info; }
    else tip.style.display = "none";
  };
  dom.addEventListener("pointermove", onMove);
  return () => dom.removeEventListener("pointermove", onMove);
}
