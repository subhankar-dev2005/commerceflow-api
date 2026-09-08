import bcrypt from "bcryptjs";

import User from "./user.model.js";
import AppError from "../../common/errors/app-error.js";
import generateToken from "../../utils/generate-token.js";

async function loginUser(
  req,
  res,
  next
) {
  try {
    const {
      email,
      password
    } = req.body;

    const user =
      await User.findOne({
        email
      }).select("+password");

    if (!user) {
      throw new AppError(
        "Invalid email or password",
        401,
        [],
        "INVALID_CREDENTIALS"
      );
    }

    const isPasswordValid =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isPasswordValid) {
      throw new AppError(
        "Invalid email or password",
        401,
        [],
        "INVALID_CREDENTIALS"
      );
    }

    const token =
      generateToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      });

    return res
      .status(200)
      .json({
        success: true,

        message:
          "User logged in successfully",

        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          },

          token
        },

        requestId:
          req.requestId
      });
  } catch (error) {
    next(error);
  }
}

export default loginUser;