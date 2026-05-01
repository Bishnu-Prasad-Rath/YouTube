import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import {
  ListVideo,
  Folder,
  ChevronLeft,
  Plus,
  Trash2,
  Pencil,
  X,
  Film,
  Sparkles,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────
const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id);

const floatingAnimation = {
  y: [0, -6, 0],
  transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
};

// ── Skeleton Card ────────────────────────────────────────
const SkeletonCard = ({ i }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: i * 0.1 }}
    className="border-4 border-neoBlack bg-gray-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
  >
    <div className="h-40 bg-gray-200 border-b-4 animate-pulse border-neoBlack" />
    <div className="p-4 space-y-3">
      <div className="w-3/4 h-5 bg-gray-300 animate-pulse" />
      <div className="w-1/2 h-4 bg-gray-200 animate-pulse" />
      <div className="w-24 h-6 bg-gray-300 animate-pulse" />
    </div>
  </motion.div>
);

// ── Toast Component ──────────────────────────────────────
const Toast = ({ toast }) => (
  <AnimatePresence>
    {toast && (
      <motion.div
        initial={{ y: -80, opacity: 0, x: "-50%" }}
        animate={{ y: 0, opacity: 1, x: "-50%" }}
        exit={{ y: -80, opacity: 0, x: "-50%" }}
        className={`fixed top-6 left-1/2 z-[100] px-8 py-4 border-4 border-neoBlack shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${toast.color} font-black uppercase text-lg tracking-wider`}
      >
        {toast.message}
      </motion.div>
    )}
  </AnimatePresence>
);

