import { Router } from "express";

import healthRoutes from "./health.routes.js";

import userRoutes from "../modules/users/user.routes.js";

const router = Router();

router.use(
  "/health",
  healthRoutes
);

router.use(
  "/users",
  userRoutes
);

export default router;