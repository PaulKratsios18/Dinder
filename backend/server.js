const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const User = require('./models/User');
const Session = require('./models/Session');
const connectDB = require('./config/db');

dotenv.config();
const app = express();
const server = http.createServer(app);

// WebSocket Server
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Connect to MongoDB
connectDB().then(() => {
  console.log('MongoDB connected successfully');
}).catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1); // Exit the process if MongoDB connection fails
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New client connected');
  
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'createSession':
          const sessionCode = generateSessionCode();
          const session = new Session({
            code: sessionCode,
            participants: [{
              name: message.hostName,
              isHost: true
            }],
            status: 'waiting'
          });
          
          await session.save();
          ws.sessionCode = sessionCode;
          
          ws.send(JSON.stringify({
            type: 'sessionCreated',
            code: sessionCode
          }));
          break;
          
        case 'joinSession':
          const existingSession = await Session.findOne({ 
            code: message.code,
            status: 'waiting'
          });
          
          if (existingSession) {
            existingSession.participants.push({
              name: message.name,
              isHost: false
            });
            await existingSession.save();
            
            ws.sessionCode = message.code;
            
            // Broadcast to all clients in this session
            wss.clients.forEach((client) => {
              if (client.sessionCode === message.code) {
                client.send(JSON.stringify({
                  type: 'participantJoined',
                  participants: existingSession.participants
                }));
              }
            });
          } else {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Session not found'
            }));
          }
          break;
      }
    } catch (error) {
      console.error('WebSocket error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Internal server error'
      }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    // Handle participant removal if needed
  });
});

// Existing REST routes
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
      res.status(500).json({ 
        error: 'Failed to save user',
        details: saveError.message
      });
    }
  } catch (error) {
    console.error('Error saving preferences:', error);
    res.status(500).json({ 
      error: 'Failed to save preferences',
      details: error.message
    });
  }
});

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

function generateSessionCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
