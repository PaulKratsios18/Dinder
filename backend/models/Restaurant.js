// models/Restaurant.js
const mongoose = require('mongoose');

// Define restaurant schema
const restaurantSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  restaurantId: { type: String, required: true },
  name: { type: String, required: true },
  rating: { type: String, default: '0' },
  price: { type: String, default: '$' },
  distance: { type: String, default: 'Unknown' },
  cuisine: { type: String, default: 'Not specified' },
  address: { type: String, default: 'Address not available' },
  photo: { type: String, default: '/default-restaurant.jpg' },
  openStatus: { type: String, default: 'Unknown' },
  wheelchairAccessible: { type: String, default: 'Unknown' },
  score: { 
    type: Number, 
    required: true,
    default: 0,
    set: v => isNaN(v) ? 0 : v  // Convert NaN to 0
  },
  location: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Documents will be automatically deleted after 24 hours
  },
  openingHours: [String], // Array of strings for weekday_text
  reviewCount: { type: Number, default: 0 },
});

// Create compound unique index
restaurantSchema.index({ sessionId: 1, restaurantId: 1 }, { unique: true });

// Drop old indexes if they exist
async function setupIndexes() {
  try {
    const Restaurant = mongoose.model('Restaurant', restaurantSchema);
    await Restaurant.collection.dropIndexes();
    await Restaurant.collection.createIndex(
      { sessionId: 1, restaurantId: 1 }, 
      { unique: true }
    );
  } catch (error) {
    console.log('Index setup error (can be ignored if first run):', error.message);
  }
}

setupIndexes();

module.exports = mongoose.model('Restaurant', restaurantSchema);