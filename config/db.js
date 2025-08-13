const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/social-media-app";

    console.log("Attempting to connect to MongoDB...");
    console.log("MongoDB URI:", mongoURI ? "Set" : "Not set");

    await mongoose.connect(mongoURI);
    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);

    // In production (serverless), don't exit the process
    if (process.env.NODE_ENV === "production") {
      console.log("Running in production mode, continuing without database...");
      throw error; // Let the caller handle the error
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
