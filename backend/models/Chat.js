import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    default: 'New AI Chat Session',
  },
}, {
  timestamps: true
});

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
