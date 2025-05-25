import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    winRate: { type: Number, default: 0 },
    correctRate: { type: Number, default: 0 },
    correctNumber: { type: Number, default: 0 },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Profile' }],
    currency: { type: Number, default: 0 },
    profilePicture: { type: String, default: '' },
  },
  { timestamps: true }
);

const Profile = mongoose.model('Profile', profileSchema);

export default Profile;
