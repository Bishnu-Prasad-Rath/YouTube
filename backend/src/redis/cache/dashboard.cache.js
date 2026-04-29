import { redisClient } from "../../config/redis.config.js";

import { CACHE_KEYS } from "./key.js";

const DASHBOARD_KEY = CACHE_KEYS.DASHBOARD;

// ✅ GET (HASH)
const getDashboardCache = async (userId) => {
  const data = await redisClient.hgetall(DASHBOARD_KEY(userId));

  if (Object.keys(data).length === 0) return null;

  return {
    totalSubscribers: Number(data.totalSubscribers),
    totalVideos: Number(data.totalVideos),
    totalViews: Number(data.totalViews),
    totalLikes: Number(data.totalLikes),
    topTweets: data.topTweets ? JSON.parse(data.topTweets) : [],
    performanceGraph: data.performanceGraph ? JSON.parse(data.performanceGraph) : [],
  };
};

// ✅ SET (HASH)
const setDashboardCache = async (userId, data) => {
  const key = DASHBOARD_KEY(userId);

  await redisClient.hset(key, {
    totalSubscribers: data.totalSubscribers,
    totalVideos: data.totalVideos,
    totalViews: data.totalViews,
    totalLikes: data.totalLikes,
    topTweets: JSON.stringify(data.topTweets || []),
    performanceGraph: JSON.stringify(data.performanceGraph || []),
  });

  await redisClient.expire(key, 300); // 5 min TTL
};

// ✅ DELETE (fallback only)
const deleteDashboardCache = async (userId) => {
  await redisClient.del(DASHBOARD_KEY(userId));
};

// 🔥 PARTIAL UPDATES (REAL MAGIC)

// +1 subscriber
const incrementSubscribers = async (userId) => {
  await redisClient.hincrby(DASHBOARD_KEY(userId), "totalSubscribers", 1);
};

// -1 subscriber
const decrementSubscribers = async (userId) => {
  await redisClient.hincrby(DASHBOARD_KEY(userId), "totalSubscribers", -1);
};

// +1 video
const incrementVideos = async (userId) => {
  await redisClient.hincrby(DASHBOARD_KEY(userId), "totalVideos", 1);
};

// +1 like
const incrementLikes = async (userId) => {
  await redisClient.hincrby(DASHBOARD_KEY(userId), "totalLikes", 1);
};

const decrementLikes = async (userId) => {
  await redisClient.hincrby(DASHBOARD_KEY(userId), "totalLikes", -1);
}

// +views
const incrementViews = async (userId, count = 1) => {
  await redisClient.hincrby(DASHBOARD_KEY(userId), "totalViews", count);
};

export {
  getDashboardCache,
  setDashboardCache,
  deleteDashboardCache,
  incrementSubscribers,
  decrementSubscribers,
  incrementVideos,
  incrementLikes,
  incrementViews,
  decrementLikes,
};