// routes/preferences.js
const express = require('express');
const router = express.Router();

// Define preferences route
router.post('/api/preferences', async (req, res) => {
    console.log('Received request:', req.body);
    try {
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Define join preferences route
router.post('/api/join-preferences', async (req, res) => {
    console.log('Received request:', req.body);
    try {
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router; 