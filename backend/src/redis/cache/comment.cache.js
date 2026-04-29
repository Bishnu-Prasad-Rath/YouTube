import { getCache, setCache, deleteCache } from "./base.cache.js";
import { redisClient } from "../../config/redis.config.js";
import { CACHE_KEYS } from "./key.js";

// ✅ GET
const getCommentsCache = async (videoId, page) => {
  const key = CACHE_KEYS.VIDEO_COMMENTS(videoId, page);
  return await getCache(key);
};

// ✅ SET
const setCommentsCache = async (videoId, page, data) => {
  const key = CACHE_KEYS.VIDEO_COMMENTS(videoId, page);
  await setCache(key, data, 60);
};

// ✅ DELETE
const deleteCommentsCache = async (videoId) => {
const pattern = `video:${videoId}:comments:page:*`;

  const keys = await redisClient.keys(pattern);

  if (keys.length > 0) {
    await redisClient.del(keys);
  }
};

export {
  getCommentsCache,
  setCommentsCache,
  deleteCommentsCache,
};