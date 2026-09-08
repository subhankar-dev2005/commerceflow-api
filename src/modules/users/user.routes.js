import { Router } from "express";

import { validate } from "../../common/middleware/validate.middleware.js";

import {
  registerUser
} from "./user.controller.js";

import {
  registerUserSchema
} from "./user.validator.js";

const router = Router();

router.post(
  "/register",
  validate(
    registerUserSchema
  ),
  registerUser
);

export default router;