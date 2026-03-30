const mongoose = require('mongoose');

const flashcardDeckSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  cards: [{
    front: { type: String, required: true },
    back: { type: String, required: true },
    repetition: { type: Number, default: 0 },
    interval: { type: Number, default: 1 },
    easiness: { type: Number, default: 2.5 },
    nextReview: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('FlashcardDeck', flashcardDeckSchema);
