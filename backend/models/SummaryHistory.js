const mongoose = require('mongoose');

const summaryHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sourceTopic: {
    type: String,
    required: true,
    default: 'Pasted Text'
  },
  originalWordCount: {
    type: Number,
    required: true
  },
  summaryWordCount: {
    type: Number,
    required: true
  },
  compressionRatio: {
    type: Number,
    required: true
  },
  summaryContent: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SummaryHistory', summaryHistorySchema);
