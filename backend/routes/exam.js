// ============================================================
// routes/exam.js — Exam / MCQ Generator Route
// POST /api/exam  — Generate MCQs from a topic or text
// ============================================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ExamResult = require('../models/ExamResult');
// ── Helper: call Ollama (local fallback) ──────────────────────
const http = require('http');

function callOllama(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ model: 'llama3', prompt, stream: false });
    const options = {
      hostname: 'localhost',
      port: 11434,
      path: '/api/generate',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data).response || ''); }
        catch (e) { reject(new Error('Ollama response parse error')); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── POST /api/exam  (Protected) ───────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { topic, text, noteId, examType = 'mcq', numQuestions = 5, difficulty = 'medium' } = req.body;

    let promptText = '';
    let responseTopic = topic || 'Custom Text';

    if (noteId) {
      const Note = require('../models/Note');
      const note = await Note.findOne({ _id: noteId, user: req.user._id });
      if (!note) return res.status(404).json({ message: 'Note not found' });
      promptText = `Context Text: ${(note.content || '').substring(0, 15000)}`;
      responseTopic = note.title;
    } else if (text) {
      promptText = `Context Text: ${text}`;
    } else if (topic) {
      promptText = `Topic: ${topic}`;
    } else {
      return res.status(400).json({ message: 'Please provide a topic, text, or select a note' });
    }

    // Build the right prompt based on examType
    let prompt = '';
    let isMcq = examType === 'mcq';

    if (examType === 'mid_sem') {
      prompt = `You are an expert university professor at Parul University. Generate a formal Mid Semester Examination paper in pure HTML (no markdown backticks) for the following: ${promptText}.

The HTML output must look exactly like a printed university exam paper with professional inline CSS. Include every element below:

1. UNIVERSITY HEADER (center-aligned, formal):
   - Institution: Parul University, Vadodara
   - Faculty: Faculty of Engineering & Technology
   - Subject: ${responseTopic}
   - Exam: Mid Semester Examination
   - Time Allowed: 1 Hour 30 Minutes | Maximum Marks: 20
2. INSTRUCTIONS (numbered list, 4-5 points):
   - All questions are compulsory.
   - Figures to the right indicate full marks.
   - Assume suitable data wherever necessary.
   - Write legibly and clearly.
3. SECTION A:
   - Q1-(A): 5 one-line answer questions. [1 mark each = 5 marks]
   - Q1-(B): 5 fill in the blanks. [1 mark each = 5 marks]
4. SECTION B:
   - Q2: Attempt any 2 out of 3 short questions. [3 marks each = 6 marks]
   - Q3: Attempt any 1 out of 2 long questions. [4 marks each = 4 marks]

Show marks in brackets on the right side of every question. Generate REAL, subject-specific questions based on the provided material.`;
    } else if (examType === 'end_sem') {
      prompt = `You are an expert university professor at Parul University. Generate a formal End Semester Examination paper in pure HTML (no markdown backticks) for the following: ${promptText}.

The HTML output must look exactly like a printed university exam paper with professional inline CSS. Use HTML tables for the CO and BT columns. Include every element below:

1. UNIVERSITY HEADER (center-aligned, formal):
   - Institution: Parul University, Vadodara
   - Faculty: Faculty of Engineering & Technology
   - Subject: ${responseTopic} | Exam: End Semester Examination
   - Time Allowed: 3 Hours | Maximum Marks: 70
2. INSTRUCTIONS (numbered list, 4-5 points):
   - Attempt all questions.
   - Figures to the right indicate full marks.
   - CO = Course Outcome, BT = Bloom's Taxonomy Level (L1-L6).
   - Assume suitable data if necessary.
3. Each question row in an HTML table with columns: [Question Text] | [Marks] | [CO] | [BT]
4. SECTION A:
   - Q1: 5 sub-parts (a to e), 2 marks each = 10 marks. Mix of very short and short answer types.
5. SECTION B:
   - Q2: Main question (5 marks, CO1, L2) OR alternate question (5 marks, CO1, L3)
   - Q3: Main question (6 marks, CO2, L3) OR alternate question (6 marks, CO2, L4)
6. SECTION C:
   - Q4: Main question (7 marks, CO3, L4) OR alternate question (7 marks, CO3, L5)
   - Q5: Main question (6 marks, CO4, L4) OR alternate question (6 marks, CO4, L5)

Generate REAL, subject-specific questions based on the provided material. Make the layout look like a genuine printed university engineering exam paper.`;
    } else {
      const count = Math.min(parseInt(numQuestions) || 5, 10);
      const difficultyMap = {
        easy: 'very basic, recall-level (Bloom\'s L1-L2), suitable for beginners with simple and direct answers',
        medium: 'moderately challenging, application-level (Bloom\'s L3-L4), requiring some understanding',
        hard: 'advanced, analysis and evaluation-level (Bloom\'s L5-L6), with tricky distractors requiring deep understanding'
      };
      const difficultyDesc = difficultyMap[difficulty] || difficultyMap['medium'];
      prompt = `Create exactly ${count} multiple choice questions (MCQs) based on the following: ${promptText}.
Difficulty: ${difficulty.toUpperCase()} — Questions should be ${difficultyDesc}.
Return ONLY a valid JSON array where each object has keys:
- "id": number (starting from 1)
- "question": string
- "options": array of 4 strings
- "correct": number (0 to 3, index of correct option)
- "explanation": string`;
    }

    // ── Try Gemini first ─────────────────────────────────────
    let output = null;
    let usedOllama = false;

    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Changed to 1.5-flash as per original
        const result = await model.generateContent(prompt);
        output = result.response.text();
      } catch (geminiErr) {
        // Check for specific error properties if available from Gemini API client
        // For now, assuming a generic error might indicate service issues
        console.warn('Gemini API call failed, attempting Ollama fallback. Error:', geminiErr.message);
        usedOllama = true;
      }
    } else {
      console.warn('Gemini API Key missing or invalid, falling back to Ollama...');
      usedOllama = true;
    }

    // ── Fall back to Ollama ───────────────────────────────────
    if (usedOllama) {
      try {
        output = await callOllama(prompt);
      } catch (ollamaErr) {
        console.error('Ollama fallback failed:', ollamaErr.message);
        return res.status(503).json({ message: 'AI service temporarily unavailable. Please try again in a few minutes.' });
      }
    }

    // Ensure output is not null before processing
    if (!output) {
      return res.status(500).json({ message: 'Failed to generate content from any AI service.' });
    }

    // Clean output
    output = output.replace(/```json/gi, '').replace(/```html/gi, '').replace(/```/g, '').trim();

    if (isMcq) {
      // Try to extract JSON array if there's conversational text around it
      const startIdx = output.indexOf('[');
      const endIdx = output.lastIndexOf(']');
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        output = output.substring(startIdx, endIdx + 1);
      }

      try {
        const questions = JSON.parse(output);
        return res.json({ topic: responseTopic, examType: 'mcq', questions, totalQuestions: questions.length });
      } catch (parseErr) {
        console.error('Failed to parse MCQ JSON:', parseErr.message, '\nOutput was:', output);
        return res.status(500).json({ message: 'AI generated invalid exam format. Please try again.' });
      }
    } else {
      return res.json({ topic: responseTopic, examType, paperHtml: output });
    }

  } catch (error) {
    console.error('Exam gen error:', error);
    res.status(500).json({ message: error.message || 'Exam generation failed' });
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

// ── GET /api/exam/history (Protected) ─────────────────────────
// Returns past exam results for the logged-in user, newest first
router.get('/history', protect, async (req, res) => {
  try {
    const results = await ExamResult.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50); // Last 50 exams max
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Fetch exam history error:', error);
    res.status(500).json({ message: 'Failed to fetch exam history' });
  }
});

module.exports = router;
