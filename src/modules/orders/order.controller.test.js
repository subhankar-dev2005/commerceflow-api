
import {
  describe,
  it,
  expect,
  vi,
  beforeEach
} from "vitest";

import Address from "../users/address.model.js";
import Cart from "../cart/cart.model.js";
import Product from "../products/product.model.js";

import Order from "./order.model.js";

import { createOrder } from "./order.controller.js";

describe("createOrder", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should return ADDRESS_NOT_FOUND when the shipping address does not exist", async () => {
    vi.spyOn(Address, "findOne").mockResolvedValue(null);

    const req = {
      body: {
        addressId: "507f1f77bcf86cd799439011"
      },
      user: {
        _id: "507f1f77bcf86cd799439012"
      },
      requestId: "test-request-id"
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    const next = vi.fn();

    await createOrder(req, res, next);

    expect(Address.findOne).toHaveBeenCalledWith({
      _id: "507f1f77bcf86cd799439011",
      user: "507f1f77bcf86cd799439012"
    });

    expect(next).toHaveBeenCalledTimes(1);

    const error = next.mock.calls[0][0];

    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("ADDRESS_NOT_FOUND");
    expect(error.message).toBe(
      "Shipping address not found"
    );

    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return CART_EMPTY when the cart does not exist", async () => {
    vi.spyOn(Address, "findOne").mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      user: "507f1f77bcf86cd799439012",
      fullName: "Test Customer",
      phone: "9876543210",
      addressLine1: "123 Test Street",
      addressLine2: "",
      city: "Kolkata",
      state: "West Bengal",
      postalCode: "700001",
      country: "India"
    });

    vi.spyOn(Cart, "findOne").mockReturnValue({
      populate: vi.fn().mockResolvedValue(null)
    });

    const req = {
      body: {
        addressId: "507f1f77bcf86cd799439011"
      },
      user: {
        _id: "507f1f77bcf86cd799439012"
      },
      requestId: "test-request-id"
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    const next = vi.fn();

    await createOrder(req, res, next);

    expect(Cart.findOne).toHaveBeenCalledWith({
      user: "507f1f77bcf86cd799439012"
    });

    expect(next).toHaveBeenCalledTimes(1);

    const error = next.mock.calls[0][0];

    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("CART_EMPTY");
    expect(error.message).toBe("Cart is empty");

    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return PRODUCT_NOT_FOUND when a cart product is no longer available", async () => {
    vi.spyOn(Address, "findOne").mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      user: "507f1f77bcf86cd799439012",
      fullName: "Test Customer",
      phone: "9876543210",
      addressLine1: "123 Test Street",
      addressLine2: "",
      city: "Kolkata",
      state: "West Bengal",
      postalCode: "700001",
      country: "India"
    });

    vi.spyOn(Cart, "findOne").mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        items: [
          {
            product: {
              _id: "507f1f77bcf86cd799439013"
            },
            quantity: 1
          }
        ]
      })
    });

    vi.spyOn(Product, "findOne").mockResolvedValue(null);

    const req = {
      body: {
        addressId: "507f1f77bcf86cd799439011"
      },
      user: {
        _id: "507f1f77bcf86cd799439012"
      },
      requestId: "test-request-id"
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    const next = vi.fn();

    await createOrder(req, res, next);

    expect(Product.findOne).toHaveBeenCalledWith({
      _id: "507f1f77bcf86cd799439013",
      isActive: true
    });

    expect(next).toHaveBeenCalledTimes(1);

    const error = next.mock.calls[0][0];

    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("PRODUCT_NOT_FOUND");
    expect(error.message).toBe(
      "A product in the cart is no longer available"
    );

    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return INSUFFICIENT_STOCK when product stock is too low", async () => {
    vi.spyOn(Address, "findOne").mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      user: "507f1f77bcf86cd799439012",
      fullName: "Test Customer",
      phone: "9876543210",
      addressLine1: "123 Test Street",
      addressLine2: "",
      city: "Kolkata",
      state: "West Bengal",
      postalCode: "700001",
      country: "India"
    });

    vi.spyOn(Cart, "findOne").mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        items: [
          {
            product: {
              _id: "507f1f77bcf86cd799439013"
            },
            quantity: 5
          }
        ]
      })
    });

    vi.spyOn(Product, "findOne").mockResolvedValue({
      _id: "507f1f77bcf86cd799439013",
      name: "Test Product",
      price: 100,
      stock: 2,
      isActive: true
    });

    const req = {
      body: {
        addressId: "507f1f77bcf86cd799439011"
      },
      user: {
        _id: "507f1f77bcf86cd799439012"
      },
      requestId: "test-request-id"
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    const next = vi.fn();

    await createOrder(req, res, next);

    expect(Product.findOne).toHaveBeenCalledWith({
      _id: "507f1f77bcf86cd799439013",
      isActive: true
    });

    expect(next).toHaveBeenCalledTimes(1);

    const error = next.mock.calls[0][0];

    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("INSUFFICIENT_STOCK");
    expect(error.message).toBe(
      "Insufficient stock for Test Product"
    );

    expect(res.status).not.toHaveBeenCalled();
  });

  it("should create an order, reduce stock, and clear the cart", async () => {
    const address = {
      _id: "507f1f77bcf86cd799439011",
      user: "507f1f77bcf86cd799439012",
      fullName: "Test Customer",
      phone: "9876543210",
      addressLine1: "123 Test Street",
      addressLine2: "",
      city: "Kolkata",
      state: "West Bengal",
      postalCode: "700001",
      country: "India"
    };

    const cart = {
      items: [
        {
          product: {
            _id: "507f1f77bcf86cd799439013"
          },
          quantity: 2
        }
      ],
      save: vi.fn().mockResolvedValue(true)
    };

    const product = {
      _id: "507f1f77bcf86cd799439013",
      name: "Test Product",
      price: 250,
      stock: 10,
      isActive: true
    };

    const createdOrder = {
      _id: "507f1f77bcf86cd799439014",
      user: "507f1f77bcf86cd799439012",
      items: [
        {
          product: "507f1f77bcf86cd799439013",
          name: "Test Product",
          price: 250,
          quantity: 2,
          subtotal: 500
        }
      ],
      totalQuantity: 2,
      subtotal: 500,
      payment: {
        provider: "razorpay",
        status: "pending",
        transactionId: ""
      },
      shippingAddress: {
        fullName: "Test Customer",
        phone: "9876543210",
        addressLine1: "123 Test Street",
        addressLine2: "",
        city: "Kolkata",
        state: "West Bengal",
        postalCode: "700001",
        country: "India"
      },
      status: "pending"
    };

    vi.spyOn(Address, "findOne").mockResolvedValue(address);

    vi.spyOn(Cart, "findOne").mockReturnValue({
      populate: vi.fn().mockResolvedValue(cart)
    });

    vi.spyOn(Product, "findOne").mockResolvedValue(product);

    vi.spyOn(Order, "create").mockResolvedValue(createdOrder);

    vi.spyOn(Product, "findOneAndUpdate").mockResolvedValue({
      ...product,
      stock: 8
    });

    const req = {
      body: {
        addressId: "507f1f77bcf86cd799439011"
      },
      user: {
        _id: "507f1f77bcf86cd799439012"
      },
      requestId: "test-request-id"
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    const next = vi.fn();

    await createOrder(req, res, next);

    expect(Order.create).toHaveBeenCalledWith({
      user: "507f1f77bcf86cd799439012",
      items: [
        {
          product: "507f1f77bcf86cd799439013",
          name: "Test Product",
          price: 250,
          quantity: 2,
          subtotal: 500
        }
      ],
      totalQuantity: 2,
      subtotal: 500,
      payment: {
        provider: "razorpay",
        status: "pending",
        transactionId: ""
      },
      shippingAddress: {
        fullName: "Test Customer",
        phone: "9876543210",
        addressLine2: "",
        addressLine1: "123 Test Street",
        city: "Kolkata",
        state: "West Bengal",
        postalCode: "700001",
        country: "India"
      },
      status: "pending"
    });

    expect(Product.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: "507f1f77bcf86cd799439013",
        isActive: true,
        stock: { $gte: 2 }
      },
      {
        $inc: {
          stock: -2
        }
      },
      {
        new: true
      }
    );

    expect(cart.items).toEqual([]);

    expect(cart.save).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(201);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Order created successfully",
      data: {
        order: createdOrder
      },
      requestId: "test-request-id"
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("should create a multi-item order and deduct stock for all items", async () => {
    const address = {
      _id: "507f1f77bcf86cd799439011",
      user: "507f1f77bcf86cd799439012",
      fullName: "Test Customer",
      phone: "9876543210",
      addressLine1: "123 Test Street",
      addressLine2: "",
      city: "Kolkata",
      state: "West Bengal",
      postalCode: "700001",
      country: "India"
    };

    const cart = {
      items: [
        {
          product: { _id: "507f1f77bcf86cd799439013" },
          quantity: 2
        },
        {
          product: { _id: "507f1f77bcf86cd799439014" },
          quantity: 3
        }
      ],
      save: vi.fn().mockResolvedValue(true)
    };

    const productA = {
      _id: "507f1f77bcf86cd799439013",
      name: "Product A",
      price: 100,
      stock: 5,
      isActive: true
    };

    const productB = {
      _id: "507f1f77bcf86cd799439014",
      name: "Product B",
      price: 200,
      stock: 10,
      isActive: true
    };

    const createdOrder = {
      _id: "507f1f77bcf86cd799439015",
      user: "507f1f77bcf86cd799439012",
      items: [
        {
          product: productA._id,
          name: productA.name,
          price: productA.price,
          quantity: 2,
          subtotal: 200
        },
        {
          product: productB._id,
          name: productB.name,
          price: productB.price,
          quantity: 3,
          subtotal: 600
        }
      ],
      totalQuantity: 5,
      subtotal: 800
    };

    vi.spyOn(Address, "findOne").mockResolvedValue(address);
    vi.spyOn(Cart, "findOne").mockReturnValue({
      populate: vi.fn().mockResolvedValue(cart)
    });

    vi.spyOn(Product, "findOne").mockImplementation(async (query) => {
      if (query._id === productA._id) return productA;
      if (query._id === productB._id) return productB;
      return null;
    });

    vi.spyOn(Product, "findOneAndUpdate").mockImplementation(async (query) => {
      if (query._id === productA._id) return { ...productA, stock: 3 };
      if (query._id === productB._id) return { ...productB, stock: 7 };
      return null;
    });

    vi.spyOn(Order, "create").mockResolvedValue(createdOrder);

    const req = {
      body: { addressId: address._id },
      user: { _id: address.user },
      requestId: "test-request-id"
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const next = vi.fn();

    await createOrder(req, res, next);

    expect(Product.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: productA._id, isActive: true, stock: { $gte: 2 } },
      { $inc: { stock: -2 } },
      { new: true }
    );
    expect(Product.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: productB._id, isActive: true, stock: { $gte: 3 } },
      { $inc: { stock: -3 } },
      { new: true }
    );
    expect(Order.create).toHaveBeenCalled();
    expect(cart.save).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(next).not.toHaveBeenCalled();
  });

  it("should rollback previously deducted stock when a later item has insufficient stock", async () => {
    const address = {
      _id: "507f1f77bcf86cd799439011",
      user: "507f1f77bcf86cd799439012"
    };

    const cart = {
      items: [
        {
          product: { _id: "507f1f77bcf86cd799439013" },
          quantity: 2
        },
        {
          product: { _id: "507f1f77bcf86cd799439014" },
          quantity: 5
        }
      ],
      save: vi.fn().mockResolvedValue(true)
    };

    const productA = {
      _id: "507f1f77bcf86cd799439013",
      name: "Product A",
      price: 100,
      stock: 5,
      isActive: true
    };

    const productB = {
      _id: "507f1f77bcf86cd799439014",
      name: "Product B",
      price: 200,
      stock: 5,
      isActive: true
    };

    vi.spyOn(Address, "findOne").mockResolvedValue(address);
    vi.spyOn(Cart, "findOne").mockReturnValue({
      populate: vi.fn().mockResolvedValue(cart)
    });

    vi.spyOn(Product, "findOne").mockImplementation(async (query) => {
      if (query._id === productA._id) return productA;
      if (query._id === productB._id) return productB;
      return null;
    });

    vi.spyOn(Product, "findOneAndUpdate").mockImplementation(async (query) => {
      if (query._id === productA._id) return { ...productA, stock: 3 };
      if (query._id === productB._id) return null;
      return null;
    });

    vi.spyOn(Product, "findByIdAndUpdate").mockResolvedValue(true);
    vi.spyOn(Order, "create");

    const req = {
      body: { addressId: address._id },
      user: { _id: address.user },
      requestId: "test-request-id"
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const next = vi.fn();

    await createOrder(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("INSUFFICIENT_STOCK");

    expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(productA._id, {
      $inc: { stock: 2 }
    });
    expect(Product.findByIdAndUpdate).not.toHaveBeenCalledWith(productB._id, expect.anything());
    expect(Order.create).not.toHaveBeenCalled();
    expect(cart.save).not.toHaveBeenCalled();
  });

  it("should rollback earlier stock deduction when a product does not exist during deduction", async () => {
    const address = {
      _id: "507f1f77bcf86cd799439011",
      user: "507f1f77bcf86cd799439012"
    };

    const cart = {
      items: [
        {
          product: { _id: "507f1f77bcf86cd799439013" },
          quantity: 2
        },
        {
          product: { _id: "507f1f77bcf86cd799439014" },
          quantity: 1
        }
      ],
      save: vi.fn().mockResolvedValue(true)
    };

    const productA = {
      _id: "507f1f77bcf86cd799439013",
      name: "Product A",
      price: 100,
      stock: 5,
      isActive: true
    };

    const productB = {
      _id: "507f1f77bcf86cd799439014",
      name: "Product B",
      price: 200,
      stock: 5,
      isActive: true
    };

    vi.spyOn(Address, "findOne").mockResolvedValue(address);
    vi.spyOn(Cart, "findOne").mockReturnValue({
      populate: vi.fn().mockResolvedValue(cart)
    });

    let findOneCallCount = 0;
    vi.spyOn(Product, "findOne").mockImplementation(async (query) => {
      findOneCallCount++;
      if (findOneCallCount <= 2) {
        if (query._id === productA._id) return productA;
        if (query._id === productB._id) return productB;
      }
      if (query._id === productB._id) return null;
      return null;
    });

    vi.spyOn(Product, "findOneAndUpdate").mockImplementation(async (query) => {
      if (query._id === productA._id) return { ...productA, stock: 3 };
      if (query._id === productB._id) return null;
      return null;
    });

    vi.spyOn(Product, "findByIdAndUpdate").mockResolvedValue(true);
    vi.spyOn(Order, "create");

    const req = {
      body: { addressId: address._id },
      user: { _id: address.user },
      requestId: "test-request-id"
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const next = vi.fn();

    await createOrder(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("PRODUCT_NOT_FOUND");

    expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(productA._id, {
      $inc: { stock: 2 }
    });
    expect(Order.create).not.toHaveBeenCalled();
    expect(cart.save).not.toHaveBeenCalled();
  });

  it("should rollback every successful stock deduction when order creation fails", async () => {
    const address = {
      _id: "507f1f77bcf86cd799439011",
      user: "507f1f77bcf86cd799439012"
    };

    const cart = {
      items: [
        {
          product: { _id: "507f1f77bcf86cd799439013" },
          quantity: 2
        },
        {
          product: { _id: "507f1f77bcf86cd799439014" },
          quantity: 3
        }
      ],
      save: vi.fn().mockResolvedValue(true)
    };

    const productA = {
      _id: "507f1f77bcf86cd799439013",
      name: "Product A",
      price: 100,
      stock: 5,
      isActive: true
    };

    const productB = {
      _id: "507f1f77bcf86cd799439014",
      name: "Product B",
      price: 200,
      stock: 10,
      isActive: true
    };

    vi.spyOn(Address, "findOne").mockResolvedValue(address);
    vi.spyOn(Cart, "findOne").mockReturnValue({
      populate: vi.fn().mockResolvedValue(cart)
    });

    vi.spyOn(Product, "findOne").mockImplementation(async (query) => {
      if (query._id === productA._id) return productA;
      if (query._id === productB._id) return productB;
      return null;
    });

    vi.spyOn(Product, "findOneAndUpdate").mockImplementation(async (query) => {
      if (query._id === productA._id) return { ...productA, stock: 3 };
      if (query._id === productB._id) return { ...productB, stock: 7 };
      return null;
    });

    const dbError = new Error("Database failure during Order.create");
    vi.spyOn(Order, "create").mockRejectedValue(dbError);

    vi.spyOn(Product, "findByIdAndUpdate").mockResolvedValue(true);

    const req = {
      body: { addressId: address._id },
      user: { _id: address.user },
      requestId: "test-request-id"
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const next = vi.fn();

    await createOrder(req, res, next);

    expect(next).toHaveBeenCalledWith(dbError);

    expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(productA._id, {
      $inc: { stock: 2 }
    });
    expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(productB._id, {
      $inc: { stock: 3 }
    });
    expect(cart.save).not.toHaveBeenCalled();
  });
});
