// Load environment variables
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("./config/db");

const app = express();

// Connect to database with better error handling
const initializeDatabase = async () => {
  try {
    await connectDB();
    console.log("Database initialized successfully");
  } catch (err) {
    console.error("Database connection failed:", err);
    // In serverless environments, we'll retry on each request
  }
};

// Initialize database connection
initializeDatabase();

// Middleware
app.use(
  cors({
    origin: true, // Allow all origins for now
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Middleware to ensure database connection for API routes
app.use("/api", async (req, res, next) => {
  try {
    // Check if mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      console.log("Database not connected, attempting to reconnect...");
      await connectDB();
    }
    next();
  } catch (error) {
    console.error("Database connection middleware error:", error);
    res.status(503).json({
      error: "Database connection failed",
      details: error.message,
    });
  }
});

// Serve everything in public/ at the root URL
app.use(express.static(path.join(__dirname, "public")));

// Simple test endpoint
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!" });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  try {
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      mongodb_uri_set: !!process.env.MONGODB_URI,
      jwt_secret_set: !!process.env.JWT_SECRET,
    });
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({ error: "Health check failed" });
  }
});

// API Routes
app.use("/api/users", require("./routes/users"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/comments", require("./routes/comments"));
app.use("/api/followers", require("./routes/followers"));

// Explicit route for home.html
app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

// Profile page
app.get("/profile", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "profile.html"));
});

// Default route for frontend root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;

// For local development
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;
