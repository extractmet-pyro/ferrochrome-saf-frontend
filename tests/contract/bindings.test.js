// Contract: every field the GUI binds to must exist in a real backend state payload.
// Runs against a live backend when FECR_API is set (CI job starts one); otherwise uses the recorded seed scenario.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { REQUIRED_STATE_FIELDS } from "../../src/api/schemas.js";

async function state() {
  const api = process.env.FECR_API;
  if (!api) return JSON.parse(fs.readFileSync(new URL("./seed_state.json", import.meta.url)));
  const tok = (await (await fetch(`${api}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "viewer", password: process.env.FECR_PW || "extractmet-demo" }) })).json()).access_token;
  const h = { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" };
  const s = await (await fetch(`${api}/simulation/run`, { method: "POST", headers: h, body: JSON.stringify({ run: false }) })).json();
  return s.state;
}

test("GUI-bound fields exist in backend state", async () => {
  const s = await state();
  const missing = REQUIRED_STATE_FIELDS.filter((f) => !(f in s));
  assert.deepEqual(missing, []);
  assert.equal(s.synthetic, true);
  assert.equal(s.electrode_depth_m.length, 3);
});
