
import Order from "./order.model.js";
import Product from "../products/product.model.js";
import AppError from "../../common/errors/app-error.js";

async function cancelOrder(req, res, next) {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      throw new AppError(
        "Order not found",
        404,
        [],
        "ORDER_NOT_FOUND"
      );
    }

    // Only the user who owns the order can cancel it
    if (order.user.toString() !== req.user._id.toString()) {
      throw new AppError(
        "You are not allowed to cancel this order",
        403,
        [],
        "ORDER_ACCESS_DENIED"
      );
    }

    if (order.status === "delivered") {
      throw new AppError(
        "Delivered orders cannot be cancelled",
        400,
        [],
        "ORDER_CANNOT_BE_CANCELLED"
      );
    }

    if (order.status === "cancelled") {
      throw new AppError(
        "Order is already cancelled",
        400,
        [],
        "ORDER_ALREADY_CANCELLED"
      );
    }

    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: orderId,
        user: req.user._id,
        status: { $nin: ["delivered", "cancelled"] }
      },
      {
        $set: {
          status: "cancelled"
        }
      },
      {
        new: true
      }
    );

    if (!updatedOrder) {
      throw new AppError(
        "Order is already cancelled",
        400,
        [],
        "ORDER_ALREADY_CANCELLED"
      );
    }

    if (Array.isArray(updatedOrder.items)) {
      for (const item of updatedOrder.items) {
        await Product.findByIdAndUpdate(
          item.product,
          {
            $inc: {
              stock: item.quantity
            }
          }
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: {
        order: updatedOrder
      },
      requestId: req.requestId
    });
  } catch (error) {
    next(error);
  }
}

export default cancelOrder;
