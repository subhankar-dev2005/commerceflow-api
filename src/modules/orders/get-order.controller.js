import Order from "./order.model.js";

import AppError from "../../common/errors/app-error.js";

async function getOrder(
req,
res,
next
) {
try {
const {
orderId
} = req.params;

const order =
  await Order.findOne({
    _id: orderId,

    user:
      req.user._id
  });

if (!order) {
  throw new AppError(
    "Order not found",
    404,
    [],
    "ORDER_NOT_FOUND"
  );
}

return res
  .status(200)
  .json({
    success: true,

    message:
      "Order retrieved successfully",

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

export default getOrder;
