// ============================================================
// models/KnowledgeGraph.js — Stores AI-generated knowledge graphs
// Linked to a Note and a User
// ============================================================

const mongoose = require('mongoose');

const nodeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  group: { type: String, enum: ['main', 'sub', 'example', 'algorithm'], default: 'sub' },
  description: { type: String, default: '' }
}, { _id: false });

const edgeSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  label: { type: String, default: 'relates to' }
}, { _id: false });

const knowledgeGraphSchema = new mongoose.Schema({
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
  title: {
    type: String,
    required: true
  },
  nodes: [nodeSchema],
  edges: [edgeSchema],
  nodeCount: { type: Number, default: 0 },
  edgeCount: { type: Number, default: 0 },
  insights: [{ type: String }],
  generatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('KnowledgeGraph', knowledgeGraphSchema);
