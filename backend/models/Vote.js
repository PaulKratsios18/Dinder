const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
    sessionId: { type: String, required: true },
    userId: { type: String, required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
    vote: { type: Boolean, required: true }, // true for yes, false for no
    createdAt: { type: Date, default: Date.now }
});

// Compound index for efficient queries
voteSchema.index({ sessionId: 1, userId: 1, restaurantId: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema); 