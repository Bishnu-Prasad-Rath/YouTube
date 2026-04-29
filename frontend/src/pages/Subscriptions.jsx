import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/axios";
import { VideoCard } from "../components/VideoCard";
import { Radio } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Subscriptions = () => {
  const [feed, setFeed] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const { data } = await api.get("/videos/subscribed-feed").catch(() => api.get("/video/subscribed-feed"));
        setFeed(data.data?.feed || []);
        setSuggestions(data.data?.suggestions || []);
      } catch (error) {
        console.error("Failed to fetch subscriptions feed:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, []);

  const sortedFeed = useMemo(() => {
    return [...feed].sort((a, b) => {
      // Pin active live streams to top
      const aIsLive = a.type === 'live' && a.isLive;
      const bIsLive = b.type === 'live' && b.isLive;
      
      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;
      
      return 0; // Maintain default createdAt: -1 order from backend
    });
  }, [feed]);

  if (loading) return <div className="text-center font-black text-4xl mt-12 uppercase animate-pulse">Loading Subscriptions...</div>;

  return (
    <div className="px-6 pb-12 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-8 mt-4">
        <h1 className="text-4xl font-black uppercase border-4 border-neoBlack px-6 py-3 tracking-tight bg-neoPink shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rotate-[-1deg]">
          Subscriptions
        </h1>
        <Radio size={48} className="text-black stroke-[2]" />
      </div>

      {sortedFeed.length === 0 ? (
        <div className="text-center p-16 neo-card border-4 border-neoBlack bg-neoWhite shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <p className="font-black uppercase text-3xl mb-4">Your favorite creators are quiet... for now.</p>
          <p className="font-bold text-gray-700 text-lg">Explore the suggestions below or find new creators on the Trending page.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {sortedFeed.map((item) => {
            if (item.type === 'video') {
              // Standard Video Card, inject date-fns logic into uploaded text if needed
              // VideoCard component usually handles its own rendering, but we can wrap it or modify it
              // Since we use the same VideoCard, it should just work.
              return <VideoCard key={item._id} video={item} />;
            }
            
            // Live Stream Card
            return (
              <Link 
                key={item._id} 
                to={`/live/${item._id}`}
                className="flex flex-col gap-2 group cursor-pointer"
              >
                <div className="relative w-full aspect-video border-4 border-neoBlack shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group-hover:-translate-y-1 transition-all bg-black flex items-center justify-center overflow-hidden">
                   <div className="text-[#ff0000] font-black text-2xl uppercase tracking-widest animate-pulse z-10">LIVE NOW</div>
                   {/* Background blur for effect */}
                   {item.streamer?.avatar && (
                       <img src={item.streamer.avatar} alt="bg" className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm" />
                   )}
                   <div className="absolute top-2 right-2 bg-[#ff0000] text-white font-black px-2 py-1 border-2 border-black uppercase text-xs z-20">
                     LIVE
                   </div>
                   <div className="absolute bottom-2 right-2 bg-black text-white font-bold px-2 py-1 border-2 border-neoBlack text-xs z-20">
                     {item.viewers || 0} VIEWERS
                   </div>
                </div>
                <div className="flex gap-3 mt-2">
                  <div className="w-10 h-10 rounded-full border-[3px] border-[#ff0000] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-gray-200 shrink-0 overflow-hidden mt-1 animate-pulse">
                    {item.streamer?.avatar && <img src={item.streamer.avatar} alt="Avatar" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h3 className="font-black text-base uppercase leading-tight line-clamp-2 text-black group-hover:text-neoBlue transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-gray-700 font-bold text-sm truncate uppercase mt-1">
                      {item.streamer?.username || "Unknown"}
                    </p>
                    <p className="text-gray-500 font-bold text-xs mt-0.5">
                      Stream started {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="mt-16 border-t-8 border-neoBlack pt-12">
           <h2 className="text-3xl font-black uppercase mb-8 inline-block bg-neoBlue text-white border-4 border-neoBlack px-6 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              Suggested For You
           </h2>
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
             {suggestions.map((video) => (
                <VideoCard key={video._id} video={video} />
             ))}
           </div>
        </div>
      )}
    </div>
  );
};
