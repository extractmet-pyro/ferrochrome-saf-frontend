// API -> GUI binding contract: every displayed KPI maps to an exact backend field, unit and meaning.
export const BIND = {
  metal_inventory_t: { label: "Metal in hearth", unit: "t", kind: "est", domain: "chrome", meaning: "metal bath inventory (model state)" },
  slag_inventory_t: { label: "Slag in hearth", unit: "t", kind: "est", domain: "slag", meaning: "slag layer incl. undissolved chromite + droplets" },
  fecr_cr_wt_pct: { label: "Metal Cr", unit: "wt%", kind: "pred", domain: "chrome", meaning: "predicted bath Cr (lab confirms with delay)" },
  fecr_c_wt_pct: { label: "Metal C", unit: "wt%", kind: "pred", domain: "chrome" },
  fecr_si_wt_pct: { label: "Metal Si", unit: "wt%", kind: "pred", domain: "chrome" },
  slag_cr2o3_equiv_wt_pct: { label: "Slag Cr2O3-eq", unit: "wt%", kind: "pred", domain: "slag", meaning: "Cr2O3 + CrO (as Cr2O3) incl. undissolved spinel" },
  cr_recovery_pct: { label: "Cr recovery (24 h)", unit: "%", kind: "pred", domain: "chrome", meaning: "Cr metal / (metal + slag + dust), tapped basis" },
  power_mw: { label: "Active power", unit: "MW", kind: "live", domain: "power" },
  specific_electric_energy_kwh_per_t_fecr: { label: "SEC (24 h)", unit: "kWh/t", kind: "pred", domain: "heat", meaning: "secondary-side MWh / t tapped metal" },
  offgas_co_dry_vol_pct: { label: "Off-gas CO (dry)", unit: "vol%", kind: "live", domain: "gas" },
  dry_offgas_nm3_per_h: { label: "Off-gas flow (dry)", unit: "Nm³/h", kind: "live", domain: "gas" },
  mass_balance_cr_residual_kg_per_h: { label: "Cr closure residual", unit: "kg/h", kind: "pred", domain: "chrome" },
  energy_balance_residual_mw: { label: "Energy closure residual", unit: "MW", kind: "pred", domain: "heat" },
  coke_bed_fill: { label: "Coke-bed fill", unit: "-", kind: "est", domain: "chrome", meaning: "coke-bed carbon / reference (weakly observable)" },
  feed_t_per_h: { label: "Charge rate", unit: "t/h", kind: "live", domain: "slag" },
  heat_loss_total_MW: { label: "Shell + roof losses", unit: "MW", kind: "pred", domain: "heat" },
  burden_dp_kpa: { label: "Burden ΔP proxy", unit: "kPa", kind: "pred", domain: "gas" },
  production_rate_t_per_h_est: { label: "Production (est.)", unit: "t/h", kind: "pred", domain: "chrome" },
};
export const REQUIRED_STATE_FIELDS = Object.keys(BIND).concat(["electrode_depth_m", "zone_temperature_k", "synthetic", "model_quality", "last_updated_at"]);
