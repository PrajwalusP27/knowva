const express =
  require("express");

const router =
  express.Router();

const Certificate =
  require("../models/Certificate");

const Validation =
  require("../models/Validation");

const Session =
  require("../models/Session");

const PeerTest =
  require("../models/PeerTest");


// ==========================================
// CERTIFICATE ID GENERATOR
// Format: CERT-{timestamp}-{shortUserId}
// ==========================================
const makeCertId = (clerkId) => {

  const ts = Date.now();

  const short =
    clerkId.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase();

  return `CERT-${ts}-${short}`;
};


// ==========================================
// ELIGIBILITY CHECK
// Three requirements must ALL be met:
//   1. Completed session (any)
//   2. Peer test passed (any)
//   3. >= 2 passing validations, avg >= 3.5
// ==========================================
router.get("/eligible/:clerkId", async (req, res) => {

  try {

    const { clerkId } = req.params;

    const [validations, sessions, peerTests, existing] =
      await Promise.all([

        Validation.find({ receiverClerkId: clerkId, result: "pass" }),

        Session.find({
          $or: [
            { senderClerkId:   clerkId },
            { receiverClerkId: clerkId },
          ],
          status: "completed",
        }),

        PeerTest.find({ testeeClerkId: clerkId, result: "pass" }),

        Certificate.find({ clerkId, status: "active" }),
      ]);

    const existingSkills =
      new Set(existing.map((c) => c.skill));

    // Group passing validations by skill
    const skillMap = {};

    validations.forEach((v) => {

      if (!skillMap[v.skill]) {
        skillMap[v.skill] = { count: 0, total: 0 };
      }

      skillMap[v.skill].count += 1;
      skillMap[v.skill].total += v.rating;
    });

    const sessionOk  = sessions.length  >= 1;
    const peerTestOk = peerTests.length >= 1;

    const eligible = [];

    for (const [skill, data] of Object.entries(skillMap)) {

      if (existingSkills.has(skill)) continue;

      const avg = data.total / data.count;
      const validationOk = data.count >= 2 && avg >= 3.5;

      if (validationOk && sessionOk && peerTestOk) {

        eligible.push({
          skill,
          validationCount:  data.count,
          averageRating:    parseFloat(avg.toFixed(1)),
          sessionCompleted: true,
          peerTestPassed:   true,
        });
      }
    }

    res.status(200).json({ eligible, existing });

  } catch (error) {

    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


// ==========================================
// ISSUE CERTIFICATE
// ==========================================
router.post("/issue", async (req, res) => {

  try {

    const {
      clerkId, userName, skill,
      validationCount, averageRating,
      sessionCompleted, peerTestPassed,
      teacherClerkId, teacherName,
    } = req.body;

    const existing = await Certificate.findOne({
      clerkId, skill, status: "active",
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Certificate already issued for this skill",
        certificate: existing,
      });
    }

    const certId = makeCertId(clerkId);

    // ==========================================
    // GENERATE CERTIFICATE TEXT
    // ==========================================
    const completionDate = new Date().toLocaleDateString(
      "en-US",
      { year: "numeric", month: "long", day: "numeric" }
    );

    const certText =
      `CERTIFICATE OF SKILL COMPLETION\n\n` +
      `This certifies that:\n${userName}\n\n` +
      `successfully completed:\n${skill}\n\n` +
      `under the guidance of:\n${teacherName || "Knowva Instructor"}\n\n` +
      `on the Knowva Platform\n\n` +
      `Completion Date: ${completionDate}\n` +
      `Certificate ID: ${certId}`;

    const certificate = await Certificate.create({
      clerkId,
      userName,
      skill,
      validationCount:  validationCount  || 0,
      averageRating:    averageRating    || 0,
      sessionCompleted: sessionCompleted || false,
      peerTestPassed:   peerTestPassed   || false,
      teacherClerkId:   teacherClerkId   || "",
      teacherName:      teacherName      || "",
      certText,
      certificateId: certId,
    });

    res.status(201).json({ success: true, certificate });

  } catch (error) {

    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


// ==========================================
// GET MY CERTIFICATES
// ==========================================
router.get("/my/:clerkId", async (req, res) => {

  try {

    const certificates = await Certificate.find({
      clerkId: req.params.clerkId,
      status: "active",
    }).sort({ createdAt: -1 });

    res.status(200).json(certificates);

  } catch (error) {

    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


// ==========================================
// VERIFY A CERTIFICATE (public)
// ==========================================
router.get("/verify/:certificateId", async (req, res) => {

  try {

    const certificate = await Certificate.findOne({
      certificateId: req.params.certificateId,
    });

    if (!certificate) {
      return res.status(404).json({ valid: false, message: "Certificate not found" });
    }

    res.status(200).json({
      valid: certificate.status === "active",
      certificate,
    });

  } catch (error) {

    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


// ==========================================
// REVOKE A CERTIFICATE (admin)
// ==========================================
router.put("/revoke/:id", async (req, res) => {

  try {

    await Certificate.findByIdAndUpdate(req.params.id, { status: "revoked" });
    res.status(200).json({ success: true });

  } catch (error) {

    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


// ==========================================
// GET ALL CERTIFICATES (admin)
// ==========================================
router.get("/all", async (req, res) => {

  try {

    const certificates =
      await Certificate.find().sort({ createdAt: -1 });

    res.status(200).json(certificates);

  } catch (error) {

    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


module.exports = router;
