import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/axios";
import { Flame } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { TrendingRowSkeleton } from "../components/Skeletons";

export const Trending = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        // Fallback checks both /video and /videos just in case based on common REST patterns
        const { data } = await api.get("/videos/trending");
        setItems(data.data || []);
        setItems(data.data || []);
      } catch (error) {
        console.error("Failed to fetch trending items:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl px-6 pb-12 mx-auto">
        <div className="flex items-center gap-4 mt-4 mb-8">
          <h1 className="text-4xl font-black uppercase border-4 border-neoBlack px-6 py-3 tracking-tight bg-neoYellow shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rotate-[-1deg]">
            Trending Leaderboard
          </h1>
          <Flame
            size={48}
            className="text-neoRed animate-pulse stroke-black stroke-[2]"
          />
        </div>

        <div className="flex flex-col gap-6">
          {[...Array(4)].map((_, idx) => (
            <TrendingRowSkeleton key={idx} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl px-6 pb-12 mx-auto">
      <div className="flex items-center gap-4 mt-4 mb-8">
        <h1 className="text-4xl font-black uppercase border-4 border-neoBlack px-6 py-3 tracking-tight bg-neoYellow shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rotate-[-1deg]">
          Trending Leaderboard
        </h1>
        <Flame
          size={48}
          className="text-neoRed animate-pulse stroke-black stroke-[2]"
        />
      </div>

      <div className="flex flex-col gap-6">
        {items.length === 0 ? (
          <p className="text-xl font-black text-center uppercase">
            No trending items right now. Check back soon!
          </p>
        ) : (
          items.map((item) => {
            const isLive = item.type === "live";
            const linkPath = isLive
              ? `/live/${item._id}`
              : `/video/${item._id}`;
            const owner = isLive ? item.streamer : item.owner;
            const views = isLive ? item.viewers : item.views;

            return (
              <Link
                key={item._id}
                to={linkPath}
                className="flex flex-col md:flex-row gap-6 bg-neoWhite border-4 border-neoBlack shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-all p-4 group"
              >
                {/* Thumbnail Container */}
                <div className="relative w-full overflow-hidden bg-black border-4 md:w-80 shrink-0 aspect-video border-neoBlack">
                  {isLive ? (
                    <div className="flex items-center justify-center w-full h-full bg-zinc-900">
                      <span className="text-2xl font-black tracking-widest uppercase text-neoRed animate-pulse">
                        LIVE NOW
                      </span>
                    </div>
                  ) : (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="object-cover w-full h-full transition-transform group-hover:scale-105"
                    />
                  )}
                  {isLive && (
                    <div className="absolute px-2 py-1 text-xs font-black text-white uppercase border-2 border-black top-2 right-2 bg-neoRed">
                      LIVE
                    </div>
                  )}
                </div>

                {/* Metadata & Ranking Badge Container */}
                <div className="relative flex flex-col justify-between flex-1 py-2">
                  <div>
                    <h2 className="text-2xl font-black leading-tight uppercase line-clamp-2">
                      {item.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="w-8 h-8 overflow-hidden bg-gray-200 border-2 rounded-full border-neoBlack">
                        {owner?.avatar && (
                          <img
                            src={owner.avatar}
                            alt="Avatar"
                            className="object-cover w-full h-full"
                          />
                        )}
                      </div>
                      <p className="text-sm font-bold text-gray-800 uppercase">
                        @{owner?.username || "Unknown"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-4 text-sm font-bold text-gray-600 uppercase">
                    <span className="px-2 py-1 bg-gray-200 border-2 border-neoBlack">
                      {views || 0} {isLive ? "VIEWERS" : "VIEWS"}
                    </span>
                    <span className="px-2 py-1 bg-gray-200 border-2 border-neoBlack">
                      {formatDistanceToNow(new Date(item.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  {/* Absolute Ranking Badge */}
                  <div className="absolute top-0 right-0 md:-top-6 md:-right-6 bg-neoYellow border-4 border-neoBlack px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-3 group-hover:rotate-6 transition-transform">
                    <span className="text-xl font-black tracking-wider text-black uppercase">
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
