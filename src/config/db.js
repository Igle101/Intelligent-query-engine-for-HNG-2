const mongoose = require('mongoose');

async function connectDB() {
  try {
    console.log('Attempting MongoDB connection...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection FAILED:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;