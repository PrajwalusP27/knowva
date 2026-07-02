const express = require("express");
const router = express.Router();

const Connection =
  require("../models/Connection");


// ==========================================
// SEND CONNECTION REQUEST
// ==========================================
router.post("/send", async (req, res) => {
  try {

    const {
      senderClerkId,
      receiverClerkId,
      senderName,
      receiverName,
    } = req.body;

    // Prevent duplicate requests
    const existingConnection =
      await Connection.findOne({
        senderClerkId,
        receiverClerkId,
      });

    if (existingConnection) {
      return res.status(400).json({
        success: false,
        message:
          "Request already sent",
      });
    }

    // Create request
    const connection =
      await Connection.create({
        senderClerkId,
        receiverClerkId,
        senderName,
        receiverName,
      });

    res.status(201).json({
      success: true,
      connection,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});


// ==========================================
// GET PENDING REQUESTS
// ==========================================
router.get(
  "/pending/:clerkId",
  async (req, res) => {
    try {

      const requests =
        await Connection.find({
          receiverClerkId:
            req.params.clerkId,

          status: "pending",
        });

      res.status(200).json(
        requests
      );

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
// ACCEPT REQUEST
// ==========================================
router.put(
  "/accept/:id",
  async (req, res) => {
    try {

      const connection =
        await Connection.findById(
          req.params.id
        );

      if (!connection) {
        return res.status(404).json({
          success: false,
          message:
            "Connection not found",
        });
      }

      connection.status =
        "accepted";

      await connection.save();

      res.status(200).json({
        success: true,
        connection,
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
// REJECT REQUEST
// ==========================================
router.put(
  "/reject/:id",
  async (req, res) => {
    try {

      const connection =
        await Connection.findById(
          req.params.id
        );

      if (!connection) {
        return res.status(404).json({
          success: false,
          message:
            "Connection not found",
        });
      }

      connection.status =
        "rejected";

      await connection.save();

      res.status(200).json({
        success: true,
        connection,
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
// GET ACCEPTED CONNECTIONS
// ==========================================
router.get(
  "/my-connections/:clerkId",
  async (req, res) => {
    try {

      const connections =
        await Connection.find({
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

          status: "accepted",
        });

      res.status(200).json(
        connections
      );

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