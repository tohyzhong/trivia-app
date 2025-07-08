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
                      players: username
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
          categories: "$categories.category"
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

    const defaultCategory = playerDoc.categories.includes("General")
      ? "General"
      : playerDoc.categories[0];

    const lobby = {
      lobbyId,
      status: "waiting",
      players: [username],
      gameType,
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
          [username]: {
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
      categories: playerDoc.categories
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating lobby" });
  }
});

router.get("/check", authenticate, async (req, res) => {
  try {
    const username = req.user.username;

    const [result] = await Lobby.collection
      .aggregate([
        {
          $facet: {
            lobby: [
              { $match: { players: username } },
              { $project: { lobbyId: 1 } }
            ],
            categories: [
              {
                $group: {
                  _id: "$gameSettings.categories" // placeholder value for categories
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
              { $unwind: "$categories" },
              { $replaceRoot: { newRoot: "$categories" } }
            ]
          }
        }
      ])
      .toArray();

    const lobby = result.lobby[0];
    const categories = result.categories.map((c) => c.category);

    if (!lobby) {
      return res.status(200).json({ message: "Player not in any lobby." });
    }
    if (categories.length === 0) {
      return res.status(400).json({ message: "No categories found." });
    }

    return res.status(200).json({
      lobbyId: lobby.lobbyId,
      categories
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error checking lobby status." });
  }
});

// Connect a player to a Solo lobby (DIFFERENT FROM JOINING A LOBBY)
router.post("/solo/connect/:lobbyId", authenticate, async (req, res) => {
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
        players: username
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
      players: updatedLobby.players
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
router.post("/solo/disconnect/:lobbyId", authenticate, async (req, res) => {
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
        { lobbyId, players: username },
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
      socketIO.to(lobbyId).emit("updateUsers", {
        players: updatedLobby.players
      });

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
    const { username } = req.user;

    if (username === player) {
      const newChatMessage = {
        sender: "System",
        message: `${player} has left.`,
        timestamp: new Date()
      };

      const updatedLobby = await Lobby.findOneAndUpdate(
        { lobbyId, players: username },
        {
          $push: { chatMessages: newChatMessage },
          $pull: { players: username },
          $unset: { [`gameState.playerStates.${username}`]: "" },
          $set: { lastActivity: new Date() }
        },
        { new: true }
      );

      if (!updatedLobby) {
        return res
          .status(404)
          .json({ message: "Lobby not found or player not in lobby." });
      }

      const socketIO = getSocketIO();
      socketIO
        .to(lobbyId)
        .emit("updateChat", { chatMessages: updatedLobby.chatMessages });
      socketIO.to(lobbyId).emit("updateUsers", {
        players: updatedLobby.players
      });
      getSocketIO()
        .to(lobbyId)
        .emit("updateState", { gameState: updatedLobby.gameState });

      // Delete lobby if it's empty
      if (updatedLobby.players.length === 0) {
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

router.post("/solo/chat/:lobbyId", authenticate, async (req, res) => {
  try {
    const { lobbyId } = req.params;
    const { message } = req.body;
    const username = req.user.username;

    const newChatMessage = {
      sender: username,
      message,
      timestamp: new Date()
    };

    const updatedLobby = await Lobby.collection.findOneAndUpdate(
      { lobbyId, players: username },
      {
        $push: { chatMessages: newChatMessage },
        $set: { lastActivity: new Date() }
      },
      { returnDocument: "after" }
    );
    if (!updatedLobby) {
      return res
        .status(404)
        .json({ message: "Lobby not found or user unauthorised" });
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

router.post("/solo/ready/:lobbyId", authenticate, async (req, res) => {
  // TODO when multiplayer is implemented
  const { lobbyId } = req.params;
  await Lobby.collection.updateOne(
    { lobbyId },
    { $set: { lastActivity: new Date() } }
  );
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
      { lobbyId, players: username },
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

    const lobby = await Lobby.collection.findOne({ lobbyId });

    if (!lobby) {
      return res.status(404).json({ message: "Lobby not found" });
    } else if (lobby.status === "in-progress" || lobby.status === "finished") {
      return res.status(401).json({ message: "Lobby has already started." });
    } else {
      // Configure game state
      const { questionIds, questionCategories, question } =
        await generateUniqueQuestionIds(
          lobby.gameSettings.numQuestions,
          lobby.gameSettings.categories,
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
    const timeNow = new Date();

    const lobby = await Lobby.collection.findOne({ lobbyId });
    if (!lobby) {
      return res.status(404).json({ message: "Lobby not found" });
    }
    if (!lobby.players.includes(user)) {
      return res.status(403).json({ message: "Player not in lobby" });
    }

    const playerState = {
      selectedOption: option,
      submitted: true,
      answerHistory: lobby.gameState.playerStates[user]?.answerHistory || {},
      score: lobby.gameState.playerStates[user]?.score || 0,
      timeSubmitted: timeNow
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
      const currentQuestion = lobby.gameState.currentQuestion;
      const timeLimit = lobby.gameSettings.timePerQuestion;
      const question = lobby.gameState.question;

      for (const username of lobby.players) {
        const state = updatedPlayerStates[username];
        const selected = state.selectedOption;
        const isCorrect = selected === question.correctOption;

        state.answerHistory = state.answerHistory || {};
        state.correctScore = 0;
        state.streakBonus = 0;

        if (selected) {
          if (isCorrect) {
            const timeElapsed =
              (state.timeSubmitted - lobby.gameState.lastUpdate) / 1000;

            if (timeElapsed <= 3.0) {
              state.correctScore = 100;
            } else {
              const timeAfter30 = timeElapsed - 3.0;
              const remainingTime = timeLimit - 3.0;
              const k = 0.8;
              let score = 100 * Math.exp(-k * (timeAfter30 / remainingTime));
              state.correctScore = Math.max(40, Math.round(score));
            }

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

        // Max bonus is 50 for 5 correct in a row
        if (state.answerHistory[currentQuestion] === "correct") {
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

      getSocketIO()
        .to(lobbyId)
        .emit("updateState", { gameState: updatedLobby.gameState });

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

    const lobby = await Lobby.collection.findOne({ lobbyId });
    if (!lobby) {
      return res.status(404).json({ message: "Lobby not found" });
    }
    if (lobby.gameState.answerRevealed) {
      return res.status(404).json({ message: "Answer already revealed." });
    }
    if (!lobby.players.includes(username)) {
      return res.status(403).json({ message: "Player not in lobby" });
    }

    const timeNow = new Date();
    const timeLimit = lobby.gameSettings.timePerQuestion;
    const lastUpdate = new Date(lobby.gameState.lastUpdate);
    const secondsElapsed = (timeNow - lastUpdate) / 1000;

    if (secondsElapsed < timeLimit - 1) {
      return res.status(403).json({ message: "Too early to reveal answer." });
    }

    const currentQuestion = lobby.gameState.currentQuestion;
    const updatedPlayerStates = { ...lobby.gameState.playerStates };

    for (const player of lobby.players) {
      const state = updatedPlayerStates[player] ?? {};

      if (!state.submitted) {
        state.selectedOption = 0;
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

        state.answerHistory = state.answerHistory || {};
        state.correctScore = 0;
        state.streakBonus = 0;

        if (isCorrect) {
          const timeElapsed =
            (state.timeSubmitted - lobby.gameState.lastUpdate) / 1000;

          if (timeElapsed <= 3.0) {
            state.correctScore = 100;
          } else {
            const timeAfter30 = timeElapsed - 3.0;
            const remainingTime = timeLimit - 3.0;
            const k = 0.8;
            let score = 100 * Math.exp(-k * (timeAfter30 / remainingTime));
            state.correctScore = Math.max(40, Math.round(score));
          }

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
        if (state.answerHistory[currentQuestion] === "correct") {
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
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error revealing answer." });
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

    const gameState = lobby.gameState;
    const playerStates = gameState.playerStates;

    const socketIO = getSocketIO();

    if (gameState.currentQuestion + 1 > lobby.gameSettings.numQuestions) {
      // Update player states when lobby ends
      const usernamesToUpdate = Object.keys(playerStates);
      const playerUpdates = await Profile.collection
        .find({ username: { $in: usernamesToUpdate } })
        .toArray();

      // Reset player states
      const resetPlayerStates = {};
      for (const username in playerStates) {
        resetPlayerStates[username] = {
          ...playerStates[username],
          selectedOption: 0,
          submitted: false,
          streakBonus: 0,
          correctScore: 0,
          answerHistory: {}
        };
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

      const bulkOps = playerUpdates.map((profile) => {
        const username = profile.username;
        const answerHistory = playerStates[username]?.answerHistory || {};
        const leaderboardStats = profile.leaderboardStats || {};
        const matchCategoryStats = {};
        const correctCount = Object.values(answerHistory).filter(
          (v) => v === "correct"
        ).length;
        const score = playerStates[username].score;
        let color = "solo";

        const gameMode = lobby.gameType.split("-")[0]; // solo/versus/coop
        const gameFormat = lobby.gameType.split("-")[1]; // classic/knowledge
        const numQuestions = lobby.gameSettings.numQuestions;
        const matchDate = new Date();
        const categoriesInMatch = gameState.questionCategories || [];

        if (!leaderboardStats[gameFormat]) leaderboardStats[gameFormat] = {};
        if (!leaderboardStats[gameFormat].overall)
          leaderboardStats[gameFormat].overall = {};
        if (!leaderboardStats[gameFormat][gameMode]) {
          leaderboardStats[gameFormat][gameMode] = {};
        }

        const formatStats = leaderboardStats[gameFormat];
        const modeStats = formatStats[gameMode];
        const overallStats = formatStats.overall;

        for (let i = 0; i < numQuestions; i++) {
          const category = categoriesInMatch[i];
          const result = answerHistory[i + 1];

          matchCategoryStats[category] ??= { correct: 0, total: 0 };
          modeStats[category] ??= { correct: 0, total: 0 };
          modeStats.overall ??= {
            correct: 0,
            total: 0,
            score: 0,
            totalMatches: 0,
            wonMatches: 0
          };
          overallStats.overall ??= {
            correct: 0,
            total: 0,
            score: 0,
            totalMatches: 0,
            wonMatches: 0
          };
          overallStats[category] ??= { correct: 0, total: 0 };

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
              ? Math.round(score / usernamesToUpdate.length)
              : score;
          overallStats.overall.score +=
            gameMode === "coop"
              ? Math.round(score / usernamesToUpdate.length)
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
              ? Math.round(score / usernamesToUpdate.length)
              : score;
          overallStats.Community.score +=
            gameMode === "coop"
              ? Math.round(score / usernamesToUpdate.length)
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
          color
        };

        const updatedMatchHistory = [...profile.matchHistory, matchEntry];
        while (updatedMatchHistory.length > 10) updatedMatchHistory.shift();

        return {
          updateOne: {
            filter: { username },
            update: {
              $set: {
                leaderboardStats,
                matchHistory: updatedMatchHistory
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

      // Reset player states
      const resetPlayerStates = {};
      for (const username in playerStates) {
        resetPlayerStates[username] = {
          ...playerStates[username],
          selectedOption: 0,
          submitted: false,
          streakBonus: 0,
          correctScore: 0
        };
      }
      const updatedGameState = {
        ...gameState,
        currentQuestion: gameState.currentQuestion + 1,
        questionIds: gameState.questionIds,
        question,
        playerStates: resetPlayerStates,
        answerRevealed: false,
        lastUpdate: new Date()
      };

      await Lobby.collection.updateOne(
        { lobbyId },
        { $set: { gameState: updatedGameState, lastActivity: new Date() } }
      );

      // Update frontend display through socket
      updatedGameState.question.correctOption = null;
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
