import crypto from "crypto";

import Order from "../orders/order.model.js";
import razorpay from "./razorpay.service.js";
import { env } from "../../config/env.js";
import AppError from "../../common/errors/app-error.js";

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
      throw new AppError(
        "Order not found",
        404,
        [],
        "ORDER_NOT_FOUND"
      );
    }

    if (order.status === "cancelled") {
      throw new AppError(
        "Cannot verify payment for a cancelled order",
        400,
        [],
        "ORDER_CANCELLED"
      );
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
      throw new AppError(
        "Razorpay order does not match this order",
        400,
        [],
        "INVALID_RAZORPAY_ORDER"
      );
    }

    const generatedSignature = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    const signatureBuffer = Buffer.from(
      typeof razorpaySignature === "string" ? razorpaySignature : "",
      "utf8"
    );
    const generatedBuffer = Buffer.from(generatedSignature, "utf8");

    if (
      !razorpaySignature ||
      signatureBuffer.length !== generatedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, generatedBuffer)
    ) {
      throw new AppError(
        "Payment signature verification failed",
        400,
        [],
        "INVALID_PAYMENT_SIGNATURE"
      );
    }

    const payment = await razorpay.payments.fetch(
      razorpayPaymentId
    );

    if (payment.order_id !== razorpayOrderId) {
      throw new AppError(
        "Payment does not belong to this Razorpay order",
        400,
        [],
        "PAYMENT_ORDER_MISMATCH"
      );
    }

    if (
      payment.amount !== Math.round(order.subtotal * 100) ||
      payment.currency !== "INR"
    ) {
      throw new AppError(
        "Payment amount or currency does not match the order",
        400,
        [],
        "PAYMENT_AMOUNT_MISMATCH"
      );
    }

    if (payment.status !== "captured") {
      throw new AppError(
        "Payment has not been captured",
        400,
        [],
        "PAYMENT_NOT_CAPTURED"
      );
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