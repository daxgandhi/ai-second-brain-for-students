const mongoose = require('mongoose');

const studyInsightSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // One cached insight per user
  },
  insightData: {
    type: Object,
    required: true
  },
  lastExamResultCount: {
    type: Number,
    required: true,
    default: 0
  },
  lastExamUpdatedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('StudyInsight', studyInsightSchema);
