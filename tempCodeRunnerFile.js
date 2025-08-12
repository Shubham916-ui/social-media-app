const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// MongoDB connection and event loggers
mongoose
  .connect("mongodb://127.0.0.1:27017/social-media-app")
  .then(() => {
    console.log("✅ MongoDB Connected");

    // Load your routes ONLY after DB is connected!
    app.use("/api/users", require("./routes/users"));
    app.use("/api/posts", require("./routes/posts"));
    // Serve profile page
    app.get("/profile", (req, res) => {
      res.sendFile(path.join(__dirname, "public", "profile.html"));
    });

    // Explicit home
    app.get("/home", (req, res) => {
      res.sendFile(path.join(__dirname, "public", "home.html"));
    });

    app.use("/api/comments", require("./routes/comments"));

    // Start server after DB connects
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
  });

mongoose.connection.on("open", () => {
  console.log("🟢 Mongoose connection OPEN event");
});
mongoose.connection.on("error", (err) => {
  console.log("🔴 Mongoose connection error event:", err.message);
});

// Optional: You can still have your root status route
app.get("/", (req, res) => {
  res.send("API is working! 🚀");
});
