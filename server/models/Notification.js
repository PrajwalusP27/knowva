const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientClerkId: { type: String, required: true },
    senderClerkId:    { type: String, required: true },
    senderName:       { type: String, required: true },
    senderImage:      { type: String, default: "" },

    // ====================================
    // EXTENDED TYPE ENUM
    // Covers all platform events
    // ====================================
    type: {
      type: String,
      enum: [
        "message",
        "session",
        "connection",
        "validation",
        "peer_test",
        "certificate",
        "retest",
      ],
      required: true,
    },

    title:  { type: String, required: true },
    body:   { type: String, default: "" },
    linkTo: { type: String, default: "" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
