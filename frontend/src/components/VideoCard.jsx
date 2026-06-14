import { Link } from "react-router-dom";
import { memo, useState } from "react";
import { MoreVertical, X } from "lucide-react";
import { api } from "../api/axios";
import { useAuth } from "../context/AuthContext";

export const formatDuration = (totalSeconds) => {
  if (!totalSeconds) return "0:00";
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

const optimizeCloudinaryImage = (url) => {
  if (!url?.includes("cloudinary")) return url;

  return url.replace("/upload/", "/upload/f_auto,q_auto,w_480,c_fill/");
};

const BRUTALIST_COLORS = [
  "#ffcc00", // Yellow
  "#00e5ff", // Cyber Cyan
  "#ccff00", // Acid Green
  "#ff0055", // Hot Pink
  "#b000ff", // Neon Purple
  "#ff4400", // Toxic Orange
];

export const VideoCard = memo(({ video, onDelete, onUpdate }) => {
  const { currentUser } = useAuth();
  const duration = video.duration || 0;
  const isOwner = currentUser?._id === (video.owner?._id || video.owner);

  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState(video.title || "");
  const [editDescription, setEditDescription] = useState(
    video.description || "",
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const colorIndex = video._id
    ? video._id.charCodeAt(video._id.length - 1) % BRUTALIST_COLORS.length
    : 0;
  const hoverColor = BRUTALIST_COLORS[colorIndex];

  const handleDelete = async () => {
    setIsDeleting(true);
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

    if (onUpdate)
      onUpdate({ ...video, title: editTitle, description: editDescription });
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
      if (onUpdate) onUpdate(previousVideo);
      alert("Failed to update video. Changes reverted.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    /* 🛠️ Wrapped everything in a React Fragment so we can put the modals outside the transformed card */
    <>
      <div
        style={{ "--hover-bg": hoverColor }}
        className="relative w-full flex flex-col h-full p-0 overflow-visible transition-all duration-200 bg-white border-[4px] border-neoBlack shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:bg-[var(--hover-bg)] hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] group"
      >
        {/* Video Link Area */}
        <Link
          to={`/video/${video._id}`}
          className="relative block overflow-hidden border-b-[4px] border-neoBlack aspect-video bg-black"
        >
          <img
            src={optimizeCloudinaryImage(video.thumbnail)}
            alt={video.title}
            width="480"
            height="270"
            decoding="async"
            loading="lazy"
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110 group-hover:opacity-90"
          />
          <div className="absolute bottom-3 right-3 bg-[#ccff00] text-black px-3 py-1 font-black text-sm border-[3px] border-neoBlack shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] tracking-widest z-10">
            {formatDuration(duration)}
          </div>
        </Link>

        {/* Info Area */}
        <div className="flex flex-1 gap-4 p-5">
          <Link
            to={`/u/${video.owner?.username}`}
            className="flex-shrink-0 transition-all duration-200 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-max"
          >
            <img
              src={
                video.owner?.avatar
                  ? optimizeCloudinaryImage(video.owner.avatar)
                  : "https://ui-avatars.com/api/?name=User"
              }
              alt={video.owner?.username}
              loading="lazy"
              decoding="async"
              className="w-12 h-12 rounded-full border-[3px] border-neoBlack bg-neoWhite object-cover"
            />
          </Link>
          <div className="flex flex-col flex-1">
            <Link to={`/video/${video._id}`} className="block">
              <h3 className="text-xl font-black leading-tight text-black uppercase break-words hover:underline decoration-[4px] underline-offset-4">
                {video.title}
              </h3>
            </Link>
            <Link
              to={`/u/${video.owner?.username}`}
              className="mt-2 text-sm font-black tracking-wide text-gray-700 uppercase"
            >
              {video.owner?.username || "Unknown Channel"}
            </Link>
            <p className="mt-1 text-sm font-bold tracking-wide text-gray-500 uppercase">
              {video.views || 0} views •{" "}
              {new Date(video.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {isOwner && (
          <div className="absolute z-20 top-3 right-3">
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 bg-neoWhite border-[3px] border-neoBlack shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#00e5ff] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
            >
              <MoreVertical size={24} className="stroke-[3]" />
            </button>

            {showMenu && (
              <div className="absolute right-0 flex flex-col z-30 mt-3 bg-neoWhite border-[4px] border-neoBlack shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-36 animate-in fade-in slide-in-from-top-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setShowEditModal(true);
                    setShowMenu(false);
                  }}
                  className="p-3 text-left font-black uppercase transition-colors border-b-[4px] border-neoBlack hover:bg-[#ccff00]"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setShowDeleteModal(true);
                    setShowMenu(false);
                  }}
                  className="p-3 text-left font-black uppercase transition-colors bg-white text-black hover:bg-[#ff0055] hover:text-white"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 🛠️ MODALS ARE NOW OUTSIDE THE TRANSFORMED CARD */}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-80 backdrop-blur-sm">
          <div className="bg-neoWhite border-[6px] border-neoBlack shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] max-w-md w-full p-8 flex flex-col animate-in zoom-in-95">
            <h2 className="pb-2 mb-4 text-4xl font-black uppercase border-b-[4px] border-neoBlack text-[#ff0055]">
              Delete Video?
            </h2>
            <p className="mb-8 text-xl font-bold">
              Are you absolutely sure? This cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 p-4 font-black text-lg uppercase bg-white border-[4px] border-neoBlack shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-[6px] active:translate-x-[6px] active:shadow-none transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 p-4 font-black text-lg uppercase text-white bg-[#ff0055] border-[4px] border-neoBlack shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-[6px] active:translate-x-[6px] active:shadow-none transition-all"
              >
                {isDeleting ? "Erasing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-80 backdrop-blur-sm">
          <div className="bg-neoWhite border-[6px] border-neoBlack shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] max-w-lg w-full p-8 flex flex-col animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 mb-6 border-b-[4px] border-neoBlack">
              <h2 className="text-4xl font-black uppercase">Edit Video</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 transition-all border-[3px] border-transparent hover:rotate-90 hover:bg-[#ff0055] hover:text-white hover:border-black"
              >
                <X size={32} className="stroke-[3]" />
              </button>
            </div>

            <label className="mb-2 text-lg font-black uppercase">Title</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="p-3 mb-6 font-bold bg-white border-[4px] border-neoBlack shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-none focus:translate-x-[4px] focus:translate-y-[4px] transition-all outline-none"
            />

            <label className="mb-2 text-lg font-black uppercase">
              Description
            </label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="h-32 p-3 mb-8 font-bold resize-none bg-white border-[4px] border-neoBlack shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-none focus:translate-x-[4px] focus:translate-y-[4px] transition-all outline-none"
            />

            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="p-4 text-xl font-black uppercase text-black bg-[#00e5ff] border-[4px] border-neoBlack shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-[6px] active:translate-x-[6px] active:shadow-none transition-all"
            >
              {isUpdating ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </>
  );
});

VideoCard.displayName = "VideoCard";
