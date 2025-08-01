import express from "express";
import authenticate from "./authMiddleware.js";
import Profile from "../models/Profile.js";
import ClassicQuestion from "../models/ClassicQuestion.js";

const router = express.Router();

// Fetch unique categories for leaderboard dropdown rendering
router.get("/categories", authenticate, async (req, res) => {
  try {
    const categories = await ClassicQuestion.distinct("category");
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: "Failed to load categories", err });
  }
});

router.get("/stats", authenticate, async (req, res) => {
  const { gameFormat, mode, category } = req.query;
  try {
    const users = await Profile.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "username",
          foreignField: "username",
          as: "userInfo"
        }
      },
      {
        $unwind: "$userInfo"
      },
      {
        $match: {
          "userInfo.gameBan": { $ne: true }
        }
      },
      {
        $project: {
          _id: 0,
          username: 1,
          profilePicture: 1,
          leaderboardStats: 1
        }
      }
    ]);

    const data = users.map((user) => {
      const stats =
        user.leaderboardStats?.[gameFormat]?.[mode]?.[category] || {};

      const score = stats.score || 0;

      return category === "overall" || category === "Community"
        ? {
            username: user.username,
            profilePicture: user.profilePicture,
            correctAnswer: stats.correct || 0,
            totalAnswer: stats.total || 0,
            wonMatches: stats.wonMatches || 0,
            totalMatches: stats.totalMatches || 0,
            score: score
          }
        : {
            username: user.username,
            profilePicture: user.profilePicture,
            correctAnswer: stats.correct || 0,
            totalAnswer: stats.total || 0
          };
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to load stats", err });
  }
});

export default router;
