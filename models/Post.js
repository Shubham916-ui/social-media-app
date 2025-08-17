const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, trim: true, default: "" },
    image: { type: String, default: "" },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    likeCount: { type: Number, default: 0 },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    commentCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Update like and comment counts before saving
PostSchema.pre("save", function () {
  this.likeCount = this.likes.length;
  this.commentCount = this.comments.length;
});

// Custom validator to ensure post has either content or image
PostSchema.pre("validate", function (next) {
  if (!this.content && !this.image) {
    this.invalidate("content", "Post must have content or an image.");
  }
  next();
});

module.exports = mongoose.model("Post", PostSchema);
