vi.mock("nodemailer");
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import supertest from "supertest";
import app from "../server.js";

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
});

afterAll(async () => {
  await mongoose.disconnect();
  await global.mongoServer.stop();
});
