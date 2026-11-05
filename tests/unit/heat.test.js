import { test } from "node:test";
import assert from "node:assert/strict";

// heatColor lives with view helpers which import the store; replicate the pure function contract via dynamic import of a copy-free module
const { heatColor } = await import("../../src/views/heatscale.js");

test("heat colour scale is monotone in red channel up to 1800 K and clamps", () => {
  const r = (T) => Number(heatColor(T).match(/\d+/g)[0]);
  assert.ok(r(400) < r(1000) && r(1000) < r(1600));
  assert.equal(heatColor(100), heatColor(400));
  assert.equal(heatColor(5000), "rgb(255,232,192)");
});
