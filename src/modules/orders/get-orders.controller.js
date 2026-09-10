import Order from "./order.model.js";

async function getOrders(
req,
res,
next
) {
try {
const orders =
await Order.find({
user: req.user._id
})
.sort({
createdAt: -1
});

return res
  .status(200)
  .json({
    success: true,

    message:
      "Orders retrieved successfully",

    data: {
      orders
    },

    requestId:
      req.requestId
  });


} catch (error) {
next(error);
}
}

export default getOrders;
