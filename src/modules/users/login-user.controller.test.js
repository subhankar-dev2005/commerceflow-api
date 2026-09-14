import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn()
  }
}));

vi.mock("./user.model.js", () => ({
  default: {
    findOne: vi.fn()
  }
}));

vi.mock("../../utils/generate-token.js", () => ({
  default: vi.fn()
}));

import bcrypt from "bcryptjs";
import User from "./user.model.js";
import generateToken from "../../utils/generate-token.js";
import loginUser from "./login-user.controller.js";

describe("loginUser", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      body: {
        email: "testcustomer@commerceflow.com",
        password: "correct-password"
      },
      requestId: "test-request-id"
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };

    next = vi.fn();
  });

  it("logs in successfully with valid credentials", async () => {
    const user = {
      _id: "507f1f77bcf86cd799439011",
      name: "Test Customer",
      email: "testcustomer@commerceflow.com",
      role: "customer",
      password: "hashed-password"
    };

    const select = vi.fn().mockResolvedValue(user);

    User.findOne.mockReturnValue({
      select
    });

    bcrypt.compare.mockResolvedValue(true);
    generateToken.mockReturnValue("test-jwt-token");

    await loginUser(req, res, next);

    expect(User.findOne).toHaveBeenCalledWith({
      email: "testcustomer@commerceflow.com"
    });

    expect(select).toHaveBeenCalledWith("+password");

    expect(bcrypt.compare).toHaveBeenCalledWith(
      "correct-password",
      "hashed-password"
    );

    expect(generateToken).toHaveBeenCalledWith({
      userId: "507f1f77bcf86cd799439011",
      email: "testcustomer@commerceflow.com",
      role: "customer"
    });

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "User logged in successfully",
      data: {
        user: {
          id: "507f1f77bcf86cd799439011",
          name: "Test Customer",
          email: "testcustomer@commerceflow.com",
          role: "customer"
        },
        token: "test-jwt-token"
      },
      requestId: "test-request-id"
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("rejects login when user does not exist", async () => {
    const select = vi.fn().mockResolvedValue(null);

    User.findOne.mockReturnValue({
      select
    });

    await loginUser(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const error = next.mock.calls[0][0];

    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("INVALID_CREDENTIALS");
    expect(error.message).toBe(
      "Invalid email or password"
    );

    expect(bcrypt.compare).not.toHaveBeenCalled();
    expect(generateToken).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("rejects login when password is incorrect", async () => {
    const user = {
      _id: "507f1f77bcf86cd799439011",
      name: "Test Customer",
      email: "testcustomer@commerceflow.com",
      role: "customer",
      password: "hashed-password"
    };

    const select = vi.fn().mockResolvedValue(user);

    User.findOne.mockReturnValue({
      select
    });

    bcrypt.compare.mockResolvedValue(false);

    await loginUser(req, res, next);

    expect(bcrypt.compare).toHaveBeenCalledWith(
      "correct-password",
      "hashed-password"
    );

    expect(next).toHaveBeenCalledTimes(1);

    const error = next.mock.calls[0][0];

    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("INVALID_CREDENTIALS");
    expect(error.message).toBe(
      "Invalid email or password"
    );

    expect(generateToken).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
