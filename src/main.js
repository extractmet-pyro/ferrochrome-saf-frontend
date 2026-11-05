import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/three-scene.css";
import { apiBase, post, setApiBase, setOnAuthLost } from "./api/client.js";
import { clearToken, getToken, setToken } from "./api/auth.js";
import { sidebar } from "./components/sidebar.js";
import { header } from "./components/header.js";
import { destroyAll } from "./components/trendChart.js";
import { toast } from "./components/loadingState.js";
import { getState, setState, subscribe } from "./state/store.js";
import { attach, savedSession, startSession } from "./state/simulatorState.js";
import { el } from "./utils/format.js";
import { VIEWS } from "./views/index.js";

const app = document.getElementById("app");
let current = null, currentView = null, topNode = null, mainNode = null, railNode = null, speed = 2;
try { document.documentElement.dataset.theme = localStorage.getItem("fecr_theme") || "dark"; } catch { /* ignore */ }

setOnAuthLost(() => showLogin("Your session expired. Sign in again."));

function route() { return (location.hash.replace(/^#\/?/, "") || "overview").split("?")[0]; }

function shell() {
  app.innerHTML = "";
  railNode = sidebar(VIEWS, route(), (id) => { location.hash = `#/${id}`; });
  topNode = el("div");
  mainNode = el("main", { id: "main", tabindex: "-1" });
  app.append(railNode, topNode, mainNode);
  renderTop();
  mountView();
}

function renderTop() {
  if (!topNode) return; // shell not built yet
  const s = getState().snap;
  if (s) s.__speed = speed;
  const t = header(s, getState().conn, {
    onRun: async (run) => { await post(`/simulation/${getState().session}/pause`, { running: run, speed_steps: speed }); },
    onSpeed: async (n) => { speed = n; await post(`/simulation/${getState().session}/pause`, { running: true, speed_steps: n }); },
    onTheme: () => { const d = document.documentElement; d.dataset.theme = d.dataset.theme === "light" ? "dark" : "light"; try { localStorage.setItem("fecr_theme", d.dataset.theme); } catch { /* */ } mountView(); },
    onNew: () => onboarding(),
    onLogout: () => { clearToken(); showLogin(); },
  });
  topNode.replaceWith(t); topNode = t;
}

function mountView() {
  const id = route();
  const v = VIEWS.find((x) => x.id === id) || VIEWS[0];
  try { currentView?.unmount?.(); } catch { /* ignore */ }
  destroyAll();
  mainNode.innerHTML = "";
  current = v.id;
  const r = sidebar(VIEWS, current, (x) => { location.hash = `#/${x}`; });
  railNode.replaceWith(r); railNode = r;
  currentView = v;
  try { v.mount(mainNode, getState()); } catch (e) { mainNode.append(el("div", { class: "empty" }, `View error: ${e.message}`)); console.error(e); }
  mainNode.focus({ preventScroll: true });
}

let pending = false;
subscribe(() => {
  if (pending) return;
  pending = true;
  requestAnimationFrame(() => {
    pending = false;
    renderTop();
    if (!mainNode) return;
    try { currentView?.update?.(getState()); } catch (e) { console.error(e); }
  });
});
window.addEventListener("hashchange", () => mountView());

function showLogin(msg) {
  const users = ["operator", "metallurgist", "engineer", "viewer", "admin"];
  const userSel = el("select", { id: "lu" }, users.map((u) => el("option", { value: u }, u)));
  const pw = el("input", { id: "lp", type: "password", autocomplete: "current-password" });
  const apiIn = el("input", { id: "la", value: apiBase() });
  const err = el("div", { class: "disclaimer", role: "alert" }, msg || "");
  const back = el("div", { class: "modal-back" }, el("form", { class: "modal", onsubmit: async (e) => {
    e.preventDefault();
    setApiBase(apiIn.value.trim());
    try {
      const r = await post("/auth/login", { username: userSel.value, password: pw.value });
      setToken(r.access_token, { username: r.username, role: r.role });
      back.remove();
      boot();
    } catch (x) { err.textContent = x.message; }
  } },
    el("h2", {}, "Sign in to FeCr-TWIN"),
    el("p", {}, "Demo deployments create five role accounts (viewer, operator, metallurgist, engineer, admin) with the DEMO_PASSWORD set on the backend."),
    el("div", { class: "fields", style: "margin: 12px 0" },
      el("label", { class: "f" }, "Role account", userSel), el("label", { class: "f" }, "Password", pw)),
    el("label", { class: "f" }, "Backend API URL", apiIn),
    err, el("div", { class: "row", style: "margin-top: 12px; justify-content: flex-end" }, el("button", { class: "btn primary", type: "submit" }, "Sign in"))));
  document.body.append(back);
  pw.focus();
}

function onboarding() {
  const caps = [9, 16.5, 30, 45, 60, 81];
  const mva = el("select", {}, caps.map((c) => el("option", { value: c, selected: c === 45 ? "selected" : null }, `${c} MVA`)));
  const enc = el("select", {}, ["closed", "semi-closed", "open"].map((c) => el("option", { value: c }, c)));
  const sc = el("select", {}, "ABCDEFGHIJKL".split("").map((c) => el("option", { value: c }, `Scenario ${c}`)));
  const msg = el("p", {}, "");
  const back = el("div", { class: "modal-back" }, el("div", { class: "modal" },
    el("h2", {}, "Start the synthetic plant"),
    el("p", {}, "Loads the Industry-X demonstration furnace, warm-starts it from a converged state and streams it live. No plant data is needed."),
    el("div", { class: "fields", style: "margin: 12px 0" }, el("label", { class: "f" }, "Furnace size", mva), el("label", { class: "f" }, "Roof", enc),
      el("label", { class: "f" }, "Scenario", sc)),
    msg,
    el("div", { class: "row", style: "justify-content: flex-end" },
      getState().session ? el("button", { class: "btn", onclick: () => back.remove() }, "Cancel") : null,
      el("button", { class: "btn primary", onclick: async (e) => {
        e.target.disabled = true;
        msg.textContent = "Warming up the furnace model (first start of a new size takes up to a minute)…";
        try { await startSession({ mva: Number(mva.value), enclosure: enc.value, scenario: sc.value, speed_steps: speed }); back.remove(); shell(); }
        catch (x) { msg.textContent = x.message; e.target.disabled = false; }
      } }, "Start simulation"))));
  document.body.append(back);
}

async function boot() {
  if (!getToken()) return showLogin();
  const sid = savedSession();
  if (sid) {
    try { await attach(sid); shell(); return; } catch { /* session gone after restart */ }
  }
  app.innerHTML = "";
  app.append(el("div", { class: "empty", style: "grid-column: 1 / -1" }, "No simulation running."));
  onboarding();
}

window.addEventListener("error", (e) => toast(`Display error: ${e.message}`));
boot();
