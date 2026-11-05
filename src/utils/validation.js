export function assayErrors(a) {
  const errs = [];
  const vals = Object.values(a).map(Number);
  if (vals.some((v) => !Number.isFinite(v))) errs.push("non-numeric value");
  if (vals.some((v) => v < 0)) errs.push("negative value");
  const t = vals.reduce((s, v) => s + v, 0);
  if (t > 0.9 && t < 1.1 && Math.max(...vals) <= 1) errs.push("looks like mass fractions - enter wt%");
  else if (Math.abs(t - 100) > 2) errs.push(`total ${t.toFixed(2)} wt% (needs 100 ± 2)`);
  return errs;
}
export function clampNum(v, lo, hi) { const x = Number(v); return Number.isFinite(x) ? Math.min(Math.max(x, lo), hi) : lo; }
