import { el } from "../utils/format.js";

/** Alarms rendered with text AND shape (triangle=critical, diamond=warning, circle=info). */
export function alarmList(alarms = []) {
  if (!alarms.length) return el("div", { class: "muted" }, "No active advisories.");
  return el("div", { class: "alarms", role: "list" }, alarms.map((a) =>
    el("div", { class: `alarm ${a.severity}`, role: "listitem" }, el("span", { class: "shape", "aria-hidden": "true" }),
      el("strong", {}, a.severity === "critical" ? "Critical" : a.severity === "warning" ? "Warning" : "Info"), a.msg)));
}
