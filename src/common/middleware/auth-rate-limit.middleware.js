import rateLimit from "express-rate-limit";

const authRateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "AUTH_RATE_LIMIT_EXCEEDED",
      message: "Too many authentication attempts. Please try again later.",
      details: []
    }
  }
});

export default authRateLimitMiddleware;
