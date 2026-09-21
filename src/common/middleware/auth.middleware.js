import AppError from "../errors/app-error.js";

import verifyToken from "../../utils/verify-token.js";

import User from "../../modules/users/user.model.js";

async function authMiddleware(
  req,
  res,
  next
) {
  try {
    const authorizationHeader =
      req.headers.authorization;

    if (
      !authorizationHeader ||
      !authorizationHeader.startsWith(
        "Bearer "
      )
    ) {
      throw new AppError(
        "Authentication token is required",
        401,
        [],
        "AUTH_TOKEN_REQUIRED"
      );
    }

    const token =
      authorizationHeader.split(
        " "
      )[1];

    const decoded =
      verifyToken(token);

    const user =
      await User.findById(
        decoded.userId
      );

    if (!user) {
      throw new AppError(
        "User no longer exists",
        401,
        [],
        "USER_NOT_FOUND"
      );
    }

    if (user.isActive === false) {
      throw new AppError(
        "User account is deactivated",
        401,
        [],
        "ACCOUNT_DEACTIVATED"
      );
    }

    req.user = user;

    next();
  } catch (error) {
    if (
      error.name ===
      "JsonWebTokenError"
    ) {
      return next(
        new AppError(
          "Invalid authentication token",
          401,
          [],
          "INVALID_AUTH_TOKEN"
        )
      );
    }

    if (
      error.name ===
      "TokenExpiredError"
    ) {
      return next(
        new AppError(
          "Authentication token has expired",
          401,
          [],
          "AUTH_TOKEN_EXPIRED"
        )
      );
    }

    next(error);
  }
}

export default authMiddleware;