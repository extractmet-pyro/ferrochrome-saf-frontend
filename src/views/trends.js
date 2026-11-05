import { canvasBox, panel } from "../components/panel.js";
import { lineChart } from "../components/trendChart.js";
import { api } from "../api/client.js";
import { getState } from "../state/store.js";
import { el } from "../utils/format.js";
import { downloadBlob } from "../utils/export.js";
import { col, rows, xs } from "./helpers.js";

const GROUPS = {
  "Temperatures (K)": ["T_FB", "T_B1", "T_B2", "T_CB", "T_SL", "T_MB", "slag_liquidus_K"],
  "Metal chemistry (wt%)": ["fecr_cr_wt_pct", "fecr_c_wt_pct", "fecr_si_wt_pct"],
  "Slag": ["slag_cr2o3_equiv_wt_pct", "B1", "B2", "slag_superheat_K", "slag_viscosity_Pa_s"],
  "Inventories (t)": ["metal_inventory_t", "slag_inventory_t", "coke_bed_carbon_t", "undissolved_chromite_t", "droplets_in_slag_t"],
  "Electrical": ["power_mw", "furnace_power_mw", "I1_kA", "I2_kA", "I3_kA", "unbalance_pct", "pf", "tap"],
  "Electrodes (m)": ["h1_m", "h2_m", "h3_m"],
  "Gas": ["gas_CO", "gas_CO2", "gas_H2", "gas_N2", "analyzer_CO", "dry_offgas_nm3_per_h", "offgas_T_K", "dust_kg_per_h"],
  "Burden": ["feed_t_per_h", "burden_dp_kpa", "permeability_index", "coke_bed_fill"],
  "Heat and closure": ["heat_loss_total_MW", "cooling_water_heat_MW", "freeze_lining_m", "energy_balance_residual_mw", "mass_balance_cr_residual_kg_per_h"],
  "KPIs": ["specific_electric_energy_kwh_per_t_fecr", "cr_recovery_pct", "production_rate_t_per_h_est", "offgas_chemical_MW"],
};
let charts = [];
export default {
  id: "trends", title: "Process trajectories", group: "Operate", domain: "gas",
  mount(root) {
    charts = [];
    const g = el("div", { class: "grid" });
    for (const [name, keys] of Object.entries(GROUPS)) { const b = canvasBox(); g.append(panel(name, { cls: "c6", domain: "gas" }, b.box)); charts.push([lineChart(b.canvas, { yTitle: "" }), keys]); }
    root.append(el("div", { class: "view-head" }, el("h1", {}, "Process trajectories"), el("p", {}, "Every trajectory the twin produces, since this session started."),
      el("button", { class: "btn", onclick: async () => downloadBlob(await api(`/reports/export?session_id=${getState().session}&fmt=csv`, { method: "POST", raw: true }), "trajectories.csv") }, "Download CSV"),
      el("button", { class: "btn", onclick: async () => downloadBlob(await api(`/reports/export?session_id=${getState().session}&fmt=pdf`, { method: "POST", raw: true }), "kpi-report.pdf") }, "Download PDF report")), g);
  },
  update() { const r = rows(), x = xs(r); charts.forEach(([c, ks]) => c.update(x, Object.fromEntries(ks.map((k) => [k, col(r, k)])))); },
};
