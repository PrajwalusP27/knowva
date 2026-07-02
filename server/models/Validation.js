const mongoose =
  require("mongoose");

const validationSchema =
  new mongoose.Schema(
    {
      // ====================================
      // USERS
      // ====================================
      validatorClerkId: {
        type: String,
        required: true,
      },

      validatorName: {
        type: String,
        required: true,
      },

      receiverClerkId: {
        type: String,
        required: true,
      },

      receiverName: {
        type: String,
        required: true,
      },

      // ====================================
      // SKILL
      // ====================================
      skill: {
        type: String,
        required: true,
      },

      // ====================================
      // VALIDATION
      // ====================================
      rating: {
        type: Number,
        required: true,
      },

      feedback: {
        type: String,
        default: "",
      },

      result: {
        type: String,
        enum: [
          "pass",
          "fail",
        ],
        required: true,
      },

      // ====================================
      // SESSION REFERENCE
      // ====================================
      sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Session",
      },
    },
    {
      timestamps: true,
    }
  );

module.exports =
  mongoose.model(
    "Validation",
    validationSchema
  );