
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
   * Reverse proxy trust configuration.
   * Never blindly trust all proxies (trust proxy = true).
   * Safe default: false (standalone / direct connections).
   * When behind a trusted proxy (e.g. Nginx, ALB): set to hop count (e.g. 1) or CIDR/loopback.
   */
  if (env.TRUST_PROXY === "false" || !env.TRUST_PROXY) {
    app.set("trust proxy", false);
  } else if (env.TRUST_PROXY === "true") {
    app.set("trust proxy", 1);
  } else {
    const num = Number(env.TRUST_PROXY);
    app.set(
      "trust proxy",
      Number.isInteger(num) && num > 0 ? num : env.TRUST_PROXY
    );
  }

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
   * Webhook and authentication routes receive separate,
   * dedicated rate limits.
   */
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      skip: (req) => req.originalUrl.startsWith("/api/v1/payments/webhook")
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
    limit: "1mb",
    verify: (req, res, buf) => {
      if (req.originalUrl === "/api/v1/payments/webhook") {
        req.rawBody = buf;
      }
    }
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

