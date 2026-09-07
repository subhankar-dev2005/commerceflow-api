import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

import { AppError } from "../errors/app-error.js";

export function errorMiddleware(
  error,
  req,
  res,
  _next
) {
  logger.error(
    {
      error,
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl
    },
    "Request failed"
  );

  if (error instanceof AppError) {
    return res.status(
      error.statusCode
    ).json({
      success: false,

      error: {
        code: error.code,
        message: error.message
      },

      requestId: req.requestId
    });
  }

  return res.status(500).json({
    success: false,

    error: {
      code: "INTERNAL_SERVER_ERROR",

      message:
        env.NODE_ENV === "production"
          ? "An unexpected error occurred"
          : error.message
    },

    requestId: req.requestId
  });
}