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

// ── RAG ENDPOINT ─────────────────────────────────────────────
// POST /api/rag  (Protected)
router.post('/', protect, async (req, res) => {
    try {
        const { message, noteId } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ message: 'Message cannot be empty' });
        }

        console.log(`[RAG] Receiving query: "${message}"`);
        console.log(`[RAG] Vector Search filtering by noteId: ${noteId || 'All Notes'}`);

        // Save User Message
        await ChatMessage.create({
            user: req.user._id,
            chatType: 'rag_chat',
            role: 'user',
            text: message.trim()
        });

        // 1. Vector Search: Find relevant chunks from ChromaDB
        // Limit context size strictly to Top 4 chunks
        const relevantChunks = await queryRelevantChunks(message, 4, noteId);

        let context = "";
        if (relevantChunks && relevantChunks.length > 0) {
            context = "Context - Here are the most relevant text chunks from the user's uploaded notes:\n\n";
            relevantChunks.forEach((item, index) => {
                const meta = item.metadata || {};
                context += `--- Chunk ${index + 1} (From Note: ${meta.title || 'Unknown'}) ---\n`;
                context += `${item.text}\n\n`;
            });
            context += `\nEnd of context.\n\n`;
            console.log(`[RAG] Retrieved ${relevantChunks.length} relevant chunks for context.`);
        } else {
            console.log(`[RAG] No relevant chunks found in Vector Search.`);
            context = "No relevant context found in the user's uploaded notes for this specific query.\n\n";
        }

        // Limit the total prompt context size to prevent Ollama overflow (approx ~3000 chars of context maximum)
        if (context.length > 4000) {
            context = context.substring(0, 4000) + "\n...[Context truncated due to size limits]\n\nEnd of context.\n\n";
        }

        const prompt = `System: You are an AI study assistant. Answer the user's question based STRICTLY and ONLY on the Context provided below. If the answer is not in the context, explicitly say that you do not know based on the provided notes. Be concise and helpful.

${context}
User Question: ${message.trim()}`;

        // 2. Call Local Ollama instance
        // Make sure Ollama is running and you have pulled a model (e.g., 'ollama run llama3')
        const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3'; // Default to llama3, can be changed in .env

        try {
            console.log(`[RAG] Sending localized prompt to Ollama model (${OLLAMA_MODEL})...`);
            const response = await fetch('http://127.0.0.1:11434/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: OLLAMA_MODEL,
                    prompt: prompt,
                    stream: false // Wait for full response
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama server responded with status: ${response.status}`);
            }

            const data = await response.json();
            const reply = data.response;
            const contextUsed = relevantChunks.length > 0;

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
                contextUsed: contextUsed, // Helpful for UI to know if it actually used notes
                timestamp: new Date().toISOString()
            });

        } catch (ollamaError) {
            console.error('Ollama connection error:', ollamaError);
            return res.status(503).json({
                message: 'Offline LLM Engine (Ollama) is not reachable.',
                details: 'Ensure Ollama is running locally on port 11434 and the model is installed.'
            });
        }

    } catch (error) {
        console.error('RAG vector search error stack:', error.stack || error);
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
