import { getCache,setCache,deleteCache } from "./base.cache.js";
import {CACHE_KEYS} from "./key.js"

const getVideoCache = (videoId) => 
    getCache(CACHE_KEYS.VIDEO(videoId));

const setVideoCache = (videoId, data) =>
  setCache(CACHE_KEYS.VIDEO(videoId), data);

const deleteVideoCache = (videoId) =>
    deleteCache(CACHE_KEYS.VIDEO(videoId))

const getVideosCache = (params) =>
  getCache(CACHE_KEYS.VIDEOS(params));

const setVideosCache = (params, data) =>
  setCache(CACHE_KEYS.VIDEOS(params), data);

const deleteVideosCache = (params) => {
    deleteCache(CACHE_KEYS.VIDEOS(params));
}

export{getVideoCache,setVideoCache,deleteVideoCache,getVideosCache,setVideosCache,deleteVideosCache}