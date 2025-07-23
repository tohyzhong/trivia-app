import express from "express";
import jwt from "jsonwebtoken";
import Lobby from "../models/Lobby.js";
import Profile from "../models/Profile.js";
import authenticate from "./authMiddleware.js";
import User from "../models/User.js";
import sendEmail from "../utils/email.js";

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

// Helper function to extract stats from leaderboard stats
function extractStats(stats = {}) {
  const correct = Number(stats.correct) || 0;
  const total = Number(stats.total) || 0;
  const wonMatches = Number(stats.wonMatches) || 0;
  const totalMatches = Number(stats.totalMatches) || 0;
  const score = Number(stats.score) || 0;

  return {
    correctAnswer: correct,
    totalAnswer: total,
    correctRate:
      total === 0 ? "0.00%" : `${((correct / total) * 100).toFixed(2)}%`,
    wonMatches: wonMatches,
    totalMatches: totalMatches,
    winRate:
      totalMatches === 0
        ? "0.00%"
        : `${((wonMatches / totalMatches) * 100).toFixed(2)}%`,
    score: score.toLocaleString("en-US")
  };
}

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
          role: { $arrayElemAt: ["$userInfo.role", 0] },
          email: { $arrayElemAt: ["$userInfo.email", 0] },
          verified: { $arrayElemAt: ["$userInfo.verified", 0] },
          chatBan: { $arrayElemAt: ["$userInfo.chatBan", 0] },
          gameBan: { $arrayElemAt: ["$userInfo.gameBan", 0] }
        }
      },

      {
        $lookup: {
          from: "friends",
          let: { viewingUser: req.user.username, targetUser: "$username" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$from", "$$viewingUser"] },
                    { $eq: ["$to", "$$targetUser"] }
                  ]
                }
              }
            }
          ],
          as: "sentFriendRequest"
        }
      },
      {
        $lookup: {
          from: "friends",
          let: { viewingUser: req.user.username, targetUser: "$username" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$from", "$$targetUser"] },
                    { $eq: ["$to", "$$viewingUser"] }
                  ]
                }
              }
            }
          ],
          as: "receivedFriendRequest"
        }
      },
      {
        $addFields: {
          addedFriend: {
            $cond: {
              if: { $eq: ["$username", req.user.username] },
              then: true,
              else: { $gt: [{ $size: "$sentFriendRequest" }, 0] }
            }
          },
          receivedFriendRequest: {
            $cond: {
              if: { $eq: ["$username", req.user.username] },
              then: true,
              else: { $gt: [{ $size: "$receivedFriendRequest" }, 0] }
            }
          }
        }
      },

      {
        $project: {
          _id: 1,
          username: 1,
          email: 1,
          verified: 1,
          gameBan: 1,
          chatBan: 1,
          currency: 1,
          profilePicture: 1,
          role: 1,
          leaderboardStats: 1,
          friends: "$mutualProfiles",
          addedFriend: 1,
          receivedFriendRequest: 1
        }
      }
    ]);

    if (!results.length) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const profile = results[0];

    const classicStats =
      profile.leaderboardStats?.classic?.overall?.overall ?? {};
    const knowledgeStats =
      profile.leaderboardStats?.knowledge?.overall?.overall ?? {};

    if (profile.username === req.user.username) {
      const newToken = jwt.sign(
        {
          id: profile._id,
          username: profile.username,
          email: profile.email,
          role: profile.role,
          verified: profile.verified,
          chatBan: profile.chatBan,
          gameBan: profile.gameBan
        },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.cookie("token", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
    }

    return res.status(200).json({
      _id: profile._id,
      username: profile.username,
      email: profile.email,
      verified: profile.verified,
      currency: profile.currency,
      profilePicture: profile.profilePicture,
      role: profile.role,
      friends: profile.friends,
      addedFriend: profile.addedFriend,
      receivedFriendRequest: profile.receivedFriendRequest,
      chatBan: profile.chatBan,
      gameBan: profile.gameBan,
      classicStats: extractStats(classicStats),
      knowledgeStats: extractStats(knowledgeStats)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
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

    const profile = await Profile.findOne(
      { username },
      { _id: 0, matchHistory: 1 }
    );

    if (!profile) {
      return res.status(401).json({ message: "Profile not found." });
    }

    return res.status(200).json({
      message: "Successfully retrieved match history.",
      matchHistory: profile.matchHistory.reverse()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/report", authenticate, async (req, res) => {
  try {
    const { reported, source, lobbyId, reasons } = req.body;
    const { username, email } = req.user;

    if (reported === username) {
      return res.status(400).json({ message: "You cannot report yourself." });
    }

    const profileDocument = await Profile.findOne({ username: reported });
    if (!profileDocument) {
      return res.status(404).json({ message: "User not found." });
    }
    const newReasons = new Set(profileDocument.reports?.[username] || []);
    let newReport = false;
    for (const reason of reasons) {
      const prevSize = newReasons.size;
      newReasons.add(reason);
      if (newReasons.size !== prevSize) newReport = true;
    }

    if (!newReport) {
      return res.status(400).json({
        message:
          "You have already reported this user for the selected reason(s)"
      });
    }

    const updatedUser = await Profile.findOneAndUpdate(
      { username: reported },
      { $set: { [`reports.${username}`]: Array.from(newReasons) } },
      { returnDocument: "after" }
    );

    // Filter out messages sent by reported user
    let chatContent = "";
    if (source !== "profile" && lobbyId) {
      const lobby = await Lobby.findOne({ lobbyId });
      if (lobby?.chatMessages) {
        const messages =
          lobby.chatMessages
            .filter((m) => m.sender === reported)
            .map(
              (m) =>
                `<div><b>[${new Date(m.timestamp).toLocaleString(undefined, {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true
                })}]</b> ${m.message}</div>`
            )
            .join("") || "<div>(No messages found)</div>";
        chatContent = messages;
      }
    }

    const allReasons = [
      "Inappropriate Username",
      "Cheating",
      "Harassment or Abusive Communications",
      "Spam"
    ];
    const reports = Object.values(updatedUser.reports);
    const reportCount = allReasons.map(
      (reason) =>
        `${reason}: ${reports.filter((report) => report.includes(reason)).length}`
    );
    const htmlContentAdmin = `
      <div style="font-family: Arial, sans-serif; padding: 16px;">
        <h2>New Report Submitted</h2>
        <p><strong>Reported User:</strong> ${reported}</p>
        <p><strong>Reporter:</strong> ${username}</p>
        <p><strong>Source:</strong> ${String(source).charAt(0).toUpperCase() + String(source).slice(1)}</p>
        <p><strong>Reasons:</strong> ${reasons.join(", ")}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString(undefined, {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        })}</p>
        <p><strong>Total Reports:</strong><br/>${reportCount.join("<br/>")}</p>
        <h3>Chat History:</h3>
        <div style="background-color: #f2f2f2; padding: 12px; border-radius: 6px;">
          ${chatContent || "<div>(No messages found)</div>"}
        </div>
      </div>
    `;

    const htmlContentUser = `
      <div style="font-family: Arial, sans-serif; padding: 16px;">
        <h2>New Report Submitted</h2>
        <p><strong>Reported User:</strong> ${reported}</p>
        <p><strong>Reporter:</strong> ${username}</p>
        <p><strong>Source:</strong> ${String(source).charAt(0).toUpperCase() + String(source).slice(1)}</p>
        <p><strong>Reasons:</strong> ${reasons.join(", ")}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString(undefined, {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        })}</p>
        <h3>Chat History:</h3>
        <div style="background-color: #f2f2f2; padding: 12px; border-radius: 6px;">
          ${chatContent || "<div>(No messages found)</div>"}
        </div>
        <p style="margin-top: 24px; font-style: italic; color: #4caf50;">
          Thank you for keeping our community safe!
        </p>
      </div>
    `;

    await sendEmail(
      "therizzquiz@gmail.com",
      `User Report: ${reported}`,
      "",
      htmlContentAdmin
    );

    await sendEmail(
      email,
      `User Report Confirmation: ${reported}`,
      "",
      htmlContentUser
    );

    return res.status(200).json({ message: "Report submitted successfully." });
  } catch (err) {
    console.error("Error handling report:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

router.get("/manage/:username", authenticate, async (req, res) => {
  try {
    const { username: manageUsername } = req.params;
    const { username, role } = req.user;

    if (role === "user") {
      return res
        .status(403)
        .json({ message: "User is not authorised to use this feature." });
    }

    const userDoc = await User.aggregate([
      { $match: { username: manageUsername } },
      {
        $lookup: {
          from: "profiles",
          pipeline: [
            { $match: { username: manageUsername } },
            { $project: { profilePicture: 1 } }
          ],
          as: "profileInfo"
        }
      },
      {
        $addFields: {
          profilePicture: { $first: "$profileInfo.profilePicture" }
        }
      },
      {
        $project: {
          _id: 0,
          username: 1,
          profilePicture: 1,
          role: 1,
          verified: 1,
          chatBan: 1,
          gameBan: 1
        }
      }
    ]);

    if (userDoc.length === 0) {
      return res.status(400).json({ message: "User not found." });
    } else if (userDoc[0].username === username) {
      return res
        .status(403)
        .json({ message: "You cannot manage your own account's status" });
    } else if (userDoc[0].role === "superadmin" && role !== "superadmin") {
      return res.status(403).json({ message: "Unauthorised attempt." });
    }

    return res.status(200).json(userDoc[0]);
  } catch (err) {
    console.error("Error fetching user:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

router.post("/ban", authenticate, async (req, res) => {
  try {
    const { bannedUser, reason, unban } = req.body; // unban = true if unbanning user
    const { username, role } = req.user;

    if (role === "user") {
      return res
        .status(403)
        .json({ message: "User is not authorised to issue bans." });
    }

    const userDoc = await User.findOneAndUpdate(
      { username: bannedUser, gameBan: unban },
      { $set: { gameBan: !unban } },
      { new: "true" }
    );

    if (!userDoc) {
      return res.status(400).json({
        message: `User not found or user already ${unban && "un"}banned.`
      });
    }

    const htmlContentAdmin = `
      <div style="font-family: Arial, sans-serif; padding: 16px;">
        <h2>${unban ? "Unb" : "B"}an Issue Confirmation</h2>
        <p><strong>${unban ? "Unb" : "B"}anned User:</strong> ${bannedUser}</p>
        <p><strong>${unban ? "Unb" : "B"}anned By:</strong> ${username}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString(undefined, {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        })}</p>
      </div>
    `;

    const htmlContentUser = `<div style="font-family: Arial, sans-serif; padding: 16px;">
        <h2>${unban ? "Unb" : "B"}an Notice</h2>
        <p><strong>Your account has been ${unban ? "Un" : ""}banned from The Rizz Quiz</strong></p>
        <p><strong>Username:</strong> ${bannedUser}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString(undefined, {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        })}</p>
        ${
          !unban
            ? `
        <p style="margin-top: 24px; font-style: italic; color: #ff0000;">
          If you believe this was a mistake, please contact support to clarify.
        </p>`
            : ""
        }
      </div>`;

    await sendEmail(
      "therizzquiz@gmail.com",
      `${unban ? "Unb" : "B"}an Report: ${bannedUser}`,
      "",
      htmlContentAdmin
    );

    await sendEmail(
      userDoc.email,
      `${unban ? "Unb" : "B"}an Notice: ${bannedUser}`,
      "",
      htmlContentUser
    );

    return res.status(200).json({ message: "User banned successfully." });
  } catch (err) {
    console.error("Error handling ban:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

router.post("/chatban", authenticate, async (req, res) => {
  try {
    const { bannedUser, reason, unban } = req.body; // unban = true if unbanning user
    const { username, role } = req.user;

    if (role === "user") {
      return res
        .status(403)
        .json({ message: "User is not authorised to issue chat bans." });
    }

    const userDoc = await User.findOneAndUpdate(
      { username: bannedUser, chatBan: unban },
      { $set: { chatBan: !unban } },
      { new: "true" }
    );

    if (!userDoc) {
      return res.status(400).json({
        message: `User not found or user already chat ${unban && "un"}banned.`
      });
    }

    await Lobby.collection.findOneAndUpdate(
      {
        [`players.${bannedUser}`]: { $exists: true }
      },
      {
        $set: {
          [`players.${bannedUser}.chatBan`]: !unban
        }
      }
    );

    const htmlContentAdmin = `
      <div style="font-family: Arial, sans-serif; padding: 16px;">
        <h2>Chat ${unban ? "Unb" : "B"}an Issue Confirmation</h2>
        <p><strong>${unban ? "Unb" : "B"}anned User:</strong> ${bannedUser}</p>
        <p><strong>${unban ? "Unb" : "B"}anned By:</strong> ${username}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString(undefined, {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        })}</p>
      </div>
    `;

    // TODO: retrieve chat logs (including from closed lobbies?)
    const htmlContentUser = `<div style="font-family: Arial, sans-serif; padding: 16px;">
        <h2>Chat ${unban ? "Unb" : "B"}an Notice</h2>
        <p><strong>Your account has been chat ${unban ? "Un" : ""}banned on The Rizz Quiz</strong></p>
        <p><strong>Username:</strong> ${bannedUser}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString(undefined, {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        })}</p>
        ${
          !unban
            ? `
        <p style="margin-top: 24px; font-style: italic; color: #ff0000;">
          If you believe this was a mistake, please contact support to clarify.
        </p>`
            : ""
        }
      </div>`;

    await sendEmail(
      "therizzquiz@gmail.com",
      `Chat ${unban ? "Unb" : "B"}an Report: ${bannedUser}`,
      "",
      htmlContentAdmin
    );

    await sendEmail(
      userDoc.email,
      `Chat ${unban ? "Unb" : "B"}an Notice: ${bannedUser}`,
      "",
      htmlContentUser
    );

    return res.status(200).json({ message: "User chat banned successfully." });
  } catch (err) {
    console.error("Error handling ban:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

export default router;
