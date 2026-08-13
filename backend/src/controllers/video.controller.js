import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Live } from "../models/live.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
  getPublicId,
} from "../utils/cloudinary.js";
import { getCache, setCache, deleteCache } from "../redis/cache/base.cache.js";
import {
  getVideoCache,
  setVideoCache,
  deleteVideoCache,
  getVideosCache,
  setVideosCache,
  deleteVideosCache,
} from "../redis/cache/video.cache.js";
import {
  incrementVideos,
  incrementViews,
} from "../redis/cache/dashboard.cache.js";
import {
  updateTrendingScore,
  getTrendingScore,
} from "../redis/cache/trending.cache.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  const params = { page, limit, query, sortBy, sortType, userId };

  const isListValid = await getCache("videos:all");

  let cachedVideos = null;

  if (isListValid) {
    cachedVideos = await getVideosCache(params);
  }

  if (cachedVideos) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, cachedVideos, "Videos fetched from the cache.")
      );
  }

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;
  const match = {
    isPublished: true,
  };
  if (query) {
    match.title = {
      $regex: query,
      $options: "i",
    };
  }
  if (userId) {
    match.owner = new mongoose.Types.ObjectId(userId);
  }
  const sortOptions = {};
  if (sortBy) {
    sortOptions[sortBy] = sortType === "asc" ? 1 : -1;
  } else {
    sortOptions.createdAt = -1;
  }
  const videos = await Video.aggregate([
    {
      $match: match,
    },
    {
      $sort: sortOptions,
    },
    {
      $skip: skip,
    },
    {
      $limit: limitNumber,
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $unwind: "$owner",
    },
    {
      $project: {
        title: 1,
        thumbnail: 1,
        views: 1,
        createdAt: 1,
        duration: 1,
        "owner._id": 1,
        "owner.username": 1,
        "owner.fullName": 1,
        "owner.avatar": 1,
      },
    },
  ]);

  // Don't throw 404, just return empty array so frontend doesn't crash

  await setVideosCache(params, videos);

  await setCache("videos:all", true);

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    throw new ApiError(400, "All fields are required");
  }

  if (!req.files?.videoFile || !req.files?.thumbnail) {
    throw new ApiError(400, "Video and thumbnail are required");
  }

  const videoLocalPath = req.files?.videoFile[0].path;
  const thumbnailLocalPath = req.files?.thumbnail[0].path;

  const uploadedVideo = await uploadOnCloudinary(videoLocalPath);
  const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!uploadedVideo?.url || !uploadedThumbnail?.url) {
    throw new ApiError(400, "Error when uploading video or thumbnail");
  }

  const video = await Video.create({
    title,
    description,
    videoFile: uploadedVideo.url,
    thumbnail: uploadedThumbnail.url,
    owner: req.user._id,
    isPublished: true,
    duration: Math.round(uploadedVideo.duration || 0),
  });

  await incrementVideos(req.user._id);

  await deleteCache("videos:all");

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const requestStart = performance.now();

  const timings = {};

  const { videoId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  // Cache hit

  let start = performance.now();

  const cachedVideo = await getVideoCache(videoId);

  timings.videoCache = performance.now() - start;

  // View increment

  if (req.query.inc === "true") {
    start = performance.now();

    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      {
        $inc: { views: 1 },
      },
      {
        new: true,
      }
    );

    timings.viewUpdate = performance.now() - start;

    if (!updatedVideo) {
      throw new ApiError(404, "Video not found");
    }

  // Dashboard update

    start = performance.now();

    await incrementViews(updatedVideo.owner);

    timings.dashboard = performance.now() - start;

    // Trending score update

    start = performance.now();

    await updateTrendingScore(videoId);

    timings.trending = performance.now() - start;

   // Update cached video it it exists

    if (cachedVideo) {
      cachedVideo.views = updatedVideo.views;

      start = performance.now();

      await setVideoCache(videoId, cachedVideo);

      timings.cacheUpdate = performance.now() - start;
    }
  }

   // Cache hit response

  if (cachedVideo) {
    timings.total = performance.now() - requestStart;

    console.log("[PERF][getVideoById]", timings);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          cachedVideo,
          "Video fetched from cache."
        )
      );
  }

    // Cache miss, fetch from MongoDB

  start = performance.now();

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
        isPublished: true,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $unwind: "$owner",
    },
    {
      $project: {
        title: 1,
        description: 1,
        videoFile: 1,
        thumbnail: 1,
        views: 1,
        createdAt: 1,
        "owner._id": 1,
        "owner.username": 1,
        "owner.fullName": 1,
        "owner.avatar": 1,
      },
    },
  ]);

  timings.mongoVideo = performance.now() - start;

  if (!video.length) {
    throw new ApiError(404, "Video not found");
  }

  const videoData = video[0];

   // Cache results 

  start = performance.now();

  await setVideoCache(videoId, videoData);

  timings.cacheSet = performance.now() - start;

   // Final response

  timings.total = performance.now() - requestStart;

  console.log("[PERF][getVideoById]", timings);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        videoData,
        "Video fetched successfully"
      )
    );
});

