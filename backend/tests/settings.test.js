import { registerAndVerifyUser } from "./helpers/authFlow.js";
import { beforeAll, describe, expect, it } from "vitest";
import Profile from "../models/Profile.js";
import User from "../models/User.js";

let cookie;
let user;
let request;

beforeAll(async () => {
  await User.deleteMany({});
  await Profile.deleteMany({});
  const obj = await registerAndVerifyUser();
  cookie = obj.cookie;
  user = obj.user;
  request = global.request;
});

describe("Settings", () => {
  describe("Update Profile Picture", () => {
    it("should successfully update profile picture", async () => {
      const newUrl = "testimage.png";

      const response = await request
        .post("/api/settings/update-profile-picture")
        .set("Cookie", cookie)
        .send({ username: user.username, profilePictureUrl: newUrl });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe(
        "Profile picture updated successfully"
      );
      expect(response.body.user.profilePicture).toBe(newUrl);

      const updated = await Profile.findOne({ username: user.username });
      expect(updated.profilePicture).toBe(newUrl);
    });

    it("should return 401 if not authenticated", async () => {
      const response = await request
        .post("/api/settings/update-profile-picture")
        .send({
          username: user.username,
          profilePictureUrl: "unauthorised.png"
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Not authenticated/i);
    });
  });

  describe.sequential("Change Password Flow", () => {
    it("should send change-password email and successfully change password", async () => {
      // Request password change
      const res = await request
        .post("/api/settings/change-password")
        .set("Cookie", cookie)
        .send({ username: user.username });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe(
        "Verification email sent to change password"
      );

      expect(global.changePasswordToken).toBeDefined();

      // Use token to change the password
      const newPassword = "NewPassw0rd!!";
      const verifyRes = await request.post("/api/settings/verify-action").send({
        token: global.changePasswordToken,
        newPassword
      });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.message).toBe("Password changed successfully");

      // Login with the new password
      const loginRes = await request.post("/api/auth/login").send({
        username: user.username,
        password: newPassword
      });

      expect(loginRes.status).toBe(200);
      expect(loginRes.headers["set-cookie"]).toBeDefined();
    });

    it("should reject reused token", async () => {
      const reusedRes = await request.post("/api/settings/verify-action").send({
        token: global.changePasswordToken,
        newPassword: "AnotherNewPassword1!"
      });

      expect(reusedRes.status).toBe(400);
      global.changePasswordToken = null;
      expect(reusedRes.body.error).toBe("This token has already been used.");
    });

    it("should reject reusing the same previous password", async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // to ensure new token generated after some time
      // Request another change-password token
      const res = await request
        .post("/api/settings/change-password")
        .set("Cookie", cookie)
        .send({ username: user.username });

      expect(res.status).toBe(200);
      expect(global.changePasswordToken).toBeDefined();

      // Attempt to reuse old password
      const verifyRes = await request.post("/api/settings/verify-action").send({
        token: global.changePasswordToken,
        newPassword: "NewPassw0rd!!" // Same as before
      });

      expect(verifyRes.status).toBe(400);
      expect(verifyRes.body.errors[0].msg).toBe(
        "Your new password cannot be the same as your last 3 passwords."
      );
    });

    it("should reject password shorter than 8 characters", async () => {
      const res = await request.post("/api/settings/verify-action").send({
        token: global.changePasswordToken,
        newPassword: "Abc123" // 6 chars
      });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toBe(
        "Password must be at least 8 characters long."
      );
    });

    it("should reject password missing uppercase", async () => {
      const res = await request.post("/api/settings/verify-action").send({
        token: global.changePasswordToken,
        newPassword: "lowercase123"
      });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toBe(
        "Password must contain at least one uppercase letter."
      );
    });

    it("should reject password missing lowercase", async () => {
      const res = await request.post("/api/settings/verify-action").send({
        token: global.changePasswordToken,
        newPassword: "UPPERCASE123"
      });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toBe(
        "Password must contain at least one lowercase letter."
      );
    });

    it("should reject password missing number", async () => {
      const res = await request.post("/api/settings/verify-action").send({
        token: global.changePasswordToken,
        newPassword: "NoNumbersHere"
      });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toBe(
        "Password must contain at least one number."
      );
    });
  });

  describe.sequential("Change Email", () => {
    const newEmail = "newemail@example.com";

    it("should send verification to new email and complete email change", async () => {
      const res = await request
        .post("/api/settings/change-email")
        .set("Cookie", cookie)
        .send({ username: user.username, newEmail });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe(
        "Verification email sent to the new email for change"
      );

      const token = global.changeEmailToken;
      expect(token).toBeDefined();

      const verifyRes = await request
        .post("/api/settings/verify-action")
        .set("Cookie", cookie)
        .send({ token });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.message).toBe("Email changed successfully");

      const updatedUser = await User.findOne({ username: user.username });
      expect(updatedUser.email).toBe(newEmail);
    });

    it("fail to change to email in use", async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const res = await request
        .post("/api/settings/change-email")
        .set("Cookie", cookie)
        .send({ username: user.username, newEmail });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe(
        "Verification email sent to the new email for change"
      );

      const token = global.changeEmailToken;
      expect(token).toBeDefined();

      const verifyRes = await request
        .post("/api/settings/verify-action")
        .set("Cookie", cookie)
        .send({ token });

      expect(verifyRes.status).toBe(400);
      expect(verifyRes.body.error).toBe("Email is already in use");

      const updatedUser = await User.findOne({ username: user.username });
      expect(updatedUser.email).toBe(newEmail);
    });
  });

  describe("Delete Account", () => {
    it("should send verification email and delete user using token", async () => {
      const res = await request
        .post("/api/settings/delete-account")
        .set("Cookie", cookie)
        .send({ username: user.username });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe(
        "Verification email sent to confirm account deletion"
      );
      expect(global.deleteAccountToken).toBeDefined();

      const token = global.deleteAccountToken;

      const res2 = await request.post("/api/settings/verify-action").send({
        token
      });

      expect(res2.status).toBe(200);
      expect(res2.body.message).toBe("Account deleted successfully");

      const deletedUser = await User.findOne({ username: user.username });
      const deletedProfile = await Profile.findOne({ username: user.username });
      expect(deletedUser).toBeNull();
      expect(deletedProfile).toBeNull();
    });
  });
});
