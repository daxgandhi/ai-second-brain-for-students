// ============================================================
// routes/rag.js — Chat with Notes Route (Offline RAG)
// POST /api/rag  — Get AI response for a message using uploaded notes as context
// Connects to Local Ollama API and local ChromaDB Vector Retrieval
// ============================================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { queryRelevantChunks } = require('../utils/ragUtils');
const ChatMessage = require('../models/ChatMessage');

const { queryRagWithPython } = require('../utils/pythonAiClient');

// ── RAG ENDPOINT ─────────────────────────────────────────────
// POST /api/rag  (Protected)
router.post('/', protect, async (req, res) => {
    try {
        const { message, noteId } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ message: 'Message cannot be empty' });
        }

        console.log(`[RAG Gateway] Receiving query: "${message}"`);

        // Save User Message
        await ChatMessage.create({
            user: req.user._id,
            chatType: 'rag_chat',
            role: 'user',
            text: message.trim()
        });

        let reply = '';
        let contextUsed = false;
        let sources = [];

        try {
            // 🐍 Try Python AI Microservice first
            console.log('[RAG Gateway] Sending query to Python AI Microservice...');
            const pyRes = await queryRagWithPython(message.trim(), noteId, 4);
            reply = pyRes.answer;
            sources = (pyRes.sources || []).map(s => ({
                title: s.metadata?.title || 'Note Chunk',
                preview: s.text.substring(0, 120).trim() + (s.text.length > 120 ? '...' : ''),
                score: s.score
            }));
            contextUsed = sources.length > 0;
            console.log('✅ RAG query processed by Python FastAPI AI Microservice');
        } catch (pyErr) {
            console.warn('[RAG Gateway Warning] Python AI service RAG call failed, trying local fallback:', pyErr.message);

            const relevantChunks = await queryRelevantChunks(message, 4, noteId);
            let context = "";
            if (relevantChunks && relevantChunks.length > 0) {
                context = "Context from uploaded notes:\n";
                relevantChunks.forEach((item) => {
                    context += `[Note: ${item.metadata?.title || 'Unknown'}]\n${item.text}\n\n`;
                });
            } else {
                context = "No relevant context found in the user's uploaded notes.\n\n";
            }

            const prompt = `System Instructions: Use context from uploaded notes:\n${context}\nQuestion: ${message.trim()}`;
            const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';

            const response = await fetch('http://127.0.0.1:11434/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: OLLAMA_MODEL, prompt: prompt, stream: false })
            });

            if (!response.ok) throw new Error(`Ollama server responded with status: ${response.status}`);
            const data = await response.json();
            reply = data.response;
            contextUsed = relevantChunks.length > 0;
            sources = relevantChunks.map(chunk => ({
                title: chunk.metadata?.title || 'Unknown Note',
                preview: chunk.text.substring(0, 120).trim() + '...',
                score: chunk.score
            }));
        }

        // Save AI Reply
        await ChatMessage.create({
            user: req.user._id,
            chatType: 'rag_chat',
            role: 'ai',
            text: reply.trim(),
            contextUsed: contextUsed
        });

        res.json({
            reply,
            contextUsed: contextUsed,
            sources: contextUsed ? sources : [],
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('RAG service error stack:', error.stack || error);
        res.status(500).json({ message: 'RAG service failed', details: error.message });
    }
});

// ── GET RAG CHAT HISTORY ──────────────────────────────────────
// GET /api/rag/history (Protected)
router.get('/history', protect, async (req, res) => {
    try {
        const history = await ChatMessage.find({
            user: req.user._id,
            chatType: 'rag_chat'
        }).sort({ createdAt: 1 }); // Oldest first

        res.json({ success: true, count: history.length, data: history });
    } catch (error) {
        console.error('Fetch RAG Chat history error:', error);
        res.status(500).json({ message: 'Failed to fetch RAG chat history' });
    }
});

module.exports = router;
