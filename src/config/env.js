import "dotenv/config";

import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z
    .enum([
      "development",
      "test",
      "staging",
      "production"
    ])
    .default("development"),

  PORT: z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(4000),

  CORS_ORIGIN: z
    .string()
    .min(1)
    .default("http://localhost:3000"),

  LOG_LEVEL: z
    .enum([
      "fatal",
      "error",
      "warn",
      "info",
      "debug",
      "trace"
    ])
    .default("info"),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("7d"),

  RAZORPAY_KEY_ID: z
    .string()
    .min(1, "RAZORPAY_KEY_ID is required"),

  RAZORPAY_KEY_SECRET: z
    .string()
    .min(1, "RAZORPAY_KEY_SECRET is required"),

RAZORPAY_WEBHOOK_SECRET: z
  .string()
  .optional(),

  MONGODB_URI: z

    .string()
    .min(1, "MONGODB_URI is required")
});

const parsedEnvironment =
  environmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  console.error(
    "Invalid environment configuration:",
    parsedEnvironment.error.flatten().fieldErrors
  );

  process.exit(1);
}

export const env =
  parsedEnvironment.data;