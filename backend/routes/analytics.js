const express = require('express');
const router = express.Router();
const StudySession = require('../models/StudySession');
const Note = require('../models/Note');
const ExamResult = require('../models/ExamResult');
// Assuming Flashcard saving isn't fully persistent yet based on flashcards.js route, 
// we will focus on Notes and Sessions for the structured analytics.
const { protect } = require('../middleware/auth'); // Authentication middleware
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ── GET /api/analytics ────────────────────────────────────────
// Get structured analytics data for the dashboard (Chart.js ready)
router.get('/', protect, async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Total Metrics
        const totalNotes = await Note.countDocuments({ user: userId });

        // Total Study Time from sessions
        const sessions = await StudySession.find({ user: userId });
        const totalStudyMinutes = sessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);

        // 2. Activity Data over the last 7 days for Chart.js
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        // Aggregate sessions by day
        const recentSessions = await StudySession.find({
            user: userId,
            createdAt: { $gte: sevenDaysAgo, $lte: today }
        });

        // Initialize array for the last 7 days
        const last7Days = [];
        const chartDataMap = {}; // Map DateString -> minutes

        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            // Format as MM/DD
            const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
            last7Days.push(dateStr);
            chartDataMap[dateStr] = 0;
        }

        // Populate chart data map
        recentSessions.forEach(session => {
            const sessionDate = new Date(session.createdAt);
            const dateStr = `${sessionDate.getMonth() + 1}/${sessionDate.getDate()}`;
            if (chartDataMap[dateStr] !== undefined) {
                chartDataMap[dateStr] += session.durationMinutes;
            }
        });

        const chartDataValues = last7Days.map(date => chartDataMap[date]);

        // Calculate distributions (e.g. total notes by type if available, else simulate)
        const pdfNotesCount = await Note.countDocuments({ user: userId, fileType: 'pdf' });
        const textNotesCount = await Note.countDocuments({ user: userId, fileType: 'text' });

        // 3. Weak Topics Aggregation
        const weakTopicsAgg = await ExamResult.aggregate([
            { $match: { user: userId } },
            {
                $group: {
                    _id: "$topic",
                    avgScore: { $avg: "$percentage" }
                }
            },
            { $sort: { avgScore: 1 } }, // Ascending to get weakest first
            { $limit: 3 } // Get top 3
        ]);

        const weakTopics = weakTopicsAgg.map(t => ({
            topic: t._id,
            avgScore: Math.round(t.avgScore)
        }));

        // 4. Topic Accuracy (For Bar Chart)
        const topicAccuracyAgg = await ExamResult.aggregate([
            { $match: { user: userId } },
            {
                $group: {
                    _id: "$topic",
                    avgScore: { $avg: "$percentage" }
                }
            },
            { $sort: { avgScore: -1 } }
        ]);
        const topicLabels = topicAccuracyAgg.map(t => t._id);
        const topicScores = topicAccuracyAgg.map(t => Math.round(t.avgScore));

        // 5. Correct vs Wrong (For Pie Chart)
        const correctVsWrongAgg = await ExamResult.aggregate([
            { $match: { user: userId } },
            {
                $group: {
                    _id: null,
                    totalCorrect: { $sum: "$score" },
                    totalQuestions: { $sum: "$totalQuestions" }
                }
            }
        ]);
        
        let correctCount = 0;
        let wrongCount = 0;
        if (correctVsWrongAgg.length > 0) {
            correctCount = correctVsWrongAgg[0].totalCorrect;
            wrongCount = correctVsWrongAgg[0].totalQuestions - correctCount;
        }

        // Structured response payload expected by frontend Chart.js
        res.status(200).json({
            success: true,
            data: {
                metrics: {
                    totalNotes,
                    totalStudyMinutes,
                    totalStudyHours: (totalStudyMinutes / 60).toFixed(1)
                },
                weakTopics,
                charts: {
                    activity: {
                        labels: last7Days,
                        datasets: [{
                            label: 'Study Minutes',
                            data: chartDataValues
                        }]
                    },
                    distribution: {
                        labels: ['PDFs', 'Text Notes'],
                        datasets: [{
                            data: [pdfNotesCount, textNotesCount]
                        }]
                    },
                    topicAccuracy: {
                        labels: topicLabels,
                        datasets: [{
                            label: 'Topic Accuracy (%)',
                            data: topicScores
                        }]
                    },
                    correctVsWrong: {
                        labels: ['Correct', 'Wrong'],
                        datasets: [{
                            data: [correctCount, wrongCount]
                        }]
                    }
                }
            }
        });

    } catch (error) {
        console.error('Fetch analytics error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// ── GET /api/analytics/recommendation ──────────────────────────
router.get('/recommendation', protect, async (req, res) => {
    try {
        const userId = req.user._id;

        // Get weak topics
        const weakTopicsAgg = await ExamResult.aggregate([
            { $match: { user: userId } },
            {
                $group: {
                    _id: "$topic",
                    avgScore: { $avg: "$percentage" }
                }
            },
            { $sort: { avgScore: 1 } },
            { $limit: 3 }
        ]);

        if (weakTopicsAgg.length === 0) {
            return res.json({ success: true, recommendation: "You haven't taken any quizzes yet.\n→ Upload notes\n→ Generate MCQs\n→ Start studying!" });
        }

        const weakTopicNames = weakTopicsAgg.map(t => t._id).join(', ');

        const prompt = `You are an AI Study Recommendation Engine. The user is currently weakest in the following topics: ${weakTopicNames}.
Please provide a highly personalized, short recommendation (max 4 lines).
Format it exactly like this example (DO NOT use markdown like **):
You are weak in Machine Learning
→ Revise notes
→ Take 3 quizzes
→ Practice flashcards

You MUST start with "You are weak in [dominant topic]" and then provide 3 actionable bullet points starting with →. Do not output anything else.`;

        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
            return res.json({ success: true, recommendation: `You are weak in ${weakTopicsAgg[0]._id}\n→ Revise notes\n→ Take 3 quizzes\n→ Practice flashcards` });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        let recommendation = result.response.text().trim();
        // remove asterisks if model generates markdown anyway
        recommendation = recommendation.replace(/\*\*/g, '');

        res.json({ success: true, recommendation });
    } catch (error) {
        console.error('Recommendation Engine Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
