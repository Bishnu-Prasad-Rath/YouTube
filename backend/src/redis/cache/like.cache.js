import { redisClient } from "../../config/redis.config.js";

import { CACHE_KEYS } from "./key.js";

//Video

const incrementVideoLikes = async (videoId) => {
  return await redisClient.incr(CACHE_KEYS.VIDEO_LIKES(videoId));
};

const decrementVideoLikes = async (videoId) => {
  const key = CACHE_KEYS.VIDEO_LIKES(videoId);
  const current = await redisClient.get(key);

  if (!current || Number(current) <= 0) return 0;

  return await redisClient.decr(key);
};

const getVideoLikes = async (videoId) => {
  const value = await redisClient.get(CACHE_KEYS.VIDEO_LIKES(videoId));
  return value ? Number(value) : 0;
};

const setVideoLikes = async (videoId, count) => {
  await redisClient.set(CACHE_KEYS.VIDEO_LIKES(videoId), count, "EX", 300);
};
//Comment

const incrementCommentLikes = async (commentId) => {
  return await redisClient.incr(CACHE_KEYS.COMMENT_LIKES(commentId));
};

const decrementCommentLikes = async (commentId) => {
  const key = CACHE_KEYS.COMMENT_LIKES(commentId);
  const current = await redisClient.get(key);

  if (!current || Number(current) <= 0) return 0;

  return await redisClient.decr(key);
};

const getCommentLikes = async (commentId) => {
  const value = await redisClient.get(CACHE_KEYS.COMMENT_LIKES(commentId));
  return value ? Number(value) : 0;
};

const setCommentLikes = async (commentId, count) => {
  await redisClient.set(CACHE_KEYS.COMMENT_LIKES(commentId), count, "EX", 300);
};

//Tweet

const incrementTweetLikes = async (tweetId) => {
  return await redisClient.incr(CACHE_KEYS.TWEET_LIKES(tweetId));
};

const decrementTweetLikes = async (tweetId) => {
  const key = CACHE_KEYS.TWEET_LIKES(tweetId);
  const current = await redisClient.get(key);

  if (!current || Number(current) <= 0) return 0;
  
  return await redisClient.decr(key);
};

const getTweetLikes = async (tweetId) => {
  const value = await redisClient.get(CACHE_KEYS.TWEET_LIKES(tweetId));
  return value ? Number(value) : 0;
};

const setTweetLikes = async (tweetId, count) => {
  await redisClient.set(CACHE_KEYS.TWEET_LIKES(tweetId), count, "EX", 300);
};

//Live

const incrementLiveLikes = async (liveId) => {
  return await redisClient.incr(CACHE_KEYS.LIVE_LIKES(liveId));
};

const decrementLiveLikes = async (liveId) => {
  const key = CACHE_KEYS.LIVE_LIKES(liveId);
  const current = await redisClient.get(key);

  if (!current || Number(current) <= 0) return 0;
  
  return await redisClient.decr(key);
};

const getLiveLikes = async (liveId) => {
  const value = await redisClient.get(CACHE_KEYS.LIVE_LIKES(liveId));
  return value ? Number(value) : 0;
};

const setLiveLikes = async (liveId, count) => {
  await redisClient.set(CACHE_KEYS.LIVE_LIKES(liveId), count, "EX", 300);
};

export {
  incrementVideoLikes,
  decrementVideoLikes,
  getVideoLikes,
  setVideoLikes,
  incrementCommentLikes,
  decrementCommentLikes,
  getCommentLikes,
  setCommentLikes,
  incrementTweetLikes,
  decrementTweetLikes,
  getTweetLikes,
  setTweetLikes,
  incrementLiveLikes,
  decrementLiveLikes,
  getLiveLikes,
  setLiveLikes,
};
