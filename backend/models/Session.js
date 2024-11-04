
// models/Session.js
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  session_id: { type: String, unique: true },
  session_code: String,
  creator_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  restaurants_displayed: [String],
  status: { type: String, enum: ['active', 'completed', 'canceled'] },
  match: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Session', sessionSchema);
