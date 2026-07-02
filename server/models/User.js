const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    image: {
      type: String,
    },

    teachSkills: {
      type: [String],
      default: [],
    },

    learnSkills: {
      type: [String],
      default: [],
    },

    bio: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      default: "",
    },

    website: {
      type: String,
      default: "",
    },

    // ====================================
    // ROLE
    // user (default) | admin
    // ====================================
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // ====================================
    // CERTIFICATE VISIBILITY
    // Controls whether certificates show
    // on the user's public profile
    // ====================================
    showCertificates: {
      type: Boolean,
      default: true,
    },

    // ====================================
    // ACCOUNT STATUS
    // active | suspended (set by admin)
    // ====================================
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);