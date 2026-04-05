const mongoose = require('mongoose');

/**
 * Connects to MongoDB. Call once at application startup.
 * @returns {Promise<typeof mongoose>}
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri);
  return mongoose;
}

module.exports = connectDB;
