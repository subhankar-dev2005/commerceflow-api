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
