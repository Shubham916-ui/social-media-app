const express = require("express");
const Post = require("../models/Post");
const User = require("../models/User");
// const auth = require('../middleware/auth'); // Comment out this line
const router = express.Router();

// Get all posts (no auth needed)
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "username name avatar")
      .populate("likes", "username")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new post (temporarily without auth)
router.post("/", async (req, res) => {
  try {
    const { content, image, user } = req.body; // Add user in body temporarily

    const post = new Post({
      content,
      image,
      user, // Get from request body instead of auth
    });

    await post.save();
    await post.populate("user", "username name avatar");

    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Like/Unlike post (temporarily without auth)
router.post("/:id/like", async (req, res) => {
  try {
    const { userId } = req.body; // Get userId from body temporarily
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(userId);
    }

    await post.save();

    res.json({
      likes: post.likes.length,
      userLiked: likeIndex === -1,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
