import mongoose from 'mongoose';

const UsedTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  usedAt: { type: Date, required: true, default: Date.now() }
})

const UsedToken = mongoose.model('UsedToken', UsedTokenSchema);

export default UsedToken;