import { canvasBox, panel } from "../components/panel.js";
import { lineChart } from "../components/trendChart.js";
import { table } from "../components/dataTable.js";
import { numField, selectField } from "../components/unitInput.js";
import { toast } from "../components/loadingState.js";
import { get, post } from "../api/client.js";
import { startSession } from "../state/simulatorState.js";
import { getState } from "../state/store.js";
import { el, fmt } from "../utils/format.js";

let R = {};
function section(g) {
  // Proportional vertical section drawn from the selected geometry (metres).
  const D = g.hearth_inner_diameter_m, H = g.burden_height_m + g.metal_bath_design_depth_m + g.slag_layer_design_depth_m + g.freeboard_height_m;
  const s = 380 / Math.max(D + 3, H + 3), W = 460, Hh = H * s + 120, x0 = (W - D * s) / 2, yb = Hh - 50;
  const m = g.metal_bath_design_depth_m * s, sl = g.slag_layer_design_depth_m * s, bu = g.burden_height_m * s;
  const el_ = [-1, 0, 1].map((k) => { const cx = W / 2 + k * g.pitch_circle_diameter_m / 2 * s * 0.87; const w = g.electrode_diameter_m * s;
    return `<rect x="${cx - w / 2}" y="${yb - m - sl - bu * 0.45 - 140}" width="${w}" height="${140 + bu * 0.55}" fill="#8e979b" stroke="#cfd5d7"/>`; }).join("");
  return `<svg viewBox="0 0 ${W} ${Hh}" style="width:100%" role="img" aria-label="Furnace section to scale">
    <rect x="${x0 - 14}" y="${yb - H * s}" width="${D * s + 28}" height="${H * s + 26}" fill="none" stroke="var(--ink-3)" stroke-width="6"/>
    <rect x="${x0 - 8}" y="${yb}" width="${D * s + 16}" height="22" fill="#3a3f42"/>
    <rect x="${x0}" y="${yb - m}" width="${D * s}" height="${m}" fill="#f2a33a"/>
    <rect x="${x0}" y="${yb - m - sl}" width="${D * s}" height="${sl}" fill="#c8a85a"/>
    <rect x="${x0}" y="${yb - m - sl - bu}" width="${D * s}" height="${bu}" fill="#6c5a44"/>
    ${el_}
    <text x="${W / 2}" y="${yb + 42}" text-anchor="middle" fill="var(--ink-2)" font-size="13">Ø ${fmt(D, 2)} m hearth, ${fmt(H, 2)} m to roof, electrodes Ø ${fmt(g.electrode_diameter_m, 2)} m on PCD ${fmt(g.pitch_circle_diameter_m, 2)} m</text></svg>`;
}
export default {
  id: "design", title: "Furnace design and capacity", group: "Plan", domain: "slag",
  mount(root) {
    R.mva = selectField("Transformer rating", [9, 16.5, 30, 45, 60, 81].map((v) => ({ value: v, label: `${v} MVA` })), String(getState().snap?.geometry?.mva ?? 45));
    R.enc = selectField("Roof enclosure", ["closed", "semi-closed", "open"], getState().snap?.geometry?.enclosure ?? "closed");
    R.ov = {}; R.sec = el("div"); R.tbl = el("div", { class: "scroll" }); R.lin = el("div"); R.sp = el("div");
    const ch = canvasBox();
    const fields = el("div", { class: "fields" });
    const load = async () => {
      const cfg = await get(`/config/plant?mva=${R.mva.value}&enclosure=${R.enc.value}`);
      const p = cfg.params;
      fields.replaceChildren();
      for (const k of ["hearth_inner_diameter_m", "burden_height_m", "electrode_diameter_m", "pitch_circle_diameter_m", "metal_bath_design_depth_m",
        "slag_layer_design_depth_m", "freeboard_height_m", "nominal_power_mw", "nominal_line_voltage_v", "max_phase_current_ka", "tap_interval_h"]) {
        R.ov[k] = numField(p[k].description, p[k].value, { unit: p[k].units, min: p[k].lo, max: p[k].hi });
        R.ov[k].input.addEventListener("input", draw); fields.append(R.ov[k].node);
      }
      R.lin.replaceChildren(table([{ label: "Region", key: "r" }, { label: "Layup (hot face → shell)", key: "l" }, { label: "Total m", key: "t", digits: 3 }],
        Object.entries(p.refractory_lining.value).map(([r, ls]) => ({ r, l: ls.map(([m, t]) => `${m.replace(/_/g, " ")} ${t} m`).join(" | "), t: ls.reduce((s, [, t]) => s + t, 0) }))));
      draw();
    };
    const draw = () => { const g = Object.fromEntries(Object.entries(R.ov).map(([k, f]) => [k, f.value])); R.sec.innerHTML = section(g); };
    R.mva.input.addEventListener("change", load); R.enc.input.addEventListener("change", load);
    const startBtn = el("button", { class: "btn primary", onclick: async (e) => {
      e.target.disabled = true; toast("Warming up the new furnace design…");
      const overrides = Object.fromEntries(Object.entries(R.ov).filter(([k]) => !["tap_interval_h"].includes(k)).map(([k, f]) => [k, f.value]));
      try { await startSession({ mva: Number(R.mva.value), enclosure: R.enc.value, overrides }); location.hash = "#/overview"; location.reload(); }
      catch (x) { toast(x.message); e.target.disabled = false; }
    } }, "Start a session with this design");
    // what-if operating parameters on the running simulation
    const s = getState().snap;
    const op = { tap: numField("Transformer tap", s?.setpoints?.tap ?? 11, { step: 1 }), r: numField("Resistance setpoint", s?.setpoints?.r_setpoint_mohm ?? 0.88, { unit: "mΩ", step: 0.005 }),
      ti: numField("Tap interval", s?.setpoints?.tap_interval_h ?? 2, { unit: "h", step: 0.25 }) };
    const act = (a, params) => post(`/simulation/${getState().session}/action`, { action: a, params, reason: "design what-if" }).then(() => toast("Applied to the simulation")).catch((x) => toast(x.message));
    R.sp.append(el("div", { class: "fields" }, op.tap.node, op.r.node, op.ti.node), el("div", { class: "row", style: "margin-top:8px" },
      el("button", { class: "btn", onclick: () => act("set_tap", { tap: op.tap.value }) }, "Set tap"),
      el("button", { class: "btn", onclick: () => act("set_resistance", { r_mohm: op.r.value }) }, "Set resistance"),
      el("button", { class: "btn", onclick: () => act("set_tap_interval", { h: op.ti.value }) }, "Set tap interval"),
      el("button", { class: "btn", onclick: () => act("tap_now", {}) }, "Tap now")), el("p", { class: "muted" }, "These change the simulated furnace only."));
    root.append(el("div", { class: "view-head" }, el("h1", {}, "Furnace design and capacity"),
      el("p", {}, "Pick a capacity class, adjust dimensions, and start a twin of that furnace. Scaling rules are engineering rules of thumb and must be replaced by the site’s drawings.")),
      el("div", { class: "grid" }, panel("Capacity and dimensions", { cls: "c7", domain: "slag" }, el("div", { class: "fields" }, R.mva.node, R.enc.node), fields,
        el("div", { class: "row", style: "margin-top:10px" }, startBtn)), panel("Section to scale", { cls: "c5", domain: "slag" }, R.sec),
        panel("Capacity classes", { cls: "c7", domain: "power" }, R.tbl), panel("Scaling of design parameters", { cls: "c5", domain: "power" }, ch.box),
        panel("Refractory lining layup", { cls: "c7", domain: "heat" }, R.lin), panel("Operating parameters (what-if on this session)", { cls: "c5", domain: "power" }, R.sp)));
    R.ch = lineChart(ch.canvas, { yTitle: "m / MW / 10 V", xTitle: "MVA" });
    get("/config/capacities").then((d) => {
      const p = d.presets;
      R.tbl.replaceChildren(table([{ label: "MVA", key: "transformer_mva" }, { label: "P MW", key: "nominal_power_mw" }, { label: "V line", key: "nominal_line_voltage_v", digits: 0 },
        { label: "D electrode m", key: "electrode_diameter_m" }, { label: "PCD m", key: "pitch_circle_diameter_m" }, { label: "D hearth m", key: "hearth_inner_diameter_m" },
        { label: "Burden m", key: "burden_height_m" }, { label: "I max kA", key: "max_phase_current_ka", digits: 0 }], p));
      R.ch.update(p.map((r) => r.transformer_mva), { "electrode Ø m": p.map((r) => r.electrode_diameter_m), "hearth Ø m": p.map((r) => r.hearth_inner_diameter_m),
        "power MW": p.map((r) => r.nominal_power_mw), "line V /10": p.map((r) => r.nominal_line_voltage_v / 10) });
    });
    load();
  },
  update() {},
};
