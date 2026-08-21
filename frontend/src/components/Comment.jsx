import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ThumbsUp } from "lucide-react";
import { api } from "../api/axios";

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
};

export const Comment = ({ comment }) => {
  const [isLiked, setIsLiked] = useState(comment?.isLiked || false);
  const [likeCount, setLikeCount] = useState(comment?.likesCount || comment?.likeCount || 0);
  const [pending, setPending] = useState(false);

  // ✅ FIX: ONLY reset state when the comment ID changes (e.g., new video), 
  // NOT on every parent re-render.
  useEffect(() => {
    setIsLiked(comment?.isLiked || false);
    setLikeCount(comment?.likesCount || comment?.likeCount || 0);
  }, [comment?._id]); 

  const handleLikeToggle = useCallback(async () => {
    if (!comment?._id || pending) return;

    const prevLiked = isLiked;
    const prevCount = likeCount;

    // Optimistic Update
    setIsLiked(!prevLiked);
    setLikeCount((c) => (prevLiked ? Math.max(0, c - 1) : c + 1));
    setPending(true);

    try {
      const { data } = await api.post(`/like/toggle/c/${comment._id}`);
      const { action, totalLikes } = data?.data || {};
      
      // Sync with server source-of-truth
      setIsLiked(action === "like");
      if (typeof totalLikes === "number") {
        setLikeCount(Math.max(0, totalLikes));
      }
    } catch (err) {
      // 🚨 This log will now tell us if the backend is still throwing a 500
      console.error("❌ Comment like failed:", err.response?.data || err.message);
      
      // Rollback on failure
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setPending(false);
    }
  }, [comment?._id, isLiked, likeCount, pending]);

  return (
    <div className="flex gap-3 my-4">
      <Link to={`/u/${comment.owner?.username}`} className="flex-shrink-0">
        <img
          src={comment.owner?.avatar || `https://ui-avatars.com/api/?name=${comment.owner?.username || "U"}&background=8fff00&bold=true`}
          alt={comment.owner?.username || "User"}
          className="w-11 h-11 rounded-full border-[3px] border-neoBlack object-cover hover:scale-105 transition-transform shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        />
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1.5">
          <Link
            to={`/u/${comment.owner?.username}`}
            className="text-sm font-black tracking-wide uppercase hover:underline decoration-2 underline-offset-2"
            style={{ transform: "rotate(-0.5deg)" }}
          >
            @{comment.owner?.username || "unknown"}
          </Link>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            {timeAgo(comment.createdAt)}
          </span>
        </div>

        <div className="bg-white border-2 border-neoBlack p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-2">
          <p className="font-bold text-[15px] leading-relaxed break-words whitespace-pre-wrap">
            {comment.content}
          </p>
        </div>

        <motion.button
          onClick={handleLikeToggle}
          disabled={pending}
          whileTap={{ scale: 0.85 }}
          className={`inline-flex items-center gap-1.5 px-3 py-1 border-2 border-neoBlack text-xs font-black uppercase tracking-wider transition-all
            shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
            active:translate-x-[1px] active:translate-y-[1px] active:shadow-none
            ${pending ? "opacity-50 cursor-not-allowed" : "hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"}
            ${isLiked ? "bg-[#00E1FF] text-black" : "bg-white text-black"}
          `}
        >
          <ThumbsUp size={14} className={`stroke-[3] ${isLiked ? "fill-black/20" : ""}`} />
          <span>{likeCount}</span>
        </motion.button>
      </div>
    </div>
  );
};