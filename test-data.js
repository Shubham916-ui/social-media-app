const mongoose = require("mongoose");
const User = require("./models/User");
const Post = require("./models/Post");
const Comment = require("./models/Comment");

// Connect to MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/social-media-app")
  .then(() => {
    console.log("Connected to MongoDB");
    createTestData();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

async function createTestData() {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Post.deleteMany({});
    await Comment.deleteMany({});

    console.log("Cleared existing data");

    // Create test users
    const users = await User.create([
      {
        username: "john_doe",
        email: "john@example.com",
        password: "password123",
        name: "John Doe",
        bio: "Software developer and coffee enthusiast",
      },
      {
        username: "jane_smith",
        email: "jane@example.com",
        password: "password123",
        name: "Jane Smith",
        bio: "Designer and travel lover",
      },
      {
        username: "mike_wilson",
        email: "mike@example.com",
        password: "password123",
        name: "Mike Wilson",
        bio: "Photographer and nature lover",
      },
    ]);

    console.log(
      "Created test users:",
      users.map((u) => u.username)
    );

    // Create test posts
    const posts = await Post.create([
      {
        user: users[0]._id,
        content:
          "Just finished building an amazing web application! The feeling of seeing your code come to life is incredible. 🚀",
        image: "https://picsum.photos/seed/coding/600/400",
      },
      {
        user: users[1]._id,
        content:
          "Beautiful sunset from my balcony today. Sometimes you need to pause and appreciate the simple things in life. 🌅",
        image: "https://picsum.photos/seed/sunset/600/400",
      },
      {
        user: users[2]._id,
        content:
          "Exploring the mountains this weekend. The fresh air and stunning views are exactly what I needed to recharge! 🏔️",
      },
      {
        user: users[0]._id,
        content:
          "Coffee and code - the perfect combination for a productive morning. What's your favorite coding fuel? ☕",
      },
      {
        user: users[1]._id,
        content:
          "Working on a new design project. The creative process is both challenging and rewarding. Can't wait to share the final result! 🎨",
        image: "https://picsum.photos/seed/design/600/400",
      },
    ]);

    console.log("Created test posts:", posts.length);

    // Create some test comments
    const comments = await Comment.create([
      {
        content: "This looks amazing! Great work! 👏",
        user: users[1]._id,
        post: posts[0]._id,
      },
      {
        content:
          "I totally agree! Building something from scratch is so satisfying.",
        user: users[2]._id,
        post: posts[0]._id,
      },
      {
        content: "Absolutely gorgeous! Where was this taken?",
        user: users[0]._id,
        post: posts[1]._id,
      },
      {
        content: "Definitely coffee! Can't function without it 😄",
        user: users[1]._id,
        post: posts[3]._id,
      },
      {
        content:
          "Looking forward to seeing it! Your designs are always inspiring.",
        user: users[2]._id,
        post: posts[4]._id,
      },
    ]);

    console.log("Created test comments:", comments.length);

    // Update posts with comment references
    for (let comment of comments) {
      await Post.findByIdAndUpdate(comment.post, {
        $push: { comments: comment._id },
      });
    }

    // Add some likes to posts
    await Post.findByIdAndUpdate(posts[0]._id, {
      $push: { likes: [users[1]._id, users[2]._id] },
    });

    await Post.findByIdAndUpdate(posts[1]._id, {
      $push: { likes: [users[0]._id] },
    });

    await Post.findByIdAndUpdate(posts[3]._id, {
      $push: { likes: [users[1]._id] },
    });

    console.log("Added likes to posts");
    console.log("Test data created successfully!");
  } catch (error) {
    console.error("Error creating test data:", error);
  } finally {
    mongoose.connection.close();
  }
}
