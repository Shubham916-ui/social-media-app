const mongoose = require("mongoose");

const FollowerSchema = new mongoose.Schema(
  {
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Ensure unique follower-following pairs
FollowerSchema.index({ follower: 1, following: 1 }, { unique: true });

module.exports = mongoose.model("Follower", FollowerSchema);
