const express = require("express");
const router = express.Router();

const User       = require("../models/User");
const Session    = require("../models/Session");
const Validation = require("../models/Validation");
const Connection = require("../models/Connection");
const PeerTest   = require("../models/PeerTest");


// =====================================================
// CREATE OR UPDATE USER
// =====================================================
router.post("/save-user", async (req, res) => {
  try {

    const {
      clerkId,
      name,
      email,
      image,
      teachSkills,
      learnSkills,
      bio,
      location,
      website,
      showCertificates,
    } = req.body;

    // Find Existing User
    let user = await User.findOne({
      clerkId,
    });

    // =====================================================
    // UPDATE USER
    // =====================================================
    if (user) {

      user.name = name;
      user.email = email;
      user.image = image;

      user.teachSkills =
        teachSkills || [];

      user.learnSkills =
        learnSkills || [];

      // Only update profile fields if provided
      if (bio !== undefined) user.bio = bio;
      if (location !== undefined) user.location = location;
      if (website !== undefined) user.website = website;
      if (showCertificates !== undefined) user.showCertificates = showCertificates;

      await user.save();

      return res.status(200).json({
        success: true,
        message: "User updated successfully",
        user,
      });
    }

    // =====================================================
    // CREATE USER
    // =====================================================
    user = await User.create({
      clerkId,
      name,
      email,
      image,
      teachSkills:
        teachSkills || [],
      learnSkills:
        learnSkills || [],
      bio: bio || "",
      location: location || "",
      website: website || "",
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});


// =====================================================
// GET MATCHED USERS
// IMPORTANT:
// KEEP THIS ROUTE ABOVE "/:clerkId"
// =====================================================
router.get("/matches/:clerkId", async (req, res) => {
  try {

    // Current User
    const currentUser = await User.findOne({
      clerkId: req.params.clerkId,
    });

    // User not found
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get all other users
    const users = await User.find({
      clerkId: {
        $ne: req.params.clerkId,
      },
    });

    // =====================================================
    // MATCHING LOGIC
    // =====================================================
    const matches = users.filter((user) => {

      // Their Skills
      const theirTeachSkills =
        user.teachSkills || [];

      const theirLearnSkills =
        user.learnSkills || [];

      // My Skills
      const myTeachSkills =
        currentUser.teachSkills || [];

      const myLearnSkills =
        currentUser.learnSkills || [];

      // They teach what I want
      const teachMatch =
        theirTeachSkills.some((skill) =>
          myLearnSkills.includes(skill)
        );

      // They want what I teach
      const learnMatch =
        theirLearnSkills.some((skill) =>
          myTeachSkills.includes(skill)
        );

      return teachMatch || learnMatch;
    });

    res.status(200).json(matches);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});


// =====================================================
// TRUST SCORE
// Computed from validations, sessions, peer tests,
// and connections. No separate model needed.
// =====================================================
router.get("/trust-score/:clerkId", async (req, res) => {
  try {

    const { clerkId } = req.params;

    // ---- Run all queries in parallel ----
    const [
      validations,
      sessions,
      connections,
      peerTests,
    ] = await Promise.all([

      Validation.find({ receiverClerkId: clerkId }),

      Session.find({
        $or: [
          { senderClerkId:   clerkId },
          { receiverClerkId: clerkId },
        ],
        status: "completed",
      }),

      Connection.find({
        $or: [
          { senderClerkId:   clerkId },
          { receiverClerkId: clerkId },
        ],
        status: "accepted",
      }),

      PeerTest.find({
        testeeClerkId: clerkId,
        status: "reviewed",
      }),
    ]);

    // ---- Score components (max 100) ----

    // Validations: up to 30 pts
    // Each pass = 5 pts, max 30
    const passedValidations =
      validations.filter((v) => v.result === "pass").length;
    const validationScore =
      Math.min(passedValidations * 5, 30);

    // Average validation rating boost: up to 10 pts
    const avgRating =
      validations.length > 0
        ? validations.reduce((s, v) => s + v.rating, 0) / validations.length
        : 0;
    const ratingScore = Math.round((avgRating / 5) * 10);

    // Sessions: up to 25 pts
    // Each completed session = 5 pts, max 25
    const sessionScore = Math.min(sessions.length * 5, 25);

    // Connections: up to 15 pts
    // Each accepted connection = 3 pts, max 15
    const connectionScore = Math.min(connections.length * 3, 15);

    // Peer tests passed: up to 20 pts
    // Each passed peer test = 5 pts, max 20
    const passedTests =
      peerTests.filter((t) => t.result === "pass").length;
    const peerTestScore = Math.min(passedTests * 5, 20);

    // ---- Total ----
    const total =
      validationScore +
      ratingScore +
      sessionScore +
      connectionScore +
      peerTestScore;

    res.status(200).json({
      score: Math.min(total, 100),
      breakdown: {
        validations:  validationScore,
        rating:       ratingScore,
        sessions:     sessionScore,
        connections:  connectionScore,
        peerTests:    peerTestScore,
      },
      counts: {
        passedValidations,
        completedSessions: sessions.length,
        connections:       connections.length,
        passedPeerTests:   passedTests,
        avgRating:         parseFloat(avgRating.toFixed(1)),
      },
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});


// =====================================================
// GET ALL USERS WITH AT LEAST ONE SKILL
// Used by Community page. Only shows users who
// have added teaching OR learning skills.
// =====================================================
router.get("/all-with-skills", async (req, res) => {
  try {
    const users = await User.find({
      $or: [
        { teachSkills: { $exists: true, $not: { $size: 0 } } },
        { learnSkills: { $exists: true, $not: { $size: 0 } } },
      ],
      status: { $ne: "suspended" },
    }).select("clerkId name image bio location teachSkills learnSkills");
    res.status(200).json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


// =====================================================
// GET USER BY CLERK ID
// =====================================================
router.get("/:clerkId", async (req, res) => {
  try {

    const user = await User.findOne({
      clerkId: req.params.clerkId,
    });

    // User not found
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json(user);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});


module.exports = router;