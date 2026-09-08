import { Router } from "express";

import authMiddleware from "../common/middleware/auth.middleware.js";

import authorize from "../common/middleware/authorize.middleware.js";

const router = Router();

router.get(
  "/test",
  authMiddleware,
  authorize("admin"),
  function (
    req,
    res
  ) {
    return res.status(200).json({
      success: true,

      message:
        "Welcome Admin",

      data: {
        user: {
          id: req.user._id,
          email: req.user.email,
          role: req.user.role
        }
      },

      requestId:
        req.requestId
    });
  }
);

export default router;