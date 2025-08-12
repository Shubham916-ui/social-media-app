const mongoose = require("mongoose");
const Post = require("./models/Post");

// Connect to MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/social-media-app")
  .then(() => {
    console.log("Connected to MongoDB");
    fixCommentCounts();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

async function fixCommentCounts() {
  try {
    const posts = await Post.find();
    console.log(`Found ${posts.length} posts`);

    for (let post of posts) {
      const oldCount = post.commentCount || 0;
      const actualCount = post.comments ? post.comments.length : 0;

      console.log(
        `Post ${post._id}: commentCount=${oldCount}, actual comments=${actualCount}`
      );

      if (oldCount !== actualCount) {
        post.commentCount = actualCount;
        await post.save();
        console.log(
          `Updated post ${post._id}: ${oldCount} -> ${actualCount} comments`
        );
      }
    }

    console.log("Comment counts fixed!");
  } catch (error) {
    console.error("Error fixing comment counts:", error);
  } finally {
    mongoose.connection.close();
  }
}
