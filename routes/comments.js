const express = require("express");
const Comment = require("../models/Comment");
const Post = require("../models/Post");
// const auth = require('../middleware/auth'); // Comment out
const router = express.Router();

// Get comments for a post
router.get("/post/:postId", async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate("user", "username name avatar")
      .sort({ createdAt: 1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new comment (without auth temporarily)
router.post("/", async (req, res) => {
  try {
    const { content, post, user } = req.body; // Get user from body

    const postExists = await Post.findById(post);
    if (!postExists) {
      return res.status(404).json({ error: "Post not found" });
    }

    const comment = new Comment({
      content,
      post,
      user, // From request body
    });

    await comment.save();

    // Add comment to post and update comment count
    postExists.comments.push(comment._id);
    postExists.commentCount = postExists.comments.length;
    await postExists.save();

    await comment.populate("user", "username name avatar");

    res.status(201).json(comment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
