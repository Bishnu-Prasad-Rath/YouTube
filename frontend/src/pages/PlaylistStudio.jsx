import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  ListVideo, Folder, Plus, Trash2, Pencil, X, Film,
  Sparkles, PackagePlus, Eye, Settings,
} from "lucide-react";

const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id);

// 🎨 1. Define our specific signature colors
const BRUTALIST_COLORS = [
  "#ffcc00", // Yellow
  "#00e5ff", // Cyber Cyan
  "#ccff00", // Acid Green
  "#ff0055", // Hot Pink
  "#b000ff", // Neon Purple
  "#ff4400"  // Toxic Orange
];

/* ── Toast ──────────────────────────────────────────────── */
const Toast = ({ toast }) => (
  <AnimatePresence>
    {toast && (
      <motion.div
        initial={{ y: -80, opacity: 0, x: "-50%" }}
        animate={{ y: 0, opacity: 1, x: "-50%" }}
        exit={{ y: -80, opacity: 0, x: "-50%" }}
        className={`fixed top-6 left-1/2 z-[100] px-6 py-3 border-[3px] border-neoBlack shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${toast.color} font-black uppercase text-sm tracking-wider`}
      >
        {toast.message}
      </motion.div>
    )}
  </AnimatePresence>
);

/* ── Skeleton (matches card shape exactly) ──────────────── */
const Skel = ({ i }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ delay: i * 0.1 }}
    className="border-[4px] border-neoBlack bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col"
  >
    <div className="relative overflow-hidden bg-gray-200 border-b-[4px] aspect-video border-neoBlack">
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300/60 to-transparent"
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
    <div className="p-4 space-y-3">
      <div className="w-3/4 h-5 bg-gray-200 rounded-sm" />
      <div className="w-full h-3 bg-gray-100 rounded-sm" />
      <div className="flex items-center justify-between pt-1">
        <div className="w-16 h-6 bg-gray-200 rounded-sm" />
        <div className="flex gap-1.5">
          <div className="bg-gray-200 border-2 border-gray-300 h-7 w-7" />
          <div className="bg-gray-200 border-2 border-gray-300 h-7 w-7" />
          <div className="bg-gray-200 border-2 border-gray-300 h-7 w-7" />
        </div>
      </div>
    </div>
  </motion.div>
);

