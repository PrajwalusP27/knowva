const mongoose =
  require("mongoose");

const certificateSchema =
  new mongoose.Schema(
    {
      // ====================================
      // RECIPIENT
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
      // SKILL BEING CERTIFIED
      // ====================================
      skill: {
        type: String,
        required: true,
      },

      // ====================================
      // EVIDENCE CHAIN
      // All three must be satisfied before
      // a certificate can be issued:
      //   1. Session completed
      //   2. Peer test passed
      //   3. Peer validation passed
      // ====================================
      sessionCompleted: {
        type: Boolean,
        default: false,
      },

      peerTestPassed: {
        type: Boolean,
        default: false,
      },

      validationCount: {
        type: Number,
        default: 0,
      },

      averageRating: {
        type: Number,
        default: 0,
      },

      // ====================================
      // CERTIFICATE ID
      // Format: CERT-{timestamp}-{shortUserId}
      // ====================================
      certificateId: {
        type: String,
        required: true,
        unique: true,
      },

      // ====================================
      // TEACHER WHO ISSUED THE CERTIFICATE
      // ====================================
      teacherClerkId: {
        type: String,
        default: "",
      },

      teacherName: {
        type: String,
        default: "",
      },

      // ====================================
      // CERTIFICATE TEXT CONTENT
      // Pre-generated on issue, ready to
      // display or send via messages.
      // ====================================
      certText: {
        type: String,
        default: "",
      },

      // ====================================
      // STATUS: active | revoked
      // ====================================
      status: {
        type: String,
        enum: ["active", "revoked"],
        default: "active",
      },
    },
    {
      timestamps: true,
    }
  );

module.exports =
  mongoose.model(
    "Certificate",
    certificateSchema
  );
