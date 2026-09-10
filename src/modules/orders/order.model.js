import mongoose from "mongoose";

const orderItemSchema =
new mongoose.Schema(
{
product: {
type:
mongoose.Schema.Types.ObjectId,

    ref:
      "Product",

    required:
      true
  },

  name: {
    type:
      String,

    required:
      true,

    trim:
      true
  },

  price: {
    type:
      Number,

    required:
      true,

    min:
      0
  },

  quantity: {
    type:
      Number,

    required:
      true,

    min:
      1
  },

  subtotal: {
    type:
      Number,

    required:
      true,

    min:
      0
  }
},
{
  _id: false
}

);

const orderSchema =
new mongoose.Schema(
{
user: {
type:
mongoose.Schema.Types.ObjectId,

    ref:
      "User",

    required:
      true
  },

  items: {
    type:
      [orderItemSchema],

    required:
      true,

    validate: {
      validator: function (
        items
      ) {
        return (
          items.length > 0
        );
      },

      message:
        "Order must contain at least one item"
    }
  },

  totalQuantity: {
    type:
      Number,

    required:
      true,

    min:
      1
  },

  subtotal: {
    type:
      Number,

    required:
      true,

    min:
      0
  },

  status: {
    type:
      String,

    enum: [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled"
    ],

    default:
      "pending"
  }
},
{
  timestamps:
    true
}

);

const Order =
mongoose.model(
"Order",
orderSchema
);

export default Order;

