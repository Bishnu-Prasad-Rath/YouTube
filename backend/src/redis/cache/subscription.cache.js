import { CACHE_KEYS } from "./key.js";
import { redisClient } from "../../config/redis.config.js";

const addSubscription = async (userId, channelId) => {
  await redisClient.sadd(CACHE_KEYS.USER_SUBSCRIPTIONS(userId), channelId);
  await redisClient.sadd(CACHE_KEYS.CHANNEL_SUBSCRIBERS(channelId), userId);
};

const removeSubscription = async (userId, channelId) => {
  await redisClient.srem(CACHE_KEYS.USER_SUBSCRIPTIONS(userId), channelId);
  await redisClient.srem(CACHE_KEYS.CHANNEL_SUBSCRIBERS(channelId), userId);
};

const isSubscribed = async (userId, channelId) => {
  return await redisClient.sismember(
    CACHE_KEYS.USER_SUBSCRIPTIONS(userId),
    channelId
  );
};

const getSubscribersCount = (channelId) =>
  redisClient.scard(CACHE_KEYS.CHANNEL_SUBSCRIBERS(channelId));

export {
  addSubscription,
  removeSubscription,
  isSubscribed,
  getSubscribersCount
};