const express = require('express');
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dinder';

// Middleware
app.use(express.json());

async function startServer() {
    try {
        const client = new MongoClient(mongoUri);
        await client.connect();
        console.log("MongoDB connected");
        const db = client.db("dinder");

        // Drop the problematic index if it exists
        try {
            await db.collection("sessions").dropIndex("session_id_1");
        } catch (err) {
            // Index might not exist, that's okay
        }

        // Add routes that can access the db
        app.get('/sessions', async (req, res) => {
            try {
                const sessions = await db.collection("sessions")
                    .find({})
                    .toArray();
                console.log("Current sessions in DB:", sessions);
                res.json(sessions);
            } catch (error) {
                console.error("Error fetching sessions:", error);
                res.status(500).json({ error: "Failed to fetch sessions" });
            }
        });

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
}

startServer();
