import { canvasBox, panel } from "../components/panel.js";
import { barChart, lineChart } from "../components/trendChart.js";
import { table } from "../components/dataTable.js";
import { toast } from "../components/loadingState.js";
import { get, pollJob, post } from "../api/client.js";
import { can } from "../api/auth.js";
import { el, fmt } from "../utils/format.js";

let R = {};
async function showModel(id) {
  const m = await get(`/models/${id}/metrics`);
  const ts = m.test_series;
  R.ts.update(ts.t_h, { actual: ts.actual, "physics only": ts.physics, hybrid: ts.hybrid, "90 % lo": ts.lo, "90 % hi": ts.hi });
  R.imp.update(m.importance.map((i) => i.feature), { "permutation importance": m.importance.map((i) => i.importance) });
  const mt = m.metrics;
  R.met.replaceChildren(table([{ label: "Test set", key: "k" }, { label: "MAE", key: "MAE", digits: 3 }, { label: "RMSE", key: "RMSE", digits: 3 }, { label: "R²", key: "R2", digits: 3 }],
    [{ k: "physics only", ...mt.test_physics_only }, { k: "hybrid (physics + residual)", ...mt.test_hybrid }, { k: "residual model", ...mt.test_residual }]),
    el("p", {}, `90 % interval ±${fmt(mt.interval_90_halfwidth, 3)}, empirical coverage ${fmt(100 * mt.interval_90_test_coverage, 0)} %. Split: ${m.split.method}. Hyper-parameters ${JSON.stringify(m.hyperparameters)}.`),
    el("p", { class: "muted" }, `Dataset ${m.manifest.dataset_sha256_16}, ${m.manifest.rows} taps, seed ${m.manifest.seed}, synthetic: ${m.manifest.synthetic}. Max PSI test vs train ${fmt(m.drift_test_vs_train.max_psi, 2)} (${m.drift_test_vs_train.drifted.join(", ") || "no drift > 0.25"}).`));
}
async function load() {
  const ms = await get("/models");
  R.list.replaceChildren(table([{ label: "Model", key: "id" }, { label: "Target", key: "target" }, { label: "Kind", key: "kind" }, { label: "Status", key: "status" },
    { label: "Hybrid RMSE", get: (m) => m.metrics.test_hybrid.RMSE, digits: 3 }, { label: "Physics RMSE", get: (m) => m.metrics.test_physics_only.RMSE, digits: 3 }], ms),
    el("div", { class: "row", style: "margin-top:8px" }, ...ms.map((m) => el("button", { class: "btn", onclick: () => showModel(m.id) }, `Show ${m.target.replace("_residual", "")} / ${m.kind}${m.status === "active" ? " (active)" : ""}`))),
    el("div", { class: "row", style: "margin-top:6px" }, ...ms.filter((m) => m.status !== "active").map((m) => el("button", { class: "btn", disabled: can("engineer") ? null : "disabled",
      onclick: async () => { const reason = prompt("Change-management reason for activating this model:"); if (!reason) return; await post(`/models/${m.id}/activate`, { reason }); toast("Model activated (audited)"); load(); } }, `Activate ${m.id}`))));
  const act = ms.find((m) => m.status === "active"); if (act) showModel(act.id);
}
export default {
  id: "ml", title: "Machine learning", group: "Intelligence", domain: "power",
  mount(root) {
    R.list = el("div", { class: "scroll" }); R.met = el("div"); R.camp = el("div");
    const ts = canvasBox("tall"), imp = canvasBox(), cs = canvasBox();
    const tgt = el("select", {}, ["sec_residual", "cr_rec_residual", "slag_cr2o3_residual"].map((t) => el("option", { value: t }, t)));
    const kind = el("select", {}, ["ridge", "gbr"].map((t) => el("option", { value: t }, t)));
    const prog = el("span", { class: "muted" });
    root.append(el("div", { class: "view-head" }, el("h1", {}, "Machine learning"), el("p", {}, "Residual models correct the physics; they never replace it. Training uses chronological splits; new models enter as shadow and need an engineer to activate. Data are synthetic.")),
      el("div", { class: "grid" }, panel("Model registry", { cls: "c7", domain: "power" }, R.list,
        el("div", { class: "row", style: "margin-top:10px" }, el("label", { class: "f" }, "Target", tgt), el("label", { class: "f" }, "Model", kind),
          el("button", { class: "btn primary", disabled: can("metallurgist") ? null : "disabled", onclick: async () => {
            const j = await post("/models/train", { target: tgt.value, kind: kind.value });
            const r = await pollJob(j.job_id, (x) => (prog.textContent = `${x.status} ${(100 * x.progress).toFixed(0)} %`));
            toast(r.status === "done" ? `Trained ${r.result.model_id} (shadow)` : `Training ${r.status}: ${r.error}`); load();
          } }, "Train new model (background job)"), prog)),
        panel("Metrics", { cls: "c5", domain: "power" }, R.met),
        panel("Held-out test period: actual vs physics vs hybrid", { cls: "c8", domain: "power" }, ts.box), panel("What drives the correction", { cls: "c4", domain: "power" }, imp.box),
        panel("Training campaign (synthetic plant with hidden mismatch)", { cls: "c12", domain: "power" }, cs.box, R.camp)));
    R.ts = lineChart(ts.canvas, { yTitle: "target", xTitle: "tap time (h)", dashed: ["90 % lo", "90 % hi"] }); R.imp = barChart(imp.canvas, { horizontal: true }); R.cs = lineChart(cs.canvas, { yTitle: "kWh/t", y2: "%" });
    load().catch((x) => toast(x.message));
    get("/models/campaign/summary").then((c) => {
      const s = c.series;
      R.cs.update(s.t_h, { "SEC actual": s.sec_actual, "SEC physics": s.physics_sec, "Cr rec actual %": s.cr_rec_actual, "Cr rec physics %": s.physics_cr_rec }, { "Cr rec actual %": "y2", "Cr rec physics %": "y2" });
      R.camp.textContent = `${c.rows} taps. Features with drift between training and recent periods: ${c.drift_recent_vs_train.drifted.join(", ") || "none"}.`;
    }).catch(() => {});
  },
  update() {},
};
