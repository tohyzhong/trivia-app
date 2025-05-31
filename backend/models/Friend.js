import mongoose from 'mongoose';

const friendSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true }
})

friendSchema.index({ from: 1, to: 1 }, { unique: true });

const Friend = mongoose.model('Friend', friendSchema)

export default Friend;