import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/axios";
import { useAuth } from "../context/AuthContext";

export const LiveHub = () => {
  const [activeStreams, setActiveStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchActiveStreams = async () => {
      try {
        const res = await api.get("/live/active");
        const allStreams = res.data.data || [];
        console.log('Fetched Streams:', allStreams);
        const filtered = currentUser ? allStreams.filter(s => s.streamer._id !== currentUser._id) : allStreams;
        setActiveStreams(filtered);
      } catch (err) {
        console.error("Failed to fetch live streams", err);
      } finally {
        setLoading(false);
      }
    };
    fetchActiveStreams();
    
    const interval = setInterval(fetchActiveStreams, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);

  return (
    <div className="max-w-[1600px] mx-auto px-6 pb-12 pt-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-5xl font-black uppercase inline-block bg-neoYellow border-4 border-black px-4 py-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            Live Hub
          </h1>
          <p className="font-bold text-xl mt-4">Discover ongoing transmissions globally.</p>
        </div>
        
        {currentUser && (
<Link 
  to="/live/start" 
  className="neo-btn bg-neoPink text-black font-black text-2xl uppercase border-4 border-neoBlack shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-[#ff458f] hover:text-white transition-all py-4 px-8 active:translate-y-2 active:translate-x-2 active:shadow-none inline-block z-10"
>
  GO TO STUDIO
</Link>
        )}
      </div>

      {loading ? (
        <h2 className="text-3xl font-black uppercase text-center mt-12 bg-neoWhite border-4 border-neoBlack p-8 max-w-xl mx-auto shadow-neo animate-pulse">
          Scanning frequencies...
        </h2>
      ) : activeStreams.length === 0 ? (
        <div className="text-center mt-12 font-black text-2xl uppercase p-12 neo-card bg-neoYellow border-4 border-neoBlack max-w-2xl mx-auto border-dashed shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
          No active streams right now. Be the first to go live!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {activeStreams.map((stream) => (
            <Link key={stream._id} to={`/live/${stream._id}`} className="group block">
              <div className="relative border-4 border-neoBlack shadow-[8px_8px_0px_0px_#FF00FF] bg-neoWhite overflow-hidden transition-all group-hover:shadow-[12px_12px_0px_0px_#FF00FF] group-hover:-translate-y-1">
                
                {/* Thumbnail Area */}
                <div className="aspect-video bg-zinc-900 border-b-4 border-neoBlack flex items-center justify-center relative">
                   {/* Live Badge */}
                   <div className="absolute top-3 left-3 bg-neoRed text-white font-black uppercase text-xs px-3 py-1 border-2 border-neoBlack flex items-center gap-2 z-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                     <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></span>
                     LIVE
                   </div>

                   {/* Viewer Count Badge */}
                   <div className="absolute top-3 right-3 bg-black/70 text-white font-bold text-xs px-2 py-1 border border-neoBlack z-10">
                     👥 {stream.viewers || 0}
                   </div>
                   
                   <h3 className="text-neoWhite opacity-30 font-black tracking-widest uppercase">STREAM</h3>
                </div>

                {/* Details Area */}
                <div className="p-4 flex gap-3">
                  <img
                    src={stream.streamer?.avatar || "https://ui-avatars.com/api/?name=U"}
                    alt="Current Streamer"
                    className="w-12 h-12 rounded-full border-[3px] border-neoBlack object-cover shrink-0"
                  />
                  <div className="flex flex-col overflow-hidden">
                    <h3 className="font-black text-lg truncate leading-tight uppercase relative inline-block group-hover:text-neoPink transition-colors">{stream.title}</h3>
                    <p className="font-bold text-gray-700 text-sm">{stream.streamer?.username || "Unknown"}</p>
                  </div>
                </div>

              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
