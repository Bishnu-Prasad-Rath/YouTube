import { Router } from "express";
import {
  getLikedVideos,
  toggleCommentLike,
  toggleVideoLike,
  toggleTweetLike,
  toggleLiveLike,
  getVideoLikeStatus,
} from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { rateLimitMiddleware } from "../middlewares/rateLimit.middleware.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
  .route("/toggle/v/:videoId")
  .post(
    rateLimitMiddleware({ windowSize: 10, maxRequests: 10 }),
    toggleVideoLike
  );
router
  .route("/toggle/c/:commentId")
  .post(
    rateLimitMiddleware({ windowSize: 10, maxRequests: 10 }),
    toggleCommentLike
  );
router
  .route("/toggle/t/:tweetId")
  .post(
    rateLimitMiddleware({ windowSize: 10, maxRequests: 10 }),
    toggleTweetLike
  );
router
  .route("/toggle/l/:liveId")
  .post(
    rateLimitMiddleware({ windowSize: 10, maxRequests: 10 }),
    toggleLiveLike
  );
router
  .route("/videos")
  .get(
    rateLimitMiddleware({ windowSize: 10, maxRequests: 25 }),
    getLikedVideos
  );
router
  .route("/status/v/:videoId")
  .get(
    rateLimitMiddleware({ windowSize: 10, maxRequests: 30 }),
    getVideoLikeStatus
  );

export default router;
