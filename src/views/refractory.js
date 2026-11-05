import { canvasBox, panel } from "../components/panel.js";
import { lineChart, cssVar } from "../components/trendChart.js";
import { table } from "../components/dataTable.js";
import { el, fmt } from "../utils/format.js";
import { refreshDetails } from "../state/simulatorState.js";
import { C, col, rows, xs } from "./helpers.js";

let R = {}, timer;
const LAYER_COL = { carbon_block: "#3a3f42", ramming_paste: "#555", magnesia_brick: "#b98d5b", high_alumina: "#c9b27a", fireclay: "#c58f63",
  insulating: "#e2d3b6", castable: "#9fa7a0", steel: "#6e7a80", chrome_magnesite: "#7d5a4a" };
function layup(w) {
  const tot = w.thickness_m; let x = 0;
  const bars = w.layers.map((l) => { const wpx = 100 * l.thickness_m / tot; const r = `<rect x="${x}%" y="0" width="${wpx}%" height="26" fill="${LAYER_COL[l.material] || "#888"}"><title>${l.label} ${l.thickness_m} m</title></rect>`; x += wpx; return r; }).join("");
  return el("div", { html: `<svg viewBox="0 0 100 26" preserveAspectRatio="none" style="width:100%;height:26px">${bars}</svg>` });
}
export default {
  id: "refractory", title: "Refractory and shell", group: "Process", domain: "slag",
  mount(root) {
    const prof = canvasBox("tall"), fz = canvasBox("short");
    R.walls = el("div", { class: "grid" }); R.tbl = el("div");
    root.append(el("div", { class: "view-head" }, el("h1", {}, "Refractory and shell"),
      el("p", {}, "Transient finite-volume conduction through each multi-layer wall (implicit, k(T)), coupled to shell convection, radiation and water cooling. The slag band carries a quasi-steady freeze lining.")),
      el("div", { class: "grid" }, panel("Through-wall temperature profiles", { cls: "c8", domain: "heat", note: "hot face at left" }, prof.box),
        panel("Wall heat balance now", { cls: "c4", domain: "heat" }, R.tbl),
        panel("Lining layups", { cls: "c6", domain: "slag" }, R.walls), panel("Freeze lining thickness (slag band)", { cls: "c6", domain: "slag" }, fz.box)));
    R.prof = lineChart(prof.canvas, { yTitle: "°C", xTitle: "distance from hot face (m)" }); R.fz = lineChart(fz.canvas, { yTitle: "cm" });
    const tick = async () => {
      const d = await refreshDetails().catch(() => null); if (!d) return;
      const names = Object.keys(d.walls);
      const maxN = Math.max(...names.map((n) => d.walls[n].x_m.length));
      // plot each wall on its own x (union of points via scatter-like lines)
      R.prof.chart.data.datasets = names.map((n, i) => ({ label: n.replace("_", " "), data: d.walls[n].x_m.map((x, j) => ({ x, y: d.walls[n].T_K[j] - 273.15 })),
        borderColor: ["#f2a33a", "#4fa383", "#c8a85a", "#6fa8c9", "#a58be0", "#e5534b"][i], pointRadius: 2, borderWidth: 1.6 }));
      R.prof.chart.update("none");
      R.walls.replaceChildren(...names.map((n) => el("div", { class: "c12" }, el("div", { class: "row" }, el("strong", {}, n.replace("_", " ")),
        el("span", { class: "muted" }, `${fmt(d.walls[n].thickness_m, 3)} m: ` + d.walls[n].layers.map((l) => `${l.label} ${l.thickness_m} m`).join(", "))), layup(d.walls[n]))));
      R.tbl.replaceChildren(table([{ label: "Wall", key: "w" }, { label: "In (kW)", key: "qi", digits: 0 }, { label: "Out (kW)", key: "qo", digits: 0 },
        { label: "Hot face °C", key: "hf", digits: 0 }, { label: "Shell °C", key: "sh", digits: 0 }],
        names.map((n) => { const L = d.walls[n].last; return { w: n.replace("_", " "), qi: L.q_in_W / 1e3, qo: L.q_out_W / 1e3, hf: L.hot_face_T_K - 273.15, sh: L.shell_T_K - 273.15 }; })));
      void maxN;
    };
    tick(); timer = setInterval(tick, 10000);
  },
  update() { const r = rows(); R.fz?.update(xs(r), { "freeze lining": col(r, "freeze_lining_m", (v) => v * 100) }); },
  unmount() { clearInterval(timer); },
};
void cssVar;
