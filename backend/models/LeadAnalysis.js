import mongoose from 'mongoose';

const leadAnalysisSchema = new mongoose.Schema({
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true,
    unique: true,
  },
  websiteExists: {
    type: Boolean,
    default: false,
  },
  mobileResponsive: {
    type: Boolean,
    default: false,
  },
  loadingSpeed: {
    type: String, // e.g., '1.2s', '4.5s'
    default: 'N/A',
  },
  sslCertificate: {
    type: Boolean,
    default: false,
  },
  seoScore: {
    type: Number,
    default: 0,
  },
  accessibilityScore: {
    type: Number,
    default: 0,
  },
  performanceScore: {
    type: Number,
    default: 0,
  },
  brokenLinksCount: {
    type: Number,
    default: 0,
  },
  uiDesignQuality: {
    type: String, // e.g., 'Poor', 'Average', 'Modern'
    default: 'Average',
  },
  contactFormExists: {
    type: Boolean,
    default: false,
  },
  bookingSystemExists: {
    type: Boolean,
    default: false,
  },
  socialLinksExists: {
    type: Boolean,
    default: false,
  },
  googleMapsLinked: {
    type: Boolean,
    default: false,
  },
  technologyUsed: [
    {
      type: String,
    }
  ],
  websiteAge: {
    type: String,
    default: 'Unknown',
  },
  opportunityScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0,
  },
  reasons: [
    {
      type: String,
    }
  ],
  screenshotUrl: {
    type: String,
    default: '',
  },
  suggestions: {
    type: String, // Rich suggestions from Gemini AI
  },
  analyzedAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true
});

const LeadAnalysis = mongoose.model('LeadAnalysis', leadAnalysisSchema);
export default LeadAnalysis;
