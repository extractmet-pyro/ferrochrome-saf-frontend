import { canvasBox, panel } from "../components/panel.js";
import { barChart, doughnut, lineChart, scatterChart } from "../components/trendChart.js";
import { numField } from "../components/unitInput.js";
import { post } from "../api/client.js";
import { getState } from "../state/store.js";
import { el, fmt } from "../utils/format.js";

let R = {};
export default {
  id: "economics", title: "Economics and ESG", group: "Plan", domain: "heat",
  mount(root) {
    const cb = canvasBox(), be = canvasBox(), pa = canvasBox(), em = canvasBox("short"), tn = canvasBox("tall");
    R.k = el("div", { class: "kpis" });
    const f = { el: numField("Electricity", 6500, { unit: "INR/MWh" }), co2: numField("Carbon price", 0, { unit: "INR/t CO2" }), ef: numField("Grid factor", 0.71, { unit: "t CO2/MWh" }),
      gu: numField("Furnace-gas use", 0, { unit: "fraction", step: 0.1 }) };
    const run = async () => {
      const recipe = getState().snap?.setpoints?.recipe;
      const d = await post("/economics/kpis", { recipe, prices: { electricity_inr_per_mwh: f.el.value, co2_inr_per_t: f.co2.value } });
      const k = d.kpis, c = k.cost, e = k.emissions_t_co2e_per_t;
      R.k.replaceChildren(...[["Cost of HC FeCr", c.total_inr_per_t_fecr, "INR/t"], ["Electricity share", c.electricity_inr_per_t, "INR/t"], ["SEC", k.sec_kwh_per_t, "kWh/t"],
        ["Cr recovery", k.cr_recovery_pct, "%"], ["Scope 1", e.scope1, "t CO2/t"], ["Scope 2", e.scope2, "t CO2/t"], ["Gas chemical energy", e.furnace_gas_chemical_energy_GJ_per_t, "GJ/t"],
        ["Break-even tariff", d.breakeven.breakeven_tariff_inr_per_mwh, "INR/MWh"]].map(([l, v, u]) => el("div", { class: "kpi", style: "--domain: var(--heat)" }, el("div", { class: "lbl" }, l), el("div", { class: "val" }, fmt(v, u.startsWith("t") ? 2 : 0), el("span", { class: "unit" }, u)))));
      const items = { ...Object.fromEntries(Object.entries(c.materials_inr_per_t).map(([m, v]) => [m, v])), electricity: c.electricity_inr_per_t, "electrode paste": c.electrode_paste_inr_per_t, "CO2": c.co2_inr_per_t, other: c.other_inr_per_t };
      R.cb.update(Object.keys(items), Object.values(items));
      R.be.update(d.breakeven.rows.map((r) => r.tariff_inr_per_mwh), { "cost INR/t": d.breakeven.rows.map((r) => r.cost_inr_per_t), "margin INR/t": d.breakeven.rows.map((r) => r.margin_inr_per_t) });
      R.pa.update(Object.fromEntries([160, 172, 185].map((ck) => [`coke ${ck} kg/t`, d.pareto.filter((p) => p.coke_kg_t === ck).map((p) => ({ x: p.co2_t_per_t, y: p.cost_inr_per_t }))])));
      R.em.update(["Scope 1 direct", "Scope 2 electricity", "Memo: avoided by gas use"], { "t CO2 / t FeCr": [e.scope1, e.scope2, e.memo_avoided_by_gas_use] });
      const sens = await post("/balance/sensitivity", { recipe });
      R.tn.update(sens.rows.map((r) => r.driver.replace(/_/g, " ")), { "cost low step": sens.rows.map((r) => r.cost_low - sens.base.cost), "cost high step": sens.rows.map((r) => r.cost_high - sens.base.cost) });
    };
    root.append(el("div", { class: "view-head" }, el("h1", {}, "Economics and ESG"),
      el("p", {}, "Cost per tonne of saleable HC FeCr and Scope 1/2 emissions from the current recipe. Prices and emission factors are demonstration inputs you should replace.")),
      el("div", { class: "grid" }, panel("Assumptions", { cls: "c4", domain: "heat" }, el("div", { class: "fields" }, Object.values(f).map((x) => x.node)), el("button", { class: "btn primary", style: "margin-top:8px", onclick: run }, "Recalculate")),
        panel("Headline", { cls: "c8", domain: "heat" }, R.k),
        panel("Cost build-up per t FeCr", { cls: "c4", domain: "heat" }, cb.box), panel("Tariff sensitivity and break-even", { cls: "c4", domain: "heat" }, be.box),
        panel("Cost vs CO2 (pellet share × coke rate)", { cls: "c4", domain: "chrome" }, pa.box), panel("Emissions accounting", { cls: "c6", domain: "gas", note: "avoided emissions are a memo item, not netted" }, em.box),
        panel("Cost sensitivity (tornado)", { cls: "c6", domain: "heat" }, tn.box)));
    R.cb = doughnut(cb.canvas); R.be = lineChart(be.canvas, { yTitle: "INR/t", xTitle: "tariff INR/MWh" }); R.pa = scatterChart(pa.canvas, { xTitle: "t CO2/t", yTitle: "INR/t" });
    R.em = barChart(em.canvas, { yTitle: "t CO2/t" }); R.tn = barChart(tn.canvas, { horizontal: true });
    run().catch(() => {});
  },
  update() {},
};
