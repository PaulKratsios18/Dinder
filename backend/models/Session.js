// models/Session.js
const mongoose = require('mongoose');

// Define session schema
const sessionSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        default: () => Math.random().toString(36).substr(2, 9) // Generate random ID if none provided
    },
    hostId: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['waiting', 'active', 'completed'],
        default: 'waiting'
    },
    participants: [{
        userId: String,
        name: String,
        preferences: Object
    }],
    code: {
        type: String,
        required: true,
        unique: true
    }
});

module.exports = mongoose.model('Session', sessionSchema);