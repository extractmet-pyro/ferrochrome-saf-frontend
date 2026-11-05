import { canvasBox, panel } from "../components/panel.js";
import { lineChart, scatterChart } from "../components/trendChart.js";
import { table } from "../components/dataTable.js";
import { get } from "../api/client.js";
import { getState } from "../state/store.js";
import { el } from "../utils/format.js";

let R = {}, timer, hist = [];
export default {
  id: "estimator", title: "State estimator", group: "Intelligence", domain: "gas",
  mount(root) {
    hist = [];
    R.tbl = el("div"); R.ev = el("div");
    const a = canvasBox(), b = canvasBox(), n = canvasBox("short");
    root.append(el("div", { class: "view-head" }, el("h1", {}, "State estimator"),
      el("p", {}, "Extended Kalman filter on a reduced observer model. Lab assays arrive late and are fused at their sample time by re-filtering, so nothing from the future leaks in. The synthetic truth column exists only because the plant here is simulated.")),
      el("div", { class: "grid" }, panel("Estimated states", { cls: "c7", domain: "gas" }, R.tbl), panel("Recent estimator events", { cls: "c5", domain: "gas" }, R.ev),
        panel("Metal Cr: estimate ±95 % vs synthetic truth", { cls: "c6", domain: "chrome" }, a.box), panel("Metal inventory: estimate ±95 % vs synthetic truth", { cls: "c6", domain: "slag" }, b.box),
        panel("Normalised innovation squared (NIS)", { cls: "c12", domain: "gas", note: "points above the 99.9 % line indicate inconsistent measurements" }, n.box)));
    R.a = lineChart(a.canvas, { yTitle: "wt%", dashed: ["lo", "hi"] }); R.b = lineChart(b.canvas, { yTitle: "t", dashed: ["lo", "hi"] }); R.n = scatterChart(n.canvas, { xTitle: "time (h)", yTitle: "NIS" });
    const tick = async () => {
      const d = await get(`/estimator/state?session_id=${getState().session}`).catch(() => null); if (!d) return;
      const e = d.estimate, tr = d.synthetic_truth_for_validation_only;
      R.tbl.replaceChildren(el("p", {}, `Mode: ${e.mode}. Primary: ${e.primary}; fallback: ${e.fallback}. NIS consistency ${(100 * (e.nis_consistency ?? 0)).toFixed(0)} %.`),
        table([{ label: "State", key: "name" }, { label: "Estimate", key: "value" }, { label: "±1σ", key: "sd" }, { label: "Synthetic truth", get: (s) => tr[s.name] }, { label: "Observability", key: "observability" }], e.states));
      R.ev.replaceChildren(...(e.events || []).slice().reverse().map((x) => el("div", { class: "alarm info" }, el("span", { class: "shape" }), x.msg)));
      const v = Object.fromEntries(e.states.map((s) => [s.name, s]));
      hist.push({ t: e.t_h, cr: v.metal_cr_wt_pct.value, crlo: v.metal_cr_wt_pct.ci95[0], crhi: v.metal_cr_wt_pct.ci95[1], crt: tr.metal_cr_wt_pct,
        mi: v.metal_inventory_t.value, milo: v.metal_inventory_t.ci95[0], mihi: v.metal_inventory_t.ci95[1], mit: tr.metal_inventory_t });
      if (hist.length > 600) hist.shift();
      const x = hist.map((h) => h.t);
      R.a.update(x, { estimate: hist.map((h) => h.cr), lo: hist.map((h) => h.crlo), hi: hist.map((h) => h.crhi), "synthetic truth": hist.map((h) => h.crt) });
      R.b.update(x, { estimate: hist.map((h) => h.mi), lo: hist.map((h) => h.milo), hi: hist.map((h) => h.mihi), "synthetic truth": hist.map((h) => h.mit) });
      R.n.update({ "electrical R": e.innovations.filter((i) => i.label.startsWith("electrical")).map((i) => ({ x: i.t_h, y: i.nis })),
        "tap / lab": e.innovations.filter((i) => !i.label.startsWith("electrical")).map((i) => ({ x: i.t_h, y: i.nis })) });
    };
    tick(); timer = setInterval(tick, 3000);
  },
  update() {},
  unmount() { clearInterval(timer); },
};
