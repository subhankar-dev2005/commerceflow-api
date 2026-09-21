# CommerceFlow API Documentation

Base URL: `/api/v1`

## Overview

CommerceFlow is a REST API for an e-commerce application. It provides user authentication, product management, cart management, order management, address management, and Razorpay payment integration.

## Authentication

Protected endpoints require a valid JWT access token.

Send the token in the request header:

``text
Authorization: Bearer <access-token>
``

The access token is returned by the login endpoint and currently expires after 20 minutes.

## Users

### Register User

**POST** `/users/register`

Creates a new customer account.

**Request body:**

``json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
``

**Success:** `201 Created`

### Login User

**POST** `/users/login`

Authenticates a user and returns a JWT access token.

**Request body:**

``json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
``

**Success:** `200 OK`

The returned access token must be sent as a Bearer token when calling protected endpoints.

## Payments

### Create Payment Order

**POST** `/payments/orders/:orderId`

Creates a Razorpay payment order for an existing customer order.

**Authentication:** Required (`Bearer <access-token>`). The authenticated user must be the owner of the order.

**Path parameters:**
* `orderId` (string, required): 24-character hexadecimal MongoDB ObjectId of the order.

**Success:** `201 Created` (when creating a new payment order) or `200 OK` (if payment order already exists)

**Response body:**

``json
{
  "success": true,
  "message": "Payment order created successfully",
  "data": {
    "razorpayOrderId": "order_EKwxwAgItLSgZm",
    "amount": 50000,
    "currency": "INR",
    "keyId": "YOUR_RAZORPAY_KEY_ID"
  },
  "requestId": "req-123"
}
``

**Common error codes:**
* `400 Bad Request`: `ORDER_CANCELLED`, `ORDER_ALREADY_PAID`, `INVALID_ID`
* `401 Unauthorized`: `UNAUTHORIZED`
* `404 Not Found`: `ORDER_NOT_FOUND`

### Verify Payment

**POST** `/payments/orders/:orderId/verify`

Verifies a captured payment via Razorpay signature verification and marks the order as paid.

**Authentication:** Required (`Bearer <access-token>`). The authenticated user must be the owner of the order.

**Path parameters:**
* `orderId` (string, required): 24-character hexadecimal MongoDB ObjectId of the order.

**Request body:**

``json
{
  "razorpayPaymentId": "pay_29QQoUBcxrhErq",
  "razorpayOrderId": "order_EKwxwAgItLSgZm",
  "razorpaySignature": "9ef4b61642828b61e2f47c32b5e28a50f1..."
}
``

**Success:** `200 OK`

**Response body:**

``json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "orderId": "507f1f77bcf86cd799439011",
    "paymentStatus": "paid",
    "transactionId": "pay_29QQoUBcxrhErq",
    "orderStatus": "confirmed"
  },
  "requestId": "req-123"
}
``

**Common error codes:**
* `400 Bad Request`: `ORDER_CANCELLED`, `INVALID_RAZORPAY_ORDER`, `INVALID_PAYMENT_SIGNATURE`, `PAYMENT_ORDER_MISMATCH`, `PAYMENT_AMOUNT_MISMATCH`, `PAYMENT_NOT_CAPTURED`, `VALIDATION_ERROR`, `INVALID_ID`
* `401 Unauthorized`: `UNAUTHORIZED`
* `404 Not Found`: `ORDER_NOT_FOUND`

### Razorpay Webhook

**POST** `/payments/webhook`

Receives automated webhook event notifications directly from Razorpay (e.g. `payment.captured`).

**Authentication:** None (Public endpoint). Does NOT require user JWT authentication; authenticity is verified using HMAC-SHA256 signature verification against the configured webhook secret.

**Headers:**
* `x-razorpay-signature` (string, required): Hex digest of HMAC-SHA256 calculated over the raw request payload using the configured webhook secret.
* `Content-Type: application/json`

**Request body:**

Raw JSON event object sent by Razorpay containing `id`, `event`, and `payload.payment.entity`.

**Success:** `200 OK`

**Response body:**

``json
{
  "success": true,
  "message": "Webhook processed successfully"
}
``

*Note:* Duplicate webhook events return `200 OK` with `"message": "Webhook already processed"`. Events for non-existent orders return `200 OK` with `"message": "Webhook received"`.

**Common error codes:**
* `400 Bad Request`: `MISSING_WEBHOOK_SIGNATURE`, `MISSING_RAW_BODY`, `INVALID_WEBHOOK_SIGNATURE`, `INVALID_JSON_PAYLOAD`, `MISSING_WEBHOOK_EVENT_ID`, `ORDER_CANCELLED`, `PAYMENT_AMOUNT_MISMATCH`
* `429 Too Many Requests`: Webhook rate limit exceeded (`WEBHOOK_RATE_LIMIT` per 15-minute window)
* `500 Internal Server Error`: `WEBHOOK_SECRET_NOT_CONFIGURED`
