export const LABEL = { K: "K", C: "°C", MW: "MW", t: "t", "wt%": "wt%", "vol%": "vol%", Nm3h: "Nm³/h", kWht: "kWh/t" };
export function convert(v, from, to) {
  if (v == null) return v;
  if (from === to) return v;
  if (from === "K" && to === "C") return v - 273.15;
  if (from === "C" && to === "K") return v + 273.15;
  if (from === "t" && to === "kg") return v * 1000;
  if (from === "kg" && to === "t") return v / 1000;
  if (from === "MWh" && to === "MJ") return v * 3600;
  throw new Error(`unsupported conversion ${from}->${to}`);
}
