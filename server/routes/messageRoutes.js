const express = require("express");

const router = express.Router();

const multer =
  require("multer");

const path =
  require("path");

const Message =
  require("../models/Message");

const User =
  require("../models/User");


// ==========================================
// MULTER STORAGE
// ==========================================
const storage =
  multer.diskStorage({

    destination:
      (req, file, cb) => {

        cb(
          null,
          "uploads/"
        );
      },

    filename:
      (req, file, cb) => {

        cb(
          null,
          Date.now() +
            path.extname(
              file.originalname
            )
        );
      },
  });

const upload =
  multer({
    storage,
  });


// ==========================================
// UPLOAD FILE
// ==========================================
router.post(
  "/upload",
  upload.single("file"),
  async (req, res) => {

    try {

      res.status(200).json({

        success: true,

        fileUrl:
          `http://localhost:5000/uploads/${req.file.filename}`,
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        success: false,
        message:
          "Upload failed",
      });
    }
  }
);


// ==========================================
// SAVE MESSAGE
// ==========================================
router.post(
  "/send",
  async (req, res) => {

    try {

      const message =
        await Message.create(
          req.body
        );

      res.status(201).json({
        success: true,
        message,
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
// GET CONVERSATION
// ==========================================
router.get(
  "/conversation/:user1/:user2",
  async (req, res) => {

    try {

      const messages =
        await Message.find({

          $or: [

            {
              senderClerkId:
                req.params.user1,

              receiverClerkId:
                req.params.user2,
            },

            {
              senderClerkId:
                req.params.user2,

              receiverClerkId:
                req.params.user1,
            },
          ],
        }).sort({
          createdAt: 1,
        });

      res.status(200).json(
        messages
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
// GET INBOX CONVERSATIONS
// ==========================================
router.get(
  "/inbox/:clerkId",
  async (req, res) => {

    try {

      const myId =
        req.params.clerkId;

      const messages =
        await Message.find({
          $or: [
            {
              senderClerkId:
                myId,
            },
            {
              receiverClerkId:
                myId,
            },
          ],
        }).sort({
          createdAt: -1,
        });

      const uniqueChats =
        [];

      const usersSeen =
        new Set();

      messages.forEach(
        (msg) => {

          const otherUser =
            msg.senderClerkId ===
            myId
              ? msg.receiverClerkId
              : msg.senderClerkId;

          if (
            !usersSeen.has(
              otherUser
            )
          ) {

            usersSeen.add(
              otherUser
            );

            uniqueChats.push(
              msg
            );
          }
        }
      );

      res.status(200).json(
        uniqueChats
      );

    } catch (error) {

      console.log(error);

      res.status(500).json({
        message:
          "Server Error",
      });
    }
  }
);


// ==========================================
// MARK MESSAGES AS SEEN
// ==========================================
router.put(
  "/mark-seen",
  async (req, res) => {

    try {

      const {
        senderClerkId,
        receiverClerkId,
      } = req.body;

      await Message.updateMany(
        {
          senderClerkId,

          receiverClerkId,

          seen: false,
        },
        {
          seen: true,
        }
      );

      res.status(200).json({
        success: true,
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
// GET MY CHATS
// ==========================================
router.get(
  "/my-chats/:clerkId",
  async (req, res) => {

    try {

      const myId =
        req.params.clerkId;

      // ======================================
      // GET ALL MESSAGES
      // ======================================
      const messages =
        await Message.find({
          $or: [
            {
              senderClerkId:
                myId,
            },
            {
              receiverClerkId:
                myId,
            },
          ],
        }).sort({
          updatedAt: -1,
        });

      // ======================================
      // UNIQUE CHATS
      // ======================================
      const uniqueChats =
        [];

      const usersSeen =
        new Set();

      for (const msg of messages) {

        const otherUserId =
          msg.senderClerkId ===
          myId
            ? msg.receiverClerkId
            : msg.senderClerkId;

        // Prevent duplicate chats
        if (
          !usersSeen.has(
            otherUserId
          )
        ) {

          usersSeen.add(
            otherUserId
          );

          // ==================================
          // GET OTHER USER
          // ==================================
          const otherUser =
            await User.findOne({
              clerkId:
                otherUserId,
            });

          uniqueChats.push({

            otherUserId,

            otherUserName:
              otherUser?.name ||
              "Unknown User",

            lastMessage:
              msg.message,

            updatedAt:
              msg.updatedAt,

            unread:
              !msg.seen &&
              msg.receiverClerkId ===
                myId,
          });
        }
      }

      res.status(200).json(
        uniqueChats
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