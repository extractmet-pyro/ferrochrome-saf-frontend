import { el } from "../utils/format.js";
export const loading = (msg = "Loading…") => el("div", { class: "empty", role: "status" }, msg);
export const errorBox = (e) => el("div", { class: "empty", role: "alert" }, `Could not load: ${e.message || e}`);
export function toast(msg, ms = 4500) {
  const t = el("div", { class: "toast", role: "status" }, msg);
  document.body.append(t); setTimeout(() => t.remove(), ms);
}
