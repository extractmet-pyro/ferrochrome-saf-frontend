import { canvasBox, panel } from "../components/panel.js";
import { barChart, doughnut } from "../components/trendChart.js";
import { table } from "../components/dataTable.js";
import { numField } from "../components/unitInput.js";
import { toast } from "../components/loadingState.js";
import { get, post } from "../api/client.js";
import { getState } from "../state/store.js";
import { el, fmt } from "../utils/format.js";
import { assayErrors } from "../utils/validation.js";

let R = {};
const ORES = ["ORE_A_LUMPY", "ORE_B_PELLET", "ORE_C_FRIABLE", "ORE_B_PREREDUCED"];
const ADD = ["COKE_MET", "COAL_LA", "COKE_LOWQ", "QUARTZITE", "LIMESTONE", "DOLOMITE", "METAL_RECYCLE"];
function recipe() {
  return { ore_blend: Object.fromEntries(ORES.map((k) => [k, R.f[k].value]).filter(([, v]) => v > 0)), ...Object.fromEntries(ADD.map((k) => [k, R.f[k].value])) };
}
function render(b) {
  R.out.replaceChildren(el("div", { class: "kpis" }, ...[["Metal per t ore", b.metal_kg_per_t_ore, "kg"], ["Ore per t FeCr", b.ore_t_per_t_fecr, "t"], ["Slag / metal", b.slag_to_metal, ""],
    ["Cr recovery", b.cr_recovery_pct, "%"], ["SEC", b.energy.sec_kwh_per_t_fecr, "kWh/t"], ["Carbon supply / demand", b.carbon_ratio_supply_to_demand, ""],
    ["Slag liquidus", b.slag_props.liquidus_C, "°C"], ["Slag superheat", b.slag_props.superheat_K, "K"], ["Cost", b.cost?.total_inr_per_t_fecr, "INR/t"],
    ["CO2 scope 1+2", b.emissions.scope1_t_co2_per_t_fecr + b.emissions.scope2_t_co2_per_t_fecr, "t/t"]]
    .map(([l, v, u]) => el("div", { class: "kpi", style: "--domain: var(--chrome)" }, el("div", { class: "lbl" }, l), el("div", { class: "val" }, fmt(v, ["INR/t", "kWh/t", "°C", "K", "kg"].includes(u) ? 0 : 2), el("span", { class: "unit" }, u))))));
  R.mw.update(Object.keys(b.metal_wt_pct), { "metal wt%": Object.values(b.metal_wt_pct) });
  R.sw.update(Object.keys(b.slag_wt_pct), { "slag wt%": Object.values(b.slag_wt_pct) });
  const cd = b.carbon_demand_kg_per_t_ore;
  R.cd.update([...Object.keys(cd.to_CO_by_oxide).map((k) => `O from ${k}`), "dissolved in metal", "surplus to coke bed"],
    { "kg C / t ore": [...Object.values(cd.to_CO_by_oxide), cd.dissolved_in_metal, cd.surplus_to_coke_bed] });
  const eb = b.energy.breakdown_kwh_per_t_fecr; R.en.update(Object.keys(eb).map((k) => k.replace(/_/g, " ")), Object.values(eb));
  R.io.replaceChildren(table([{ label: "Stream", key: "s" }, { label: "kg / t ore", key: "a", digits: 1 }, { label: "kg / t FeCr", key: "b", digits: 1 }],
    [...Object.entries(b.masses_in_kg_per_t_ore).map(([k, v]) => ({ s: `in: ${k}`, a: v, b: v / (b.metal_kg_per_t_ore / 1000) })),
      { s: "in: electrode carbon", a: b.electrode_carbon_kg_per_t_ore, b: b.electrode_carbon_kg_per_t_ore / (b.metal_kg_per_t_ore / 1000) },
      { s: "out: HC FeCr metal", a: b.metal_kg_per_t_ore, b: 1000 }, { s: "out: slag", a: b.slag_kg_per_t_ore, b: b.slag_kg_per_t_ore / (b.metal_kg_per_t_ore / 1000) },
      { s: "out: dust", a: b.dust_kg_per_t_ore, b: b.dust_kg_per_t_ore / (b.metal_kg_per_t_ore / 1000) },
      { s: "out: off-gas dry Nm³", a: b.gas.dry_nm3_per_t_ore, b: b.gas.dry_nm3_per_t_fecr }, { s: "out: off-gas wet Nm³", a: b.gas.wet_nm3_per_t_ore, b: b.gas.wet_nm3_per_t_fecr }]));
}
export default {
  id: "charge", title: "Charge-mix planner", group: "Plan", domain: "slag",
  mount(root) {
    const cur = getState().snap?.setpoints?.recipe || { ore_blend: { ORE_A_LUMPY: 0.55, ORE_B_PELLET: 0.45 }, COKE_MET: 172, COAL_LA: 40, QUARTZITE: 85 };
    R.f = {};
    ORES.forEach((k) => (R.f[k] = numField(k.replace(/_/g, " "), cur.ore_blend?.[k] ?? 0, { unit: "blend frac", step: 0.05, min: 0, max: 1 })));
    ADD.forEach((k) => (R.f[k] = numField(k.replace(/_/g, " "), cur[k] ?? 0, { unit: "kg/t ore", step: 5, min: 0 })));
    R.out = el("div"); R.io = el("div"); R.opt = el("div"); R.mats = el("div", { class: "scroll" }); R.assay = el("div");
    const mw = canvasBox("short"), sw = canvasBox("short"), cd = canvasBox(), en = canvasBox();
    const cons = { cr_min: numField("Cr min", 52, { unit: "wt%" }), si_max: numField("Si max", 4, { unit: "wt%" }), superheat_min_K: numField("Slag superheat min", 40, { unit: "K" }),
      b1_lo: numField("B1 min", 0.6), b1_hi: numField("B1 max", 1.1), electricity: numField("Electricity", 6500, { unit: "INR/MWh" }) };
    const calc = async () => { try { render(await post("/balance/static", { recipe: recipe(), prices: { electricity_inr_per_mwh: cons.electricity.value } })); } catch (x) { toast(x.message); } };
    const optimise = async (e) => {
      e.target.disabled = true; R.opt.textContent = "Optimising (SLSQP, multi-start)…";
      try {
        const r = await post("/charges/optimize", { base_recipe: recipe(), constraints: { cr_min: cons.cr_min.value, si_max: cons.si_max.value, superheat_min_K: cons.superheat_min_K.value, b1_lo: cons.b1_lo.value, b1_hi: cons.b1_hi.value },
          prices: { electricity_inr_per_mwh: cons.electricity.value }, ores: ["ORE_A_LUMPY", "ORE_B_PELLET", "ORE_C_FRIABLE"] });
        render(r.balance);
        R.opt.replaceChildren(el("p", {}, r.feasible ? `Feasible optimum: ${fmt(r.objective_inr_per_t_fecr, 0)} INR/t FeCr.` : "No feasible recipe — the least-violation recipe is shown."),
          table([{ label: "Variable", key: "k" }, { label: "Optimised", key: "v", digits: 3 }],
            [...Object.entries(r.recipe.ore_blend).map(([k, v]) => ({ k: `${k} (blend frac)`, v })), ...Object.entries(r.recipe).filter(([k]) => k !== "ore_blend").map(([k, v]) => ({ k: `${k} (kg/t ore)`, v }))]),
          table([{ label: "Constraint", key: "k" }, { label: "Margin (scaled)", key: "v", digits: 3 }], Object.entries(r.constraint_margins).map(([k, v]) => ({ k, v }))),
          el("p", { class: "muted" }, `Active: ${r.active_constraints.join(", ") || "none"}. Shadow prices: ${Object.entries(r.shadow_prices).map(([k, v]) => `${k} ${fmt(v.per_unit, 0)} INR/t per unit`).join("; ") || "none active"}.`),
          r.infeasibility_diagnosis ? el("p", {}, `Violated: ${Object.keys(r.infeasibility_diagnosis).join(", ")}`) : null,
          el("button", { class: "btn", onclick: () => post(`/simulation/${getState().session}/action`, { action: "set_recipe", params: r.recipe, reason: "charge optimiser what-if" }).then(() => toast("Recipe sent to the simulation")) }, "Try this recipe in the simulation"));
      } catch (x) { R.opt.textContent = x.message; } finally { e.target.disabled = false; }
    };
    const assayIn = el("textarea", { rows: 3, style: "width:100%", "aria-label": "Assay JSON" }, '{"Cr2O3": 46, "FeO": 9.5, "Fe2O3": 6, "Al2O3": 10.5, "MgO": 11.2, "SiO2": 12, "CaO": 0.6, "MnO": 0.3, "TiO2": 0.4, "LOI": 3.5}');
    const checkAssay = async () => {
      let a; try { a = JSON.parse(assayIn.value); } catch { R.assay.textContent = "Not valid JSON"; return; }
      const local = assayErrors(a); const r = await post("/validate/assay", { assay_wt_pct_dry: a });
      R.assay.replaceChildren(el("p", {}, r.valid ? `Valid. Cr/Fe = ${fmt(r.cr_fe_ratio, 2)}` : `Rejected: ${r.errors.join("; ")}`), local.length ? el("p", { class: "muted" }, `Client check: ${local.join("; ")}`) : null,
        r.mineralogy_kg_per_100kg_dry ? table([{ label: "Mineral / oxide", key: "k" }, { label: "kg per 100 kg dry", key: "v" }], Object.entries(r.mineralogy_kg_per_100kg_dry).map(([k, v]) => ({ k, v }))) : null);
    };
    root.append(el("div", { class: "view-head" }, el("h1", {}, "Charge-mix planner"), el("p", {}, "Steady-state element and enthalpy balance per tonne of ore, and a constrained cost optimiser. Recoveries use calibrated surrogates flagged for site calibration.")),
      el("div", { class: "grid" }, panel("Recipe", { cls: "c5", domain: "slag" }, el("div", { class: "fields" }, Object.values(R.f).map((f) => f.node)),
        el("div", { class: "row", style: "margin-top:8px" }, el("button", { class: "btn primary", onclick: calc }, "Calculate balance"))),
        panel("Results", { cls: "c7", domain: "chrome" }, R.out),
        panel("Inputs and outputs (final weights)", { cls: "c6", domain: "slag" }, R.io), panel("Carbon demand by path", { cls: "c6", domain: "chrome" }, cd.box),
        panel("Metal composition", { cls: "c4", domain: "chrome" }, mw.box), panel("Slag composition", { cls: "c4", domain: "slag" }, sw.box), panel("Electric energy use per t FeCr", { cls: "c4", domain: "heat" }, en.box),
        panel("Optimise", { cls: "c6", domain: "chrome" }, el("div", { class: "fields" }, Object.values(cons).map((f) => f.node)), el("div", { class: "row", style: "margin:8px 0" }, el("button", { class: "btn primary", onclick: optimise }, "Optimise recipe")), R.opt),
        panel("Raw materials", { cls: "c6", domain: "slag" }, R.mats, el("h3", { style: "margin-top:10px" }, "Validate an assay (wt% dry)"), assayIn, el("button", { class: "btn", onclick: checkAssay }, "Validate"), R.assay)));
    R.mw = barChart(mw.canvas, { yTitle: "wt%" }); R.sw = barChart(sw.canvas, { yTitle: "wt%" }); R.cd = barChart(cd.canvas, { yTitle: "kg C/t ore", horizontal: true }); R.en = doughnut(en.canvas);
    get("/config/materials").then((m) => R.mats.replaceChildren(table([{ label: "Material", key: "name" }, { label: "Cat.", key: "category" }, { label: "H2O %", key: "moisture_wet_wt_pct" },
      { label: "Cr/Fe", key: "cr_fe_ratio" }, { label: "Fines %", key: "fines_pct", digits: 0 }, { label: "INR/t", key: "price_inr_per_t", digits: 0 }], m)));
    calc();
  },
  update() {},
};
