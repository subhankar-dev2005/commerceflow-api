
import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    quantity: {
      type: Number,
      required: true,
      min: 1
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    _id: false
  }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 20
    },

    addressLine1: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },

    addressLine2: {
      type: String,
      trim: true,
      maxlength: 200,
      default: ""
    },

    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },

    state: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },

    postalCode: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20
    },

    country: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    }
  },
  {
    _id: false
  }
);

const paymentSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ["stripe", "razorpay"],
      required: true
    },

    status: {
      type: String,
      enum: [
        "pending",
        "paid",
        "failed",
        "refunded"
      ],
      default: "pending"
    },

  transactionId: {
  type: String,
  trim: true,
  default: ""
},

razorpayOrderId: {
  type: String,
  trim: true,
  default: ""
}
  },
  {
    _id: false
  }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    items: {
      type: [orderItemSchema],
      required: true,

      validate: {
        validator: function (items) {
          return items.length > 0;
        },

        message: "Order must contain at least one item"
      }
    },

    totalQuantity: {
      type: Number,
      required: true,
      min: 1
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0
    },

    payment: {
      type: paymentSchema,
      required: true
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: true
    },

    status: {
      type: String,

      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled"
      ],

      default: "pending"
    }
  },
  {
    timestamps: true
  }
);

orderSchema.index({
  user: 1,
  createdAt: -1
});

orderSchema.index({
  user: 1,
  status: 1,
  createdAt: -1
});

orderSchema.index({
  "payment.razorpayOrderId": 1
});

const Order = mongoose.model(
  "Order",
  orderSchema
);

export default Order;
