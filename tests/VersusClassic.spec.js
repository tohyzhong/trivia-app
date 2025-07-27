import { test, expect } from "@playwright/test";
import { loginViaAPI } from "./utils/login";
import dotenv from "dotenv";
dotenv.config();

test.describe("Versus Classic Game Flow", () => {
  test("Full game flow with powerups, scores, score summary, answer history, and advancing lobby", async ({
    browser
  }) => {
    const hostContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      screen: { width: 1920, height: 1080 },
      deviceScaleFactor: 1
    });
    const guestContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      screen: { width: 1920, height: 1080 },
      deviceScaleFactor: 1
    });

    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    // Host creates lobby
    await loginViaAPI(hostPage, 1);
    await hostPage.click("text=Play Multiplayer!");
    await hostPage.click("text=Versus - Classic");
    await hostPage.fill('input[name="numQuestions"]', "3");
    await hostPage.fill('input[name="timePerQuestion"]', "5");
    await hostPage.uncheck('input[name="categories"][value="General"]');
    await hostPage.check('input[name="categories"][value="Testing"]');
    await hostPage.click("button.save-settings-button");

    await hostPage.click("button.invite-link");
    const invitePath = new URL(
      await hostPage.evaluate(() => navigator.clipboard.readText())
    ).pathname;

    // Guest joins lobby
    await loginViaAPI(guestPage, 2);
    await guestPage.goto(invitePath);
    await guestPage.waitForSelector(
      "text=Waiting for host to approve your request"
    );
    await hostPage.click("button.approve-join");

    // Not enough ready players
    await hostPage.click("button.start-button");
    await expect(
      hostPage.locator("text=At least 50% must be ready to start.")
    ).toBeVisible();

    // Check Powerup Quantity before start
    const allValuesHost = await hostPage
      .locator(".icon-value span")
      .allInnerTexts();
    for (const value of allValuesHost) {
      expect(parseInt(value, 10)).toBeGreaterThanOrEqual(5);
    }
    const allValuesGuest = await guestPage
      .locator(".icon-value span")
      .allInnerTexts();
    for (const value of allValuesGuest) {
      expect(parseInt(value, 10)).toBeGreaterThanOrEqual(5);
    }

    // Only guest tries to start
    await guestPage.click("button.ready-button");
    await guestPage.click("button.start-button");
    await expect(
      guestPage.locator("text=Only host can start the game.")
    ).toBeVisible();

    // Host ready and start
    await hostPage.click("button.ready-button");
    await hostPage.click("button.start-button");

    for (let round = 1; round <= 3; round++) {
      await hostPage.waitForSelector(".question-display-container");
      await guestPage.waitForSelector(".question-display-container");

      await expect(hostPage.locator("text=Correct Answer")).not.toHaveClass(
        /correct/
      );
      await expect(guestPage.locator("text=Correct Answer")).not.toHaveClass(
        /correct/
      );

      const timeBefore = await hostPage.locator(".numeric-timer").innerText();

      if (round === 1) {
        // Wait out timer
        await hostPage.waitForTimeout(6000);
      }

      if (round === 2) {
        // Use double points
        await guestPage.click(".powerup-double");
        // Answer correctly
        await hostPage.click("text=Correct Answer");
        await guestPage.click("text=Correct Answer");
      }

      if (round === 3) {
        // Use hint, freeze
        await guestPage.click(".powerup-freeze");
        await guestPage.waitForTimeout(2000);
        const timerText = await hostPage.locator(".numeric-timer").innerText();
        expect(
          parseFloat(timerText.replace(/"/g, "").replace("s", ""))
        ).toBeGreaterThanOrEqual(
          parseFloat(timeBefore.replace(/"/g, "").replace("s", "")) + 2
        );

        await hostPage.click(".powerup-hint");
        await expect(hostPage.locator(".hint-wrong")).toHaveCount(2);
        await expect(guestPage.locator(".hint-wrong")).toHaveCount(0);

        await guestPage.click(".powerup-freeze");
        await expect(
          guestPage.locator("text=Powerup already used this round.")
        ).toHaveCount(0);

        await hostPage.click("text=Correct Answer");
        await guestPage.click("text=Wrong Answer 1");
      }

      // Verify correct answer display
      await expect(guestPage.locator("text=Correct Answer")).toHaveClass(
        /correct/
      );
      await expect(guestPage.locator("text=Correct Answer")).toHaveClass(
        /correct/
      );

      // Auto Advance Round 1 Manual Advance Round 2
      if (round === 1) {
        await expect(
          hostPage.locator("button.advance-lobby-button")
        ).toBeVisible();
        await hostPage.click("button.advance-lobby-button");
        await hostPage.waitForTimeout(10000);
      } else if (round === 2) {
        const summaryGuest = await guestPage
          .locator(".score-display")
          .innerText();
        const scoreMatchGuest = summaryGuest.match(/\+(\d+) \(Correct Score\)/);
        const scoreValueGuest = parseInt(scoreMatchGuest[1], 10);
        expect(scoreValueGuest).toBeGreaterThan(140);
        await expect(
          hostPage.locator("button.advance-lobby-button")
        ).toBeVisible();
        await hostPage.click("button.advance-lobby-button");
        await guestPage.click("button.advance-lobby-button");
      }
    }

    // Check Score Display
    const summaryHost = await hostPage.locator(".score-display").innerText();
    const summaryGuest = await guestPage.locator(".score-display").innerText();

    expect(summaryHost).toContain("Score:");
    expect(summaryGuest).toContain("Score:");
    expect(summaryHost).toMatch(/\+\d+ \(Correct Score\)/);
    expect(summaryHost).toMatch(/\+\d+ \(Streak Bonus\)/);

    // Check Host Streak Bonus
    const streakMatch = summaryHost.match(/\+(\d+) \(Streak Bonus\)/);
    const streakValue = parseInt(streakMatch[1], 10);
    expect(streakValue).toBe(10);

    // Check Score Value
    const scoreMatchHost = summaryHost.match(/\+(\d+) \(Correct Score\)/);
    const scoreValueHost = parseInt(scoreMatchHost[1], 10);
    expect(scoreValueHost).toBeLessThan(101);
    expect(scoreValueHost).toBeGreaterThan(70);

    // Check Score Summary Dot check: grey (no answer), green (correct), red (wrong)
    await expect(hostPage.locator(".dot-grey")).toHaveCount(2);
    await expect(hostPage.locator(".dot-green")).toHaveCount(3);
    await expect(hostPage.locator(".dot-red")).toHaveCount(1);

    // Back to lobby
    await hostPage.click("button.advance-lobby-button");
    await guestPage.click("button.advance-lobby-button");
    await expect(hostPage.locator(".game-lobby-settings")).toBeVisible();

    await hostContext.close();
    await guestContext.close();
  });
});
