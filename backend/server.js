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
        // Connect to MongoDB first
        await connectDB();
        
        // Then start the server
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
        console.log('About to save restaurants. Count:', rankedRestaurants.length);
        console.log('First restaurant to save:', rankedRestaurants[0]);

        const savedRestaurants = await Promise.all(rankedRestaurants.map(async (restaurant, index) => {
            try {
                const uniqueId = `${sessionId}_${index}_${restaurant.Name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
                console.log(`Attempting to save restaurant ${index + 1}/${rankedRestaurants.length}: ${restaurant.Name}`);
                
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
                    wheelchairAccessible: restaurant.WheelchairAccessible,
                    score: restaurant.score || 0,
                    location: restaurant.Location
                });

                const saved = await restaurantDoc.save();
                console.log(`Successfully saved restaurant: ${saved.name} (ID: ${saved.restaurantId})`);
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
        openStatus: restaurant.OpenStatus,
        wheelchairAccessible: restaurant.WheelchairAccessible,
        score: restaurant.score || 0
    };
}

app.get('/api/sessions/:sessionId/restaurants', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const restaurants = await Restaurant.find({ sessionId: sessionId })
            .sort({ score: -1 }) // Sort by score in descending order
            .exec();
        
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
            .sort({ score: -1 }); // Sort by score descending
        
        if (!restaurants || restaurants.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No restaurants found for this session'
            });
        }

        res.json({
            success: true,
            restaurants: restaurants.map(restaurant => ({
                id: restaurant._id,
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

startServer();
