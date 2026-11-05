import { canvasBox, panel } from "../components/panel.js";
import { lineChart, barChart } from "../components/trendChart.js";
import { table } from "../components/dataTable.js";
import { toast } from "../components/loadingState.js";
import { get, pollJob, post } from "../api/client.js";
import { startSession } from "../state/simulatorState.js";
import { el } from "../utils/format.js";

let R = {};
const KEYS = [["T_SL", "Slag temperature (K)"], ["fecr_cr_wt_pct", "Metal Cr (wt%)"], ["fecr_si_wt_pct", "Metal Si (wt%)"], ["slag_cr2o3_equiv_wt_pct", "Slag Cr2O3-eq (wt%)"],
  ["power_mw", "Power (MW)"], ["coke_bed_fill", "Coke-bed fill"], ["permeability_index", "Permeability index"], ["unbalance_pct", "Current unbalance (%)"]];
export default {
  id: "scenarios", title: "Scenarios A–L", group: "Plan", domain: "gas",
  mount(root) {
    R.cat = el("div", { class: "scroll", style: "max-height:420px" }); R.sum = el("div"); R.prog = el("span", { class: "muted" });
    const picks = {};
    R.charts = [];
    const cg = el("div", { class: "grid" });
    KEYS.forEach(([k, t]) => { const b = canvasBox("short"); cg.append(panel(t, { cls: "c6", domain: "gas" }, b.box)); R.charts.push([lineChart(b.canvas, { yTitle: "" }), k]); });
    const sb = canvasBox();
    root.append(el("div", { class: "view-head" }, el("h1", {}, "Scenarios A–L"), el("p", {}, "Reproducible synthetic disturbance cases with disclosed assumptions. Run several side by side, or open one as a live session.")),
      el("div", { class: "grid" }, panel("Catalogue", { cls: "c7", domain: "gas" }, R.cat),
        panel("Run comparison", { cls: "c5", domain: "gas" }, el("p", {}, "Tick scenarios in the catalogue, then run. Each runs on its own warm-started twin."),
          el("button", { class: "btn primary", onclick: async (e) => {
            const ids = Object.entries(picks).filter(([, c]) => c.checked).map(([k]) => k);
            if (!ids.length) { toast("Tick at least one scenario"); return; }
            e.target.disabled = true;
            try {
              const j = await post("/scenario/compare", { scenarios: ids, hours: 12 });
              const r = await pollJob(j.job_id, (x) => (R.prog.textContent = `${x.status} ${(100 * x.progress).toFixed(0)} %`), 2000);
              if (r.status !== "done") { R.prog.textContent = r.error || r.status; return; }
              const sc = r.result.scenarios;
              R.charts.forEach(([c, k]) => c.update(sc[ids[0]].series.map((s) => s.t_h), Object.fromEntries(ids.map((i) => [i, sc[i].series.map((s) => s[k])]))));
              R.sum.replaceChildren(table([{ label: "Scenario", key: "id" }, { label: "Metal t", key: "metal_t", digits: 1 }, { label: "SEC", key: "sec_kwh_per_t", digits: 0 },
                { label: "Cr rec %", key: "cr_recovery_pct" }, { label: "Metal Cr", key: "mean_metal_cr" }, { label: "Metal Si", key: "mean_metal_si" }, { label: "Slag Cr2O3", key: "mean_slag_cr2o3" },
                { label: "Max |E res| MW", key: "max_abs_energy_residual_mw", digits: 8 }, { label: "Alarms", get: (s) => Object.entries(s.alarm_counts).map(([a, n]) => `${a}×${n}`).join(" ") }],
                ids.map((i) => ({ id: i, ...sc[i].summary }))));
              R.sbar.update(ids, { "SEC/100": ids.map((i) => (sc[i].summary.sec_kwh_per_t || 0) / 100), "Cr recovery %": ids.map((i) => sc[i].summary.cr_recovery_pct || 0) });
            } catch (x) { toast(x.message); } finally { e.target.disabled = false; }
          } }, "Run selected (12 h each)"), R.prog, R.sum, sb.box),
        panel("Trajectories", { cls: "c12", domain: "gas" }, cg)));
    R.sbar = barChart(sb.canvas, {});
    get("/scenarios/catalog").then((cat) => R.cat.replaceChildren(...cat.map((s) => {
      picks[s.id] = el("input", { type: "checkbox", checked: s.id === "A" || s.id === "B" ? "checked" : null, "aria-label": `select scenario ${s.id}` });
      return el("div", { class: "panel", style: "margin-bottom:6px" }, el("div", { class: "row" }, picks[s.id], el("strong", {}, `${s.id}. ${s.title}`),
        el("button", { class: "btn", style: "margin-left:auto", onclick: async () => { toast(`Starting scenario ${s.id}…`); await startSession({ scenario: s.id }); location.hash = "#/overview"; location.reload(); } }, "Open live")),
        el("p", {}, `Assumptions: ${s.assumptions}`), el("p", { class: "muted" }, `Expected: ${s.expected}. Duration ${s.duration_h} h; ${s.events.length} scheduled action(s).`));
    })));
  },
  update() {},
};
