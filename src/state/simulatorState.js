import { get, post } from "../api/client.js";
import { connectTelemetry } from "../api/websocket.js";
import { getState, pushTrend, setState } from "./store.js";

let disconnect = null;

export async function startSession(opts = {}) {
  const body = { mva: 45, enclosure: "closed", scenario: "A", run: true, speed_steps: 2, ...opts };
  const r = await post("/simulation/run", body, { idem: crypto.randomUUID?.() || String(Math.random()) });
  try { sessionStorage.setItem("fecr_session", r.session_id); } catch { /* ignore */ }
  await attach(r.session_id);
  return r.session_id;
}

export async function attach(sessionId) {
  disconnect?.();
  const ts = await get(`/simulation/${sessionId}/timeseries?limit=4000`);
  setState({ session: sessionId, trend: ts.rows || [] });
  const snap = await get(`/simulation/${sessionId}?light=true`);
  onMsg(snap);
  disconnect = connectTelemetry(sessionId, onMsg, (c) => setState({ conn: c }));
}

let backfilling = false;
async function backfill(sid, fromT) {
  if (backfilling) return;
  backfilling = true;
  try { const ts = await get(`/simulation/${sid}/timeseries?t_from=${fromT + 1e-6}&limit=2000`); (ts.rows || []).forEach(pushTrend); }
  catch { /* next message retries */ } finally { backfilling = false; }
}

function onMsg(m) {
  m.__recv = Date.now();
  const tr = getState().trend;
  const last = tr[tr.length - 1];
  // the stream carries only the newest trajectory row; fill any gap (accelerated time) from the timeseries endpoint
  if (last && m.trend_row && m.trend_row.t_h - last.t_h > 0.02) backfill(getState().session, last.t_h);
  else pushTrend(m.trend_row);
  setState({ snap: m, lastMsgAt: Date.now() });
}

export async function refreshDetails() {
  const sid = getState().session;
  if (!sid) return null;
  const d = await get(`/simulation/${sid}/details`);
  setState({ details: d });
  return d;
}

export function savedSession() { try { return sessionStorage.getItem("fecr_session"); } catch { return null; } }
