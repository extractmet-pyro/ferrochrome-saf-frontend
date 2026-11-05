export function hhmm(t_h) { if (t_h == null) return "—"; const h = Math.floor(t_h); const m = Math.round((t_h - h) * 60); return `${h}h ${String(m).padStart(2, "0")}m`; }
export function ago(ms) { const s = Math.round((Date.now() - ms) / 1000); return s < 2 ? "now" : `${s}s ago`; }
