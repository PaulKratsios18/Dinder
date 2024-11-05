const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const User = require('./models/User');
const Session = require('./models/Session');
const connectDB = require('./config/db');
const preferencesRouter = require('./routes/preferences');
const { Server } = require('socket.io');

dotenv.config();
const app = express();
const server = http.createServer(app);

// Create Socket.IO server with CORS configuration
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json());

// Connect to MongoDB
connectDB();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('joinSession', async ({ roomCode, userName, isHost }) => {
    try {
      console.log(`User ${userName} joining room ${roomCode}`);
      socket.join(roomCode);
      
      // Update session in database
      const session = await Session.findOne({ session_id: roomCode });
      if (session) {
        // Add participant if not already present
        const existingParticipant = session.participants.find(p => p.name === userName);
        if (!existingParticipant) {
          session.participants.push({ name: userName, isHost });
          await session.save();
        }

        // Emit updated participants list to all clients in the room
        const participants = session.participants.map(p => ({
          name: p.name,
          isHost: p.isHost || false
        }));
        
        io.to(roomCode).emit('participantsUpdate', participants);
      }
    } catch (error) {
      console.error('Error in joinSession:', error);
    }
  });

  socket.on('leaveSession', ({ roomCode }) => {
    socket.leave(roomCode);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Existing REST routes
app.post('/api/preferences', async (req, res) => {
  try {
    const { roomCode, name, preferences } = req.body;

    // Create/update user
    const user = new User({
      roomCode,
      name,
      preferences
    });
    const savedUser = await user.save();

    // Add user to existing session
    const session = await Session.findOne({ session_id: roomCode });
    if (!session) {
      throw new Error('Session not found');
    }

    // Update or add participant
    const participantIndex = session.participants.findIndex(p => p.name === name);
    if (participantIndex >= 0) {
      session.participants[participantIndex] = {
        user_id: savedUser.user_id,
        name: savedUser.name,
        preferences: savedUser.preferences
      };
    } else {
      session.participants.push({
        user_id: savedUser.user_id,
        name: savedUser.name,
        preferences: savedUser.preferences
      });
    }

    await session.save();

    res.status(200).json({
      message: 'Preferences saved successfully',
      user: savedUser,
      session: session
    });
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

// New endpoint to create session
app.post('/api/sessions/create', async (req, res) => {
  try {
    const { roomCode, hostName, host_id } = req.body;
    
    const session = new Session({
      session_id: roomCode,
      host_id: host_id,
      status: 'waiting',
      participants: [],
      code: generateUniqueCode(),
      created_at: new Date()
    });

    const savedSession = await session.save();
    console.log('Session created:', savedSession);

    res.status(201).json({
      message: 'Session created successfully',
      session: savedSession
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({
      error: 'Failed to create session',
      details: error.message
    });
  }
});

function generateUniqueCode(length = 4) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

const PORT = process.env.PORT || 5000;
let currentPort = PORT;

const startServer = async () => {
  try {
    await new Promise((resolve, reject) => {
      server.listen(currentPort)
        .once('listening', resolve)
        .once('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            console.log(`Port ${currentPort} is busy, trying ${currentPort + 1}`);
            currentPort++;
            server.listen(currentPort);
          } else {
            reject(err);
          }
        });
    });
    
    console.log(`Server running on http://localhost:${currentPort}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

app.use('/', preferencesRouter);

startServer();
