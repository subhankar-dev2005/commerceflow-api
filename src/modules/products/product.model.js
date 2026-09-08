import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,

      required: true,

      trim: true,

      minlength: 2,

      maxlength: 200
    },

    description: {
      type: String,

      required: true,

      trim: true
    },

    price: {
      type: Number,

      required: true,

      min: 0
    },

    stock: {
      type: Number,

      required: true,

      min: 0,

      default: 0
    },

    category: {
      type: String,

      required: true,

      trim: true
    },

    image: {
      type: String,

      default: null
    },

    isActive: {
      type: Boolean,

      default: true
    }
  },
  {
    timestamps: true
  }
);

const Product = mongoose.model(
  "Product",
  productSchema
);

export default Product;