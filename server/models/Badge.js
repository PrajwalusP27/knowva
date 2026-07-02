const mongoose =
  require("mongoose");

const badgeSchema =
  new mongoose.Schema(
    {
      // ====================================
      // OWNER
      // ====================================
      clerkId: {
        type: String,
        required: true,
      },

      userName: {
        type: String,
        required: true,
      },

      // ====================================
      // BADGE DEFINITION
      // ====================================
      badgeKey: {
        type: String,
        required: true,
        // e.g. "first_session", "five_sessions",
        //      "first_validation", "trusted_member",
        //      "peer_tester", "connected_five"
      },

      title: {
        type: String,
        required: true,
      },

      description: {
        type: String,
        default: "",
      },

      icon: {
        type: String,
        default: "🏅",
      },

      // ====================================
      // TIER: bronze | silver | gold
      // ====================================
      tier: {
        type: String,
        enum: ["bronze", "silver", "gold"],
        default: "bronze",
      },
    },
    {
      timestamps: true,
    }
  );

// Prevent duplicate badge per user
badgeSchema.index(
  { clerkId: 1, badgeKey: 1 },
  { unique: true }
);

module.exports =
  mongoose.model(
    "Badge",
    badgeSchema
  );
