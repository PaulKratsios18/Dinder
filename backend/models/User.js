// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  roomCode: {
    type: String,
    required: true,
    maxLength: 4
  },
  name: {
    type: String,
    required: true
  },
  preferences: {
    cuisine: [{
      type: String
    }],
    cuisineNoPreference: {
      type: Boolean,
      default: false
    },
    price: [{
      type: String
    }],
    priceNoPreference: {
      type: Boolean,
      default: false
    },
    rating: [{
      type: Number
    }],
    ratingNoPreference: {
      type: Boolean,
      default: false
    },
    distance: {
      type: Number
    },
    distanceNoPreference: {
      type: Boolean,
      default: false
    },
    location: {
      address: String,
      lat: Number,
      lng: Number,
      name: String
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
