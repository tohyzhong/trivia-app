import express from "express";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import settingsRoutes from "./routes/settings.js";
import friendRoutes from "./routes/friend.js";
import lobbyRoutes from "./routes/lobby.js";
import knowledgeLobbyRoutes from "./routes/knowledgelobby.js";
import questionRoutes from "./routes/question.js";
import leaderboardRoutes from "./routes/leaderboard.js";
import shopRoutes from "./routes/shop.js";

import morgan from "morgan";
dotenv.config();
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "https://console.cron-job.org"
];

const app = express();
app.use((req, res, next) => {
  if (req.originalUrl === "/api/shop/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});
app.use(cookieParser());
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  })
);

let isConnected = false;

export const connectMongo = async () => {
  if (isConnected) {
    console.log("MongoDB already connected");
    return;
  }

  try {
    await mongoose.connect(
      process.env.CONNECTION_STRING + process.env.NODE_ENV,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    );
    isConnected = true;
    console.info("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

app.use(morgan(":method :url :status :response-time ms"));

// User Authentication for Login Page
app.use("/api/auth", authRoutes);

// User Profile for Profile Page
app.use("/api/profile", profileRoutes);

// Settings Page (Change Profile Picture, Change Email, Change Password, Delete Account)
app.use("/api/settings", settingsRoutes);

// Friends
app.use("/api/friends", friendRoutes);

// Lobby (Classic)
app.use("/api/lobby", lobbyRoutes);

// Lobby (Knowledge)
app.use("/api/knowledgelobby", knowledgeLobbyRoutes);

// Question Requests
app.use("/api/questions", questionRoutes);

// Leaderboard
app.use("/api/leaderboard", leaderboardRoutes);

// Shop
app.use("/api/shop", shopRoutes);

// cron-job.org
app.get("/cron-endpoint", (req, res) => {
  console.log("Cron job triggered:", new Date().toISOString());
  res.status(200).send("OK");
});

export default app;
