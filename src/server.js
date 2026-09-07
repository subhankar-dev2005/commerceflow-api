import { createApp } from "./app.js";

import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

import {
  connectMongoDB,
  disconnectMongoDB
} from "./database/mongodb.js";

const app = createApp();

let server;

async function startServer() {
  try {
    await connectMongoDB();

    server = app.listen(
      env.PORT,
      () => {
        logger.info(
          {
            port: env.PORT
          },
          "CommerceFlow API started"
        );
      }
    );
  } catch (error) {
    logger.fatal(
      { error },
      "Application startup failed"
    );

    process.exit(1);
  }
}

async function shutdown(signal) {
  logger.info(
    { signal },
    "Graceful shutdown started"
  );

  if (server) {
    await new Promise(
      (resolve, reject) => {
        server.close(
          (error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          }
        );
      }
    );
  }

  await disconnectMongoDB();

  logger.info(
    "Application shutdown completed"
  );

  process.exit(0);
}

process.on(
  "SIGTERM",
  () => {
    shutdown("SIGTERM").catch(
      (error) => {
        logger.error(
          { error },
          "Shutdown failed"
        );

        process.exit(1);
      }
    );
  }
);

process.on(
  "SIGINT",
  () => {
    shutdown("SIGINT").catch(
      (error) => {
        logger.error(
          { error },
          "Shutdown failed"
        );

        process.exit(1);
      }
    );
  }
);

startServer();