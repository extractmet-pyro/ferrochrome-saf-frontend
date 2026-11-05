export const z = (s, k) => s?.zone_temperature_k?.[k];
export const isStale = (s) => !s || Date.now() - (s.__recv || 0) > 8000;
export function quality(s, field) {
  if (!s) return "stale";
  if (s.status && s.status !== "ok") return "bad";
  if (isStale(s)) return "stale";
  return null;
}
export const series = (rows, key) => rows.map((r) => (r[key] ?? null));
