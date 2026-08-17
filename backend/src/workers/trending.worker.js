import { Worker } from "bullmq";
import { redisClient } from "../config/redis.config.js";
import { updateTrendingScore } from "../redis/cache/trending.cache.js";

const trendingWorker = new Worker(
  "trending",

  async (job) => {
    const start = performance.now();

    console.log("[BullMQ][trending] Processing", {
      id: job.id,
      name: job.name,
      attempt: job.attemptsMade + 1,
      data: job.data,
    });

    const { videoId, weight } = job.data;

    //Validate job payload

    if (!videoId) {
      throw new Error("Missing videoId");
    }

    if (typeof weight !== "number") {
      throw new Error("Invalid weight");
    }

    // Process job

    await updateTrendingScore(videoId, weight);

    // Performance

    const total = performance.now() - start;

    console.log("[BullMQ][trending] Processed", {
      id: job.id,
      total: `${total.toFixed(2)}ms`,
    });

    return {
      videoId,
      weight,
      processingTime: total,
    };
  },

  {
    connection: redisClient,

    // Number of jobs this worker can process concurrently
    concurrency: 10,

    // Protect Redis / downstream services
    limiter: {
      max: 100,
      duration: 1000,
    },

    // How long a job can run before BullMQ
    // considers the worker potentially stalled
    lockDuration: 30000,

    // How frequently stalled jobs are checked
    stalledInterval: 30000,
  }
);

// COMPLETED

trendingWorker.on("completed", (job, result) => {
  console.log("[BullMQ][trending] Completed", {
    id: job.id,
    name: job.name,
    result,
  });
});

// FAILED

trendingWorker.on("failed", (job, error) => {
  console.error("[BullMQ][trending] Failed", {
    id: job?.id,
    name: job?.name,
    attemptsMade: job?.attemptsMade,
    maxAttempts: job?.opts?.attempts,
    error: error.message,
  });
});

// STALLED

trendingWorker.on("stalled", (jobId) => {
  console.warn("[BullMQ][trending] Stalled", {
    jobId,
  });
});

// WORKER ERROR

trendingWorker.on("error", (error) => {
  console.error("[BullMQ][trending] Worker error", {
    message: error.message,
    stack: error.stack,
  });
});

// READY

trendingWorker.on("ready", () => {
  console.log("✅ [BullMQ][trending] Worker ready");
});

// CLOSING

trendingWorker.on("closing", () => {
  console.log("🛑 [BullMQ][trending] Worker closing");
});

// CLOSED

trendingWorker.on("closed", () => {
  console.log("🛑 [BullMQ][trending] Worker closed");
});

export { trendingWorker };
