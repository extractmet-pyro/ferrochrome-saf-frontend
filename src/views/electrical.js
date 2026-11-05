import { canvasBox, panel } from "../components/panel.js";
import { kpi } from "../components/kpiCard.js";
import { barChart, lineChart, cssVar } from "../components/trendChart.js";
import { table } from "../components/dataTable.js";
import { el, fmt } from "../utils/format.js";
import { col, rows, xs } from "./helpers.js";

let R = {};
function phasor(canvas, e) {
  const g = canvas.getContext("2d"); const w = canvas.width = canvas.clientWidth * devicePixelRatio, h = canvas.height = canvas.clientHeight * devicePixelRatio;
  g.clearRect(0, 0, w, h); const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.4;
  g.strokeStyle = cssVar("--line"); g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
  const imax = Math.max(...e.i_phase_A, 1);
  const cols = [cssVar("--power"), cssVar("--heat"), cssVar("--gas")];
  e.i_angle_deg.forEach((ang, i) => {
    const a = -ang * Math.PI / 180, L = r * e.i_phase_A[i] / imax;
    g.strokeStyle = cols[i]; g.lineWidth = 3 * devicePixelRatio; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + L * Math.cos(a), cy + L * Math.sin(a)); g.stroke();
    g.fillStyle = cols[i]; g.font = `${12 * devicePixelRatio}px Barlow`; g.fillText(`I${i + 1} ${(e.i_phase_A[i] / 1000).toFixed(1)} kA`, cx + (L + 8) * Math.cos(a), cy + (L + 8) * Math.sin(a));
  });
}
export default {
  id: "electrical", title: "Electrical and electrodes", group: "Process", domain: "power",
  mount(root) {
    R.k = { p: kpi("power_mw", { domain: "power" }), pf: kpi("pf", { label: "Power factor", unit: "", domain: "power", digits: 3, kind: "live" }),
      s: kpi("s", { label: "Apparent power", unit: "MVA", domain: "power", kind: "live" }), q: kpi("q", { label: "Reactive power", unit: "Mvar", domain: "power", kind: "live" }),
      ub: kpi("ub", { label: "Current unbalance", unit: "%", domain: "power", kind: "live" }), ns: kpi("ns", { label: "Negative sequence", unit: "%", domain: "power", kind: "pred" }),
      eff: kpi("eff", { label: "Electrical efficiency", unit: "%", domain: "power", kind: "pred" }), tap: kpi("tap", { label: "Tap / line voltage", unit: "", domain: "power", kind: "live", digits: 0 }) };
    const ph = el("canvas", { style: "width:100%;height:240px", "aria-label": "current phasor diagram" });
    R.ph = ph; R.tbl = el("div"); R.split = el("div");
    const ic = canvasBox(), rc = canvasBox(), hc = canvasBox(), pc = canvasBox(), bc = canvasBox("short");
    root.append(el("div", { class: "view-head" }, el("h1", {}, "Electrical and electrodes"),
      el("p", {}, "Three-phase circuit solved with complex phasors and a floating furnace star point; per-phase power is |I|²R, not a DC formula.")),
      el("div", { class: "grid" }, panel("Supply", { cls: "c12", domain: "power" }, el("div", { class: "kpis" }, Object.values(R.k).map((k) => k.node))),
        panel("Current phasors", { cls: "c4", domain: "power" }, ph), panel("Per-phase table", { cls: "c8", domain: "power" }, R.tbl),
        panel("Phase currents", { cls: "c6", domain: "power" }, ic.box), panel("Load resistance vs setpoint", { cls: "c6", domain: "power" }, rc.box),
        panel("Electrode tip depth below burden", { cls: "c6", domain: "power" }, hc.box), panel("Phase power and power factor", { cls: "c6", domain: "power" }, pc.box),
        panel("Where the power goes", { cls: "c6", domain: "heat", note: "coke bed / slag path / burden side path / network" }, bc.box, R.split)));
    R.ic = lineChart(ic.canvas, { yTitle: "kA" }); R.rc = lineChart(rc.canvas, { yTitle: "mΩ" }); R.hc = lineChart(hc.canvas, { yTitle: "m" });
    R.pc = lineChart(pc.canvas, { yTitle: "MW", y2: "PF" }); R.bc = barChart(bc.canvas, { yTitle: "MW", horizontal: true });
  },
  update(st) {
    const s = st.snap; if (!s) return; const e = s.electrical;
    R.k.p.set(s.power_mw, `furnace ${fmt(s.furnace_power_mw, 1)} MW`, "syn"); R.k.pf.set(e.power_factor); R.k.s.set(e.s_VA / 1e6); R.k.q.set(e.q_total_var / 1e6);
    R.k.ub.set(e.current_unbalance_pct); R.k.ns.set(e.negative_sequence_pct); R.k.eff.set(100 * e.electrical_efficiency);
    R.k.tap.set(e.tap, `${fmt(e.v_line_V, 0)} V line, R setpoint ${fmt(e.r_setpoint_mohm, 3)} mΩ`);
    phasor(R.ph, e);
    R.tbl.replaceChildren(table([{ label: "Quantity", key: "q" }, { label: "Phase 1", key: "a" }, { label: "Phase 2", key: "b" }, { label: "Phase 3", key: "c" }],
      [["Current (kA)", e.i_phase_A.map((v) => v / 1000)], ["Voltage to hearth (V)", e.v_phase_V], ["Active power (MW)", e.p_load_W.map((v) => v / 1e6)],
        ["Reactive (Mvar)", e.q_var.map((v) => v / 1e6)], ["Load R (mΩ)", e.r_load_mohm], ["Coke-bed R (mΩ)", e.R_cb_mohm], ["Burden R (mΩ)", e.R_bur_mohm],
        ["Reactance X (mΩ)", e.x_mohm], ["Tip depth (m)", e.tip_depth_m], ["Holder position (m)", e.holder_m], ["Slips", e.slips]]
        .map(([q, v]) => ({ q, a: v[0], b: v[1], c: v[2] })), { digits: 3 }));
    const r = rows(), x = xs(r);
    R.ic.update(x, { I1: col(r, "I1_kA"), I2: col(r, "I2_kA"), I3: col(r, "I3_kA") });
    R.rc.update(x, { R1: col(r, "R1_mohm"), R2: col(r, "R2_mohm"), R3: col(r, "R3_mohm"), setpoint: r.map(() => e.r_setpoint_mohm) }, {});
    R.hc.update(x, { "Electrode 1": col(r, "h1_m"), "Electrode 2": col(r, "h2_m"), "Electrode 3": col(r, "h3_m") });
    R.pc.update(x, { P1: col(r, "P1_MW"), P2: col(r, "P2_MW"), P3: col(r, "P3_MW"), PF: col(r, "pf") }, { PF: "y2" });
    const ps = s.power_split_mw;
    R.bc.update(["Coke bed", "Slag path", "Burden side path", "Network loss"], { MW: [ps.coke_bed, ps.slag, ps.burden, ps.network_loss] });
  },
};
