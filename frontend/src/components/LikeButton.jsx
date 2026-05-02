import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp } from "lucide-react";
import { api } from "../api/axios";

const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id);

/** Format numbers: 1200 → "1.2K", 1500000 → "1.5M" */
const formatCount = (n) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
};

/**
 * Neobrutalist LikeButton — prop-driven, syncs via GET /like/status/v/:videoId.
 * Works identically in VideoDetail and PlaylistPlayerPage.
 * @param {{ videoId: string }} props
 */
export const LikeButton = ({ videoId }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  // ── Fetch like status for THIS video (re-runs on videoId change) ──
  useEffect(() => {
    if (!videoId || !isValidObjectId(videoId)) return;
    let cancelled = false;

    const fetchStatus = async () => {
      try {
        const { data } = await api.get(`/like/status/v/${videoId}`);
        if (cancelled) return;
        const { isLiked: liked, likesCount: count } = data.data || {};
        setIsLiked(!!liked);
        setLikesCount(typeof count === "number" ? Math.max(0, count) : 0);
      } catch {
        if (!cancelled) {
          setIsLiked(false);
          setLikesCount(0);
        }
      }
    };

    fetchStatus();
    return () => { cancelled = true; };
  }, [videoId]);

  // ── Optimistic toggle ────────────────────────────────────
  const handleLikeToggle = useCallback(async () => {
    if (!videoId || !isValidObjectId(videoId) || pending) return;

    // Snapshot for revert
    const prevLiked = isLiked;
    const prevCount = likesCount;

    // A — Immediate local update
    setIsLiked(!prevLiked);
    setLikesCount((c) => (prevLiked ? Math.max(0, c - 1) : c + 1));
    setPending(true);
    setError(null);

    try {
      // B — Backend sync (withCredentials via shared axios instance)
      const { data } = await api.post(`/like/toggle/v/${videoId}`);
      const { action, totalLikes } = data.data || {};

      // Server truth overrides optimistic guess
      setIsLiked(action === "like");
      if (typeof totalLikes === "number") {
        setLikesCount(Math.max(0, totalLikes));
      }
    } catch (err) {
      // C — Revert on failure
      console.error("Like toggle failed:", err);
      setIsLiked(prevLiked);
      setLikesCount(prevCount);

      setError("SYSTEM FAILURE: LIKE REJECTED");
      setTimeout(() => setError(null), 3000);
    } finally {
      setPending(false);
    }
  }, [videoId, isLiked, likesCount, pending]);

  return (
    <>
      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ y: -60, opacity: 0, x: "-50%" }}
            animate={{ y: 0, opacity: 1, x: "-50%" }}
            exit={{ y: -60, opacity: 0, x: "-50%" }}
            className="fixed top-6 left-1/2 z-[100] px-6 py-3 bg-neoYellow border-[3px] border-neoBlack shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] font-black uppercase text-sm tracking-wider"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Like Button */}
      <motion.button
        onClick={handleLikeToggle}
        disabled={pending}
        whileTap={{ scale: 1.3 }}
        animate={isLiked ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.3 }}
        className={`flex items-center gap-2 px-4 py-2.5 border-4 border-neoBlack font-black text-base uppercase tracking-wide transition-all
          shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
          active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
          ${pending ? "opacity-60 cursor-not-allowed" : "hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"}
          ${isLiked ? "bg-[#FF0055] text-white" : "bg-white text-black"}
        `}
      >
        <motion.span
          key={isLiked ? "liked" : "not-liked"}
          initial={{ scale: 0.6, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="inline-flex"
        >
          <ThumbsUp
            size={20}
            className={`stroke-[3] transition-colors ${isLiked ? "fill-white/40" : ""}`}
          />
        </motion.span>
        <span
          className="text-base font-black"
          style={{ WebkitTextStroke: "0.5px currentColor" }}
        >
          {formatCount(likesCount)}
        </span>
      </motion.button>
    </>
  );
};
