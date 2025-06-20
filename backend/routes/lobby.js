import express from "express";
import * as crypto from "node:crypto";
import Lobby from "../models/Lobby.js";
import Profile from "../models/Profile.js";
import ClassicQuestion from "../models/ClassicQuestion.js";
import { getSocketIO } from "../socket.js";
import authenticate from "./authMiddleware.js";

const router = express.Router();

// Create a new Solo lobby
router.post("/solo/create", authenticate, async (req, res) => {
  try {
    const { gameType, player } = req.body;
    const id = crypto.randomUUID();
    const playerDoc = await Profile.collection.findOne({ username: player });

    if (!playerDoc) {
      return res.status(404).json({ message: "Player not found." });
    }

    const existingLobby = await Profile.aggregate([
      // Retrieve player information
      { $match: { username: player } },

      // Check if the lobby already exists and if the player is already in the lobby
      {
        $lookup: {
          from: "lobbies",
          pipeline: [
            {
              $facet: {
                lobbyExists: [{ $match: { lobbyId: id } }, { $limit: 1 }],
                playerExists: [
                  {
                    $match: {
                      $expr: {
                        $in: [playerDoc._id, "$players"]
                      }
                    }
                  },
                  { $limit: 1 }
                ]
              }
            }
          ],
          as: "lobbies"
        }
      },

      // Retrieve lobby if it exists
      { $unwind: "$lobbies" },

      {
        $project: {
          _id: 0,
          lobbyExists: {
            $cond: {
              if: { $gt: [{ $size: "$lobbies.lobbyExists" }, 0] },
              then: true,
              else: false
            }
          },
          playerExists: {
            $cond: {
              if: { $gt: [{ $size: "$lobbies.playerExists" }, 0] },
              then: true,
              else: false
            }
          }
        }
      }
    ]);

    if (existingLobby[0].lobbyExists) {
      return res.status(400).json({ message: "Lobby ID already exists." });
    } else if (existingLobby[0].playerExists) {
      return res.status(400).json({ message: "Player already in a lobby." });
    }

    const categories = await ClassicQuestion.distinct("category");

    if (categories.length === 0) {
      return res.status(400).json({ message: "No categories found." });
    }

    const defaultCategory = categories[0];

    const lobby = {
      lobbyId: id,
      status: "waiting",
      players: [playerDoc._id],
      gameType: `${gameType}`,
      gameSettings: {
        numQuestions: 10,
        timePerQuestion: 30,
        difficulty: 3, // 1-5 scale
        categories: [defaultCategory]
      },
      gameState: {
        currentQuestion: 0,
        question: null,
        lastUpdate: Date.now()
      },
      chatMessages: [
        {
          sender: "System",
          message: `${player} has created the lobby.`,
          timestamp: new Date()
        }
      ],
      lastActivity: new Date()
    };

    await Lobby.collection.insertOne(lobby);
    return res
      .status(201)
      .json({ lobbyId: id, message: "Lobby created successfully", categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating lobby" });
  }
});

// Connect a player to a Solo lobby (DIFFERENT FROM JOINING A LOBBY)
router.post("/solo/connect/:lobbyId", authenticate, async (req, res) => {
  try {
    const { lobbyId } = req.params;
    const { player } = req.body;
    const lobby = await Lobby.collection.findOne({ lobbyId });

    if (!lobby) {
      return res.status(404).json({ message: "Lobby not found." });
    }

    const players = await Profile.collection
      .find({ _id: { $in: lobby.players } })
      .toArray();
    if (!players.map((p) => p.username).includes(player)) {
      return res
        .status(403)
        .json({ message: "Player does not have access to this lobby." });
    }

    // Update chat messages
    const socketIO = getSocketIO();
    const newChatMessage = {
      sender: "System",
      message: `${player} has connected.`,
      timestamp: new Date()
    };

    const chatMessages = [...(lobby.chatMessages || []), newChatMessage];
    const updatedLobby = await Lobby.collection.findOneAndUpdate(
      { lobbyId },
      { $set: { chatMessages, lastActivity: new Date() } },
      { returnDocument: "after" }
    );
    if (!updatedLobby) {
      return res.status(404).json({ message: "Failed to update lobby" });
    }

    // Notify all players in the lobby
    socketIO
      .to(lobbyId)
      .emit("updateChat", { chatMessages: updatedLobby.chatMessages });

    return res.status(200).json({
      message: "Player connected successfully",
      lobbyDetails: updatedLobby
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving lobby" });
  }
});

// Disconnect a player from a Solo lobby (DIFFERENT FROM LEAVING A LOBBY)
router.post("/solo/disconnect/:lobbyId", authenticate, async (req, res) => {
  try {
    const { lobbyId } = req.params;
    const { player } = req.body;
    const lobby = await Lobby.collection.findOne({ lobbyId });

    if (!lobby) {
      return res.status(404).json({ message: "Lobby not found." });
    }

    await Lobby.collection.updateOne(
      { lobbyId },
      { $set: { lastActivity: new Date() } }
    );

    const playerDoc = await Profile.collection.findOne({ username: player });
    if (!playerDoc) {
      return res.status(404).json({ message: "Player not found." });
    }

    // Update chat messages
    const socketIO = getSocketIO();
    const newChatMessage = {
      sender: "System",
      message: `${player} has disconnected.`,
      timestamp: new Date()
    };
    const chatMessages = [...(lobby.chatMessages || []), newChatMessage];

    // Emit chat message
    const updatedLobby = await Lobby.collection.findOneAndUpdate(
      { lobbyId },
      { $set: { chatMessages } },
      { returnDocument: "after" }
    );
    if (!updatedLobby) {
      return res.status(404).json({ message: "Failed to update lobby" });
    }
    socketIO
      .to(lobbyId)
      .emit("updateChat", { chatMessages: updatedLobby.chatMessages });

    return res
      .status(200)
      .json({ message: "Player disconnected successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error disconnecting from lobby" });
  }
});

router.post("/solo/join/:lobbyId", authenticate, async (req, res) => {
  // TODO when multiplayer is implemented
  const { lobbyId } = req.params;
  await Lobby.collection.updateOne(
    { lobbyId },
    { $set: { lastActivity: new Date() } }
  );
});

router.post("/solo/leave/:lobbyId", authenticate, async (req, res) => {
  try {
    const { lobbyId } = req.params;
    const { player } = req.body;
    const playerDoc = await Profile.collection.findOne({ username: player });
    const lobby = await Lobby.collection.findOneAndUpdate(
      { lobbyId },
      { $pull: { players: playerDoc._id } },
      { returnDocument: "after" }
    );
    if (!lobby) {
      return res.status(401).json({ message: "Lobby not found." });
    }

    // Close lobby if empty
    if (lobby.players.length === 0) {
      await Lobby.collection.deleteOne(lobby);
    }

    await Lobby.collection.updateOne(
      { lobbyId },
      { $set: { lastActivity: new Date() } }
    );

    res.status(200).json({ message: "Successfully left lobby." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error leaving lobby" });
  }
});

router.post("/solo/chat/:lobbyId", authenticate, async (req, res) => {
  try {
    const { lobbyId } = req.params;
    const { player, message } = req.body;
    const lobby = await Lobby.collection.findOne({ lobbyId });
    if (!lobby) {
      return res.status(404).json({ message: "Lobby not found." });
    }
    const playerDoc = await Profile.collection.findOne({ username: player });
    if (!playerDoc) {
      return res.status(404).json({ message: "Player not found." });
    }

    const newChatMessage = {
      sender: player,
      message,
      timestamp: new Date()
    };
    const updatedLobby = await Lobby.collection.findOneAndUpdate(
      { lobbyId },
      {
        $push: { chatMessages: newChatMessage },
        $set: { lastActivity: new Date() }
      },
      { returnDocument: "after" }
    );
    if (!updatedLobby) {
      return res.status(404).json({ message: "Failed to update lobby" });
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

router.post("/solo/ready/:lobbyId", async (req, res) => {
  // TODO when multiplayer is implemented
});

router.get("/check", authenticate, async (req, res) => {
  try {
    const username = req.user.username;

    const playerDoc = await Profile.collection.findOne({ username });

    if (!playerDoc) {
      return res.status(404).json({ message: "Player not found." });
    }

    const lobby = await Lobby.collection.findOne({
      players: playerDoc._id
    });

    if (!lobby) {
      return res.status(200).json({ message: "Player not in any lobby." });
    }

    const categories = await ClassicQuestion.distinct("category");

    if (categories.length === 0) {
      return res.status(400).json({ message: "No categories found." });
    }

    // Player is in a lobby, return the lobbyId
    return res.status(200).json({ lobbyId: lobby.lobbyId, categories });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error checking lobby status." });
  }
});

router.post("/solo/updateSettings/:lobbyId", authenticate, async (req, res) => {
  try {
    const { lobbyId } = req.params;
    const { gameSettings } = req.body;
    const { username } = req.user;

    const { numQuestions, timePerQuestion, difficulty, categories } =
      gameSettings;

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

    const lobby = await Lobby.collection.findOne({ lobbyId });
    if (!lobby) {
      return res.status(404).json({ message: "Lobby not found." });
    }

    await Lobby.collection.updateOne(
      { lobbyId },
      {
        $set: {
          gameSettings: gameSettings,
          lastActivity: new Date()
        }
      }
    );

    const socketIO = getSocketIO();
    const newChatMessage = {
      sender: "System",
      message: `${username} has updated the game settings.`,
      timestamp: new Date()
    };

    const chatMessages = [...(lobby.chatMessages || []), newChatMessage];

    const updatedLobby = await Lobby.collection.findOneAndUpdate(
      { lobbyId },
      { $set: { chatMessages, lastActivity: new Date() } },
      { returnDocument: "after" }
    );

    socketIO
      .to(lobbyId)
      .emit("updateChat", { chatMessages: updatedLobby.chatMessages });

    socketIO.to(lobbyId).emit("updateSettings", { gameSettings });

    return res
      .status(200)
      .json({ message: "Game settings updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating game settings" });
  }
});

router.get("/startlobby/:lobbyId", async (req, res) => {
  try {
    const { lobbyId } = req.params;

    const lobby = await Lobby.collection.findOne({ lobbyId });

    if (!lobby) {
      return res.status(404).json({ message: "Lobby not found" });
      // } else if (lobby.status === "in-progress" || lobby.status === "finished") {
      // return res.status(401).json({ message: "Lobby has already started." });
    } else {
      // Configure game state
      const question = await ClassicQuestion.findOne({ category: "General" });
      const gameState = {
        currentQuestion: 1,
        question,
        lastUpdate: Date.now()
      };

      await Lobby.collection.updateOne(
        { lobbyId },
        { $set: { gameState, status: "in-progress" } }
      );

      // Notify players in the lobby
      const socketIO = getSocketIO();
      socketIO.to(lobbyId).emit("updateStatus", { status: "in-progress" });
      socketIO.to(lobbyId).emit("updateState", { gameState });

      return res.status(200).json({ message: "Lobby started." });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error starting lobby." });
  }
});

export default router;
