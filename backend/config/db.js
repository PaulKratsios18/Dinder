const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables from .env file

// Connect to MongoDB using credentials from .env file
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI.replace(
      '<db_username>',
      process.env.DB_USERNAME
    ).replace(
      '<db_password>',
      process.env.DB_PASSWORD
    );

    console.log('Attempting to connect to MongoDB...');
    console.log('Database name:', uri.split('/').pop().split('?')[0]);

    await mongoose.connect(uri);
    console.log('Connected to database:', mongoose.connection.name);

    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;