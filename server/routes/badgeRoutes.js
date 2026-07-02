const express =
  require("express");

const router =
  express.Router();

const Badge =
  require("../models/Badge");

const Session =
  require("../models/Session");

const Validation =
  require("../models/Validation");

const Connection =
  require("../models/Connection");

const PeerTest =
  require("../models/PeerTest");


// ==========================================
// BADGE DEFINITIONS
// Single source of truth for all badge rules
// ==========================================
const BADGE_RULES = [

  {
    key:         "first_session",
    title:       "First Session",
    description: "Completed your very first learning session.",
    icon:        "🎓",
    tier:        "bronze",
    check: async (clerkId) => {
      const count = await Session.countDocuments({
        $or: [{ senderClerkId: clerkId }, { receiverClerkId: clerkId }],
        status: "completed",
      });
      return count >= 1;
    },
  },

  {
    key:         "five_sessions",
    title:       "Session Streak",
    description: "Completed 5 learning sessions.",
    icon:        "📚",
    tier:        "silver",
    check: async (clerkId) => {
      const count = await Session.countDocuments({
        $or: [{ senderClerkId: clerkId }, { receiverClerkId: clerkId }],
        status: "completed",
      });
      return count >= 5;
    },
  },

  {
    key:         "ten_sessions",
    title:       "Learning Machine",
    description: "Completed 10 learning sessions.",
    icon:        "🚀",
    tier:        "gold",
    check: async (clerkId) => {
      const count = await Session.countDocuments({
        $or: [{ senderClerkId: clerkId }, { receiverClerkId: clerkId }],
        status: "completed",
      });
      return count >= 10;
    },
  },

  {
    key:         "first_validation",
    title:       "Peer Validated",
    description: "Received your first peer skill validation.",
    icon:        "✅",
    tier:        "bronze",
    check: async (clerkId) => {
      const count = await Validation.countDocuments({
        receiverClerkId: clerkId,
        result: "pass",
      });
      return count >= 1;
    },
  },

  {
    key:         "five_validations",
    title:       "Skill Verified",
    description: "Received 5 passing peer validations.",
    icon:        "🏆",
    tier:        "silver",
    check: async (clerkId) => {
      const count = await Validation.countDocuments({
        receiverClerkId: clerkId,
        result: "pass",
      });
      return count >= 5;
    },
  },

  {
    key:         "connected_three",
    title:       "Network Builder",
    description: "Made 3 accepted connections.",
    icon:        "🤝",
    tier:        "bronze",
    check: async (clerkId) => {
      const count = await Connection.countDocuments({
        $or: [{ senderClerkId: clerkId }, { receiverClerkId: clerkId }],
        status: "accepted",
      });
      return count >= 3;
    },
  },

  {
    key:         "connected_ten",
    title:       "Community Pillar",
    description: "Made 10 accepted connections.",
    icon:        "🌐",
    tier:        "gold",
    check: async (clerkId) => {
      const count = await Connection.countDocuments({
        $or: [{ senderClerkId: clerkId }, { receiverClerkId: clerkId }],
        status: "accepted",
      });
      return count >= 10;
    },
  },

  {
    key:         "peer_tester",
    title:       "Peer Tester",
    description: "Sent your first peer test to a connection.",
    icon:        "🎯",
    tier:        "bronze",
    check: async (clerkId) => {
      const count = await PeerTest.countDocuments({
        testerClerkId: clerkId,
      });
      return count >= 1;
    },
  },

  {
    key:         "test_passer",
    title:       "Test Passer",
    description: "Passed a peer test.",
    icon:        "🥇",
    tier:        "silver",
    check: async (clerkId) => {
      const count = await PeerTest.countDocuments({
        testeeClerkId: clerkId,
        result: "pass",
      });
      return count >= 1;
    },
  },
];


// ==========================================
// AWARD BADGES
// Runs all rules for a user and creates
// any newly earned badges. Safe to call
// multiple times — duplicates are ignored
// by the unique index.
// ==========================================
router.post(
  "/award/:clerkId",
  async (req, res) => {

    try {

      const { clerkId } = req.params;
      const { userName } = req.body;

      const awarded = [];

      for (const rule of BADGE_RULES) {

        const earned =
          await rule.check(clerkId);

        if (earned) {

          try {

            const badge =
              await Badge.create({
                clerkId,
                userName:    userName || "User",
                badgeKey:    rule.key,
                title:       rule.title,
                description: rule.description,
                icon:        rule.icon,
                tier:        rule.tier,
              });

            awarded.push(badge);

          } catch (dupErr) {

            // E11000 = duplicate key — badge already exists, skip
            if (dupErr.code !== 11000) throw dupErr;
          }
        }
      }

      res.status(200).json({
        success: true,
        awarded,
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        success: false,
        message: "Server Error",
      });
    }
  }
);



// ==========================================
// GET ALL BADGE DEFINITIONS (for display)
// Must be declared BEFORE /:clerkId to
// avoid Express matching "definitions" as
// a clerkId parameter.
// ==========================================
router.get(
  "/definitions/all",
  async (req, res) => {

    const defs = BADGE_RULES.map(
      ({ key, title, description, icon, tier }) => ({
        key, title, description, icon, tier,
      })
    );

    res.status(200).json(defs);
  }
);


// ==========================================
// GET BADGES FOR A USER
// ==========================================
router.get(
  "/:clerkId",
  async (req, res) => {

    try {

      const badges =
        await Badge.find({
          clerkId: req.params.clerkId,
        }).sort({ createdAt: -1 });

      res.status(200).json(badges);

    } catch (error) {

      console.log(error);

      res.status(500).json({
        success: false,
        message: "Server Error",
      });
    }
  }
);


module.exports = router;
