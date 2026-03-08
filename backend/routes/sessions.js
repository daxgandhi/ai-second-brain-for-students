const express = require('express');
const router = express.Router();
const StudySession = require('../models/StudySession');
const { protect } = require('../middleware/auth'); // Authentication middleware

// ── GET /api/sessions ─────────────────────────────────────────
// Get all study sessions for the logged-in user
router.get('/', protect, async (req, res) => {
    try {
        const sessions = await StudySession.find({ user: req.user._id }).sort({ createdAt: -1 });

        // Structured response
        res.status(200).json({
            success: true,
            count: sessions.length,
            data: sessions
        });
    } catch (error) {
        console.error('Fetch sessions error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// ── POST /api/sessions ────────────────────────────────────────
// Save a newly completed study session
router.post('/', protect, async (req, res) => {
    try {
        const { topic, durationMinutes, notesGenerated, flashcardsReviewed } = req.body;

        if (!durationMinutes && durationMinutes !== 0) {
            return res.status(400).json({ success: false, message: 'Please provide duration in minutes' });
        }

        const session = await StudySession.create({
            user: req.user._id,
            topic: topic || 'General Study',
            durationMinutes,
            notesGenerated: notesGenerated || 0,
            flashcardsReviewed: flashcardsReviewed || 0
        });

        res.status(201).json({
            success: true,
            data: session
        });
    } catch (error) {
        console.error('Create session error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// ── DELETE /api/sessions/:id ──────────────────────────────────
// Delete a specific study session
router.delete('/:id', protect, async (req, res) => {
    try {
        const session = await StudySession.findOne({ _id: req.params.id, user: req.user._id });

        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        await session.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Delete session error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
