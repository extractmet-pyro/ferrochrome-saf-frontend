// Single typed API client. Base URL from build-time VITE_API_BASE_URL or runtime override.
// No secrets are ever embedded in the frontend; the JWT is obtained by login and kept in sessionStorage.
import { getToken, clearToken } from "./auth.js";

const DEFAULT = import.meta.env?.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export function apiBase() {
  try { return sessionStorage.getItem("fecr_api_base") || DEFAULT; } catch { return DEFAULT; }
}
export function setApiBase(u) { try { sessionStorage.setItem("fecr_api_base", u.replace(/\/$/, "")); } catch { /* ignore */ } }

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error?.message || body?.detail?.[0]?.msg || body?.detail || `HTTP ${status}`);
    this.status = status; this.body = body;
  }
}

let onAuthLost = () => {};
export function setOnAuthLost(fn) { onAuthLost = fn; }

export async function api(path, { method = "GET", body, raw = false, headers = {}, idem } = {}) {
  const h = { ...headers };
  const tok = getToken();
  if (tok) h.Authorization = `Bearer ${tok}`;
  if (body !== undefined && !(body instanceof FormData)) h["Content-Type"] = "application/json";
  if (idem) h["Idempotency-Key"] = idem;
  let res;
  try {
    res = await fetch(apiBase() + path, { method, headers: h, body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body) });
  } catch (e) {
    throw new ApiError(0, { error: { message: `Backend unreachable at ${apiBase()} - check the API URL or wait for the service to wake up` } });
  }
  if (res.status === 401) { clearToken(); onAuthLost(); }
  if (raw) { if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => ({}))); return res; }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

export const get = (p) => api(p);
export const post = (p, body, o = {}) => api(p, { method: "POST", body, ...o });
export const put = (p, body) => api(p, { method: "PUT", body });

export async function pollJob(jobId, onProgress, intervalMs = 1500) {
  for (;;) {
    const j = await get(`/jobs/${jobId}`);
    onProgress?.(j);
    if (["done", "failed", "cancelled"].includes(j.status)) return j;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
