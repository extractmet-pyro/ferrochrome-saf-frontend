export function disposeTree(obj) {
  obj.traverse((o) => {
    o.geometry?.dispose?.();
    const m = o.material; if (Array.isArray(m)) m.forEach((x) => x.dispose?.()); else m?.dispose?.();
  });
}
