// ============================================================
// routes/summary.js — Summary Generator Route
// POST /api/summary  — Summarize input text
// Currently uses smart dummy summaries.
// Replace with OpenAI / Gemini API for real summaries.
// ============================================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Note = require('../models/Note');
const SummaryHistory = require('../models/SummaryHistory');

const { GoogleGenerativeAI } = require("@google/generative-ai");

// ── GET /api/summary/history (Protected) ──────────────────────
router.get('/history', protect, async (req, res) => {
  try {
    const history = await SummaryHistory.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch summary history' });
  }
});

// ── POST /api/summary  (Protected) ───────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { text, noteId } = req.body;
    let textToSummarize = text;
    let noteTitle = 'Pasted Text';

    if (noteId) {
      const note = await Note.findOne({ _id: noteId, user: req.user.id });
      if (!note) {
        return res.status(404).json({ message: 'Selected note not found' });
      }
      textToSummarize = note.content;
      noteTitle = note.title;
    }

    if (!textToSummarize || textToSummarize.trim().length < 20) {
      return res.status(400).json({ message: 'Please provide at least 20 characters of text to summarize' });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return res.status(500).json({ message: "API Key missing. Please set GEMINI_API_KEY in backend/.env" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Please provide a structured summary of the following text. Include Key Points, Key Concepts, and a brief Overview. Limit to concise bullet points and paragraphs.\n\nText:\n${textToSummarize}`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    const wordCount = textToSummarize.trim().split(/\s+/).length;
    let summaryCount = summary.split(/\s+/).length;
    if (summaryCount === 0) summaryCount = 1; // prevent divide by zero
    const compRatio = Math.max(0, Math.min(100, Math.round((1 - summaryCount / wordCount) * 100)));

    // Save summary history to DB
    const historyEntry = await SummaryHistory.create({
      user: req.user.id,
      sourceTopic: noteTitle,
      originalWordCount: wordCount,
      summaryWordCount: summaryCount,
      compressionRatio: compRatio,
      summaryContent: summary
    });

    res.json({
      summary,
      originalWordCount: wordCount,
      summaryWordCount: summaryCount,
      compressionRatio: compRatio,
      id: historyEntry._id
    });

  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ message: error.message && error.message.includes('API key') ? 'Configuration Error:' + error.message : 'Summary generation failed. The AI model may be temporarily unavailable.' });
  }
});

module.exports = router;
