import mongoose from 'mongoose';

// Get MongoDB URI from environment variable
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

// Mask password for logging
function maskMongoUri(uri: string) {
  return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)[^@]+(@)/, '$1*****$2');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };
    // MONGODB_URI is guaranteed to be a string here
    console.log('[MongoDB] Connecting to:', maskMongoUri(MONGODB_URI!));
    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Export alias for backward compatibility
export default connectToDatabase;
export const connectDB = connectToDatabase; 