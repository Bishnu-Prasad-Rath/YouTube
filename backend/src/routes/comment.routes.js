import { Router } from "express";
import {
  addComment,
  addTweetComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { rateLimitMiddleware } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
  .route("/:videoId")
  .get(
    rateLimitMiddleware({ windowSize: 10, maxRequests: 25 }),
    getVideoComments
  )
  .post(rateLimitMiddleware({ windowSize: 60, maxRequests: 10 }),
  addComment);
router
  .route("/t/:tweetId")
  .post(rateLimitMiddleware({ windowSize: 60, maxRequests: 10 }), addTweetComment);
router
  .route("/c/:commentId")
  .delete(
    rateLimitMiddleware({ windowSize: 60, maxRequests: 10 }),
    deleteComment
  )
  .patch(
    rateLimitMiddleware({ windowSize: 60, maxRequests: 10 }),
    updateComment
  );

export default router;
