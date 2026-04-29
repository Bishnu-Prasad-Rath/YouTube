import { Router } from "express";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { rateLimitMiddleware } from "../middlewares/rateLimit.middleware.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
  .route("/c/:channelId")
  .get(
    rateLimitMiddleware({ windowSize: 10, maxRequests: 25 }),
    getUserChannelSubscribers
  )
  .post(
    rateLimitMiddleware({ windowSize: 60, maxRequests: 5 }),
    toggleSubscription
  );

router
  .route("/u/:subscriberId")
  .get(
    rateLimitMiddleware({ windowSize: 10, maxRequests: 25 }),
    getSubscribedChannels
  );

export default router;
