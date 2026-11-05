import { canvasBox, panel } from "../components/panel.js";
import { lineChart } from "../components/trendChart.js";
import { table } from "../components/dataTable.js";
import { toast } from "../components/loadingState.js";
import { api, get, post } from "../api/client.js";
import { getState } from "../state/store.js";
import { el, fmt } from "../utils/format.js";

let R = {};
export default {
  id: "replay", title: "Historical replay", group: "Intelligence", domain: "gas",
  mount(root) {
    const file = el("input", { type: "file", accept: ".csv,.parquet,.xlsx" });
    R.rep = el("div"); R.res = el("div"); R.charts = el("div", { class: "grid" }); R.ds = el("div");
    const upload = async () => {
      if (!file.files[0]) { toast("Choose a file first"); return; }
      const fd = new FormData(); fd.append("file", file.files[0]);
      try { const r = await api("/telemetry/import", { method: "POST", body: fd }); R.rep.replaceChildren(el("pre", { style: "white-space:pre-wrap" }, JSON.stringify(r.report, null, 1))); R.cur = r.dataset_id; list(); }
      catch (x) { toast(x.message); }
    };
    const list = async () => { const d = await get("/telemetry/datasets"); R.ds.replaceChildren(...d.map((x) => el("button", { class: "btn", onclick: () => replay(x.dataset_id) }, `Replay ${x.name} (${x.report.rows_out} rows)`))); };
    const replay = async (id) => {
      R.res.textContent = "Running the twin over the imported period…";
      try {
        const r = await post(`/replay/${id}?session_id=${getState().session}`);
        R.res.replaceChildren(table([{ label: "Signal", key: "k" }, { label: "RMSE (measured − twin)", key: "v", digits: 3 }], Object.entries(r.rmse).map(([k, v]) => ({ k, v }))),
          el("p", { class: "muted" }, `Lineage: ${r.lineage.dataset}; ${r.lineage.report.rows_out} rows, ${r.lineage.report.invalid_timestamps_rejected} invalid timestamps and ${r.lineage.report.duplicate_timestamps_rejected} duplicates rejected.`));
        R.charts.replaceChildren();
        for (const k of Object.keys(r.measured)) {
          const b = canvasBox("short"); R.charts.append(panel(k, { cls: "c6", domain: "gas" }, b.box));
          lineChart(b.canvas, { yTitle: k, dashed: ["twin"] }).update(r.t_h, { measured: r.measured[k], twin: r.simulated[k], residual: r.residual[k] });
        }
      } catch (x) { R.res.textContent = x.message; }
    };
    root.append(el("div", { class: "view-head" }, el("h1", {}, "Historical replay"),
      el("p", {}, "Import plant history (CSV, Parquet or Excel with a UTC timestamp column and canonical or mapped tag names). The twin replays the period and shows measured against model, with residuals.")),
      el("div", { class: "grid" }, panel("Import", { cls: "c5", domain: "gas" }, file, el("button", { class: "btn primary", onclick: upload }, "Upload and validate"), R.rep,
        el("button", { class: "btn", onclick: async () => {
          const h = await get(`/telemetry/history?session_id=${getState().session}&limit=400`);
          const rows = h.rows.map((r) => ({ timestamp: new Date(Date.UTC(2026, 0, 1) + r.t_h * 3600e3).toISOString(), EL_P_TOTAL: r.power_mw * (1 + 0.01 * Math.sin(r.t_h)), GAS_CO: r.gas_CO + 1.5, TC_OFFGAS: r.offgas_T_K + 15, EL_TAP: r.tap }));
          const csv = [Object.keys(rows[0]).join(","), ...rows.map((r) => Object.values(r).join(","))].join("\n");
          const fd = new FormData(); fd.append("file", new Blob([csv], { type: "text/csv" }), "synthetic_history_with_offsets.csv");
          const r = await api("/telemetry/import", { method: "POST", body: fd }); R.rep.replaceChildren(el("p", {}, `Generated synthetic history ${r.dataset_id} (${r.report.rows_out} rows) with known sensor offsets.`)); list();
        } }, "Create a synthetic history file to try")),
        panel("Datasets", { cls: "c7", domain: "gas" }, R.ds, R.res), panel("Measured vs twin", { cls: "c12", domain: "gas" }, R.charts)));
    list().catch(() => {});
    void fmt;
  },
  update() {},
};
