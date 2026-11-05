// Browser smoke test: login, onboarding (two clicks), every screen renders without console errors.
import { test, expect } from "@playwright/test";

const SCREENS = ["overview", "schematic", "furnace3d", "trends", "metallurgy", "kinetics", "electrical", "energy", "refractory", "gas",
  "massbalance", "design", "charge", "scenarios", "economics", "estimator", "ml", "mpc", "replay", "admin", "help"];

test("operator desk end-to-end", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !m.text().includes("fonts.g")) errors.push(m.text()); });
  await page.goto("/");
  await page.selectOption("#lu", "engineer");
  await page.fill("#lp", process.env.FECR_PW || "extractmet-demo");
  await page.fill("#la", process.env.FECR_API || "http://localhost:8000/api/v1");
  await page.click("button[type=submit]");
  await page.click("text=Start simulation");
  await expect(page.locator(".rail")).toBeVisible({ timeout: 120000 });
  for (const s of SCREENS) {
    await page.goto(`/#/${s}`);
    await expect(page.locator("main h1")).toBeVisible();
    await page.waitForTimeout(1500);
  }
  await page.goto("/#/furnace3d");
  await expect(page.locator(".stage canvas, .stage .fallback").first()).toBeVisible();
  if (await page.locator(".stage canvas").count()) await page.click("text=Cutaway"); // WebGL path; text fallback otherwise
  expect(errors.filter((e) => !e.includes("ERR_TUNNEL") && !e.includes("Failed to load resource"))).toEqual([]);
});
