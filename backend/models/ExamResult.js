const mongoose = require('mongoose');

const examResultSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        topic: {
            type: String,
            required: true,
            trim: true,
        },
        score: {
            type: Number,
            required: true,
            min: 0,
        },
        totalQuestions: {
            type: Number,
            required: true,
            min: 1,
        },
        percentage: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        }
    },
    {
        timestamps: true, // Automatically manages createdAt and updatedAt
    }
);

module.exports = mongoose.model('ExamResult', examResultSchema);
