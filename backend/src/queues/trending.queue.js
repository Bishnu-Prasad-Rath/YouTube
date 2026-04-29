import { Queue } from 'bullmq';
import {redisClient} from '../config/redis.config.js';

const trendingQueue = new Queue("trending",{
    connection: redisClient,
})

export { trendingQueue };