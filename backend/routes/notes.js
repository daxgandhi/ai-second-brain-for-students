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
const { ingestDocumentToChroma } = require('../utils/ragUtils');

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
        noteData.content = pdfData.text; // Store text for AI Chat
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
    res.json({ message: 'Note deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Failed to delete note' });
  }
});

module.exports = router;
