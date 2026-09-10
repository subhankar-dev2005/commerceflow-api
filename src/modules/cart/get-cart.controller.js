import Cart from "./cart.model.js";

async function getCart(
req,
res,
next
) {
try {
let cart =
await Cart.findOne({
user: req.user._id
}).populate(
"items.product",
"name price stock category image isActive"
);

if (!cart) {
  cart = {
    user: req.user._id,
    items: []
  };
}

const itemCount =
  cart.items.length;

const totalQuantity =
  cart.items.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

const subtotal =
  cart.items.reduce(
    (total, item) => {
      if (!item.product) {
        return total;
      }

      return (
        total +
        item.product.price *
          item.quantity
      );
    },
    0
  );

return res
  .status(200)
  .json({
    success: true,

    message:
      "Cart retrieved successfully",

    data: {
      cart,

      totals: {
        itemCount,
        totalQuantity,
        subtotal
      }
    },

    requestId:
      req.requestId
  });

} catch (error) {
next(error);
}
}

export default getCart;
