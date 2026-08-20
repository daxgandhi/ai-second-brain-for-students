const mongoose = require('mongoose');

const questionHistorySchema = new mongoose.Schema({
  concept: { type: String, required: true },
  question: { type: String, required: true },
  userAnswer: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  score: { type: Number, required: true },
  attempts: { type: Number, default: 1 },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const tutorSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  note: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note',
    required: true
  },
  knowledgeGraph: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KnowledgeGraph',
    default: null
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed'],
    default: 'in_progress'
  },
  curriculum: [{ type: String }], // Ordered list of topics
  currentConceptIndex: {
    type: Number,
    default: 0
  },
  completedConcepts: [{ type: String }],
  mastery: {
    type: Map,
    of: Number,
    default: {}
  },
  questionHistory: [questionHistorySchema],
  
  // Cache to prevent redundant LLM calls
  lessonsCache: {
    type: Map,
    of: Object, // { concept, definition, simple_explanation, how_it_works, example, why_it_matters, key_takeaway, source_context }
    default: {}
  },
  activeQuestionCache: {
    type: Object, // Stores the current question if not yet answered correctly
    default: null
  },

  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  completionStats: {
    type: Object,
    default: null
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

module.exports = mongoose.model('TutorSession', tutorSessionSchema);
