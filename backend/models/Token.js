import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
  purpose: { type: String, required: true }, // 'emailVerification' or 'passwordReset'
  email: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
})

const Token = mongoose.model('Token', tokenSchema);

export default Token;