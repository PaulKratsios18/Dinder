const express = require('express');
const http = require('http');
const path = require('path');
const app = express();

// Serve static files from the public directory (client.html should be in this directory)
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);

// Start listening on a port
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT}`);
});

module.exports = app;
