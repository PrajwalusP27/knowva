const mongoose =
  require("mongoose");

const sessionSchema =
  new mongoose.Schema(
    {
      // ====================================
      // USERS
      // ====================================
      senderClerkId: {
        type: String,
        required: true,
      },

      receiverClerkId: {
        type: String,
        required: true,
      },

      senderName: {
        type: String,
        required: true,
      },

      receiverName: {
        type: String,
        required: true,
      },

      // ====================================
      // SESSION DETAILS
      // ====================================
      topic: {
        type: String,
        required: true,
      },

      description: {
        type: String,
        default: "",
      },

      date: {
        type: String,
        required: true,
      },

      time: {
        type: String,
        required: true,
      },

      // ====================================
      // STATUS
      // ====================================
      status: {
        type: String,
        enum: [
          "pending",
          "accepted",
          "rejected",
          "completed",
        ],
        default: "pending",
      },

      // ====================================
      // REVIEW & RATING
      // ====================================
      rating: {
        type: Number,
        default: 0,
      },

      review: {
        type: String,
        default: "",
      },

      // ====================================
      // SESSION NOTES & RESOURCES
      // ====================================
      notes: {
        type: String,
        default: "",
      },

      resources: {
        type: String,
        default: "",
      },

      // ====================================
      // PEER VALIDATION FLAG
      // ====================================
      hasValidated: {
        type: Boolean,
        default: false,
      },

      // ====================================
      // ARCHIVE
      // Stores clerkIds of users who hid
      // this session from their view.
      // Data is NOT deleted from DB.
      // ====================================
      archivedBy: {
        type: [String],
        default: [],
      },
    },
    {
      timestamps: true,
    }
  );

module.exports =
  mongoose.model(
    "Session",
    sessionSchema
  );