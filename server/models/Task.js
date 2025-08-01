const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide task title'],
    trim: true,
    maxlength: [100, 'Task title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide task description'],
    maxlength: [1000, 'Task description cannot be more than 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Please provide task category'],
    enum: ['development', 'design', 'marketing', 'research', 'writing', 'data-analysis', 'other']
  },
  skills: [{
    type: String,
    required: true,
    trim: true
  }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    required: true
  },
  estimatedHours: {
    type: Number,
    required: true,
    min: 1,
    max: 200
  },
  budget: {
    min: {
      type: Number,
      required: true,
      min: 0
    },
    max: {
      type: Number,
      required: true,
      min: 0
    }
  },
  deadline: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'assigned', 'in-progress', 'review', 'completed', 'cancelled'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  startup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: true
  },
  assignedStudent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  applicants: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    proposal: {
      type: String,
      maxlength: [500, 'Proposal cannot be more than 500 characters']
    },
    bidAmount: {
      type: Number,
      required: true,
      min: 0
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    }
  }],
  attachments: [{
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  deliverables: [{
    name: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    fileUrl: {
      type: String
    },
    submittedAt: {
      type: Date
    },
    isApproved: {
      type: Boolean,
      default: false
    }
  }],
  progress: {
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    milestones: [{
      title: {
        type: String,
        required: true
      },
      description: {
        type: String
      },
      isCompleted: {
        type: Boolean,
        default: false
      },
      completedAt: {
        type: Date
      }
    }]
  },
  reviews: [{
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: [300, 'Review comment cannot be more than 300 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isVerificationTask: {
    type: Boolean,
    default: false
  },
  verificationSkill: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient querying
taskSchema.index({ status: 1, category: 1, skills: 1 });
taskSchema.index({ startup: 1, status: 1 });
taskSchema.index({ assignedStudent: 1, status: 1 });

module.exports = mongoose.model('Task', taskSchema); 