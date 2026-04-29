 const CACHE_KEYS = {
  // 🎥 VIDEO
  VIDEO: (id) => `video:${id}`,
  VIDEOS: (params) =>
    `videos:page:${params.page}:limit:${params.limit}:query:${params.query}:sort:${params.sortBy}:${params.sortType}:user:${params.userId}`,
  TRENDING_VIDEOS:()=> `videos:trending`,
  // 💬 COMMENTS
  VIDEO_COMMENTS: (videoId, page) =>
    `video:${videoId}:comments:page:${page}`,

  // ❤️ LIKES
  VIDEO_LIKES: (videoId) => `video:${videoId}:likes`,
  COMMENT_LIKES: (commentId) => `comment:${commentId}:likes`,
  TWEET_LIKES: (tweetId) => `tweet:${tweetId}:likes`,
  LIVE_LIKES: (liveId) => `live:${liveId}:likes`,

  // 📊 DASHBOARD
  DASHBOARD: (userId) => `user:${userId}:dashboard`,

  // 🔔 SUBSCRIPTIONS
  USER_SUBSCRIPTIONS: (userId) => `user:${userId}:subscriptions`,
  CHANNEL_SUBSCRIBERS: (channelId) =>
    `channel:${channelId}:subscribers`,
};

export { CACHE_KEYS };