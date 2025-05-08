import mongoose, { Mongoose } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env'
  );
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseConnection: { conn: Mongoose | null; promise: Promise<Mongoose> | null };
}

let cached = global.mongooseConnection;
if (!cached) {
  cached = global.mongooseConnection = { conn: null, promise: null };
}

async function connectDB(): Promise<Mongoose> {
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    const opts = { bufferCommands: false };
    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
      console.log("Mongoose connected successfully for custom logic!");
      return mongooseInstance;
    }).catch(err => {
        console.error("Mongoose connection error for custom logic:", err);
        cached.promise = null;
        throw err;
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
export default connectDB;