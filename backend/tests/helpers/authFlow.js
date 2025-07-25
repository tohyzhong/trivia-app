import request from "supertest";
import app from "../../server.js";

export async function registerAndVerifyUser() {
  const userData = {
    username: "testuser",
    email: "test@example.com",
    password: "Password1"
  };

  const registerRes = await request(app)
    .post("/api/auth/register")
    .send(userData)
    .expect(201);

  await request(app)
    .get(`/api/auth/verify?token=${global.verificationToken}`)
    .expect(200);

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ username: userData.username, password: userData.password })
    .expect(200);

  const cookie = loginRes.headers["set-cookie"]?.[0];

  return {
    user: userData,
    cookie
  };
}
