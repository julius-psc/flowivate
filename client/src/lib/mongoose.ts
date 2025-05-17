import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";
const MONGODB_DB  = process.env.MONGODB_DB; 

if (!MONGODB_URI) {
  throw new Error("❌ MONGODB_URI environment variable not set");
}
if (!MONGODB_DB) {
  throw new Error("❌ MONGODB_DB environment variable not set");
}

const options = {
  dbName: MONGODB_DB,  
};

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    console.log("✅ MongoDB already connected");
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, options);
    console.log(`✅ MongoDB connected to ${MONGODB_DB} DB`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
};

export default connectDB;