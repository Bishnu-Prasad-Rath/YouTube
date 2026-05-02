import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../hooks/useSubscription";
import { Comment } from "../components/Comment";
import { LikeButton } from "../components/LikeButton";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, ListVideo, Film, MessageSquare,
} from "lucide-react";

const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id);

/* ══════════════════════════════════════════════════════════ */
/* ██ PlaylistPlayerPage                                   ██ */
/* ══════════════════════════════════════════════════════════ */
export const PlaylistPlayerPage = () => {
  const { playlistId } = useParams();

  // Playlist data
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewToast, setViewToast] = useState(null);

  // Comment state
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);

  const { currentUser } = useAuth();

  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);
  const sidebarRef = useRef(null);

  // ── Fetch playlist ────────────────────────────────────────
  useEffect(() => {
    if (!playlistId || !isValidObjectId(playlistId)) return;
    const fetch = async () => {
      try {
        const { data } = await api.get(`/playlist/${playlistId}`);
        setPlaylist(data.data);
      } catch (err) {
        console.error("Failed to load playlist", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [playlistId]);

  const videos = playlist?.videos || [];
  const currentVideo = videos[currentVideoIndex] || null;

  // ── Switch video ──────────────────────────────────────────
  const goToVideo = useCallback(
    (idx) => {
      if (idx < 0 || idx >= videos.length) return;
      setCurrentVideoIndex(idx);
      setProgress(0);
      setIsPlaying(false);
    },
    [videos.length]
  );

  // Auto-load new source when index changes
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !currentVideo?.videoFile) return;

    // The key={currentVideo._id} on <video> forces a full re-mount,
    // but if React reuses the node we still need to reload explicitly.
    const playVideo = async () => {
      try {
        vid.load();
        await vid.play();
        setIsPlaying(true);
      } catch (err) {
        // AbortError is expected when play() is interrupted by a new load()
        if (err.name !== "AbortError") console.error("Playback error:", err);
        setIsPlaying(false);
      }
    };
    playVideo();
  }, [currentVideoIndex, currentVideo?.videoFile]);

  // Scroll active card into view
  useEffect(() => {
    const el = document.getElementById(`queue-item-${currentVideoIndex}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [currentVideoIndex]);

  // ── View counting (debounced, per-session dedup) ──────────
  useEffect(() => {
    const videoId = currentVideo?._id;
    if (!videoId || !isValidObjectId(videoId)) return;

    const sessionKey = `playlist_viewed_${videoId}`;
    const alreadyViewed = sessionStorage.getItem(sessionKey);

    const timer = setTimeout(async () => {
      if (alreadyViewed) return;
      try {
        await api.get(`/videos/${videoId}?inc=true`);
        sessionStorage.setItem(sessionKey, "true");

        // Update local view count in playlist state
        setPlaylist((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            videos: prev.videos.map((v) =>
              v._id === videoId ? { ...v, views: (v.views || 0) + 1 } : v
            ),
          };
        });

        // Show toast only on first view of the session
        setViewToast("TRANSMISSION RECEIVED: VIEW LOGGED");
        setTimeout(() => setViewToast(null), 3000);
      } catch (err) {
        console.error("View tracking failed:", err);
      }
    }, 7000); // 7s debounce — skip before this = no view

    return () => clearTimeout(timer);
  }, [currentVideo?._id]);

  // ── Player controls ───────────────────────────────────────
  const togglePlay = async () => {
    const vid = videoRef.current;
    if (!vid) return;
    try {
      if (vid.paused) {
        await vid.play();
        setIsPlaying(true);
      } else {
        vid.pause();
        setIsPlaying(false);
      }
    } catch (err) {
      if (err.name !== "AbortError") console.error("Toggle play error:", err);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerContainerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === " ") { e.preventDefault(); togglePlay(); }
      else if (e.key.toLowerCase() === "f") { e.preventDefault(); toggleFullscreen(); }
      else if (e.key === "ArrowRight") goToVideo(currentVideoIndex + 1);
      else if (e.key === "ArrowLeft") goToVideo(currentVideoIndex - 1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [currentVideoIndex, goToVideo]);

  const handleTimeUpdate = () => {
    const vid = videoRef.current;
    if (!vid || !isFinite(vid.duration) || vid.duration === 0) return;
    setProgress((vid.currentTime / vid.duration) * 100);
  };

  const handleProgressClick = (e) => {
    const vid = videoRef.current;
    if (!vid || !isFinite(vid.duration) || vid.duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const newTime = ((e.clientX - rect.left) / rect.width) * vid.duration;
    if (!isFinite(newTime)) return;
    vid.currentTime = newTime;
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (currentVideoIndex < videos.length - 1) {
      goToVideo(currentVideoIndex + 1);
    }
  };

  // ── Loading state ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 pt-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="lg:w-[70%]">
            <div className="aspect-video bg-gray-200 animate-pulse border-4 border-neoBlack shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" />
            <div className="w-2/3 h-8 mt-4 bg-gray-200 animate-pulse" />
          </div>
          <div className="lg:w-[30%] space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 border-4 animate-pulse border-neoBlack" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!playlist || videos.length === 0) {
    return (
      <div className="max-w-xl mx-auto mt-20 text-center p-12 border-dashed border-4 border-neoBlack bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <Film size={56} className="mx-auto mb-4 stroke-[2] text-gray-400" />
        <p className="mb-2 text-3xl font-black uppercase">
          {!playlist ? "Playlist Not Found" : "GRAVITY DEFIED: THIS PLAYLIST IS EMPTY"}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pb-12 pt-4">
      {/* View toast */}
      <AnimatePresence>
        {viewToast && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="fixed top-6 right-6 z-[100] px-5 py-3 bg-[#00E1FF] border-[3px] border-neoBlack shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] font-black uppercase text-sm tracking-wider"
          >
            {viewToast}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* ═══ LEFT: Video Player (70%) ═══ */}
        <div className="flex-none lg:w-[70%]">
          {/* Player */}
          <div
            ref={playerContainerRef}
            className="relative border-4 border-neoBlack shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-black group"
          >
            <video
              ref={videoRef}
              key={currentVideo?._id}
              src={currentVideo?.videoFile}
              poster={currentVideo?.thumbnail}
              autoPlay
              playsInline
              className="object-cover w-full outline-none cursor-pointer aspect-video"
              onClick={togglePlay}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />

            {/* Controls overlay */}
            <div
              className={`absolute bottom-0 left-0 right-0 p-4 flex flex-col bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 ${
                isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
              }`}
            >
              {/* Progress */}
              <div
                className="relative w-full h-3 mb-4 bg-white border-2 cursor-pointer border-neoBlack group/p"
                onClick={handleProgressClick}
              >
                <div
                  className="absolute top-0 left-0 h-full bg-[#8fff00] border-r-2 border-neoBlack"
                  style={{ width: `${progress}%` }}
                />
                <div
                  className="absolute w-4 h-6 transition-opacity -translate-y-1/2 border-2 border-white opacity-0 top-1/2 bg-neoBlack group-hover/p:opacity-100"
                  style={{ left: `calc(${progress}% - 8px)` }}
                />
              </div>
              {/* Buttons */}
              <div className="flex items-center justify-between text-white">
                <div className="flex gap-3">
                  <button onClick={togglePlay} className="p-2 border-2 border-black bg-[#8fff00] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none">
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                  </button>
                  <button onClick={toggleMute} className="p-2 border-2 border-black bg-[#8fff00] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none">
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                </div>
                <button onClick={toggleFullscreen} className="p-2 border-2 border-black bg-[#8fff00] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none">
                  {isFullscreen ? <Minimize className="w-5 h-5 stroke-[3]" /> : <Maximize className="w-5 h-5 stroke-[3]" />}
                </button>
              </div>
            </div>
          </div>

          {/* Prev / Next nav */}
          <div className="flex items-center justify-between gap-4 mt-4">
            <button
              onClick={() => goToVideo(currentVideoIndex - 1)}
              disabled={currentVideoIndex === 0}
              className={`neo-btn flex items-center gap-2 uppercase text-sm bg-white ${
                currentVideoIndex === 0 ? "opacity-40 cursor-not-allowed" : "hover:-translate-y-1"
              }`}
            >
              <SkipBack size={18} className="stroke-[3]" /> Previous
            </button>

            <span className="font-black uppercase text-sm bg-[#8fff00] border-2 border-neoBlack px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {currentVideoIndex + 1} / {videos.length}
            </span>

            <button
              onClick={() => goToVideo(currentVideoIndex + 1)}
              disabled={currentVideoIndex >= videos.length - 1}
              className={`neo-btn flex items-center gap-2 uppercase text-sm bg-white ${
                currentVideoIndex >= videos.length - 1 ? "opacity-40 cursor-not-allowed" : "hover:-translate-y-1"
              }`}
            >
              Next <SkipForward size={18} className="stroke-[3]" />
            </button>
          </div>

          {/* ═══ Creator Bar ═══ */}
          <CreatorBar
            currentVideo={currentVideo}
            currentUser={currentUser}
          />

          {/* ═══ Comment Section ═══ */}
          <CommentSection
            videoId={currentVideo?._id}
            comments={comments}
            setComments={setComments}
            commentInput={commentInput}
            setCommentInput={setCommentInput}
            isPostingComment={isPostingComment}
            setIsPostingComment={setIsPostingComment}
            currentUser={currentUser}
          />
        </div>

        {/* ═══ RIGHT: Playlist Queue (30%) ═══ */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Queue header */}
          <div className="border-4 border-neoBlack bg-[#8fff00] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <ListVideo size={22} className="stroke-[3]" />
              <h2 className="text-lg font-black uppercase">{playlist.name}</h2>
            </div>
            <p className="text-sm font-bold text-black/60 line-clamp-1">
              {playlist.description || "No description"} • {videos.length} videos
            </p>
          </div>

          {/* Scrollable queue */}
          <div
            ref={sidebarRef}
            className="flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-220px)] pr-1"
          >
            {videos.map((video, idx) => {
              const isActive = idx === currentVideoIndex;
              return (
                <motion.div
                  key={video._id}
                  id={`queue-item-${idx}`}
                  layout
                  animate={{ y: isActive ? -4 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  onClick={() => goToVideo(idx)}
                  className={`flex items-center gap-3 p-2 border-4 cursor-pointer transition-all group relative ${
                    isActive
                      ? "border-[#8fff00] bg-[#8fff00]/10 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                      : "border-neoBlack bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                  }`}
                >
                  {/* Index */}
                  <span className={`font-black text-sm w-6 text-center flex-shrink-0 ${isActive ? "text-[#8fff00]" : "text-gray-400"}`}>
                    {idx + 1}
                  </span>

                  {/* Thumbnail */}
                  <div className="flex-shrink-0 w-20 h-12 overflow-hidden border-2 border-neoBlack">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="object-cover w-full h-full transition-transform group-hover:scale-105"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black leading-tight uppercase line-clamp-2">
                      {video.title}
                    </p>
                    <p className="text-xs font-bold text-gray-400 mt-0.5">
                      {video.views || 0} views
                    </p>
                  </div>

                  {/* NOW PLAYING badge */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="hidden sm:block font-black text-[10px] uppercase bg-neoGreen border-2 border-neoBlack px-2 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap flex-shrink-0 tracking-wider z-10"
                      >
                        Now Playing
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════ */
/* ██ CreatorBar — Subscribe + Like + Channel Info          ██ */
/* ═══════════════════════════════════════════════════════════ */
const CreatorBar = ({ currentVideo, currentUser }) => {
  const owner = currentVideo?.owner;
  const hasOwner = owner && typeof owner === "object" && owner.username;

  const { isSubscribed, subscribersCount, toggleSubscription, loading } =
    useSubscription(owner?._id, false, 0);

  return (
    <div className="mt-6 border-4 border-neoBlack shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white p-5">
      {/* Title + Views */}
      <h1 className="mb-2 text-2xl font-black tracking-tight uppercase sm:text-3xl">
        {currentVideo?.title}
      </h1>
      <div className="flex flex-wrap items-center gap-4 mb-4 text-sm font-bold text-gray-600">
        <span>{currentVideo?.views || 0} views</span>
        <span>•</span>
        <span>
          {currentVideo?.createdAt
            ? new Date(currentVideo.createdAt).toLocaleDateString()
            : ""}
        </span>
      </div>

      {/* Channel row */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-neoWhite border-4 border-neoBlack shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
        {/* Left: Avatar + name + subs */}
        <div className="flex items-center gap-3">
          {hasOwner && (
            <Link to={`/u/${owner.username}`}>
              <img
                src={owner.avatar || `https://ui-avatars.com/api/?name=${owner.username}&background=8fff00&bold=true`}
                alt={owner.username}
                className="w-12 h-12 rounded-full border-4 border-neoBlack object-cover shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-transform"
              />
            </Link>
          )}
          <div>
            {hasOwner && (
              <Link
                to={`/u/${owner.username}`}
                className="text-lg font-black leading-tight hover:underline decoration-2"
              >
                {owner.username}
              </Link>
            )}
            <p className="text-sm font-bold text-gray-500">
              {subscribersCount} subscribers
            </p>
          </div>
        </div>

        {/* Right: Subscribe + Like */}
        <div className="flex items-center gap-3">
          {hasOwner && currentUser?.username !== owner.username && (
            <button
              onClick={() => toggleSubscription(owner._id)}
              disabled={loading}
              className={`neo-btn uppercase tracking-widest text-sm px-5 py-2.5 border-4 border-neoBlack shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black ${
                isSubscribed ? "bg-[#8fff00]" : "bg-white"
              } ${loading ? "opacity-50 cursor-not-allowed" : "hover:-translate-y-0.5"}`}
            >
              {isSubscribed ? "Subscribed" : "Subscribe"}
            </button>
          )}
          {currentVideo?._id && <LikeButton videoId={currentVideo._id} />}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════ */
/* ██ CommentSection — Post + List with slide-in animation ██ */
/* ═══════════════════════════════════════════════════════════ */
const CommentSection = ({
  videoId,
  comments,
  setComments,
  commentInput,
  setCommentInput,
  isPostingComment,
  setIsPostingComment,
  currentUser,
}) => {
  // Fetch comments when videoId changes
  useEffect(() => {
    if (!videoId || !isValidObjectId(videoId)) {
      setComments([]);
      return;
    }
    let cancelled = false;

    const fetchComments = async () => {
      try {
        const { data } = await api.get(`/comment/${videoId}?page=1&limit=50`);
        if (!cancelled) setComments(data.data || []);
      } catch (err) {
        console.error("Failed to fetch comments:", err);
        if (!cancelled) setComments([]);
      }
    };

    fetchComments();
    setCommentInput("");
    return () => { cancelled = true; };
  }, [videoId]);

  const handlePostComment = async () => {
    if (!commentInput.trim() || !videoId || isPostingComment) return;
    setIsPostingComment(true);
    try {
      const { data } = await api.post(`/comment/${videoId}`, {
        content: commentInput.trim(),
      });
      const newComment = data.data;
      // Prepend with owner info from current user
      setComments((prev) => [
        {
          ...newComment,
          owner: {
            _id: currentUser._id,
            username: currentUser.username,
            avatar: currentUser.avatar,
          },
        },
        ...prev,
      ]);
      setCommentInput("");
    } catch (err) {
      console.error("Failed to post comment:", err);
    } finally {
      setIsPostingComment(false);
    }
  };

  return (
    <motion.div
      key={videoId}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mt-6"
    >
      {/* Header */}
      <h2 className="font-black text-xl uppercase mb-4 inline-flex items-center gap-2 bg-neoBlue px-4 py-2 border-4 border-neoBlack shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-white">
        <MessageSquare size={20} className="stroke-[3]" />
        Comments ({comments.length})
      </h2>

      {/* Post input */}
      {currentUser ? (
        <div className="flex gap-3 mb-6">
          <input
            type="text"
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePostComment()}
            placeholder="Add a bold comment..."
            className="neo-input flex-1 bg-neoYellow outline-none border-4 border-neoBlack shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#fff700] transition-colors"
          />
          <button
            onClick={handlePostComment}
            disabled={isPostingComment || !commentInput.trim()}
            className={`neo-btn bg-neoWhite uppercase border-4 border-neoBlack shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black ${
              isPostingComment || !commentInput.trim()
                ? "opacity-50 cursor-not-allowed"
                : "active:translate-y-1 active:translate-x-1 active:shadow-none"
            }`}
          >
            {isPostingComment ? "Posting..." : "Post"}
          </button>
        </div>
      ) : (
        <div className="font-bold text-lg mb-6 uppercase p-4 border-4 border-neoBlack bg-neoYellow shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
          Please sign in to comment.
        </div>
      )}

      {/* Comment list */}
      <div className="flex flex-col gap-1">
        <AnimatePresence>
          {comments.map((c) => (
            <motion.div
              key={c._id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.2 }}
            >
              <Comment comment={c} />
            </motion.div>
          ))}
        </AnimatePresence>
        {comments.length === 0 && (
          <div className="py-8 font-bold text-center text-gray-400 uppercase bg-white border-4 border-dashed border-neoBlack">
            No comments yet. Be the first!
          </div>
        )}
      </div>
    </motion.div>
  );
};
