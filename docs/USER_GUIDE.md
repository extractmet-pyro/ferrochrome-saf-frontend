# FeCr-TWIN operator desk — user guide

1. **Sign in** with a role account (viewer, operator, metallurgist, engineer, admin). Enter the backend API URL if it differs.
2. **Start the synthetic plant**: choose furnace size (9–81 MVA), roof type and scenario, then *Start simulation*. The furnace is warm-started from a converged state.
3. **Speed**: Pause / 1× / 4× / 15× / 60× (minutes of plant time per 0.5 s tick).
4. **Screens** (left rail):
   - Operate: Plant overview, Plant schematic (whole flowsheet, live), 3D furnace (cutaway, layers, camera presets, hover values), Process trajectories (all trends, CSV/PDF export).
   - Process: Chemistry & thermodynamics (Ellingham ΔG°, slag/metal properties), Kinetics & transport, Electrical & electrodes (phasors), Temperatures & energy (Sankey), Refractory & shell (through-wall profiles, freeze lining), Gas & emissions, Mass balance & products (closure, final weights, tap log, Cr reconciliation).
   - Plan: Furnace design & capacity (start a twin of another size), Charge-mix planner (balance + optimiser), Scenarios A–L, Economics & ESG.
   - Intelligence: State estimator, Machine learning, Supervisory MPC (advisory), Historical replay.
   - Admin: Data, tags & audit; Help & glossary.
5. **Reading values**: every value has a quality tag. Alarms use a shape (triangle critical, diamond warning, circle info) and text.
6. **MPC**: *Compute recommendation* → review moves, trajectories, margins and the gate → accept/reject with a reason. *Try in simulation* applies an accepted move to the simulated furnace only.

All results are SYNTHETIC / NOT PLANT-VALIDATED.
