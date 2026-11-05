import { canvasBox, panel } from "../components/panel.js";
import { kpi } from "../components/kpiCard.js";
import { barChart, lineChart } from "../components/trendChart.js";
import { alarmList } from "../components/alarmBanner.js";
import { el, fmt } from "../utils/format.js";
import { C, col, rows, xs } from "./helpers.js";

let R = {};
export default {
  id: "gas", title: "Gas and emissions", group: "Process", domain: "gas",
  mount(root) {
    R.k = { co: kpi("offgas_co_dry_vol_pct"), f: kpi("dry_offgas_nm3_per_h", { digits: 0 }), fw: kpi("wet", { label: "Off-gas flow (wet)", unit: "Nm³/h", domain: "gas", digits: 0 }),
      t: kpi("t", { label: "Off-gas temperature", unit: "°C", domain: "gas", digits: 0 }), ch: kpi("ch", { label: "Chemical energy (LHV)", unit: "MW", domain: "gas" }),
      d: kpi("d", { label: "Dust loading", unit: "kg/h", domain: "gas", digits: 0 }), dp: kpi("burden_dp_kpa", { digits: 2 }),
      pi: kpi("pi", { label: "Permeability index", unit: "", domain: "gas", digits: 2, kind: "est" }) };
    const comp = canvasBox(), an = canvasBox(), fl = canvasBox(), bar = canvasBox("short");
    R.al = el("div"); R.basis = el("div");
    root.append(el("div", { class: "view-head" }, el("h1", {}, "Gas and emissions"), el("p", {}, "Normal conditions 0 °C, 101.325 kPa. Dry and wet bases are always labelled. CO advisories are informational; gas detection and ventilation interlocks stay independent.")),
      el("div", { class: "grid" }, panel("Off-gas", { cls: "c12", domain: "gas" }, el("div", { class: "kpis" }, Object.values(R.k).map((k) => k.node))),
        panel("Dry composition (true model)", { cls: "c6", domain: "gas" }, comp.box), panel("Analyzer vs model CO (lag, bias, stuck detection)", { cls: "c6", domain: "gas" }, an.box),
        panel("Flow, temperature, dust", { cls: "c6", domain: "gas" }, fl.box), panel("Current composition, dry vs wet basis", { cls: "c6", domain: "gas" }, bar.box, R.basis),
        panel("Gas-related advisories", { cls: "c12", domain: "alarm" }, R.al)));
    R.comp = lineChart(comp.canvas, { yTitle: "vol% dry" }); R.an = lineChart(an.canvas, { yTitle: "CO vol% dry", dashed: ["analyzer"] });
    R.fl = lineChart(fl.canvas, { yTitle: "Nm³/h", y2: "°C / kg/h" }); R.bar = barChart(bar.canvas, { yTitle: "vol%" });
  },
  update(st) {
    const s = st.snap; if (!s) return;
    R.k.co.set(s.offgas_co_dry_vol_pct, `analyzer ${fmt(s.analyzer_dry_vol_pct?.CO, 1)} %`); R.k.f.set(s.dry_offgas_nm3_per_h); R.k.fw.set(s.wet_offgas_nm3_per_h);
    R.k.t.set(C(s.offgas_T_K)); R.k.ch.set(s.offgas_chemical_MW, "recoverable in closed furnaces"); R.k.d.set(s.dust_kg_per_h, `Cr ${fmt(s.cr_in_dust_kg_per_h, 1)} kg/h (total Cr, not Cr(VI))`);
    R.k.dp.set(s.burden_dp_kpa); R.k.pi.set(s.permeability_index);
    const r = rows(), x = xs(r);
    R.comp.update(x, { CO: col(r, "gas_CO"), CO2: col(r, "gas_CO2"), H2: col(r, "gas_H2"), N2: col(r, "gas_N2"), CH4: col(r, "gas_CH4") });
    R.an.update(x, { model: col(r, "gas_CO"), analyzer: col(r, "analyzer_CO") });
    R.fl.update(x, { "dry Nm³/h": col(r, "dry_offgas_nm3_per_h"), "T °C": col(r, "offgas_T_K", C), "dust kg/h": col(r, "dust_kg_per_h") }, { "T °C": "y2", "dust kg/h": "y2" });
    const d = s.offgas_dry_vol_pct, w = s.offgas_wet_vol_pct, ks = ["CO", "CO2", "H2", "H2O", "N2", "O2", "CH4"];
    R.bar.update(ks, { "dry basis": ks.map((k) => d[k] ?? 0), "wet basis": ks.map((k) => w[k] ?? 0) });
    R.basis.textContent = `Furnace gas before freeboard (dry): CO ${fmt(s.furnace_gas_dry_vol_pct?.CO, 1)} %, CO2 ${fmt(s.furnace_gas_dry_vol_pct?.CO2, 1)} %.`;
    R.al.replaceChildren(alarmList(s.alarms.filter((a) => ["CO_ADVISORY", "BURDEN_PERMEABILITY"].includes(a.code))));
  },
};
