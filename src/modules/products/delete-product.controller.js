import Product from "./product.model.js";
import AppError from "../../common/errors/app-error.js";

async function deleteProduct(
  req,
  res,
  next
) {
  try {
    const { id } = req.params;

    const product =
      await Product.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
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
          "Product deleted successfully",

        requestId:
          req.requestId
      });
  } catch (error) {
    next(error);
  }
}

export default deleteProduct;