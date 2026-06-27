import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  plan: {
    type: String,
    enum: ['free', 'starter', 'professional', 'enterprise'],
    default: 'free',
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'canceled', 'past_due'],
    default: 'inactive',
  },
  amount: {
    type: Number,
    default: 0,
  },
  stripeSubscriptionId: String,
  razorpaySubscriptionId: String,
  currentPeriodStart: {
    type: Date,
    default: Date.now,
  },
  currentPeriodEnd: Date,
}, {
  timestamps: true
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);
export default Subscription;
