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
  await Friend.deleteMany({});

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
    },
    {
      username: "basic",
      profilePicture: "basic.jpg",
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
      username: "admin",
      profilePicture: "admin.jpg",
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
    }
  ]);
});

describe.sequential("PUT /api/friends/:username/add", () => {
  test("Add friend: success and mutual detection", async () => {
    const res = await request
      .put(`/api/friends/${user.username}/add`)
      .set("Cookie", cookie)
      .send({ friendUsername: "superadmin_user" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/Friend request sent/);
  });

  test("Add friend: cannot add yourself", async () => {
    const res = await request
      .put(`/api/friends/${user.username}/add`)
      .set("Cookie", cookie)
      .send({ friendUsername: user.username });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("You cannot add yourself as a friend.");
  });

  test("Add friend: duplicate request", async () => {
    await request
      .put(`/api/friends/${user.username}/add`)
      .set("Cookie", cookie)
      .send({ friendUsername: "duplicate" });

    const res = await request
      .put(`/api/friends/${user.username}/add`)
      .set("Cookie", cookie)
      .send({ friendUsername: "duplicate" });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("Friend request already sent.");
  });
});

describe("PUT /api/friends/:username/remove", () => {
  test("Remove friend: success", async () => {
    await request
      .put(`/api/friends/${user.username}/add`)
      .set("Cookie", cookie)
      .send({ friendUsername: "duplicate" });

    const res = await request
      .put(`/api/friends/${user.username}/remove`)
      .set("Cookie", cookie)
      .send({ friendUsername: "duplicate" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Friend removed successfully.");
  });

  test("Remove friend: not friends", async () => {
    const res = await request
      .put(`/api/friends/${user.username}/remove`)
      .set("Cookie", cookie)
      .send({ friendUsername: "nonexistent_user" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("You are not friends with nonexistent_user.");
  });
});

describe("POST /api/friends/:username/all", () => {
  beforeAll(async () => {
    // user <-> admin (mutual)
    await request
      .put(`/api/friends/${user.username}/add`)
      .set("Cookie", cookie)
      .send({ friendUsername: "admin" });

    await request
      .put(`/api/friends/admin/add`)
      .set("Cookie", adminCookie)
      .send({ friendUsername: user.username });

    // user <- basic (incoming only)
    await request
      .put(`/api/friends/basic/add`)
      .set("Cookie", userCookie)
      .send({ friendUsername: user.username });

    // user -> superadmin_user (outgoing only)
    await request
      .put(`/api/friends/${user.username}/add`)
      .set("Cookie", cookie)
      .send({ friendUsername: "superadmin_user" });
  });

  test("Fetch mutual friends only", async () => {
    const res = await request
      .post(`/api/friends/${user.username}/all`)
      .set("Cookie", cookie)
      .send({ mutual: true, incoming: false });

    expect(res.status).toBe(200);
    expect(res.body.mutual).toEqual([
      expect.objectContaining({
        username: "admin",
        profilePicture: "admin.jpg"
      })
    ]);
    expect(res.body.incoming).toEqual([]);
    expect(res.body.message).toBe("Friends fetched.");
  });

  test("Fetch incoming requests only", async () => {
    const res = await request
      .post(`/api/friends/${user.username}/all`)
      .set("Cookie", cookie)
      .send({ mutual: false, incoming: true });

    expect(res.status).toBe(200);
    expect(res.body.mutual).toEqual([]);
    expect(res.body.incoming).toEqual([
      expect.objectContaining({
        username: "basic",
        profilePicture: "basic.jpg"
      })
    ]);
    expect(res.body.message).toBe("Friends fetched.");
  });

  test("Fetch both mutual and incoming", async () => {
    const res = await request
      .post(`/api/friends/${user.username}/all`)
      .set("Cookie", cookie)
      .send({ mutual: true, incoming: true });

    expect(res.status).toBe(200);

    expect(res.body.mutual).toEqual([
      expect.objectContaining({
        username: "admin",
        profilePicture: "admin.jpg"
      })
    ]);

    expect(res.body.incoming).toEqual([
      expect.objectContaining({
        username: "basic",
        profilePicture: "basic.jpg"
      })
    ]);

    expect(res.body.message).toBe("Friends fetched.");
  });
});
