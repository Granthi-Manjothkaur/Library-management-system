const mongoose = require('mongoose');

// Connects to MongoDB using the address stored in the .env file.
const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is missing. Create a .env file (see .env.example).');
    process.exit(1);
  }
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    console.error('Is MongoDB running? Check MONGO_URI in your .env file.');
    process.exit(1);
  }
};

module.exports = connectDB;
