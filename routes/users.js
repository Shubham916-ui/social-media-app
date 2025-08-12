const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth"); // Authentication middleware
const router = express.Router();

const JWT_SECRET = "your-secret-key"; // Production mein environment variable use kariye

// Register user
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, name, bio } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const user = new User({ username, email, password, name, bio }); // avatar will default via schema
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: "User created successfully",
      user: userResponse,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      token,
      user: userResponse,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("followers", "username name")
      .populate("following", "username name");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// **NEW ROUTES ADDED BELOW:**

// Get current user profile (authenticated)
router.get("/profile/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("-password")
      .populate("followers", "username name avatar")
      .populate("following", "username name avatar");

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put("/:id", auth, async (req, res) => {
  try {
    const { name, bio, avatar } = req.body;

    // Check if user is updating their own profile
    if (req.params.id !== req.userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this profile" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, bio, avatar },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Search users by username or name
router.get("/search/:query", async (req, res) => {
  try {
    const query = req.params.query;

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
      ],
    })
      .select("-password")
      .limit(20);

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user statistics
router.get("/:id/stats", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Count posts by this user (assuming Post model exists)
    const Post = require("../models/Post");
    const postsCount = await Post.countDocuments({ user: req.params.id });

    const stats = {
      postsCount,
      followersCount: user.followers.length,
      followingCount: user.following.length,
      joinedDate: user.createdAt,
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change password
router.put("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete user account
router.delete("/:id", auth, async (req, res) => {
  try {
    // Check if user is deleting their own account
    if (req.params.id !== req.userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this account" });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify token (useful for frontend authentication check)
router.get("/verify-token", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    res.json({ valid: true, user });
  } catch (error) {
    res.status(401).json({ valid: false, error: "Invalid token" });
  }
});

module.exports = router;
