import { test, expect } from "@playwright/test";
import { loginViaAPI } from "./utils/login";
import dotenv from "dotenv";
dotenv.config();

test.describe("Lobby Settings Rendering", () => {
  test("Solo: no lobby visibility", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      screen: { width: 1920, height: 1080 },
      deviceScaleFactor: 1
    });
    const page = await context.newPage();

    await loginViaAPI(page, 1);
    await page.click("text=Play Solo!");
    await page.click("text=Classic");

    await expect(page.locator("label:has-text('Categories:')")).toBeVisible();
    await expect(page.locator('input[name="publicVisible"]')).toHaveCount(0);
    const count = await page.locator('input[name="categories"]').count();
    expect(count).toBeGreaterThan(0);
    await context.close();
  });

  test("Coop Knowledge: Visibility and Community Toggle", async ({
    browser
  }) => {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      screen: { width: 1920, height: 1080 },
      deviceScaleFactor: 1
    });
    const page = await context.newPage();

    await loginViaAPI(page, 1);
    await page.click("text=Play Multiplayer!");
    await page.click("text=Co-op - Knowledge");
    await expect(page.locator('input[name="publicVisible"]')).toBeVisible();
    await page.check('input[name="community"]');
    await context.close();
  });

  test("Versus Knowledge: Visibility and Community Toggle", async ({
    browser
  }) => {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      screen: { width: 1920, height: 1080 },
      deviceScaleFactor: 1
    });
    const page = await context.newPage();

    await loginViaAPI(page, 1);
    await page.click("text=Play Multiplayer!");
    await page.click("text=Versus - Knowledge");
    await expect(page.locator('input[name="publicVisible"]')).toBeVisible();
    await page.check('input[name="community"]');
    await context.close();
  });

  test("Versus Classic: Visiblity and Categories", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      screen: { width: 1920, height: 1080 },
      deviceScaleFactor: 1
    });
    const page = await context.newPage();

    await loginViaAPI(page, 1);
    await page.click("text=Play Multiplayer!");
    await page.click("text=Versus - Classic");
    await expect(page.locator('input[name="publicVisible"]')).toBeVisible();
    await expect(page.locator("label:has-text('Categories:')")).toBeVisible();
    const count = await page.locator('input[name="categories"]').count();
    expect(count).toBeGreaterThan(0);
    await context.close();
  });
});
