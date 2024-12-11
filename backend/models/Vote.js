const mongoose = require('mongoose');

// Define vote schema
const voteSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        index: true
    },
    restaurantId: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    vote: {
        type: Boolean,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Compound index for efficient querying
voteSchema.index({ sessionId: 1, restaurantId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema); 