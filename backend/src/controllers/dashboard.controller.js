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
  /*
  const cachedData = await getDashboardCache(channelId);
  if (cachedData) {
    return res.status(200).json(new ApiResponse(200, cachedData, "Dashboard fetched from cache"));
  }
  */

  const totalSubscribers = await Subscription.countDocuments({ channel: channelId });
  const totalVideos = await Video.countDocuments({ owner: channelId });

  // Gather Total Views
  const totalViewsAgg = await Video.aggregate([
    { $match: { owner: channelId } },
    { $group: { _id: null, totalViews: { $sum: "$views" } } },
  ]);
  const totalViews = totalViewsAgg[0]?.totalViews || 0;

  // 👇 THE FIX: LIKES CALCULATION 👇
  
  // Step A: Get all Video Likes
  const userVideos = await Video.find({ owner: channelId }).select("_id");
  const videoIds = userVideos.map(v => v._id);
  const totalVideoLikes = await Like.countDocuments({ video: { $in: videoIds } });

  // Step B: Gather Top Tweets & Accumulate Tweet Likes
  const tweets = await Tweet.find({ owner: channelId }).lean();
  let totalTweetLikes = 0; // We will add to this as we loop!
  
  const tweetsWithLikes = await Promise.all(
    tweets.map(async (t) => {
      const count = await Like.countDocuments({ tweet: t._id });
      totalTweetLikes += count; // Add this tweet's likes to our running total
      return { ...t, likes: count };
    })
  );
  const topTweets = tweetsWithLikes.sort((a, b) => b.likes - a.likes).slice(0, 5);

  // Step C: Combine them for the final boss number
  const totalLikes = totalVideoLikes + totalTweetLikes;
  
  // 👆 END OF LIKES FIX 👆

  // Performance Graph Logic
  const recentVideos = await Video.find({ owner: channelId })
    .sort({ createdAt: -1 })
    .limit(7)
    .lean();
    
  const performanceGraph = recentVideos.reverse().map(v => ({
    name: v.title.substring(0, 15) + (v.title.length > 15 ? '...' : ''),
    views: v.views
  }));

  // THE GRAPH FIX: If there is only 1 video, add a baseline point
  if (performanceGraph.length === 1) {
    performanceGraph.unshift({ name: "Channel Start", views: 0 });
  }

  const responseData = {
    totalSubscribers,
    totalVideos,
    totalViews,
    totalLikes,       // <-- Now properly sending the combined total!
    topTweets,
    performanceGraph,
  };

  // Keep this so it saves to Redis
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
