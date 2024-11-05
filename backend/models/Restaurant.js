// models/Restaurant.js
const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  restaurant_id: { type: String, unique: true },
  name: String,
  location: { type: [String], coordinates: [Number] },
  cuisines: [String],
  price_range: String,
  rating: Number,
  images: [String],
  cached_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Restaurant', restaurantSchema);