import { Router } from "express";

import healthRoutes from "./health.routes.js";

import userRoutes from "../modules/users/user.routes.js";

import adminRoutes from "./admin.routes.js";

import productRoutes from "../modules/products/product.routes.js";

import cartRoutes from "../modules/cart/cart.routes.js";

import orderRoutes from "../modules/orders/order.routes.js";

const router = Router();

router.use(
"/health",
healthRoutes
);

router.use(
"/users",
userRoutes
);

router.use(
"/admin",
adminRoutes
);

router.use(
"/products",
productRoutes
);

router.use(
"/cart",
cartRoutes
);

router.use(
"/orders",
orderRoutes
);

export default router;
