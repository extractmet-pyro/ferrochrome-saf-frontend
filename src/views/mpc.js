import { canvasBox, panel } from "../components/panel.js";
import { lineChart, barChart } from "../components/trendChart.js";
import { table } from "../components/dataTable.js";
import { toast } from "../components/loadingState.js";
import { get, pollJob, post } from "../api/client.js";
import { getState } from "../state/store.js";
import { el, fmt } from "../utils/format.js";

let R = {}, rec = null;
const CVS = [["T_slag_K", "Slag temperature (K)"], ["si_wt_pct", "Metal Si (wt%)"], ["coke_bed_fill", "Coke-bed fill (-)"], ["power_mw", "Power (MW)"],
  ["slag_superheat_K", "Slag superheat (K)"], ["slag_cr2o3_eq", "Slag Cr2O3-eq (wt%)"]];
function showRec(r) {
  rec = r;
  const g = r.gate;
  R.gate.replaceChildren(el("div", { class: `alarm ${g.status === "ISSUED_FOR_REVIEW" ? "info" : "critical"}` }, el("span", { class: "shape" }),
    el("strong", {}, g.status === "ISSUED_FOR_REVIEW" ? "Ready for operator review" : "Blocked — hold current setpoints"), g.blocking_reasons.join("; ") || "All safety and data-quality checks passed."),
    ...g.warnings.map((w) => el("div", { class: "alarm warning" }, el("span", { class: "shape" }), w)),
    el("p", { class: "muted" }, `Recommendation ${r.id} · ${r.mode} model · solver ${r.solver.message} in ${fmt(r.solver.wall_time_s, 1)} s · confidence ${r.confidence} · signature ${r.audit_signature.slice(0, 16)}…`));
  R.moves.replaceChildren(table([{ label: "Supervisory variable", key: "name" }, { label: "Current", key: "current", digits: 3 }, { label: "Suggested", key: "new", digits: 3 },
    { label: "Change", key: "delta", digits: 3 }, { label: "Units", key: "units" }, { label: "Limits", get: (m) => `${fmt(m.lo, 2)} … ${fmt(m.hi, 2)}, ±${fmt(m.max_move, 2)}/move` }], r.moves),
    el("ul", {}, r.explanation.map((x) => el("li", {}, x))),
    el("p", {}, `Expected effect over the horizon (verified on the nonlinear twin): SEC ${fmt(r.expected_effect.sec_kwh_per_t, 0)} kWh/t, Cr recovery ${fmt(r.expected_effect.cr_recovery_pct, 2)} pts, metal ${fmt(r.expected_effect.production_t, 2)} t.`),
    r.hybrid?.sec ? el("p", { class: "muted" }, `Hybrid: SEC ${r.hybrid.sec.mode}${r.hybrid.sec.correction != null ? ` (correction ${fmt(r.hybrid.sec.correction, 0)} kWh/t)` : ""}; Cr recovery ${r.hybrid.cr_recovery.mode}.`) : null);
  R.marg.replaceChildren(table([{ label: "Constraint", key: "k" }, { label: "Margin", key: "v", digits: 2 }], Object.entries(r.constraint_margins).map(([k, v]) => ({ k, v }))));
  const p = r.predicted, nc = r.predicted_no_change, v = r.verification.nonlinear;
  R.charts.forEach(([c, k]) => c.update(p.t_h, { "suggested (linear model)": p.traj[k], "no change": nc.traj[k], "suggested (nonlinear check)": v.traj[k] }));
  R.decide.querySelectorAll("button").forEach((b) => (b.disabled = g.status !== "ISSUED_FOR_REVIEW" && b.dataset.d === "accept"));
}
export default {
  id: "mpc", title: "Supervisory MPC", group: "Intelligence", domain: "chrome",
  mount(root) {
    R.gate = el("div"); R.moves = el("div"); R.marg = el("div", { class: "scroll" }); R.diag = el("div"); R.cmp = el("div");
    const hyb = el("input", { type: "checkbox", checked: "checked" });
    const reason = el("input", { placeholder: "Reason (required, audited)", style: "flex:1" });
    const status = el("span", { class: "muted" });
    R.decide = el("div", { class: "row" }, reason,
      ...["accept", "reject"].map((d) => el("button", { class: `btn ${d === "accept" ? "primary" : "danger"}`, "data-d": d, onclick: async () => {
        if (!rec) return; if (reason.value.trim().length < 3) { toast("Enter a reason first"); return; }
        try { const r = await post(`/mpc/recommendations/${rec.id}/decision`, { decision: d, reason: reason.value }); toast(r.note || `Recorded ${d}`); rec.decision = d; } catch (x) { toast(x.message); }
      } }, d === "accept" ? "Accept recommendation" : "Reject recommendation")),
      el("button", { class: "btn", onclick: async () => { if (!rec) return; try { await post(`/mpc/recommendations/${rec.id}/apply-to-simulation?session_id=${getState().session}`); toast("Applied to the simulated furnace only"); } catch (x) { toast(x.message); } } }, "Try in simulation"),
      el("button", { class: "btn", onclick: async () => { try { await post(`/mpc/rollback?session_id=${getState().session}`); toast("Rolled back last accepted recommendation (simulation)"); } catch (x) { toast(x.message); } } }, "Roll back last"));
    R.charts = [];
    const cg = el("div", { class: "grid" });
    CVS.forEach(([k, t]) => { const b = canvasBox("short"); cg.append(panel(t, { cls: "c4", domain: "chrome" }, b.box)); R.charts.push([lineChart(b.canvas, { yTitle: "", xTitle: "time (h)", dashed: ["no change"] }), k]); });
    const cmpBox = canvasBox();
    root.append(el("div", { class: "view-head" }, el("h1", {}, "Supervisory MPC"),
      el("p", {}, "Advisory only. The optimiser proposes setpoint moves above the existing PLC/DCS loops; an operator accepts or rejects with a reason. Nothing is sent to plant equipment.")),
      el("div", { class: "grid" },
        panel("Request a recommendation", { cls: "c5", domain: "chrome" }, el("div", { class: "row" }, el("label", { class: "row" }, hyb, "Use hybrid ML corrections"),
          el("button", { class: "btn primary", onclick: async (e) => {
            e.target.disabled = true; status.textContent = "Identifying step responses on the twin and optimising (5–20 s)…";
            try { showRec(await post("/mpc/recommend", { session_id: getState().session, hybrid: hyb.checked })); status.textContent = ""; } catch (x) { status.textContent = x.message; } finally { e.target.disabled = false; }
          } }, "Compute recommendation")), status, R.gate),
        panel("Suggested moves and reasons", { cls: "c7", domain: "chrome" }, R.moves, R.decide),
        panel("Predicted trajectories", { cls: "c12", domain: "chrome", note: "solid = suggested, dashed = no change, third line = nonlinear verification" }, cg),
        panel("Constraint margins (verified)", { cls: "c5", domain: "chrome" }, R.marg),
        panel("Policy comparison under identical disturbances", { cls: "c7", domain: "chrome" },
          el("div", { class: "row" }, el("button", { class: "btn", onclick: async (e) => {
            e.target.disabled = true; R.cmp.textContent = "Running baseline, physics-MPC and hybrid-MPC on scenario D (12 h each)…";
            try {
              const j = await post("/mpc/compare", { scenario: "D", hours: 12, hybrid: true });
              const r = await pollJob(j.job_id, (x) => (R.cmp.textContent = `${x.status} ${(100 * x.progress).toFixed(0)} %`), 3000);
              if (r.status !== "done") { R.cmp.textContent = r.error || r.status; return; }
              const res = r.result.results;
              R.cmp.replaceChildren(table([{ label: "Policy", key: "p" }, { label: "Metal t", key: "metal_t", digits: 1 }, { label: "SEC kWh/t", key: "sec_kwh_per_t", digits: 0 },
                { label: "Cr rec %", key: "cr_recovery_pct" }, { label: "Cr to slag t", key: "cr_loss_slag_t", digits: 2 }, { label: "Violation steps", key: "constraint_violation_steps", digits: 0 },
                { label: "MPC calls", key: "mpc_calls", digits: 0 }, { label: "Mean solve s", key: "mean_compute_s" }], Object.entries(res).map(([p, v]) => ({ p, ...v }))),
              el("p", { class: "disclaimer" }, r.result.note));
              R.cmpc.update(res.baseline.trajectory.t_h, Object.fromEntries(Object.entries(res).map(([p, v]) => [p, v.trajectory.fill])));
            } finally { e.target.disabled = false; }
          } }, "Run comparison (background job)")), R.cmp, cmpBox.box),
        panel("Controller configuration and identified model", { cls: "c12", domain: "chrome" }, R.diag)));
    R.cmpc = lineChart(cmpBox.canvas, { yTitle: "coke-bed fill" });
    get(`/mpc/diagnostics?session_id=${getState().session}`).then((d) => {
      R.diag.replaceChildren(el("p", {}, d.hierarchy),
        table([{ label: "Manipulated variable", key: "name" }, { label: "Units", key: "units" }, { label: "Low", key: "lo" }, { label: "High", key: "hi" }, { label: "Max move", key: "max_move" }, { label: "Description", key: "description" }], d.config.mvs),
        table([{ label: "Controlled variable", key: "name" }, { label: "Target", key: "target" }, { label: "Soft low", key: "soft_lo" }, { label: "Soft high", key: "soft_hi" }, { label: "Hard low", key: "hard_lo" }, { label: "Hard high", key: "hard_hi" }], d.config.cvs),
        el("p", { class: "muted" }, `Horizon ${d.config.horizon_h} h, sample ${d.config.sample_h} h, timeout ${d.config.timeout_s} s, advisory_only=${d.config.advisory_only}.`));
    }).catch(() => {});
    void barChart;
  },
  update() {},
};
