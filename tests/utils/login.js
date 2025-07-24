export async function loginViaAPI(page, username, password) {
  const res = await page.request.post("http://localhost:8080/api/auth/login", {
    headers: {
      "Content-Type": "application/json"
    },
    data: { username, password }
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
}
