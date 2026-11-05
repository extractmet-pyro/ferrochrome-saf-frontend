import { kpi } from "../components/kpiCard.js";
import { alarmList } from "../components/alarmBanner.js";
import { canvasBox, panel } from "../components/panel.js";
import { lineChart } from "../components/trendChart.js";
import { el, fmt } from "../utils/format.js";
import { C, col, rows, xs } from "./helpers.js";

let K = {}, charts = {}, refs = {};
export default {
  id: "overview", title: "Plant overview", group: "Operate", domain: "chrome",
  mount(root) {
    K = {
      power: kpi("power_mw", { domain: "power" }), cr: kpi("fecr_cr_wt_pct", { digits: 2 }), c: kpi("fecr_c_wt_pct", { digits: 2 }),
      si: kpi("fecr_si_wt_pct", { digits: 2 }), slagcr: kpi("slag_cr2o3_equiv_wt_pct", { digits: 2 }),
      sec: kpi("specific_electric_energy_kwh_per_t_fecr", { digits: 0 }), rec: kpi("cr_recovery_pct"),
      tm: kpi("tm", { label: "Metal bath temperature", unit: "°C", domain: "heat", kind: "est", digits: 0 }),
      ts: kpi("ts", { label: "Slag temperature", unit: "°C", domain: "heat", kind: "est", digits: 0 }),
      co: kpi("offgas_co_dry_vol_pct"), flow: kpi("dry_offgas_nm3_per_h", { digits: 0 }), fill: kpi("coke_bed_fill", { digits: 2 }),
      mi: kpi("metal_inventory_t"), si2: kpi("slag_inventory_t"), prod: kpi("production_rate_t_per_h_est", { digits: 1 }),
      loss: kpi("heat_loss_total_MW", { digits: 2 }),
    };
    const tp = canvasBox(), cp = canvasBox(), ip = canvasBox("short");
    refs.alarms = el("div");
    refs.equip = el("div");
    refs.closure = el("dl", { class: "kv" });
    refs.tap = el("div");
    root.append(
      el("div", { class: "view-head" }, el("h1", {}, "Plant overview"), el("p", {}, "Furnace FCF-1, Industry-X (synthetic). Values marked model or estimated come from the twin, not instruments.")),
      el("div", { class: "grid" },
        panel("Key indicators", { cls: "c12" }, el("div", { class: "kpis" }, Object.values(K).map((k) => k.node))),
        panel("Advisories", { cls: "c4", domain: "alarm", note: "shape + text, never colour alone" }, refs.alarms),
        panel("Next tap and last tap", { cls: "c4", domain: "chrome" }, refs.tap),
        panel("Equipment and data health", { cls: "c4", domain: "gas" }, refs.equip),
        panel("Power and temperatures", { cls: "c6", domain: "heat" }, tp.box),
        panel("Metal and slag chemistry", { cls: "c6", domain: "chrome" }, cp.box),
        panel("Hearth inventories", { cls: "c8", domain: "slag" }, ip.box),
        panel("Balance closure (since session start)", { cls: "c4", domain: "heat", note: "independent ledger check" }, refs.closure)));
    charts.tp = lineChart(tp.canvas, { yTitle: "°C", y2: "MW" });
    charts.cp = lineChart(cp.canvas, { yTitle: "wt%" });
    charts.ip = lineChart(ip.canvas, { yTitle: "t" });
  },
  update(st) {
    const s = st.snap; if (!s) return;
    K.power.set(s.power_mw, `PF ${fmt(s.electrical?.power_factor, 3)}`, "syn");
    K.cr.set(s.fecr_cr_wt_pct, `lab ${fmt(s.latest_lab?.metal?.Cr, 2)} (delayed)`);
    K.c.set(s.fecr_c_wt_pct, `C saturation ${fmt(s.metal_props?.c_saturation_wt_pct, 2)}`);
    K.si.set(s.fecr_si_wt_pct); K.slagcr.set(s.slag_cr2o3_equiv_wt_pct, `undissolved chromite ${fmt(s.undissolved_chromite_t, 1)} t`);
    K.sec.set(s.specific_electric_energy_kwh_per_t_fecr, "rolling 24 h, tapped basis"); K.rec.set(s.cr_recovery_pct);
    K.tm.set(C(s.zone_temperature_k.MB), `superheat ${fmt(s.metal_props?.superheat_K, 0)} K`);
    K.ts.set(C(s.zone_temperature_k.SL), `superheat ${fmt(s.slag_props?.superheat_K, 0)} K`);
    K.co.set(s.offgas_co_dry_vol_pct, `analyzer ${fmt(s.analyzer_dry_vol_pct?.CO, 1)}`); K.flow.set(s.dry_offgas_nm3_per_h);
    K.fill.set(s.coke_bed_fill, `${fmt(s.coke_bed_carbon_t, 1)} t carbon`); K.mi.set(s.metal_inventory_t); K.si2.set(s.slag_inventory_t);
    K.prod.set(s.production_rate_t_per_h_est); K.loss.set(s.heat_loss_total_MW, `cooling water ${fmt(s.cooling_water_heat_MW, 2)} MW`);
    refs.alarms.replaceChildren(alarmList(s.alarms));
    const lt = s.last_tap;
    refs.tap.replaceChildren(el("dl", { class: "kv" },
      el("dt", {}, "Next tap in"), el("dd", {}, `${fmt(s.next_tap_in_h * 60, 0)} min`),
      el("dt", {}, "Last tap"), el("dd", {}, lt ? `#${lt.tap_no}: ${fmt(lt.metal_t, 1)} t metal, ${fmt(lt.slag_t, 1)} t slag` : "—"),
      el("dt", {}, "Tap metal temperature"), el("dd", {}, lt ? `${fmt(C(lt.metal_T_K), 0)} °C` : "—"),
      el("dt", {}, "Tap SEC"), el("dd", {}, lt ? `${fmt(lt.sec_kwh_per_t, 0)} kWh/t` : "—"),
      el("dt", {}, "Lab assays pending"), el("dd", {}, String(s.lab_pending))));
    const e = s.electrical || {};
    refs.equip.replaceChildren(el("dl", { class: "kv" },
      el("dt", {}, "Electrodes (depth)"), el("dd", {}, (s.electrode_depth_m || []).map((d) => fmt(d, 2)).join(" / ") + " m"),
      el("dt", {}, "Slips (1/2/3)"), el("dd", {}, (e.slips || []).join(" / ")),
      el("dt", {}, "Current unbalance"), el("dd", {}, `${fmt(e.current_unbalance_pct, 1)} %`),
      el("dt", {}, "State estimator"), el("dd", {}, s.estimator?.mode || "—"),
      el("dt", {}, "Twin solver"), el("dd", {}, s.status),
      el("dt", {}, "Tags not GOOD"), el("dd", {}, (s.data_quality?.bad_or_stale || []).join(", ") || "none")));
    refs.closure.replaceChildren(
      el("dt", {}, "Cr residual"), el("dd", {}, `${fmt(s.mass_balance_cr_residual_kg_per_h, 6)} kg/h`),
      el("dt", {}, "Energy residual"), el("dd", {}, `${fmt(s.energy_balance_residual_mw, 6)} MW`),
      el("dt", {}, "Freeze lining (slag band)"), el("dd", {}, `${fmt(s.freeze_lining_m * 100, 1)} cm`),
      el("dt", {}, "Burden permeability index"), el("dd", {}, fmt(s.permeability_index, 2)));
    const r = rows(), x = xs(r);
    charts.tp.update(x, { "Metal °C": col(r, "T_MB", C), "Slag °C": col(r, "T_SL", C), "Coke bed °C": col(r, "T_CB", C), "Power MW": col(r, "power_mw") },
      { "Power MW": "y2" });
    charts.cp.update(x, { "Metal Cr": col(r, "fecr_cr_wt_pct"), "Metal C": col(r, "fecr_c_wt_pct"), "Metal Si": col(r, "fecr_si_wt_pct"),
      "Slag Cr2O3-eq": col(r, "slag_cr2o3_equiv_wt_pct") });
    charts.ip.update(x, { "Metal": col(r, "metal_inventory_t"), "Slag": col(r, "slag_inventory_t"), "Undissolved chromite": col(r, "undissolved_chromite_t"),
      "Coke-bed carbon": col(r, "coke_bed_carbon_t") });
  },
};
