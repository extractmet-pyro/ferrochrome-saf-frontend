import { el } from "../utils/format.js";

export function sidebar(views, current, onNav) {
  const groups = {};
  views.forEach((v) => (groups[v.group] ||= []).push(v));
  return el("nav", { class: "rail", "aria-label": "Screens" },
    el("div", { class: "brand" }, el("div", { class: "mark" }, "FeCr", el("span", {}, "-TWIN")),
      el("div", { class: "by" }, "Submerged arc furnace twin · Extractmet")),
    Object.entries(groups).map(([g, vs]) => el("div", { class: "navgroup" }, el("h4", {}, g),
      vs.map((v) => el("button", { class: "navlink", style: `--domain: var(--${v.domain || "chrome"})`, "aria-current": v.id === current ? "page" : null,
        onclick: () => onNav(v.id) }, el("span", { class: "dot", "aria-hidden": "true" }), v.title)))),
    el("div", { class: "foot" }, el("div", { class: "disclaimer" }, "Synthetic demonstration data. Advisory only — this software never writes to plant controls."),
      el("div", {}, "© Extractmet Private Limited")));
}
