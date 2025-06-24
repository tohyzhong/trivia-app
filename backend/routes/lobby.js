import express from "express";
import * as crypto from "node:crypto";
import Lobby from "../models/Lobby.js";
import Profile from "../models/Profile.js";
import ClassicQuestion from "../models/ClassicQuestion.js";
import { getSocketIO } from "../socket.js";
import authenticate from "./authMiddleware.js";
import {
  generateUniqueQuestionIds,
  getQuestionById
} from "../utils/generateclassicquestions.js";

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
        playerStates: {
          [playerDoc._id]: {
            username: playerDoc.username,
            selectedOption: 0,
            submitted: false
          }
        },
        answerRevealed: false,
        lastUpdate: new Date()
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
      lobbyDetails: updatedLobby,
      serverTimeNow: new Date()
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

router.get("/startlobby/:lobbyId", authenticate, async (req, res) => {
  try {
    const { lobbyId } = req.params;

    const lobby = await Lobby.collection.findOne({ lobbyId });

    if (!lobby) {
      return res.status(404).json({ message: "Lobby not found" });
    } else if (lobby.status === "in-progress" || lobby.status === "finished") {
      return res.status(401).json({ message: "Lobby has already started." });
    } else {
      // Configure game state
      const { questionIds, question } = await generateUniqueQuestionIds(
        lobby.gameSettings.numQuestions,
        lobby.gameSettings.categories,
        lobby.gameSettings.difficulty
      );

      const update = {
        currentQuestion: 1,
        questionIds,
        question,
        lastUpdate: new Date(),
        playerStates: {}
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
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error starting lobby." });
  }
});

router.post("/submit/:lobbyId", authenticate, async (req, res) => {
  try {
    const { lobbyId } = req.params;
    const { user, option } = req.body;

    const lobby = await Lobby.collection.findOne({ lobbyId });
    if (!lobby) {
      return res.status(404).json({ message: "Lobby not found" });
    }

    const playerDoc = await Profile.collection.findOne({ username: user });
    if (!playerDoc) {
      return res.status(404).json({ message: "Player not found." });
    }

    const playerState = {
      username: user,
      selectedOption: option,
      submitted: true,
      answerHistory:
        lobby.gameState.playerStates[playerDoc._id]?.answerHistory || {}
    };
    const currentQuestion = lobby.gameState.currentQuestion;

    const isCorrect = option === lobby.gameState.question.correctOption;

    playerState.answerHistory[currentQuestion] = isCorrect
      ? "correct"
      : "wrong";

    for (let i = 0; i < 5; i++) {
      const questionNumberToCheck = currentQuestion - i;

      if (
        questionNumberToCheck > 0 &&
        !playerState.answerHistory[questionNumberToCheck]
      ) {
        playerState.answerHistory[questionNumberToCheck] = "missing";
      }
    }

    const sortedAnswerHistory = Object.keys(playerState.answerHistory).sort(
      (a, b) => parseInt(a) - parseInt(b)
    );

    /*
    while (Object.keys(playerState.answerHistory).length > 5) {
      const oldestQuestionNumber = sortedAnswerHistory[0];
      sortedAnswerHistory.shift();
      delete playerState.answerHistory[oldestQuestionNumber];
    }
    */

    const updatedPlayerStates = {
      ...lobby.gameState.playerStates,
      [playerDoc._id]: playerState
    };

    let allSubmitted = true;
    for (const stateKey in updatedPlayerStates) {
      if (!updatedPlayerStates[stateKey].submitted) {
        allSubmitted = false;
        break;
      }
    }

    const updatedLobby = await Lobby.collection.findOneAndUpdate(
      { lobbyId },
      {
        $set: {
          "gameState.playerStates": updatedPlayerStates,
          "gameState.answerRevealed": allSubmitted,
          lastActivity: new Date()
        }
      },
      { returnDocument: "after" }
    );

    // Update frontend display through socket
    updatedLobby.gameState.question.correctOption = allSubmitted
      ? updatedLobby.gameState.question.correctOption
      : null;
    const socketIO = getSocketIO();
    socketIO
      .to(lobbyId)
      .emit("updateState", { gameState: updatedLobby.gameState });

    return res
      .status(200)
      .json({ message: "Successfully submitted option selection" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error starting lobby." });
  }
});

router.get("/revealanswer/:lobbyId", authenticate, async (req, res) => {
  try {
    const { lobbyId } = req.params;
    const { username } = req.user;

    const lobby = await Lobby.collection.findOne({ lobbyId });
    if (!lobby) {
      return res.status(404).json({ message: "Lobby not found" });
    }

    const playerDoc = await Profile.collection.findOne({ username });
    if (!playerDoc) {
      return res.status(404).json({ message: "Player not found." });
    }

    const playerState = {
      username: username,
      selectedOption: 0,
      submitted: false,
      answerHistory:
        lobby.gameState.playerStates[playerDoc._id]?.answerHistory || {}
    };
    const currentQuestion = lobby.gameState.currentQuestion;

    playerState.answerHistory[currentQuestion] = "missing";

    for (let i = 0; i < 5; i++) {
      const questionNumberToCheck = currentQuestion - i;

      if (
        questionNumberToCheck > 0 &&
        !playerState.answerHistory[questionNumberToCheck]
      ) {
        playerState.answerHistory[questionNumberToCheck] = "missing";
      }
    }

    const sortedAnswerHistory = Object.keys(playerState.answerHistory).sort(
      (a, b) => parseInt(a) - parseInt(b)
    );

    /*
    while (Object.keys(playerState.answerHistory).length > 5) {
      const oldestQuestionNumber = sortedAnswerHistory[0];
      sortedAnswerHistory.shift();
      delete playerState.answerHistory[oldestQuestionNumber];
    }
    */

    const updatedPlayerStates = {
      ...lobby.gameState.playerStates,
      [playerDoc._id]: playerState
    };

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

    // Update frontend display through socket
    const socketIO = getSocketIO();
    socketIO
      .to(lobbyId)
      .emit("updateState", { gameState: updatedLobby.gameState });

    return res.status(200).json({ message: "Answer revealed." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error starting lobby." });
  }
});

router.get("/advancelobby/:lobbyId", authenticate, async (req, res) => {
  try {
    const { lobbyId } = req.params;

    const lobby = await Lobby.collection.findOne({ lobbyId });
    if (!lobby) {
      return res.status(404).json({ message: "Lobby not found" });
    }

    // Confirm eligibility for advancing lobby
    const timeLimit = lobby.gameSettings.timePerQuestion;
    const lastUpdate = lobby.gameState.lastUpdate;
    const timePassed = (Date.now() - lastUpdate.getTime()) / 1000;

    const eligible = timePassed > timeLimit || lobby.gameState.answerRevealed;
    if (!eligible) {
      return res.status(401).json({
        message: "Not allowed to advanced lobby while question is ongoing"
      });
    }

    // Advance lobby
    const gameState = lobby.gameState;
    const playerStates = gameState.playerStates;

    // Reset player states
    const updatedPlayerStates = {};
    for (const stateKey in playerStates) {
      updatedPlayerStates[stateKey] = {
        ...playerStates[stateKey],
        selectedOption: 0,
        submitted: false
      };
    }

    if (gameState.currentQuestion + 1 > lobby.gameSettings.numQuestions) {
      // TODO: Update player stats
      for (const stateKey in playerStates) {
        const correctAnswers = Object.values(
          playerStates[stateKey].answerHistory
        ).filter((v) => v == "correct").length;

        // Get profile and update
        const profile = await Profile.collection.findOne({
          username: playerStates[stateKey].username
        });

        const newCorrectAnswer = profile.correctAnswer + correctAnswers;
        const newTotalAnswer =
          profile.totalAnswer + lobby.gameSettings.numQuestions;
        const updatedData = {
          correctAnswer: newCorrectAnswer,
          totalAnswer: newTotalAnswer,
          correctRate:
            Math.round((newCorrectAnswer / newTotalAnswer) * 10000) / 100 // Change to percantage in 2 decimal places
        };

        console.log(updatedData);

        await Profile.collection.updateOne(
          { username: playerStates[stateKey].username },
          { $set: updatedData }
        );
      }

      // Return to lobby waiting state if set of questions finished
      const updatedGameState = {
        currentQuestion: 0,
        questionIds: [],
        question: null,
        playerStates: updatedPlayerStates,
        answerRevealed: false,
        lastUpdate: new Date()
      };

      await Lobby.collection.updateOne(
        { lobbyId },
        {
          $set: {
            gameState: updatedGameState,
            status: "waiting",
            lastActivity: new Date()
          }
        }
      );

      // Update frontend display through socket
      const socketIO = getSocketIO();
      socketIO.to(lobbyId).emit("updateStatus", { status: "waiting" });
      socketIO.to(lobbyId).emit("updateState", {
        gameState: updatedGameState,
        serverTimeNow: new Date()
      });

      return res.status(200).json({ message: "Lobby finished." });
    } else {
      // Go to next question
      const question = await getQuestionById(
        gameState.questionIds[gameState.currentQuestion]
      );
      const updatedGameState = {
        currentQuestion: gameState.currentQuestion + 1,
        questionIds: gameState.questionIds,
        question,
        playerStates: updatedPlayerStates,
        answerRevealed: false,
        lastUpdate: new Date()
      };

      await Lobby.collection.updateOne(
        { lobbyId },
        { $set: { gameState: updatedGameState, lastActivity: new Date() } }
      );

      // Update frontend display through socket
      updatedGameState.question.correctOption = null;
      const socketIO = getSocketIO();
      socketIO.to(lobbyId).emit("updateState", {
        gameState: updatedGameState,
        serverTimeNow: new Date()
      });

      return res.status(200).json({ message: "Lobby advanced." });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error starting lobby." });
  }
});

export default router;
