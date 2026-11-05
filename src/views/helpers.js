import { getState } from "../state/store.js";
export const rows = () => getState().trend || [];
export const xs = (r) => r.map((d) => d.t_h);
export const col = (r, k, f = (v) => v) => r.map((d) => (d[k] == null ? null : f(d[k])));
export const C = (k) => (k == null ? null : k - 273.15);
export { heatColor } from "./heatscale.js";
