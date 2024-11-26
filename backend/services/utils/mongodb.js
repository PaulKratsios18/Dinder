require('dotenv').config({ path: '../../backend/.env' });
const { MongoClient } = require('mongodb');

/**
 * Establishes connection to MongoDB database
 * @returns {Promise<Db>} MongoDB database instance
 * @throws {Error} If connection fails
 */
async function connectToDatabase() {
    // Get MongoDB connection string from environment variables
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    
    try {
        // Attempt to connect to MongoDB
        await client.connect();
        console.log('Connected to MongoDB in get_restaurants');

        // Get database name from environment variables or use default
        const dbName = process.env.DB_NAME || 'dinder';
        return client.db(dbName);
    } catch (error) {
        // Log and rethrow any connection errors
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

module.exports = { connectToDatabase };
