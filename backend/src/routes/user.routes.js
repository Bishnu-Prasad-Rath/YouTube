import { Router } from "express";
import {
  loginUser,
  registerUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserAvatar,
  updateUserCoverImage,
  updateAccountDetails,
  getUserChannelProfile,
  getWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { rateLimitMiddleware } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.route("/register").post(
  rateLimitMiddleware({ windowSize: 60, maxRequests: 5 }),
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router
  .route("/login")
  .post(rateLimitMiddleware({ windowSize: 60, maxRequests: 5 }), loginUser);

//Secured routes

router
  .route("/logout")
  .post(
    rateLimitMiddleware({ windowSize: 60, maxRequests: 10 }),
    verifyJWT,
    logoutUser
  );
router
  .route("/refresh-token")
  .post(
    rateLimitMiddleware({ windowSize: 60, maxRequests: 10 }),
    refreshAccessToken
  );
router
  .route("/change-password")
  .post(
    rateLimitMiddleware({ windowSize: 60, maxRequests: 5 }),
    verifyJWT,
    changeCurrentPassword
  );
router
  .route("/current-user")
  .get(
    rateLimitMiddleware({ windowSize: 10, maxRequests: 30 }),
    verifyJWT,
    getCurrentUser
  );
router
  .route("/update-account")
  .patch(
    rateLimitMiddleware({ windowSize: 10, maxRequests: 20 }),
    verifyJWT,
    updateAccountDetails
  );
router
  .route("/avatar")
  .patch(
    rateLimitMiddleware({ windowSize: 60, maxRequests: 5 }),
    verifyJWT,
    upload.single("avatar"),
    updateUserAvatar
  );
router
  .route("/coverImage")
  .patch(
    rateLimitMiddleware({ windowSize: 60, maxRequests: 5 }),
    verifyJWT,
    upload.single("coverImage"),
    updateUserCoverImage
  );
router
  .route("/c/:username")
  .get(
    rateLimitMiddleware({ windowSize: 10, maxRequests: 25 }),
    verifyJWT,
    getUserChannelProfile
  );
router
  .route("/history")
  .get(
    rateLimitMiddleware({ windowSize: 10, maxRequests: 20 }),
    verifyJWT,
    getWatchHistory
  );

export default router;
