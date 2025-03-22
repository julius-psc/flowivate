import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv"; // Optional: for environment variables

// Load environment variables (if using dotenv)
dotenv.config();

const app = express();
const PORT = 5001;

const allowedOrigins = [
  "http://localhost:3000", // Development frontend
  "https://your-production-frontend.com", // Production frontend (example)
];

// CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., Postman) or if origin is in whitelist
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, 
};

// Middleware
app.use(express.json());
app.use(cors(corsOptions)); 

// Register routes


// MongoDB connection
mongoose
  .connect("mongodb://localhost:27017/productivity-dashboard")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});