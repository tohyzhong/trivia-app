import { test, expect } from "@playwright/test";
import { loginViaAPI } from "./utils/login";

test.describe("Versus Knowledge", () => {
  test("Score rendering, answer reveal, hint and double score powerup, score summary", async ({
    browser
  }) => {
    const contextHost = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      screen: { width: 1920, height: 1080 },
      deviceScaleFactor: 1
    });
    const contextGuest = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      screen: { width: 1920, height: 1080 },
      deviceScaleFactor: 1
    });
    const hostPage = await contextHost.newPage();
    const guestPage = await contextGuest.newPage();

    // Login
    await loginViaAPI(hostPage, 1);
    await loginViaAPI(guestPage, 2);
    await hostPage.click("text=Play Multiplayer!");
    await hostPage.click("text=Versus - Knowledge");
    await hostPage.fill('input[name="numQuestions"]', "3");
    await hostPage.fill('input[name="timePerQuestion"]', "5");
    await hostPage.check('input[name="community"]');
    await hostPage.click("button.save-settings-button");

    await hostPage.click("button.invite-link");
    const invitePath = new URL(
      await hostPage.evaluate(() => navigator.clipboard.readText())
    ).pathname;

    await guestPage.goto(invitePath);
    await hostPage.click("button.approve-join");

    // Ready and start
    await hostPage.click("button.ready-button");
    await guestPage.click("button.ready-button");
    await hostPage.click("button.start-button");

    // ROUND 1
    await expect(
      hostPage.locator('.knowledge-question-answer >> text="?"')
    ).toBeVisible();

    // Both No Answer
    await guestPage.waitForTimeout(6000);

    // Check that correct answer revealed
    await expect(
      hostPage.locator('.knowledge-question-answer >> text="Correct Answer"')
    ).toBeVisible();
    await expect(
      guestPage.locator('.knowledge-question-answer >> text="Correct Answer"')
    ).toBeVisible();

    // Check "(no answer)"
    let speechBubblesHost = await hostPage.locator(".speech-bubble").all();
    for (const bubble of speechBubblesHost) {
      const text = await bubble.innerText();
      expect(text.trim()).toBe("(no answer)");
    }
    let speechBubblesGuest = await guestPage.locator(".speech-bubble").all();
    for (const bubble of speechBubblesGuest) {
      const text = await bubble.innerText();
      expect(text.trim()).toBe("(no answer)");
    }

    // Next Question
    await hostPage.click("button.advance-lobby-button");
    await guestPage.click("button.advance-lobby-button");

    // ROUND 2
    await expect(
      hostPage.locator('.knowledge-question-answer >> text="?"')
    ).toBeVisible();

    // Use hint powerup
    await hostPage.click(".powerup-hint");
    const input = hostPage.locator('input[placeholder="Co..."]');
    await expect(input).toHaveValue("Co");

    // Submit answers with double points (host)
    await hostPage.click(".powerup-double");
    await hostPage
      .locator('input[placeholder="Co..."]')
      .fill("Correct Answer")
      .then(() => hostPage.locator("button.confirm-button").click());
    await guestPage
      .locator('input[placeholder="Meme Name"]')
      .fill("Correct Answer")
      .then(() => guestPage.locator("button.confirm-button").click());

    // Check that correct answer revealed
    await expect(
      hostPage.locator('.knowledge-question-answer >> text="Correct Answer"')
    ).toBeVisible();
    await expect(
      guestPage.locator('.knowledge-question-answer >> text="Correct Answer"')
    ).toBeVisible();

    // Check that player answers are correct
    speechBubblesHost = await hostPage.locator(".speech-bubble").all();
    for (const bubble of speechBubblesHost) {
      const text = await bubble.innerText();
      expect(text.trim()).toBe("Correct Answer");
    }
    speechBubblesGuest = await guestPage.locator(".speech-bubble").all();
    for (const bubble of speechBubblesGuest) {
      const text = await bubble.innerText();
      expect(text.trim()).toBe("Correct Answer");
    }

    // Next Question
    await hostPage.click("button.advance-lobby-button");
    await guestPage.click("button.advance-lobby-button");

    // Round 3
    await expect(
      hostPage.locator('.knowledge-question-answer >> text="?"')
    ).toBeVisible();

    // Submit Answers
    await hostPage
      .locator('input[placeholder="Meme Name"]')
      .fill("Correct Answer")
      .then(() => hostPage.locator("button.confirm-button").click());
    await guestPage
      .locator('input[placeholder="Meme Name"]')
      .fill("Correct Answer")
      .then(() => guestPage.locator("button.confirm-button").click());

    // Check that correct answer revealed
    await expect(
      hostPage.locator('.knowledge-question-answer >> text="Correct Answer"')
    ).toBeVisible();
    await expect(
      guestPage.locator('.knowledge-question-answer >> text="Correct Answer"')
    ).toBeVisible();

    // Check Score Display
    const summaryHost = await hostPage
      .locator(".knowledge-score-display")
      .innerText();
    const summaryGuest = await guestPage
      .locator(".knowledge-score-display")
      .innerText();

    expect(summaryHost).toContain("Score:");
    expect(summaryGuest).toContain("Score:");
    expect(summaryHost).toMatch(/\+\d+ \(Correct Score\)/);
    expect(summaryHost).toMatch(/\+\d+ \(Streak Bonus\)/);

    // Check Streak Bonus
    const streakMatchHost = summaryHost.match(/\+(\d+) \(Streak Bonus\)/);
    const streakValueHost = parseInt(streakMatchHost[1], 10);
    expect(streakValueHost).toBe(10);
    const streakMatchGuest = summaryGuest.match(/\+(\d+) \(Streak Bonus\)/);
    const streakValueGuest = parseInt(streakMatchGuest[1], 10);
    expect(streakValueGuest).toBe(10);

    // Check Score Value
    const scoreMatchHost = summaryHost.match(
      /(\d+) \(\+(\d+) \(Correct Score\)/
    );
    const scoreValueHost = parseInt(scoreMatchHost[0], 10);
    expect(scoreValueHost).toBeLessThan(311);
    expect(scoreValueHost).toBeGreaterThan(210);
    const scoreMatchGuest = summaryGuest.match(
      /(\d+) \(\+(\d+) \(Correct Score\)/
    );
    const scoreValueGuest = parseInt(scoreMatchGuest[0], 10);
    expect(scoreValueGuest).toBeLessThan(211);
    expect(scoreValueGuest).toBeGreaterThan(140);

    // Check Score Summary Dot check: grey (no answer), green (correct), red (wrong)
    await expect(hostPage.locator(".dot-grey")).toHaveCount(2);
    await expect(hostPage.locator(".dot-green")).toHaveCount(4);
    await expect(hostPage.locator(".dot-red")).toHaveCount(0);

    // Check Score Summary renders score for Versus
    const scores = await hostPage
      .locator(".player-stat-row .player-score")
      .allInnerTexts();
    const firstScore = parseInt(scores[0], 10);
    const secondScore = parseInt(scores[1], 10);
    expect(Number.isInteger(firstScore)).toBeTruthy();
    expect(Number.isInteger(secondScore)).toBeTruthy();
    expect(secondScore).toBeLessThan(firstScore);

    // Check Answer History Bar
    await expect(
      hostPage.locator(".answer-history-bar .answer-history-item.red")
    ).toHaveCount(0);
    await expect(
      hostPage.locator(".answer-history-bar .answer-history-item.green")
    ).toHaveCount(2);
    await expect(
      hostPage.locator(".answer-history-bar .answer-history-item.grey")
    ).toHaveCount(1);
    await expect(
      guestPage.locator(".answer-history-bar .answer-history-item.red")
    ).toHaveCount(0);
    await expect(
      guestPage.locator(".answer-history-bar .answer-history-item.green")
    ).toHaveCount(2);
    await expect(
      guestPage.locator(".answer-history-bar .answer-history-item.grey")
    ).toHaveCount(1);

    await contextHost.close();
    await contextGuest.close();
  });
});
