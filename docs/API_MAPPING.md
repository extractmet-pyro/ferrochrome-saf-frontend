# API to GUI binding contract (FeCr-TWIN)

All values shown in the desk come from backend responses. Field names below are the exact JSON keys.
Frequency: WebSocket `/api/v1/ws/telemetry` pushes the light state every 0.5 s tick (each tick = N simulation steps of 60 s);
heavy payloads (`/simulation/{id}/details`) refresh every 8–10 s. Quality tags: **live** (synthetic instrument),
**model** (twin prediction), **estimated** (EKF state), **synthetic**, **stale** (no message > 8 s), **invalid** (solver fallback).

| GUI element | Backend field | Units | Meaning / uncertainty display |
|---|---|---|---|
| Metal in hearth | `metal_inventory_t` | t | model state; EKF estimate ± 95 % CI in State estimator |
| Slag in hearth | `slag_inventory_t` | t | includes undissolved chromite + droplets |
| Metal Cr / C / Si | `fecr_cr_wt_pct`, `fecr_c_wt_pct`, `fecr_si_wt_pct` | wt% | prediction; delayed lab in `latest_lab` |
| Slag Cr2O3-eq | `slag_cr2o3_equiv_wt_pct` | wt% | Cr2O3 + 1.117·CrO incl. spinel |
| Cr recovery | `cr_recovery_pct` / `kpi_24h.denominators` | % | Cr metal / (metal + slag + dust), tapped, 24 h |
| Active power | `power_mw` | MW | transformer secondary (incl. network loss) |
| SEC | `specific_electric_energy_kwh_per_t_fecr` | kWh/t | 24 h electric MWh / t tapped metal |
| Electrode depth | `electrode_depth_m[3]` | m | tip below burden surface |
| Zone temperatures | `zone_temperature_k.{B1,B2,CB,SL,MB,FB}` | K | enthalpy-inverted model states |
| Off-gas CO | `offgas_co_dry_vol_pct` (model), `analyzer_dry_vol_pct.CO` | vol% dry | analyzer with lag/bias/stuck |
| Off-gas flow | `dry_offgas_nm3_per_h`, `wet_offgas_nm3_per_h` | Nm³/h | 0 °C, 101.325 kPa |
| Cr closure | `mass_balance_cr_residual_kg_per_h` | kg/h | ledger residual since session start |
| Energy closure | `energy_balance_residual_mw` | MW | ledger residual (formation-enthalpy basis) |
| Coke-bed fill | `coke_bed_fill` | – | carbon / reference; weakly observable |
| Model quality | `model_quality`, `status` | – | `physics-only` / `frozen` |
| Synthetic flag | `synthetic`, `mode_label` | – | always true in demo |
| Timestamp | `last_updated_at`, `t_h` | s / h | simulation clock |
| 3D phase heights | `geometry.metal_depth_m`, `geometry.slag_depth_m` | m | from inventories / hearth area |
| 3D coke bed | `coke_bed_fill` | – | thickness 0.8 m × fill |
| Heat colour | zone temperatures | K | scale 400–2200 K (shared with schematic) |
| Trend rows | `trend_row`, `/simulation/{id}/timeseries` | mixed | compact history (see `TREND_KEYS`) |
| Wall profiles | `/details → walls.*.x_m, T_K` | m, K | FV node temperatures |
| Mass ledgers | `/details → streams_in, streams_out, zones` | kg | species & element totals |
| Energy Sankey | `/details → energy_balance.distribution_J` | J | exact identity, no normalisation |
| Estimator | `/estimator/state` | – | estimate, sd, ci95, observability, NIS |
| MPC | `/mpc/recommend` | – | moves, predicted, verification, gate, signature |

Contract tests: `tests/contract/bindings.test.js` (frontend) and `tests/contract/test_api.py` (backend).
