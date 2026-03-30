// ============================================================
// models/Note.js — Note/File Schema
// Stores uploaded notes linked to a user
// ============================================================

const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,   // For text notes
    default: ''
  },
  fileUrl: {
    type: String,   // For uploaded PDF files
    default: null
  },
  fileType: {
    type: String,   // 'text' or 'pdf'
    enum: ['text', 'pdf'],
    default: 'text'
  },
  fileName: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number,   // Size in bytes
    default: 0
  },
  autoSummary: {
    type: String,   // AI-generated 2-sentence summary
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Note', noteSchema);
