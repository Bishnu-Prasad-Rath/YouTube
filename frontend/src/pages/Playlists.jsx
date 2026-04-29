import { useState, useEffect } from "react";
import { api } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { VideoCard } from "../components/VideoCard";
import { ListVideo, Folder, ChevronLeft } from "lucide-react";

export const Playlists = ({ userId }) => {
  const { currentUser } = useAuth();
  const targetUserId = userId || currentUser?._id;
  
  const [playlists, setPlaylists] = useState([]);
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [playlistVideos, setPlaylistVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all playlists
  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!targetUserId) return;
      try {
        const { data } = await api.get(`/playlist/user/${targetUserId}`);
        setPlaylists(data.data || []);
      } catch (error) {
        console.error("Failed to fetch playlists", error);
      } finally {
        setLoading(false);
      }
    };
    if (!activePlaylist) {
       fetchPlaylists();
    }
  }, [targetUserId, activePlaylist]);

  // Fetch specific playlist videos when a folder is clicked
  const handlePlaylistClick = async (playlistId) => {
    try {
      const { data } = await api.get(`/playlist/${playlistId}`);
      setActivePlaylist(data.data);
      setPlaylistVideos(data.data.videos || []);
    } catch (error) {
      console.error("Failed to fetch playlist details", error);
    }
  };

  if (loading) return <div className="text-center font-black text-2xl uppercase animate-pulse mt-8">Loading Playlists...</div>;

  return (
    <div className="flex flex-col max-w-[1600px] mx-auto w-full pt-4">
      {/* Sub-view: Active Playlist */}
      {activePlaylist ? (
        <div className="flex flex-col gap-8">
           <div className="flex flex-col md:flex-row md:items-center gap-6 border-4 border-neoBlack bg-neoYellow shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
              <button 
                 onClick={() => setActivePlaylist(null)}
                 className="w-max neo-btn flex items-center gap-2 bg-neoWhite border-4 border-neoBlack shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-4 py-2 hover:-translate-x-1 transition-transform"
              >
                 <ChevronLeft className="stroke-[3]" /> Back
              </button>
              <div>
                 <h1 className="text-3xl font-black uppercase tracking-tight leading-none mb-2">
                   {activePlaylist.name}
                 </h1>
                 <p className="font-bold text-gray-700 text-lg">
                   {activePlaylist.description || "No description provided."}
                 </p>
                 <div className="mt-2 font-black text-sm uppercase bg-black text-white px-3 py-1 inline-block">
                    {playlistVideos.length} Videos
                 </div>
              </div>
           </div>

           {playlistVideos.length === 0 ? (
             <div className="text-center p-12 neo-card border-dashed border-4 border-neoBlack bg-neoWhite mt-8">
               <p className="font-black uppercase text-2xl">This playlist is empty.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
               {playlistVideos.map(video => (
                 <VideoCard key={video._id} video={video} />
               ))}
             </div>
           )}
        </div>
      ) : (
        /* Main View: Folders Grid */
        <div className="flex flex-col gap-6">
           <div className="flex items-center gap-3 mb-4">
             <ListVideo size={36} className="stroke-[3]" />
             <h2 className="text-3xl font-black uppercase">Playlists</h2>
           </div>
           
           {playlists.length === 0 ? (
             <div className="text-center p-12 neo-card border-dashed border-4 border-neoBlack bg-neoWhite">
               <p className="font-black uppercase text-2xl">No playlists created.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
               {playlists.map((playlist) => (
                 <div 
                   key={playlist._id} 
                   onClick={() => handlePlaylistClick(playlist._id)}
                   className="neo-card bg-neoWhite border-4 border-neoBlack shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-0 cursor-pointer hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all group overflow-hidden flex flex-col"
                 >
                   <div className="h-40 bg-neoBlue border-b-4 border-neoBlack flex items-center justify-center relative overflow-hidden group-hover:bg-[#407BFF] transition-colors">
                      {/* Decorative Folder Tab */}
                      <div className="absolute top-0 left-0 w-1/3 h-6 bg-neoBlack"></div>
                      <Folder size={64} className="text-white stroke-[2]" />
                   </div>
                   <div className="p-4 bg-neoWhite flex flex-col justify-between flex-1">
                      <div>
                        <h3 className="font-black text-xl uppercase leading-tight line-clamp-2 mb-2 group-hover:text-neoBlue transition-colors">{playlist.name}</h3>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span className="font-black text-sm uppercase bg-neoYellow border-2 border-black px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                           {playlist.videos?.length || 0} Videos
                        </span>
                      </div>
                   </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      )}
    </div>
  );
};
