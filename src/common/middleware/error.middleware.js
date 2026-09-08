import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

export function errorMiddleware(
  error,
  req,
  res,
  next
) {
  const statusCode =
    Number.isInteger(error.statusCode)
      ? error.statusCode
      : 500;

  const isOperational =
    error.isOperational === true;

  const message =
    isOperational
      ? error.message
      : "Internal server error";

  const errorCode =
    isOperational && error.code
      ? error.code
      : "INTERNAL_SERVER_ERROR";

  logger.error(
    {
      err: error,
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode,
      errorCode
    },
    message
  );

  const response = {
    success: false,

    error: {
      code: errorCode,

      message,

      details:
        isOperational && Array.isArray(error.errors)
          ? error.errors
          : []
    },

    requestId:
      req.requestId || null
  };

  if (env.NODE_ENV !== "production") {
    response.stack = error.stack;
  }

  return res
    .status(statusCode)
    .json(response);
}