const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: false
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: [500, 'Certificate description cannot be more than 500 characters']
  },
  skills: [{
    type: String,
    trim: true
  }],
  certificateNumber: {
    type: String,
    unique: true,
    required: true
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  pdfUrl: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    taskTitle: {
      type: String,
      required: true
    },
    taskCategory: {
      type: String,
      required: true
    },
    completionDate: {
      type: Date,
      required: true
    },
    hoursWorked: {
      type: Number,
      min: 0
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    }
  }
}, {
  timestamps: true
});

// Generate certificate number
certificateSchema.pre('save', async function(next) {
  if (!this.certificateNumber) {
    const count = await this.constructor.countDocuments();
    this.certificateNumber = `HUB-${Date.now()}-${count + 1}`;
  }
  next();
});

// Index for efficient querying
certificateSchema.index({ student: 1, issuedAt: -1 });
certificateSchema.index({ startup: 1, issuedAt: -1 });
certificateSchema.index({ certificateNumber: 1 });

module.exports = mongoose.model('Certificate', certificateSchema); 