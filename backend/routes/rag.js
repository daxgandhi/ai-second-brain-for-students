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
            context = "Context from uploaded notes:\n";
            relevantChunks.forEach((item, index) => {
                context += `[Note: ${item.metadata?.title || 'Unknown'}]\n${item.text}\n\n`;
                console.log(`[RAG Debug] Chunk ${index + 1} content: ${item.text}`);
            });
            console.log(`[RAG] Retrieved ${relevantChunks.length} relevant chunks for context.`);
        } else {
            console.log(`[RAG] No relevant chunks found in Vector Search.`);
            context = "No relevant context found in the user's uploaded notes for this specific query.\n\n";
        }

        // Limit the total prompt context size to prevent Ollama overflow (approx ~3000 chars of context maximum)
        if (context.length > 4000) {
            context = context.substring(0, 4000) + "\n...[Context truncated due to size limits]\n\nEnd of context.\n\n";
        }

        const prompt = `System Instructions:
You are a strict, helpful study assistant. 
Use the following "Context" from the user's notes to answer their question. 

### CONSTRAINTS:
1. USE ONLY THE PROVIDED CONTEXT. DO NOT USE OUTSIDE KNOWLEDGE.
2. USE THE EXACT WORDING AND ANALOGIES from the notes where possible.
3. If the answer is not CLEARLY in the context, say "This information is not present in your notes."
4. DO NOT define terms like "labeled" using your own knowledge (e.g., do not mention "positive or negative" if it's not in the context).

Context from uploaded notes:
${context}

User Question: ${message.trim()}
Answer (be brief and extractive):`;

        // 2. Call Local Ollama instance
        console.log(`[RAG Debug] Prompt: ${prompt.substring(0, 300)}...`);
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
            console.log(`[RAG Debug] AI Reply: "${reply.substring(0, 100)}..."`);
            const contextUsed = relevantChunks.length > 0;

            // Save AI Reply
            await ChatMessage.create({
                user: req.user._id,
                chatType: 'rag_chat',
                role: 'ai',
                text: reply.trim(),
                contextUsed: contextUsed
            });

            // Build sources list for frontend display
            const sources = relevantChunks.map(chunk => ({
                title: chunk.metadata?.title || 'Unknown Note',
                preview: chunk.text.substring(0, 120).trim() + (chunk.text.length > 120 ? '...' : ''),
                score: chunk.score
            }));

            res.json({
                reply,
                contextUsed: contextUsed,
                sources: contextUsed ? sources : [],
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
