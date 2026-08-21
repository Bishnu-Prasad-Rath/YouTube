import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getCommentsCache,
  setCommentsCache,
  deleteCommentsCache,
} from "../redis/cache/comment.cache.js";
import { getIO } from "../socket/socketInstance.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  let { page = 1, limit = 2 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid VideoId");
  }

  page = parseInt(page);
  limit = parseInt(limit);
  const skip = (page - 1) * limit;

  console.time("FULL_REQUEST");

  // 1. Check cache first
  const cached = await getCommentsCache(videoId, page);
  if (cached) {
    console.log("Cache HIT");
    console.timeEnd("FULL_REQUEST");
    return res.status(200).json(new ApiResponse(200, cached, "Comments fetched from cache."));
  }

  // 2. Fetch raw data (keep 'likes' array temporarily for JS checking)
  const rawComments = await Comment.aggregate([
    { $match: { video: new mongoose.Types.ObjectId(videoId) } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner"
      }
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "likes"
      }
    },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit }
  ]);

  // 3. Format in JavaScript to fix the ObjectId vs String bug safely
  const userId = req.user?._id?.toString();

  const comments = rawComments.map((comment) => {
    const ownerData = comment.owner[0] || {};
    
    // Remove sensitive data exactly as your original $project did
    delete ownerData.password;
    delete ownerData.refreshToken;

    // ✅ FIX: Safely compare both as strings. Guarantees a match.
    const isLiked = userId 
      ? comment.likes.some((like) => like.likedBy.toString() === userId)
      : false;

    // ✅ RETURN EXACT SAME VARIABLE NAMES AS YOUR ORIGINAL CODE
    return {
      ...comment, // Keeps _id, content, video, createdAt, updatedAt
      owner: ownerData,
      likesCount: comment.likes.length, // Exact same variable name
      isLiked: isLiked,                  // Exact same variable name
      likes: undefined                   // Hides the raw array from the final response
    };
  });

  // 4. Cache the cleanly formatted data
  await setCommentsCache(videoId, page, comments);

  console.timeEnd("FULL_REQUEST");

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comment fetched successfully."));
});
const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid VideoId for adding a new comment");
  }

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user._id,
  });

  await deleteCommentsCache(videoId);

  getIO().to(videoId).emit("comment:new", comment);

  return res
    .status(201)
    .json(
      new ApiResponse(201, comment, "Comment on video created successfully.")
    );
});

const addTweetComment = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "Invalid TweetId");
  }

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  const comment = await Comment.create({
    content,
    tweet: tweetId,
    owner: req.user._id,
  });

  const populatedComment = await Comment.findById(comment._id).populate(
    "owner",
    "username avatar fullName",
    "-password"
  );
  getIO().emit("new:reply", populatedComment);

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Reply added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  const comment = await Comment.findById(commentId)
  .populate({
    path: "owner",
    select: "-password"
  })

  if (!comment) {
    throw new ApiError(404, "Comment not found.");
  }

  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can not update this Comment.");
  }

  comment.content = content;

  await comment.save();

  await deleteCommentsCache(comment.video);

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const comment = await Comment.findById(commentId).populate({
   path: "owner",
   select: "-password"
  })

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can not delete this comment");
  }

  await Comment.findByIdAndDelete(commentId);

  await deleteCommentsCache(comment.video);

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment deleted successfully"));
});

export {
  getVideoComments,
  addComment,
  addTweetComment,
  updateComment,
  deleteComment,
};
