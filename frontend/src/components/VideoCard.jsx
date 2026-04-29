import { Link } from "react-router-dom";
import { memo, useState } from "react";
import { MoreVertical, X } from "lucide-react";
import { api } from "../api/axios";
import { useAuth } from "../context/AuthContext";

export const formatDuration = (totalSeconds) => {
  if (!totalSeconds) return "0:00";
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const VideoCard = memo(({ video, onDelete, onUpdate }) => {
  const { currentUser } = useAuth();
  const duration = video.duration || 0;
  const isOwner = currentUser?._id === (video.owner?._id || video.owner);

  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState(video.title || "");
  const [editDescription, setEditDescription] = useState(video.description || "");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    // Optimistic UI - assuming parent handles state revert or refresh
    if (onDelete) onDelete(video._id);
    setShowDeleteModal(false);
    setShowMenu(false);
    try {
      await api.delete(`/videos/${video._id}`);
      if (!onDelete) window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to delete video. Please refresh.");
      setIsDeleting(false);
    }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    const previousVideo = { ...video };
    
    // Optimistic Update
    if (onUpdate) onUpdate({ ...video, title: editTitle, description: editDescription });
    setShowEditModal(false);
    setShowMenu(false);

    try {
      const formData = new FormData();
      formData.append("title", editTitle);
      formData.append("description", editDescription);
      
      const { data } = await api.patch(`/videos/${video._id}`, formData);
      if (onUpdate) onUpdate(data.data);
    } catch (err) {
      console.error(err);
      if (onUpdate) onUpdate(previousVideo); // Revert
      alert("Failed to update video. Changes reverted.");
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <div className="neo-card p-0 overflow-visible flex flex-col h-full bg-neoWhite hover:bg-neoYellow duration-300 group relative">
      {/* Video Link Area */}
      <Link to={`/video/${video._id}`} className="relative border-b-4 border-neoBlack aspect-video block overflow-hidden">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute bottom-2 right-2 bg-neoBlack text-white px-2 py-1 font-bold text-sm border-2 border-neoBlack shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] tracking-widest">
          {formatDuration(duration)}
        </div>
      </Link>
      
      {/* Info Area */}
      <div className="p-4 flex gap-3 flex-1">
        <Link 
          to={`/u/${video.owner?.username}`} 
          className="flex-shrink-0 hover:scale-105 transition-transform"
        >
          <img
            src={video.owner?.avatar || "https://ui-avatars.com/api/?name=User"}
            alt={video.owner?.username}
            className="w-10 h-10 rounded-full border-[3px] border-neoBlack bg-neoWhite object-cover"
          />
        </Link>
        <div className="flex flex-col flex-1 overflow-hidden">
          <Link to={`/video/${video._id}`} className="block">
            <h3 className="font-black text-lg line-clamp-2 leading-tight uppercase hover:underline decoration-4 underline-offset-2 break-words overflow-hidden">
              {video.title}
            </h3>
          </Link>
          <Link to={`/u/${video.owner?.username}`} className="font-bold text-gray-700 mt-2 text-sm hover:underline">
            {video.owner?.username || "Unknown Channel"}
          </Link>
          <p className="text-xs font-bold text-gray-500 mt-1">
            {video.views || 0} views • {new Date(video.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {isOwner && (
        <div className="absolute top-2 right-2 z-20">
          <button 
            onClick={(e) => { e.preventDefault(); setShowMenu(!showMenu); }}
            className="p-1 bg-neoWhite border-2 border-neoBlack shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neoYellow"
          >
            <MoreVertical size={20} className="stroke-[3]" />
          </button>
          
          {showMenu && (
            <div className="absolute top-full right-0 mt-2 bg-neoWhite border-4 border-neoBlack shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col w-32 z-30">
               <button 
                 onClick={(e) => { e.preventDefault(); setShowEditModal(true); setShowMenu(false); }}
                 className="p-2 font-bold uppercase text-left hover:bg-neoCyan border-b-2 border-neoBlack"
               >
                 Edit
               </button>
               <button 
                 onClick={(e) => { e.preventDefault(); setShowDeleteModal(true); setShowMenu(false); }}
                 className="p-2 font-bold uppercase text-left hover:bg-neoRed hover:text-white"
               >
                 Delete
               </button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-neoWhite border-4 border-neoBlack shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] max-w-md w-full p-8 animate-in zoom-in-95">
             <h2 className="text-3xl font-black uppercase text-neoRed mb-4 border-b-4 border-neoBlack pb-2">Delete Video?</h2>
             <p className="font-bold text-xl mb-8">Are you absolutely sure? This cannot be undone.</p>
             <div className="flex gap-4">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 p-4 font-black uppercase border-4 border-neoBlack hover:bg-gray-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 p-4 font-black uppercase border-4 border-neoBlack bg-neoRed text-white hover:bg-red-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all"
                >
                  {isDeleting ? 'Erasing...' : 'Confirm'}
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-neoWhite border-4 border-neoBlack shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] max-w-lg w-full p-8 animate-in zoom-in-95 flex flex-col">
             <div className="flex justify-between items-center mb-6 border-b-4 border-neoBlack pb-4">
               <h2 className="text-3xl font-black uppercase">Edit Video</h2>
               <button onClick={() => setShowEditModal(false)} className="hover:rotate-90 transition-transform">
                  <X size={32} className="stroke-[3]" />
               </button>
             </div>
             
             <label className="font-black uppercase mb-2">Title</label>
             <input 
               type="text" 
               value={editTitle} 
               onChange={e => setEditTitle(e.target.value)}
               className="neo-input border-4 border-neoBlack p-3 mb-6 font-bold"
             />
             
             <label className="font-black uppercase mb-2">Description</label>
             <textarea 
               value={editDescription} 
               onChange={e => setEditDescription(e.target.value)}
               className="neo-input border-4 border-neoBlack p-3 mb-8 font-bold h-32 resize-none"
             />
             
             <button 
               onClick={handleUpdate}
               disabled={isUpdating}
               className="p-4 font-black uppercase border-4 border-neoBlack bg-[#22d3ee] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all"
             >
               {isUpdating ? 'Saving...' : 'Save Changes'}
             </button>
          </div>
        </div>
      )}
    </div>
  );
});

VideoCard.displayName = "VideoCard";
