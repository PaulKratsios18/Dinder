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
  console.log('A user connected');

  socket.on('joinSession', async ({ roomCode, userName, isHost, hostId }) => {
    try {
      console.log('=== Join Session Request ===');
      console.log('Room Code:', roomCode);
      console.log('User Name:', userName);
      console.log('Is Host:', isHost);
      console.log('Host ID:', hostId);
      
      socket.join(roomCode);
      
      const session = await Session.findOne({ session_id: roomCode });
      
      if (session) {
        if (isHost) {
          // Check if this host already has a named entry (e.g., 'paul')
          const existingHost = session.participants.find(p => 
            p.user_id === hostId && p.preferences
          );
          
          if (!existingHost) {
            // Only add temporary host entry if no named entry exists
            const hasNamedHost = session.participants.some(p => 
              p.isHost && p.preferences
            );
            
            if (!hasNamedHost) {
              console.log('Adding temporary host entry');
              session.participants.push({ 
                name: userName, 
                user_id: hostId,
                isHost: true 
              });
              await session.save();
            }
          }
        } else {
          // Non-host participant logic remains the same
          if (!session.participants.find(p => p.name === userName)) {
            const userId = `user_${Math.random().toString(36).substr(2, 9)}`;
            console.log('Adding new participant:', userName, 'with ID:', userId);
            session.participants.push({ 
              name: userName,
              user_id: userId, 
              isHost: false 
            });
            socket.emit('userIdAssigned', { userId });
            await session.save();
          }
        }

        // Emit updated participants list
        const participants = session.participants.map(p => ({
          name: p.name,
          isHost: p.isHost || false,
          user_id: p.user_id
        }));
        
        console.log('Broadcasting updated participants:', participants);
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

  socket.on('submitVote', async ({ sessionId, userId, restaurantId, vote }) => {
    console.log('Received vote:', { sessionId, userId, restaurantId, vote });
    try {
        const result = await handleVote(sessionId, userId, restaurantId, vote);
        console.log('Vote handler result:', result);
        
        // Broadcast vote update to all users in the session
        io.to(sessionId).emit('voteUpdate', {
            restaurantId,
            votes: result.votes
        });
        console.log('Emitted voteUpdate:', {
            restaurantId,
            votes: result.votes
        });

        // If there's a match, notify all users with complete data
        if (result.isMatch && result.matchData) {
            console.log('Emitting matchFound event with data:', result.matchData);
            io.to(sessionId).emit('matchFound', result.matchData);
        }
    } catch (error) {
        console.error('Error handling vote:', error);
        socket.emit('error', { message: 'Failed to process vote' });
    }
  });
});

// Existing REST routes
app.post('/api/preferences', async (req, res) => {
  try {
    const { roomCode, name, preferences, host_id, user_id } = req.body;
    console.log('=== Saving Preferences ===');
    console.log('Room Code:', roomCode);
    console.log('User Name:', name);
    console.log('Is Host:', !!host_id);
    console.log('User ID:', user_id || host_id);
    console.log('Preferences:', preferences);

    const session = await Session.findOne({ session_id: roomCode });
    
    if (!session) {
      throw new Error('Session not found');
    }

    if (host_id) {
      // Update or replace host entry
      const hostIndex = session.participants.findIndex(p => p.user_id === host_id);
      if (hostIndex !== -1) {
        // Update existing host
        session.participants[hostIndex] = {
          user_id: host_id,
          name: name,  // Update to new name (paul)
          preferences: preferences,
          isHost: true
        };
      } else {
        // Add new host entry
        session.participants.push({
          user_id: host_id,
          name: name,
          preferences: preferences,
          isHost: true
        });
      }
      // Remove any temporary "Host" entries
      session.participants = session.participants.filter(p => 
        p.name !== 'Host' || p.user_id === host_id
      );
    }

    await session.save();
    console.log('Updated session participants:', 
      session.participants.map(p => ({
        name: p.name,
        isHost: p.isHost,
        user_id: p.user_id,
        hasPreferences: !!p.preferences
      }))
    );

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
      success: false,
      error: error.message || 'Failed to save preferences'
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
        console.log('\n=== Creating New Session ===');
        console.log('Request body:', req.body);
        
        const sessionCode = req.body.roomCode || generateSessionCode();
        const { hostName, host_id } = req.body;
        
        // Create new session with single code
        const session = new Session({
            session_id: sessionCode,
            host_id: host_id,
            created_at: new Date(),
            status: 'waiting',
            participants: []
        });

        const savedSession = await session.save();
        console.log('Created single session:', {
            sessionId: savedSession.session_id,
            hostId: savedSession.host_id
        });

        res.status(201).json({
            success: true,
            session: savedSession
        });
    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create session'
        });
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

        // Broadcast session start to all participants
        io.to(sessionId).emit('sessionStarted', {
            success: true,
            sessionId: sessionId
        });

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
