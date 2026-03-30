// ============================================================
// routes/notes.js — Notes / File Upload Routes
// POST /api/notes/upload  — Upload a file or text note
// GET  /api/notes         — Get all notes for logged-in user
// DELETE /api/notes/:id   — Delete a note
// ============================================================

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Note = require('../models/Note');
const { protect } = require('../middleware/auth');

// ── Multer Storage Config ─────────────────────────────────────
// Files saved to /backend/uploads/
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);  // Create folder if missing

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    // Unique filename: timestamp + original name
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },  // 10MB max
  fileFilter: (req, file, cb) => {
    // Only allow PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files allowed'), false);
    }
  }
});

// ── UPLOAD NOTE ───────────────────────────────────────────────
// POST /api/notes/upload  (Protected)
const pdfParse = require('pdf-parse');
const { ingestDocumentToChroma, deleteNoteFromChroma } = require('../utils/ragUtils');

router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    let noteData = {
      user: req.user._id,
      title,
      content: content || '',
      fileType: 'text'
    };

    // If a PDF file was uploaded
    if (req.file) {
      noteData.fileUrl = `/uploads/${req.file.filename}`;
      noteData.fileName = req.file.originalname;
      noteData.fileSize = req.file.size;
      noteData.fileType = 'pdf';

      // Background extract PDF text for Chat context
      try {
        const dataBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdfParse(dataBuffer);
        
        // Basic cleaning to fix missing spaces sometimes caused by pdf-parse
        let cleanedText = pdfData.text
          .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase if it shouldn't be
          .replace(/(\w)([\.\!\?])/g, '$1$2 ') // Ensure space after punctuation
          .replace(/\s+/g, ' ')               // Collapse multiple spaces
          .trim();
          
        noteData.content = cleanedText; // Store cleaned text for AI Chat
      } catch (err) {
        console.error('Error parsing PDF content:', err);
      }
    }

    const note = await Note.create(noteData);

    // ── Local RAG: Chunk and store the text in ChromaDB (Async) ──
    if (noteData.content) {
      // We don't await this to avoid blocking the HTTP response
      ingestDocumentToChroma(note._id, note.title, noteData.content)
        .catch(err => console.error(`Failed to ingest note ${note._id} into ChromaDB:`, err));
    }

    // ── Auto-Summary: Generate 2-sentence AI summary (Async) ──────
    if (noteData.content && noteData.content.length > 100) {
      (async () => {
        try {
          const { GoogleGenerativeAI } = require('@google/generative-ai');
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

          const snippet = noteData.content.slice(0, 3000); // first 3k chars
          const result = await model.generateContent(
            `Summarize the following study notes in exactly 2 concise sentences. Focus on the most important concept.\n\nNotes:\n${snippet}`
          );
          const summary = result.response.text().trim();
          await Note.findByIdAndUpdate(note._id, { autoSummary: summary });
          console.log(`✅ Auto-summary generated for note: ${note.title}`);
        } catch (err) {
          console.error('Auto-summary failed:', err.message);
        }
      })();
    }

    res.status(201).json({ message: 'Note uploaded successfully', note });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: error.message || 'Upload failed' });
  }
});

// ── GET ALL NOTES ─────────────────────────────────────────────
// GET /api/notes  (Protected)
router.get('/', protect, async (req, res) => {
  try {
    // Find all notes belonging to this user, newest first
    const notes = await Note.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ notes });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notes' });
  }
});

// ── DELETE NOTE ───────────────────────────────────────────────
// DELETE /api/notes/:id  (Protected)
router.delete('/:id', protect, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) return res.status(404).json({ message: 'Note not found' });

    // Delete the physical file if it exists
    if (note.fileUrl) {
      const filePath = path.join(__dirname, '..', note.fileUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await note.deleteOne();

    // ── Sync: Remove all vectors from ChromaDB for this note ──
    deleteNoteFromChroma(note._id)
      .catch(err => console.error(`Failed to delete ChromaDB chunks for note ${note._id}:`, err));

    res.json({ message: 'Note deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Failed to delete note' });
  }
});

module.exports = router;
