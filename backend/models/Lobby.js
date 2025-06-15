import mongoose from 'mongoose';

const lobbySchema = new mongoose.Schema({
  lobbyId: { type: String, required: true, unique: true },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Profile' }],
  gameType: { type: String, enum: ['solo-classic', 'solo-knowledge'], required: true },
  status: { type: String, enum: ['waiting', 'in-progress', 'finished'], default: 'waiting', required: true },
  /*
  gameData: { type: Object, default: {} },
  gameResult: { type: Object, default: {} },
  */
  gameSettings: { type: mongoose.Schema.Types.Mixed, default: {
    numQuestions: 10,
    timePerQuestion: 30,
    difficulty: 3, // 1-5 scale
    categories: [],
  }, required: true },
  chatMessages: [{
    sender: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
})

const Lobby = mongoose.model('Lobby', lobbySchema);

export default Lobby;