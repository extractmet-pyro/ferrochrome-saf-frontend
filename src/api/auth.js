const K = "fecr_token";
export function getToken() { try { return sessionStorage.getItem(K); } catch { return null; } }
export function setToken(t, user) { try { sessionStorage.setItem(K, t); sessionStorage.setItem("fecr_user", JSON.stringify(user)); } catch { /* ignore */ } }
export function clearToken() { try { sessionStorage.removeItem(K); sessionStorage.removeItem("fecr_user"); } catch { /* ignore */ } }
export function getUser() { try { return JSON.parse(sessionStorage.getItem("fecr_user") || "null"); } catch { return null; } }
export const ROLES = ["viewer", "operator", "metallurgist", "engineer", "administrator"];
export function can(role) { const u = getUser(); return u && ROLES.indexOf(u.role) >= ROLES.indexOf(role); }
