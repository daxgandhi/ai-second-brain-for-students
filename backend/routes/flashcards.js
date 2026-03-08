// ============================================================
// routes/flashcards.js — Flashcard Generator Route
// POST /api/flashcards  — Generate Flashcards from a topic or text
// ============================================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Note = require('../models/Note');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ── POST /api/flashcards  (Protected) ─────────────────────────
router.post('/', protect, async (req, res) => {
    try {
        const { topic, text, noteId, numCards = 5 } = req.body;

        if (!topic && !text && !noteId) {
            return res.status(400).json({ message: 'Please provide a topic, text, or a noteId' });
        }

        let sourceText = text || '';
        let sourceTopic = topic || '';

        // If noteId is provided, fetch the note
        if (noteId) {
            const note = await Note.findOne({ _id: noteId, user: req.user._id });
            if (!note) {
                return res.status(404).json({ message: 'Note not found' });
            }
            sourceText = note.content || '';
            sourceTopic = note.title;
            if (!sourceText && !sourceTopic) {
                return res.status(400).json({ message: 'Selected note is empty' });
            }
        }

        const count = Math.min(parseInt(numCards) || 5, 20); // Max 20 flashcards

        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
            return res.status(500).json({ message: "API Key missing. Please set GEMINI_API_KEY in backend/.env" });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        let promptContext = '';
        if (sourceText) {
            // Trim text if it's too long
            const trimmedText = sourceText.substring(0, 15000);
            promptContext = `Context Text: ${trimmedText}`;
        } else if (sourceTopic) {
            promptContext = `Topic: ${sourceTopic}`;
        }

        const prompt = `Create exactly ${count} educational flashcards based on the following:
${promptContext}

Return ONLY a valid JSON array where each object has the following keys:
- "front": string (The question or concept to test)
- "back": string (The answer or explanation)`;

        const result = await model.generateContent(prompt);
        let output = result.response.text();
        output = output.replace(/```json/gi, '').replace(/```/g, '').trim();

        let flashcards;
        try {
            flashcards = JSON.parse(output);
        } catch (parseError) {
            console.error('Failed to parse Gemini output:', output);
            return res.status(500).json({ message: 'Failed to generate required format from AI' });
        }

        res.json({
            topic: sourceTopic || 'Custom Text',
            flashcards,
            totalCards: flashcards.length
        });

    } catch (error) {
        console.error('Flashcard gen error:', error);
        res.status(500).json({ message: 'Flashcard generation failed' });
    }
});

module.exports = router;
