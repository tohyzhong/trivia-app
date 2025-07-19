import mongoose from "mongoose";
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
    reports: { type: mongoose.Schema.Types.Mixed },
    powerups: {
      hintBoosts: { type: Number, default: 0 },
      addTimes: { type: Number, default: 0 },
      doublePoints: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

const Profile = mongoose.model("Profile", profileSchema);

export default Profile;
