import { Worker } from "bullmq";
import { redisClient } from "../config/redis.config.js";
import { Video } from "../models/video.model.js";
import { incrementViews } from "../redis/cache/dashboard.cache.js";
import { trendingQueue } from "../queues/trending.queue.js";

const viewWorker = new Worker(
  "video-views",

  async (job) => {
    const start = performance.now();

    const { videoId } = job.data;

    console.log("[BullMQ][views] Processing", {
      id: job.id,
      videoId,
      attempt: job.attemptsMade + 1,
    });

    if (!videoId) {
      throw new Error("Missing videoId");
    }

    // --------------------------------------------------
    // 1. Increment MongoDB video views
    // --------------------------------------------------

    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      {
        $inc: {
          views: 1,
        },
      },
      {
        new: true,
        projection: {
          views: 1,
          owner: 1,
        },
      }
    );

    if (!updatedVideo) {
      throw new Error(`Video not found: ${videoId}`);
    }

    // --------------------------------------------------
    // 2. Update dashboard
    // --------------------------------------------------

    await incrementViews(updatedVideo.owner);

    // --------------------------------------------------
    // 3. Queue trending recalculation
    // --------------------------------------------------

    await trendingQueue.add(
      "recalculate",
      {
        videoId,
        reason: "view",
      },
      {
        jobId: `trending:view:${videoId}`,
      }
    );

    const total = performance.now() - start;

    console.log("[BullMQ][views] Completed", {
      id: job.id,
      videoId,
      views: updatedVideo.views,
      total: `${total.toFixed(2)}ms`,
    });

    return {
      videoId,
      views: updatedVideo.views,
      processingTime: total,
    };
  },

  {
    connection: redisClient,

    concurrency: 20,

    limiter: {
      max: 200,
      duration: 1000,
    },

    lockDuration: 30000,

    stalledInterval: 30000,
  }
);