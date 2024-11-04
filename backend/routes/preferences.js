const express = require('express');
const app = express();

app.post('/api/preferences', async (req, res) => {
  console.log('Received request:', req.body);
  try {
    // Your logic here
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/join-preferences', async (req, res) => {
  console.log('Received request:', req.body);
  try {
    // Your logic here
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
}); 