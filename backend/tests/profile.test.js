import { registerAndVerifyUser } from "./helpers/authFlow.js";
import { beforeAll, describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import Profile from "../models/Profile.js";
import User from "../models/User.js";
import Friend from "../models/Friend.js";
import Lobby from "../models/Lobby.js";

let cookie;
let user;
let request;

let superadminCookie;
let adminCookie;
let userCookie;
const hashedPassword = await bcrypt.hash("Password1", 10);

beforeAll(async () => {
  superadminCookie = global.superadminCookie;
  adminCookie = global.adminCookie;
  userCookie = global.userCookie;

  await User.deleteMany({});
  await Profile.deleteMany({});

  // Main test user (registered via full flow)
  const obj = await registerAndVerifyUser();
  cookie = obj.cookie;
  user = obj.user;
  request = global.request;

  // Manually inserted users for role-based access tests

  await User.create({
    username: "basic_user",
    email: "basic@example.com",
    verified: true,
    chatBan: false,
    gameBan: false,
    role: "user",

    password: hashedPassword,
    previousPasswords: [hashedPassword]
  });

  await User.create({
    username: "admin_user",
    email: "admin@example.com",
    verified: true,
    chatBan: false,
    gameBan: false,
    role: "admin",

    password: hashedPassword,
    previousPasswords: [hashedPassword]
  });

  await User.create({
    username: "superadmin_user",
    email: "superadmin@example.com",
    verified: true,
    chatBan: false,
    gameBan: false,
    role: "superadmin",

    password: hashedPassword,
    previousPasswords: [hashedPassword]
  });

  await Profile.insertMany([
    {
      username: "basic_user",
      profilePicture: "",
      currency: 0,
      matchHistory: [],
      powerups: {
        hintBoosts: 0,
        addTimes: 0,
        doublePoints: 0
      },
      leaderboardStats: {
        classic: {
          solo: {},
          coop: {},
          versus: {},
          overall: {}
        },
        knowledge: {
          solo: {},
          coop: {},
          versus: {},
          overall: {}
        }
      },
      reports: {}
    },
    {
      username: "admin_user",
      profilePicture: "",
      currency: 0,
      matchHistory: [],
      powerups: {
        hintBoosts: 0,
        addTimes: 0,
        doublePoints: 0
      },
      leaderboardStats: {
        classic: {
          solo: {},
          coop: {},
          versus: {},
          overall: {}
        },
        knowledge: {
          solo: {},
          coop: {},
          versus: {},
          overall: {}
        }
      },
      reports: {}
    },
    {
      username: "superadmin_user",
      profilePicture: "test.jpg",
      currency: 0,
      matchHistory: [],
      powerups: {
        hintBoosts: 0,
        addTimes: 0,
        doublePoints: 0
      },
      leaderboardStats: {
        classic: {
          overall: {
            overall: {
              correct: 20,
              total: 50,
              wonMatches: 5,
              totalMatches: 10,
              score: 1234
            }
          }
        },
        knowledge: {
          overall: {
            overall: {
              correct: 10,
              total: 20,
              wonMatches: 2,
              totalMatches: 4,
              score: 567
            }
          }
        }
      },
      reports: {}
    }
  ]);
});

describe("GET /search-profiles", () => {
  it("should return 401 if not authenticated", async () => {
    const res = await request.get("/api/profile/search-profiles?query=test");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Not authenticated");
  });

  it("should return matching usernames if authenticated", async () => {
    const res = await request
      .get("/api/profile/search-profiles?query=_user")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((u) => u.username.includes("_user"))).toBe(true);
    expect(res.body.length).toBe(3);
  });

  it("should return empty array if query is missing", async () => {
    const res = await request
      .get("/api/profile/search-profiles")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("GET /api/profile/:username", () => {
  it("should return 401 if not authenticated", async () => {
    const res = await request.get("/api/profile/targetUser");
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Not authenticated");
  });

  it("should return 404 if profile not found", async () => {
    const res = await request
      .get("/api/profile/nonexistentuser")
      .set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Profile not found");
  });

  it("should return full profile data if authenticated", async () => {
    const res = await request
      .get("/api/profile/superadmin_user")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    const body = res.body;

    expect(body).toHaveProperty("username", "superadmin_user");
    expect(body).toHaveProperty("email", "superadmin@example.com");
    expect(body).toHaveProperty("verified", true);
    expect(body).toHaveProperty("role", "superadmin");
    expect(body).toHaveProperty("chatBan", false);
    expect(body).toHaveProperty("gameBan", false);
    expect(body).toHaveProperty("profilePicture", "test.jpg");
    expect(body).toHaveProperty("friends");
    expect(Array.isArray(body.friends)).toBe(true);
    expect(body).toHaveProperty("classicStats");
    expect(body.classicStats.correctAnswer).toBe(20);
    expect(body.classicStats.totalAnswer).toBe(50);
    expect(body.classicStats.correctRate).toBe("40.00%");
    expect(body.classicStats.winRate).toBe("50.00%");
    expect(body.classicStats.score).toBe("1,234");
    expect(body).toHaveProperty("knowledgeStats");
    expect(body.knowledgeStats.correctRate).toBe("50.00%");
    expect(body.knowledgeStats.score).toBe("567");
  });

  it("should return a new token cookie if user is requesting own profile", async () => {
    const res = await request
      .get(`/api/profile/${user.username}`)
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  describe.sequential("Check Friend Logic", () => {
    it("should show friend and mutualFriend as true if both sent requests", async () => {
      await Friend.deleteMany({});
      await Friend.create({ from: user.username, to: "superadmin_user" });
      await Friend.create({ from: "superadmin_user", to: user.username });

      const res = await request
        .get("/api/profile/superadmin_user")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.friends.length).toBe(1);
      expect(res.body.addedFriend).toBe(true);
      expect(res.body.receivedFriendRequest).toBe(true);
    });

    it("should show friend=true, mutualFriend=false if only current user sent", async () => {
      await Friend.deleteMany({});
      await Friend.create({ from: user.username, to: "superadmin_user" });

      const res = await request
        .get("/api/profile/superadmin_user")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.friends.length).toBe(0);
      expect(res.body.addedFriend).toBe(true);
      expect(res.body.receivedFriendRequest).toBe(false);
    });

    it("should show friend=false, mutualFriend=false if no relationship", async () => {
      await Friend.deleteMany({});

      const res = await request
        .get("/api/profile/superadmin_user")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.friends.length).toBe(0);
      expect(res.body.addedFriend).toBe(false);
      expect(res.body.receivedFriendRequest).toBe(false);
    });
  });
});

describe.sequential("PUT /api/profile/updaterole/:username", () => {
  it("should reject unauthenticated user with 401", async () => {
    const res = await request
      .put("/api/profile/updaterole/testuser")
      .send({ role: "admin" });
    expect(res.status).toBe(401);
  });

  it("should return 404 if user not found", async () => {
    const res = await request
      .put("/api/profile/updaterole/nonexistent")
      .set("Cookie", cookie)
      .send({ role: "admin" });

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/User not found/);
  });

  it("should forbid changing your own role", async () => {
    const res = await request
      .put(`/api/profile/updaterole/${user.username}`)
      .set("Cookie", cookie)
      .send({ role: "admin" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Can't change your own role/);
  });

  it("should forbid superadmin from promoting user to superadmin", async () => {
    const res = await request
      .put(`/api/profile/updaterole/basic_user`)
      .set("Cookie", cookie)
      .send({ role: "superadmin" });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Insufficient permissions/i);
  });

  it("should allow superadmin to promote user to admin", async () => {
    const res = await request
      .put(`/api/profile/updaterole/basic_user`)
      .set("Cookie", cookie)
      .send({ role: "admin" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/changed to admin/i);
  });

  it("should allow superadmin to demote admin to user", async () => {
    const res = await request
      .put(`/api/profile/updaterole/admin_user`)
      .set("Cookie", cookie)
      .send({ role: "user" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/changed to user/i);
  });

  it("should forbid superadmin from demoting superadmin to user", async () => {
    const res = await request
      .put(`/api/profile/updaterole/superadmin_user`)
      .set("Cookie", cookie)
      .send({ role: "user" });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Insufficient permissions/i);
  });

  it("should allow superadmin to demote superadmin to admin", async () => {
    const res = await request
      .put(`/api/profile/updaterole/superadmin_user`)
      .set("Cookie", cookie)
      .send({ role: "admin" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/changed to admin/i);
  });

  it("should forbid admin from promoting user to superadmin", async () => {
    const res = await request
      .put(`/api/profile/updaterole/admin_user`)
      .set("Cookie", adminCookie)
      .send({ role: "superadmin" });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Insufficient permissions/);
  });

  it("should allow admin to promote user to admin", async () => {
    const res = await request
      .put(`/api/profile/updaterole/admin_user`)
      .set("Cookie", adminCookie)
      .send({ role: "admin" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/changed to admin/i);
  });

  it("should forbid admin from changing admin role", async () => {
    const res = await request
      .put(`/api/profile/updaterole/admin_user`)
      .set("Cookie", adminCookie)
      .send({ role: "superadmin" });

    expect(res.status).toBe(403);

    const res2 = await request
      .put(`/api/profile/updaterole/admin_user`)
      .set("Cookie", adminCookie)
      .send({ role: "user" });

    expect(res2.status).toBe(403);
  });

  it("should forbid admin from changing superadmin role", async () => {
    const res = await request
      .put(`/api/profile/updaterole/${user.username}`)
      .set("Cookie", adminCookie)
      .send({ role: "admin" });

    expect(res.status).toBe(403);

    const res2 = await request
      .put(`/api/profile/updaterole/${user.username}`)
      .set("Cookie", adminCookie)
      .send({ role: "user" });

    expect(res2.status).toBe(403);
  });

  it("should forbid user from changing anyone’s role", async () => {
    const res = await request
      .put(`/api/profile/updaterole/basic_user`)
      .set("Cookie", userCookie)
      .send({ role: "admin" });

    expect(res.status).toBe(403);
  });
});

describe("GET /api/profile/matchhistory/:username", () => {
  it("should reject unauthenticated requests with 401", async () => {
    const res = await request.get("/api/profile/matchhistory/admin_user");
    expect(res.status).toBe(401);
  });

  it("should return 404 if profile does not exist", async () => {
    const res = await request
      .get("/api/profile/matchhistory/nonexistentuser")
      .set("Cookie", userCookie);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/Profile not found/);
  });

  it("should return match history for valid user", async () => {
    await Profile.create({
      username: "blerargh",
      matchHistory: [
        {
          type: "solo-knowledge",
          state: "solo",
          totalPlayed: 3,
          correctNumber: 3,
          date: {
            $date: "2025-07-18T17:19:11.976Z"
          },
          difficulty: 3,
          categoryStats: {
            Overall: {
              correct: 3,
              total: 3
            }
          },
          answerHistory: {
            1: "correct",
            2: "correct",
            3: "correct"
          },
          playerScoreSummary: {
            blerargh: {
              correct: 3,
              score: 290
            }
          },
          color: "solo",
          teamScore: 0,
          teamAnswerHistory: {}
        },
        {
          type: "coop-knowledge",
          state: "coop",
          totalPlayed: 3,
          correctNumber: 1,
          date: {
            $date: "2025-07-18T17:22:44.585Z"
          },
          difficulty: 3,
          categoryStats: {
            Overall: {
              correct: 1,
              total: 3
            }
          },
          answerHistory: {
            1: "wrong",
            2: "missing",
            3: "correct"
          },
          playerScoreSummary: {
            blerargh: {
              correct: 1,
              score: 0
            },
            blerargh2: {
              correct: 0,
              score: 0
            }
          },
          color: "solo",
          teamScore: 0,
          teamAnswerHistory: {
            1: [
              "wrong",
              {
                asdasdasd: ["blerargh"]
              }
            ],
            2: ["missing"],
            3: [
              "wrong",
              {
                "Disaster Girl": ["blerargh"]
              }
            ]
          }
        }
      ]
    });

    const res = await request
      .get("/api/profile/matchhistory/blerargh")
      .set("Cookie", userCookie);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/Successfully retrieved match history/);
    expect(Array.isArray(res.body.matchHistory)).toBe(true);
    expect(res.body.matchHistory.length).toBe(2);
    expect(res.body.matchHistory[0].type).toBe("coop-knowledge"); // check reversed order
  });

  it("should return empty array if match history is empty", async () => {
    await Profile.create({ username: "emptyuser", matchHistory: [] });

    const res = await request
      .get("/api/profile/matchhistory/emptyuser")
      .set("Cookie", userCookie);

    expect(res.status).toBe(200);
    expect(res.body.matchHistory).toEqual([]);
  });
});

describe.sequential("POST /api/profile/report", () => {
  it("should return 401 for unauthenticated users", async () => {
    const res = await request.post("/api/profile/report").send({
      reported: "basic_user",
      source: "profile",
      reasons: ["Inappropriate Username"]
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch("Not authenticated");
  });

  it("should not allow a user to report themselves", async () => {
    const res = await request
      .post("/api/profile/report")
      .set("Cookie", userCookie)
      .send({
        reported: "basic", // same as current user
        source: "profile",
        reasons: ["Inappropriate Username"]
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot report yourself/i);
  });

  it("should return 404 when trying to report a non-existent user", async () => {
    const res = await request
      .post("/api/profile/report")
      .set("Cookie", userCookie)
      .send({
        reported: "nonexistent_user",
        source: "profile",
        reasons: ["Inappropriate Username"]
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/user not found/i);
  });

  it("should allow reporting a user with valid reasons", async () => {
    const res = await request
      .post("/api/profile/report")
      .set("Cookie", userCookie)
      .send({
        reported: "basic_user",
        source: "profile",
        reasons: ["Inappropriate Username"]
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/report submitted successfully/i);

    const profile = await Profile.findOne({ username: "basic_user" });
    expect(profile?.reports?.basic).toEqual(
      expect.arrayContaining(["Inappropriate Username"])
    );
  });

  it("should prevent duplicate reports for the same reasons", async () => {
    const res = await request
      .post("/api/profile/report")
      .set("Cookie", userCookie)
      .send({
        reported: "basic_user",
        source: "profile",
        reasons: ["Inappropriate Username"]
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(
      "You have already reported this user for the selected reason(s)"
    );
  });

  it("should allow adding new reasons to an existing report", async () => {
    const res = await request
      .post("/api/profile/report")
      .set("Cookie", userCookie)
      .send({
        reported: "basic_user",
        source: "lobby",
        reasons: ["Spam"]
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/report submitted successfully/i);

    const updated = await Profile.findOne({ username: "basic_user" });
    expect(updated?.reports?.basic).toEqual(
      expect.arrayContaining(["Spam", "Inappropriate Username"])
    );
  });

  it("should include chat history in email content when lobbyId is provided", async () => {
    await Lobby.create({
      lobbyId: "test-lobby-123",
      host: "basic_user",
      gameType: "versus-classic",
      chatMessages: [
        {
          sender: "basic_user",
          message: "You are so bad at this game!",
          timestamp: new Date("2023-01-01T12:00:00Z")
        },
        {
          sender: "basic_user",
          message: "lol gg ez",
          timestamp: new Date("2023-01-01T12:01:00Z")
        },
        {
          sender: "basic_user",
          message: "noob",
          timestamp: new Date("2023-01-01T12:01:00Z")
        },
        {
          sender: "admin_user",
          message: "Not basic user message",
          timestamp: new Date("2023-01-01T12:02:00Z")
        }
      ]
    });

    const res = await request
      .post("/api/profile/report")
      .set("Cookie", userCookie)
      .send({
        reported: "basic_user",
        source: "lobby",
        lobbyId: "test-lobby-123",
        reasons: ["Harassment or Abusive Communications"]
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/report submitted successfully/i);

    expect(global.lastReportEmail).toBeDefined();
    expect(global.lastReportEmail.reportedUser).toBe("basic_user");
    expect(global.lastReportEmail.reporter).toBe("basic");
    expect(global.lastReportEmail.reasons).toContain("Harassment");
    expect(global.lastReportEmail.chatHtml).toContain(
      "You are so bad at this game!"
    );
    expect(global.lastReportEmail.chatHtml).toContain("lol gg ez");
    expect(global.lastReportEmail.chatHtml).toContain("noob");
    expect(global.lastReportEmail.chatHtml).not.toContain(
      "Not basic user message"
    );
  });
});

describe.sequential("GET /api/profile/manage/:username", () => {
  it("should reject unauthenticated access", async () => {
    const res = await request.get("/api/profile/manage/basic_user");
    expect(res.status).toBe(401);
  });

  it("should forbid normal users from accessing manage endpoint", async () => {
    const res = await request
      .get("/api/profile/manage/admin_user")
      .set("Cookie", userCookie);
    expect(res.status).toBe(403);
    expect(res.body.message).toBe(
      "User is not authorised to use this feature."
    );
  });

  it("should forbid admin from managing their own account", async () => {
    await User.create({
      username: "admin",
      email: "admin2@example.com",
      verified: true,
      chatBan: false,
      gameBan: false,
      role: "admin",

      password: hashedPassword,
      previousPasswords: [hashedPassword]
    });

    const res = await request
      .get("/api/profile/manage/admin")
      .set("Cookie", adminCookie);
    expect(res.status).toBe(403);
    expect(res.body.message).toBe(
      "You cannot manage your own account's status"
    );
  });

  it("should forbid admin from managing a superadmin", async () => {
    await User.collection.findOneAndUpdate(
      {
        username: "superadmin_user"
      },
      { $set: { role: "superadmin" } }
    );
    const res = await request
      .get("/api/profile/manage/superadmin_user")
      .set("Cookie", adminCookie);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Unauthorised attempt.");
  });

  it("should allow superadmin to manage admin", async () => {
    const res = await request
      .get("/api/profile/manage/admin_user")
      .set("Cookie", superadminCookie);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      username: "admin_user",
      role: "admin",
      verified: true,
      chatBan: false,
      gameBan: false,
      profilePicture: ""
    });
  });

  it("should allow admin to manage a user", async () => {
    await User.collection.findOneAndUpdate(
      {
        username: "basic_user"
      },
      { $set: { role: "user" } }
    );

    const res = await request
      .get("/api/profile/manage/basic_user")
      .set("Cookie", adminCookie);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      username: "basic_user",
      role: "user",
      verified: true,
      chatBan: false,
      gameBan: false,
      profilePicture: ""
    });
  });

  it("should return 400 for a non-existent user", async () => {
    const res = await request
      .get("/api/profile/manage/ghost_user")
      .set("Cookie", superadminCookie);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("User not found.");
  });
});

describe("POST /api/profile/ban", () => {
  it("should reject unauthenticated access", async () => {
    const res = await request.post("/api/profile/ban").send({});
    expect(res.status).toBe(401);
  });

  it("should forbid a normal user from banning", async () => {
    const res = await request
      .post("/api/profile/ban")
      .set("Cookie", userCookie)
      .send({ bannedUser: "basic_user", reason: "Cheating" });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("User is not authorised to issue bans.");
  });

  it("should ban a user as admin", async () => {
    const res = await request
      .post("/api/profile/ban")
      .set("Cookie", adminCookie)
      .send({
        bannedUser: "basic_user",
        reason: "Toxic behaviour",
        unban: false
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User banned successfully.");
  });

  it("should unban a user as superadmin", async () => {
    const res = await request
      .post("/api/profile/ban")
      .set("Cookie", superadminCookie)
      .send({
        bannedUser: "basic_user",
        reason: "Apology accepted",
        unban: true
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User banned successfully.");
  });

  it("should return 400 if user already banned/unbanned", async () => {
    const res = await request
      .post("/api/profile/ban")
      .set("Cookie", superadminCookie)
      .send({ bannedUser: "basic_user", reason: "Testing", unban: true });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("User not found or user already");
  });
});

describe("POST /api/profile/chatban", () => {
  it("should reject unauthenticated access", async () => {
    const res = await request.post("/api/profile/chatban").send({});
    expect(res.status).toBe(401);
  });

  it("should forbid a normal user from chat banning", async () => {
    const res = await request
      .post("/api/profile/chatban")
      .set("Cookie", userCookie)
      .send({ bannedUser: "basic_user", reason: "Spamming" });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("User is not authorised to issue chat bans.");
  });

  it("should chatban a user as admin", async () => {
    const res = await request
      .post("/api/profile/chatban")
      .set("Cookie", adminCookie)
      .send({ bannedUser: "basic_user", reason: "Toxic chat", unban: false });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User chat banned successfully.");
  });

  it("should un-chatban a user as superadmin", async () => {
    const res = await request
      .post("/api/profile/chatban")
      .set("Cookie", superadminCookie)
      .send({
        bannedUser: "basic_user",
        reason: "Pardon granted",
        unban: true
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User chat banned successfully.");
  });

  it("should return 400 if user already chat banned/unbanned", async () => {
    const res = await request
      .post("/api/profile/chatban")
      .set("Cookie", adminCookie)
      .send({ bannedUser: "basic_user", reason: "Testing", unban: true });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("User not found or user already chat");
  });
});
