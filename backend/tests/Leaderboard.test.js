import { beforeAll, describe, expect, test } from "vitest";
import { registerAndVerifyUser } from "./helpers/authFlow";
import ClassicQuestion from "../models/ClassicQuestion.js";
import User from "../models/User.js";
import Profile from "../models/Profile.js";
import bcrypt from "bcryptjs";

let cookie;
let user;
let request;

const hashedPassword = await bcrypt.hash("Password1", 10);

beforeAll(async () => {
  const obj = await registerAndVerifyUser();
  cookie = obj.cookie;
  user = obj.user;
  request = global.request;

  await User.deleteMany({});
  await Profile.deleteMany({});
  await ClassicQuestion.deleteMany({});

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

  await Profile.create({
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
        solo: {},
        coop: {},
        versus: {},
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
        solo: {},
        coop: {},
        versus: {},
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
  });

  await ClassicQuestion.insertMany([
    {
      question: "What is 2+2?",
      options: ["1", "2", "3", "4"],
      correctOption: 4,
      explanation: "2+2=4",
      category: "Math",
      difficulty: 1
    },
    {
      question: "What is the capital of France?",
      options: ["1", "2", "3", "Paris"],
      correctOption: 4,
      explanation: "Paris is in France",
      category: "Geography"
    }
  ]);
});

describe("GET /api/leaderboard/categories", () => {
  test("Returns distinct categories", async () => {
    const res = await request
      .get("/api/leaderboard/categories")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toContain("Math");
    expect(res.body).toContain("Geography");
  });

  test("Fails if unauthenticated", async () => {
    const res = await request.get("/api/leaderboard/categories");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/leaderboard/stats", () => {
  test("Returns stats for classic/overall/overall", async () => {
    const res = await request
      .get(
        "/api/leaderboard/stats?gameFormat=classic&mode=overall&category=overall"
      )
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const superadminStats = res.body.find(
      (u) => u.username === "superadmin_user"
    );
    expect(superadminStats).toMatchObject({
      username: "superadmin_user",
      profilePicture: "test.jpg",
      correctAnswer: 20,
      totalAnswer: 50,
      wonMatches: 5,
      totalMatches: 10,
      score: 1234
    });
  });

  test("Returns stats for knowledge/overall/overall", async () => {
    const res = await request
      .get(
        "/api/leaderboard/stats?gameFormat=knowledge&mode=overall&category=overall"
      )
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const superadminStats = res.body.find(
      (u) => u.username === "superadmin_user"
    );
    expect(superadminStats).toMatchObject({
      username: "superadmin_user",
      profilePicture: "test.jpg",
      correctAnswer: 10,
      totalAnswer: 20,
      wonMatches: 2,
      totalMatches: 4,
      score: 567
    });
  });

  test("Fails if unauthenticated", async () => {
    const res = await request.get(
      "/api/leaderboard/stats?gameFormat=classic&mode=solo&category=Math"
    );
    expect(res.status).toBe(401);
  });
});
