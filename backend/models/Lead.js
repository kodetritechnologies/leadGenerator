import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
  },
  status: {
    type: String,
    enum: ['new', 'qualified', 'contacted', 'proposal_sent', 'negotiation', 'won', 'lost', 'archive'],
    default: 'new',
    index: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  opportunityScore: {
    type: Number,
    default: 0,
    index: true,
  },
  isBookmarked: {
    type: Boolean,
    default: false,
    index: true,
  },
  tags: [
    {
      type: String,
      trim: true,
    }
  ],
  customFields: [
    {
      key: String,
      value: String,
    }
  ],
  notes: [
    {
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      content: String,
      createdAt: {
        type: Date,
        default: Date.now,
      }
    }
  ]
}, {
  timestamps: true
});

const Lead = mongoose.model('Lead', leadSchema);
export default Lead;
