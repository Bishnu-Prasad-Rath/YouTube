import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/axios";
import { Flame } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Trending = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        // Fallback checks both /video and /videos just in case based on common REST patterns
        const { data } = await api.get("/video/trending").catch(() => api.get("/videos/trending"));
        setItems(data.data || []);
      } catch (error) {
        console.error("Failed to fetch trending items:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  if (loading) return <div className="text-center font-black text-4xl mt-12 uppercase animate-pulse">Loading Leaderboard...</div>;

  return (
    <div className="px-6 pb-12 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-8 mt-4">
        <h1 className="text-4xl font-black uppercase border-4 border-neoBlack px-6 py-3 tracking-tight bg-neoYellow shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rotate-[-1deg]">
          Trending Leaderboard
        </h1>
        <Flame size={48} className="text-neoRed animate-pulse stroke-black stroke-[2]" />
      </div>

      <div className="flex flex-col gap-6">
        {items.length === 0 ? (
           <p className="text-center font-black uppercase text-xl">No trending items right now. Check back soon!</p>
        ) : (
          items.map((item) => {
            const isLive = item.type === 'live';
            const linkPath = isLive ? `/live/${item._id}` : `/video/${item._id}`;
            const owner = isLive ? item.streamer : item.owner;
            const views = isLive ? item.viewers : item.views;

            return (
              <Link 
                key={item._id} 
                to={linkPath}
                className="flex flex-col md:flex-row gap-6 bg-neoWhite border-4 border-neoBlack shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-all p-4 group"
              >
                {/* Thumbnail Container */}
                <div className="w-full md:w-80 shrink-0 aspect-video border-4 border-neoBlack bg-black overflow-hidden relative">
                  {isLive ? (
                     <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                        <span className="text-neoRed font-black text-2xl uppercase tracking-widest animate-pulse">LIVE NOW</span>
                     </div>
                  ) : (
                     <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  )}
                  {isLive && (
                     <div className="absolute top-2 right-2 bg-neoRed text-white font-black px-2 py-1 border-2 border-black uppercase text-xs">
                        LIVE
                     </div>
                  )}
                </div>

                {/* Metadata & Ranking Badge Container */}
                <div className="flex-1 flex flex-col justify-between py-2 relative">
                  <div>
                    <h2 className="text-2xl font-black uppercase leading-tight line-clamp-2">{item.title}</h2>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="w-8 h-8 rounded-full border-2 border-neoBlack overflow-hidden bg-gray-200">
                        {owner?.avatar && <img src={owner.avatar} alt="Avatar" className="w-full h-full object-cover" />}
                      </div>
                      <p className="font-bold text-gray-800 uppercase text-sm">@{owner?.username || "Unknown"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-4 text-sm font-bold text-gray-600 uppercase">
                    <span className="bg-gray-200 border-2 border-neoBlack px-2 py-1">
                       {views || 0} {isLive ? 'VIEWERS' : 'VIEWS'}
                    </span>
                    <span className="bg-gray-200 border-2 border-neoBlack px-2 py-1">
                       {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Absolute Ranking Badge */}
                  <div className="absolute top-0 right-0 md:-top-6 md:-right-6 bg-neoYellow border-4 border-neoBlack px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-3 group-hover:rotate-6 transition-transform">
                     <span className="font-black text-xl uppercase tracking-wider text-black">
                        #{item.trendingRank} TRENDING
                     </span>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};
