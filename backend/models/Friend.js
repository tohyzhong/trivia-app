import mongoose from 'mongoose';

const friendSchema = new mongoose.Schema({
  from: {type: String, required: true},
  to: {type: String, required: true}
})

const Friend = mongoose.model('Friend', friendSchema)

export default Friend;