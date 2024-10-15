const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
require('dotenv').config();

dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 3000;

const dbURI = 'mongodb://localhost:27017/dinderdb';

mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected successfully');
}).catch((error) => {
  console.error('MongoDB connection error:', error);
});


// Middleware
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

