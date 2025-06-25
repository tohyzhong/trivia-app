import express from "express";
import mongoose from "mongoose";
import Profile from "../models/Profile.js";
import authenticate from "./authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// Get users from query
router.get("/search-profiles", authenticate, async (req, res) => {
  const query = req.query.query?.toLowerCase() || "";

  try {
    if (!query) {
      return res.json([]);
    }

    const matchingUsers = await User.find({
      username: { $regex: query, $options: "i" }
    })
      .select("username")
      .lean()
      .limit(10);

    res.json(matchingUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Retrieve friend info of user
router.get("/:username", authenticate, async (req, res) => {
  const { username } = req.params;

  try {
    const results = await Profile.aggregate([
      { $match: { username } },

      {
        $lookup: {
          from: "friends",
          localField: "username",
          foreignField: "from",
          as: "outgoingFriends"
        }
      },

      {
        $lookup: {
          from: "friends",
          localField: "username",
          foreignField: "to",
          as: "incomingFriends"
        }
      },

      {
        $addFields: {
          outgoingUsernames: {
            $map: {
              input: "$outgoingFriends",
              as: "of",
              in: "$$of.to"
            }
          },
          incomingUsernames: {
            $map: {
              input: "$incomingFriends",
              as: "inf",
              in: "$$inf.from"
            }
          }
        }
      },

      // Mutual friend logic
      {
        $addFields: {
          mutualUsernames: {
            $setIntersection: ["$incomingUsernames", "$outgoingUsernames"]
          }
        }
      },

      // Obtain username and profile picture of mutual friends
      {
        $lookup: {
          from: "profiles",
          let: { mutuals: "$mutualUsernames" },
          pipeline: [
            { $match: { $expr: { $in: ["$username", "$$mutuals"] } } },
            { $project: { username: 1, profilePicture: 1 } },
            { $limit: 10 }
          ],
          as: "mutualProfiles"
        }
      },

      {
        $lookup: {
          from: "users",
          localField: "username",
          foreignField: "username",
          as: "userInfo"
        }
      },
      {
        $addFields: {
          role: { $arrayElemAt: ["$userInfo.role", 0] }
        }
      },

      {
        $project: {
          _id: 1,
          username: 1,
          winRate: 1,
          correctRate: 1,
          correctAnswer: 1,
          totalAnswer: 1,
          currency: 1,
          profilePicture: 1,
          role: 1,
          friends: "$mutualProfiles"
        }
      }
    ]);

    if (!results.length) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json(results[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Retrieve multiple profiles
router.post("/get-profiles", authenticate, async (req, res) => {
  try {
    const { userIds } = req.body;
    const objectIds = userIds.map((id) => new mongoose.Types.ObjectId(`${id}`));
    const users = await Profile.find(
      { _id: { $in: objectIds } },
      { _id: 0, username: 1, profilePicture: 1 }
    );
    if (!users) {
      return res.status(404).json({ message: "No profiles found" });
    }
    return res
      .status(200)
      .json({ message: "Profiles successfully retrieved.", users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

// Update user roles
router.put("/updaterole/:username", authenticate, async (req, res) => {
  const { username } = req.params;
  const { role: targetRole } = req.body;
  const validRoles = ["user", "admin", "superadmin"];

  if (!validRoles.includes(targetRole)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  try {
    const actor = req.user;
    const target = await User.findOne({ username });

    if (!target) {
      return res.status(404).json({ message: "User not found" });
    }

    if (actor.username === target.username) {
      return res.status(400).json({ message: "Can't change your own role" });
    }

    const ar = actor.role;
    const tr = target.role;

    const roleRules = {
      superadmin: {
        user: ["admin"],
        admin: ["superadmin", "user"],
        superadmin: ["admin"]
      },
      admin: {
        user: ["admin"],
        admin: [],
        superadmin: []
      },
      user: {
        user: [],
        admin: [],
        superadmin: []
      }
    };

    const allowedTargets = roleRules[ar]?.[tr] || [];
    if (!allowedTargets.includes(targetRole)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    target.role = targetRole;
    await target.save();

    res.json({ message: `User role changed to ${targetRole}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get profile match history
router.get("/matchhistory/:username", authenticate, async (req, res) => {
  try {
    const { username } = req.params;

    const matchHistory = await Profile.find(
      { username },
      { _id: 0, matchHistory: 1 }
    );

    if (!matchHistory) {
      return res.status(401).json({ message: "Profile not found." });
    }

    return res
      .status(200)
      .json({ message: "Successfully retrieved match history.", matchHistory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
