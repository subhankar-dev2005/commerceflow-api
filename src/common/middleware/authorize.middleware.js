function authorize(...allowedRoles) {
  return function (
    req,
    res,
    next
  ) {
    if (!req.user) {
      return res.status(401).json({
        success: false,

        error: {
          code: "AUTH_REQUIRED",

          message:
            "Authentication is required"
        },

        requestId:
          req.requestId
      });
    }

    if (
      !allowedRoles.includes(
        req.user.role
      )
    ) {
      return res.status(403).json({
        success: false,

        error: {
          code: "FORBIDDEN",

          message:
            "You do not have permission to access this resource"
        },

        requestId:
          req.requestId
      });
    }

    next();
  };
}

export default authorize;