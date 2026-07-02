const mongoose =
  require("mongoose");

const peerTestSchema =
  new mongoose.Schema(
    {
      // ====================================
      // PARTICIPANTS
      // ====================================
      testerClerkId: {
        type: String,
        required: true,
      },

      testerName: {
        type: String,
        required: true,
      },

      testeeClerkId: {
        type: String,
        required: true,
      },

      testeeName: {
        type: String,
        required: true,
      },

      // ====================================
      // TEST DETAILS
      // ====================================
      skill: {
        type: String,
        required: true,
      },

      // Questions authored by the tester
      // Each: { question: String, answer: String }
      questions: {
        type: [
          {
            question: {
              type: String,
              required: true,
            },

            // Tester's expected answer (hidden from testee)
            expectedAnswer: {
              type: String,
              default: "",
            },

            // Testee's submitted answer
            submittedAnswer: {
              type: String,
              default: "",
            },
          },
        ],
        default: [],
      },

      // ====================================
      // STATUS
      // created  → tester has drafted the test
      // sent     → sent to testee
      // answered → testee submitted answers
      // reviewed → tester scored and closed
      // ====================================
      status: {
        type: String,
        enum: [
          "created",
          "sent",
          "answered",
          "reviewed",
          "retest-requested",
        ],
        default: "created",
      },

      // ====================================
      // RESULT
      // ====================================
      score: {
        type: Number,
        default: 0,
      },

      totalQuestions: {
        type: Number,
        default: 0,
      },

      // pass | fail | pending
      result: {
        type: String,
        enum: ["pass", "fail", "pending"],
        default: "pending",
      },

      testerFeedback: {
        type: String,
        default: "",
      },

      // ====================================
      // SESSION REFERENCE
      // Links this test to a specific session
      // so multiple sessions between same
      // two users are handled correctly.
      // ====================================
      sessionId: {
        type: String,
        default: "",
      },

      // ====================================
      // RETEST FLAG
      // ====================================
      isRetest: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true,
    }
  );

module.exports =
  mongoose.model(
    "PeerTest",
    peerTestSchema
  );
