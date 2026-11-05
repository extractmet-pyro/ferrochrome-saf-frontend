// WebSocket telemetry with exponential-backoff reconnect and HTTP polling fallback.
import { apiBase, get } from "./client.js";
import { getToken } from "./auth.js";

export function wsUrl() {
  const env = import.meta.env?.VITE_WS_BASE_URL;
  if (env) return env.replace(/\/$/, "");
  return apiBase().replace(/^http/, "ws") + "/ws/telemetry";
}

export function connectTelemetry(sessionId, onMsg, onStatus) {
  let ws = null, closed = false, retry = 0, pollTimer = null;
  const startPoll = () => {
    if (pollTimer) return;
    onStatus?.("polling");
    pollTimer = setInterval(async () => {
      try { onMsg(await get(`/simulation/${sessionId}?light=true`)); } catch { onStatus?.("offline"); }
    }, 2000);
  };
  const stopPoll = () => { clearInterval(pollTimer); pollTimer = null; };
  const open = () => {
    if (closed) return;
    try { ws = new WebSocket(`${wsUrl()}?session_id=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(getToken() || "")}`); }
    catch { startPoll(); return; }
    ws.onopen = () => { retry = 0; stopPoll(); onStatus?.("live"); };
    ws.onmessage = (e) => { const m = JSON.parse(e.data); if (!m.heartbeat) onMsg(m); else onStatus?.("live"); };
    ws.onclose = () => {
      if (closed) return;
      onStatus?.("reconnecting"); startPoll();
      retry = Math.min(retry + 1, 6);
      setTimeout(open, 500 * 2 ** retry);
    };
    ws.onerror = () => ws?.close();
  };
  open();
  return () => { closed = true; stopPoll(); ws?.close(); };
}
