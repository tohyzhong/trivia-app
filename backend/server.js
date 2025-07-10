import express from "express";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { initSocket } from "./socket.js";
import generateQuestions from "./utils/questionbank.js";

import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import settingsRoutes from "./routes/settings.js";
import friendRoutes from "./routes/friend.js";
import lobbyRoutes from "./routes/lobby.js";
import questionRoutes from "./routes/question.js";
import leaderboardRoutes from "./routes/leaderboard.js";
import shopRoutes from "./routes/shop.js";

import morgan from "morgan";
import runSchedulers from "./utils/tasks.js";

dotenv.config();

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
    origin: process.env.FRONTEND_URL,
    credentials: true
  })
);

const server = http.createServer(app);
initSocket(server);

let isConnected = false;

const connectMongo = async () => {
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
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

connectMongo();

app.use(morgan(":method :url :status :response-time ms"));

// User Authentication for Login Page
app.use("/api/auth", authRoutes);

// User Profile for Profile Page
app.use("/api/profile", profileRoutes);

// Settings Page (Change Profile Picture, Change Email, Change Password, Delete Account)
app.use("/api/settings", settingsRoutes);

// Friends
app.use("/api/friends", friendRoutes);

// Lobby
app.use("/api/lobby", lobbyRoutes);

// Question Requests
app.use("/api/questions", questionRoutes);

// Leaderboard
app.use("/api/leaderboard", leaderboardRoutes);

// Shop
app.use("/api/shop", shopRoutes);

// Connection
server.listen(process.env.PORT, () => {
  // uncomment for local production testing
  console.log(`Server is running on port ${process.env.PORT}`);
});

// Run scheduled tasks
runSchedulers();

// Generate sample Classic Questions
// generateQuestions();

export default app;
