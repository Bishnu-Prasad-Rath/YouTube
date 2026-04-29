import { useState } from "react";
import { Link } from "react-router-dom";

export const Comment = ({ comment }) => {
  const [liked, setLiked] = useState(false);
  
  const timeAgo = (dateStr) => {
    const obj = new Date(dateStr);
    return obj.toLocaleDateString();
  };

  return (
    <div className="neo-card bg-neoWhite flex gap-4 my-4 p-4">
      <Link to={`/u/${comment.owner?.username}`}>
        <img
          src={comment.owner?.avatar || "https://ui-avatars.com/api/?name=User"}
          alt="Avatar"
          className="w-12 h-12 rounded-full border-[3px] border-neoBlack shrink-0 hover:scale-105 transition-transform"
        />
      </Link>
      <div className="flex-1">
        <div className="flex items-baseline gap-2 mb-1">
          <Link to={`/u/${comment.owner?.username}`} className="font-black text-lg hover:underline decoration-2">
            @{comment.owner?.username}
          </Link>
          <span className="text-xs font-bold text-gray-500">
            {timeAgo(comment.createdAt)}
          </span>
        </div>
        <p className="font-bold text-lg mb-2">{comment.content}</p>
        <div className="flex gap-4">
          <button 
            className={`font-black text-sm flex items-center gap-1 ${liked ? 'text-neoBlue' : ''}`}
            onClick={() => setLiked(!liked)}
          >
            👍 {liked ? 'Liked' : 'Like'}
          </button>
        </div>
      </div>
    </div>
  );
};

