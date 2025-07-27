import dotenv from "dotenv";
dotenv.config();

export async function loginViaAPI(page, userIndex) {
  await page.goto("/");
  const res = await page.request.post("http://localhost:8080/api/auth/login", {
    headers: {
      "Content-Type": "application/json"
    },
    data:
      userIndex === 1
        ? { username: process.env.USER1, password: process.env.PASSWORD1 }
        : userIndex === 2
          ? { username: process.env.USER2, password: process.env.PASSWORD2 }
          : { username: process.env.USER3, password: process.env.PASSWORD3 }
  });

  if (!res.ok()) {
    throw new Error(`Login failed with status ${res.status()}`);
  }

  const cookiesHeader = res.headers()["set-cookie"];
  if (!cookiesHeader) {
    throw new Error("No Set-Cookie header in response");
  }

  const tokenMatch = cookiesHeader.match(/token=([^;]+)/);
  if (!tokenMatch) {
    throw new Error("Token cookie not found");
  }

  const token = tokenMatch[1];

  await page.context().addCookies([
    {
      name: "token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax"
    }
  ]);

  await page.goto("http://localhost:5173");
  await page.reload();
  await page.click("button.play-button");
  await page.waitForTimeout(2000);
  let leaveButton = await page.$(".leave-button");
  if (leaveButton) {
    await leaveButton.click();
  }
}
