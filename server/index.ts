import express from "express";
import mongoose from "mongoose";
import cors from "cors"; // Add CORS

const app = express();
const PORT = 5001;

app.use(express.json());
app.use(cors({ origin: "http://localhost:3000" })); 

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.get("/api/tasks", (req, res) => {
    res.json([
        { id: 1, title: "I bought a property in Egypt" },
        { id: 2, title: "I bought a 2nd property in Egypt" }
      ]);
});

mongoose
  .connect("mongodb://localhost:27017/productivity-dashboard")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});