import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

const options = {
  dbName: "Flowivate", // Explicitly target the Flowivate DB
};

const connectDB = async () => {
  if (!MONGODB_URI) {
    throw new Error("❌ MONGODB_URI environment variable not set");
  }

  if (mongoose.connection.readyState === 1) {
    // 1 = connected
    console.log("✅ MongoDB already connected");
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, options);
    console.log("✅ MongoDB connected to Flowivate DB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
  }
};

export default connectDB;