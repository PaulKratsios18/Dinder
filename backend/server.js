const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();
const app = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.post('/api/preferences', async (req, res) => {
  console.log('Received request body:', req.body);

  try {
    const {
      roomCode,
      name,
      preferences
    } = req.body;

    if (!roomCode || !name) {
      return res.status(400).json({ 
        error: 'Room code and name are required'
      });
    }

    console.log('Creating user with:', { roomCode, name, preferences });

    const user = new User({
      roomCode,
      name,
      preferences
    });

    console.log('User model created:', user);

    try {
      const savedUser = await user.save();
      console.log('User saved successfully:', savedUser);
      
      // Verify the save by fetching it back
      const verifiedUser = await User.findById(savedUser._id);
      console.log('Verified user exists:', verifiedUser);

      res.status(201).json({ 
        message: 'Preferences saved successfully',
        user: savedUser
      });
    } catch (saveError) {
      console.error('Error during save operation:', saveError);
      throw saveError;
    }
  } catch (error) {
    console.error('Error saving preferences:', error);
    res.status(500).json({ 
      error: 'Failed to save preferences',
      details: error.message
    });
  }
});

// Get all users in a room
app.get('/api/room/:roomCode/users', async (req, res) => {
  try {
    const { roomCode } = req.params;
    const users = await User.find({ roomCode });
    res.json(users);
  } catch (error) {
    console.error('Error fetching room users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Add a test route to verify database access
app.get('/api/test', async (req, res) => {
  try {
    const users = await User.find({});
    res.json({ 
      message: 'Database connection test successful',
      userCount: users.length,
      users: users
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ error: 'Database test failed' });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});