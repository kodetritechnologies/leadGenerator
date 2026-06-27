import mongoose from 'mongoose';

const proposalSchema = new mongoose.Schema({
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true,
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    default: 'Website Development Proposal',
  },
  introduction: String,
  projectScope: String,
  timeline: String,
  features: [
    {
      name: String,
      description: String,
    }
  ],
  techStack: [String],
  pricing: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD',
    },
    paymentTerms: String,
  },
  pdfUrl: String,
  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'accepted', 'rejected'],
    default: 'draft',
  },
}, {
  timestamps: true
});

const Proposal = mongoose.model('Proposal', proposalSchema);
export default Proposal;
