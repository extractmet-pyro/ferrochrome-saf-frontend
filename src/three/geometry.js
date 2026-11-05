// Map backend geometry (metres) to scene units (1 unit = 1 m). All dimensions are data, not decoration.
export function dims(g) {
  const D = g?.hearth_diameter_m ?? 10, Hb = g?.burden_height_m ?? 5, De = g?.electrode_diameter_m ?? 1.5, pcd = g?.pcd_m ?? 4;
  const lining = (g?.lining?.slag_band || []).reduce((s, l) => s + l.thickness_m, 0) || 0.8;
  const hearth = (g?.lining?.hearth || []).reduce((s, l) => s + l.thickness_m, 0) || 1.8;
  return { R: D / 2, Hb, De, pcd, lining, hearth, fb: g?.freeboard_m ?? 1.6, metal: g?.metal_depth_m ?? 0.3, slag: g?.slag_depth_m ?? 0.5 };
}
