const express = require('express');
const router = express.Router();

router.post('/api/preferences', async (req, res) => {
  console.log('Received request:', req.body);
  try {
    // Your logic here
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/api/join-preferences', async (req, res) => {
  console.log('Received request:', req.body);
  try {
    // Your logic here
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 