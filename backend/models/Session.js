// models/Session.js
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  session_id: {
    type: String,
    required: true,
    unique: true
  },
  host_id: String,
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
    preferences: Object,
    isHost: Boolean
  }],
  restaurants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant'
  }]
});

// Drop the old index if it exists when the application starts
const Session = mongoose.model('Session', sessionSchema);

async function dropOldIndex() {
  try {
    await Session.collection.dropIndex('code_1');
    console.log('Successfully dropped old code index');
  } catch (error) {
    // If the index doesn't exist, that's fine
    if (error.code !== 27) {
      console.error('Error dropping index:', error);
    }
  }
}

// Call this when the model is loaded
dropOldIndex();

module.exports = Session;