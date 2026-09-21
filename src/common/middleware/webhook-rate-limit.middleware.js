import rateLimit, { ipKeyGenerator } from "express-rate-limit";

import { env } from "../../config/env.js";

const webhookRateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.WEBHOOK_RATE_LIMIT || 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  message: {
    success: false,
    error: {
      code: "WEBHOOK_RATE_LIMIT_EXCEEDED",
      message: "Too many webhook requests. Please try again later.",
      details: []
    }
  }
});

export default webhookRateLimitMiddleware;
