import { Router } from "express";
import {
  createTweet,
  deleteTweet,
  getUserTweets,
  getAllTweets,
  updateTweet,
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { rateLimitMiddleware } from "../middlewares/rateLimit.middleware.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
  .route("/")
  .post(rateLimitMiddleware({ windowSize: 60, maxRequests: 5 }), createTweet);
router
  .route("/all")
  .get(rateLimitMiddleware({ windowSize: 10, maxRequests: 25 }), getAllTweets);
router
  .route("/user/:userId")
  .get(rateLimitMiddleware({ windowSize: 10, maxRequests: 25 }), getUserTweets);
router
  .route("/:tweetId")
  .patch(rateLimitMiddleware({ windowSize: 60, maxRequests: 5 }), updateTweet)
  .delete(
    rateLimitMiddleware({ windowSize: 60, maxRequests: 5 }),
    deleteTweet
  );

export default router;
