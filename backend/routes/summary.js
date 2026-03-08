// ============================================================
// routes/summary.js — Summary Generator Route
// POST /api/summary  — Summarize input text
// Currently uses smart dummy summaries.
// Replace with OpenAI / Gemini API for real summaries.
// ============================================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const { GoogleGenerativeAI } = require("@google/generative-ai");

// ── POST /api/summary  (Protected) ───────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length < 20) {
      return res.status(400).json({ message: 'Please provide at least 20 characters of text to summarize' });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return res.status(500).json({ message: "API Key missing. Please set GEMINI_API_KEY in backend/.env" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Please provide a structured summary of the following text. Include Key Points, Key Concepts, and a brief Overview. Limit to concise bullet points and paragraphs.\n\nText:\n${text}`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    const wordCount = text.trim().split(/\s+/).length;

    res.json({
      summary,
      originalWordCount: wordCount,
      summaryWordCount: summary.split(/\s+/).length,
      compressionRatio: Math.round((1 - summary.split(/\s+/).length / wordCount) * 100)
    });

  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ message: 'Summary generation failed' });
  }
});

module.exports = router;