// ── Create / Edit Modal ──────────────────────────────────
const PlaylistModal = ({ isOpen, onClose, onSubmit, initial, isEdit }) => {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setName(initial?.name || "");
    setDescription(initial?.description || "");
  }, [initial, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || submitting) return;
    setSubmitting(true);
    await onSubmit({ name: name.trim(), description: description.trim() });
    setSubmitting(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center bg-black/40"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 300, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#8fff00] border-4 border-neoBlack shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 sm:p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="flex items-center gap-2 text-2xl font-black tracking-tight uppercase">
                <Sparkles size={24} className="stroke-[3]" />
                {isEdit ? "Edit Playlist" : "New Playlist"}
              </h2>
              <button
                onClick={onClose}
                className="p-2 border-4 border-neoBlack bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-red-400 hover:text-white active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
              >
                <X size={20} className="stroke-[3]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block mb-2 text-sm font-black uppercase">
                  Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Epic Playlist"
                  className="w-full neo-input border-4 border-neoBlack bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-black uppercase">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this playlist about?"
                  rows={3}
                  className="w-full neo-input border-4 border-neoBlack bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] resize-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className={`w-full neo-btn bg-neoBlack text-[#8fff00] uppercase tracking-widest text-lg py-3 ${submitting ? "opacity-50 cursor-not-allowed" : "hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]"}`}
              >
                {submitting
                  ? "Saving..."
                  : isEdit
                    ? "Update Playlist"
                    : "Create Playlist"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ── Expanded Playlist View (Video Management) ────────────
const PlaylistExpanded = ({
  playlist,
  videos,
  onBack,
  onRemoveVideo,
  onEdit,
  onDelete,
  currentUser,
}) => {
  const isOwner = currentUser?._id === playlist?.owner?._id || currentUser?._id === playlist?.owner;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="flex flex-col gap-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-6 border-4 border-neoBlack bg-[#8fff00] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
        <button
          onClick={onBack}
          className="w-max neo-btn flex items-center gap-2 bg-white border-4 border-neoBlack shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-4 py-2 hover:-translate-x-1 transition-transform"
        >
          <ChevronLeft className="stroke-[3]" /> Back
        </button>
        <div className="flex-1">
          <h1 className="mb-2 text-3xl font-black leading-none tracking-tight uppercase">
            {playlist.name}
          </h1>
          <p className="text-lg font-bold text-gray-700">
            {playlist.description || "No description provided."}
          </p>
          <div className="mt-2 font-black text-sm uppercase bg-black text-[#8fff00] px-3 py-1 inline-block">
            {videos.length} Videos
          </div>
        </div>
        {isOwner && (
          <div className="flex gap-3">
            <button
              onClick={onEdit}
              className="flex items-center gap-2 text-sm text-black uppercase neo-btn bg-neoBlue"
            >
              <Pencil size={16} className="stroke-[3]" /> Edit
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-2 text-sm text-white uppercase bg-red-500 neo-btn"
            >
              <Trash2 size={16} className="stroke-[3]" /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Videos */}
      {videos.length === 0 ? (
        <div className="text-center p-12 border-dashed border-4 border-neoBlack bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <Film size={48} className="mx-auto mb-4 stroke-[2] text-gray-400" />
          <p className="text-2xl font-black uppercase">
            This playlist is empty.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {videos.map((video, idx) => (
            <motion.div
              key={video._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 border-4 border-neoBlack bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-3 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all group"
            >
              <Link
                to={`/video/${video._id}`}
                className="flex-shrink-0 block w-full overflow-hidden border-4 sm:w-48 aspect-video border-neoBlack"
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="object-cover w-full h-full transition-transform group-hover:scale-105"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/video/${video._id}`}>
                  <h3 className="text-lg font-black leading-tight uppercase line-clamp-2 hover:underline decoration-4 underline-offset-2">
                    {video.title}
                  </h3>
                </Link>
                <p className="mt-1 text-sm font-bold text-gray-500">
                  {video.views || 0} views •{" "}
                  {new Date(video.createdAt).toLocaleDateString()}
                </p>
              </div>
              {isOwner && (
                <button
                  onClick={() => onRemoveVideo(video._id)}
                  className="neo-btn bg-red-100 text-red-600 border-4 border-neoBlack shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2 uppercase text-xs self-start sm:self-center"
                >
                  <X size={14} className="stroke-[3]" /> Remove
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// ══════════════════════════════════════════════════════════
// ██ MAIN: PlaylistManager ██
// ══════════════════════════════════════════════════════════
export const PlaylistManager = ({ userId }) => {
  const { currentUser } = useAuth();
  const targetUserId = userId || currentUser?._id;

  const [playlists, setPlaylists] = useState([]);
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [playlistVideos, setPlaylistVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  // Toast state
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, color = "bg-[#8fff00]") => {
    setToast({ message, color });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Fetch all playlists ─────────────────────────────────
  const fetchPlaylists = useCallback(async () => {
    if (!targetUserId || !isValidObjectId(targetUserId)) return;
    try {
      setLoading(true);
      const { data } = await api.get(`/playlist/user/${targetUserId}`);
      setPlaylists(data.data || []);
    } catch (err) {
      console.error("Failed to fetch playlists", err);
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    if (!activePlaylist) fetchPlaylists();
  }, [fetchPlaylists, activePlaylist]);

  // ── Open a playlist (expanded view) ─────────────────────
  const handlePlaylistClick = async (playlistId) => {
    if (!isValidObjectId(playlistId)) return;
    try {
      const { data } = await api.get(`/playlist/${playlistId}`);
      setActivePlaylist(data.data);
      setPlaylistVideos(data.data.videos || []);
    } catch (err) {
      console.error("Failed to fetch playlist details", err);
    }
  };

  // ── Create playlist ─────────────────────────────────────
  const handleCreate = async ({ name, description }) => {
    try {
      const { data } = await api.post("/playlist", { name, description });
      showToast(data.message || "Playlist created! ✨", "bg-[#8fff00]");
      setModalOpen(false);
      fetchPlaylists();
    } catch (err) {
      console.error("Create failed", err);
    }
  };

  // ── Update playlist ─────────────────────────────────────
  const handleUpdate = async ({ name, description }) => {
    if (!editTarget || !isValidObjectId(editTarget._id)) return;
    try {
      const { data } = await api.patch(`/playlist/${editTarget._id}`, {
        name,
        description,
      });
      showToast(data.message || "Playlist updated! 🔥", "bg-neoBlue");
      setEditTarget(null);
      // Refresh the expanded view if we're inside it
      if (activePlaylist?._id === editTarget._id) {
        setActivePlaylist((prev) => ({ ...prev, name, description }));
      }
      fetchPlaylists();
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  // ── Delete playlist ─────────────────────────────────────
  const handleDelete = async (playlistId) => {
    if (!isValidObjectId(playlistId)) return;
    if (!window.confirm("Delete this playlist permanently?")) return;
    try {
      const { data } = await api.delete(`/playlist/${playlistId}`);
      showToast(data.message || "Playlist deleted 🗑️", "bg-red-400");
      setActivePlaylist(null);
      fetchPlaylists();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  // ── Remove video from playlist ──────────────────────────
  const handleRemoveVideo = async (videoId) => {
    if (
      !activePlaylist ||
      !isValidObjectId(videoId) ||
      !isValidObjectId(activePlaylist._id)
    )
      return;
    try {
      const { data } = await api.patch(
        `/playlist/remove/${videoId}/${activePlaylist._id}`
      );
      showToast(data.message || "Video removed ✂️", "bg-neoYellow");
      setPlaylistVideos((prev) => prev.filter((v) => v._id !== videoId));
    } catch (err) {
      console.error("Remove video failed", err);
    }
  };

  // ── Loading state ───────────────────────────────────────
  if (loading && !activePlaylist) {
    return (
      <div className="flex flex-col max-w-[1600px] mx-auto w-full pt-4 px-4">
        <div className="flex items-center gap-3 mb-6">
          <ListVideo size={36} className="stroke-[3]" />
          <h2 className="text-3xl font-black uppercase">Playlists</h2>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} i={i} />
          ))}
        </div>
      </div>
    );
  }

  const isOwner = currentUser?._id === targetUserId;

  return (
    <div className="flex flex-col max-w-[1600px] mx-auto w-full pt-4 px-4 pb-12">
      <Toast toast={toast} />

      {/* ── Modals ── */}
      <PlaylistModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
        initial={null}
        isEdit={false}
      />
      <PlaylistModal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={handleUpdate}
        initial={editTarget}
        isEdit={true}
      />

      <AnimatePresence mode="wait">
        {activePlaylist ? (
          <PlaylistExpanded
            key="expanded"
            playlist={activePlaylist}
            videos={playlistVideos}
            onBack={() => setActivePlaylist(null)}
            onRemoveVideo={handleRemoveVideo}
            onEdit={() => setEditTarget(activePlaylist)}
            onDelete={() => handleDelete(activePlaylist._id)}
            currentUser={currentUser}
          />
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-6"
          >
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-3">
                <ListVideo size={36} className="stroke-[3]" />
                <h2 className="text-3xl font-black uppercase">Playlists</h2>
              </div>
              {isOwner && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setModalOpen(true)}
                  className="neo-btn bg-[#8fff00] flex items-center gap-2 uppercase tracking-widest text-sm"
                >
                  <Plus size={20} className="stroke-[3]" /> New Playlist
                </motion.button>
              )}
            </div>

            {/* Empty state */}
            {playlists.length === 0 ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center p-16 border-dashed border-4 border-neoBlack bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
              >
                <Folder
                  size={64}
                  className="mx-auto mb-4 stroke-[2] text-gray-300"
                />
                <p className="mb-2 text-3xl font-black uppercase">
                  No Playlists Found
                </p>
                <p className="font-bold text-gray-500">
                  Create your first playlist to get started.
                </p>
              </motion.div>
            ) : (
              /* Playlist Grid */
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {playlists.map((playlist, idx) => (
                  <motion.div
                    key={playlist._id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{
                      opacity: 1,
                      ...floatingAnimation,
                      y: floatingAnimation.y,
                    }}
                    transition={{
                      opacity: { delay: idx * 0.08 },
                      y: {
                        ...floatingAnimation.transition,
                        delay: idx * 0.3,
                      },
                    }}
                    whileHover={{
                      y: -8,
                      transition: { duration: 0.2 },
                    }}
                    onClick={() => handlePlaylistClick(playlist._id)}
                    className="bg-white border-4 border-neoBlack shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] cursor-pointer overflow-hidden flex flex-col group hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                  >
                    {/* Card Top: Folder Visual */}
                    <div className="h-40 bg-gradient-to-br from-[#8fff00] to-[#00E1FF] border-b-4 border-neoBlack flex items-center justify-center relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1/3 h-6 bg-neoBlack" />
                      <Folder
                        size={64}
                        className="text-black stroke-[2] group-hover:scale-110 transition-transform"
                      />
                    </div>

                    {/* Card Body */}
                    <div className="flex flex-col justify-between flex-1 p-4 bg-white">
                      <h3 className="font-black text-xl uppercase leading-tight line-clamp-2 mb-2 group-hover:text-[#00b300] transition-colors">
                        {playlist.name}
                      </h3>
                      {playlist.description && (
                        <p className="mb-3 text-sm font-bold text-gray-500 line-clamp-2">
                          {playlist.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-2 mt-auto">
                        <span className="font-black text-sm uppercase bg-[#8fff00] border-2 border-black px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          {playlist.videos?.length || 0} Videos
                        </span>
                        {isOwner && (
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditTarget(playlist);
                              }}
                              className="p-1.5 border-2 border-neoBlack bg-neoBlue shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-400 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                            >
                              <Pencil size={14} className="stroke-[3]" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(playlist._id);
                              }}
                              className="p-1.5 border-2 border-neoBlack bg-red-400 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-red-600 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                            >
                              <Trash2 size={14} className="stroke-[3]" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
