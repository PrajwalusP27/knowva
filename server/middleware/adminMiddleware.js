const User =
  require("../models/User");

// ==========================================
// ADMIN MIDDLEWARE
// Reads clerkId from request header or body,
// looks up the user, and blocks anyone whose
// role is not "admin" with a 403 response.
//
// Usage: apply to any admin-only route.
//   router.get("/something", adminOnly, handler)
// ==========================================
const adminOnly =
  async (req, res, next) => {

    try {

      // Frontend sends clerkId in the header
      const clerkId =
        req.headers["x-clerk-id"] ||
        req.body?.clerkId;

      if (!clerkId) {

        return res.status(401).json({
          success: false,
          message: "Unauthorized: no user ID provided",
        });
      }

      const user =
        await User.findOne({ clerkId });

      if (!user) {

        return res.status(401).json({
          success: false,
          message: "Unauthorized: user not found",
        });
      }

      if (user.role !== "admin") {

        return res.status(403).json({
          success: false,
          message: "Forbidden: admin access only",
        });
      }

      // Attach user to request for downstream use
      req.adminUser = user;

      next();

    } catch (error) {

      console.log(error);

      res.status(500).json({
        success: false,
        message: "Server Error",
      });
    }
  };

module.exports = adminOnly;
