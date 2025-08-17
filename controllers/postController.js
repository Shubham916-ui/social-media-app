const Post = require("../models/Post");

// Get paginated posts
exports.getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skipIndex = (page - 1) * limit;

    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .populate("user", "username")
      .populate({
        path: "comments",
        populate: { path: "user", select: "username" },
      })
      .skip(skipIndex)
      .limit(limit);

    const total = await Post.countDocuments();
    const hasMore = total > skipIndex + posts.length;

    res.json({
      posts,
      hasMore,
      currentPage: page,
      totalPosts: total,
    });
  } catch (error) {
    console.error("Error getting posts:", error);
    res.status(500).json({ error: "Error fetching posts" });
  }
};

// Create a new post
exports.createPost = async (req, res) => {
  try {
    const { content, image } = req.body;
    const post = new Post({
      user: req.user._id,
      content,
      image,
    });
    await post.save();

    // Populate user info before sending response
    await post.populate("user", "username");
    res.status(201).json(post);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Error creating post" });
  }
};
