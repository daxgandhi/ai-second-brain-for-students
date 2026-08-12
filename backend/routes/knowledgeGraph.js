// ============================================================
// routes/knowledgeGraph.js — Knowledge Graph Routes
// POST /api/knowledge-graph/generate  — Generate graph from note
// GET  /api/knowledge-graph/:noteId   — Get saved graph for a note
// ============================================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Note = require('../models/Note');
const KnowledgeGraph = require('../models/KnowledgeGraph');
const { 
  callPythonAiService, 
  askKnowledgeGraphWithPython, 
  generateGraphInsightsWithPython,
  explainConceptWithPython
} = require('../utils/pythonAiClient');

// ── GENERATE KNOWLEDGE GRAPH ──────────────────────────────────
// POST /api/knowledge-graph/generate  (Protected)
router.post('/generate', protect, async (req, res) => {
  try {
    const { noteId } = req.body;

    if (!noteId) {
      return res.status(400).json({ message: 'noteId is required' });
    }

    // Find the note and verify ownership
    const note = await Note.findOne({ _id: noteId, user: req.user._id });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const textContent = note.content;
    if (!textContent || textContent.trim().length < 50) {
      return res.status(400).json({ message: 'Note content is too short to generate a knowledge graph' });
    }

    // Call Python AI service to generate the graph
    const graphData = await callPythonAiService('/api/ai/knowledge-graph/generate', {
      text: textContent,
      title: note.title
    });

    // Save/update the generated graph in MongoDB
    const savedGraph = await KnowledgeGraph.findOneAndUpdate(
      { note: noteId, user: req.user._id },
      {
        note: noteId,
        user: req.user._id,
        title: graphData.title || note.title,
        nodes: graphData.nodes,
        edges: graphData.edges,
        nodeCount: graphData.node_count,
        edgeCount: graphData.edge_count,
        generatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Knowledge graph generated successfully',
      graph: savedGraph
    });

  } catch (error) {
    console.error('Knowledge graph generation error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate knowledge graph' });
  }
});

// ── GET SAVED GRAPH FOR A NOTE ────────────────────────────────
// GET /api/knowledge-graph/:noteId  (Protected)
router.get('/:noteId', protect, async (req, res) => {
  try {
    const graph = await KnowledgeGraph.findOne({
      note: req.params.noteId,
      user: req.user._id
    });

    if (!graph) {
      return res.status(404).json({ message: 'No graph found for this note. Generate one first.' });
    }

    res.json({ success: true, graph });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch knowledge graph' });
  }
});

// ── GET ALL GRAPHS FOR USER ───────────────────────────────────
// GET /api/knowledge-graph  (Protected)
router.get('/', protect, async (req, res) => {
  try {
    const graphs = await KnowledgeGraph.find({ user: req.user._id })
      .populate('note', 'title fileType')
      .sort({ generatedAt: -1 });

    res.json({ success: true, graphs });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch knowledge graphs' });
  }
});

// ── ASK GRAPH ─────────────────────────────────────────────────
// POST /api/knowledge-graph/:noteId/ask (Protected)
router.post('/:noteId/ask', protect, async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ message: 'Question is required' });
    }

    const graph = await KnowledgeGraph.findOne({
      note: req.params.noteId,
      user: req.user._id
    });

    if (!graph) {
      return res.status(404).json({ message: 'No graph found for this note.' });
    }

    const graphContext = JSON.stringify({
      nodes: graph.nodes,
      edges: graph.edges
    });

    const aiResponse = await askKnowledgeGraphWithPython(question, graphContext);
    
    res.json({ success: true, answer: aiResponse.answer });
  } catch (error) {
    console.error('Ask graph error:', error);
    res.status(500).json({ message: 'Failed to ask graph' });
  }
});

// ── GENERATE INSIGHTS ─────────────────────────────────────────
// POST /api/knowledge-graph/:noteId/insights (Protected)
router.post('/:noteId/insights', protect, async (req, res) => {
  try {
    const graph = await KnowledgeGraph.findOne({
      note: req.params.noteId,
      user: req.user._id
    });

    if (!graph) {
      return res.status(404).json({ message: 'No graph found for this note.' });
    }

    // If insights already exist, just return them (optional behavior, let's regenerate or return existing)
    if (graph.insights && graph.insights.length > 0 && !req.body.forceRegenerate) {
      return res.json({ success: true, insights: graph.insights });
    }

    const graphContext = JSON.stringify({
      nodes: graph.nodes,
      edges: graph.edges
    });

    const aiResponse = await generateGraphInsightsWithPython(graphContext);
    
    // Save generated insights to db
    graph.insights = aiResponse.insights;
    await graph.save();

    res.json({ success: true, insights: aiResponse.insights });
  } catch (error) {
    console.error('Insights generation error:', error);
    res.status(500).json({ message: 'Failed to generate insights' });
  }
});

// ── EXPLAIN CONCEPT ───────────────────────────────────────────
// POST /api/knowledge-graph/:noteId/concept/explain (Protected)
router.post('/:noteId/concept/explain', protect, async (req, res) => {
  try {
    const { concept } = req.body;
    if (!concept) {
      return res.status(400).json({ message: 'Concept name is required' });
    }

    // Fetch the graph
    const graph = await KnowledgeGraph.findOne({
      note: req.params.noteId,
      user: req.user._id
    }).populate('note');

    if (!graph || !graph.note) {
      return res.status(404).json({ message: 'Graph or Note not found.' });
    }

    const graphContext = JSON.stringify({
      nodes: graph.nodes,
      edges: graph.edges
    });

    const noteContent = graph.note.content || "";

    const aiResponse = await explainConceptWithPython(concept, graphContext, noteContent);
    
    res.json({ success: true, explanation: aiResponse });
  } catch (error) {
    console.error('Concept explanation error:', error);
    res.status(500).json({ message: 'Failed to explain concept' });
  }
});

module.exports = router;
