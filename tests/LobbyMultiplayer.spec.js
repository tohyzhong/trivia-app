import { test, expect } from "@playwright/test";
import { loginViaAPI } from "./utils/login";
import dotenv from "dotenv";
dotenv.config();
test.describe("Multiplayer Lobby Functionality Checks", () => {
  test("Multiplayer lobby create + join (link) + reject\
      + set name + join (browse) + approve\
      + buttons (host only) + settings disabled\
      + settings change + settings update\
      + message + update host on leave\
      + kick + private lobby", async ({ browser }) => {
    const hostContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      screen: { width: 1920, height: 1080 },
      deviceScaleFactor: 1
    });
    await hostContext.addInitScript(() => {
      const clipboard = { text: "" };
      window.navigator.clipboard.writeText = async (text) => {
        clipboard.text = text;
      };
      window.navigator.clipboard.readText = async () => clipboard.text;
    });
    const guestContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      screen: { width: 1920, height: 1080 },
      deviceScaleFactor: 1
    });
    const guest2Context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      screen: { width: 1920, height: 1080 },
      deviceScaleFactor: 1
    });

    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();
    const guest2Page = await guest2Context.newPage();

    // HOST LOGIN + CREATE LOBBY
    await loginViaAPI(hostPage, 1);
    await hostPage.click("text=Play Multiplayer!");
    await hostPage.click("text=Co-op - Classic");

    // COPY INVITE LINK
    await hostPage.click("button.invite-link");
    const clipboardText = await hostPage.evaluate(() =>
      navigator.clipboard.readText()
    );

    const invitePath =
      new URL(clipboardText).pathname + new URL(clipboardText).search;

    // GUEST LOGIN
    await loginViaAPI(guestPage, 2);

    // GUEST JOIN (INVITE LINK)
    await guestPage.goto(invitePath);
    await guestPage.waitForSelector(
      "text=Waiting for host to approve your request"
    );

    // HOST REJECTS
    await hostPage.click("text=Reject");

    // HOST SETS LOBBY NAME
    await hostPage.fill('input[name="name"]', "Multiplayer Lobby Test Case 1");
    await hostPage.click("button.save-settings-button");

    // GUEST RE-JOINS (BRWOSE)
    await guestPage.goto("/play");
    await guestPage.click("text=Play Multiplayer!");
    await guestPage.click("text=Browse Lobbies");
    await guestPage.click("text=Multiplayer Lobby Test Case 1");
    await guestPage.waitForSelector(
      "text=Waiting for host to approve your request"
    );

    // HOST APPROVES
    await hostPage.click("button.approve-join");

    // BOTH SEE EACH OTHER
    await expect(hostPage.getByText("Not Ready")).toHaveCount(2);
    await expect(guestPage.getByText("Not Ready")).toHaveCount(2);

    // GUEST 2 LOGIN
    await loginViaAPI(guest2Page, 3);

    // GUEST 2 REQUEST to JOIN (LINK)
    await guest2Page.goto(invitePath);
    await guest2Page.waitForSelector(
      "text=Waiting for host to approve your request"
    );

    // GUEST CANNOT KICK/ACCEPT/REJECT (kick and reject use the same button class)
    await expect(guestPage.locator("button.kick-user")).toHaveCount(0);
    await expect(guestPage.locator("button.approve-join")).toHaveCount(0);

    // HOST REJECTS
    await hostPage.click('button.kick-user:has-text("Reject")');

    // GUEST CANNOT MODIFY SETTINGS
    await expect(guestPage.locator('input[name="name"]')).toBeDisabled();
    await expect(
      guestPage.locator('input[name="publicVisible"]')
    ).toBeDisabled();
    await expect(
      guestPage.locator('input[name="numQuestions"]')
    ).toBeDisabled();
    await expect(
      guestPage.locator('input[name="timePerQuestion"]')
    ).toBeDisabled();
    await expect(guestPage.locator('input[name="difficulty"]')).toBeDisabled();
    await expect(
      guestPage.locator('input[name="categories"]:not(:disabled)')
    ).toHaveCount(0);
    await expect(guestPage.locator(".disabled-overlay")).toBeVisible();

    // HOST MODIFY SETTINGS + PRIVATE LOBBY + Community Message
    await hostPage.fill('input[name="name"]', "Multiplayer Lobby Test Case 2");
    await hostPage.fill('input[name="numQuestions"]', "11");
    await hostPage.fill('input[name="timePerQuestion"]', "12");
    await hostPage.fill('input[name="difficulty"]', "5");
    await hostPage.check('input[name="categories"][value="Community"]');
    await hostPage.uncheck('input[name="publicVisible"]');
    await hostPage.click("button.save-settings-button");
    await expect(
      hostPage.locator(
        'input[name="categories"]:not(:disabled):not([value="Community"])'
      )
    ).toHaveCount(0);
    await expect(hostPage.locator("p.community-mode-warning")).toHaveText(
      "Note: Community Mode uses a separate question bank built from player contributions. Other categories cannot be selected together with this mode."
    );

    // GUEST SEES SETTINGS CHANGES
    await expect(guestPage.locator('input[name="name"]')).toHaveValue(
      "Multiplayer Lobby Test Case 2"
    );
    await expect(guestPage.locator('input[name="numQuestions"]')).toHaveValue(
      "11"
    );
    await expect(
      guestPage.locator('input[name="timePerQuestion"]')
    ).toHaveValue("12");
    await expect(guestPage.locator('input[name="difficulty"]')).toHaveValue(
      "5"
    );
    await expect(
      guestPage.locator('input[name="categories"][value="Community"]')
    ).toBeChecked();
    await expect(
      guestPage.locator(
        'input[name="categories"]:not(:disabled):not([value="Community"])'
      )
    ).toHaveCount(0);
    await expect(
      guestPage.locator('input[name="publicVisible"]')
    ).not.toBeChecked();
    await expect(guestPage.locator("p.community-mode-warning")).toHaveText(
      "Note: Community Mode uses a separate question bank built from player contributions. Other categories cannot be selected together with this mode."
    );

    // HOST MESSAGE
    await hostPage.fill('input[class="chat-input"]', "Host Test Message");
    await hostPage.click("button.chat-send-button");

    // GUEST MESSAGE
    await guestPage.fill('input[class="chat-input"]', "Guest Test Message");
    await guestPage.click("button.chat-send-button");

    // MESSAGE RENDERING
    await expect(guestPage.locator("span.chat-sender-name")).toContainText([
      process.env.USER1,
      process.env.USER2
    ]);
    await expect(guestPage.locator("span.chat-text")).toContainText([
      "Host Test Message",
      "Guest Test Message"
    ]);
    await expect(hostPage.locator("span.chat-sender-name")).toContainText([
      process.env.USER1,
      process.env.USER2
    ]);
    await expect(hostPage.locator("span.chat-text")).toContainText([
      "Host Test Message",
      "Guest Test Message"
    ]);

    // HOST LEAVES
    await hostPage.click("button.leave-button");

    // HOST TRANSFERRED TO GUEST
    await expect(
      guestPage.getByText(`${process.env.USER2} (Host)`)
    ).toHaveCount(1);

    // OLD HOST TRIES TO FIND IN LOBBY BROWSER
    await hostPage.goto("/play");
    await hostPage.click("text=Play Multiplayer!");
    await hostPage.click("text=Browse Lobbies");
    await expect(
      hostPage.getByText("Multiplayer Lobby Test Case 2")
    ).toHaveCount(0);

    // OLD HOST JOINS (INVITE LINK)
    await hostPage.goto(invitePath);
    await hostPage.waitForSelector(
      "text=Waiting for host to approve your request"
    );

    // GUEST ACCEPTS THEN KICKS OLD HOST
    await guestPage.click("button.approve-join");
    await expect(hostPage.getByText("Not Ready")).toHaveCount(2);
    await guestPage.click("button.kick-user");

    // OLD HOST SEES THEY WERE KICKED
    await expect(
      hostPage.getByText("You were kicked from the lobby.")
    ).toHaveCount(1);
    await expect(hostPage.getByText("Not Ready")).toHaveCount(0);

    await hostContext.close();
    await guestContext.close();
    await guest2Context.close();
  });
});
