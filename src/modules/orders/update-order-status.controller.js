import Order from "./order.model.js";

import AppError from "../../common/errors/app-error.js";

async function updateOrderStatus(
  req,
  res,
  next
) {
  try {
    const {
      orderId
    } = req.params;

    const {
      status
    } = req.body;

    const order =
      await Order.findById(
        orderId
      );

    if (!order) {
      throw new AppError(
        "Order not found",
        404,
        [],
        "ORDER_NOT_FOUND"
      );
    }

    const allowedTransitions = {
      pending: [
        "processing",
        "cancelled"
      ],

      processing: [
        "shipped",
        "cancelled"
      ],

      shipped: [
        "delivered"
      ],

      delivered: [],

      cancelled: []
    };

    const currentStatus =
      order.status;

    const allowedStatuses =
      allowedTransitions[
        currentStatus
      ];

    if (
      !allowedStatuses.includes(
        status
      )
    ) {
      throw new AppError(
        `Cannot change order status from ${currentStatus} to ${status}`,
        400,
        [],
        "INVALID_ORDER_STATUS_TRANSITION"
      );
    }

    order.status =
      status;

    await order.save();

    return res
      .status(200)
      .json({
        success: true,

        message:
          "Order status updated successfully",

        data: {
          order
        },

        requestId:
          req.requestId
      });
  } catch (error) {
    next(error);
  }
}

export default updateOrderStatus;