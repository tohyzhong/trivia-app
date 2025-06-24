import mongoose from "mongoose";
import { logExecutionTime } from "mongoose-execution-time";
// mongoose.plugin(logExecutionTime, {
//   loggerLevel: 'info'
// });

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  previousPasswords: { type: Array, required: true, default: [] },
  verified: { type: Boolean, default: false },
  role: {
    type: String,
    enum: ["user", "admin"],
    required: true,
    default: "user"
  }
});

const User = mongoose.model("User", UserSchema);

export default User;
