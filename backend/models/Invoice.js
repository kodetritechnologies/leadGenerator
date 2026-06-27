import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  status: {
    type: String,
    enum: ['paid', 'pending', 'failed'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'razorpay', 'none'],
    default: 'none',
  },
  pdfUrl: String,
  paidAt: Date,
}, {
  timestamps: true
});

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
