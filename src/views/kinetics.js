import { canvasBox, panel } from "../components/panel.js";
import { barChart, lineChart } from "../components/trendChart.js";
import { table } from "../components/dataTable.js";
import { get } from "../api/client.js";
import { el, fmt } from "../utils/format.js";
import { col, rows, xs } from "./helpers.js";

let R = {};
export default {
  id: "kinetics", title: "Kinetics and transport", group: "Process", domain: "chrome",
  mount(root) {
    const rb = canvasBox("tall"), ud = canvasBox(), dr = canvasBox();
    R.diss = el("dl", { class: "kv" }); R.kp = el("div", { class: "scroll" });
    root.append(el("div", { class: "view-head" }, el("h1", {}, "Kinetics and transport"),
      el("p", {}, "Rates are Arrhenius × contact factor × thermodynamic driving force; chromite dissolution is mass-transfer controlled; droplets settle by Stokes’ law.")),
      el("div", { class: "grid" }, panel("Reaction rates now", { cls: "c8", domain: "chrome", note: "mol of reaction per s; B1/B2 = burden zones" }, rb.box),
        panel("Chromite dissolution", { cls: "c4", domain: "slag" }, R.diss),
        panel("Undissolved chromite and metal droplets in slag", { cls: "c6", domain: "slag" }, ud.box),
        panel("Production and dust", { cls: "c6", domain: "chrome" }, dr.box),
        panel("Kinetic parameter set", { cls: "c12", domain: "chrome", note: "all CALIBRATION-REQUIRED unless stated" }, R.kp)));
    R.rb = barChart(rb.canvas, { yTitle: "mol/s", horizontal: true }); R.ud = lineChart(ud.canvas, { yTitle: "t" }); R.dr = lineChart(dr.canvas, { yTitle: "t/h", y2: "kg/h" });
    get("/thermo/reactions").then((d) => R.kp.replaceChildren(table([{ label: "Step", key: "key" }, { label: "A", key: "A", digits: 3 }, { label: "E (kJ/mol)", get: (r) => r.E / 1000, digits: 0 },
      { label: "Basis", key: "provenance" }, { label: "Note", key: "note" }], d.kinetic_parameters))).catch(() => {});
  },
  update(st) {
    const s = st.snap; if (!s) return;
    const rr = Object.entries(s.reaction_rates_mol_s || {}).filter(([k, v]) => k.startsWith("R") && Math.abs(v) > 1e-4).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 22);
    R.rb.update(rr.map(([k]) => k.replace(/^R\d+_/, "")), { rate: rr.map(([, v]) => v) });
    const d = s.dissolution || {};
    R.diss.replaceChildren(...[["Mean particle radius", `${fmt(d.r_mean_um, 0)} µm`], ["Total particle area", `${fmt(d.A_m2, 0)} m²`], ["Mass-transfer coefficient", `${fmt(d.km_m_s * 1e6, 2)} µm/s`],
      ["Cr2O3 saturation", `${fmt(d.w_sat, 2)} wt%`], ["Dissolved Cr2O3-eq", `${fmt(d.w_cr, 2)} wt%`], ["Driving force", `${fmt((d.w_sat ?? 0) - (d.w_cr ?? 0), 2)} wt%`],
      ["Droplet settling", `${fmt(100 * (s.reaction_rates_mol_s?.droplet_settling_frac_per_s ?? 0) * 60, 2)} %/min`], ["Undissolved chromite", `${fmt(s.undissolved_chromite_t, 2)} t`]]
      .flatMap(([k, v]) => [el("dt", {}, k), el("dd", {}, v)]));
    const r = rows(), x = xs(r);
    R.ud.update(x, { "undissolved spinel": col(r, "undissolved_chromite_t"), "metal droplets in slag": col(r, "droplets_in_slag_t") });
    R.dr.update(x, { "production (est.)": col(r, "production_rate_t_per_h_est"), "charge t/h": col(r, "feed_t_per_h"), "dust kg/h": col(r, "dust_kg_per_h") }, { "dust kg/h": "y2" });
  },
};
