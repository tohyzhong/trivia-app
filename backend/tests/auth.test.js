import { beforeAll, describe, expect, it } from "vitest";
import User from "../models/User.js";
import Profile from "../models/Profile.js";

let request;

beforeAll(() => {
  request = global.request;
});

// Registration
describe("Authentication: Registration", () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Profile.deleteMany({});
  });

  it("should register a new user", async () => {
    const response = await request.post("/api/auth/register").send({
      email: "therizzquiz@gmail.com",
      username: "testuser",
      password: "Testpassword123"
    });
    expect(response.ok).toBeTruthy();

    const userDocs = await User.find();
    const profileDocs = await Profile.find();
    expect(userDocs.length).toBe(1);
    expect(profileDocs.length).toBe(1);
  });

  it("fails if required fields are missing", async () => {
    const res = await request.post("/api/auth/register").send({});
    expect(res.status).toBe(400);
  });

  it("fails if email already exists", async () => {
    await request.post("/api/auth/register").send({
      email: "therizzquiz@gmail.com",
      username: "uniqueuser",
      password: "Testpass1"
    });
    const res = await request.post("/api/auth/register").send({
      email: "therizzquiz@gmail.com",
      username: "anotheruser",
      password: "Testpass1"
    });
    expect(res.status).toBe(400);
  });

  it("fails if username already exists", async () => {
    await request.post("/api/auth/register").send({
      email: "therizzquiz@gmail.com",
      username: "duplicateuser",
      password: "Testpass1"
    });
    const res = await request.post("/api/auth/register").send({
      email: "test@gmail.com",
      username: "duplicateuser",
      password: "Testpass1"
    });
    expect(res.status).toBe(400);
  });

  it("fails if password too short", async () => {
    const res = await request.post("/api/auth/register").send({
      email: "therizzquiz@gmail.com",
      username: "shortuser",
      password: "Tes1"
    });
    expect(res.status).toBe(400);
  });

  it("fails if password has no uppercase", async () => {
    const res = await request.post("/api/auth/register").send({
      email: "therizzquiz@gmail.com",
      username: "noupperuser",
      password: "testpass1"
    });
    expect(res.status).toBe(400);
  });

  it("fails if password has no number", async () => {
    const res = await request.post("/api/auth/register").send({
      email: "therizzquiz@gmail.com",
      username: "nonumberuser",
      password: "Testpass"
    });
    expect(res.status).toBe(400);
  });

  it("fails if username not 5-16 characters", async () => {
    const res = await request.post("/api/auth/register").send({
      email: "therizzquiz@gmail.com",
      username: "a",
      password: "Testpass1"
    });
    expect(res.status).toBe(400);

    const res2 = await request.post("/api/auth/register").send({
      email: "therizzquiz@gmail.com",
      username: "abcdefghijklmnopqrstuvwxyz",
      password: "Testpass1"
    });
    expect(res2.status).toBe(400);
  });
});

// Login/Logout
describe("Authentication: Login/Logout", () => {
  beforeAll(async () => {
    const response = await request.post("/api/auth/register").send({
      email: "therizzquiz@gmail.com",
      username: "testuser",
      password: "Testpass1"
    });
    expect(response.ok).toBeTruthy();
  });

  it("logs in with correct credentials and sets cookies", async () => {
    const res = await request.post("/api/auth/login").send({
      username: "testuser",
      password: "Testpass1"
    });
    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("fails login with wrong password", async () => {
    const res = await request.post("/api/auth/login").send({
      username: "testuser",
      password: "Wrongpass1"
    });
    expect(res.status).toBe(401);
  });

  it("fails login with wrong username", async () => {
    const res = await request.post("/api/auth/login").send({
      username: "notexist",
      password: "Testpass1"
    });
    expect(res.status).toBe(401);
  });

  it("clears cookies on logout", async () => {
    const res = await request.post("/api/auth/logout");
    const cookies = res.headers["set-cookie"];
    expect(cookies.some((c) => c.includes("token=;"))).toBe(true);
  });
});

// Password Reset
describe("Authentication: Password Reset", () => {
  it("sends forgot password email if email exists", async () => {
    const res = await request.post("/api/auth/forgotpassword").send({
      email: "therizzquiz@gmail.com"
    });
    expect(res.status).toBe(200);
    expect(global.resetToken).toBeTruthy();
  });

  it("fails forgot password for nonexistent email", async () => {
    const res = await request.post("/api/auth/forgotpassword").send({
      email: "random@gmail.com"
    });
    expect(res.status).toBe(404);
  });

  it("fails /verifyreset with invalid token", async () => {
    const res = await request
      .post("/api/auth/verifyreset")
      .send({ token: "invalidtoken" });
    expect(res.status).toBe(400);
  });

  it("verifies reset token and resets password (fail and succeed)", async () => {
    const verify = await request
      .post(`/api/auth/verifyreset`)
      .send({ token: global.resetToken });
    expect(verify.status).toBe(200);

    // too short
    let res = await request.post("/api/auth/resetpassword").send({
      token: global.resetToken,
      password: "a"
    });
    expect(res.status).toBe(400);

    // no uppercase
    res = await request.post("/api/auth/resetpassword").send({
      token: global.resetToken,
      password: "newpass1"
    });
    expect(res.status).toBe(400);

    // no number
    res = await request.post("/api/auth/resetpassword").send({
      token: global.resetToken,
      password: "Newpass"
    });
    expect(res.status).toBe(400);

    // valid reset
    res = await request.post("/api/auth/resetpassword").send({
      token: global.resetToken,
      password: "Newpass1"
    });
    expect(res.status).toBe(200);
  });
});

// Email Verification
describe("Authentication: Email Verification", () => {
  it("sends verification email with valid username", async () => {
    const res = await request.post("/api/auth/send-verification-email").send({
      username: "testuser"
    });
    expect(res.status).toBe(200);
    expect(global.verificationToken).toBeTruthy();
  });

  it("fails to send verification email with invalid username", async () => {
    const res = await request
      .post("/api/auth/send-verification-email")
      .send({ username: "nouser" });
    expect(res.status).toBe(500);
  });

  it("verifies email with valid token", async () => {
    const res = await request.get(
      `/api/auth/verify?token=${global.verificationToken}`
    );
    expect(res.status).toBe(200);
  });

  it("fails verification with invalid token", async () => {
    const res = await request.get("/api/auth/verify?token=badtoken");
    expect(res.status).toBe(500);
  });
});
