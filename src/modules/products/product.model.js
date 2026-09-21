
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

productSchema.index({
  name: "text",
  description: "text"
});

productSchema.index({
  isActive: 1,
  createdAt: -1
});

productSchema.index({
  category: 1,
  isActive: 1,
  createdAt: -1
});

productSchema.index({
  isActive: 1,
  price: 1
});

const Product = mongoose.model(
  "Product",
  productSchema
);

export default Product;
