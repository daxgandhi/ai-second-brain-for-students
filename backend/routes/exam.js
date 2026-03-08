// ============================================================
// routes/exam.js — Exam / MCQ Generator Route
// POST /api/exam  — Generate MCQs from a topic or text
// ============================================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ExamResult = require('../models/ExamResult');

const { GoogleGenerativeAI } = require("@google/generative-ai");

// ── POST /api/exam  (Protected) ───────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { topic, text, numQuestions = 5 } = req.body;

    if (!topic && !text) {
      return res.status(400).json({ message: 'Please provide a topic or text' });
    }

    const count = Math.min(parseInt(numQuestions) || 5, 10); // Max 10 questions

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return res.status(500).json({ message: "API Key missing. Please set GEMINI_API_KEY in backend/.env" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let promptText = topic ? `Topic: ${topic}` : `Context Text: ${text}`;
    const prompt = `Create exactly ${count} multiple choice questions (MCQs) based on the following: ${promptText}.
Return ONLY a valid JSON array where each object has the following keys:
- "id": number (starting from 1)
- "question": string
- "options": an array of 4 string options
- "correct": number (the index of the correct option, 0 to 3)
- "explanation": string (explaining why the answer is correct)`;

    const result = await model.generateContent(prompt);
    let output = result.response.text();
    output = output.replace(/```json/gi, '').replace(/```/g, '').trim();
    const questions = JSON.parse(output);

    res.json({
      topic: topic || 'Custom Text',
      questions,
      totalQuestions: questions.length
    });

  } catch (error) {
    console.error('Exam gen error:', error);
    res.status(500).json({ message: 'Exam generation failed' });
  }
});

// ── POST /api/exam/submit (Protected) ─────────────────────────
router.post('/submit', protect, async (req, res) => {
  try {
    const { topic, score, totalQuestions } = req.body;

    if (!topic || score === undefined || !totalQuestions) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Backend percentage calculation
    const percentage = Math.round((Number(score) / Number(totalQuestions)) * 100);

    const result = new ExamResult({
      user: req.user._id,
      topic,
      score: Number(score),
      totalQuestions: Number(totalQuestions),
      percentage
    });

    await result.save();

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('Save exam result error:', error);
    res.status(500).json({ message: 'Failed to save exam result' });
  }
});

module.exports = router;
