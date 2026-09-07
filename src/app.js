import express from "express";

import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";

import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

import {
  requestIdMiddleware
} from "./common/middleware/request-id.middleware.js";

import {
  notFoundMiddleware
} from "./common/middleware/not-found.middleware.js";

import {
  errorMiddleware
} from "./common/middleware/error.middleware.js";

import apiRoutes from "./routes/index.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");

  app.use(
    pinoHttp({
      logger
    })
  );

  app.use(
    requestIdMiddleware
  );

  app.use(
    helmet()
  );

  app.use(
    cors({
      origin: env.CORS_ORIGIN
    })
  );

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,

      limit: 100,

      standardHeaders: "draft-7",

      legacyHeaders: false
    })
  );

  app.use(
    express.json({
      limit: "1mb"
    })
  );

  app.use(
    "/api/v1",
    apiRoutes
  );

  app.use(
    notFoundMiddleware
  );

  app.use(
    errorMiddleware
  );

  return app;
}