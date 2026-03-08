const express = require('express');
const router = express.Router();
const StudySession = require('../models/StudySession');
const Note = require('../models/Note');
const ExamResult = require('../models/ExamResult');
// Assuming Flashcard saving isn't fully persistent yet based on flashcards.js route, 
// we will focus on Notes and Sessions for the structured analytics.
const { protect } = require('../middleware/auth'); // Authentication middleware

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
                    }
                }
            }
        });

    } catch (error) {
        console.error('Fetch analytics error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
