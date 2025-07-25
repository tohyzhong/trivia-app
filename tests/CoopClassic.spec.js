import { test, expect } from "@playwright/test";
import { loginViaAPI } from "./utils/login";
import dotenv from "dotenv";
dotenv.config();

test.describe("Coop Classic", () => {
  test("renders score display, answer history, and double points powerup", async ({
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
    const contextGuest2 = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      screen: { width: 1920, height: 1080 },
      deviceScaleFactor: 1
    });

    const hostPage = await contextHost.newPage();
    const guestPage = await contextGuest.newPage();
    const guest2Page = await contextGuest2.newPage();

    // Login
    await loginViaAPI(hostPage, 1);
    await loginViaAPI(guestPage, 2);
    await loginViaAPI(guest2Page, 3);

    // Host creates Coop Classic lobby
    await hostPage.click("text=Play Multiplayer!");
    await hostPage.click("text=Co-op - Classic");
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
    await guestPage.goto(invitePath);
    await guestPage.waitForSelector(
      "text=Waiting for host to approve your request"
    );
    await hostPage.click("button.approve-join");
    await guest2Page.goto(invitePath);
    await guest2Page.waitForSelector(
      "text=Waiting for host to approve your request"
    );
    await hostPage.click("button.approve-join");

    // Ready up and start
    await guestPage.click("button.ready-button");
    await hostPage.click("button.ready-button");
    await hostPage.click("button.start-button");
    await hostPage.waitForSelector(".question-display-container");
    await guestPage.waitForSelector(".question-display-container");
    await guest2Page.waitForSelector(".question-display-container");

    // Round 1
    // 2 Correct 1 Missing
    await hostPage.getByText("Correct Answer").click();
    await guestPage.getByText("Correct Answer").click();
    await guest2Page.waitForTimeout(6000);

    // Check Correct Score and Answer History
    let summaryHost = await hostPage.locator(".score-display").innerText();
    let summaryGuest = await guestPage.locator(".score-display").innerText();
    let summaryGuest2 = await guest2Page.locator(".score-display").innerText();

    expect(summaryHost).toContain("Score:");
    expect(summaryGuest).toContain("Score:");
    expect(summaryGuest2).toContain("Score:");

    let scoreMatchHost = summaryHost.match(/\+(\d+) \(Correct Score\)/);
    let scoreValueHost = parseInt(scoreMatchHost[1], 10);
    expect(scoreValueHost).toBeLessThan(80);
    expect(scoreValueHost).toBeGreaterThan(39);
    let scoreMatchGuest = summaryGuest.match(/\+(\d+) \(Correct Score\)/);
    let scoreValueGuest = parseInt(scoreMatchGuest[1], 10);
    expect(scoreValueGuest).toBeLessThan(80);
    expect(scoreValueGuest).toBeGreaterThan(39);
    let scoreMatchGuest2 = summaryGuest2.match(/\+(\d+) \(Correct Score\)/);
    let scoreValueGuest2 = parseInt(scoreMatchGuest2[1], 10);
    expect(scoreValueGuest2).toBeLessThan(80);
    expect(scoreValueGuest2).toBeGreaterThan(39);

    // Check Correct Score Summary
    await expect(hostPage.locator(".dot-grey")).toHaveCount(1);
    await expect(hostPage.locator(".dot-green")).toHaveCount(2);
    await expect(hostPage.locator(".dot-red")).toHaveCount(0);

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

    // Next Question
    await hostPage.click("button.advance-lobby-button");
    await guestPage.click("button.advance-lobby-button");
    await guest2Page.click("button.advance-lobby-button");
    await expect(hostPage.locator("text=Correct Answer")).not.toHaveClass(
      /correct/
    );
    await expect(guestPage.locator("text=Correct Answer")).not.toHaveClass(
      /correct/
    );
    await expect(guest2Page.locator("text=Correct Answer")).not.toHaveClass(
      /correct/
    );

    // Round 2
    // Guest uses double points
    await hostPage.locator(".powerup-double").click();
    await guestPage.locator(".powerup-double").click();
    await expect(
      guestPage.locator("text=One of your teammates already used this powerup.")
    ).toBeVisible();
    await guestPage.getByText("Correct Answer").click();
    await guest2Page.getByText("Correct Answer").click();
    await hostPage.getByText("Correct Answer").click();

    // Check Correct Score Summary
    await expect(hostPage.locator(".dot-grey")).toHaveCount(1);
    await expect(hostPage.locator(".dot-green")).toHaveCount(5);
    await expect(hostPage.locator(".dot-red")).toHaveCount(0);

    // Check Answer History Bar
    await expect(
      hostPage.locator(".answer-history-bar .answer-history-item.red")
    ).toHaveCount(0);
    await expect(
      hostPage.locator(".answer-history-bar .answer-history-item.green")
    ).toHaveCount(2);
    await expect(
      hostPage.locator(".answer-history-bar .answer-history-item.grey")
    ).toHaveCount(0);

    // Check Correct Score
    summaryHost = await hostPage.locator(".score-display").innerText();
    summaryGuest = await guestPage.locator(".score-display").innerText();
    summaryGuest2 = await guest2Page.locator(".score-display").innerText();

    expect(summaryHost).toContain("Score:");
    expect(summaryGuest).toContain("Score:");
    expect(summaryGuest2).toContain("Score:");

    scoreMatchHost = summaryHost.match(/(\d+) \(\+(\d+) \(Correct Score\)/);
    scoreValueHost = parseInt(scoreMatchHost[0], 10);
    expect(scoreValueHost).toBeLessThan(311);
    expect(scoreValueHost).toBeGreaterThan(220);
    scoreMatchGuest = summaryGuest.match(/(\d+) \(\+(\d+) \(Correct Score\)/);
    scoreValueGuest = parseInt(scoreMatchGuest[0], 10);
    expect(scoreValueGuest).toBeLessThan(311);
    expect(scoreValueGuest).toBeGreaterThan(220);
    scoreMatchGuest2 = summaryGuest2.match(/(\d+) \(\+(\d+) \(Correct Score\)/);
    scoreValueGuest2 = parseInt(scoreMatchGuest2[0], 10);
    expect(scoreValueGuest2).toBeLessThan(311);
    expect(scoreValueGuest2).toBeGreaterThan(220);

    // Next Question
    await hostPage.click("button.advance-lobby-button");
    await guestPage.click("button.advance-lobby-button");
    await guest2Page.click("button.advance-lobby-button");
    await expect(hostPage.locator("text=Correct Answer")).not.toHaveClass(
      /correct/
    );
    await expect(guestPage.locator("text=Correct Answer")).not.toHaveClass(
      /correct/
    );
    await expect(guest2Page.locator("text=Correct Answer")).not.toHaveClass(
      /correct/
    );

    // Round 3
    // 3-Way Draw
    await guestPage.getByText("Correct Answer").click();
    await guest2Page.getByText("Wrong Answer 1").click();
    await hostPage.getByText("Wrong Answer 2").click();

    // Check Correct Score Summary
    await expect(hostPage.locator(".dot-grey")).toHaveCount(1);
    await expect(hostPage.locator(".dot-green")).toHaveCount(6);
    await expect(hostPage.locator(".dot-red")).toHaveCount(2);

    // Check Answer History Bar
    await expect(
      hostPage.locator(".answer-history-bar .answer-history-item.red")
    ).toHaveCount(1);
    await expect(
      hostPage.locator(".answer-history-bar .answer-history-item.green")
    ).toHaveCount(2);
    await expect(
      hostPage.locator(".answer-history-bar .answer-history-item.grey")
    ).toHaveCount(0);
    await expect(
      hostPage.locator(".player-stat-row .player-score")
    ).toHaveCount(0);

    // Check Correct Score
    summaryHost = await hostPage.locator(".score-display").innerText();
    summaryGuest = await guestPage.locator(".score-display").innerText();
    summaryGuest2 = await guest2Page.locator(".score-display").innerText();

    expect(summaryHost).toContain("Score:");
    expect(summaryGuest).toContain("Score:");
    expect(summaryGuest2).toContain("Score:");

    scoreMatchHost = summaryHost.match(/\+(\d+) \(Correct Score\)/);
    scoreValueHost = parseInt(scoreMatchHost[1], 10);
    expect(scoreValueHost).toBe(0);
    scoreMatchGuest = summaryGuest.match(/\+(\d+) \(Correct Score\)/);
    scoreValueGuest = parseInt(scoreMatchGuest[1], 10);
    expect(scoreValueGuest).toBe(0);
    scoreMatchGuest2 = summaryGuest2.match(/\+(\d+) \(Correct Score\)/);
    scoreValueGuest2 = parseInt(scoreMatchGuest2[1], 10);
    expect(scoreValueGuest2).toBe(0);

    await contextHost.close();
    await contextGuest.close();
    await contextGuest2.close();
  });
});
