import { logger } from "../../config/logger.js";

function errorMiddleware(
  error,
  req,
  res,
  next
) {
  if (error?.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "Request body is too large",
        details: []
      },
      requestId:
        req.requestId || null
    });
  }
  if (error?.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_JSON",
        message: "Request body contains invalid JSON",
        details: []
      },
      requestId:
        req.requestId || null
    });
  }
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
        isOperational &&
        Array.isArray(error.errors)
          ? error.errors
          : []
    },

    requestId:
      req.requestId || null
  };

  return res
    .status(statusCode)
    .json(response);
}

export default errorMiddleware;
