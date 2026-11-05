// Minimal reactive store (pub/sub). Server-derived state only; no invented values.
const state = { session: null, snap: null, conn: "offline", trend: [], details: null, user: null, lastMsgAt: 0 };
const subs = new Set();
export function getState() { return state; }
export function setState(patch) { Object.assign(state, patch); subs.forEach((f) => f(state)); }
export function subscribe(fn) { subs.add(fn); return () => subs.delete(fn); }
export function pushTrend(row) {
  if (!row) return;
  const last = state.trend[state.trend.length - 1];
  if (last && last.t_h >= row.t_h) return;
  state.trend.push(row);
  if (state.trend.length > 6000) state.trend.splice(0, state.trend.length - 6000);
}
