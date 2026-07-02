const mongoose = require("mongoose");

const connectionSchema =
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

      receiverName: {
        type: String,
        required: true,
      },

      status: {
        type: String,
        enum: [
          "pending",
          "accepted",
          "rejected",
        ],
        default: "pending",
      },
    },
    { timestamps: true }
  );

module.exports = mongoose.model(
  "Connection",
  connectionSchema
);