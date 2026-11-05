/** Frame loop capped at `fps`; paused when tab hidden or reduced-motion requested by the user. */
export function loop(fn, fps = 30) {
  let id = 0, last = 0, stop = false;
  const reduce = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const f = (t) => {
    if (stop) return;
    id = requestAnimationFrame(f);
    if (document.hidden || t - last < 1000 / fps) return;
    const dt = Math.min((t - last) / 1000, 0.1); last = t;
    fn(reduce() ? 0 : dt);
  };
  id = requestAnimationFrame(f);
  return () => { stop = true; cancelAnimationFrame(id); };
}
