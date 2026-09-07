import { Router } from "express";

import {
  getMongoDBStatus
} from "../database/mongodb.js";

const router = Router();

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,

    data: {
      status: "ok",
      timestamp:
        new Date().toISOString()
    },

    requestId: req.requestId
  });
});

router.get("/live", (req, res) => {
  res.status(200).json({
    success: true,

    data: {
      status: "alive"
    },

    requestId: req.requestId
  });
});

router.get("/ready", (req, res) => {
  const mongo =
    getMongoDBStatus();

  const isReady =
    mongo.status === "connected";

  res.status(
    isReady ? 200 : 503
  ).json({
    success: isReady,

    data: {
      status:
        isReady
          ? "ready"
          : "not_ready",

      dependencies: {
        mongodb: mongo
      }
    },

    requestId: req.requestId
  });
});

export default router;