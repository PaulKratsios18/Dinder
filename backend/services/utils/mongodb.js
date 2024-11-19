require('dotenv').config({ path: '../../backend/.env' });
const { MongoClient } = require('mongodb');

async function connectToDatabase() {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB in get_restaurants');
        const dbName = process.env.DB_NAME || 'dinder';
        return client.db(dbName);
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

module.exports = { connectToDatabase };
