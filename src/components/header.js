import { el, fmt } from "../utils/format.js";
import { hhmm } from "../utils/time.js";
import { getUser } from "../api/auth.js";

const STATE_LABEL = {
  normal_steady_smelting: "Normal smelting", ore_recipe_transition: "Recipe transition", power_curtailment: "Power curtailment",
  transformer_electrode_abnormality: "Electrode / transformer abnormality", burden_instability: "Burden instability", tapping: "Tapping",
  emergency_fallback: "Model fallback (frozen)", warm_startup: "Warm start", recovery: "Recovery",
};

export function header(s, conn, { onRun, onSpeed, onTheme, onNew, onLogout }) {
  const u = getUser();
  const alarms = s?.alarms || [];
  const crit = alarms.filter((a) => a.severity === "critical").length;
  return el("div", { class: "topbar", role: "banner" },
    el("span", { class: "badge syn", title: "All values come from the synthetic virtual plant" }, "Synthetic — not plant-validated"),
    el("span", { class: "badge", title: "Telemetry connection" }, el("span", { class: `hb ${conn === "live" ? "on" : ""}` }), conn === "live" ? "Live stream" : conn),
    el("span", { class: "badge" }, "Sim time ", el("strong", { class: "mono-num" }, hhmm(s?.t_h))),
    el("span", { class: "badge", style: s?.status !== "ok" ? "color: var(--alarm)" : "" }, STATE_LABEL[s?.operating_state] || s?.operating_state || "—"),
    el("span", { class: "badge", style: crit ? "color: var(--alarm); border-color: var(--alarm)" : "" }, `${alarms.length} advisories${crit ? `, ${crit} critical` : ""}`),
    el("span", { class: "badge" }, `${fmt(s?.power_mw, 1)} MW · tap ${s?.electrical?.tap ?? "—"}`),
    el("span", { class: "spacer" }),
    el("div", { class: "seg", role: "group", "aria-label": "Simulation speed" },
      el("button", { "aria-pressed": s?.running ? "false" : "true", onclick: () => onRun(false) }, "Pause"),
      ...[1, 4, 15, 60].map((n) => el("button", { "aria-pressed": s?.running && s.__speed === n ? "true" : "false", onclick: () => onSpeed(n), title: `${n} min of plant time per tick` }, `${n}×`))),
    el("button", { class: "btn", onclick: onNew }, "New session"),
    el("button", { class: "btn", onclick: onTheme, "aria-label": "Toggle light/dark theme" }, "Theme"),
    el("span", { class: "muted" }, u ? `${u.username} (${u.role})` : ""),
    el("button", { class: "btn", onclick: onLogout }, "Sign out"));
}
