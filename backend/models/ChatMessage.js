const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        chatType: {
            type: String,
            required: true,
            enum: ['ai_chat', 'rag_chat'],
            index: true
        },
        role: {
            type: String,
            required: true,
            enum: ['user', 'ai']
        },
        text: {
            type: String,
            required: true,
        },
        contextUsed: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true, // Automatically manages createdAt and updatedAt
    }
);

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
