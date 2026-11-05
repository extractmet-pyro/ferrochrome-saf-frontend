import { canvasBox, panel } from "../components/panel.js";
import { barChart, lineChart } from "../components/trendChart.js";
import { table } from "../components/dataTable.js";
import { get } from "../api/client.js";
import { el, fmt } from "../utils/format.js";
import { C, col, rows, xs } from "./helpers.js";

let R = {};
export default {
  id: "metallurgy", title: "Chemistry and thermodynamics", group: "Process", domain: "chrome",
  mount(root) {
    const ell = canvasBox("tall"), mc = canvasBox(), sc = canvasBox(), sp = canvasBox(), bs = canvasBox("short");
    R.rx = el("div", { class: "scroll" }); R.slag = el("dl", { class: "kv" }); R.metal = el("dl", { class: "kv" });
    root.append(el("div", { class: "view-head" }, el("h1", {}, "Chemistry and thermodynamics"), el("p", {}, "Equilibrium (ΔG°, K) sets direction and floor; kinetics decide how far each reaction gets. Slag basicity indices keep their own definitions.")),
      el("div", { class: "grid" }, panel("Standard Gibbs energy of reduction reactions", { cls: "c7", domain: "chrome", note: "kJ per mole of reaction; below zero = feasible at unit activities" }, ell.box),
        panel("Reaction network at 1700 °C", { cls: "c5", domain: "chrome" }, R.rx),
        panel("Metal composition (model)", { cls: "c6", domain: "chrome" }, mc.box), panel("Slag composition and Cr2O3-equivalent", { cls: "c6", domain: "slag" }, sc.box),
        panel("Slag properties", { cls: "c4", domain: "slag" }, R.slag), panel("Metal properties", { cls: "c4", domain: "chrome" }, R.metal),
        panel("Slag liquidus, superheat, viscosity", { cls: "c4", domain: "slag" }, sp.box),
        panel("Current liquid-slag analysis", { cls: "c12", domain: "slag" }, bs.box)));
    R.ell = lineChart(ell.canvas, { yTitle: "ΔG° (kJ/mol)", xTitle: "temperature (°C)" }); R.mc = lineChart(mc.canvas, { yTitle: "wt%" });
    R.sc = lineChart(sc.canvas, { yTitle: "wt%" }); R.sp = lineChart(sp.canvas, { yTitle: "°C / K", y2: "Pa·s" }); R.bs = barChart(bs.canvas, { yTitle: "wt%" });
    get("/thermo/reactions?T_K=1973.15").then((d) => {
      const e = d.ellingham;
      R.ell.update(e.T_K.map((t) => t - 273.15), e.series);
      R.rx.replaceChildren(table([{ label: "Reaction", key: "equation" }, { label: "ΔG kJ", get: (r) => r.dG_J / 1e3, digits: 0 }, { label: "ΔH kJ", get: (r) => r.dH_J / 1e3, digits: 0 },
        { label: "T_eq °C", get: (r) => (r.T_eq_K ? r.T_eq_K - 273.15 : null), digits: 0 }, { label: "Basis", get: (r) => r.provenance + (r.lumped ? ", lumped" : "") }], d.reactions));
    }).catch(() => {});
  },
  update(st) {
    const s = st.snap; if (!s) return; const r = rows(), x = xs(r);
    R.mc.update(x, { Cr: col(r, "fecr_cr_wt_pct"), "C ×5": col(r, "fecr_c_wt_pct", (v) => v * 5), "Si ×5": col(r, "fecr_si_wt_pct", (v) => v * 5) });
    R.sc.update(x, { "Cr2O3-eq": col(r, "slag_cr2o3_equiv_wt_pct"), "B1 ×10": col(r, "B1", (v) => v * 10), "B2 ×10": col(r, "B2", (v) => v * 10) });
    R.sp.update(x, { "liquidus °C": col(r, "slag_liquidus_K", C), "slag T °C": col(r, "T_SL", C), "superheat K": col(r, "slag_superheat_K"), "viscosity Pa·s": col(r, "slag_viscosity_Pa_s") },
      { "viscosity Pa·s": "y2" });
    const p = s.slag_props, b = p.basicity || {};
    R.slag.replaceChildren(...[["B1 (CaO+MgO)/SiO2", fmt(b["B1_(CaO+MgO)/SiO2"], 3)], ["B2 (CaO+MgO)/(SiO2+Al2O3)", fmt(b["B2_(CaO+MgO)/(SiO2+Al2O3)"], 3)],
      ["MgO/Al2O3", fmt(b["MgO/Al2O3"], 2)], ["Liquidus", `${fmt(p.liquidus_C, 0)} °C`], ["Superheat", `${fmt(p.superheat_K, 0)} K`],
      ["Viscosity liquid / effective", `${fmt(p.viscosity_liquid_Pa_s, 2)} / ${fmt(p.viscosity_effective_Pa_s, 2)} Pa·s`],
      ["Suspended solids", `${fmt(100 * p.solid_fraction, 1)} vol%`], ["Density", `${fmt(p.density_kg_m3, 0)} kg/m³`],
      ["Cr2O3 solubility", `${fmt(p.cr2o3_solubility_wt_pct, 2)} wt%`], ["Extrapolation", (p.extrapolation_flags || []).join("; ") || "inside domain"]]
      .flatMap(([k, v]) => [el("dt", {}, k), el("dd", {}, v)]));
    const m = s.metal_props;
    R.metal.replaceChildren(...[["Cr / Fe", fmt(m.Cr_to_Fe, 2)], ["Liquidus", `${fmt(m.liquidus_C, 0)} °C`], ["Superheat", `${fmt(m.superheat_K, 0)} K`],
      ["C saturation", `${fmt(m.c_saturation_wt_pct, 2)} wt%`], ["C / C sat", fmt(m.c_saturation_ratio, 3)], ["P", `${fmt(s.fecr_p_wt_pct, 3)} wt%`],
      ["S", `${fmt(s.fecr_s_wt_pct, 3)} wt%`], ["Density", `${fmt(m.density_kg_m3, 0)} kg/m³`], ["Grade", m.grade_label]].flatMap(([k, v]) => [el("dt", {}, k), el("dd", {}, v)]));
    const w = s.slag_liquid_wt_pct; const ks = Object.keys(w).filter((k) => w[k] > 0.01);
    R.bs.update(ks, { "liquid slag wt%": ks.map((k) => w[k]), "tap-slag (XRF-like) wt%": ks.map((k) => s.slag_total_wt_pct[k] ?? 0) });
  },
};
