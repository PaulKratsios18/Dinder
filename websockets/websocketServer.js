require('dotenv').config();
const WebSocket = require('ws');
const { MongoClient } = require('mongodb');

const port = process.env.WS_PORT || 8080;
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dinder';
let db;

async function startServer() {
  try {
    const client = new MongoClient(mongoUri);
    await client.connect();
    console.log("Connected to MongoDB");
    db = client.db("dinder");

    const server = new WebSocket.Server({ port });
    console.log(`WebSocket server is running on ws://localhost:${port}`);

    server.on('connection', (ws) => {
      console.log('New client connected');
      let currentSessionCode = null;

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data);
          console.log('Received message:', message);

          if (message.type === 'createSession') {
            const sessionCode = generateSessionCode();
            const session = { 
              code: sessionCode,
              createdAt: new Date(),
              active: true,
              participants: [{
                ...message.preferences,
                joinedAt: new Date()
              }]
            };

            try {
              await db.collection("sessions").insertOne(session);
              console.log("Session created in MongoDB:", session);
              ws.send(JSON.stringify({ 
                type: 'sessionCreated', 
                code: sessionCode 
              }));
              
              // Broadcast updated participant list
              broadcastParticipantList(server, sessionCode);
            } catch (error) {
              console.error("Error creating session:", error);
              ws.send(JSON.stringify({ 
                type: 'error', 
                message: 'Failed to create session' 
              }));
            }
          } else if (message.type === 'joinSession') {
            const session = await db.collection("sessions").findOne({ 
              code: message.code,
              active: true 
            });
            
            if (session) {
              currentSessionCode = message.code;
              ws.send(JSON.stringify({ type: 'sessionFound' }));
            } else {
              ws.send(JSON.stringify({ type: 'sessionNotFound' }));
            }
          } else if (message.type === 'addParticipant') {
            try {
              const participant = {
                ...message.preferences,
                joinedAt: new Date()
              };

              await db.collection("sessions").updateOne(
                { code: message.code || currentSessionCode },
                { $push: { participants: participant } }
              );

              // Broadcast updated participant list
              broadcastParticipantList(server, message.code || currentSessionCode);
            } catch (error) {
              console.error("Error adding participant:", error);
              ws.send(JSON.stringify({ 
                type: 'error', 
                message: 'Failed to add participant' 
              }));
            }
          }
        } catch (error) {
          console.error("Error processing message:", error);
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Invalid message format' 
          }));
        }
      });

      ws.on('close', () => {
        console.log('Client disconnected');
      });
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

function generateSessionCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

async function broadcastParticipantList(server, sessionCode) {
  try {
    const session = await db.collection("sessions").findOne(
      { code: sessionCode },
      { projection: { participants: 1 } }
    );

    if (session) {
      const message = JSON.stringify({
        type: 'participantListUpdate',
        participants: session.participants
      });

      server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  } catch (error) {
    console.error("Error broadcasting participant list:", error);
  }
}

startServer();