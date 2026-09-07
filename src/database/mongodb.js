import mongoose from "mongoose";

import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

export async function connectMongoDB() {
  try {
    await mongoose.connect(
      env.MONGODB_URI
    );

    logger.info(
      {
        host:
          mongoose.connection.host,
        database:
          mongoose.connection.name
      },
      "MongoDB connected"
    );
  } catch (error) {
    logger.fatal(
      { error },
      "MongoDB connection failed"
    );

    throw error;
  }
}

export async function disconnectMongoDB() {
  if (
    mongoose.connection.readyState !==
    mongoose.ConnectionStates.disconnected
  ) {
    await mongoose.disconnect();

    logger.info(
      "MongoDB disconnected"
    );
  }
}

export function getMongoDBStatus() {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  };

  return {
    status:
      states[mongoose.connection.readyState],
    readyState:
      mongoose.connection.readyState
  };
}