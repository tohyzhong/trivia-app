import express from "express";
import authenticate from "./authMiddleware.js";
import Friend from "../models/Friend.js";

const router = express.Router();

// Retrieve friends info
router.post("/:username/all", authenticate, async (req, res) => {
  const { username } = req.params;
  const { mutual, incoming } = req.body; // mutual: boolean, incoming: boolean
  try {
    const results = await Friend.aggregate([
      {
        $facet: {
          outgoing: [
            { $match: { from: username } },
            { $project: { user: "$to", _id: 0 } }
          ],
          incoming: [
            { $match: { to: username } },
            { $project: { user: "$from", _id: 0 } }
          ]
        }
      },
      {
        $project: {
          outgoingUsernames: "$outgoing.user",
          incomingUsernames: "$incoming.user"
        }
      },
      {
        $addFields: {
          mutualUsernames: {
            $setIntersection: ["$outgoingUsernames", "$incomingUsernames"]
          },
          incomingRequests: {
            $setDifference: ["$incomingUsernames", "$outgoingUsernames"]
          }
        }
      },
      {
        $project: {
          mutualUsernames: mutual ? "$mutualUsernames" : [],
          incomingRequests: incoming ? "$incomingRequests" : []
        }
      },
      {
        $facet: {
          mutualProfiles: [
            { $unwind: "$mutualUsernames" },
            {
              $lookup: {
                from: "profiles",
                localField: "mutualUsernames",
                foreignField: "username",
                as: "profile"
              }
            },
            { $unwind: "$profile" },
            {
              $project: {
                username: "$profile.username",
                profilePicture: "$profile.profilePicture"
              }
            }
          ],
          incomingProfiles: [
            { $unwind: "$incomingRequests" },
            {
              $lookup: {
                from: "profiles",
                localField: "incomingRequests",
                foreignField: "username",
                as: "profile"
              }
            },
            { $unwind: "$profile" },
            {
              $project: {
                username: "$profile.username",
                profilePicture: "$profile.profilePicture"
              }
            }
          ]
        }
      }
    ]);

    const result = results[0] || {};
    res.status(200).json({
      mutual: mutual ? result.mutualProfiles : [],
      incoming: incoming ? result.incomingProfiles : [],
      message: "Friends fetched."
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Add friend
router.put("/:username/add", authenticate, async (req, res) => {
  const { username } = req.params;
  const { friendUsername } = req.body;

  if (username === friendUsername) {
    return res
      .status(400)
      .json({ message: "You cannot add yourself as a friend." });
  }

  try {
    await Friend.collection.insertOne({ from: username, to: friendUsername });

    const mutual = await Friend.exists({ from: friendUsername, to: username });

    return res.status(200).json({
      message: mutual
        ? "You are now friends!"
        : "Friend request sent. Waiting for the other user to add you back."
    });
  } catch (error) {
    // Code 11000 is the MongoDB error code for duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({ message: "Friend request already sent." });
    }

    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Remove friend
router.put("/:username/remove", authenticate, async (req, res) => {
  const { username } = req.params;
  const { friendUsername } = req.body;

  try {
    const result = await Friend.deleteMany({
      $or: [
        { from: username, to: friendUsername },
        { from: friendUsername, to: username }
      ]
    });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: `You are not friends with ${friendUsername}.` });
    }

    res.json({ message: "Friend removed successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
