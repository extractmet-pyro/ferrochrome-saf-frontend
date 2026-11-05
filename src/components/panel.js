import { el } from "../utils/format.js";
export function panel(title, { cls = "c6", domain, note, id } = {}, ...body) {
  return el("section", { class: `panel ${cls} ${domain ? "domain" : ""}`, style: domain ? `--domain: var(--${domain})` : null, id, "aria-label": title },
    el("header", {}, el("h3", {}, title), note ? el("span", { class: "note" }, note) : null), ...body);
}
export function canvasBox(cls = "") { const c = el("canvas"); return { box: el("div", { class: `chartbox ${cls}` }, c), canvas: c }; }
