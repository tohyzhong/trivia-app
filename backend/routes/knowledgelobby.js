import express from "express";
import { getSocketIO } from "../socket.js";
import * as crypto from "node:crypto";
import Lobby from "../models/Lobby.js";
import Profile from "../models/Profile.js";
import KnowledgeQuestion from "../models/KnowledgeQuestion.js";
import authenticate from "./authMiddleware.js";

// Use /api/knowledgelobby/*
const router = express.Router();

// Create a new lobby
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
    if (playerDoc.gameBan) {
      return res.status(400).json({ message: "Player is banned." });
    }

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
        community: false, // Either community questions or entire generated question bank
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
            selectedOption: "",
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
      currency: playerDoc.currency,
      powerups: playerDoc.powerups,
      status: lobby.status ?? ""
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating lobby" });
  }
});

// Settings updates for knowledge mode
router.post("/updateSettings/:lobbyId", authenticate, async (req, res) => {
  try {
    const { lobbyId } = req.params;
    const { gameSettings } = req.body;
    const { username } = req.user;

    const { numQuestions, timePerQuestion, difficulty, name } = gameSettings;

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

// Searching possible answer inputs
router.get("/search-inputs", authenticate, async (req, res) => {
  try {
    const query = req.query.query?.toLowerCase() || "";

    if (query === "") {
      return res.status(200).json([]);
    }

    const matchingAnswers = await KnowledgeQuestion.find(
      {
        answer: { $regex: query, $options: "i" }
      },
      { _id: 0, answer: 1 }
    )
      .select("answer")
      .lean()
      .limit(5);

    return res.status(200).json(matchingAnswers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching searches" });
  }
});

export default router;
