// ============================================================
// routes/chat.js — Chat Route
// POST /api/chat  — Get AI response for a message
// Connects to Gemini API with RAG context
// ============================================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Note = require('../models/Note');
const ChatMessage = require('../models/ChatMessage');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ── CHAT ENDPOINT ─────────────────────────────────────────────
// POST /api/chat  (Protected)
router.post('/', protect, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return res.json({ reply: "API Key missing. Please set GEMINI_API_KEY in backend/.env", timestamp: new Date().toISOString() });
    }

    // Fetch user's notes to use as context
    const userNotes = await Note.find({ user: req.user._id });
    let context = "";
    if (userNotes && userNotes.length > 0) {
      context = "Here are the user's uploaded notes for context:\n\n";
      userNotes.forEach(note => {
        context += `--- Note Title: ${note.title} ---\n`;
        if (note.content) {
          context += `${note.content}\n\n`;
        } else {
          context += `(This is a PDF file named ${note.fileName}, content extraction may be needed)\n\n`;
        }
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Save User Message
    await ChatMessage.create({
      user: req.user._id,
      chatType: 'ai_chat',
      role: 'user',
      text: message.trim()
    });

    const prompt = `${context}User Message: ${message.trim()}`;

    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    // Save AI Reply
    await ChatMessage.create({
      user: req.user._id,
      chatType: 'ai_chat',
      role: 'ai',
      text: reply.trim()
    });

    res.json({
      reply,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat error stack:', error.stack || error);
    if (error.statusText) console.error('Error statusText:', error.statusText, 'status:', error.status);
    if (error.errorDetails) console.error('Error details:', error.errorDetails);

    res.status(500).json({ message: 'Chat service unavailable', details: error.message });
  }
});


// ── GET CHAT HISTORY ──────────────────────────────────────────
// GET /api/chat/history (Protected)
router.get('/history', protect, async (req, res) => {
  try {
    const history = await ChatMessage.find({
      user: req.user._id,
      chatType: 'ai_chat'
    }).sort({ createdAt: 1 }); // Oldest first for chat UI rendering

    res.json({ success: true, count: history.length, data: history });
  } catch (error) {
    console.error('Fetch AI Chat history error:', error);
    res.status(500).json({ message: 'Failed to fetch chat history' });
  }
});

module.exports = router;
