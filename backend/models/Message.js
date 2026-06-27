import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
    index: true,
  },
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  suggestedLeads: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const Message = mongoose.model('Message', messageSchema);
export default Message;
