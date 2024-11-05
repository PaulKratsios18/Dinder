const express = require('express');
const http = require('http');
const path = require('path');
const app = express();

// Serve static files from the build directory (React app)
app.use(express.static(path.join(__dirname, 'build')));

// Handle all GET requests by returning the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const server = http.createServer(app);

// Start listening on a port
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT}`);
});

module.exports = app;
