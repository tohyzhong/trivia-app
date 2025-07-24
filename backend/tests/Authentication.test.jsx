import app from "../server.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import supertest from "supertest";
import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import User from "../models/User.js";
import Profile from "../models/Profile.js";

let mongoServer;
let request;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  console.log("Connected to test MongoDB");
  request = supertest(app);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Authentication Routes Test", () => {
  it("should register a new user", async () => {
    const response = await request.post("/api/auth/register").send({
      email: "testuser@xyz.com",
      username: "testuser",
      password: "Testpassword123"
    });
    expect(response.ok).toBeTruthy();

    const userDocs = await User.find();
    const profileDocs = await Profile.find();
    expect(userDocs.length).toBe(1);
    expect(profileDocs.length).toBe(1);
  });
});
