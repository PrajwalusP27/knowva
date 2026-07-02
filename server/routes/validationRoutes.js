const express =
  require("express");

const router =
  express.Router();

const Validation =
  require("../models/Validation");

const Session =
  require("../models/Session");


// ==========================================
// CREATE VALIDATION
// ==========================================
router.post(
  "/create",
  async (req, res) => {

    try {

      const validation =
        new Validation(
          req.body
        );

      await validation.save();

      // ======================================
      // MARK SESSION AS VALIDATED
      // Update hasValidated on the linked
      // session so the UI knows validation
      // was already submitted — no new route
      // needed.
      // ======================================
      if (req.body.sessionId) {

        await Session.findByIdAndUpdate(
          req.body.sessionId,
          { hasValidated: true }
        );
      }

      res.status(201).json({
        success: true,
        validation,
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
// GET USER VALIDATIONS
// ==========================================
router.get(
  "/user/:clerkId",
  async (req, res) => {

    try {

      const validations =
        await Validation.find({
          receiverClerkId:
            req.params.clerkId,
        }).sort({
          createdAt: -1,
        });

      res.status(200).json(
        validations
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
// VERIFIED SKILLS
// ==========================================
router.get(
  "/verified-skills/:clerkId",
  async (req, res) => {

    try {

      const validations =
        await Validation.find({
          receiverClerkId:
            req.params.clerkId,

          result:
            "pass",
        });

      const skillMap =
        {};

      validations.forEach(
        (item) => {

          if (
            !skillMap[
              item.skill
            ]
          ) {

            skillMap[
              item.skill
            ] = {

              total:
                0,

              count:
                0,
            };
          }

          skillMap[
            item.skill
          ].total +=
            item.rating;

          skillMap[
            item.skill
          ].count +=
            1;
        }
      );

      const verifiedSkills =
        Object.keys(
          skillMap
        ).map(
          (skill) => ({

            skill,

            averageRating:
              (
                skillMap[
                  skill
                ].total /
                skillMap[
                  skill
                ].count
              ).toFixed(
                1
              ),

            verifiedBy:
              skillMap[
                skill
              ].count,
          })
        );

      res.status(200).json(
        verifiedSkills
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

module.exports =
  router;
