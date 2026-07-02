const express =
  require("express");

const router =
  express.Router();

const Session =
  require("../models/Session");


// ==========================================
// CREATE SESSION
// ==========================================
router.post(
  "/create",
  async (req, res) => {

    try {

      const session =
        await Session.create(
          req.body
        );

      res.status(201).json({
        success: true,
        session,
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        success: false,
        message:
          "Server Error",
      });
    }
  }
);


// ==========================================
// GET MY SESSIONS
// ==========================================
router.get(
  "/my-sessions/:clerkId",
  async (req, res) => {

    try {

      const sessions =
        await Session.find({
          $or: [
            {
              senderClerkId:
                req.params.clerkId,
            },
            {
              receiverClerkId:
                req.params.clerkId,
            },
          ],
        }).sort({
          createdAt: -1,
        });

      res.status(200).json(
        sessions
      );

    } catch (error) {

      console.log(error);

      res.status(500).json({
        success: false,
        message:
          "Server Error",
      });
    }
  }
);


// ==========================================
// ACCEPT SESSION
// ==========================================
router.put(
  "/accept/:id",
  async (req, res) => {

    try {

      const session =
        await Session.findByIdAndUpdate(
          req.params.id,
          {
            status:
              "accepted",
          },
          { new: true }
        );

      res.status(200).json({
        success: true,
        session,
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        success: false,
        message:
          "Server Error",
      });
    }
  }
);


// ==========================================
// REJECT SESSION
// ==========================================
router.put(
  "/reject/:id",
  async (req, res) => {

    try {

      const session =
        await Session.findByIdAndUpdate(
          req.params.id,
          {
            status:
              "rejected",
          },
          { new: true }
        );

      res.status(200).json({
        success: true,
        session,
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        success: false,
        message:
          "Server Error",
      });
    }
  }
);

// ==========================================
// COMPLETE SESSION
// ==========================================
router.put(
  "/complete/:id",
  async (req, res) => {

    try {

      const session =
        await Session.findByIdAndUpdate(
          req.params.id,
          {
            status:
              "completed",
          },
          { new: true }
        );

      res.status(200).json({
        success: true,
        session,
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        success: false,
        message:
          "Server Error",
      });
    }
  }
);

// ==========================================
// ADD REVIEW & RATING
// ==========================================
router.put(
  "/review/:id",
  async (req, res) => {

    try {

      const {
        rating,
        review,
      } = req.body;

      const session =
        await Session.findByIdAndUpdate(
          req.params.id,
          {
            rating,
            review,
          },
          { new: true }
        );

      res.status(200).json({
        success: true,
        session,
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        success: false,
        message:
          "Server Error",
      });
    }
  }
);

// ==========================================
// ADD NOTES & RESOURCES
// ==========================================
router.put(
  "/notes/:id",
  async (req, res) => {

    try {

      const {
        notes,
        resources,
      } = req.body;

      const session =
        await Session.findByIdAndUpdate(
          req.params.id,
          {
            notes,
            resources,
          },
          { new: true }
        );

      res.status(200).json({
        success: true,
        session,
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        success: false,
        message:
          "Server Error",
      });
    }
  }
);


// ==========================================
// ARCHIVE SESSION
// Adds the user's clerkId to archivedBy[].
// Does NOT delete data from the database.
// ==========================================
router.put(
  "/archive/:id",
  async (req, res) => {
    try {

      const { clerkId } = req.body;

      await Session.findByIdAndUpdate(
        req.params.id,
        { $addToSet: { archivedBy: clerkId } }
      );

      res.status(200).json({ success: true });

    } catch (error) {

      console.log(error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }
);


module.exports =
  router;