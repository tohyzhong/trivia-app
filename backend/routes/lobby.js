import express from "express";
import jwt from "jsonwebtoken";
import * as crypto from "node:crypto";
import Lobby from "../models/Lobby.js";
import Profile from "../models/Profile.js";
import { getSocketIO, getUserSocketMap } from "../socket.js";
import authenticate from "./authMiddleware.js";
import {
  generateUniqueQuestionIds,
  generateUniqueKnowledgeQuestionIds,
  getQuestionById,
  getKnowledgeQuestionById
} from "../utils/generatequestions.js";
import User from "../models/User.js";

const router = express.Router();

// Create a new Solo lobby
router.post("/create", authenticate, async (req, res) => {
  try {
    const gameType = req.body.gameType;
    const username = req.user.username;
    const lobbyId = crypto.randomUUID();

    const [playerDoc] = await Profile.aggregate([
      { $match: { username } },
      {
        $lookup: {
          from: "lobbies",
          pipeline: [
            {
              $facet: {
                lobbyExists: [{ $match: { lobbyId } }, { $limit: 1 }],
                playerExists: [
                  {
                    $match: {
                      $expr: {
                        $ne: [{ $type: `$players.${username}` }, "missing"]
                      }
                    }
                  },
                  { $limit: 1 }
                ]
              }
            }
          ],
          as: "lobbyStatus"
        }
      },
      {
        $lookup: {
          from: "classicquestions",
          pipeline: [
            { $group: { _id: "$category" } },
            { $project: { _id: 0, category: "$_id" } }
          ],
          as: "categories"
        }
      },
      {
        $lookup: {
          from: "users",
          pipeline: [
            { $match: { username: username } },
            { $project: { gameBan: 1, chatBan: 1, _id: 0 } }
          ],
          as: "chatBanInfo"
        }
      },
      {
        $addFields: {
          chatBan: { $arrayElemAt: ["$chatBanInfo.gameBan", 0] },
          gameBan: { $arrayElemAt: ["$chatBanInfo.gameBan", 0] }
        }
      },
      { $unwind: "$lobbyStatus" },
      {
        $addFields: {
          lobbyExists: {
            $gt: [{ $size: "$lobbyStatus.lobbyExists" }, 0]
          },
          playerExists: {
            $gt: [{ $size: "$lobbyStatus.playerExists" }, 0]
          }
        }
      },
      {
        $project: {
          username: 1,
          lobbyExists: 1,
          playerExists: 1,
          categories: "$categories.category",
          profilePicture: 1,
          currency: 1,
          powerups: 1,
          chatBan: 1,
          gameBan: 1
        }
      }
    ]);

    if (!playerDoc)
      return res.status(404).json({ message: "Player not found." });
    if (playerDoc.lobbyExists)
      return res.status(400).json({ message: "Lobby ID already exists." });
    if (playerDoc.playerExists)
      return res.status(400).json({ message: "Player already in a lobby." });
    if (playerDoc.categories.length === 0) {
      return res.status(400).json({ message: "No categories found." });
    }
    if (playerDoc.gameBan) {
      return res.status(400).json({ message: "Player is banned." });
    }

    const defaultCategory = playerDoc.categories.includes("General")
      ? "General"
      : playerDoc.categories[0];

    const lobby = {
      lobbyId,
      status: "waiting",
      host: username,
      players: {
        [username]: {
          ready: false,
          profilePicture: playerDoc.profilePicture,
          chatBan: playerDoc.chatBan
        }
      },
      gameType,
      gameSettings: {
        numQuestions: 10,
        timePerQuestion: 30,
        difficulty: 3, // 1-5 scale
        categories: [defaultCategory],
        publicVisible: true,
        name: `${username}'s Lobby`
      },
      gameState: {
        currentQuestion: 0,
        question: null,
        playerStates: {
          [username]: {
            score: 0,
            correctScore: 0,
            streakBonus: 0,
            selectedOption: gameType.includes("classic") ? 0 : "",
            submitted: false,
            answerHistory: {},
            powerups: {
              "Hint Boost": [],
              "Add Time": false,
              "Double Points": false
            }
          }
        },
        answerRevealed: false,
        lastUpdate: new Date()
      },
      chatMessages: [
        {
          sender: "System",
          message: `${username} has created the lobby.`,
          timestamp: new Date()
        }
      ],
      lastActivity: new Date()
    };

    await Lobby.collection.insertOne(lobby);
    return res.status(201).json({
      lobbyId,
      message: "Lobby created successfully",
      categories: playerDoc.categories,
      currency: playerDoc.currency,
      powerups: playerDoc.powerups,
      status: lobby.status ?? ""
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating lobby" });
  }
});

router.get("/check", authenticate, async (req, res) => {
  try {
    const username = req.user.username;

    const [result] = await Profile.collection
      .aggregate([
        { $match: { username } },

        {
          $facet: {
            lobby: [
              {
                $lookup: {
                  from: "lobbies",
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $ne: [{ $type: `$players.${username}` }, "missing"]
                        }
                      }
                    },
                    { $project: { lobbyId: 1, status: 1 } }
                  ],
                  as: "lobby"
                }
              },
              { $unwind: { path: "$lobby", preserveNullAndEmptyArrays: true } },
              { $match: { lobby: { $ne: null } } },
              { $replaceRoot: { newRoot: "$lobby" } }
            ],
            categories: [
              {
                $lookup: {
                  from: "classicquestions",
                  pipeline: [
                    { $group: { _id: "$category" } },
                    { $project: { _id: 0, category: "$_id" } }
                  ],
                  as: "categories"
                }
              },
              {
                $unwind: {
                  path: "$categories",
                  preserveNullAndEmptyArrays: true
                }
              },
              { $match: { categories: { $ne: null } } },
              { $replaceRoot: { newRoot: "$categories" } }
            ],
            profile: [
              {
                $project: {
                  _id: 0,
                  currency: 1,
                  powerups: 1
                }
              }
            ],
            user: [
              {
                $lookup: {
                  from: "users",
                  pipeline: [
                    {
                      $match: {
                        username
                      }
                    },
                    { $project: { _id: 0, gameBan: 1, chatBan: 1 } }
                  ],
                  as: "user"
                }
              },
              { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
              { $match: { user: { $ne: null } } },
              { $replaceRoot: { newRoot: "$user" } }
            ]
          }
        }
      ])
      .toArray();

    const lobby = result.lobby[0] ?? null;
    const categories = result.categories?.map((c) => c.category) ?? [];
    const currency = result.profile[0]?.currency ?? 0;
    const powerups = result.profile[0]?.powerups ?? {};

    const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    const newToken = jwt.sign(
      {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        verified: decoded.verified,
        chatBan: result.user[0].chatBan,
        gameBan: result.user[0].gameBan,
        role: decoded.role
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

    if (result.user[0].gameBan)
      return res.status(400).json({ message: "User banned." });

    return res.status(200).json({
      lobbyId: lobby?.lobbyId ?? null,
      categories,
      currency,
      powerups,
      status: lobby?.status ?? "",
      chatBan: result.user[0].chatBan
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error checking lobby status." });
  }
});

// Connect a player to a Solo lobby (DIFFERENT FROM JOINING A LOBBY)
router.post("/connect/:lobbyId", authenticate, async (req, res) => {
  try {
    const { lobbyId } = req.params;
    const username = req.user.username;

    const newChatMessage = {
      sender: "System",
      message: `${username} has connected.`,
      timestamp: new Date()
    };

    const updatedLobby = await Lobby.collection.findOneAndUpdate(
      {
        lobbyId,
        [`players.${username}`]: { $exists: true }
      },
      {
        $push: { chatMessages: newChatMessage },
        $set: { lastActivity: new Date() }
      },
      { returnDocument: "after" }
    );

    if (!updatedLobby) {
      return res.status(403).json({
        message: "Lobby not found or player not in lobby."
      });
    }

    const socketIO = getSocketIO();
    socketIO.to(lobbyId).emit("updateChat", {
      chatMessages: updatedLobby.chatMessages
    });
    socketIO.to(lobbyId).emit("updateUsers", {
      players: updatedLobby.players,
      host: updatedLobby.host
    });
    socketIO.to(lobbyId).emit("updateState", {
      gameState: updatedLobby.gameState
    });

    return res.status(200).json({
      message: "Player connected successfully",
      lobbyDetails: updatedLobby,
      serverTimeNow: new Date()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving lobby" });
  }
});

// Disconnect a player from a Solo lobby (DIFFERENT FROM LEAVING A LOBBY)
router.post("/disconnect/:lobbyId", authenticate, async (req, res) => {
  try {
    const { lobbyId } = req.params;
    const { player } = req.body;
    const { username } = req.user;

    if (player === username) {
      const newChatMessage = {
        sender: "System",
        message: `${player} has disconnected.`,
        timestamp: new Date()
      };

      const updatedLobby = await Lobby.collection.findOneAndUpdate(
        { lobbyId, [`players.${username}`]: { $exists: true } },
        {
          $push: { chatMessages: newChatMessage },
          $set: { lastActivity: new Date() }
        },
        { returnDocument: "after" }
      );

      if (!updatedLobby) {
        return res.status(404).json({ message: "Lobby not found." });
      }

      const socketIO = getSocketIO();
      socketIO
        .to(lobbyId)
        .emit("updateChat", { chatMessages: updatedLobby.chatMessages });

      return res
        .status(200)
        .json({ message: "Player disconnected successfully" });
    } else {
      return res
        .status(401)
        .json({ message: "User unauthorised to disconnect." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error disconnecting from lobby" });
  }
});

router.get("/public", authenticate, async (req, res) => {
  try {
    const publicLobbies = await Lobby.find({
      status: "waiting",
      "gameSettings.publicVisible": true,
      gameType: { $not: /solo/i }
    }).select("lobbyId host players gameType gameSettings");

    res.status(200).json({ lobbies: publicLobbies });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching lobbies." });
  }
});

router.post("/requestjoin/:lobbyId", authenticate, async (req, res) => {
  try {
    const { lobbyId } = req.params;
    const username = req.user.username;

    const [userData] = await User.aggregate([
      {
        $match: {
          username,
          gameBan: false
        }
      },
      {
        $lookup: {
          from: "profiles",
          localField: "username",
          foreignField: "username",
          as: "profile"
        }
      },
      {
        $unwind: "$profile"
      },
      {
        $project: {
          chatBan: 1,
          "profile.profilePicture": 1
        }
      }
    ]);

    if (!userData) {
      return res.status(404).json({ message: "Player not found or banned." });
    }

    const lobby = await Lobby.collection.findOneAndUpdate(
      { lobbyId, gameType: { $not: /solo/i } },
      {
        $set: {
          [`joinRequests.${username}`]: {
            profilePicture: userData.profile.profilePicture || "",
            chatBan: userData.chatBan || false
          },
          lastActivity: new Date()
        }
      },
      {
        returnDocument: "after",
        projection: { joinRequests: 1 }
      }
    );

    if (!lobby) {
      return res.status(404).json({ message: "No valid lobby found." });
    }

    if (lobby.players?.[username]) {
      return res.status(200).json({ message: "Already in lobby." });
    }

    const io = getSocketIO();
    io.to(lobbyId).emit("updateJoinRequests", lobby.joinRequests);

    return res.status(200).json({ message: "Join request sent." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error processing join request." });
  }
});

router.post("/approve/:lobbyId", authenticate, async (req, res) => {
  try {
    const { lobbyId } = req.params;
    const { usernameToApprove } = req.body;
    const hostUsername = req.user.username;

    // Check if the user is already in another lobby
    const existingLobby = await Lobby.findOne({
      lobbyId: { $ne: lobbyId },
      [`players.${usernameToApprove}`]: { $exists: true }
    });

    if (existingLobby) {
      return res.status(400).json({
        message: `${usernameToApprove} is already in another lobby.`
      });
    }

    const chatMsg = {
      sender: "System",
      message: `${hostUsername} has approved the join request of ${usernameToApprove}.`,
      timestamp: new Date()
    };

    const updatedLobby = await Lobby.collection.findOneAndUpdate(
      {
        lobbyId,
        host: hostUsername,
        [`joinRequests.${usernameToApprove}`]: { $exists: true }
      },
      [
        {
          $set: {
            [`players.${usernameToApprove}`]: {
              ready: false,
              profilePicture: `$joinRequests.${usernameToApprove}.profilePicture`,
              chatBan: `$joinRequests.${usernameToApprove}.chatBan`
            },
            [`gameState.playerStates.${usernameToApprove}`]: {
              score: 0,
              correctScore: 0,
              streakBonus: 0,
              selectedOption: 0,
              submitted: false,
              answerHistory: {},
              powerups: {
                "Hint Boost": [],
                "Add Time": false,
                "Double Points": false
              }
            },
            lastActivity: new Date(),
            chatMessages: {
              $concatArrays: ["$chatMessages", [chatMsg]]
            }
          }
        },
        {
          $unset: [`joinRequests.${usernameToApprove}`]
        }
      ],
      { returnDocument: "after" }
    );

    if (!updatedLobby) {
      return res
        .status(403)
        .json({ message: "Unauthorized or invalid request." });
    }

    const io = getSocketIO();
    const userSocketMap = getUserSocketMap();
    const targetSocketIds = userSocketMap.get(usernameToApprove);
    if (targetSocketIds && Array.isArray(targetSocketIds)) {
      targetSocketIds.forEach((socketId) => {
        io.to(socketId).emit("approveUser", lobbyId);
      });
    }
    io.to(lobbyId).emit("updateUsers", {
      players: updatedLobby.players,
      host: updatedLobby.host
    });
    io.to(lobbyId).emit("updateJoinRequests", updatedLobby.joinRequests);
    io.to(lobbyId).emit("updateChat", {
      chatMessages: updatedLobby.chatMessages
    });

    return res.status(200).json({ message: "User approved." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error approving user." });
  }
});

router.post("/kick/:lobbyId", authenticate, async (req, res) => {
  try {
    const { lobbyId } = req.params;
    const { usernameToKick, isRejection } = req.body;
    const hostUsername = req.user.username;

    if (hostUsername === usernameToKick)
      return res
        .status(401)
        .json({ message: "You are not allowed to kick yourself." });

    const chatMsg = {
      sender: "System",
      message: `${hostUsername} has ${isRejection ? "rejected" : "kicked"} ${usernameToKick} from the lobby.`,
      timestamp: new Date()
    };

    // Try to remove from either players or joinRequests
    const updatedLobby = await Lobby.collection.findOneAndUpdate(
      {
        lobbyId,
        host: hostUsername,
        $or: [
          { [`players.${usernameToKick}`]: { $exists: true } },
          { [`joinRequests.${usernameToKick}`]: { $exists: true } }
        ]
      },
      {
        $unset: {
          [`players.${usernameToKick}`]: "",
          [`joinRequests.${usernameToKick}`]: "",
          [`gameState.playerStates.${usernameToKick}`]: ""
        },
        $push: { chatMessages: chatMsg },
        $set: {
          lastActivity: new Date()
        }
      },
      { returnDocument: "after" }
    );

    if (!updatedLobby) {
      return res
        .status(403)
        .json({ message: "Unauthorized or user not found." });
    }

    const io = getSocketIO();
    const userSocketMap = getUserSocketMap();
    const targetSocketIds = userSocketMap.get(usernameToKick);
    if (targetSocketIds && Array.isArray(targetSocketIds)) {
      targetSocketIds.forEach((socketId) => {
        io.to(socketId).emit(isRejection ? "rejectUser" : "kickUser", lobbyId);
      });
    }
    io.to(lobbyId).emit("updateKick", usernameToKick);
    io.to(lobbyId).emit("updateUsers", {
      players: updatedLobby.players,
      host: updatedLobby.host
    });
    io.to(lobbyId).emit("updateJoinRequests", updatedLobby.joinRequests);
    io.to(lobbyId).emit("updateChat", {
      chatMessages: updatedLobby.chatMessages
    });

    return res.status(200).json({ message: "User kicked." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error kicking user." });
  }
});

router.post("/leave/:lobbyId", authenticate, async (req, res) => {
  try {
    const { lobbyId } = req.params;
    const { player } = req.body;
    const { username } = req.user;

    if (username === player) {
      const newChatMessage = {
        sender: "System",
        message: `${player} has left.`,
        timestamp: new Date()
      };

      const lobby = await Lobby.collection.findOneAndUpdate(
        { lobbyId, [`players.${username}`]: { $exists: true } },
        [
          {
            $set: {
              [`players.${username}`]: "$$REMOVE",
              [`gameState.playerStates.${username}`]: "$$REMOVE",
              chatMessages: {
                $concatArrays: ["$chatMessages", [newChatMessage]]
              },
              // Randomly assign another host if the host is leaving
              host: {
                $cond: [
                  { $eq: ["$host", username] },
                  {
                    $let: {
                      vars: { remaining: { $objectToArray: "$players" } },
                      in: {
                        $cond: [
                          { $gt: [{ $size: "$$remaining" }, 1] },
                          {
                            $arrayElemAt: [
                              {
                                $map: {
                                  input: {
                                    $filter: {
                                      input: "$$remaining",
                                      as: "item",
                                      cond: { $ne: ["$$item.k", username] }
                                    }
                                  },
                                  as: "item",
                                  in: "$$item.k"
                                }
                              },
                              {
                                $floor: {
                                  $multiply: [
                                    { $rand: {} },
                                    { $subtract: [{ $size: "$$remaining" }, 1] }
                                  ]
                                }
                              }
                            ]
                          },
                          null
                        ]
                      }
                    }
                  },
                  "$host"
                ]
              },
              lastActivity: new Date()
            }
          }
        ],
        { returnDocument: "after" }
      );

      if (!lobby) {
        return res
          .status(404)
          .json({ message: "Lobby not found or player not in lobby." });
      }

      const socketIO = getSocketIO();
      socketIO
        .to(lobbyId)
        .emit("updateChat", { chatMessages: lobby.chatMessages });
      socketIO.to(lobbyId).emit("updateUsers", {
        players: lobby.players,
        host: lobby.host
      });
      socketIO.to(lobbyId).emit("updateState", { gameState: lobby.gameState });

      // Delete lobby if it's empty
      if (!lobby.players || Object.keys(lobby.players).length === 0) {
        await Lobby.deleteOne({ lobbyId });
      }

      return res.status(200).json({ message: "Successfully left lobby." });
    } else {
      return res
        .status(401)
        .json({ message: "User unauthorised to leave lobby." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error leaving lobby" });
  }
});

router.post("/chat/:lobbyId", authenticate, async (req, res) => {
  try {
    const { lobbyId } = req.params;
    const { message } = req.body;
    const username = req.user.username;

    if (req.user.chatBan)
      return res.status(404).json({
        message: "User is chat banned."
      });

    const newChatMessage = {
      sender: username,
      message,
      timestamp: new Date()
    };

    const updatedLobby = await Lobby.collection.findOneAndUpdate(
      {
        lobbyId,
        [`players.${username}`]: { $exists: true },
        [`players.${username}.chatBan`]: false
      },
      {
        $push: { chatMessages: newChatMessage },
        $set: { lastActivity: new Date() }
      },
      { returnDocument: "after" }
    );

    if (!updatedLobby) {
      return res.status(404).json({
        message: "Lobby not found or user not authorised to send messages."
      });
    }
    // Notify all players in the lobby
    const socketIO = getSocketIO();
    socketIO
      .to(lobbyId)
      .emit("updateChat", { chatMessages: updatedLobby.chatMessages });

    return res.status(200).json({ message: "Chat message sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error sending chat message" });
  }
});

router.post("/ready/:lobbyId", authenticate, async (req, res) => {
  try {
    const { lobbyId } = req.params;
    const { username } = req.user;

    const updateResult = await Lobby.collection.findOneAndUpdate(
      { lobbyId, [`players.${username}`]: { $exists: true } },
      [
        {
          $set: {
            [`players.${username}.ready`]: {
              $not: [`$players.${username}.ready`]
            },
            lastActivity: new Date()
          }
        }
      ],
      { returnDocument: "after" }
    );

    if (!updateResult) {
      return res
        .status(404)
        .json({ message: "Lobby not found or player already in lobby." });
    }

    const socketIO = getSocketIO();
    socketIO.to(lobbyId).emit("updateUsers", {
      players: updateResult.players,
      host: updateResult.host
    });

    res.status(200).json({ message: "Ready status updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating ready status" });
  }
});

router.post("/updateSettings/:lobbyId", authenticate, async (req, res) => {
  try {
    const { lobbyId } = req.params;
    const { gameSettings } = req.body;
    const { username } = req.user;

    const { numQuestions, timePerQuestion, difficulty, categories, name } =
      gameSettings;

    if (name.length > 30 || name.length < 5) {
      return res.status(400).json({
        message: "Lobby name must be between 5 and 30 characters (inclusive)."
      });
    }

    if (numQuestions < 3 || numQuestions > 20) {
      return res.status(400).json({
        message: "Number of questions must be between 3 and 20 (inclusive)."
      });
    }
    if (timePerQuestion < 5 || timePerQuestion > 60) {
      return res.status(400).json({
        message: "Time per question must be between 5 and 60 (inclusive)."
      });
    }
    if (difficulty < 1 || difficulty > 5) {
      return res
        .status(400)
        .json({ message: "Difficulty must be between 1 and 5 (inclusive)." });
    }
    if (categories.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one category must be selected." });
    }
    if (categories.length > 1 && categories.includes("Community")) {
      return res.status(400).json({
        message: "Community Mode cannot be selected with other modes."
      });
    }

    const newChatMessage = {
      sender: "System",
      message: `${username} has updated the game settings.`,
      timestamp: new Date()
    };

    const updatedLobby = await Lobby.collection.findOneAndUpdate(
      { lobbyId, [`players.${username}`]: { $exists: true }, host: username },
      {
        $set: {
          gameSettings,
          lastActivity: new Date()
        },
        $push: {
          chatMessages: newChatMessage
        }
      },
      { returnDocument: "after" }
    );

    if (!updatedLobby) {
      return res
        .status(404)
        .json({ message: "Lobby not found or access denied." });
    }

    const socketIO = getSocketIO();
    socketIO.to(lobbyId).emit("updateChat", {
      chatMessages: updatedLobby.chatMessages
    });
    socketIO.to(lobbyId).emit("updateSettings", {
      gameSettings: updatedLobby.gameSettings
    });

    return res
      .status(200)
      .json({ message: "Game settings updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating game settings" });
  }
});

router.get("/startlobby/:lobbyId", authenticate, async (req, res) => {
  try {
    const { lobbyId } = req.params;
    const loggedInUser = req.user.username;

    const [lobbyResult] = await Lobby.collection
      .aggregate([
        { $match: { lobbyId, [`players.${loggedInUser}`]: { $exists: true } } },
        {
          $lookup: {
            from: "users",
            let: { playerUsernames: { $objectToArray: "$players" } },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $in: [
                          "$username",
                          {
                            $map: {
                              input: "$$playerUsernames",
                              as: "p",
                              in: "$$p.k"
                            }
                          }
                        ]
                      },
                      { $eq: ["$gameBan", true] }
                    ]
                  }
                }
              },
              { $project: { username: 1 } }
            ],
            as: "bannedPlayers"
          }
        }
      ])
      .toArray();

    if (!lobbyResult) {
      return res.status(404).json({ message: "Lobby not found" });
    }

    const lobby = lobbyResult;
    const banned = lobby.bannedPlayers;

    if (lobby.status === "in-progress" || lobby.status === "finished") {
      return res.status(401).json({ message: "Lobby has already started." });
    }

    if (lobby.host !== loggedInUser) {
      return res.status(403).json({ message: "Only host can start the game." });
    }

    if (banned.length > 0) {
      return res.status(403).json({
        message: "One or more players are banned from playing.",
        bannedPlayers: banned.map((u) => u.username)
      });
    }

    const players = Object.keys(lobby.players);
    const readyCount = players.filter((u) => lobby.players[u].ready).length;

    if (readyCount / players.length < 0.5)
      return res
        .status(403)
        .json({ message: "At least 50% must be ready to start." });

    if (!lobby.gameType.includes("solo") && players.length <= 1)
      return res.status(403).json({
        message: "You can't start a multiplayer game with only 1 player."
      });

    // Configure game state
    const { questionIds, questionCategories, question } =
      lobby.gameType.includes("classic")
        ? await generateUniqueQuestionIds(
            lobby.gameSettings.numQuestions,
            lobby.gameSettings.categories,
            lobby.gameSettings.difficulty
          )
        : await generateUniqueKnowledgeQuestionIds(
            lobby.gameSettings.numQuestions,
            lobby.gameSettings.difficulty
          );

    const update = {
      currentQuestion: 1,
      questionIds,
      question,
      questionCategories,
      lastUpdate: new Date()
    };

    const gameState = { ...lobby.gameState, ...update };

    await Lobby.collection.updateOne(
      { lobbyId },
      { $set: { gameState, status: "in-progress", lastActivity: new Date() } }
    );

    // Notify players in the lobby
    const socketIO = getSocketIO();
    socketIO.to(lobbyId).emit("updateStatus", { status: "in-progress" });
    socketIO
      .to(lobbyId)
      .emit("updateState", { gameState, serverTimeNow: new Date() });

    return res.status(200).json({ message: "Lobby started." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error starting lobby." });
  }
});

router.post("/submit/:lobbyId", authenticate, async (req, res) => {
  try {
    const { lobbyId } = req.params;
    const { user, option } = req.body;
    const username = req.user.username;
    const timeNow = new Date();

    const lobby = await Lobby.collection.findOne({
      lobbyId,
      [`players.${username}`]: { $exists: true }
    });
    if (!lobby) {
      return res.status(404).json({ message: "Lobby or player not found." });
    }

    const playerState = {
      selectedOption: option,
      submitted: true,
      answerHistory: lobby.gameState.playerStates[user]?.answerHistory || {},
      score: lobby.gameState.playerStates[user]?.score || 0,
      timeSubmitted: timeNow,
      powerups: lobby.gameState.playerStates[user]?.powerups || {}
    };

    const updatedPlayerStates = {
      ...lobby.gameState.playerStates,
      [user]: playerState
    };

    let allSubmitted = true;
    for (const stateKey in updatedPlayerStates) {
      if (!updatedPlayerStates[stateKey].submitted) {
        allSubmitted = false;
        break;
      }
    }

    if (allSubmitted) {
      if (lobby.gameType.split("-")[0] !== "coop") {
        const currentQuestion = lobby.gameState.currentQuestion;
        const timeLimit = lobby.gameSettings.timePerQuestion;
        const question = lobby.gameState.question;

        for (const username of Object.keys(lobby.players)) {
          const state = updatedPlayerStates[username];
          const selected = state.selectedOption;
          const isCorrect = selected === question.correctOption;
          const bonusScoreEnabled = state.powerups?.["Double Points"] ?? false;

          state.answerHistory = state.answerHistory || {};
          state.correctScore = 0;
          state.streakBonus = 0;

          if (selected) {
            if (isCorrect) {
              const timeElapsed =
                (state.timeSubmitted - lobby.gameState.lastUpdate) / 1000;

              if (timeElapsed <= 3.0) {
                state.correctScore = 100;
              } else if (timeElapsed > timeLimit + 5.0) {
                state.correctScore = 0;
              } else {
                const timeAfter30 = timeElapsed - 3.0;
                const remainingTime = timeLimit - 3.0;
                const k = 0.8;
                let score = 100 * Math.exp(-k * (timeAfter30 / remainingTime));
                state.correctScore = Math.max(40, Math.round(score));
              }

              state.correctScore = bonusScoreEnabled
                ? 2 * state.correctScore
                : state.correctScore;

              state.score += state.correctScore;
              state.answerHistory[currentQuestion] = "correct";
            } else {
              state.answerHistory[currentQuestion] = "wrong";
            }
          } else {
            state.answerHistory[currentQuestion] = "missing";
          }

          // Also mark earlier unanswered questions as missing (if user missed a few questions while lobby was ongoing)
          for (let i = currentQuestion - 1; i >= 1; i--) {
            const prev = state.answerHistory[i];
            if (prev) break;
            state.answerHistory[i] = "missing";
          }

          // Max bonus is 50 for 5 correct in a row, if correctScore === 0 player is cheating
          if (
            state.answerHistory[currentQuestion] === "correct" &&
            state.correctScore !== 0
          ) {
            let bonusCount = 0;
            for (
              let i = currentQuestion - 1;
              i >= currentQuestion - 5 && i > 0;
              i--
            ) {
              if (state.answerHistory[i] === "correct") bonusCount++;
              else break;
            }
            state.streakBonus = bonusCount * 10;
            state.score += state.streakBonus;
          }
        }

        const updatedLobby = await Lobby.collection.findOneAndUpdate(
          { lobbyId },
          {
            $set: {
              "gameState.playerStates": updatedPlayerStates,
              "gameState.answerRevealed": true,
              lastActivity: new Date()
            }
          },
          { returnDocument: "after" }
        );

        getSocketIO()
          .to(lobbyId)
          .emit("updateState", { gameState: updatedLobby.gameState });

        return res
          .status(200)
          .json({ message: "All players submitted. Answer revealed." });
      } else {
        // Co-op
        const voteDetails = {};
        const playerStates = updatedPlayerStates;
        const currentQuestion = lobby.gameState.currentQuestion;
        const correctOption = lobby.gameState.question.correctOption;
        const timeLimit = lobby.gameSettings.timePerQuestion;
        let bonusScoreEnabled = false;

        for (const username of Object.keys(lobby.players)) {
          const state = playerStates[username] ?? {};
          const selected = state.selectedOption ?? 0;
          state.submitted = true;
          state.answerHistory = state.answerHistory || {};
          state.correctScore = 0;
          state.streakBonus = 0;

          if (selected > 0) {
            voteDetails[selected] = voteDetails[selected] || [];
            if (!voteDetails[selected].includes(username)) {
              voteDetails[selected].push(username);
            }
          } else {
            state.answerHistory[currentQuestion] = "missing";
          }

          const isCorrect = selected === correctOption;

          if (isCorrect) {
            state.answerHistory[currentQuestion] = "correct";
          } else {
            state.answerHistory[currentQuestion] = "wrong";
          }

          for (let i = currentQuestion - 1; i >= 1; i--) {
            if (!state.answerHistory[i]) state.answerHistory[i] = "missing";
          }

          playerStates[username] = state;

          bonusScoreEnabled =
            bonusScoreEnabled || (state.powerups?.["Double Points"] ?? false);
        }

        const maxVotes = Math.max(
          ...Object.values(voteDetails).map((obj) => obj.length),
          0
        );
        const topOptions = Object.entries(voteDetails)
          .filter(([_, users]) => users.length === maxVotes)
          .map(([opt]) => parseInt(opt));

        const isCorrect =
          topOptions.length === 1
            ? topOptions[0] === correctOption
            : topOptions.length === 2 &&
              topOptions.includes(correctOption) &&
              maxVotes > 0;

        let teamCorrectScore = 0;
        let teamStreakBonus = 0;

        const teamAnswerHistory = lobby.gameState.team?.teamAnswerHistory || {};
        teamAnswerHistory[currentQuestion] = isCorrect
          ? ["correct", voteDetails]
          : maxVotes === 0
            ? ["missing"]
            : ["wrong", voteDetails];
        for (let i = currentQuestion - 1; i >= 1; i--) {
          if (!teamAnswerHistory[i]) teamAnswerHistory[i] = ["missing"];
        }

        if (isCorrect) {
          const timeElapsed = (timeNow - lobby.gameState.lastUpdate) / 1000;

          if (timeElapsed <= 3.0) {
            teamCorrectScore = 100;
          } else if (timeElapsed > timeLimit + 5.0) {
            teamCorrectScore = 0;
          } else {
            const timeAfter30 = timeElapsed - 3.0;
            const remainingTime = timeLimit - 3.0;
            const k = 0.8;
            let score = 100 * Math.exp(-k * (timeAfter30 / remainingTime));
            teamCorrectScore = Math.max(40, Math.round(score));
          }

          teamCorrectScore = bonusScoreEnabled
            ? 2 * teamCorrectScore
            : teamCorrectScore;

          let streak = 0;
          if (teamCorrectScore !== 0) {
            for (
              let i = currentQuestion - 1;
              i >= currentQuestion - 5 && i > 0;
              i--
            ) {
              if (teamAnswerHistory[i][0] === "correct") streak++;
              else break;
            }
          }

          teamStreakBonus = streak * 10;
        }

        const updatedLobby = await Lobby.collection.findOneAndUpdate(
          { lobbyId },
          {
            $set: {
              "gameState.playerStates": playerStates,
              "gameState.team": {
                teamAnswerHistory,
                teamScore:
                  (lobby.gameState.team?.teamScore || 0) +
                  teamCorrectScore +
                  teamStreakBonus,
                teamCorrectScore,
                teamStreakBonus
              },
              "gameState.answerRevealed": true,
              lastActivity: new Date()
            }
          },
          { returnDocument: "after" }
        );

        getSocketIO()
          .to(lobbyId)
          .emit("updateState", { gameState: updatedLobby.gameState });

        return res.status(200).json({ message: "Answer revealed (co-op)." });
      }
    } else {
      const updatedLobby = await Lobby.collection.findOneAndUpdate(
        { lobbyId },
        {
          $set: {
            "gameState.playerStates": updatedPlayerStates,
            "gameState.answerRevealed": false,
            lastActivity: new Date()
          }
        },
        { returnDocument: "after" }
      );

      // Hide correct answer from frontend
      updatedLobby.gameState.question.correctOption = null;
      const { playerStates, ...restGameState } = updatedLobby.gameState;

      for (const state of Object.values(playerStates)) {
        delete state.powerups;
      }

      getSocketIO()
        .to(lobbyId)
        .emit("updateState", {
          gameState: {
            ...restGameState,
            playerStates
          }
        });

      return res
        .status(200)
        .json({ message: "Option submitted. Waiting for others." });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error starting lobby." });
  }
});

router.get("/revealanswer/:lobbyId", authenticate, async (req, res) => {
  try {
    const { lobbyId } = req.params;
    const { username } = req.user;

    const lobby = await Lobby.collection.findOne({
      lobbyId,
      [`players.${username}`]: { $exists: true }
    });
    if (!lobby) {
      return res.status(404).json({ message: "Lobby or player not found" });
    }
    if (lobby.gameState.answerRevealed) {
      return res.status(404).json({ message: "Answer already revealed." });
    }

    const timeNow = new Date();
    const timeLimit = lobby.gameSettings.timePerQuestion;
    const lastUpdate = new Date(lobby.gameState.lastUpdate);
    const secondsElapsed = (timeNow - lastUpdate) / 1000;

    if (secondsElapsed < timeLimit - 1) {
      return res.status(403).json({ message: "Too early to reveal answer." });
    }

    if (lobby.gameType.split("-")[0] !== "coop") {
      const currentQuestion = lobby.gameState.currentQuestion;
      const updatedPlayerStates = { ...lobby.gameState.playerStates };

      for (const player of Object.keys(lobby.players)) {
        const state = updatedPlayerStates[player] ?? {};

        if (!state.submitted) {
          state.selectedOption = lobby.gameType.includes("classic") ? 0 : "";
          state.submitted = false;
          state.correctScore = 0;
          state.streakBonus = 0;

          state.answerHistory = state.answerHistory || {};
          state.answerHistory[currentQuestion] = "missing";

          // Also mark earlier unanswered questions as missing (if user missed a few questions while lobby was ongoing)
          for (let qNum = currentQuestion - 1; qNum >= 1; qNum--) {
            const history = state.answerHistory?.[qNum];
            if (history) {
              break;
            }
            state.answerHistory[qNum] = "missing";
          }

          updatedPlayerStates[player] = state;
        } else {
          const selected = state.selectedOption;
          const isCorrect = selected === lobby.gameState.question.correctOption;
          const bonusScoreEnabled = state.powerups["Double Points"];

          state.answerHistory = state.answerHistory || {};
          state.correctScore = 0;
          state.streakBonus = 0;

          if (isCorrect) {
            const timeElapsed =
              (state.timeSubmitted - lobby.gameState.lastUpdate) / 1000;

            if (timeElapsed <= 3.0) {
              state.correctScore = 100;
            } else if (timeElapsed > timeLimit + 5.0) {
              state.correctScore = 0;
            } else {
              const timeAfter30 = timeElapsed - 3.0;
              const remainingTime = timeLimit - 3.0;
              const k = 0.8;
              let score = 100 * Math.exp(-k * (timeAfter30 / remainingTime));
              state.correctScore = Math.max(40, Math.round(score));
            }

            state.correctScore = bonusScoreEnabled
              ? 2 * state.correctScore
              : state.correctScore;

            state.score += state.correctScore;
            state.answerHistory[currentQuestion] = "correct";
          } else {
            state.answerHistory[currentQuestion] = "wrong";
          }

          // Also mark earlier unanswered questions as missing (if user missed a few questions while lobby was ongoing)
          for (let i = currentQuestion - 1; i >= 1; i--) {
            const prev = state.answerHistory[i];
            if (prev) break;
            state.answerHistory[i] = "missing";
          }

          // Max bonus is 50 for 5 correct in a row
          if (
            state.answerHistory[currentQuestion] === "correct" &&
            state.correctScore !== 0
          ) {
            let bonusCount = 0;
            for (
              let i = currentQuestion - 1;
              i >= currentQuestion - 5 && i > 0;
              i--
            ) {
              if (state.answerHistory[i] === "correct") bonusCount++;
              else break;
            }
            state.streakBonus = bonusCount * 10;
            state.score += state.streakBonus;
          }
        }
      }

      const updatedLobby = await Lobby.collection.findOneAndUpdate(
        { lobbyId },
        {
          $set: {
            "gameState.answerRevealed": true,
            "gameState.playerStates": updatedPlayerStates,
            lastActivity: new Date()
          }
        },
        { returnDocument: "after" }
      );

      const socketIO = getSocketIO();
      socketIO
        .to(lobbyId)
        .emit("updateState", { gameState: updatedLobby.gameState });

      return res.status(200).json({ message: "Answer revealed." });
    } else {
      // Co-op logic if not all players submit
      const voteDetails = {};
      const playerStates = { ...lobby.gameState.playerStates };
      const currentQuestion = lobby.gameState.currentQuestion;
      const correctOption = lobby.gameState.question.correctOption;
      const timeLimit = lobby.gameSettings.timePerQuestion;
      let bonusScoreEnabled = false;

      for (const username of Object.keys(lobby.players)) {
        const state = playerStates[username] ?? {};
        const selected = state.selectedOption ?? 0;
        state.submitted = true;
        state.answerHistory = state.answerHistory || {};
        state.correctScore = 0;
        state.streakBonus = 0;

        if (selected > 0) {
          voteDetails[selected] = voteDetails[selected] || [];
          if (!voteDetails[selected].includes(username)) {
            voteDetails[selected].push(username);
          }
          const isCorrect = selected === correctOption;

          if (isCorrect) {
            state.answerHistory[currentQuestion] = "correct";
          } else {
            state.answerHistory[currentQuestion] = "wrong";
          }
        } else {
          state.answerHistory[currentQuestion] = "missing";
        }

        for (let i = currentQuestion - 1; i >= 1; i--) {
          if (!state.answerHistory[i]) state.answerHistory[i] = "missing";
        }

        playerStates[username] = state;

        bonusScoreEnabled =
          bonusScoreEnabled || (state?.powerups["Double Points"] ?? false);
      }

      const maxVotes = Math.max(
        ...Object.values(voteDetails).map((obj) => obj.length),
        0
      );
      const topOptions = Object.entries(voteDetails)
        .filter(([_, users]) => users.length === maxVotes)
        .map(([opt]) => parseInt(opt));

      const isCorrect =
        topOptions.length === 1
          ? topOptions[0] === correctOption
          : topOptions.length === 2 &&
            topOptions.includes(correctOption) &&
            maxVotes > 0;

      let teamCorrectScore = 0;
      let teamStreakBonus = 0;

      const teamAnswerHistory = lobby.gameState.team?.teamAnswerHistory || {};
      teamAnswerHistory[currentQuestion] = isCorrect
        ? ["correct", voteDetails]
        : maxVotes === 0
          ? ["missing"]
          : ["wrong", voteDetails];
      for (let i = currentQuestion - 1; i >= 1; i--) {
        if (!teamAnswerHistory[i]) teamAnswerHistory[i] = ["missing"];
      }

      if (isCorrect) {
        const timeElapsed = (timeNow - lobby.gameState.lastUpdate) / 1000;

        if (timeElapsed <= 3.0) {
          teamCorrectScore = 100;
        } else if (timeElapsed > timeLimit + 5.0) {
          teamCorrectScore = 0;
        } else {
          const timeAfter30 = timeElapsed - 3.0;
          const remainingTime = timeLimit - 3.0;
          const k = 0.8;
          let score = 100 * Math.exp(-k * (timeAfter30 / remainingTime));
          teamCorrectScore = Math.max(40, Math.round(score));
        }

        teamCorrectScore = bonusScoreEnabled
          ? 2 * teamCorrectScore
          : teamCorrectScore;

        let streak = 0;
        if (teamCorrectScore !== 0) {
          for (
            let i = currentQuestion - 1;
            i >= currentQuestion - 5 && i > 0;
            i--
          ) {
            if (teamAnswerHistory[i][0] === "correct") streak++;
            else break;
          }
        }

        teamStreakBonus = streak * 10;
      }

      const updatedLobby = await Lobby.collection.findOneAndUpdate(
        { lobbyId },
        {
          $set: {
            "gameState.playerStates": playerStates,
            "gameState.team": {
              teamAnswerHistory,
              teamScore:
                (lobby.gameState.team?.teamScore || 0) +
                teamCorrectScore +
                teamStreakBonus,
              teamCorrectScore,
              teamStreakBonus
            },
            "gameState.answerRevealed": true,
            lastActivity: new Date()
          }
        },
        { returnDocument: "after" }
      );

      getSocketIO()
        .to(lobbyId)
        .emit("updateState", { gameState: updatedLobby.gameState });

      return res.status(200).json({ message: "Answer revealed (co-op)." });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error revealing answer." });
  }
});

function initLeaderboardStats() {
  return {
    classic: {
      solo: {},
      coop: {},
      versus: {},
      overall: {}
    },
    knowledge: {
      solo: {},
      coop: {},
      versus: {},
      overall: {}
    }
  };
}

router.post("/advancelobby/:lobbyId", authenticate, async (req, res) => {
  try {
    const { lobbyId } = req.params;

    const lobby = await Lobby.collection.findOne({ lobbyId });
    if (!lobby) {
      return res.status(404).json({ message: "Lobby not found" });
    }

    const now = new Date();

    // Confirm eligibility for advancing lobby
    const timeLimit = lobby.gameSettings.timePerQuestion;
    const lastUpdate = lobby.gameState.lastUpdate;
    const timePassed = (now - new Date(lastUpdate).getTime()) / 1000;

    const eligible = timePassed > timeLimit || lobby.gameState.answerRevealed;
    if (!eligible) {
      return res.status(401).json({
        message: "Not allowed to advance lobby while question is ongoing"
      });
    }

    const gameState = lobby.gameState;
    const playerStates = gameState.playerStates;
    const player = req.user.username;
    const socketIO = getSocketIO();

    if (!playerStates[player]) {
      return res
        .status(400)
        .json({ message: "Player not found in game state" });
    }

    const updateOps = {};

    if (!lobby.gameState.countdownStarted) {
      const startTime = now;
      updateOps["gameState.countdownStarted"] = true;
      updateOps["gameState.countdownStartTime"] = startTime;

      socketIO.to(lobbyId).emit("startCountdown", {
        serverStartTime: startTime
      });
    }

    updateOps[`gameState.playerStates.${player}.ready`] = true;
    playerStates[player].ready = true;

    // Calculate if everyone is ready or 10 seconds have passed
    const countdownStartTime = lobby.gameState.countdownStartTime || now;
    const allReady =
      Object.values(playerStates).every((p) => p.ready === true) ||
      (now - new Date(countdownStartTime)) / 1000 >= 9;

    if (!allReady) {
      await Lobby.collection.updateOne({ lobbyId }, { $set: updateOps });

      socketIO.to(lobbyId).emit("updateState", {
        gameState: {
          ...lobby.gameState,
          countdownStarted: true,
          countdownStartTime,
          playerStates: {
            ...playerStates,
            [player]: {
              ...playerStates[player],
              ready: true
            }
          }
        },
        serverTimeNow: now
      });

      return res.status(200).json({
        message: "Marked as ready. Waiting for others."
      });
    }

    if (gameState.currentQuestion + 1 > lobby.gameSettings.numQuestions) {
      // Update player states when lobby ends
      const usernamesToUpdate = Object.keys(playerStates);
      const playerUpdates = await Profile.collection
        .find(
          { username: { $in: usernamesToUpdate } },
          {
            projection: {
              username: 1,
              matchHistory: 1,
              leaderboardStats: 1,
              currency: 1
            }
          }
        )
        .toArray();

      // Reset player states
      const resetPlayerStates = {};
      for (const username in playerStates) {
        resetPlayerStates[username] = {
          ...playerStates[username],
          score: 0,
          correctScore: 0,
          streakBonus: 0,
          selectedOption: 0,
          submitted: false,
          answerHistory: {},
          ready: false,
          powerups: {
            "Hint Boost": [],
            "Add Time": false,
            "Double Points": false
          }
        };
      }

      let teamScore = 0;
      let teamAnswerHistory = {};
      if (gameState.team) {
        teamScore = gameState.team.teamScore ?? 0;
        teamAnswerHistory = gameState.team.teamAnswerHistory ?? {};
      }

      const playerScoreSummary = {};
      usernamesToUpdate.forEach((username) => {
        const answerHistory = playerStates[username]?.answerHistory || {};
        const correct = Object.values(answerHistory).filter(
          (v) => v === "correct"
        ).length;
        const score = playerStates[username]?.score || 0;
        playerScoreSummary[username] = { correct, score };
      });

      const scores = Object.entries(playerScoreSummary)
        .map(([username, { score }]) => ({ username, score }))
        .sort((a, b) => b.score - a.score);

      let ranks = {};
      if (lobby.gameType.split("-")[0] === "versus") {
        let currentRank = 1;
        let prevScore = null;
        let prevRank = 1;
        let sameScoreCount = 0;
        let rankSuffix = (rank) =>
          rank === 1
            ? "1st"
            : rank === 2
              ? "2nd"
              : rank === 3
                ? "3rd"
                : `${rank}th`;

        scores.forEach((entry, idx) => {
          if (prevScore !== null && entry.score === prevScore) {
            sameScoreCount++;
          } else {
            currentRank = idx + 1;
            prevRank = currentRank;
            sameScoreCount = 1;
          }
          ranks[entry.username] = rankSuffix(prevRank);
          prevScore = entry.score;
          if (
            idx + 1 < scores.length &&
            scores[idx + 1].score !== entry.score
          ) {
            prevRank = currentRank + sameScoreCount;
          }
        });
      }

      const gameMode = lobby.gameType.split("-")[0];
      const gameFormat = lobby.gameType.split("-")[1];
      const numQuestions = lobby.gameSettings.numQuestions;
      const matchDate = now;
      const categoriesInMatch = gameState.questionCategories || [];
      const initStats = () => ({ correct: 0, total: 0 });
      const initOverallStats = () => ({
        correct: 0,
        total: 0,
        score: 0,
        totalMatches: 0,
        wonMatches: 0
      });

      const userSocketMap = getUserSocketMap();

      const bulkOps = playerUpdates.map((profile) => {
        const username = profile.username;
        const answerHistory = playerStates[username]?.answerHistory || {};
        let currency = profile.currency;

        const leaderboardStats =
          profile.leaderboardStats || initLeaderboardStats();
        const matchCategoryStats = {};
        const correctCount = Object.values(answerHistory).filter(
          (v) => v === "correct"
        ).length;
        const score = playerStates[username].score;
        let color = "solo";

        const formatStats = leaderboardStats[gameFormat];
        const modeStats = formatStats[gameMode];
        const overallStats = formatStats.overall;

        for (let i = 0; i < numQuestions; i++) {
          const category = categoriesInMatch[i];
          const result = answerHistory[i + 1];

          matchCategoryStats[category] =
            matchCategoryStats[category] || initStats();
          modeStats[category] = modeStats[category] || initStats();
          modeStats.overall = modeStats.overall || initOverallStats();
          overallStats.overall = overallStats.overall || initOverallStats();
          overallStats[category] = overallStats[category] || initStats();

          matchCategoryStats[category].total++;
          modeStats[category].total++;
          overallStats[category].total++;

          if (result === "correct") {
            matchCategoryStats[category].correct++;
            modeStats[category].correct++;
            overallStats[category].correct++;
          }

          if (category !== "Community") {
            modeStats.overall.total++;
            overallStats.overall.total++;
            if (result === "correct") {
              modeStats.overall.correct++;
              overallStats.overall.correct++;
            }
          }
        }

        if (!categoriesInMatch.includes("Community")) {
          modeStats.overall.score +=
            gameMode === "coop"
              ? Math.round(teamScore / usernamesToUpdate.length)
              : score;
          overallStats.overall.score +=
            gameMode === "coop"
              ? Math.round(teamScore / usernamesToUpdate.length)
              : score;

          if (gameMode === "versus") {
            modeStats.overall.totalMatches++;
            overallStats.overall.totalMatches++;
            color = "lose";

            if (
              parseInt(ranks[username].charAt(0)) <=
              usernamesToUpdate.length / 2
            ) {
              modeStats.overall.wonMatches++;
              overallStats.overall.wonMatches++;
              color = "win";
            }
          }
        } else {
          modeStats.Community.score ??= 0;
          modeStats.Community.totalMatches ??= 0;
          modeStats.Community.wonMatches ??= 0;
          overallStats.Community.score ??= 0;
          overallStats.Community.totalMatches ??= 0;
          overallStats.Community.wonMatches ??= 0;

          modeStats.Community.score +=
            gameMode === "coop"
              ? Math.round(teamScore / usernamesToUpdate.length)
              : score;
          overallStats.Community.score +=
            gameMode === "coop"
              ? Math.round(teamScore / usernamesToUpdate.length)
              : score;

          if (gameMode === "versus") {
            modeStats.Community.totalMatches++;
            overallStats.Community.totalMatches++;

            if (
              parseInt(ranks[username].charAt(0)) <=
              usernamesToUpdate.length / 2
            ) {
              modeStats.Community.wonMatches++;
              overallStats.Community.wonMatches++;
            }
          }
        }

        const matchEntry = {
          type: lobby.gameType,
          state: gameMode === "versus" ? ranks[username] : gameMode,
          totalPlayed: numQuestions,
          correctNumber: correctCount,
          date: matchDate,
          difficulty: lobby.gameSettings.difficulty,
          categoryStats: matchCategoryStats,
          answerHistory,
          playerScoreSummary,
          color,
          teamScore,
          teamAnswerHistory
        };

        const updatedMatchHistory = [...profile.matchHistory, matchEntry];
        while (updatedMatchHistory.length > 10) updatedMatchHistory.shift();

        currency +=
          gameMode === "coop"
            ? Math.floor(teamScore / usernamesToUpdate.length / 100)
            : Math.floor(score / 100);

        const targetSocketIds = userSocketMap.get(username);
        if (targetSocketIds && Array.isArray(targetSocketIds)) {
          targetSocketIds.forEach((socketId) => {
            socketIO.to(socketId).emit("updateCurrency", currency);
          });
        }

        return {
          updateOne: {
            filter: { username },
            update: {
              $set: {
                leaderboardStats,
                matchHistory: updatedMatchHistory,
                currency
              }
            }
          }
        };
      });

      if (bulkOps.length > 0) {
        await Profile.collection.bulkWrite(bulkOps);
      }

      // Return to lobby waiting state if set of questions finished
      const updatedGameState = {
        currentQuestion: 0,
        questionIds: [],
        question: null,
        questionCategories: [],
        playerStates: resetPlayerStates,
        answerRevealed: false,
        lastUpdate: now
      };

      await Lobby.collection.updateOne(
        { lobbyId },
        {
          $set: {
            gameState: updatedGameState,
            status: "waiting",
            lastActivity: now
          }
        }
      );

      // Update frontend display through socket
      socketIO.to(lobbyId).emit("updateStatus", { status: "waiting" });
      socketIO.to(lobbyId).emit("updateState", {
        gameState: updatedGameState,
        serverTimeNow: now
      });

      return res.status(200).json({ message: "Lobby finished." });
    } else {
      // Go to next question
      const question = lobby.gameType.includes("knowledge")
        ? await getKnowledgeQuestionById(
            gameState.questionIds[gameState.currentQuestion]
          )
        : await getQuestionById(
            gameState.questionIds[gameState.currentQuestion]
          );

      // Reset player states
      const resetPlayerStates = {};
      for (const username in playerStates) {
        resetPlayerStates[username] = {
          ...playerStates[username],
          correctScore: 0,
          streakBonus: 0,
          selectedOption: lobby.gameType.includes("knowledge") ? "" : 0,
          submitted: false,
          ready: false,
          powerups: {
            "Hint Boost": [],
            "Add Time": false,
            "Double Points": false
          }
        };
      }

      const updatedFields = {
        "gameState.currentQuestion": gameState.currentQuestion + 1,
        "gameState.question": question,
        "gameState.playerStates": resetPlayerStates,
        "gameState.answerRevealed": false,
        "gameState.lastUpdate": now,
        lastActivity: now,
        "gameState.countdownStarted": false,
        "gameState.countdownStartTime": null
      };

      if (lobby.gameType.includes("coop")) {
        updatedFields["gameState.team.teamCorrectScore"] = 0;
        updatedFields["gameState.team.teamStreakBonus"] = 0;
      }

      await Lobby.collection.updateOne({ lobbyId }, { $set: updatedFields });

      socketIO.to(lobbyId).emit("updateState", {
        gameState: {
          ...gameState,
          currentQuestion: updatedFields["gameState.currentQuestion"],
          question: { ...question, correctOption: null },
          playerStates: resetPlayerStates,
          answerRevealed: false,
          lastUpdate: now,
          countdownStarted: false,
          countdownStartTime: null
        },
        serverTimeNow: now
      });

      return res.status(200).json({ message: "Lobby advanced." });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error starting lobby." });
  }
});

const powerupMap = {
  "Hint Boost": "hintBoosts",
  "Add Time": "addTimes",
  "Double Points": "doublePoints"
};

router.post("/use-powerup/:lobbyId", authenticate, async (req, res) => {
  const { lobbyId } = req.params;
  const { powerupName } = req.body;
  const username = req.user.username;

  const lobby = await Lobby.findOne({ lobbyId });

  if (!lobby) {
    return res.status(404).json({ message: "Lobby not found." });
  }

  const player = lobby.gameState.playerStates[username];
  if (!player) {
    return res.status(400).json({ message: "Player not in game." });
  }

  // Disable unnecessary usage of powerup
  if (powerupName === "Double Points") {
    const lobbyType = lobby.gameType.split("-")[0];
    const doubleUsed = Object.values(lobby.gameState.playerStates)
      .map((value) => value.powerups["Double Points"])
      .includes(true);

    if (lobbyType === "coop" && doubleUsed) {
      return res
        .status(400)
        .json({ message: "One of your teammates already used this powerup." });
    }
  }

  // Round ended
  if (lobby.gameState.answerRevealed) {
    return res
      .status(400)
      .json({ message: "You cannot use powerups after the round has ended." });
  }

  // Powerup already used
  const alreadyUsed =
    lobby.gameState.playerStates[username].powerups?.[powerupName];
  if (
    (powerupName === "Hint Boost" && alreadyUsed?.length > 0) ||
    (powerupName !== "Hint Boost" && alreadyUsed)
  ) {
    return res
      .status(400)
      .json({ message: "Powerup already used this round." });
  }

  // Deduct powerup from Profile tracking
  const profile = await Profile.findOneAndUpdate(
    {
      username,
      [`powerups.${powerupMap[powerupName]}`]: { $gt: 0 }
    },
    {
      $inc: { [`powerups.${powerupMap[powerupName]}`]: -1 }
    },
    { new: true }
  );

  if (!profile) {
    return res.status(400).json({ message: "Not enough powerups." });
  }

  const timeNow = new Date();

  // Update lobby player state to track powerup usage and apply powerup
  const update = {
    $set: {
      lastActivity: timeNow
    },
    $push: {
      chatMessages: {
        sender: "System",
        message: `${username} used ${powerupName}.`,
        timestamp: timeNow
      }
    }
  };

  const path = `gameState.playerStates.${username}.powerups`;

  let revealed = [];

  if (powerupName === "Hint Boost") {
    const correctOption = lobby.gameState.question.correctOption;
    const all = [1, 2, 3, 4];
    const wrongOptions = all.filter((o) => o !== correctOption);
    revealed = wrongOptions.sort(() => 0.5 - Math.random()).slice(0, 2);
    update.$set[`${path}.Hint Boost`] = revealed;
  } else if (powerupName === "Add Time") {
    update.$set[`${path}.Add Time`] = true;
    update.$set[`gameState.lastUpdate`] = new Date(
      new Date(lobby.gameState.lastUpdate).getTime() + 5000
    );
  } else if (powerupName === "Double Points") {
    update.$set[`${path}.Double Points`] = true;
  }

  const updatedLobby = await Lobby.findOneAndUpdate({ lobbyId }, update, {
    new: true
  });

  const socketIO = getSocketIO();
  if (powerupName === "Add Time") {
    const { playerStates, ...restGameState } = updatedLobby.gameState;

    for (const state of Object.values(playerStates)) {
      delete state.powerups;
    }

    socketIO.to(lobbyId).emit("updateState", {
      gameState: {
        ...restGameState,
        playerStates
      },
      serverTimeNow: timeNow
    });
  }

  socketIO
    .to(lobbyId)
    .emit("updateChat", { chatMessages: updatedLobby.chatMessages });

  res.json({
    hintBoost: revealed,
    powerups: profile.powerups,
    message: `${powerupName} used successfully.`
  });
});

export default router;
