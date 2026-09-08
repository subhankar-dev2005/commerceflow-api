import { Router } from "express";

import validate from "../../common/middleware/validate.middleware.js";

import authMiddleware from "../../common/middleware/auth.middleware.js";

import authorizeRoles from "../../common/middleware/authorize.middleware.js";

import getProduct from "./get-product.controller.js";

import getCategories from "./get-categories.controller.js";

import updateProduct from "./update-product.controller.js";

import deleteProduct from "./delete-product.controller.js";

import updateProductSchema from "./update-product.validator.js";

import {
createProduct,
getProducts
} from "./product.controller.js";

import createProductSchema from "./product.validator.js";

import productQuerySchema from "./product-query.validator.js";

const router = Router();

router.get(
"/",
validate(productQuerySchema),
getProducts
);

router.get(
"/categories",
getCategories
);

router.post(
"/",
authMiddleware,
authorizeRoles("admin"),
validate(createProductSchema),
createProduct
);

router.get(
"/:id",
getProduct
);

router.patch(
"/:id",
authMiddleware,
authorizeRoles("admin"),
validate(updateProductSchema),
updateProduct
);

router.delete(
"/:id",
authMiddleware,
authorizeRoles("admin"),
deleteProduct
);

export default router;
