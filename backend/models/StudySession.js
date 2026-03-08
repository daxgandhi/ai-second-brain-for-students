const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        topic: {
            type: String,
            default: 'General Study',
        },
        durationMinutes: {
            type: Number,
            required: true,
            min: 0,
        },
        // Optional details that might be useful for analytics later
        notesGenerated: {
            type: Number,
            default: 0
        },
        flashcardsReviewed: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true, // Automatically manages createdAt and updatedAt
    }
);

module.exports = mongoose.model('StudySession', studySessionSchema);
