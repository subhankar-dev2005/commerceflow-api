import { Router } from "express";

import authMiddleware from "../../common/middleware/auth.middleware.js";

import validate from "../../common/middleware/validate.middleware.js";

import {
createOrder
} from "./order.controller.js";

import getOrders from "./get-orders.controller.js";

import getOrder from "./get-order.controller.js";

import updateOrderStatus from "./update-order-status.controller.js";

import {
createOrderSchema,
getOrderSchema,
updateOrderStatusSchema
} from "./order.validator.js";

const router = Router();

router.post(
"/",
authMiddleware,
validate(createOrderSchema),
createOrder
);

router.get(
"/",
authMiddleware,
getOrders
);

router.get(
"/:orderId",
authMiddleware,
validate(getOrderSchema),
getOrder
);

router.patch(
"/:orderId/status",
authMiddleware,
validate(updateOrderStatusSchema),
updateOrderStatus
);

export default router;
