# FeCr-TWIN operator desk — frontend (Extractmet Private Limited)

HTML5 + modular CSS + ES-module JavaScript + **Three.js** + Chart.js, built with Vite. 21 screens: plant overview,
live plant schematic, interactive 3D furnace, trajectories, chemistry & thermodynamics, kinetics, electrical,
energy (Sankey), refractory, gas, mass balance & products, furnace design & capacity, charge planner, scenarios A–L,
economics & ESG, state estimator, machine learning, supervisory MPC (advisory), historical replay, data/audit, help.

> All values come from the backend (`ferrochrome-saf-backend`). Demonstration data are SYNTHETIC / NOT PLANT-VALIDATED.
> The desk never sends commands to plant equipment.

```bash
npm ci
cp .env.example .env          # VITE_API_BASE_URL=http://localhost:8000/api/v1
npm run dev                   # http://localhost:5173
npm test                      # unit + API-binding contract tests (node --test)
npm run build                 # static site in dist/
FECR_WEB=http://localhost:4173 npx playwright test   # browser smoke test (backend + `npm run preview` running)
```

Deployment as a Render Static Site: `render.yaml`, and `docs/DEPLOYMENT_GUIDE.md`.
Field bindings: `docs/API_MAPPING.md`. User guide: `docs/USER_GUIDE.md`.

© Extractmet Private Limited — proprietary licence (see LICENSE).
