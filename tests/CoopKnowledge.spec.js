import { test, expect } from "@playwright/test";
import { loginViaAPI } from "./utils/login";

test.describe("Coop Knowledge", () => {
  test("renders score display, answer history bar, and score summary dots", async ({
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

    // Create Coop Knowledge lobby
    await hostPage.click("text=Play Multiplayer!");
    await hostPage.click("text=Co-op - Knowledge");
    await hostPage.fill('input[name="numQuestions"]', "3");
    await hostPage.fill('input[name="timePerQuestion"]', "5");
    await hostPage.check('input[name="community"]');
    await hostPage.click("button.save-settings-button");

    // Copy invite
    await hostPage.click("button.invite-link");
    const invitePath = new URL(
      await hostPage.evaluate(() => navigator.clipboard.readText())
    ).pathname;

    // Join
    await guestPage.goto(invitePath);
    await guestPage.waitForSelector(
      "text=Waiting for host to approve your request"
    );
    await hostPage.click("button.approve-join");

    // Start game
    await guestPage.click("button.ready-button");
    await hostPage.click("button.ready-button");
    await hostPage.click("button.start-button");

    await hostPage.waitForSelector(".question-display-container");
    await guestPage.waitForSelector(".question-display-container");

    // Simulate mixed answers
    await hostPage
      .locator('input[placeholder="Meme Name"]')
      .fill("Wrong Answer")
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

    // Check Correct Score
    let summaryHost = await hostPage
      .locator(".knowledge-score-display")
      .innerText();
    let summaryGuest = await guestPage
      .locator(".knowledge-score-display")
      .innerText();

    expect(summaryHost).toContain("Score:");
    expect(summaryGuest).toContain("Score:");

    let scoreMatchHost = summaryHost.match(/\+(\d+) \(Correct Score\)/);
    let scoreValueHost = parseInt(scoreMatchHost[1], 10);
    expect(scoreValueHost).toBeLessThan(101);
    expect(scoreValueHost).toBeGreaterThan(70);
    let scoreMatchGuest = summaryGuest.match(/\+(\d+) \(Correct Score\)/);
    let scoreValueGuest = parseInt(scoreMatchGuest[1], 10);
    expect(scoreValueGuest).toBeLessThan(101);
    expect(scoreValueGuest).toBeGreaterThan(70);

    // Check Answer History Bar
    await expect(
      hostPage.locator(".answer-history-bar .answer-history-item.red")
    ).toHaveCount(0);
    await expect(
      hostPage.locator(".answer-history-bar .answer-history-item.green")
    ).toHaveCount(1);
    await expect(
      hostPage.locator(".answer-history-bar .answer-history-item.grey")
    ).toHaveCount(0);
    await expect(
      guestPage.locator(".answer-history-bar .answer-history-item.red")
    ).toHaveCount(0);
    await expect(
      guestPage.locator(".answer-history-bar .answer-history-item.green")
    ).toHaveCount(1);
    await expect(
      guestPage.locator(".answer-history-bar .answer-history-item.grey")
    ).toHaveCount(0);

    // Check score summary dots
    await expect(hostPage.locator(".dot-green")).toHaveCount(1);
    await expect(hostPage.locator(".dot-red")).toHaveCount(1);
    await expect(hostPage.locator(".dot-grey")).toHaveCount(0);

    await contextHost.close();
    await contextGuest.close();
  });
});
