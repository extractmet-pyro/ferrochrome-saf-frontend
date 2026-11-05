// Whole-plant process schematic: stockhouse -> batching -> furnace zones -> transformer -> off-gas train
// -> tapping, slag handling, cooling water. Every number and every zone colour is bound to backend fields.
import { panel } from "../components/panel.js";
import { el, fmt } from "../utils/format.js";
import { C, heatColor } from "./helpers.js";

const W = 1840, H = 1000;
let svg;

function t(id, x, y, cls = "v", anchor = "start") { return `<text id="${id}" x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">—</text>`; }
function lbl(s, x, y, cls = "l", anchor = "start") { return `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${s}</text>`; }

function build() {
  const bins = [["ORE_A_LUMPY", "Ore A lumpy"], ["ORE_B_PELLET", "Ore B pellets"], ["ORE_C_FRIABLE", "Ore C friable"], ["COKE_MET", "Coke"],
    ["COAL_LA", "Coal"], ["QUARTZITE", "Quartzite"]];
  const binSvg = bins.map(([k, n], i) => {
    const x = 30 + i * 108;
    return `<g><path d="M${x} 70 h88 v70 l-30 34 h-28 l-30 -34 z" class="bin"/>
      ${lbl(n, x + 44, 62, "l", "middle")}${t(`bin-${k}`, x + 44, 112, "v", "middle")}${lbl("t/h", x + 44, 128, "u", "middle")}
      <line x1="${x + 44}" y1="174" x2="${x + 44}" y2="200" class="pipe solid"/></g>`;
  }).join("");
  const fx = 760, fy = 380, fw = 520, fh = 470; // furnace box
  const electrodes = [0, 1, 2].map((i) => {
    const x = fx + 120 + i * 140;
    return `<g><rect id="el-${i}" x="${x}" y="${fy - 70}" width="36" height="200" class="electrode"/>
      ${t(`elv-${i}`, x + 18, fy - 80, "v sm", "middle")}<line x1="${x + 18}" y1="${fy - 150}" x2="${x + 18}" y2="${fy - 70}" class="bus"/></g>`;
  }).join("");
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Ferrochrome SAF plant schematic with live values">
  <style>
    .bin{fill:var(--panel-2);stroke:var(--slag);stroke-width:1.5}
    .l{fill:var(--ink-2);font-size:13px}.v{fill:var(--ink);font-size:17px;font-weight:600;font-family:var(--font-read)}
    .v.sm{font-size:14px}.u{fill:var(--ink-3);font-size:11px}.h{fill:var(--ink);font-size:15px;font-weight:600}
    .pipe{stroke:var(--ink-3);stroke-width:3;fill:none;stroke-dasharray:7 5}.pipe.solid{stroke-dasharray:none}
    .gasp{stroke:var(--gas);stroke-width:5;fill:none}.water{stroke:var(--gas);stroke-width:2;fill:none;stroke-dasharray:4 4}
    .hotp{stroke:var(--heat);stroke-width:5;fill:none}.slagp{stroke:var(--slag);stroke-width:5;fill:none}
    .equip{fill:var(--panel-2);stroke:var(--line);stroke-width:1.5}.shell{fill:none;stroke:var(--ink-3);stroke-width:10}
    .lining{fill:none;stroke:var(--slag);stroke-width:14;opacity:.55}.electrode{fill:#7b8589;stroke:#c6ccce}
    .bus{stroke:var(--power);stroke-width:5;fill:none}
    .zl{fill:#fff;paint-order:stroke;stroke:rgba(0,0,0,.45);stroke-width:2.2px;font-size:13px}.zv{fill:#fff;paint-order:stroke;stroke:rgba(0,0,0,.45);stroke-width:2.2px;font-size:16px;font-weight:600;font-family:var(--font-read)}.zone{stroke:rgba(0,0,0,.25);stroke-width:1}
  </style>
  ${lbl("Raw-material stockhouse and day bins", 30, 30, "h")}
  ${binSvg}
  <path d="M30 200 H 700" class="pipe solid"/>
  <rect x="300" y="210" width="190" height="44" rx="4" class="equip"/>${lbl("Weigh hopper / batching", 395, 228, "l", "middle")}${t("feed", 395, 247, "v sm", "middle")}
  <path d="M490 232 L 700 232 L 700 ${fy - 60} L ${fx + 60} ${fy - 60} L ${fx + 60} ${fy - 30}" class="pipe solid"/>${lbl("Charging chutes", 610, fy - 70)}
  ${lbl("Submerged arc furnace FCF-1", 40, fy - 70, "h")}${t("encl", 40, fy - 48, "l")}
  <rect x="${fx}" y="${fy - 30}" width="${fw}" height="${fh + 30}" class="shell" rx="6"/>
  <rect x="${fx + 6}" y="${fy - 24}" width="${fw - 12}" height="${fh + 18}" class="lining" rx="4"/>
  <rect id="z-FB" x="${fx + 14}" y="${fy - 18}" width="${fw - 28}" height="40" class="zone"/>
  <rect id="z-B1" x="${fx + 14}" y="${fy + 22}" width="${fw - 28}" height="110" class="zone"/>
  <rect id="z-B2" x="${fx + 14}" y="${fy + 132}" width="${fw - 28}" height="110" class="zone"/>
  <ellipse id="z-CB" cx="${fx + fw / 2}" cy="${fy + 270}" rx="${fw / 2 - 40}" ry="48" class="zone"/>
  <rect id="z-SL" x="${fx + 14}" y="${fy + 300}" width="${fw - 28}" height="80" class="zone"/>
  <rect id="z-MB" x="${fx + 14}" y="${fy + 380}" width="${fw - 28}" height="72" class="zone"/>
  ${electrodes}
  ${lbl("Freeboard", fx + 24, fy + 6, "zl")}${t("T-FB", fx + fw - 24, fy + 6, "zv", "end")}
  ${lbl("Upper burden: drying, devolatilisation", fx + 24, fy + 44, "zl")}${t("T-B1", fx + fw - 24, fy + 44, "zv", "end")}${t("m-B1", fx + fw - 24, fy + 62, "zl", "end")}
  ${lbl("Lower burden: calcination, pre-reduction", fx + 24, fy + 154, "zl")}${t("T-B2", fx + fw - 24, fy + 154, "zv", "end")}${t("m-B2", fx + fw - 24, fy + 172, "zl", "end")}
  ${lbl("Coke bed / reaction zone", fx + fw / 2, fy + 262, "zl", "middle")}${t("T-CB", fx + fw / 2, fy + 282, "zv", "middle")}
  ${lbl("Slag", fx + 24, fy + 326, "zl")}${t("T-SL", fx + fw - 24, fy + 326, "zv", "end")}${t("m-SL", fx + fw - 24, fy + 346, "zl", "end")}${t("q-SL", fx + 24, fy + 346, "zl")}
  ${lbl("Metal (HC FeCr)", fx + 24, fy + 404, "zl")}${t("T-MB", fx + fw - 24, fy + 404, "zv", "end")}${t("m-MB", fx + fw - 24, fy + 424, "zl", "end")}${t("q-MB", fx + 24, fy + 424, "zl")}
  <!-- transformer & short network -->
  <rect x="${fx + 120}" y="${fy - 300}" width="320" height="70" rx="6" class="equip"/>
  ${lbl("Furnace transformer", fx + 135, fy - 278, "l")}${t("tr", fx + 135, fy - 252, "v sm")}${t("tr2", fx + 425, fy - 252, "v sm", "end")}
  <path d="M${fx + 138} ${fy - 230} V ${fy - 150} H ${fx + 418} M ${fx + 278} ${fy - 230} V ${fy - 150} M ${fx + 418} ${fy - 230} V ${fy - 150}" class="bus"/>
  ${t("pw", fx + 450, fy - 160, "v sm")}
  <!-- off-gas train -->
  <path d="M${fx + fw - 30} ${fy - 30} V ${fy - 100} H 1400 V 170 H 1460" class="gasp"/>
  <rect x="1460" y="120" width="160" height="90" rx="6" class="equip"/>${t("gas-train", 1540, 150, "l", "middle")}${t("gas-dp", 1540, 175, "u", "middle")}
  <path d="M1620 165 H 1660" class="gasp"/>
  <rect x="1660" y="110" width="170" height="110" rx="6" class="equip"/>${t("gas-use", 1745, 140, "l", "middle")}${t("gas-chem", 1745, 165, "v sm", "middle")}${lbl("chemical energy", 1745, 185, "u", "middle")}
  ${lbl("Off-gas (dry basis)", 1430, 250, "h")}
  ${t("gflow", 1430, 275)}${t("gco", 1430, 298)}${t("gco2", 1430, 320)}${t("gh2", 1430, 342)}${t("gT", 1430, 364)}${t("dust", 1430, 386)}
  <!-- cooling water -->
  <path d="M${fx - 40} ${fy + 300} H ${fx - 4} M ${fx - 40} ${fy + 420} H ${fx - 4} M ${fx - 40} ${fy + 300} V ${fy + 520} H 300" class="water"/>
  ${lbl("Shell spray and roof cooling water", 140, fy + 500, "l")}${t("cw", 140, fy + 525)}${t("loss", 140, fy + 548, "u")}${t("shell", 140, fy + 568, "u")}
  <!-- tapping -->
  <path d="M${fx + fw} ${fy + 430} H 1390 V 830" class="hotp"/>
  <path d="M${fx + fw} ${fy + 360} H 1350 V 700 H 1540" class="slagp"/>
  ${lbl("Tap-hole", fx + fw + 10, fy + 452, "u")}
  <rect x="1330" y="830" width="120" height="70" rx="10" class="equip"/>${lbl("Metal ladle", 1390, 855, "l", "middle")}${t("tapm", 1390, 880, "v sm", "middle")}
  <path d="M1450 865 H 1520" class="hotp"/>
  <rect x="1520" y="835" width="300" height="60" rx="4" class="equip"/>${lbl("Casting beds, crushing, sizing: HC FeCr", 1670, 860, "l", "middle")}${t("prod", 1670, 882, "v sm", "middle")}
  <rect x="1540" y="665" width="280" height="70" rx="4" class="equip"/>${lbl("Slag granulation / dump, jigging", 1680, 688, "l", "middle")}${t("taps", 1680, 713, "v sm", "middle")}
  ${lbl("Last tap", 1430, 450, "h")}${t("tapinfo", 1430, 475, "l")}${t("tapinfo2", 1430, 498, "u")}
  <!-- lab -->
  <rect x="30" y="${fy + 20}" width="300" height="150" rx="6" class="equip"/>
  ${lbl("Laboratory (delayed assays)", 45, fy + 44, "h")}${t("lab1", 45, fy + 70, "l")}${t("lab2", 45, fy + 94, "l")}${t("lab3", 45, fy + 118, "u")}${t("lab4", 45, fy + 140, "u")}
  <!-- heat scale -->
  <defs><linearGradient id="hs"><stop offset="0" stop-color="${heatColor(400)}"/><stop offset=".3" stop-color="${heatColor(940)}"/><stop offset=".55" stop-color="${heatColor(1390)}"/><stop offset=".8" stop-color="${heatColor(1840)}"/><stop offset="1" stop-color="${heatColor(2200)}"/></linearGradient></defs>
  <rect x="${fx}" y="${fy + 495}" width="260" height="10" fill="url(#hs)"/>${lbl("zone colour = model temperature 130 to 1930 °C", fx, fy + 525, "u")}
  </svg>`;
}

function set(id, txt) { const n = svg.querySelector(`#${id}`); if (n) n.textContent = txt; }
function fill(id, T) { const n = svg.querySelector(`#${id}`); if (n && T) n.setAttribute("fill", heatColor(T)); }

export default {
  id: "schematic", title: "Plant schematic", group: "Operate", domain: "heat",
  mount(root) {
    const wrap = el("div", { class: "schematic", html: build() });
    svg = wrap.querySelector("svg");
    root.append(el("div", { class: "view-head" }, el("h1", {}, "Plant schematic"),
      el("p", {}, "Live flowsheet of the synthetic plant. Dashed lines carry solids, blue the gas and water, amber the metal, ochre the slag.")),
      el("div", { class: "grid" }, panel("Ferrochrome smelter flowsheet", { cls: "c12" }, wrap)));
  },
  update(st) {
    const s = st.snap; if (!s || !svg) return;
    const feed = s.feed_t_per_h, mf = s.charge_mass_fraction || {};
    ["ORE_A_LUMPY", "ORE_B_PELLET", "ORE_C_FRIABLE", "COKE_MET", "COAL_LA", "QUARTZITE"].forEach((k) => set(`bin-${k}`, fmt((mf[k] || 0) * feed, 2)));
    set("feed", `${fmt(feed, 1)} t/h charge`);
    set("encl", `${s.geometry?.mva} MVA, ${s.geometry?.enclosure} roof, Ø${fmt(s.geometry?.hearth_diameter_m, 1)} m hearth`);
    for (const k of ["FB", "B1", "B2", "CB", "SL", "MB"]) { const T = s.zone_temperature_k[k]; fill(`z-${k}`, T); set(`T-${k}`, `${fmt(C(T), 0)} °C`); }
    set("m-B1", `${fmt(s.burden_upper_t, 0)} t`); set("m-B2", `${fmt(s.burden_lower_t, 0)} t`);
    set("m-SL", `${fmt(s.slag_inventory_t, 1)} t`); set("m-MB", `${fmt(s.metal_inventory_t, 1)} t`);
    set("q-SL", `Cr2O3-eq ${fmt(s.slag_cr2o3_equiv_wt_pct, 1)} %, B2 ${fmt(s.slag_props?.basicity?.["B2_(CaO+MgO)/(SiO2+Al2O3)"], 2)}`);
    set("q-MB", `Cr ${fmt(s.fecr_cr_wt_pct, 1)} %, C ${fmt(s.fecr_c_wt_pct, 2)} %, Si ${fmt(s.fecr_si_wt_pct, 2)} %`);
    const e = s.electrical;
    (s.electrode_depth_m || []).forEach((d, i) => {
      const r = svg.querySelector(`#el-${i}`); if (r) r.setAttribute("height", String(120 + d * 38));
      set(`elv-${i}`, `${fmt(e.i_phase_A[i] / 1000, 1)} kA`);
    });
    set("tr", `tap ${e.tap}, ${fmt(e.v_line_V, 0)} V line`); set("tr2", `${fmt(e.s_VA / 1e6, 1)} MVA`);
    set("pw", `${fmt(s.power_mw, 1)} MW, PF ${fmt(e.power_factor, 2)}`);
    const closed = s.geometry?.enclosure === "closed";
    set("gas-train", closed ? "Venturi scrubber" : "Hood + baghouse"); set("gas-dp", `ΔP burden ${fmt(s.burden_dp_kpa, 2)} kPa`);
    set("gas-use", closed ? "Gas holder / flare / boiler" : "Stack"); set("gas-chem", `${fmt(s.offgas_chemical_MW, 1)} MW`);
    const g = s.offgas_dry_vol_pct || {};
    set("gflow", `${fmt(s.dry_offgas_nm3_per_h, 0)} Nm³/h dry`); set("gco", `CO ${fmt(g.CO, 1)} %`); set("gco2", `CO2 ${fmt(g.CO2, 1)} %`);
    set("gh2", `H2 ${fmt(g.H2, 1)} %, N2 ${fmt(g.N2, 1)} %`); set("gT", `${fmt(C(s.offgas_T_K), 0)} °C at roof outlet`);
    set("dust", `dust ${fmt(s.dust_kg_per_h, 0)} kg/h (Cr ${fmt(s.cr_in_dust_kg_per_h, 1)} kg/h)`);
    set("cw", `${fmt(s.cooling_water_heat_MW, 2)} MW to water, ΔT ${fmt(s.cooling_water_dT_K, 1)} K`);
    set("loss", `total shell + roof loss ${fmt(s.heat_loss_total_MW, 2)} MW`);
    set("shell", `slag-band shell ${fmt(C(s.walls?.slag_band?.shell_T_K ?? null), 0)} °C`);
    const lt = s.last_tap;
    set("tapm", lt ? `${fmt(lt.metal_t, 1)} t` : "—"); set("taps", lt ? `${fmt(lt.slag_t, 1)} t slag, S/M ${fmt(lt.slag_to_metal, 2)}` : "—");
    set("prod", `${fmt(s.kpi_24h?.metal_t, 1)} t in last 24 h`);
    set("tapinfo", lt ? `#${lt.tap_no} at ${fmt(lt.t_h, 1)} h: ${fmt(C(lt.metal_T_K), 0)} °C metal` : "—");
    set("tapinfo2", lt ? `Cr ${fmt(lt.metal_wt_pct.Cr, 1)} %, slag Cr2O3-eq ${fmt(lt.slag_cr2o3_equiv_wt_pct, 1)} %, SEC ${fmt(lt.sec_kwh_per_t, 0)} kWh/t` : "");
    const lab = s.latest_lab;
    set("lab1", lab ? `Tap #${lab.tap_no}: metal Cr ${fmt(lab.metal.Cr, 2)}, C ${fmt(lab.metal.C, 2)}, Si ${fmt(lab.metal.Si, 2)}` : "awaiting first assay");
    set("lab2", lab ? `slag Cr2O3 ${fmt(lab.slag.Cr2O3, 2)}, SiO2 ${fmt(lab.slag.SiO2, 1)}, MgO ${fmt(lab.slag.MgO, 1)}` : "");
    set("lab3", lab ? `sampled ${fmt(lab.sample_t_h, 2)} h, reported ${fmt(lab.reported_t_h, 2)} h` : "");
    set("lab4", `${s.lab_pending} sample(s) in the lab queue`);
  },
  unmount() { svg = null; },
};
