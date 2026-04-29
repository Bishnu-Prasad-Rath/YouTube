import {redisClient} from "../../config/redis.config.js";

 const getCache = async (key) => {
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

 const setCache = async (key, value, ttl = 60) => {
  await redisClient.set(key, JSON.stringify(value), 'EX', ttl);
};

 const deleteCache = async (key) => {
  await redisClient.del(key);
};

export{getCache,setCache,deleteCache}