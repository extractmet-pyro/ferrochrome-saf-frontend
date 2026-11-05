import { panel } from "../components/panel.js";
import { table } from "../components/dataTable.js";
import { toast } from "../components/loadingState.js";
import { get, post } from "../api/client.js";
import { can, getUser } from "../api/auth.js";
import { getState } from "../state/store.js";
import { el, fmt } from "../utils/format.js";
import { download, toCSV } from "../utils/export.js";

let R = {}, timer;
export default {
  id: "admin", title: "Data, tags and audit", group: "Admin", domain: "power",
  mount(root) {
    R.tags = el("div", { class: "scroll" }); R.q = el("div", { class: "scroll" }); R.audit = el("div", { class: "scroll" }); R.cfg = el("div", { class: "scroll" });
    const map = el("textarea", { rows: 4, style: "width:100%" }, "site_tag,twin_tag,scale,offset\nFCF1_PWR_MW,EL_P_TOTAL,1,0\nFCF1_CO_PCT,GAS_CO,1,0");
    root.append(el("div", { class: "view-head" }, el("h1", {}, "Data, tags and audit"), el("p", {}, `Signed in as ${getUser()?.username} (${getUser()?.role}). Role-based permissions apply to every change.`)),
      el("div", { class: "grid" }, panel("Live instrument tags (synthetic gateway)", { cls: "c7", domain: "power" }, R.tags),
        panel("Data-quality events", { cls: "c5", domain: "alarm" }, R.q),
        panel("Site tag mapping", { cls: "c5", domain: "power" }, map, el("button", { class: "btn", disabled: can("engineer") ? null : "disabled",
          onclick: () => post("/telemetry/mapping", { mapping_csv: map.value }).then((r) => toast(`${r.mapped} tags mapped`)).catch((x) => toast(x.message)) }, "Save mapping (engineer)"),
          el("button", { class: "btn", onclick: async () => { const t = await get("/config/tags"); download("tags.csv", toCSV(t.tags), "text/csv"); } }, "Download tag dictionary")),
        panel("Plant configuration parameters", { cls: "c7", domain: "slag" }, R.cfg),
        panel("Audit trail", { cls: "c12", domain: "power" }, R.audit)));
    get("/config/plant").then((c) => R.cfg.replaceChildren(table([{ label: "Parameter", key: "name" }, { label: "Symbol", key: "symbol" }, { label: "Value", get: (p) => (typeof p.value === "object" ? "(table)" : p.value) },
      { label: "Units", key: "units" }, { label: "Bounds", get: (p) => `${p.lo}…${p.hi}` }, { label: "Provenance", key: "provenance" }, { label: "Rev", key: "revision" }, { label: "Reviewer", key: "reviewer" }],
      Object.values(c.params))));
    const tick = async () => {
      const t = getState().snap?.measured_tags || {};
      R.tags.replaceChildren(table([{ label: "Tag", key: "t" }, { label: "Value", key: "value", digits: 3 }, { label: "Units", key: "units" }, { label: "Quality", key: "quality" }],
        Object.entries(t).map(([k, v]) => ({ t: k, ...v }))));
      const q = await get(`/quality/events?session_id=${getState().session}`).catch(() => ({ events: [] }));
      R.q.replaceChildren(q.events.length ? table([{ label: "Sim h", key: "t_h" }, { label: "Tag", key: "tag" }, { label: "Quality", key: "quality" }], q.events.slice(-80).reverse()) : el("p", {}, "No data-quality events."));
      const a = await get("/audit?limit=100").catch(() => []);
      R.audit.replaceChildren(table([{ label: "Time (UTC)", key: "ts" }, { label: "User", key: "user" }, { label: "Role", key: "role" }, { label: "Action", key: "action" }, { label: "Target", key: "target" },
        { label: "Detail", get: (r) => JSON.stringify(r.detail).slice(0, 90) }], a));
    };
    tick(); timer = setInterval(tick, 5000);
    void fmt;
  },
  update() {},
  unmount() { clearInterval(timer); },
};
