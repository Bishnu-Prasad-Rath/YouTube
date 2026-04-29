import { Router } from "express";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
  getTrending,
  getSubscribedFeed,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { rateLimitMiddleware } from "../middlewares/rateLimit.middleware.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
  .route("/")
  .get(rateLimitMiddleware({ windowSize: 10, maxRequests: 20 }), getAllVideos)
  .post(
    rateLimitMiddleware({ windowSize: 60, maxRequests: 5 }),
    upload.fields([
      {
        name: "videoFile",
        maxCount: 1,
      },
      {
        name: "thumbnail",
        maxCount: 1,
      },
    ]),
    publishAVideo
  );

    router
  .route("/trending")
  .get(rateLimitMiddleware({ windowSize: 10, maxRequests: 20 }), getTrending);

router
  .route("/subscribed-feed")
  .get(rateLimitMiddleware({ windowSize: 10, maxRequests: 20 }), getSubscribedFeed);

router
  .route("/:videoId")
  .get(rateLimitMiddleware({ windowSize: 10, maxRequests: 30 }), getVideoById)
  .delete(rateLimitMiddleware({ windowSize: 60, maxRequests: 10 }), deleteVideo)
  .patch(
    rateLimitMiddleware({ windowSize: 60, maxRequests: 10 }),
    upload.single("thumbnail"),
    updateVideo
  );

router
  .route("/toggle/publish/:videoId")
  .patch(
    rateLimitMiddleware({ windowSize: 60, maxRequests: 15 }),
    togglePublishStatus
  );

export default router;
