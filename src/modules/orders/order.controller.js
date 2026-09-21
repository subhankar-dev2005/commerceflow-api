import Cart from "../cart/cart.model.js";
import Product from "../products/product.model.js";
import Address from "../users/address.model.js";
import Order from "./order.model.js";

import AppError from "../../common/errors/app-error.js";

async function createOrder(req, res, next) {
  try {
    const { addressId } = req.body;

    const address = await Address.findOne({
      _id: addressId,
      user: req.user._id
    });

    if (!address) {
      throw new AppError(
        "Shipping address not found",
        404,
        [],
        "ADDRESS_NOT_FOUND"
      );
    }

    const cart = await Cart.findOne({
      user: req.user._id
    }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      throw new AppError(
        "Cart is empty",
        400,
        [],
        "CART_EMPTY"
      );
    }

    const orderItems = [];

    let totalQuantity = 0;
    let subtotal = 0;

    for (const cartItem of cart.items) {
      const product = await Product.findOne({
        _id: cartItem.product._id,
        isActive: true
      });

      if (!product) {
        throw new AppError(
          "A product in the cart is no longer available",
          404,
          [],
          "PRODUCT_NOT_FOUND"
        );
      }

      if (product.stock < cartItem.quantity) {
        throw new AppError(
          `Insufficient stock for ${product.name}`,
          400,
          [],
          "INSUFFICIENT_STOCK"
        );
      }

      const itemSubtotal =
        product.price * cartItem.quantity;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity,
        subtotal: itemSubtotal
      });

      totalQuantity += cartItem.quantity;
      subtotal += itemSubtotal;
    }

    const deductedItems = [];

    try {
      for (const item of orderItems) {
        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: item.product,
            isActive: true,
            stock: { $gte: item.quantity }
          },
          {
            $inc: {
              stock: -item.quantity
            }
          },
          {
            new: true
          }
        );

        if (!updatedProduct) {
          const productExists = await Product.findOne({
            _id: item.product,
            isActive: true
          });

          if (!productExists) {
            throw new AppError(
              "A product in the cart is no longer available",
              404,
              [],
              "PRODUCT_NOT_FOUND"
            );
          }

          throw new AppError(
            `Insufficient stock for ${item.name}`,
            400,
            [],
            "INSUFFICIENT_STOCK"
          );
        }

        deductedItems.push(item);
      }

      const shippingAddress = {
        fullName: address.fullName,
        phone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country
      };

      const order = await Order.create({
        user: req.user._id,
        items: orderItems,
        totalQuantity,
        subtotal,
        payment: {
          provider: "razorpay",
          status: "pending",
          transactionId: ""
        },
        shippingAddress,
        status: "pending"
      });

      cart.items = [];

      await cart.save();

      return res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: {
          order
        },
        requestId: req.requestId
      });
    } catch (error) {
      if (deductedItems.length > 0) {
        for (const item of deductedItems) {
          try {
            await Product.findByIdAndUpdate(item.product, {
              $inc: { stock: item.quantity }
            });
          } catch {
            // Do not override original error during rollback
          }
        }
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
}

export {
  createOrder
};