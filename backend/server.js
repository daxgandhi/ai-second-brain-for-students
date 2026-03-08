// ============================================================
// server.js — Main Entry Point
// Sets up Express, connects MongoDB, registers all routes
// ============================================================

require('dotenv').config();

// Mask key for debugging
if (process.env.GEMINI_API_KEY) {
  const key = process.env.GEMINI_API_KEY.trim();
  const masked = key.substring(0, 5) + '...' + key.substring(key.length - 4);
  console.log('✅ Loaded GEMINI_API_KEY:', masked);
  process.env.GEMINI_API_KEY = key; // Save trimmed variant
} else {
  console.log('❌ process.env.GEMINI_API_KEY is missing!');
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// ── Middleware ────────────────────────────────────────────────
app.use(cors());                          // Allow cross-origin requests (frontend ↔ backend)
app.use(express.json());                  // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse form data

// Serve uploaded files as static assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ────────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');
const chatRoutes = require('./routes/chat');
const summaryRoutes = require('./routes/summary');
const plannerRoutes = require('./routes/planner');
const examRoutes = require('./routes/exam');
const ragRoutes = require('./routes/rag');
const flashcardsRoutes = require('./routes/flashcards');
const sessionsRoutes = require('./routes/sessions');
const analyticsRoutes = require('./routes/analytics');

app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/rag', ragRoutes);
app.use('/api/flashcards', flashcardsRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/analytics', analyticsRoutes);

// ── Health Check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'AI Second Brain API is running' });
});

// ── MongoDB Connection ────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-second-brain';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅  MongoDB connected'))
  .catch(err => console.error('❌  MongoDB connection error:', err));

// ── Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀  Server running on http://localhost:${PORT}`);
});