/* ── Create / Edit Modal ────────────────────────────────── */
const PlaylistModal = ({ isOpen, onClose, onSubmit, initial, isEdit }) => {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(initial?.name || "");
    setDesc(initial?.description || "");
  }, [initial, isOpen]);

  const go = async (e) => {
    e.preventDefault();
    if (!name.trim() || !desc.trim() || busy) return;
    setBusy(true);
    await onSubmit({ name: name.trim(), description: desc.trim() });
    setBusy(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-end justify-center p-4 sm:items-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
          <motion.div initial={{ y: 300, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 300, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#8fff00] border-[5px] border-neoBlack shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="flex items-center gap-2 text-2xl font-black uppercase">
                <Sparkles size={24} className="stroke-[3]" />
                {isEdit ? "Edit Playlist" : "New Playlist"}
              </h2>
              <button onClick={onClose}
                className="p-1 border-[3px] border-transparent hover:border-black hover:bg-red-500 hover:text-white hover:rotate-90 transition-all">
                <X size={24} className="stroke-[3]" />
              </button>
            </div>
            <form onSubmit={go} className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-black uppercase">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Epic Playlist"
                  className="w-full p-2.5 font-bold bg-white border-[3px] border-neoBlack shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:shadow-none focus:translate-x-[3px] focus:translate-y-[3px] transition-all outline-none" required />
              </div>
              <div>
                <label className="block mb-1 text-sm font-black uppercase">Description</label>
                <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What's this playlist about?" rows={3}
                  className="w-full h-24 p-2.5 font-bold resize-none bg-white border-[3px] border-neoBlack shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:shadow-none focus:translate-x-[3px] focus:translate-y-[3px] transition-all outline-none" required />
              </div>
              <button type="submit" disabled={busy}
                className={`w-full bg-neoBlack text-[#8fff00] font-black uppercase tracking-widest text-lg py-3 border-[3px] border-neoBlack shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${busy ? "opacity-50 cursor-not-allowed" : "hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all"}`}>
                {busy ? "Saving..." : isEdit ? "Update Playlist" : "Create Playlist"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ── Delete Confirmation Modal ──────────────────────────── */
const DeleteConfirmModal = ({ isOpen, playlistName, onConfirm, onCancel, busy }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 18, stiffness: 280 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-neoWhite border-[5px] border-neoBlack shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col"
        >
          <h2 className="pb-2 mb-3 text-2xl font-black uppercase border-b-[3px] border-neoBlack text-[#ff0055]">Delete Playlist?</h2>
          <p className="mb-6 text-sm font-bold">Destroy &quot;{playlistName}&quot; permanently? This cannot be undone.</p>
          <div className="flex gap-3">
            <button 
              onClick={onCancel}
              className="flex-1 p-3 font-black text-sm uppercase bg-white border-[3px] border-neoBlack shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 active:translate-y-[3px] active:translate-x-[3px] active:shadow-none transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm}
              disabled={busy}
              className="flex-1 p-3 font-black text-sm uppercase text-white bg-[#ff0055] border-[3px] border-neoBlack shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 active:translate-y-[3px] active:translate-x-[3px] active:shadow-none transition-all"
            >
              {busy ? "Deleting..." : "Confirm"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

/* ── Quick-Add Search Bar ───────────────────────────────── */
const QuickAdd = ({ playlistId, existingIds, onAdded }) => {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef(null);

  const doSearch = useCallback(async (term) => {
    if (!term.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const { data } = await api.get("/dashboard/videos");
      const all = data.data || [];
      const filtered = all.filter(
        (v) => v.title.toLowerCase().includes(term.toLowerCase()) && !existingIds.includes(v._id)
      );
      setResults(filtered.slice(0, 5));
    } catch { setResults([]); }
    finally { setSearching(false); }
  }, [existingIds]);

  const onChange = (e) => {
    setQ(e.target.value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => doSearch(e.target.value), 400);
  };

  const addVideo = async (videoId) => {
    if (!isValidObjectId(videoId) || !isValidObjectId(playlistId)) return;
    try {
      await api.patch(`/playlist/add/${videoId}/${playlistId}`);
      setResults((p) => p.filter((v) => v._id !== videoId));
      onAdded(videoId);
    } catch (err) { console.error("Add failed", err); }
  };

  return (
    <div className="pt-4 mt-4 border-t-4 border-neoBlack">
      <div className="flex items-center gap-2 mb-2">
        <PackagePlus size={16} className="stroke-[3]" />
        <span className="text-sm font-black uppercase">Quick Add</span>
      </div>
      <div className="flex gap-2">
        <input value={q} onChange={onChange} placeholder="Search your videos..."
          className="flex-1 p-2 text-sm font-bold bg-white border-2 border-neoBlack shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] outline-none" />
        {searching && <div className="self-center text-xs font-black animate-pulse">...</div>}
      </div>
      <AnimatePresence>
        {results.map((v) => (
          <motion.div key={v._id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 mt-2 p-2 bg-white border-2 border-neoBlack shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <img src={v.thumbnail} alt="" className="object-cover w-12 h-8 border border-neoBlack" />
            <span className="flex-1 text-xs font-bold line-clamp-1">{v.title}</span>
            <button onClick={() => addVideo(v._id)}
              className="p-1 bg-[#8fff00] border-2 border-neoBlack shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-green-400 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
              <Plus size={14} className="stroke-[3]" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

/* ── Video Manager Side Panel ───────────────────────────── */
const VideoManager = ({ playlist, onClose, showToast }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPlaylist = useCallback(async () => {
    if (!playlist?._id || !isValidObjectId(playlist._id)) return;
    try {
      const { data } = await api.get(`/playlist/${playlist._id}`);
      setVideos(data.data.videos || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [playlist?._id]);

  useEffect(() => { fetchPlaylist(); }, [fetchPlaylist]);

  const removeVideo = async (videoId) => {
    if (!isValidObjectId(videoId) || !isValidObjectId(playlist._id)) return;
    const prev = [...videos];
    setVideos((p) => p.filter((v) => v._id !== videoId));
    try {
      const { data } = await api.patch(`/playlist/remove/${videoId}/${playlist._id}`);
      showToast(data.message || "Video removed ✂️", "bg-neoYellow");
    } catch (err) {
      console.error(err);
      setVideos(prev); 
    }
  };

  const handleAdded = () => { fetchPlaylist(); showToast("Video added! 🎬", "bg-[#8fff00]"); };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ x: 500 }} animate={{ x: 0 }} exit={{ x: 500 }}
        transition={{ type: "spring", damping: 26, stiffness: 220 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm h-full bg-white border-l-[4px] border-neoBlack shadow-[-8px_0px_0px_0px_rgba(0,0,0,1)] overflow-y-auto flex flex-col">

        <div className="p-4 bg-[#8fff00] border-b-[4px] border-neoBlack sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black tracking-tight uppercase">Manage Videos</h3>
            <button onClick={onClose}
              className="p-1 border-[2px] border-transparent hover:border-black hover:bg-[#ff0055] hover:text-white hover:rotate-90 transition-all">
              <X size={20} className="stroke-[3]" />
            </button>
          </div>
          <p className="mt-1 text-sm font-bold text-black opacity-80 line-clamp-1">{playlist.name}</p>
        </div>

        <div className="flex-1 p-4">
          {loading ? (
            <div className="space-y-3">{[0,1,2].map(i => <div key={i} className="bg-gray-200 border-2 h-14 animate-pulse border-neoBlack" />)}</div>
          ) : videos.length === 0 ? (
            <motion.div initial={{ rotate: 0 }} animate={{ rotate: [-2, 2, -2] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-center p-6 border-dashed border-[3px] border-neoBlack bg-[#8fff00]/20 mt-4">
              <Film size={36} className="mx-auto mb-3 stroke-[2] text-gray-400" />
              <p className="font-black uppercase text-lg rotate-[-3deg]">
                EMPTY PLAYLIST
              </p>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {videos.map((video) => (
                  <motion.div key={video._id}
                    layout
                    initial={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 300, transition: { duration: 0.35 } }}
                    className="flex items-center gap-3 p-2 bg-white border-[3px] border-neoBlack shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group">
                    <Link to={`/video/${video._id}`} className="flex-shrink-0 block w-20 overflow-hidden border-[2px] h-12 border-neoBlack">
                      <img src={video.thumbnail} alt={video.title} className="object-cover w-full h-full transition-transform group-hover:scale-110" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black leading-tight uppercase line-clamp-2">{video.title}</p>
                      <p className="mt-1 text-xs font-bold text-gray-500">{video.views || 0} views</p>
                    </div>
                    <button onClick={() => removeVideo(video._id)}
                      className="p-1.5 border-[2px] border-neoBlack bg-[#ff0055] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-red-700 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex-shrink-0">
                      <Trash2 size={14} className="stroke-[3]" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
          <QuickAdd playlistId={playlist._id} existingIds={videos.map(v => v._id)} onAdded={handleAdded} />
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ── Playlist Card (Static Unique Hover Color & Sleek Sizing) ── */
const PlaylistCard = ({ playlist, idx, isOwner, onEdit, onDelete, onManage, onClick }) => {
  const hasVideos = playlist.videos?.length > 0;
  const thumbUrl = playlist.videos?.[0]?.thumbnail;
  const videoCount = playlist.videos?.length || 0;

  const colorIndex = playlist._id 
    ? playlist._id.charCodeAt(playlist._id.length - 1) % BRUTALIST_COLORS.length 
    : 0;
  const hoverColor = BRUTALIST_COLORS[colorIndex];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: [0, -5, 0] }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.25 } }}
      transition={{
        opacity: { delay: idx * 0.08 },
        y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: idx * 0.3 },
      }}
      onClick={onClick}
      style={{ "--hover-bg": hoverColor }}
      className="w-full bg-white border-[4px] border-neoBlack shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] cursor-pointer flex flex-col group hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:bg-[var(--hover-bg)] transition-all duration-200"
    >
      <div className="relative w-full overflow-hidden border-b-[4px] aspect-video border-neoBlack bg-black">
        {hasVideos && thumbUrl ? (
          <>
            <img
              src={thumbUrl}
              alt={playlist.name}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110 group-hover:opacity-90"
            />
            <div className="absolute bottom-2 right-2 bg-[#ccff00] text-black px-2 py-1 border-[2px] border-neoBlack shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black text-xs uppercase tracking-widest z-10">
              {videoCount} {videoCount === 1 ? "VIDEO" : "VIDEOS"}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full gap-1 border-4 border-gray-600 bg-gradient-to-br from-gray-900 to-gray-700">
            <Film size={28} className="text-gray-500 stroke-[2]" />
            <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Empty Nebula</span>
          </div>
        )}
      </div>

      <div className="flex flex-col justify-between flex-1 p-4">
        <div>
          <h3 className="mb-1 text-lg font-black leading-tight text-black uppercase break-words hover:underline decoration-[3px] underline-offset-2">
            {playlist.name}
          </h3>
          {playlist.description && (
            <p className="mb-3 text-xs font-bold tracking-wide text-gray-800 uppercase">
              {playlist.description}
            </p>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-2 mt-auto">
          <span className="font-black text-xs uppercase bg-[#8fff00] border-[2px] border-black px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {videoCount} Videos
          </span>
          {isOwner && (
            <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button onClick={onManage} title="Manage Videos"
                className="p-1.5 border-[2px] border-neoBlack bg-[#8fff00] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-green-400 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">
                <Settings size={16} className="stroke-[3]" />
              </button>
              <button onClick={onEdit} title="Edit"
                className="p-1.5 border-[2px] border-neoBlack bg-neoBlue shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-400 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">
                <Pencil size={16} className="stroke-[3]" />
              </button>
              <button onClick={onDelete} title="Delete"
                className="p-1.5 border-[2px] border-neoBlack bg-[#ff0055] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-red-700 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">
                <Trash2 size={16} className="stroke-[3]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════════════ */
/* ██ MAIN: PlaylistStudio ██                               */
/* ══════════════════════════════════════════════════════════ */
export const PlaylistStudio = ({ userId }) => {
  const { currentUser } = useAuth();
  const targetUserId = userId || currentUser?._id;

  const [tab, setTab] = useState("studio"); 
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal / panel state
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [manageTarget, setManageTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, color = "bg-[#8fff00]") => {
    setToast({ message, color });
    setTimeout(() => setToast(null), 3000);
  }, []);
  const navigate = useNavigate();

  // ── Fetch ────────────────────────────────────────────────
  // ── Fetch ────────────────────────────────────────────────
  const fetchPlaylists = useCallback(async (currentTab, uid) => {
    setLoading(true);
    try {
      // If Discovery is clicked, hit our new global route!
      const endpoint = currentTab === "discovery" 
        ? "/playlist/all" 
        : `/playlist/user/${uid}`;

      const { data } = await api.get(endpoint);
      setPlaylists(data.data || []);
    } catch (err) { 
      console.error("Fetch playlists failed", err); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => {
    // We pass the active tab and the target user ID to the fetch function
    fetchPlaylists(tab, targetUserId);
  }, [tab, targetUserId, fetchPlaylists]);

  useEffect(() => {
    const uid = tab === "studio" ? currentUser?._id : targetUserId;
    fetchPlaylists(uid);
  }, [tab, currentUser?._id, targetUserId, fetchPlaylists]);

  // ── CRUD ─────────────────────────────────────────────────
  const handleCreate = async ({ name, description }) => {
    try {
      const { data } = await api.post("/playlist", { name, description });
      showToast(data.message || "Playlist created! ✨", "bg-[#8fff00]");
      setModalOpen(false);
      fetchPlaylists(currentUser?._id);
    } catch (err) { console.error(err); }
  };

  const handleUpdate = async ({ name, description }) => {
    if (!editTarget || !isValidObjectId(editTarget._id)) return;
    const targetId = editTarget._id;
    setPlaylists((p) => p.map((pl) =>
      pl._id === targetId ? { ...pl, name, description } : pl
    ));
    setEditTarget(null);
    try {
      const { data } = await api.patch(`/playlist/${targetId}`, { name, description });
      showToast(data.message || "Playlist updated! 🔥", "bg-neoBlue");
    } catch (err) {
      console.error(err);
      fetchPlaylists(currentUser?._id);
    }
  };

  const handleDelete = async () => {
    const playlistId = deleteTarget?._id;
    if (!playlistId || !isValidObjectId(playlistId)) return;
    setDeleting(true);
    const prev = [...playlists];
    setPlaylists((p) => p.filter((pl) => pl._id !== playlistId));
    setDeleteTarget(null);
    try {
      await api.delete(`/playlist/${playlistId}`);
      showToast("GRAVITY SHIFTED: PLAYLIST DELETED SUCCESSFULLY", "bg-[#FF0055] text-white");
    } catch (err) {
      console.error(err);
      setPlaylists(prev); 
      const status = err?.response?.status;
      if (status === 403 || status === 404) {
        showToast("SYSTEM FAILURE: YOU DON'T HAVE PERMISSION TO DELETE", "bg-neoYellow");
      } else {
        showToast("SYSTEM FAILURE: COULD NOT DELETE", "bg-neoYellow");
      }
    } finally {
      setDeleting(false);
    }
  };

  const isStudio = tab === "studio";
  const isOwner = isStudio;

  return (
    <div className="flex flex-col max-w-[1600px] mx-auto w-full pt-4 px-6 pb-12">
      <Toast toast={toast} />

      <PlaylistModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleCreate} initial={null} isEdit={false} />
      <PlaylistModal isOpen={!!editTarget} onClose={() => setEditTarget(null)} onSubmit={handleUpdate} initial={editTarget} isEdit />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        playlistName={deleteTarget?.name || ""}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        busy={deleting}
      />

      <AnimatePresence>
        {manageTarget && (
          <VideoManager playlist={manageTarget} onClose={() => { setManageTarget(null); fetchPlaylists(currentUser?._id); }} showToast={showToast} />
        )}
      </AnimatePresence>

      <div className="flex flex-col items-start justify-between gap-4 mb-6 lg:flex-row lg:items-center">
        <div className="flex items-center gap-3">
          <ListVideo size={36} className="stroke-[3]" />
          <h1 className="text-3xl font-black uppercase">Playlist Studio</h1>
        </div>

        <div className="flex border-[3px] border-neoBlack shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden">
          <button onClick={() => setTab("discovery")}
            className={`flex items-center gap-2 px-5 py-2.5 font-black uppercase text-sm transition-colors border-r-[3px] border-neoBlack ${tab === "discovery" ? "bg-neoBlue text-black" : "bg-white hover:bg-gray-100"}`}>
            <Eye size={18} className="stroke-[3]" /> Discovery
          </button>
          <button onClick={() => setTab("studio")}
            className={`flex items-center gap-2 px-5 py-2.5 font-black uppercase text-sm transition-colors ${tab === "studio" ? "bg-[#8fff00] text-black" : "bg-white hover:bg-gray-100"}`}>
            <Settings size={18} className="stroke-[3]" /> My Studio
          </button>
        </div>
      </div>

      {isStudio && (
        <div className="flex justify-end mb-6">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-black uppercase tracking-widest bg-[#8fff00] border-[3px] border-neoBlack shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all">
            <Plus size={18} className="stroke-[3]" /> New Playlist
          </motion.button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeletons"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8"
          >
            {[0, 1, 2, 3].map((i) => <Skel key={i} i={i} />)}
          </motion.div>
        ) : playlists.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center p-16 border-dashed border-[4px] border-neoBlack bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            <Folder size={64} className="mx-auto mb-4 stroke-[2] text-gray-300" />
            <p className="mb-2 text-3xl font-black uppercase">
              {isStudio ? "No Playlists Yet" : "No Public Playlists"}
            </p>
            <p className="text-base font-bold text-gray-500">
              {isStudio ? "Create your first playlist to get started." : "This user hasn't created any playlists yet."}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8"
          >
            <AnimatePresence>
              {playlists.map((pl, idx) => (
                <PlaylistCard key={pl._id} playlist={pl} idx={idx} isOwner={isOwner}
                  onClick={() => navigate(`/playlist/${pl._id}/play`)}
                  onManage={() => setManageTarget(pl)}
                  onEdit={() => setEditTarget(pl)}
                  onDelete={() => setDeleteTarget(pl)} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};