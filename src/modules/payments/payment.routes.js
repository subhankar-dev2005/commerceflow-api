import { Router } from "express";

import authMiddleware from "../../common/middleware/auth.middleware.js";
import validate from "../../common/middleware/validate.middleware.js";

import createPaymentOrder from "./create-payment-order.controller.js";
import verifyPayment from "./verify-payment.controller.js";
import {
  paymentOrderSchema,
  verifyPaymentSchema
} from "./payment.validator.js";
import handleRazorpayWebhook from "./webhook.controller.js";

const router = Router();

router.post(
  "/orders/:orderId",
  authMiddleware,
  validate(paymentOrderSchema),
  createPaymentOrder
);

router.post(
  "/orders/:orderId/verify",
  authMiddleware,
  validate(verifyPaymentSchema),
  verifyPayment
);
router.post("/webhook", handleRazorpayWebhook);

export default router;