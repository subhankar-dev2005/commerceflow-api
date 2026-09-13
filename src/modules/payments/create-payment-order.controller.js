import Order from "../orders/order.model.js";
import razorpay from "./razorpay.service.js";

async function createPaymentOrder(req, res, next) {
  try {
    const { orderId } = req.params;

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
          message: "Cannot create payment for a cancelled order",
          details: []
        },
        requestId: req.requestId
      });
    }

    if (order.payment.status === "paid") {
      return res.status(400).json({
        success: false,
        error: {
          code: "ORDER_ALREADY_PAID",
          message: "Order has already been paid",
          details: []
        },
        requestId: req.requestId
      });
    }

    if (order.payment.razorpayOrderId) {
      return res.status(200).json({
        success: true,
        message: "Payment order already exists",
        data: {
          razorpayOrderId: order.payment.razorpayOrderId,
          amount: Math.round(order.subtotal * 100),
          currency: "INR",
          keyId: process.env.RAZORPAY_KEY_ID
        },
        requestId: req.requestId
      });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.subtotal * 100),
      currency: "INR",
      receipt: order._id.toString()
    });

    order.payment.razorpayOrderId = razorpayOrder.id;

    await order.save();

    return res.status(201).json({
      success: true,
      message: "Payment order created successfully",
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID
      },
      requestId: req.requestId
    });
  } catch (error) {
    next(error);
  }
}

export default createPaymentOrder;