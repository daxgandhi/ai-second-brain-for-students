const mongoose = require('mongoose');

const studyPlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  examDate: {
    type: String,
    required: true
  },
  daysLeft: {
    type: Number,
    required: true
  },
  subjects: [{
    type: String
  }],
  totalStudyHours: {
    type: Number,
    required: true
  },
  hoursPerDay: {
    type: Number,
    required: true
  },
  schedule: [{
    day: Number,
    date: String,
    phase: String,
    tasks: [String],
    hours: Number,
    subject: String
  }],
  tips: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('StudyPlan', studyPlanSchema);
