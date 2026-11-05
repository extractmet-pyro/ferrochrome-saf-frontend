import * as THREE from "three";
import { panel } from "../components/panel.js";
import { el, fmt } from "../utils/format.js";
import { applyHeat, mats } from "../three/materials.js";
import { dims } from "../three/geometry.js";
import { makeScene, webglAvailable } from "../three/scene.js";
import { buildFurnace } from "../three/furnace.js";
import { buildElectrodes } from "../three/electrodes.js";
import { buildBurden } from "../three/burden.js";
import { buildPhases } from "../three/phases.js";
import { buildGas } from "../three/gas.js";
import { PRESETS, goPreset, makeControls } from "../three/controls.js";
import { makePicker } from "../three/labels.js";
import { loop } from "../three/animations.js";
import { disposeTree } from "../three/dispose.js";
import { C } from "./helpers.js";

let ctx = null;

function layerToggle(name, obj, checked = true) {
  const cb = el("input", { type: "checkbox", checked: checked ? "checked" : null, onchange: () => { obj.visible = cb.checked; } });
  return el("label", { class: "row" }, cb, name);
}

export default {
  id: "furnace3d", title: "3D furnace", group: "Operate", domain: "power",
  mount(root, st) {
    const stage = el("div", { class: "stage", role: "img", "aria-label": "Interactive 3D model of the submerged arc furnace; values available in the text readout beside it" });
    const tip = el("div", { class: "tip" });
    const readout = el("dl", { class: "kv" });
    root.append(el("div", { class: "view-head" }, el("h1", {}, "3D furnace"),
      el("p", {}, "Phase levels, electrode positions, coke-bed size and zone colours follow the live model. Drag to orbit, scroll to zoom, hover for values.")),
      el("div", { class: "grid" }, panel("Submerged arc furnace", { cls: "c9" }, stage), panel("Text readout", { cls: "c3", domain: "power" }, readout,
        el("p", { class: "muted" }, "Colour scale: model temperature 130 °C (blue) to 1930 °C (white-yellow). Gas marker speed scales with off-gas flow."),
        el("div", { class: "heatscale", role: "img", "aria-label": "temperature colour scale" }))));
    if (!webglAvailable()) { stage.append(el("div", { class: "fallback" }, "WebGL is not available in this browser. Use the plant schematic and text readout instead.")); ctx = { readout }; return; }
    const s = st.snap;
    const d = dims(s?.geometry);
    const clip = [new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)];
    const M = mats(clip);
    const sc = makeScene(stage);
    const root3 = new THREE.Group(); sc.scene.add(root3);
    const furn = buildFurnace(d, M);
    const phases = buildPhases(d, M);
    const burden = buildBurden(d, M);
    const elec = buildElectrodes(d, M, 5);
    const gas = buildGas(d);
    root3.add(furn.group, phases.group, burden.group, elec.group, gas.points);
    const controls = makeControls(sc.camera, sc.renderer.domElement);
    const unpick = makePicker(sc.camera, sc.renderer.domElement, root3, tip);
    stage.append(tip);
    let cut = true, paused = false;
    const roofObj = furn.group.children.find((c) => c.userData.roof);
    const tools = el("div", { class: "tools" },
      el("div", { class: "seg", role: "group", "aria-label": "Camera presets" }, Object.keys(PRESETS).map((p) => el("button", { onclick: () => goPreset(sc.camera, controls, p) }, p))),
      el("div", { class: "seg" },
        el("button", { "aria-pressed": "true", onclick: (e) => { cut = !cut; clip[0].constant = cut ? 0 : 1000; e.target.setAttribute("aria-pressed", String(cut)); } }, "Cutaway"),
        el("button", { "aria-pressed": "false", onclick: (e) => { paused = !paused; e.target.setAttribute("aria-pressed", String(paused)); } }, "Pause motion"),
        el("button", { onclick: () => goPreset(sc.camera, controls, "Isometric") }, "Reset view")));
    const hud = el("div", { class: "hud" }, el("div", { class: "panel" }, el("strong", {}, "Layers"),
      layerToggle("Shell and lining", furn.group), layerToggle("Burden and coke bed", burden.group), layerToggle("Slag and metal", phases.group),
      layerToggle("Electrodes", elec.group), layerToggle("Gas flow markers", gas.points), layerToggle("Roof", roofObj)));
    stage.append(tools, hud);
    const stopLoop = loop((dt) => {
      controls.update();
      if (!paused && ctx?.flow != null) gas.tick(dt, ctx.flow, ctx.yb0 ?? 1, ctx.ytop ?? d.Hb);
      sc.renderer.render(sc.scene, sc.camera);
    }, 30);
    ctx = { sc, root3, phases, burden, elec, M, readout, stopLoop, unpick, controls, d, furn };
    this.update(st);
  },
  update(st) {
    const s = st.snap; if (!s || !ctx) return;
    const T = s.zone_temperature_k;
    if (ctx.phases) {
      const hPh = ctx.phases.set(s.geometry, s);
      const ytop = ctx.burden.set(hPh, s.coke_bed_fill, T);
      ctx.elec.set(s.electrode_depth_m, s.electrical?.i_phase_A, ytop);
      applyHeat(ctx.burden.meshes.upper.material, T.B1); applyHeat(ctx.burden.meshes.lower.material, T.B2);
      applyHeat(ctx.burden.meshes.coke.material, T.CB); applyHeat(ctx.phases.meshes.slag.material, T.SL); applyHeat(ctx.phases.meshes.metal.material, T.MB);
      ctx.sc.glow.intensity = 10 + 40 * Math.min(s.power_mw / 40, 1.5);
      ctx.flow = s.dry_offgas_nm3_per_h; ctx.yb0 = hPh; ctx.ytop = ytop;
    }
    const e = s.electrical || {};
    ctx.readout.replaceChildren(
      ...[["Metal", `${fmt(s.metal_inventory_t, 1)} t at ${fmt(C(T.MB), 0)} °C`], ["Slag", `${fmt(s.slag_inventory_t, 1)} t at ${fmt(C(T.SL), 0)} °C`],
        ["Coke bed", `fill ${fmt(s.coke_bed_fill, 2)}, ${fmt(C(T.CB), 0)} °C`], ["Lower burden", `${fmt(C(T.B2), 0)} °C`], ["Upper burden", `${fmt(C(T.B1), 0)} °C`],
        ["Freeboard", `${fmt(C(T.FB), 0)} °C`],
        ...[0, 1, 2].map((i) => [`Electrode ${i + 1}`, `${fmt(s.electrode_depth_m[i], 2)} m, ${fmt(e.i_phase_A?.[i] / 1000, 1)} kA, ${fmt(e.p_load_W?.[i] / 1e6, 1)} MW`]),
        ["Off-gas", `${fmt(s.dry_offgas_nm3_per_h, 0)} Nm³/h, CO ${fmt(s.offgas_co_dry_vol_pct, 1)} %`]].flatMap(([k, v]) => [el("dt", {}, k), el("dd", {}, v)]));
  },
  unmount() {
    if (ctx?.sc) { ctx.stopLoop(); ctx.unpick(); ctx.controls.dispose(); disposeTree(ctx.sc.scene); ctx.sc.renderer.dispose(); ctx.sc.ro.disconnect(); ctx.sc.renderer.domElement.remove(); }
    ctx = null;
  },
};
