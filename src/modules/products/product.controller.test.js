import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./product.model.js", () => ({
  default: {
    create: vi.fn(),
    countDocuments: vi.fn(),
    find: vi.fn()
  }
}));

import Product from "./product.model.js";
import { getProducts, createProduct } from "./product.controller.js";

describe("product.controller - getProducts search sanitization", () => {
  let req;
  let res;
  let next;
  let mockQuery;

  beforeEach(() => {
    vi.clearAllMocks();

    mockQuery = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([])
    };

    Product.find.mockReturnValue(mockQuery);
    Product.countDocuments.mockResolvedValue(0);

    req = {
      query: {},
      requestId: "test-request-id"
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };

    next = vi.fn();
  });

  it("handles normal search correctly", async () => {
    req.query.search = "laptop";

    await getProducts(req, res, next);

    expect(Product.find).toHaveBeenCalledWith(
      expect.objectContaining({
        isActive: true,
        $or: [
          { name: { $regex: "laptop", $options: "i" } },
          { description: { $regex: "laptop", $options: "i" } }
        ]
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it("treats regex metacharacters literally", async () => {
    req.query.search = "item.*+?^${}()|[]\\test";

    await getProducts(req, res, next);

    const expectedEscaped = "item\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\test";

    expect(Product.find).toHaveBeenCalledWith(
      expect.objectContaining({
        isActive: true,
        $or: [
          { name: { $regex: expectedEscaped, $options: "i" } },
          { description: { $regex: expectedEscaped, $options: "i" } }
        ]
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("does not produce an invalid-regex error with unclosed parenthesis or bracket", async () => {
    req.query.search = "phone (black [128gb";

    await getProducts(req, res, next);

    const expectedEscaped = "phone \\(black \\[128gb";

    expect(Product.find).toHaveBeenCalledWith(
      expect.objectContaining({
        isActive: true,
        $or: [
          { name: { $regex: expectedEscaped, $options: "i" } },
          { description: { $regex: expectedEscaped, $options: "i" } }
        ]
      })
    );

    // Verify the escaped string can actually compile into a valid RegExp without throwing
    expect(() => new RegExp(expectedEscaped, "i")).not.toThrow();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it("ensures both name and description search use the sanitized value", async () => {
    req.query.search = "test+product(v1)";

    await getProducts(req, res, next);

    const expectedEscaped = "test\\+product\\(v1\\)";

    expect(Product.find).toHaveBeenCalledWith(
      expect.objectContaining({
        $or: [
          { name: { $regex: expectedEscaped, $options: "i" } },
          { description: { $regex: expectedEscaped, $options: "i" } }
        ]
      })
    );
  });
});
