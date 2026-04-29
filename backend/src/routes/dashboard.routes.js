import { Router } from "express";
import {
  getChannelStats,
  getChannelVideos,
} from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { rateLimitMiddleware } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
  .route("/stats")
  .get(
    rateLimitMiddleware({ windowSize: 10, maxRequests: 15 }),
    getChannelStats
  );
router
  .route("/videos")
  .get(
    rateLimitMiddleware({ windowSize: 10, maxRequests: 30 }),
    getChannelVideos
  );

export default router;
