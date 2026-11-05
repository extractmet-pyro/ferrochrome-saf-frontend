import * as THREE from "three";
import { heatColor } from "../views/helpers.js";

export function mats(clip) {
  const m = (o) => new THREE.MeshStandardMaterial({ clippingPlanes: clip, clipShadows: true, side: THREE.DoubleSide, ...o });
  return {
    shell: m({ color: 0x59646a, metalness: 0.7, roughness: 0.45 }),
    lining: m({ color: 0xb08a4e, roughness: 0.9 }),
    carbon: m({ color: 0x2c2f31, roughness: 0.8 }),
    electrode: m({ color: 0x8e979b, metalness: 0.3, roughness: 0.55 }),
    holder: m({ color: 0x9a7fd1, metalness: 0.6, roughness: 0.4 }),
    burdenUpper: m({ color: 0x6c5a44, roughness: 1 }),
    burdenLower: m({ color: 0x7a4f30, roughness: 1 }),
    coke: m({ color: 0x3a3a3a, roughness: 1, emissive: 0x401000, emissiveIntensity: 0.6 }),
    slag: m({ color: 0xc8a85a, roughness: 0.3, emissive: 0x8a4a10, emissiveIntensity: 0.6 }),
    metal: m({ color: 0xffb060, roughness: 0.2, metalness: 0.4, emissive: 0xff6a10, emissiveIntensity: 1.0 }),
    roof: m({ color: 0x46535a, metalness: 0.6, roughness: 0.5 }),
    duct: m({ color: 0x5c7f95, metalness: 0.5, roughness: 0.5 }),
    ladle: m({ color: 0x3c4246, metalness: 0.6, roughness: 0.6 }),
    transformer: m({ color: 0x3d4a52, metalness: 0.4, roughness: 0.6 }),
    bus: m({ color: 0xc98a3a, metalness: 0.9, roughness: 0.3 }),
    chute: m({ color: 0x6a7378, metalness: 0.5, roughness: 0.6 }),
  };
}

/** data-linked heat overlay: tint emissive/colour from model temperature (K) */
export function applyHeat(mat, T) {
  if (!T) return;
  const c = new THREE.Color(heatColor(T));
  mat.color.copy(c);
  if (mat.emissive) mat.emissive.copy(c).multiplyScalar(T > 1400 ? 0.55 : 0.08);
}
