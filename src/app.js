
import express from "express";

import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";

import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

import requestIdMiddleware from "./common/middleware/request-id.middleware.js";

import notFoundMiddleware from "./common/middleware/not-found.middleware.js";
import errorMiddleware from "./common/middleware/error.middleware.js";

import apiRoutes from "./routes/index.js";
import paymentRoutes from "./modules/payments/payment.routes.js";

export function createApp() {
  const app = express();

  /*
   * Security
   * Prevent Express from exposing framework information.
   */
  app.disable("x-powered-by");

  /*
   * Structured HTTP logging.
   * Pino should run early so requests and responses are logged.
   */
  app.use(
    pinoHttp({
      logger
    })
  );

  /*
   * Request ID.
   * Every request receives a unique ID for tracing,
   * logging, debugging, and error responses.
   */
  app.use(requestIdMiddleware);

  /*
   * Security headers.
   */
  app.use(helmet());

  /*
   * CORS configuration.
   */
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true
    })
  );

  /*
   * Global API rate limiting.
   *
   * Authentication routes will later receive stricter,
   * separate rate limits.
   */
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      standardHeaders: "draft-7",
      legacyHeaders: false
    })
  );

  /*
   * JSON request parsing.
   *
   * The size limit protects the API from unnecessarily
   * large JSON payloads.
   */
  app.use(
    express.json({
      limit: "1mb"
    })
  );

  /*
   * API routes.
   */
  app.use("/api/v1", apiRoutes);

  /*
   * Payment routes.
   */
  app.use("/api/v1/payments", paymentRoutes);

  /*
   * Must be registered after all application routes.
   */
  app.use(notFoundMiddleware);

  /*
   * Global error handler.
   *
   * Must always be the final middleware.
   */
  app.use(errorMiddleware);

  return app;
}

