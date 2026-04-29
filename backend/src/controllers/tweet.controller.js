import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  const tweet = await Tweet.create({
    content,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, tweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

    const tweets = await Tweet.find({ owner: userId })
        .populate("owner", "username fullName avatar")
        .populate({ path: "replies", populate: { path: "owner", select: "username avatar fullName" } })
        .sort({ createdAt: -1 })
        .lean();

    const tweetsWithLikes = await Promise.all(
      tweets.map(async (tweet) => {
        const totalLikes = await Like.countDocuments({ tweet: tweet._id });
        const isLiked = req.user ? await Like.exists({ tweet: tweet._id, likedBy: req.user._id }) : false;
        return { ...tweet, totalLikes, isLiked: !!isLiked };
      })
    );

  return res
    .status(200)
    .json(new ApiResponse(200, tweetsWithLikes, "Tweets fetched successfully"));
});

const getAllTweets = asyncHandler(async (req, res) => {
  const tweets = await Tweet.find()
      .populate("owner", "username fullName avatar")
      .populate({ path: "replies", populate: { path: "owner", select: "username avatar fullName" } })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

  const tweetsWithLikes = await Promise.all(
    tweets.map(async (tweet) => {
      const totalLikes = await Like.countDocuments({ tweet: tweet._id });
      const isLiked = req.user ? await Like.exists({ tweet: tweet._id, likedBy: req.user._id }) : false;
      return { ...tweet, totalLikes, isLiked: !!isLiked };
    })
  );

  return res
    .status(200)
    .json(new ApiResponse(200, tweetsWithLikes, "All tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found.");
  }

  if (!content) {
    throw new ApiError(400, "Content is required.");
  }

  if (tweet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can not update this tweet.");
  }

  tweet.content = content;

  await tweet.save();

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  if (tweet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can not delete this tweet.");
  }

  await Tweet.findByIdAndDelete(tweetId);

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, getAllTweets, updateTweet, deleteTweet };
