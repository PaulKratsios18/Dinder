// backend/websocket/websocketServer.js
const WebSocket = require('ws');
const { mongoose } = require('mongoose');
const Session = require('../models/Session');
const User = require('../models/User');

class WebSocketServer {
    constructor(server) {
        this.wss = new WebSocket.Server({ server });
        this.sessions = new Map(); // Track active sessions
        this.initialize();
    }

    initialize() {
        this.wss.on('connection', (ws) => {
            console.log('New client connected');

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

            ws.on('close', () => {
                this.handleDisconnect(ws);
            });
        });
    }

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

    async handleCreateSession(ws, message) {
        try {
            const sessionCode = this.generateSessionCode();
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

    async handleJoinSession(ws, message) {
        const { sessionCode, userId, userName } = message;
        const sessionData = this.sessions.get(sessionCode);

        if (!sessionData) {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Session not found'
            }));
            return;
        }

        try {
            const session = await Session.findOneAndUpdate(
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

            ws.sessionCode = sessionCode;
            ws.userId = userId;
            sessionData.connections.add(ws);

            // Broadcast to all participants
            this.broadcastToSession(sessionCode, {
                type: 'participantJoined',
                session: session.toObject()
            });
        } catch (error) {
            console.error('Error joining session:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to join session'
            }));
        }
    }

    async handleUpdatePreferences(ws, message) {
        const { sessionCode, userId, preferences } = message;
        
        try {
            await Session.updateOne(
                { 
                    code: sessionCode,
                    'participants.userId': userId 
                },
                { 
                    $set: { 
                        'participants.$.preferences': preferences 
                    }
                }
            );

            const session = await Session.findOne({ code: sessionCode });
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

    handleDisconnect(ws) {
        if (ws.sessionCode) {
            const sessionData = this.sessions.get(ws.sessionCode);
            if (sessionData) {
                sessionData.connections.delete(ws);
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

    broadcastToSession(sessionCode, message) {
        const sessionData = this.sessions.get(sessionCode);
        if (sessionData) {
            sessionData.connections.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(message));
                }
            });
        }
    }

    generateSessionCode() {
        return Math.floor(1000 + Math.random() * 9000).toString();
    }
}

module.exports = WebSocketServer;