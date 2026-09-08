import { Router } from "express";

import validate from "../../common/middleware/validate.middleware.js";

import authMiddleware from "../../common/middleware/auth.middleware.js";

import registerUser from "./user.controller.js";

import registerUserSchema from "./user.validator.js";

import loginUser from "./login-user.controller.js";

import loginUserSchema from "./login-user.validator.js";

import getProfile from "./profile.controller.js";

const router = Router();

router.post(
  "/register",
  validate(
    registerUserSchema
  ),
  registerUser
);

router.post(
  "/login",
  validate(
    loginUserSchema
  ),
  loginUser
);

router.get(
  "/profile",
  authMiddleware,
  getProfile
);

export default router;