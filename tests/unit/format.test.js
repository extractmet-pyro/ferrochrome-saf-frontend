import { test } from "node:test";
import assert from "node:assert/strict";
import { convert } from "../../src/utils/units.js";
import { assayErrors } from "../../src/utils/validation.js";

test("unit conversions are explicit and reject unknown pairs", () => {
  assert.equal(convert(1873.15, "K", "C"), 1600);
  assert.equal(convert(2, "t", "kg"), 2000);
  assert.equal(convert(1, "MWh", "MJ"), 3600);
  assert.throws(() => convert(1, "kWh", "kg"));
});

test("assay validation rejects fractions and bad totals", () => {
  assert.ok(assayErrors({ Cr2O3: 0.5, SiO2: 0.5 }).length > 0);
  assert.ok(assayErrors({ Cr2O3: 40, SiO2: 40 }).length > 0);
  assert.equal(assayErrors({ Cr2O3: 60, SiO2: 40 }).length, 0);
  assert.ok(assayErrors({ Cr2O3: -1, SiO2: 101 }).length > 0);
});
