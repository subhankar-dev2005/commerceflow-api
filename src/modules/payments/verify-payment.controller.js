import crypto from "crypto";

import Order from "../orders/order.model.js";
import razorpay from "./razorpay.service.js";
import { env } from "../../config/env.js";

async function verifyPayment(req, res, next) {
  try {
    const { orderId } = req.params;

    const {
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature
    } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ORDER_NOT_FOUND",
          message: "Order not found",
          details: []
        },
        requestId: req.requestId
      });
    }

    if (order.status === "cancelled") {
      return res.status(400).json({
        success: false,
        error: {
          code: "ORDER_CANCELLED",
          message: "Cannot verify payment for a cancelled order",
          details: []
        },
        requestId: req.requestId
      });
    }

    if (order.payment.status === "paid") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        data: {
          orderId: order._id,
          paymentStatus: order.payment.status,
          transactionId: order.payment.transactionId
        },
        requestId: req.requestId
      });
    }

    if (
      !order.payment.razorpayOrderId ||
      order.payment.razorpayOrderId !== razorpayOrderId
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_RAZORPAY_ORDER",
          message: "Razorpay order does not match this order",
          details: []
        },
        requestId: req.requestId
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_PAYMENT_SIGNATURE",
          message: "Payment signature verification failed",
          details: []
        },
        requestId: req.requestId
      });
    }

    const payment = await razorpay.payments.fetch(
      razorpayPaymentId
    );

    if (payment.order_id !== razorpayOrderId) {
      return res.status(400).json({
        success: false,
        error: {
          code: "PAYMENT_ORDER_MISMATCH",
          message: "Payment does not belong to this Razorpay order",
          details: []
        },
        requestId: req.requestId
      });
    }

    if (
      payment.amount !== Math.round(order.subtotal * 100) ||
      payment.currency !== "INR"
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: "PAYMENT_AMOUNT_MISMATCH",
          message: "Payment amount or currency does not match the order",
          details: []
        },
        requestId: req.requestId
      });
    }

    if (payment.status !== "captured") {
      return res.status(400).json({
        success: false,
        error: {
          code: "PAYMENT_NOT_CAPTURED",
          message: "Payment has not been captured",
          details: []
        },
        requestId: req.requestId
      });
    }

    order.payment.status = "paid";
    order.payment.transactionId = razorpayPaymentId;

    if (order.status === "pending") {
      order.status = "confirmed";
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: {
        orderId: order._id,
        paymentStatus: order.payment.status,
        transactionId: order.payment.transactionId,
        orderStatus: order.status
      },
      requestId: req.requestId
    });
  } catch (error) {
    next(error);
  }
}

export default verifyPayment;