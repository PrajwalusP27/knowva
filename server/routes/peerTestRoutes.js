const express =
  require("express");

const router =
  express.Router();

const PeerTest =
  require("../models/PeerTest");


// ==========================================
// CREATE TEST (teacher sends to learner)
// ==========================================
router.post("/create", async (req, res) => {
  try {

    const test = new PeerTest({
      ...req.body,
      status: "sent",
      totalQuestions: (req.body.questions || []).length,
    });

    await test.save();

    res.status(201).json({ success: true, test });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


// ==========================================
// GET TESTS BY SESSION ID
// Used to load peer tests for a specific
// session card in Sessions.jsx
// ==========================================
router.get("/by-session/:sessionId", async (req, res) => {
  try {

    const tests = await PeerTest.find({
      sessionId: req.params.sessionId,
    }).sort({ createdAt: -1 });

    res.status(200).json(tests);

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


// ==========================================
// GET TESTS SENT BY ME (as teacher)
// ==========================================
router.get("/sent/:clerkId", async (req, res) => {
  try {

    const tests = await PeerTest.find({
      testerClerkId: req.params.clerkId,
    }).sort({ createdAt: -1 });

    res.status(200).json(tests);

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


// ==========================================
// GET TESTS RECEIVED BY ME (as learner)
// ==========================================
router.get("/received/:clerkId", async (req, res) => {
  try {

    const tests = await PeerTest.find({
      testeeClerkId: req.params.clerkId,
    }).sort({ createdAt: -1 });

    res.status(200).json(tests);

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


// ==========================================
// SUBMIT ANSWERS (learner)
// ==========================================
router.put("/submit/:id", async (req, res) => {
  try {

    const { answers } = req.body;

    const test = await PeerTest.findById(req.params.id);

    if (!test) {
      return res.status(404).json({ success: false, message: "Test not found" });
    }

    test.questions = test.questions.map((q, index) => ({
      question:        q.question,
      expectedAnswer:  q.expectedAnswer,
      submittedAnswer: answers[index] || "",
    }));

    test.status = "answered";

    await test.save();

    res.status(200).json({ success: true, test });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


// ==========================================
// REVIEW + SCORE (teacher)
// ==========================================
router.put("/review/:id", async (req, res) => {
  try {

    const { score, result, testerFeedback } = req.body;

    const test = await PeerTest.findByIdAndUpdate(
      req.params.id,
      { score, result, testerFeedback, status: "reviewed" },
      { new: true }
    );

    res.status(200).json({ success: true, test });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


// ==========================================
// REQUEST RETEST (learner — creates a flag)
// Teacher picks it up and sends new questions
// ==========================================
router.put("/request-retest/:id", async (req, res) => {
  try {

    const test = await PeerTest.findByIdAndUpdate(
      req.params.id,
      { status: "retest-requested" },
      { new: true }
    );

    res.status(200).json({ success: true, test });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


module.exports = router;
