import { Queue } from "bullmq";
import { redisClient } from "../config/redis.config.js";

const viewQueue = new Queue("video-views", {
  connection: redisClient,

  defaultJobOptions: {
    attempts: 5,

    backoff: {
      type: "exponential",
      delay: 1000,
    },

    removeOnComplete: {
      age: 60 * 60,
      count: 5000,
    },

    removeOnFail: {
      age: 24 * 60 * 60,
      count: 10000,
    },
  },
});

export { viewQueue };