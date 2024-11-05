'use strict';

const WebSocket = require('ws');
const http = require('http');
const server = http.createServer();
const express = require('express');
const app = express();
const port = process.env.PORT || 8524;

// Maps to store rooms and room clients
const rooms = new Map();  // room code -> players array
const roomClients = new Map();  // room code -> WebSocket object

// WebSocket Server setup
const wss = new WebSocket.Server({ server });
server.on('request', app);  // Attach express app if needed

// Helper function to generate a 4-letter unique room code
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code;
  do {
    code = Array(4).fill('').map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  } while (rooms.has(code));
  return code;
}

// Helper function to broadcast messages to a room
function broadcastToRoom(roomCode, message) {
  const players = rooms.get(roomCode) || [];
  players.forEach(player => {
    if (player.client.readyState === WebSocket.OPEN) {
      player.client.send(message);
    }
  });
}

// Handle new WebSocket connections
wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => (ws.isAlive = true));

  ws.on('message', (data) => {
    const message = JSON.parse(data);
    let roomCode = message.roomCode ? message.roomCode.toUpperCase() : null;
    let nickname = message.nickname ? message.nickname.toLowerCase() : null;

    switch (message.messageType) {
      case 'CREATE_ROOM_REQUEST':
        roomCode = generateRoomCode();
        rooms.set(roomCode, []);
        roomClients.set(roomCode, ws);
        
        ws.room = roomCode;
        ws.nickname = nickname;
        ws.inGame = true;

        ws.send(JSON.stringify({ messageType: 'ROOM_CREATED_SUCCESS', roomCode }));
        break;

      case 'ROOM_JOIN_REQUEST':
        if (!rooms.has(roomCode)) {
          ws.send(JSON.stringify({ messageType: 'ERROR_INVALID_ROOM', roomCode }));
        } else if (rooms.get(roomCode).some(player => player.nickname === nickname)) {
          ws.send(JSON.stringify({ messageType: 'ERROR_NAME_TAKEN', roomCode, nickname }));
        } else {
          ws.room = roomCode;
          ws.nickname = nickname;
          ws.inGame = true;

          const players = rooms.get(roomCode);
          players.push({ nickname, client: ws });
          rooms.set(roomCode, players);

          const response = {
            messageType: 'PLAYER_JOINED',
            roomCode,
            nickname,
            players: players.map(p => ({ nickname: p.nickname })),
            vip: players.length === 1
          };
          broadcastToRoom(roomCode, JSON.stringify(response));
        }
        break;

      case 'SEND_BROADCAST':
        if (ws.room) {
          broadcastToRoom(ws.room, data);
        }
        break;

      case 'DISCONNECTED':
        if (ws.room) {
          const players = rooms.get(ws.room) || [];
          const index = players.findIndex(player => player.nickname === ws.nickname);
          if (index !== -1) {
            players.splice(index, 1);
            rooms.set(ws.room, players);

            const response = {
              messageType: 'PLAYER_LEFT',
              roomCode: ws.room,
              nickname: ws.nickname
            };
            broadcastToRoom(ws.room, JSON.stringify(response));
          }
        }
        break;

      default:
        console.log(`Unhandled message type: ${message.messageType}`);
    }
  });

  // On client disconnect
  ws.on('close', () => {
    if (ws.room) {
      const players = rooms.get(ws.room) || [];
      const index = players.findIndex(player => player.nickname === ws.nickname);
      if (index !== -1) {
        players.splice(index, 1);
        rooms.set(ws.room, players);

        const response = {
          messageType: 'PLAYER_LEFT',
          roomCode: ws.room,
          nickname: ws.nickname
        };
        broadcastToRoom(ws.room, JSON.stringify(response));
      }
    }
  });
});

// Heartbeat interval to detect dead connections
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 10000);

// Start the server
server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});