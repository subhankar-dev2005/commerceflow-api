
import Product from "./product.model.js";

async function createProduct(
  req,
  res,
  next
) {
  try {
    const {
      name,
      description,
      price,
      stock,
      category,
      image
    } = req.body;

    const product =
      await Product.create({
        name,
        description,
        price,
        stock,
        category,
        image
      });

    return res
      .status(201)
      .json({
        success: true,

        message:
          "Product created successfully",

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

async function getProducts(
  req,
  res,
  next
) {
  try {
    const page =
      Math.max(
        parseInt(req.query.page, 10) || 1,
        1
      );

    const limit =
      Math.min(
        Math.max(
          parseInt(req.query.limit, 10) || 10,
          1
        ),
        100
      );

    const skip =
      (page - 1) * limit;

    const filter = {
      isActive: true
    };

    if (req.query.search) {
      filter.$or = [
        {
          name: {
            $regex: req.query.search,
            $options: "i"
          }
        },
        {
          description: {
            $regex: req.query.search,
            $options: "i"
          }
        }
      ];
    }

    if (req.query.category) {
      filter.category =
        req.query.category;
    }

    if (req.query.inStock === "true") {
      filter.stock = {
        $gt: 0
      };
    }

    if (req.query.inStock === "false") {
      filter.stock = {
        $lte: 0
      };
    }

    if (
      req.query.minPrice ||
      req.query.maxPrice
    ) {
      filter.price = {};

      if (req.query.minPrice) {
        filter.price.$gte =
          Number(req.query.minPrice);
      }

      if (req.query.maxPrice) {
        filter.price.$lte =
          Number(req.query.maxPrice);
      }
    }

    const allowedSortFields = [
      "price",
      "createdAt",
      "name"
    ];

    const sortBy =
      allowedSortFields.includes(
        req.query.sortBy
      )
        ? req.query.sortBy
        : "createdAt";

    const sortOrder =
      req.query.sortOrder === "asc"
        ? 1
        : -1;

    const sort = {
      [sortBy]: sortOrder
    };

    const totalProducts =
      await Product.countDocuments(
        filter
      );

    const products =
      await Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit);

    const totalPages =
      Math.max(
        Math.ceil(
          totalProducts / limit
        ),
        1
      );

    return res
      .status(200)
      .json({
        success: true,

        message:
          "Products retrieved successfully",

        data: {
          products,

          pagination: {
            page,
            limit,
            totalProducts,
            totalPages
          }
        },

        requestId:
          req.requestId
      });

  } catch (error) {
    next(error);
  }
}

export {
  createProduct,
  getProducts
};
