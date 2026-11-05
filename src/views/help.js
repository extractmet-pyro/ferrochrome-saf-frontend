import { panel } from "../components/panel.js";
import { el } from "../utils/format.js";

const GLOSSARY = [
  ["SAF", "Submerged arc furnace: electrodes are buried in the charge; heat comes mainly from current through the coke bed and slag."],
  ["HC FeCr", "High-carbon ferrochrome (charge chrome), typically 50–70 % Cr and 6–8.5 % C."],
  ["Coke bed", "Layer of hot coke below the electrode tips where most reduction and resistive heating happen. Its size sets the furnace resistance."],
  ["Cr2O3-equivalent", "Cr2O3 plus CrO expressed as Cr2O3; includes undissolved chromite in the slag sample."],
  ["B1, B2", "Two different slag basicity indices: (CaO+MgO)/SiO2 and (CaO+MgO)/(SiO2+Al2O3). They are never interchanged."],
  ["SEC", "Specific electric energy: transformer secondary MWh per tonne of tapped metal."],
  ["Superheat", "Temperature above the liquidus. Low slag superheat makes tapping difficult."],
  ["Freeze lining", "Solidified slag layer on the cooled sidewall that protects the brick."],
  ["NIS", "Normalised innovation squared, the estimator’s self-check against measurements."],
  ["Shadow", "A newly trained ML model that predicts alongside the active one but is not used until an engineer activates it."],
  ["Advisory only", "Recommendations are shown to operators. This software has no path to write to plant controls."],
];
const CHECKLIST = ["Site assay campaign: ores, reductants, fluxes, slag and metal (≥ 4 weeks, with reconciliation)", "Thermocouple, flowmeter and weigh-feeder calibration records",
  "Electrode instrumentation: current, voltage to hearth, holder position, slip logs", "Gas analyser accuracy, sampling point and lag measurement", "Slag liquidus and viscosity validation samples",
  "Cr recovery closure over ≥ 30 taps within agreed tolerance", "Cybersecurity review against IEC 62443 zones and conduits; read-only gateway", "Site acceptance criteria agreed and signed"];
export default {
  id: "help", title: "Help and glossary", group: "Admin", domain: "chrome",
  mount(root) {
    root.append(el("div", { class: "view-head" }, el("h1", {}, "Help and glossary")),
      el("div", { class: "grid" }, panel("How to read values", { cls: "c6", domain: "chrome" },
        el("p", {}, "Each value carries a tag: live (synthetic instrument), model (twin prediction), estimated (state estimator), synthetic, stale or invalid. Alarms always use a shape and text, not colour alone."),
        el("p", {}, "Temperatures inside the furnace are model states. Metal and slag compositions are predictions until the delayed lab assay confirms them."),
        el("p", {}, "Start with Plant overview, then Plant schematic for the whole flowsheet, then 3D furnace. Use the speed buttons to accelerate plant time.")),
        panel("Glossary", { cls: "c6", domain: "chrome" }, el("dl", { class: "kv" }, GLOSSARY.flatMap(([k, v]) => [el("dt", {}, k), el("dd", { style: "text-align:left" }, v)]))),
        panel("Commissioning checklist (before any plant use)", { cls: "c12", domain: "alarm" }, el("ol", {}, CHECKLIST.map((c) => el("li", {}, c)))),
        panel("About", { cls: "c12" }, el("p", {}, "FeCr-TWIN is developed by Extractmet Private Limited (IIT Madras Research Park). This demonstration runs on a synthetic plant (Industry-X) and is not validated against plant data."))));
  },
  update() {},
};
