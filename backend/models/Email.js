import mongoose from 'mongoose';

const emailSchema = new mongoose.Schema({
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipientEmail: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  html: {
    type: String,
  },
  type: {
    type: String,
    enum: ['cold_email', 'follow_up', 'proposal_email', 'reminder', 'thank_you'],
    default: 'cold_email',
  },
  status: {
    type: String,
    enum: ['draft', 'sending', 'sent', 'failed', 'opened', 'replied'],
    default: 'draft',
  },
  sentAt: Date,
  openedAt: Date,
  repliedAt: Date,
}, {
  timestamps: true
});

const Email = mongoose.model('Email', emailSchema);
export default Email;
