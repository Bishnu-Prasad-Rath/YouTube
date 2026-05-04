import { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getIO } from "../socket/socketInstance.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Live } from "../models/live.model.js";
import {
  incrementVideoLikes,
  decrementVideoLikes,
  getVideoLikes,
  incrementCommentLikes,
  decrementCommentLikes,
  incrementTweetLikes,
  decrementTweetLikes,
  setVideoLikes,
  getCommentLikes,
  setCommentLikes,
  getTweetLikes,
  setTweetLikes,
  incrementLiveLikes,
  decrementLiveLikes,
  getLiveLikes,
  setLiveLikes,
} from "../redis/cache/like.cache.js";
import { deleteCommentsCache } from "../redis/cache/comment.cache.js";
import { incrementLikes, decrementLikes } from "../redis/cache/dashboard.cache.js";
import { updateTrendingScore } from "../redis/cache/trending.cache.js";
import { trendingQueue } from "../queues/trending.queue.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if(!isValidObjectId(videoId)){
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);

if(!video){
  throw new ApiError(404, "Video not found");
}

  const channelId = video.owner;

  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });

  const io = getIO();

  let action;
  let like;
  let totalLikes;

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    action = "unlike";
    await decrementLikes(channelId, "video");
    totalLikes = await decrementVideoLikes(videoId);
   try {
     await updateTrendingScore(videoId, -3);     
   } catch (error) {
      console.log("Trending update failed", error.message);
   }
  } else {
    like = await Like.create({
      video: videoId,
      likedBy: req.user._id,
    });
    action = "like";
    await incrementLikes(channelId, "video");
    totalLikes = await incrementVideoLikes(videoId);
try {
await trendingQueue.add("updateScore", {
  videoId,
  weight: 3,
});} catch (err) {
  console.log("Trending update failed", err.message);
}
  }

  totalLikes = Number(totalLikes) || 0;

  if (totalLikes < 0) {
    let redisLikes = await getVideoLikes(videoId);

    if (redisLikes !== null) {
      totalLikes = Number(redisLikes) || 0;
    } else {
      const dbCount = await Like.countDocuments({ video: videoId });
      await setVideoLikes(videoId, dbCount);
      totalLikes = dbCount;
    }
  }
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { like, action, totalLikes },
        action === "like" ? "Video liked" : "Video unliked"
      )
    );

  io.to(`video:${videoId}`).emit("video:like", {
    videoId,
    userId: req.user._id,
    action,
    totalLikes,
  });
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  // 1. Fetch the comment ONCE to prevent redeclaration errors
  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");

  const channelId = comment.owner;
  const videoId = comment.video;

  const existingLike = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });

  const io = getIO();

  let action;
  let like;
  let totalLikes;

  if (existingLike) {
    // UNLIKE Logic
    await Like.findByIdAndDelete(existingLike._id);
    action = "unlike";
    await decrementLikes(channelId, "comment");
    totalLikes = await decrementCommentLikes(commentId);
  } else {
    // LIKE Logic
    like = await Like.create({
      comment: commentId,
      likedBy: req.user._id,
    });
    action = "like";
    // NOTE: Removed the duplicate 'const comment' and 'const channelId' from here!
    await incrementLikes(channelId, "comment");
    totalLikes = await incrementCommentLikes(commentId);
  }

  // 2. Clear the comment cache so the Playlist & Video pages sync up!
  if (videoId) {
    try {
      await deleteCommentsCache(videoId);
    } catch (cacheErr) {
      console.error("Failed to delete comment cache:", cacheErr.message);
    }
  }

  totalLikes = Number(totalLikes) || 0;

  // 3. Fallback sync for Redis
  if (totalLikes < 0) {
    let redisLikes = await getCommentLikes(commentId);

    if (redisLikes !== null) {
      totalLikes = Number(redisLikes) || 0;
    } else {
      const dbCount = await Like.countDocuments({ comment: commentId });
      await setCommentLikes(commentId, dbCount);
      totalLikes = dbCount;
    }
  }

  res.status(200).json(
    new ApiResponse(
      200,
      { like, action, totalLikes, isLiked: action === "like" },
      action === "like" ? "Comment liked" : "Comment unliked"
    )
  );

  io.to(`comment:${commentId}`).emit("comment:like", {
    commentId,
    userId: req.user._id,
    action,
    totalLikes,
  });
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet");
  }

  const existingLike = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  let isLiked = false;

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    isLiked = false;
  } else {
    await Like.create({
      tweet: tweetId,
      likedBy: req.user._id,
    });
    isLiked = true;
  }

  // Real-time pure DB count
  const totalLikes = await Like.countDocuments({ tweet: tweetId });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isLiked, action: isLiked ? "like" : "unlike", totalLikes },
        isLiked ? "Tweet liked" : "Tweet unliked"
      )
    );
});

const toggleLiveLike = asyncHandler(async (req, res) => {
  const { liveId } = req.params;

  if (!isValidObjectId(liveId)) {
    throw new ApiError(400, "Invalid live ID");
  }

  const existingLike = await Like.findOne({
    live: liveId,
    likedBy: req.user._id,
  });

  const io = getIO();

  let action;
  let like;
  let totalLikes;

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    action = "unlike";
    totalLikes = await decrementLiveLikes(liveId);
  } else {
    like = await Like.create({
      live: liveId,
      likedBy: req.user._id,
    });
    action = "like";

    totalLikes = await incrementLiveLikes(liveId);
  }

  totalLikes = Number(totalLikes) || 0;

  if (totalLikes < 0) {
    let redisLikes = await getLiveLikes(liveId);

    if (redisLikes !== null) {
      totalLikes = Number(redisLikes) || 0;
    } else {
      const dbCount = await Like.countDocuments({ live: liveId });
      await setLiveLikes(liveId, dbCount);
      totalLikes = dbCount;
    }
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { like, action, totalLikes },
        action === "like" ? "Live liked" : "Live unliked"
      )
    );

  io.to(`live:${liveId}`).emit("live:like", {
    liveId,
    userId: req.user._id,
    action,
    totalLikes,
  });
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const likes = await Like.find({
    likedBy: req.user._id,
    video: { $exists: true, $ne: null },
  }).populate({
    path: "video",
    select: "title thumbnail views createdAt owner",
    populate: {
      path: "owner",
      select: "username fullName avatar",
    },
  });

  const likedVideos = likes.map((like) => like.video);

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "Liked Videos fetched successfully.")
    );
});

const getVideoLikeStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  // Check if the current user has liked this video
  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });

  // Get total like count — try Redis first, fallback to DB
  let likesCount = await getVideoLikes(videoId);

  if (likesCount === null) {
    likesCount = await Like.countDocuments({ video: videoId });
    await setVideoLikes(videoId, likesCount);
  }

  likesCount = Math.max(0, Number(likesCount) || 0);

  return res.status(200).json(
    new ApiResponse(200, {
      isLiked: !!existingLike,
      likesCount,
    }, "Like status fetched successfully")
  );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, toggleLiveLike, getLikedVideos, getVideoLikeStatus };
