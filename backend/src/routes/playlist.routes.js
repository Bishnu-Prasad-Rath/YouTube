import { Router } from "express";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylists,
  removeVideoFromPlaylist,
  updatePlaylist,
} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { rateLimitMiddleware } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
  .route("/")
  .post(
    rateLimitMiddleware({ windowSize: 60, maxRequests: 5 }),
    createPlaylist
  );

router
  .route("/:playlistId")
  .get(rateLimitMiddleware({ windowSize: 10, maxRequests: 25 }), getPlaylistById)
  .patch(
    rateLimitMiddleware({ windowSize: 60, maxRequests: 5 }),
    updatePlaylist
  )
  .delete(
    rateLimitMiddleware({ windowSize: 60, maxRequests: 5 }),
    deletePlaylist
  );

router
  .route("/add/:videoId/:playlistId")
  .patch(
    rateLimitMiddleware({ windowSize: 10, maxRequests: 5 }),
    addVideoToPlaylist
  );
router
  .route("/remove/:videoId/:playlistId")
  .patch(
    rateLimitMiddleware({ windowSize: 60, maxRequests: 5 }),
    removeVideoFromPlaylist
  );

router
  .route("/user/:userId")
  .get(
    rateLimitMiddleware({ windowSize: 10, maxRequests: 25 }),
    getUserPlaylists
  );

export default router;
