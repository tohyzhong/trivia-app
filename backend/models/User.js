import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  verified: { type: Boolean, default: false }
});

UserSchema.index({ username: 1 });

const User = mongoose.model('User', UserSchema);

export default User;