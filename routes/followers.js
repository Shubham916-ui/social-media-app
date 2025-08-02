const express = require("express");
const User = require("../models/User");
const Follower = require("../models/Follower");
const auth = require("../middleware/auth");
const router = express.Router();

// Follow/Unfollow user
router.post("/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.userId;

    // Can't follow yourself
    if (userId === followerId) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }

    // Check if target user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if already following
    const existingFollow = await Follower.findOne({
      follower: followerId,
      following: userId,
    });

    if (existingFollow) {
      // Unfollow
      await Follower.findByIdAndDelete(existingFollow._id);

      // Update user arrays
      await User.findByIdAndUpdate(followerId, {
        $pull: { following: userId },
      });
      await User.findByIdAndUpdate(userId, {
        $pull: { followers: followerId },
      });

      res.json({ following: false, message: "Unfollowed successfully" });
    } else {
      // Follow
      const newFollow = new Follower({
        follower: followerId,
        following: userId,
      });
      await newFollow.save();

      // Update user arrays
      await User.findByIdAndUpdate(followerId, {
        $push: { following: userId },
      });
      await User.findByIdAndUpdate(userId, {
        $push: { followers: followerId },
      });

      res.json({ following: true, message: "Followed successfully" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get followers of a user
router.get("/:userId/followers", async (req, res) => {
  try {
    const followers = await Follower.find({
      following: req.params.userId,
    }).populate("follower", "username name avatar");

    res.json(followers.map((f) => f.follower));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get following of a user
router.get("/:userId/following", async (req, res) => {
  try {
    const following = await Follower.find({
      follower: req.params.userId,
    }).populate("following", "username name avatar");

    res.json(following.map((f) => f.following));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if user is following another user
router.get("/status/:userId", auth, async (req, res) => {
  try {
    const followRelation = await Follower.findOne({
      follower: req.userId,
      following: req.params.userId,
    });

    res.json({ following: !!followRelation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
