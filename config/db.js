const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/social-media-app";

    console.log("Attempting to connect to MongoDB...");
    console.log("MongoDB URI:", mongoURI ? "Set" : "Not set");

    // MongoDB connection options optimized for serverless
    const options = {
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 5, // Maintain a minimum of 5 socket connections
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
    };

    // Set mongoose-specific options for serverless
    mongoose.set("bufferCommands", false);

    await mongoose.connect(mongoURI, options);
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
