import { Router } from "express";

import authMiddleware from "../../common/middleware/auth.middleware.js";
import validate from "../../common/middleware/validate.middleware.js";

import createPaymentOrder from "./create-payment-order.controller.js";
import { paymentOrderSchema } from "./payment.validator.js";

const router = Router();

router.post(
  "/orders/:orderId",
  authMiddleware,
  validate(paymentOrderSchema),
  createPaymentOrder
);

export default router;