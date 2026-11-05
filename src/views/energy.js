import { canvasBox, panel } from "../components/panel.js";
import { barChart, lineChart, doughnut } from "../components/trendChart.js";
import { el, fmt } from "../utils/format.js";
import { refreshDetails } from "../state/simulatorState.js";
import { C, col, rows, xs } from "./helpers.js";

let R = {}, timer;
const NICE = { reaction_enthalpy_net: "Reduction reactions (net)", "sensible_out:tapped_metal": "Tapped metal heat", "sensible_out:tapped_slag": "Tapped slag heat",
  "sensible_out:offgas": "Off-gas + dust heat", wall_losses: "Shell, roof, hearth losses", storage_change: "Stored in furnace", "sensible_in:charge": "Charge sensible heat",
  "sensible_in:infiltrated_air": "Air sensible heat", "sensible_in:electrode_carbon": "Electrode sensible heat" };
function sankey(host, eb, hrs) {
  // Engineering energy distribution (exact identity from the ledger): electric energy -> reaction enthalpy, product heat, losses, storage.
  const E = eb.in_breakdown_J.electric_furnace / 1e9;
  const dist = Object.entries(eb.distribution_J).map(([k, v]) => [k, v / 1e9]);
  const sources = [["Electric energy to furnace", E], ...dist.filter(([, v]) => v < -0.005 * E).map(([k, v]) => [NICE[k] || k, -v])];
  const sinks = dist.filter(([, v]) => v > 0.005 * E).map(([k, v]) => [NICE[k] || k, v]);
  const tot = sources.reduce((s, [, v]) => s + v, 0) || 1;
  const W = 1000, top = 10, Hs = 300, sc = Hs / tot, gap = 10;
  let y = top; const L = sources.map(([k, v]) => { const n = { k, v, y, h: v * sc }; y += n.h + gap; return n; });
  y = top; const Rn = sinks.map(([k, v]) => { const n = { k, v, y, h: v * sc }; y += n.h + gap; return n; });
  const cols = ["var(--power)", "var(--heat)", "var(--slag)", "var(--gas)"];
  let paths = "";
  const off = Rn.map(() => 0);
  L.forEach((a, i) => { let ay = a.y; Rn.forEach((b, j) => { const h = a.h * (b.v / sinks.reduce((s, [, v]) => s + v, 0)); if (h < 0.2) return;
    const y1 = ay + h / 2, y2 = b.y + off[j] + h / 2; ay += h; off[j] += h;
    paths += `<path d="M310 ${y1} C 465 ${y1}, 465 ${y2}, 620 ${y2}" stroke="${cols[i % 4]}" stroke-opacity="0.45" stroke-width="${h}" fill="none"/>`; }); });
  const node = (n, x, left) => `<rect x="${x}" y="${n.y}" width="10" height="${Math.max(n.h, 1)}" fill="var(--ink-3)"/><text x="${left ? x - 6 : x + 16}" y="${n.y + n.h / 2 + 4}" text-anchor="${left ? "end" : "start"}" fill="var(--ink-2)" font-size="12">${n.k}: ${fmt(n.v, 1)} GJ (${fmt(100 * n.v / E, 0)} %)</text>`;
  host.innerHTML = `<svg viewBox="0 0 ${W} ${Math.max(...[...L, ...Rn].map((n) => n.y + n.h)) + 14}" style="width:100%" role="img" aria-label="Energy distribution Sankey">${paths}${L.map((n) => node(n, 300, true)).join("")}${Rn.map((n) => node(n, 620, false)).join("")}</svg>
  <p class="muted">Cumulative over ${fmt(hrs, 1)} h; percentages of electric energy into the furnace. Closure residual ${fmt(eb.residual_J / 1e9, 9)} GJ — no normalisation applied.</p>`;
}
export default {
  id: "energy", title: "Temperatures and energy", group: "Process", domain: "heat",
  mount(root) {
    const tz = canvasBox("tall"), ls = canvasBox(), lw = canvasBox(), res = canvasBox("short"), sh = canvasBox();
    R.sk = el("div"); R.eb = el("dl", { class: "kv" });
    root.append(el("div", { class: "view-head" }, el("h1", {}, "Temperatures and energy"), el("p", {}, "Zone temperatures are inverted from conserved zone enthalpy. Losses combine conduction through the lining with convection and radiation from the shell.")),
      el("div", { class: "grid" }, panel("Zone temperatures", { cls: "c8", domain: "heat" }, tz.box), panel("Energy ledger", { cls: "c4", domain: "heat" }, R.eb),
        panel("Energy flows (Sankey)", { cls: "c7", domain: "heat" }, R.sk), panel("Loss mechanisms now", { cls: "c5", domain: "heat" }, ls.box),
        panel("Heat removed through each wall", { cls: "c6", domain: "heat", note: "zone → wall inner face" }, lw.box),
        panel("Shell temperatures", { cls: "c6", domain: "heat" }, sh.box),
        panel("Energy closure residual", { cls: "c12", domain: "heat" }, res.box)));
    R.tz = lineChart(tz.canvas, { yTitle: "°C" }); R.ls = doughnut(ls.canvas); R.lw = barChart(lw.canvas, { yTitle: "MW" });
    R.res = lineChart(res.canvas, { yTitle: "MW" }); R.sh = lineChart(sh.canvas, { yTitle: "°C" });
    const tick = async () => { try { const d = await refreshDetails(); if (d) { sankey(R.sk, d.energy_balance, d.elapsed_h); } } catch { /* shown elsewhere */ } };
    tick(); timer = setInterval(tick, 8000);
  },
  update(st) {
    const s = st.snap; if (!s) return; const r = rows(), x = xs(r);
    R.tz.update(x, Object.fromEntries(["FB", "B1", "B2", "CB", "SL", "MB"].map((k) => [{ FB: "Freeboard", B1: "Upper burden", B2: "Lower burden", CB: "Coke bed", SL: "Slag", MB: "Metal" }[k], col(r, `T_${k}`, C)])));
    const p = s.wall_loss_parts_MW; R.ls.update(["Natural convection", "Radiation", "Water / forced air"], [p.convection, p.radiation, p.forced_or_water]);
    const wz = s.walls ? Object.entries(s.walls) : [];
    R.lw.update(wz.map(([k]) => k.replace("_", " ")), { "into wall (MW)": wz.map(([, w]) => w.q_in_W / 1e6), "out of shell (MW)": wz.map(([, w]) => w.q_out_W / 1e6) });
    R.res.update(x, { "Energy residual MW": col(r, "energy_balance_residual_mw") });
    R.sh.update(x, { "Slag band shell": col(r, "shell_T_slag_K", C), "Metal band shell": col(r, "shell_T_metal_K", C), "Hearth bottom": col(r, "hearth_shell_T_K", C) });
    const eb = s.energy_balance_residual_mw;
    R.eb.replaceChildren(el("dt", {}, "Electric power to furnace"), el("dd", {}, `${fmt(s.furnace_power_mw, 2)} MW`),
      el("dt", {}, "Network losses (outside boundary)"), el("dd", {}, `${fmt(s.power_split_mw.network_loss, 2)} MW`),
      el("dt", {}, "Off-gas sensible"), el("dd", {}, `${fmt(s.offgas_sensible_MW, 2)} MW`), el("dt", {}, "Off-gas chemical (LHV)"), el("dd", {}, `${fmt(s.offgas_chemical_MW, 2)} MW`),
      el("dt", {}, "Shell + roof + hearth losses"), el("dd", {}, `${fmt(s.heat_loss_total_MW, 2)} MW`), el("dt", {}, "Cooling water"), el("dd", {}, `${fmt(s.cooling_water_heat_MW, 2)} MW`),
      el("dt", {}, "SEC rolling 24 h"), el("dd", {}, `${fmt(s.specific_electric_energy_kwh_per_t_fecr, 0)} kWh/t`), el("dt", {}, "Closure residual"), el("dd", {}, `${fmt(eb, 9)} MW`));
  },
  unmount() { clearInterval(timer); },
};
