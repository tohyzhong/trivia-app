import express from "express";
import authenticate from "./authMiddleware.js";
import Profile from "../models/Profile.js";

const router = express.Router();

// Get all correct answer rate stats
router.get("/correctrate", authenticate, async (req, res) => {
  try {
    const stats = await Profile.find(
      {},
      {
        username: 1,
        profilePicture: 1,
        correctRate: 1,
        _id: 0
      }
    )
      .sort({ correctRate: -1 })
      .lean();

    // Add index (rank) to each result
    stats.forEach((item, idx) => {
      item.rank = idx + 1;
    });
    console.log(stats);

    return res.status(200).json({ rowData: stats });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error retrieving stats" });
  }
});

router.get("/totalanswer", authenticate, async (req, res) => {
  try {
    const stats = await Profile.find(
      {},
      {
        username: 1,
        profilePicture: 1,
        totalAnswer: 1,
        _id: 0
      }
    )
      .sort({ totalAnswer: -1 })
      .lean();

    // Add index (rank) to each result
    stats.forEach((item, idx) => {
      item.rank = idx + 1;
    });
    console.log(stats);

    return res.status(200).json({ rowData: stats });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error retrieving stats" });
  }
});

router.get("/correctanswer", authenticate, async (req, res) => {
  try {
    const stats = await Profile.find(
      {},
      {
        username: 1,
        profilePicture: 1,
        correctAnswer: 1,
        _id: 0
      }
    )
      .sort({ correctAnswer: -1 })
      .lean();

    // Add index (rank) to each result
    stats.forEach((item, idx) => {
      item.rank = idx + 1;
    });
    console.log(stats);

    return res.status(200).json({ rowData: stats });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error retrieving stats" });
  }
});

export default router;
