import { canvasBox, panel } from "../components/panel.js";
import { barChart, lineChart } from "../components/trendChart.js";
import { table } from "../components/dataTable.js";
import { refreshDetails } from "../state/simulatorState.js";
import { get } from "../api/client.js";
import { el, fmt } from "../utils/format.js";
import { download, toCSV } from "../utils/export.js";
import { C } from "./helpers.js";

let R = {}, timer;
const ELS = ["Cr", "Fe", "C", "O", "Si", "Mg", "Al", "Ca", "Mn", "S", "P", "H", "N"];
function streamTable(streams) {
  const names = Object.keys(streams);
  const sp = [...new Set(names.flatMap((n) => Object.keys(streams[n].species_kg)))];
  return table([{ label: "Species (kg)", key: "s" }, ...names.map((n) => ({ label: n.replace(/_/g, " "), key: n, digits: 1 }))],
    [...sp.map((s) => ({ s, ...Object.fromEntries(names.map((n) => [n, streams[n].species_kg[s] ?? 0])) })),
      { s: "Total (t)", ...Object.fromEntries(names.map((n) => [n, streams[n].kg / 1000])) }]);
}
export default {
  id: "massbalance", title: "Mass balance and products", group: "Process", domain: "chrome",
  mount(root) {
    const ec = canvasBox(), tc = canvasBox(), cr = canvasBox("short");
    R.closure = el("div"); R.inp = el("div", { class: "scroll" }); R.out = el("div", { class: "scroll" }); R.zones = el("div", { class: "scroll" });
    R.taps = el("div", { class: "scroll" }); R.recon = el("div");
    root.append(el("div", { class: "view-head" }, el("h1", {}, "Mass balance and products"),
      el("p", {}, "Inputs, outputs and hearth inventories since the session ledger started, with final weights and compositions. Every element closes independently of the model equations."),
      el("button", { class: "btn", onclick: () => download("taps.csv", toCSV((R.d?.taps || []).map((t) => ({ tap: t.tap_no, t_h: t.t_h, metal_t: t.metal_t, slag_t: t.slag_t, metal_T_C: t.metal_T_K - 273.15, ...Object.fromEntries(Object.entries(t.metal_wt_pct).map(([k, v]) => [`metal_${k}`, v])), ...Object.fromEntries(Object.entries(t.slag_wt_pct).map(([k, v]) => [`slag_${k}`, v])), sec: t.sec_kwh_per_t }))), "text/csv") }, "Export tap log (CSV)")),
      el("div", { class: "grid" }, panel("Elemental closure", { cls: "c6", domain: "chrome", note: "in − out − accumulation" }, R.closure),
        panel("Element flows (t)", { cls: "c6", domain: "chrome" }, ec.box),
        panel("Inputs: species and final weights", { cls: "c6", domain: "slag" }, R.inp), panel("Outputs: species and final weights", { cls: "c6", domain: "heat" }, R.out),
        panel("Hearth and burden inventories now", { cls: "c12", domain: "slag" }, R.zones),
        panel("Tap log (products)", { cls: "c8", domain: "chrome" }, R.taps), panel("Per-tap metal and slag", { cls: "c4", domain: "chrome" }, tc.box),
        panel("Chromium reconciliation (weighted least squares)", { cls: "c6", domain: "chrome" }, R.recon), panel("Cr distribution of last taps", { cls: "c6", domain: "chrome" }, cr.box)));
    R.ec = barChart(ec.canvas, { yTitle: "t" }); R.tc = lineChart(tc.canvas, { yTitle: "t", xTitle: "tap time (h)" }); R.cr = barChart(cr.canvas, { yTitle: "kg", stacked: true });
    const tick = async () => {
      const d = await refreshDetails().catch(() => null); if (!d) return; R.d = d;
      const mb = d.mass_balance;
      R.closure.replaceChildren(table([{ label: "Element", key: "e" }, { label: "In (kg)", key: "in_kg", digits: 0 }, { label: "Out (kg)", key: "out_kg", digits: 0 },
        { label: "Accum. (kg)", key: "accum_kg", digits: 0 }, { label: "Residual (kg/h)", key: "residual_kg_per_h", digits: 6 }, { label: "Residual % in", key: "residual_pct_of_input", digits: 8 }],
        ELS.filter((e) => mb[e]?.in_kg > 0).map((e) => ({ e, ...mb[e] })).concat([{ e: "All mass", ...mb._total, out_kg: null, accum_kg: null }])));
      const keyEls = ["Cr", "Fe", "C", "O", "Si", "Mg", "Al"];
      const ins = Object.entries(d.streams_in), outs = Object.entries(d.streams_out);
      R.ec.update(keyEls, Object.fromEntries([...ins.map(([n, v]) => [`in: ${n}`, keyEls.map((e) => v.elements_kg[e] / 1000)]), ...outs.map(([n, v]) => [`out: ${n}`, keyEls.map((e) => v.elements_kg[e] / 1000)])]));
      R.inp.replaceChildren(streamTable(d.streams_in)); R.out.replaceChildren(streamTable(d.streams_out));
      R.zones.replaceChildren(table([{ label: "Zone", key: "z" }, { label: "Mass (t)", key: "m", digits: 2 }, { label: "T (°C)", key: "T", digits: 0 }, { label: "Main species (kg)", key: "sp" }],
        Object.entries(d.zones).map(([z, v]) => ({ z: { B1: "Upper burden", B2: "Lower burden", CB: "Coke bed", SL: "Slag layer", MB: "Metal bath" }[z], m: v.mass_t, T: v.T_K - 273.15,
          sp: Object.entries(v.species_kg).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, x]) => `${k} ${fmt(x, 0)}`).join(", ") }))));
      const taps = d.taps.slice().reverse();
      R.taps.replaceChildren(table([{ label: "Tap", key: "tap_no" }, { label: "Time h", key: "t_h", digits: 2 }, { label: "Metal t", key: "metal_t", digits: 2 }, { label: "Slag t", key: "slag_t", digits: 2 },
        { label: "Metal °C", get: (t) => C(t.metal_T_K), digits: 0 }, { label: "Cr %", get: (t) => t.metal_wt_pct.Cr }, { label: "Fe %", get: (t) => t.metal_wt_pct.Fe },
        { label: "C %", get: (t) => t.metal_wt_pct.C }, { label: "Si %", get: (t) => t.metal_wt_pct.Si }, { label: "Slag SiO2", get: (t) => t.slag_wt_pct.SiO2 },
        { label: "Slag MgO", get: (t) => t.slag_wt_pct.MgO }, { label: "Slag Al2O3", get: (t) => t.slag_wt_pct.Al2O3 }, { label: "Slag Cr2O3-eq", key: "slag_cr2o3_equiv_wt_pct" },
        { label: "S/M", key: "slag_to_metal" }, { label: "SEC kWh/t", key: "sec_kwh_per_t", digits: 0 }], taps));
      R.tc.update(d.taps.map((t) => t.t_h), { "metal t": d.taps.map((t) => t.metal_t), "slag t": d.taps.map((t) => t.slag_t) });
      const lt = d.taps.slice(-8);
      R.cr.update(lt.map((t) => `#${t.tap_no}`), { "Cr in metal": lt.map((t) => t.cr_in_metal_kg), "Cr as undissolved chromite": lt.map((t) => t.cr_as_undissolved_chromite_kg),
        "Cr as droplets": lt.map((t) => t.cr_as_droplets_in_slag_kg), "Cr dissolved in slag": lt.map((t) => t.cr_in_slag_kg - t.cr_as_undissolved_chromite_kg - t.cr_as_droplets_in_slag_kg) });
      const rc = d.cr_reconciliation;
      R.recon.replaceChildren(table([{ label: "Term", key: "k" }, { label: "Measured kg", key: "m", digits: 0 }, { label: "Reconciled kg", key: "r", digits: 0 }, { label: "Adjust kg", key: "a", digits: 1 }, { label: "Test z", key: "z", digits: 2 }],
        Object.keys(rc.measured).map((k) => ({ k, m: rc.measured[k], r: rc.reconciled[k], a: rc.adjustments[k], z: rc.normalised_adjustments[k] }))),
        el("p", {}, `Global χ² test: γ = ${fmt(rc.global_test.gamma, 2)} vs ${fmt(rc.global_test.chi2_95, 2)} → ${rc.global_test.gross_error_suspected ? "gross error suspected" : "consistent"}.`));
    };
    tick(); timer = setInterval(tick, 10000);
    void get;
  },
  update() {},
  unmount() { clearInterval(timer); },
};
