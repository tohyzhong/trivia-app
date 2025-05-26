import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  previousPasswords: {type: Array, required: true, default: []},
  verified: { type: Boolean, default: false }
});

const User = mongoose.model('User', UserSchema);

export default User;