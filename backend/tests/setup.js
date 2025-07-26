vi.mock("nodemailer");
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import supertest from "supertest";
import app from "../server.js";
import jwt from "jsonwebtoken";

global.request = null;
global.mongoServer = null;

beforeAll(async () => {
  global.mongoServer = await MongoMemoryServer.create();
  const uri = global.mongoServer.getUri();
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  global.request = supertest(app);
  const adminToken = jwt.sign(
    {
      id: "1000",
      username: "admin",
      email: "admin@example.com",
      verified: true,
      chatBan: false,
      gameBan: false,
      role: "admin"
    },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
  global.adminCookie = `token=${adminToken}; HttpOnly; Path=/; SameSite=${process.env.NODE_ENV === "production" ? "None" : "Lax"};${process.env.NODE_ENV === "production" ? " Secure;" : ""}`;
  const userToken = jwt.sign(
    {
      id: "1001",
      username: "basic",
      email: "basic@example.com",
      verified: true,
      chatBan: false,
      gameBan: false,
      role: "user"
    },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
  global.userCookie = `token=${userToken}; HttpOnly; Path=/; SameSite=${process.env.NODE_ENV === "production" ? "None" : "Lax"};${process.env.NODE_ENV === "production" ? " Secure;" : ""}`;
  const superadminToken = jwt.sign(
    {
      id: "1000",
      username: "superadmin",
      email: "admin@example.com",
      verified: true,
      chatBan: false,
      gameBan: false,
      role: "superadmin"
    },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
  global.superadminCookie = `token=${superadminToken}; HttpOnly; Path=/; SameSite=${process.env.NODE_ENV === "production" ? "None" : "Lax"};${process.env.NODE_ENV === "production" ? " Secure;" : ""}`;
});

afterAll(async () => {
  await mongoose.disconnect();
  await global.mongoServer.stop();
});
