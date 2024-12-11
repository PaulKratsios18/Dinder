// backend/websocket/websocketServer.js
const WebSocket = require('ws');
const { mongoose } = require('mongoose');
const Session = require('../models/Session');
const User = require('../models/User');

// Define WebSocketServer class
class WebSocketServer {
    constructor(server) {
        this.wss = new WebSocket.Server({ server });
        this.sessions = new Map(); // Track active sessions
        this.initialize();
    }

    // Initialize WebSocket server
    initialize() {
        this.wss.on('connection', (ws) => {
            console.log('New client connected');

            // Handle incoming messages
            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data);
                    await this.handleMessage(ws, message);
                } catch (error) {
                    console.error('Error handling message:', error);
                    ws.send(JSON.stringify({ 
                        type: 'error', 
                        message: 'Failed to process message' 
                    }));
                }
            });

            // Handle disconnect
            ws.on('close', () => {
                this.handleDisconnect(ws);
            });
        });
    }

    // Handle incoming messages
    async handleMessage(ws, message) {
        switch (message.type) {
        case 'createSession':
            await this.handleCreateSession(ws, message);
            break;
        case 'joinSession':
            await this.handleJoinSession(ws, message);
            break;
        case 'updatePreferences':
            await this.handleUpdatePreferences(ws, message);
            break;
        case 'leaveSession':
            await this.handleLeaveSession(ws, message);
            break;
        }
    }

    // Handle create session
    async handleCreateSession(ws, message) {
        try {
            // Generate session code
            const sessionCode = this.generateSessionCode();
            // Create new session
            const session = new Session({
                code: sessionCode,
                hostId: message.userId,
                participants: [{
                    userId: message.userId,
                    name: message.userName,
                    isHost: true
                }],
                status: 'waiting',
                createdAt: new Date()
            });

            await session.save();
            
            ws.sessionCode = sessionCode;
            ws.userId = message.userId;
            
            this.sessions.set(sessionCode, {
                session,
                connections: new Set([ws])
            });

            ws.send(JSON.stringify({
                type: 'sessionCreated',
                sessionCode,
                session: session.toObject()
            }));
        } catch (error) {
            console.error('Error creating session:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to create session'
            }));
        }
    }

    // Handle join session
    async handleJoinSession(ws, message) {
        // Extract session code, user ID, and user name from message
        const { sessionCode, userId, userName } = message;
        
        try {
            // Check session status before allowing join
            const session = await Session.findOne({ code: sessionCode });
            
            // Check if session exists
            if (!session) {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Session not found'
                }));
                return;
            }

            // Check session status
            if (session.status !== 'waiting') {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: session.status === 'active' ? 
                        'Session already in progress' : 
                        'Session has ended'
                }));
                return;
            }

            // Update session with new participant
            const updatedSession = await Session.findOneAndUpdate(
                { code: sessionCode },
                { 
                    $addToSet: { 
                        participants: {
                            userId,
                            name: userName,
                            isHost: false
                        }
                    }
                },
                { new: true }
            );

            // Set session code and user ID
            ws.sessionCode = sessionCode;
            ws.userId = userId;
            
            // Broadcast to all participants
            this.broadcastToSession(sessionCode, {
                type: 'participantJoined',
                session: updatedSession.toObject()
            });
        } catch (error) {
            console.error('Error joining session:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to join session'
            }));
        }
    }

    // Handle update preferences
    async handleUpdatePreferences(ws, message) {
        // Extract session code, user ID, and preferences from message
        const { sessionCode, userId, preferences } = message;
        
        try {
            // Update session preferences for the user
            await Session.updateOne(
                { 
                    sessionId: sessionCode,
                    'participants.userId': userId 
                },
                { 
                    $set: { 
                        'participants.$.preferences': preferences 
                    }
                }
            );

            // Get the updated session
            const session = await Session.findOne({ sessionId: sessionCode });
            
            // Broadcast the updated preferences to all participants in the session
            this.broadcastToSession(sessionCode, {
                type: 'preferencesUpdated',
                session: session.toObject()
            });
        } catch (error) {
            console.error('Error updating preferences:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to update preferences'
            }));
        }
    }

    // Handle disconnect
    handleDisconnect(ws) {
        // Check if the client is associated with a session
        if (ws.sessionCode) {
            // Get session data
            const sessionData = this.sessions.get(ws.sessionCode);

            // Remove the client from the session connections
            if (sessionData) {
                sessionData.connections.delete(ws);

                // If no more clients in the session, delete the session
                if (sessionData.connections.size === 0) {
                    this.sessions.delete(ws.sessionCode);
                } else {
                    this.broadcastToSession(ws.sessionCode, {
                        type: 'participantLeft',
                        userId: ws.userId
                    });
                }
            }
        }
    }

    // Broadcast to session
    broadcastToSession(sessionCode, message) {
        // Get session data
        const sessionData = this.sessions.get(sessionCode);

        // Broadcast message to all clients in the session
        if (sessionData) {
            sessionData.connections.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(message));
                }
            });
        }
    }

    // Generate session code
    generateSessionCode() {
        return Math.floor(1000 + Math.random() * 9000).toString();
    }
}

module.exports = WebSocketServer;