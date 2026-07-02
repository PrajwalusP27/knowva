const express =
  require("express");

const router =
  express.Router();

const Notification =
  require("../models/Notification");


// ==========================================
// CREATE NOTIFICATION
// ==========================================
router.post("/create", async (req, res) => {
  try {
    const notification = new Notification(req.body);
    await notification.save();
    res.status(201).json({ success: true, notification });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


// ==========================================
// GET UNREAD COUNT
// MUST be declared BEFORE /:clerkId
// otherwise Express matches "unread-count"
// as a clerkId and this route never fires.
// ==========================================
router.get("/unread-count/:clerkId", async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipientClerkId: req.params.clerkId,
      isRead: false,
    });
    res.status(200).json({ count });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


// ==========================================
// MARK ALL AS READ
// MUST be before /:clerkId
// ==========================================
router.put("/mark-all-read/:clerkId", async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientClerkId: req.params.clerkId, isRead: false },
      { isRead: true }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


// ==========================================
// MARK ONE AS READ
// ==========================================
router.put("/mark-read/:id", async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


// ==========================================
// DELETE ONE NOTIFICATION
// ==========================================
router.delete("/:id", async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


// ==========================================
// GET ALL NOTIFICATIONS FOR A USER
// Keep LAST — /:clerkId catches everything
// ==========================================
router.get("/:clerkId", async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipientClerkId: req.params.clerkId,
    }).sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


module.exports = router;
