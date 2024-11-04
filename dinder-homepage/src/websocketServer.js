const WebSocket = require('ws');
const { MongoClient } = require('mongodb');

const port = 8080;
const mongoUri = "mongodb+srv://username:password@dinder.1rkof.mongodb.net/?retryWrites=true&w=majority&appName=Dinder";
const client = new MongoClient(mongoUri);
let db;
// Track number of connected clients
let connectedClients = 0;

// Initialize MongoDB connection
async function connectToDB() {
  await client.connect();
  console.log("Connected to MongoDB");
  db = client.db("dinder");
}
connectToDB();

const server = new WebSocket.Server({ port });

server.on('connection', (ws) => {
  connectedClients++;
  console.log('New client connected');

  // Keep track of the session and participants for this connection
  let currentSessionCode = null;

  ws.on('message', async (data) => {
    const message = JSON.parse(data);

    if (message.type === 'createSession') {
      // Create a new session with a unique code
      const sessionCode = generateSessionCode();
      const session = { code: sessionCode };

      await db.collection("sessions").insertOne(session);
      // Track this session for cleanup
      currentSessionCode = sessionCode;
      ws.send(JSON.stringify({ type: 'sessionCreated', code: sessionCode }));

    } else if (message.type === 'joinSession') {
      // Look for the session by code
      const session = await db.collection("sessions").findOne({ code: message.code });
      
      if (session) {
        currentSessionCode = message.code;
        ws.send(JSON.stringify({ type: 'sessionFound', code: message.code }));
      } else {
        ws.send(JSON.stringify({ type: 'sessionNotFound' }));
      }

    } else if (message.type === 'addParticipant') {
      // Add participant to the participants collection
      await db.collection("participants").insertOne({ name: message.name, sessionCode: message.code });

      // Broadcast updated participant list to all connected clients
      const participants = await db.collection("participants").find({ sessionCode: message.code }).toArray();
      const participantNames = participants.map(participant => participant.name);

      server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'participantListUpdate',
            participants: participantNames
          }));
        }
      });
    }
  });

  ws.on('close', async () => {
    connectedClients--;
    console.log('Client disconnected');
    
    if (currentSessionCode) {
      // Clean up session and participants associated with this session
      await db.collection("sessions").deleteOne({ code: currentSessionCode });
      await db.collection("participants").deleteMany({ sessionCode: currentSessionCode });
      
      console.log(`Session ${currentSessionCode} and associated participants deleted.`);
    }

    // If no clients are connected clean up all sessions and participants
    if (connectedClients === 0) {
      await db.collection("sessions").deleteMany({});
      await db.collection("participants").deleteMany({});
      
      console.log('All sessions and participants deleted as no clients are connected.');
    }
  });
});

//Generate a random session code
function generateSessionCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

console.log(`WebSocket server is running on ws://localhost:${port}`);