const getTrending = asyncHandler(async (req, res) => {
  let redisResult = await getTrendingScore(50); // Get top 50

  // Hybrid Warm-up Fallback
  if (!redisResult || !redisResult.length) {
    console.log("Trending ZSET is empty! Performing MongoDB warm-up...");
    const topVideos = await Video.find({ isPublished: true })
      .sort({ views: -1 })
      .limit(50);
    for (const v of topVideos) {
      await updateTrendingScore(v._id);
    }
    redisResult = await getTrendingScore(50);
  }

  if (!redisResult || !redisResult.length) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No trending items found."));
  }

  // Parse WITHSCORES array: [id1, score1, id2, score2, ...]
  const itemIds = [];
  const scores = {};
  for (let i = 0; i < redisResult.length; i += 2) {
    const id = redisResult[i];
    const score = parseFloat(redisResult[i + 1]);
    itemIds.push(id);
    scores[id] = score;
  }

  // Query both Video and Live collections
  const [videos, lives] = await Promise.all([
    Video.find({ _id: { $in: itemIds } }).populate(
      "owner",
      "username fullName avatar"
    ),
    Live.find({
      _id: { $in: itemIds },
      isActive: true,
    }).populate("streamer", "username fullName avatar"),
  ]);

  const combinedMap = new Map();
  videos.forEach((v) =>
    combinedMap.set(v._id.toString(), { ...v.toObject(), type: "video" })
  );
  lives.forEach((l) =>
    combinedMap.set(l._id.toString(), { ...l.toObject(), type: "live" })
  );

  // Preserve rank order and append rank/score data
  const orderedItems = itemIds
    .map((id, index) => {
      const item = combinedMap.get(id.toString());
      if (item) {
        item.trendingRank = index + 1;
        item.trendingScore = scores[id];
      }
      return item;
    })
    .filter(Boolean);

  return res
    .status(200)
    .json(
      new ApiResponse(200, orderedItems, "Trending items fetched successfully")
    );
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this video");
  }

  if (title) {
    video.title = title;
  }

  if (description) {
    video.description = description;
  }

  if (req.file?.path) {
    const uploadedThumbnail = await uploadOnCloudinary(req.file.path);

    if (!uploadedThumbnail?.url) {
      throw new ApiError(400, "Error when uploading thumbnail");
    }
    video.thumbnail = uploadedThumbnail.url;
  }

  await video.save();

  await deleteVideoCache(videoId);

  await deleteCache("videos:all");

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this video");
  }

  const videoPublicId = getPublicId(video.videoFile);
  const thumbnailPublicId = getPublicId(video.thumbnail);

  await deleteFromCloudinary(videoPublicId, "video");
  await deleteFromCloudinary(thumbnailPublicId, "image");

  await Video.findByIdAndDelete(videoId);

  await deleteVideoCache(videoId);

  await deleteCache("videos:all");

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to change the status of this video"
    );
  }

  video.isPublished = !video.isPublished;

  await video.save();

  await deleteVideoCache(videoId);

  await deleteCache("videos:all");

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video status changed successfully"));
});

const getSubscribedFeed = asyncHandler(async (req, res) => {
  const subscriptions = await Subscription.find({ subscriber: req.user._id });
  const channelIds = subscriptions.map((sub) => sub.channel.toString());

  // 1. Fetch Feed Data
  let videos = [];
  let lives = [];

  if (channelIds.length > 0) {
    [videos, lives] = await Promise.all([
      Video.find({ owner: { $in: channelIds }, isPublished: true })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("owner", "username fullName avatar"),
      Live.find({ streamer: { $in: channelIds }, isLive: true, isActive: true })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("streamer", "username fullName avatar"),
    ]);
  }

  const combined = [
    ...videos.map((v) => ({ ...v.toObject(), type: "video" })),
    ...lives.map((l) => ({ ...l.toObject(), type: "live" })),
  ];

  combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // 2. Fetch Suggestions Data
  let suggestedVideos = [];
  try {
    const trendingRedisIds = await getTrendingScore(15);

    const itemIds = [];
    for (let i = 0; i < trendingRedisIds.length; i += 2) {
      itemIds.push(trendingRedisIds[i]);
    }

    const currentUser = await mongoose
      .model("User")
      .findById(req.user._id)
      .select("watchHistory");
    const watchHistoryStr = currentUser.watchHistory.map((id) => id.toString());

    // Filter logic: Not watched, not subscribed to
    const potentialSuggestions = await Video.find({
      _id: { $in: itemIds },
      isPublished: true,
    }).populate("owner", "username fullName avatar");

    suggestedVideos = potentialSuggestions
      .filter((v) => {
        const ownerIdStr = v.owner._id.toString();
        const videoIdStr = v._id.toString();
        return (
          !channelIds.includes(ownerIdStr) &&
          !watchHistoryStr.includes(videoIdStr)
        );
      })
      .slice(0, 5); // Return top 5
  } catch (error) {
    console.error("Failed to fetch suggestions for feed:", error);
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        feed: combined,
        suggestions: suggestedVideos,
      },
      "Subscribed feed and suggestions fetched successfully"
    )
  );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  getTrending,
  getSubscribedFeed,
};
