import { el, fmt } from "../utils/format.js";

export function table(cols, rows, { digits = 2, caption } = {}) {
  return el("table", { class: "data" }, caption ? el("caption", { class: "sr-only" }, caption) : null,
    el("thead", {}, el("tr", {}, cols.map((c) => el("th", { scope: "col" }, c.label || c)))),
    el("tbody", {}, rows.map((r) => el("tr", {}, cols.map((c) => {
      const k = c.key || c; const v = typeof c.get === "function" ? c.get(r) : r[k];
      return el("td", {}, typeof v === "number" ? fmt(v, c.digits ?? digits) : v ?? "—");
    })))));
}
