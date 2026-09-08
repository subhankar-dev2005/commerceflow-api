import Product from "./product.model.js";
import AppError from "../../common/errors/app-error.js";

async function updateProduct(
  req,
  res,
  next
) {
  try {
    const { id } = req.params;

    const updateData = {
      ...req.body
    };

    const product =
      await Product.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true,
          runValidators: true
        }
      );

    if (!product) {
      throw new AppError(
        "Product not found",
        404,
        [],
        "PRODUCT_NOT_FOUND"
      );
    }

    return res
      .status(200)
      .json({
        success: true,

        message:
          "Product updated successfully",

        data: {
          product
        },

        requestId:
          req.requestId
      });
  } catch (error) {
    next(error);
  }
}

export default updateProduct;