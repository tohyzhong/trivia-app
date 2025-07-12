import mongoose from "mongoose";
import { logExecutionTime } from "mongoose-execution-time";
// mongoose.plugin(logExecutionTime, {
//   loggerLevel: 'info'
// });

const profileSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    currency: { type: Number, default: 0 },
    profilePicture: { type: String, default: "" },
    matchHistory: { type: Array, default: [] }, // { state: solo/win/lose (grey, green, red), totalPlayed: number, correctNumber: number, date: Date}'
    leaderboardStats: mongoose.Schema.Types.Mixed,
    reports: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

const Profile = mongoose.model("Profile", profileSchema);

export default Profile;
