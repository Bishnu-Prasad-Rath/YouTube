import { redisClient } from "../../config/redis.config.js";
import { CACHE_KEYS } from "./key.js";
import { Video } from "../../models/video.model.js";
import { Live } from "../../models/live.model.js";
import { Like } from "../../models/like.model.js";

const TRENDING_KEY = CACHE_KEYS.TRENDING_VIDEOS();

const getTrendingScore = async (limit = 10) => {
  return await redisClient.zrevrange(TRENDING_KEY, 0, limit - 1, "WITHSCORES");
};

const updateTrendingScore = async (itemId) => {
  try {
    let isLiveStream = false;
    let views = 0;
    let createdAt;

    let item = await Video.findById(itemId).select("createdAt views").lean();

    if (item) {
      views = item.views || 0;
      createdAt = item.createdAt;
    } else {
      item = await Live.findById(itemId)
        .select("createdAt viewers isLive")
        .lean();

      if (!item) return;

      views = item.viewers || 0;
      createdAt = item.createdAt;
      isLiveStream = item.isLive;
    }

    const likesCount = await Like.countDocuments({
      $or: [{ video: itemId }, { live: itemId }],
    });

    const now = Date.now();
    const created = new Date(createdAt).getTime();

    const hoursOld = Math.max(0, (now - created) / (1000 * 60 * 60));

    let score = (views * 1 + likesCount * 2) / Math.pow(hoursOld + 2, 1.5);

    if (isLiveStream) {
      score *= 1.5;
    }

    await redisClient.zadd(TRENDING_KEY, score, itemId.toString());

    console.log("[TRENDING]", {
      itemId: itemId.toString(),
      score,
      weight,
      isLiveStream,
    });
  } catch (error) {
    console.error("[TRENDING] Failed:", error);

    throw error;
  }
};

export { updateTrendingScore, getTrendingScore };
