// backend/server.js
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
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { getRestaurants } = require('./services/restaurants/get_places_google');
const { rankingAlgorithm } = require('./services/restaurants/ranking_algorithm');
const { getSessionPreferences } = require('./services/restaurants/session_preferences');
const Restaurant = require('./models/Restaurant');
const Vote = require('./models/Vote');
const { handleVote } = require('./services/votes/voteHandler');

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
  // Store userId in socket instance
  const userId = socket.handshake.auth.userId;
  socket.userId = userId;
  console.log('User connected with ID:', userId);

  socket.on('joinSession', async ({ roomCode, userId }) => {
    try {
      console.log(`User joining room ${roomCode} with ID ${userId}`);
      socket.join(roomCode);
      
      // Update session in database
      const session = await Session.findOne({ session_id: roomCode });
      if (session) {
        // Check if user already exists in participants
        const existingParticipant = session.participants.find(p => p.user_id === userId);
        if (!existingParticipant) {
          // Only add if user doesn't exist
          session.participants.push({ user_id: userId });
          await session.save();
        }
        
        io.to(roomCode).emit('participantsUpdate', session.participants);
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

  socket.on('vote', async ({ sessionId, restaurantId, vote, userId }) => {
    const result = await handleVote(sessionId, userId, restaurantId, vote);
    
    if (result.isMatch) {
        io.to(sessionId).emit('matchFound', result.matchData);
    } else if (result.showResults) {
        io.to(sessionId).emit('showResults', {
            topRestaurants: result.topRestaurants,
            hasMatches: result.topRestaurants.length > 0
        });
    } else {
        io.to(sessionId).emit('voteUpdate', {
            restaurantId,
            votes: result.votes
        });
    }
  });

  socket.on('sessionStarted', ({ sessionId }) => {
    // Broadcast to all users in the session
    io.to(sessionId).emit('navigateToRestaurants', { sessionId });
  });
});

// Existing REST routes
app.post('/api/preferences', async (req, res) => {
  try {
    const { roomCode, name, preferences, host_id, userId } = req.body;
    const session = await Session.findOne({ session_id: roomCode });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (host_id) {
      // Host logic remains the same
      session.participants = session.participants.filter(p => p.name !== "Host");
      session.participants.push({
        user_id: host_id,
        name: name,
        preferences: preferences,
        isHost: true
      });
    } else {
      // For non-host participants, use the provided userId
      session.participants.push({
        user_id: userId,
        name: name,
        preferences: preferences,
        isHost: false
      });
    }

    await session.save();

    if (io) {
      io.to(roomCode).emit('participantsUpdate', session.participants);
    }

    res.status(200).json({
      message: 'Preferences saved successfully',
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
      participants: [{
        user_id: host_id,
        name: hostName || 'Host',
        isHost: true
      }],
      code: generateUniqueCode()
    });

    await session.save();
    res.json({ success: true, session });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
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

app.post('/api/sessions/:sessionId/start', async (req, res) => {
    try {
        const { sessionId } = req.params;
        console.log('Starting session:', sessionId);

        // Get preferences from participants
        const userPreferences = await getUserPreferencesFromDB(sessionId);
        console.log('User preferences:', userPreferences);

        // Get all unique cuisines from preferences
        const cuisines = [...new Set(userPreferences
            .flatMap(p => p.preferences.cuisine)
            .filter(c => c))];

        console.log('Raw preferences cuisines:', userPreferences.map(p => p.preferences.cuisine));
        console.log('Filtered unique cuisines:', cuisines);

        if (cuisines.length === 0) {
            cuisines.push('restaurant'); // Default search if no cuisines specified
        }

        console.log('Searching for cuisines:', cuisines);

        // Get restaurants for each cuisine
        let allRestaurants = [];
        for (const cuisine of cuisines) {
            console.log(`Attempting to fetch restaurants for cuisine: ${cuisine}`);
            console.log('Using location:', userPreferences[0].preferences.location);

            const restaurants = await getRestaurants(
                userPreferences[0].preferences.location,
                5000,
                [cuisine]
            );
            console.log(`Results for ${cuisine}:`, restaurants ? restaurants.length : 0, 'restaurants');
            if (restaurants && restaurants.length > 0) {
                console.log('First restaurant example:', restaurants[0]);
            }

            if (restaurants && restaurants.length > 0) {
                allRestaurants = [...allRestaurants, ...restaurants];
            }
        }

        // Remove duplicates based on place ID
        const uniqueRestaurants = Array.from(
            new Map(allRestaurants.map(r => [r.PlaceId, r])).values()
        );

        console.log('Total restaurants before deduplication:', allRestaurants.length);
        console.log('Unique restaurants after deduplication:', uniqueRestaurants.length);

        if (uniqueRestaurants.length === 0) {
            throw new Error('No restaurants found for the given preferences');
        }

        console.log(`Found ${uniqueRestaurants.length} unique restaurants`);

        // 4. Rank restaurants
        const rankedRestaurants = await rankingAlgorithm(
            uniqueRestaurants,
            userPreferences,
            userPreferences[0].preferences.location
        );

        // 5. Save restaurants to database
        const savedRestaurants = await Promise.all(rankedRestaurants.map(async (restaurant, index) => {
            try {
                const uniqueId = `${sessionId}_${index}_${restaurant.Name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
                
                const restaurantDoc = new Restaurant({
                    sessionId: sessionId,
                    restaurantId: uniqueId,
                    name: restaurant.Name,
                    rating: restaurant.Rating,
                    price: restaurant.Price,
                    distance: restaurant.distance || 'Unknown',
                    cuisine: restaurant.Cuisine,
                    address: restaurant.Address,
                    photo: restaurant.Photos?.[0] || '/default-restaurant.jpg',
                    openStatus: restaurant.OpenStatus,
                    openingHours: restaurant.OpeningHours || [],
                    wheelchairAccessible: restaurant.WheelchairAccessible,
                    score: restaurant.score || 0,
                    location: restaurant.Location
                });

                const saved = await restaurantDoc.save();
                console.log(`Saved restaurant: ${saved.name} with ID: ${saved.restaurantId}`);
                return saved;
            } catch (error) {
                console.error('Error saving restaurant:', error);
                return null;
            }
        }));

        // Filter out failed saves
        const validRestaurants = savedRestaurants.filter(r => r !== null);

        // 6. Update session status
        await Session.findOneAndUpdate(
            { session_id: sessionId },
            { 
                status: 'active',
                restaurants: validRestaurants.map(r => r._id)
            }
        );

        console.log(`Successfully saved ${validRestaurants.length} restaurants for session ${sessionId}`);

        res.json({
            success: true,
            message: `Successfully started session with ${validRestaurants.length} restaurants`,
            restaurantCount: validRestaurants.length
        });

    } catch (error) {
        console.error('Error in start session endpoint:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to start session'
        });
    }
});

async function getUserPreferencesFromDB(sessionId) {
    try {
        const session = await Session.findOne({ session_id: sessionId });
        if (!session || !session.participants) {
            throw new Error('Session or participants not found');
        }
        
        // Filter participants that have preferences and format them
        const participantsWithPreferences = session.participants
            .filter(p => p.preferences)
            .map(p => ({
                name: p.name,
                preferences: {
                    cuisine: p.preferences.cuisine || [],
                    price: p.preferences.price || ['$'],
                    rating: p.preferences.rating || [3],
                    distance: p.preferences.distance || 5000,
                    location: p.preferences.location || {
                        lat: 42.7284,
                        lng: -73.6918
                    }
                }
            }));
        
        if (participantsWithPreferences.length === 0) {
            throw new Error('No participants with preferences found');
        }

        console.log('Formatted preferences:', participantsWithPreferences);
        return participantsWithPreferences;
    } catch (error) {
        console.error('Error getting user preferences:', error);
        throw error;
    }
}

function consolidatePreferences(participants) {
    return participants.map(participant => ({
        name: participant.name,
        preferences: {
            cuisines: participant.preferences.cuisine || [],
            price: participant.preferences.price || [1],
            rating: participant.preferences.rating || [3],
            distance: participant.preferences.distance || 5000,
            location: participant.preferences.location || {
                lat: 42.7284,
                lng: -73.6918
            }
        }
    }));
}

function formatRestaurantForTemplate(restaurant) {
    return {
        id: restaurant._id || Math.random().toString(36).substr(2, 9),
        name: restaurant.Name,
        rating: restaurant.Rating,
        price: restaurant.Price,
        distance: restaurant.Distance || 'Distance unknown',
        cuisine: restaurant.Cuisine,
        address: restaurant.Address,
        photo: restaurant.Photos?.[0] || 'default-restaurant-image.jpg',
        openStatus: restaurant.openStatus,
        wheelchairAccessible: restaurant.WheelchairAccessible,
        score: restaurant.score || 0
    };
}

app.get('/api/sessions/:sessionId/restaurants', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const restaurants = await Restaurant.find({ sessionId });
        
        res.json({
            success: true,
            restaurants
        });
    } catch (error) {
        console.error('Error fetching restaurants:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch restaurants',
            details: error.message
        });
    }
});

app.get('/api/sessions/:sessionId/ranked-restaurants', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const restaurants = await Restaurant.find({ sessionId })
            .sort({ score: -1 })
            .limit(20);
        
        if (!restaurants || restaurants.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No restaurants found for this session'
            });
        }

        res.json({
            success: true,
            restaurants: restaurants.map(restaurant => ({
                _id: restaurant._id,
                name: restaurant.name,
                rating: restaurant.rating,
                price: restaurant.price,
                distance: restaurant.distance,
                cuisine: restaurant.cuisine,
                address: restaurant.address,
                photo: restaurant.photo,
                openStatus: restaurant.openStatus,
                wheelchairAccessible: restaurant.wheelchairAccessible,
                score: restaurant.score
            }))
        });
    } catch (error) {
        console.error('Error fetching ranked restaurants:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch restaurants',
            details: error.message
        });
    }
});

app.post('/api/sessions/:sessionId/vote', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { userId, restaurantId, vote } = req.body;

        const voteDoc = new Vote({
            sessionId,
            userId,
            restaurantId,
            vote
        });

        await voteDoc.save();

        res.json({
            success: true,
            message: 'Vote recorded successfully'
        });
    } catch (error) {
        console.error('Error recording vote:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to record vote',
            details: error.message
        });
    }
});

// Add this new endpoint to get session participants
app.get('/api/sessions/:roomCode/participants', async (req, res) => {
  try {
    const session = await Session.findOne({ session_id: req.params.roomCode });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.status(200).json({
      participants: session.participants,
      status: session.status
    });
  } catch (error) {
    console.error('Error getting session participants:', error);
    res.status(500).json({
      error: 'Failed to get session participants',
      details: error.message
    });
  }
});

startServer();

