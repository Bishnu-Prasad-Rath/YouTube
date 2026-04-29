import { Worker } from "bullmq";
import { redisClient} from '../config/redis.config.js';
import {updateTrendingScore} from '../redis/cache/trending.cache.js';

const worker = new Worker("trending",
    async(job)=>{
        const {videoId, weight} = job.data;
        await updateTrendingScore(videoId, weight);
    },
{connection: redisClient}
)

worker.on("completed",()=>{
    console.log("Trending job completed");
})