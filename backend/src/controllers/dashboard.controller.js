import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getDashboardCache,
  setDashboardCache,
} from "../redis/cache/dashboard.cache.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const channelId = req.user._id;

  // 1. TEMPORARILY BYPASS CACHE FOR TESTING
  // Commenting this out guarantees you see fresh Database data every time you refresh.
  /*
  const cachedData = await getDashboardCache(channelId);
  if (cachedData) {
    return res.status(200).json(new ApiResponse(200, cachedData, "Dashboard fetched from cache"));
  }
  */

  const totalSubscribers = await Subscription.countDocuments({ channel: channelId });
  const totalVideos = await Video.countDocuments({ owner: channelId });
  const totalLikes = await Like.countDocuments({ owner: channelId });

  const totalViewsAgg = await Video.aggregate([
    { $match: { owner: channelId } },
    { $group: { _id: null, totalViews: { $sum: "$views" } } },
  ]);

  const totalViews = totalViewsAgg[0]?.totalViews || 0;

  // Gather Top Tweets
  const tweets = await Tweet.find({ owner: channelId }).lean();
  const tweetsWithLikes = await Promise.all(
    tweets.map(async (t) => {
      const count = await Like.countDocuments({ tweet: t._id });
      return { ...t, likes: count };
    })
  );
  const topTweets = tweetsWithLikes.sort((a, b) => b.likes - a.likes).slice(0, 5);

  // Performance Graph Logic
  const recentVideos = await Video.find({ owner: channelId })
    .sort({ createdAt: -1 })
    .limit(7)
    .lean();
    
  const performanceGraph = recentVideos.reverse().map(v => ({
    name: v.title.substring(0, 15) + (v.title.length > 15 ? '...' : ''),
    views: v.views
  }));

  // 2. THE GRAPH FIX: If there is only 1 video, add a baseline point so the line can actually draw!
  if (performanceGraph.length === 1) {
    performanceGraph.unshift({ name: "Channel Start", views: 0 });
  }

  const responseData = {
    totalSubscribers,
    totalVideos,
    totalViews,
    totalLikes,
    topTweets,
    performanceGraph,
  };

  // Keep this so it saves, but it won't block fresh data until you uncomment the block above
  await setDashboardCache(channelId, responseData);

  return res
    .status(200)
    .json(new ApiResponse(200, responseData, "Channel stats fetched successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const channelId = req.user._id;

  const videos = await Video.find({
    owner: channelId,
  }).sort({
    createdAt: -1,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        videos,
        "All videos of this channel are fetched successfully"
      )
    );
});

export { getChannelStats, getChannelVideos };
