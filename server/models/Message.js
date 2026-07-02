const mongoose = require("mongoose");

const messageSchema =
  new mongoose.Schema(
    {
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

      // ======================================
      // MESSAGE TEXT
      // ======================================
      message: {
        type: String,
        default: "",
      },

      // ======================================
      // FILE URL
      // ======================================
      fileUrl: {
        type: String,
        default: "",
      },

      // ======================================
      // SEEN STATUS
      // ======================================
      seen: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true,
    }
  );

module.exports = mongoose.model(
  "Message",
  messageSchema
);