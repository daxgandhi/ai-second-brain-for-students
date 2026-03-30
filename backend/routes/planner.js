// ============================================================
// routes/planner.js — Study Planner Route
// POST /api/planner  — Generate a study plan
// ============================================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const StudyPlan = require('../models/StudyPlan');

const { GoogleGenerativeAI } = require("@google/generative-ai");

// ── GET /api/planner/history (Protected) ──────────────────────
router.get('/history', protect, async (req, res) => {
  try {
    const history = await StudyPlan.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch planner history' });
  }
});

// ── POST /api/planner  (Protected) ───────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { examDate, subjects, hoursPerDay = 3 } = req.body;

    if (!examDate) {
      return res.status(400).json({ message: 'Exam date is required' });
    }
    if (!subjects || subjects.trim().length === 0) {
      return res.status(400).json({ message: 'Please list your subjects' });
    }

    const today = new Date();
    const examDay = new Date(examDate);
    const diffTime = examDay - today;
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) {
      return res.status(400).json({ message: 'Exam date must be in the future' });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return res.status(500).json({ message: "API Key missing. Please set GEMINI_API_KEY in backend/.env" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Create a detailed study schedule. Exam date is ${examDate}. Subjects: ${subjects}. Study hours per day: ${hoursPerDay}. Number of days left: ${daysLeft}.
Return ONLY a valid JSON object matching exactly this structure:
{
  "examDate": "${examDate}",
  "daysLeft": ${daysLeft},
  "subjects": ["subject1", "subject2"],
  "totalStudyHours": ${daysLeft * hoursPerDay},
  "hoursPerDay": ${hoursPerDay},
  "schedule": [
    {
       "day": 1,
       "date": "Mon, Oct 12",
       "phase": "Learning",
       "tasks": ["Task 1", "Task 2"],
       "hours": ${hoursPerDay},
       "subject": "subject1"
    }
  ],
  "tips": ["Tip 1", "Tip 2"]
}`;

    const result = await model.generateContent(prompt);
    let output = result.response.text();
    output = output.replace(/```json/gi, '').replace(/```/g, '').trim();
    const planData = JSON.parse(output);

    // Save plan to DB
    const plan = await StudyPlan.create({
      user: req.user.id,
      examDate: planData.examDate || examDate,
      daysLeft: planData.daysLeft || daysLeft,
      subjects: planData.subjects || subjects.split(',').map(s => s.trim()),
      totalStudyHours: planData.totalStudyHours || (daysLeft * hoursPerDay),
      hoursPerDay: planData.hoursPerDay || hoursPerDay,
      schedule: planData.schedule || [],
      tips: planData.tips || []
    });

    res.json({ ...planData, id: plan._id });

  } catch (error) {
    console.error('Planner error:', error);
    res.status(500).json({ message: 'Study plan generation failed', details: error.message });
  }
});

module.exports = router;
