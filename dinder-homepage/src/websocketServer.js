require('dotenv').config();
const WebSocket = require('ws');
const { MongoClient } = require('mongodb');

const port = process.env.WS_PORT || 8080;
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dinder';
let db;
let connectedClients = 0;

// Initialize MongoDB connection with error handling
async function startServer() {
  try {
    const client = new MongoClient(mongoUri);
    await client.connect();
    console.log("Connected to MongoDB");
    db = client.db("dinder");

    // Only start WebSocket server after MongoDB connection is established
    const server = new WebSocket.Server({ port });
    console.log(`WebSocket server is running on ws://localhost:${port}`);

    server.on('connection', (ws) => {
      connectedClients++;
      console.log('New client connected');

      // Keep track of the session and participants for this connection
      let currentSessionCode = null;

      ws.on('message', async (data) => {
        const message = JSON.parse(data);

        if (message.type === 'createSession') {
          const sessionCode = generateSessionCode();
          const session = { 
            session_id: generateSessionCode(),
            code: sessionCode,
            participantCount: 0,
            createdAt: new Date(),
            active: true
          };
          try {
            await db.collection("sessions").insertOne(session);
            console.log("Session created in MongoDB:", session);
          } catch (error) {
            console.error("Error creating session:", error);
          }
          currentSessionCode = sessionCode;
          ws.send(JSON.stringify({ type: 'sessionCreated', code: sessionCode }));
          
          // Broadcast updated sessions list to all clients
          await broadcastActiveSessions(server);
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
          await db.collection("participants").insertOne({
            name: message.name,
            sessionCode: message.code || currentSessionCode
          });

          // Update participant count in session
          await db.collection("sessions").updateOne(
            { code: message.code || currentSessionCode },
            { $inc: { participantCount: 1 } }
          );

          // Get participants only for this session
          const participants = await db.collection("participants")
            .find({ sessionCode: message.code || currentSessionCode })
            .toArray();
          const participantNames = participants.map(p => p.name);

          // Broadcast updated sessions list to all clients
          await broadcastActiveSessions(server);

          // Send participant list only to clients in this session
          server.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'participantListUpdate',
                sessionCode: message.code || currentSessionCode,
                participants: participantNames
              }));
            }
          });
        } else if (message.type === 'deactivateSession') {
          await db.collection("sessions").updateOne(
            { code: message.code },
            { $set: { active: false } }
          );
          await broadcastActiveSessions(server);
        }
      });

      ws.on('close', async () => {
        connectedClients--;
        console.log('Client disconnected');
        
        if (currentSessionCode) {
            // Update participant count when client disconnects
            await db.collection("sessions").updateOne(
                { code: currentSessionCode },
                { $inc: { participantCount: -1 } }
            );
            await broadcastActiveSessions(server);
        }
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

async function broadcastActiveSessions(server) {
  const sessions = await db.collection("sessions")
    .find({ active: true })
    .project({ code: 1, participantCount: 1, _id: 0 })
    .toArray();

  server.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'activeSessionsUpdate',
        sessions: sessions
      }));
    }
  });
}

startServer();