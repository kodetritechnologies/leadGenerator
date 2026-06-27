import mongoose from 'mongoose';

const businessSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  website: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  city: {
    type: String,
    required: true,
    index: true,
  },
  state: {
    type: String,
    index: true,
  },
  country: {
    type: String,
    default: 'India',
    index: true,
  },
  industry: {
    type: String,
    required: true,
    index: true,
  },
  rating: {
    type: Number,
    default: 0,
  },
  userRatingsTotal: {
    type: Number,
    default: 0,
  },
  googlePlaceId: {
    type: String,
    unique: true,
    sparse: true,
  },
  socialLinks: {
    facebook: String,
    instagram: String,
    twitter: String,
    linkedin: String,
  },
  googleMapsUrl: String,
  businessSize: {
    type: String,
    enum: ['small', 'medium', 'large'],
    default: 'small',
  }
}, {
  timestamps: true
});

// Index for multi-field search performance
businessSchema.index({ name: 'text', industry: 'text', city: 'text' });

const Business = mongoose.model('Business', businessSchema);
export default Business;
