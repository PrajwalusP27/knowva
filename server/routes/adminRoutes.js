const express =
  require("express");

const router =
  express.Router();

const adminOnly =
  require("../middleware/adminMiddleware");

const User =
  require("../models/User");

const Session =
  require("../models/Session");

const Validation =
  require("../models/Validation");

const Certificate =
  require("../models/Certificate");


// ==========================================
// ALL ROUTES ARE ADMIN-PROTECTED
// ==========================================


// ==========================================
// STATS OVERVIEW
// ==========================================
router.get("/stats", adminOnly, async (req, res) => {

  try {

    const [
      totalUsers,
      totalSessions,
      completedSessions,
      totalValidations,
      totalCertificates,
      activeUsers,
    ] = await Promise.all([

      User.countDocuments(),

      Session.countDocuments(),

      Session.countDocuments({ status: "completed" }),

      Validation.countDocuments(),

      Certificate.countDocuments({ status: "active" }),

      // Active = logged in last 30 days (updatedAt proxy)
      User.countDocuments({
        updatedAt: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
        status: "active",
      }),
    ]);

    res.status(200).json({
      totalUsers,
      totalSessions,
      completedSessions,
      totalValidations,
      totalCertificates,
      activeUsers,
    });

  } catch (error) {

    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


// ==========================================
// GET ALL USERS (with search)
// ==========================================
router.get("/users", adminOnly, async (req, res) => {

  try {

    const { search } = req.query;

    const query = search
      ? {
          $or: [
            { name:  { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .select("-__v");

    res.status(200).json(users);

  } catch (error) {

    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


// ==========================================
// SUSPEND / UNSUSPEND USER
// ==========================================
router.put("/users/:id/suspend", adminOnly, async (req, res) => {

  try {

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.status =
      user.status === "active" ? "suspended" : "active";

    await user.save();

    res.status(200).json({ success: true, user });

  } catch (error) {

    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


// ==========================================
// DELETE USER
// ==========================================
router.delete("/users/:id", adminOnly, async (req, res) => {

  try {

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true });

  } catch (error) {

    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


// ==========================================
// GET ALL SESSIONS (monitoring)
// ==========================================
router.get("/sessions", adminOnly, async (req, res) => {

  try {

    const sessions = await Session.find()
      .sort({ createdAt: -1 });

    res.status(200).json(sessions);

  } catch (error) {

    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


// ==========================================
// GET ALL VALIDATIONS (monitoring)
// ==========================================
router.get("/validations", adminOnly, async (req, res) => {

  try {

    const validations = await Validation.find()
      .sort({ createdAt: -1 });

    res.status(200).json(validations);

  } catch (error) {

    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


// ==========================================
// GET ALL CERTIFICATES (monitoring)
// ==========================================
router.get("/certificates", adminOnly, async (req, res) => {

  try {

    const certificates = await Certificate.find()
      .sort({ createdAt: -1 });

    res.status(200).json(certificates);

  } catch (error) {

    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


// ==========================================
// REVOKE CERTIFICATE
// ==========================================
router.put("/certificates/:id/revoke", adminOnly, async (req, res) => {

  try {

    await Certificate.findByIdAndUpdate(req.params.id, { status: "revoked" });

    res.status(200).json({ success: true });

  } catch (error) {

    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


module.exports = router;
