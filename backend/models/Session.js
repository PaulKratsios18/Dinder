// models/Session.js
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  session_id: {
    type: String,
    required: true,
    unique: true,
    default: () => Math.random().toString(36).substr(2, 9) // Generate random ID if none provided
  },
  host_id: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed'],
    default: 'waiting'
  },
  participants: [{
    user_id: String,
    name: String,
    preferences: Object
  }]
});

module.exports = mongoose.model('Session', sessionSchema);