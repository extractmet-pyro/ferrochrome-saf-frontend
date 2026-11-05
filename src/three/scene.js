import * as THREE from "three";

export function makeScene(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75)); // adaptive pixel density cap
  renderer.localClippingEnabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 500);
  camera.position.set(15, 10, 17);
  scene.add(new THREE.HemisphereLight(0xdde8ff, 0x302820, 0.9));
  const sun = new THREE.DirectionalLight(0xffffff, 1.2); sun.position.set(20, 30, 10); scene.add(sun);
  const glow = new THREE.PointLight(0xff8a30, 40, 30, 1.6); glow.position.set(0, 1.5, 0); scene.add(glow);
  const resize = () => {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / Math.max(h, 1); camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize); ro.observe(container); resize();
  return { renderer, scene, camera, glow, ro };
}

export function webglAvailable() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
}
