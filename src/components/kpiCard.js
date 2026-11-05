import { BIND } from "../api/schemas.js";
import { el, fmt } from "../utils/format.js";

const QLABEL = { live: "live", pred: "model", est: "estimated", syn: "synthetic", stale: "stale", bad: "invalid" };

export function qualityTag(kind) { return el("span", { class: `q ${kind}`, title: QLABEL[kind] }, QLABEL[kind] || kind); }

/** KPI tile bound to a backend field; shows unit + data-quality tag. */
export function kpi(field, { label, unit, digits = 1, domain, kind, sub } = {}) {
  const b = BIND[field] || {};
  const node = el("div", { class: "kpi", style: `--domain: var(--${domain || b.domain || "line"})`, title: b.meaning || "" },
    el("div", { class: "lbl" }, label || b.label || field, " ", qualityTag(kind || b.kind || "pred")),
    el("div", { class: "val" }, el("span", { class: "v" }, "—"), el("span", { class: "unit" }, unit ?? b.unit ?? "")),
    el("div", { class: "sub" }, sub || ""));
  return {
    node,
    set(v, subText, q) {
      node.querySelector(".v").textContent = fmt(v, digits);
      if (subText !== undefined) node.querySelector(".sub").textContent = subText;
      if (q) node.querySelector(".q").replaceWith(qualityTag(q));
    },
  };
}
