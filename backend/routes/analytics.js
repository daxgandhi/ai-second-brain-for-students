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

const { generateRecommendationsWithPython } = require('../utils/pythonAiClient');

const StudyInsight = require('../models/StudyInsight');
const KnowledgeGraph = require('../models/KnowledgeGraph');

// ── GET /api/analytics/insights ──────────────────────────
router.get('/insights', protect, async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Get current exam count to determine cache freshness
        const currentExamCount = await ExamResult.countDocuments({ user: userId });
        const TutorSession = require('../models/TutorSession');
        const currentTutorCount = await TutorSession.countDocuments({ user: userId, status: 'completed' });
        const cacheHash = currentExamCount + currentTutorCount; // simple hash

        // 2. Check if a valid cache exists
        let cachedInsight = await StudyInsight.findOne({ user: userId });
        
        if (cachedInsight && cachedInsight.lastExamResultCount === cacheHash) {
            console.log('Returning cached Study Insight for user:', userId);
            return res.status(200).json({ success: true, insight: cachedInsight.insightData });
        }

        // 3. Aggregate weakest topics (Top 3)
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

        // Get weak topics from recent completed TutorSessions
        const recentTutorSessions = await TutorSession.find({ user: userId, status: 'completed' })
            .sort({ completedAt: -1 })
            .limit(3);
            
        const tutorWeakTopics = [];
        recentTutorSessions.forEach(session => {
            if (session.completionStats && session.completionStats.weakConcepts) {
                session.completionStats.weakConcepts.forEach(concept => {
                    if (!tutorWeakTopics.includes(concept)) tutorWeakTopics.push(concept);
                });
            }
        });

        if (weakTopicsAgg.length === 0 && tutorWeakTopics.length === 0) {
            return res.json({ success: true, insight: null, message: "Not enough data" });
        }

        const weakTopicNames = weakTopicsAgg.map(t => t._id).concat(tutorWeakTopics).slice(0, 3);
        const worstTopic = weakTopicNames[0];

        // 4. Fetch Knowledge Graph context related to the weakest topic
        let kgContext = [];
        let kgNoteId = null;
        try {
            const kg = await KnowledgeGraph.findOne({ user: userId });
            if (kg && kg.edges) {
                kgNoteId = kg.note;
                // Find edges connected to the worst topic (naive matching for V1)
                const relevantEdges = kg.edges.filter(e => 
                    e.from.toLowerCase().includes(worstTopic.toLowerCase()) || 
                    e.to.toLowerCase().includes(worstTopic.toLowerCase())
                ).slice(0, 5); // Take up to 5 edges

                kgContext = relevantEdges.map(e => `${e.from} -> ${e.to}`);
            }
        } catch (e) {
            console.warn("Failed to fetch Knowledge Graph context for insights:", e.message);
        }

        // 5. Generate AI Insight via Python Service
        console.log('Sending insight request to Python AI Microservice...');
        try {
            const pyRes = await generateRecommendationsWithPython(weakTopicsAgg, weakTopicNames, kgContext);
            const generatedInsight = pyRes;
            generatedInsight.note_id = kgNoteId; // Add note ID for deep linking

            // 6. Save to cache
            if (!cachedInsight) {
                cachedInsight = new StudyInsight({ user: userId });
            }
            cachedInsight.insightData = generatedInsight;
            cachedInsight.lastExamResultCount = cacheHash;
            cachedInsight.lastExamUpdatedAt = new Date();
            await cachedInsight.save();

            return res.json({ success: true, insight: generatedInsight });
        } catch (pyErr) {
            console.warn('Python AI service insight call failed:', pyErr.message);
            // Fallback to cache if Python service is completely down
            if (cachedInsight && cachedInsight.insightData) {
                console.log('Python failed, returning stale cache.');
                return res.json({ success: true, insight: cachedInsight.insightData });
            }
            throw new Error('AI Service unavailable and no cache exists.');
        }

    } catch (error) {
        console.error('Insight Engine Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
