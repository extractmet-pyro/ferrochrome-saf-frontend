import { el } from "../utils/format.js";
export function numField(label, value, { unit = "", step = "any", min, max, id } = {}) {
  const input = el("input", { type: "number", value, step, min, max, id, "aria-label": `${label} (${unit})` });
  return { node: el("label", { class: "f" }, `${label}${unit ? ` (${unit})` : ""}`, input), input, get value() { return Number(input.value); } };
}
export function selectField(label, options, value) {
  const s = el("select", {}, options.map((o) => el("option", { value: o.value ?? o, selected: (o.value ?? o) === value ? "selected" : null }, o.label ?? o)));
  return { node: el("label", { class: "f" }, label, s), input: s, get value() { return s.value; } };
}
