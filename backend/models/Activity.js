import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['status_change', 'note_added', 'email_sent', 'whatsapp_sent', 'proposal_generated', 'task_added', 'task_completed', 'comment_added', 'lead_assigned'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;
