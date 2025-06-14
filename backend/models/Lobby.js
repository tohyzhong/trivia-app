import mongoose from 'mongoose';

const lobbySchema = new mongoose.Schema({
  lobbyId: { type: String, required: true, unique: true },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Profile' }],
  gameType: { type: String, enum: ['solo-classic', 'solo-knowledge'], required: true },
  status: { type: String, enum: ['waiting', 'in-progress', 'finished'], default: 'waiting' },
  gameData: { type: Object, default: {} },
  gameSettings: { type: Object, default: {} },
  gameResult: { type: Object, default: {} },
  chatMessages: [{ // For multiplayer modes only
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
})

const Lobby = mongoose.model('Lobby', lobbySchema);

export default Lobby;