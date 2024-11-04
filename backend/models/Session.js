// models/Session.js
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  code: { 
    type: String, 
    unique: true, 
    required: true 
  },
  hostId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    isHost: { type: Boolean, default: false },
    preferences: {
      cuisine: [String],
      price: Number,
      distance: Number,
      rating: Number
    },
    joinedAt: { type: Date, default: Date.now }
  }],
  status: { 
    type: String, 
    enum: ['waiting', 'active', 'completed', 'canceled'],
    default: 'waiting'
  },
  restaurants_displayed: [String],
  match: String,
  createdAt: { type: Date, default: Date.now },
  lastActivity: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Session', sessionSchema);