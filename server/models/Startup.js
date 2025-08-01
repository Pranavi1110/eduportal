const mongoose = require('mongoose');
const User = require('./User');

const startupSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Please provide company name'],
    trim: true,
    maxlength: [100, 'Company name cannot be more than 100 characters']
  },
  companyDescription: {
    type: String,
    maxlength: [1000, 'Company description cannot be more than 1000 characters']
  },
  industry: {
    type: String,
    required: [true, 'Please provide industry'],
    trim: true
  },
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
    default: '1-10'
  },
  tier: {
    type: String,
    enum: ['early-stage', 'mid-range', 'premium'],
    default: 'early-stage'
  },
  businessLicense: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  location: {
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    }
  },
  foundedYear: {
    type: Number,
    min: 1900,
    max: new Date().getFullYear()
  },
  funding: {
    type: String,
    enum: ['bootstrapped', 'seed', 'series-a', 'series-b', 'series-c', 'public'],
    default: 'bootstrapped'
  },
  technologies: [{
    type: String,
    trim: true
  }],
  socialMedia: {
    linkedin: {
      type: String,
      trim: true
    },
    twitter: {
      type: String,
      trim: true
    },
    facebook: {
      type: String,
      trim: true
    }
  },
  totalTasksPosted: {
    type: Number,
    default: 0
  },
  totalTasksCompleted: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDocuments: [{
    type: {
      type: String,
      enum: ['business-license', 'tax-document', 'other'],
      required: true
    },
    documentUrl: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    isApproved: {
      type: Boolean,
      default: false
    }
  }]
});

module.exports = User.discriminator('Startup', startupSchema); 