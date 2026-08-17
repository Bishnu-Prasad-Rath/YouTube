import { redisClient } from "../../config/redis.config.js";

const getCache = async (key) => {
  const start = performance.now();

  const data = await redisClient.get(key);

  const redisTime = performance.now() - start;

  console.log(
    `[PERF][Redis GET] ${redisTime.toFixed(2)}ms | key=${key}`
  );

  return data ? JSON.parse(data) : null;
};

const setCache = async (key, value, ttl = 60) => {
  const start = performance.now();

  await redisClient.set(
    key,
    JSON.stringify(value),
    "EX",
    ttl
  );

  const redisTime = performance.now() - start;

  console.log(
    `[PERF][Redis SET] ${redisTime.toFixed(2)}ms | key=${key}`
  );
};

const deleteCache = async (key) => {
  const start = performance.now();

  await redisClient.del(key);

  const redisTime = performance.now() - start;

  console.log(
    `[PERF][Redis DEL] ${redisTime.toFixed(2)}ms | key=${key}`
  );
};

export {
  getCache,
  setCache,
  deleteCache,
};