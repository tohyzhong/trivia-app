import mongoose from "mongoose";

const lobbySchema = new mongoose.Schema(
  {
    lobbyId: { type: String, required: true, unique: true },
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: "Profile" }],
    gameType: {
      type: String,
      enum: ["solo-classic", "solo-knowledge"],
      required: true
    },
    status: {
      type: String,
      enum: ["waiting", "in-progress", "finished"],
      default: "waiting",
      required: true
    },
    gameSettings: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        numQuestions: 10,
        timePerQuestion: 30,
        difficulty: 3, // 1-5 scale
        categories: []
      },
      required: true
    },
    gameState: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        currentQuestion: 0, // Waiting state
        questionIds: [], // Array of question ObjectIds
        question: null, // Question collection ObjectId
        playerStates: {}, // { playerId: { username: string, selectedOption: number, submitted: boolean, answerHistory: {[questionId]: "correct" | "wrong" | "missed"} } }
        answerRevealed: false,
        lastUpdate: Date.now()
      },
      required: true
    },
    chatMessages: [
      {
        sender: { type: String, required: true },
        message: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
      }
    ],
    lastActivity: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
);

const Lobby = mongoose.model("Lobby", lobbySchema);

export default Lobby;
