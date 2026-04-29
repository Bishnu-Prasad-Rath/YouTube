import { useState, useEffect } from "react";
import { api } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Send, Heart, MoreVertical, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:8000";

const TweetCard = ({ tweet, currentUser, onToast, onDelete, onUpdate }) => {
  const [isLiked, setIsLiked] = useState(tweet.isLiked || false);
  const [likeCount, setLikeCount] = useState(tweet.totalLikes || 0);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replies, setReplies] = useState(tweet.replies || []);
  const [isLiking, setIsLiking] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editContent, setEditContent] = useState(tweet.content || "");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const isOwner = currentUser?._id === (tweet.owner?._id || tweet.owner);

  useEffect(() => {
    const socket = io(SOCKET_URL, { withCredentials: true });
    socket.on("new:reply", (newReply) => {
       if (newReply.tweet === tweet._id) {
           setReplies(prev => {
              // Check if duplicate ID exists
              const isDuplicateId = prev.some(r => r._id === newReply._id);
              // Check if it's the optimistic reply returning from server
              const isOptimisticReturn = prev.some(r => r.content === newReply.content && r.owner?._id === newReply.owner?._id);

              if (isDuplicateId || isOptimisticReturn) {
                 console.log("Duplicate reply detected in State/Socket sync:", newReply);
                 return prev.map(r => r.content === newReply.content ? newReply : r);
              }
              return [...prev, newReply];
           });
       }
    });
    return () => socket.disconnect();
  }, [tweet._id]);

  const handleLike = async (e) => {
    e?.stopPropagation();
    if (!currentUser || isLiking) return;
    setIsLiking(true);

    const previousLike = isLiked;
    const previousCount = likeCount;

    setIsLiked(!previousLike);
    setLikeCount(prev => previousLike ? Math.max(0, prev - 1) : prev + 1);

    try {
       const response = await api.post(`/like/toggle/t/${tweet._id}`);
       console.log('Like Saved:', response.data);
       setIsLiked(response.data.data.action === "like");
       setLikeCount(response.data.data.totalLikes);
    } catch (error) {
       setIsLiked(previousLike);
       setLikeCount(previousCount);
    } finally {
       setTimeout(() => setIsLiking(false), 500); // 500ms debounce
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    const text = replyText;
    setReplyText("");
    setShowReply(false);
    
    // Optimistic Reply Render
    const optimisticReply = {
      _id: Date.now().toString(),
      content: text,
      owner: currentUser,
      createdAt: new Date().toISOString()
    };
    setReplies(prev => [...prev, optimisticReply]);

    try {
      const response = await api.post(`/comment/t/${tweet._id}`, { content: text });
      if (response.status === 201) {
         onToast("REPLY SENT! 💬", "bg-neoYellow");
      }
    } catch (error) {
      console.error("Failed to post reply", error);
      setReplies(prev => prev.filter(r => r._id !== optimisticReply._id));
    }
  };

  const handleTweetDelete = async () => {
    setIsDeleting(true);
    // Optimistic UI
    if (onDelete) onDelete(tweet._id);
    setShowDeleteModal(false);
    setShowMenu(false);
    try {
      await api.delete(`/tweets/${tweet._id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to delete tweet. Please refresh.");
      setIsDeleting(false);
    }
  };

  const handleTweetUpdate = async () => {
    setIsUpdating(true);
    const previousTweet = { ...tweet };

    // Optimistic UI
    if (onUpdate) onUpdate({ ...tweet, content: editContent });
    setShowEditModal(false);
    setShowMenu(false);

    try {
      const { data } = await api.patch(`/tweets/${tweet._id}`, { content: editContent });
      if (onUpdate) onUpdate(data.data);
    } catch (err) {
      console.error(err);
      if (onUpdate) onUpdate(previousTweet);
      alert("Failed to update tweet. Changes reverted.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="neo-card bg-neoWhite border-4 border-neoBlack shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all relative">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full border-2 border-neoBlack bg-neoYellow overflow-hidden shrink-0">
          <img src={tweet.owner?.avatar || "https://ui-avatars.com/api/?name=U"} alt="Avatar" className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="font-black text-lg uppercase leading-tight">{tweet.owner?.fullName || "User"}</p>
          <p className="font-bold text-gray-500 text-sm">@{tweet.owner?.username || "unknown"} • {formatDistanceToNow(new Date(tweet.createdAt), { addSuffix: true })}</p>
        </div>
      </div>
      <p className="font-bold text-lg whitespace-pre-wrap break-words overflow-hidden">{tweet.content}</p>
      
      <div className="mt-6 flex items-center gap-6 border-t-4 border-neoBlack pt-4 text-gray-700">
         <div 
           onClick={handleLike}
           className={`flex items-center gap-2 font-black cursor-pointer transition-colors ${isLiked ? 'text-neoRed' : 'hover:text-neoRed'} ${isLiking ? 'opacity-50 pointer-events-none' : ''}`}
         >
            <Heart size={20} className={isLiked ? "fill-current" : "stroke-[3]"} /> 
            <span>{likeCount}</span>
         </div>
         <div 
           onClick={() => setShowReply(!showReply)}
           className="flex items-center gap-2 font-black cursor-pointer hover:text-neoBlue transition-colors"
         >
            <MessageSquare size={20} className="stroke-[3]" /> 
            <span>Reply</span>
         </div>
      </div>

      {/* Reply Box Logic */}
      {showReply && (
        <div className="mt-4 flex gap-4 animate-in slide-in-from-top-2">
           <input 
             type="text" 
             value={replyText}
             onChange={(e) => setReplyText(e.target.value)}
             placeholder="Write a reply..."
             className="flex-1 neo-input border-2 border-neoBlack px-4 py-2 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
           />
           <button 
             onClick={handleReply}
             className="neo-btn bg-neoBlue text-white border-2 border-neoBlack px-4 py-2 font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none"
           >
              Post
           </button>
        </div>
      )}

      {/* Render Replies */}
      {replies.length > 0 && (
        <div className="mt-6 flex flex-col gap-4 ml-8 pl-6 border-l-4 border-neoBlack">
          {replies
            .filter((v, i, a) => {
               const isFirst = a.findIndex(t => t._id === v._id || (t.content === v.content && t.owner?._id === v.owner?._id)) === i;
               if (!isFirst) console.log("Duplicate reply removed during rendering phase:", v);
               return isFirst;
            })
            .map(reply => (
            <div key={reply._id} className="bg-gray-100 border-2 border-neoBlack p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full border-2 border-neoBlack overflow-hidden bg-neoYellow shrink-0">
                  <img src={reply.owner?.avatar || "https://ui-avatars.com/api/?name=U"} className="w-full h-full object-cover" />
                </div>
                <p className="font-bold text-sm uppercase">{reply.owner?.username}</p>
                <span className="text-xs font-bold text-gray-500">{formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}</span>
              </div>
              <p className="font-bold text-gray-800">{reply.content}</p>
            </div>
          ))}
        </div>
      )}

      {isOwner && (
        <div className="absolute top-4 right-4 z-20">
          <button 
            onClick={(e) => { e.preventDefault(); setShowMenu(!showMenu); }}
            className="p-1 bg-neoWhite border-2 border-neoBlack shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neoYellow"
          >
            <MoreVertical size={20} className="stroke-[3]" />
          </button>
          
          {showMenu && (
            <div className="absolute top-full right-0 mt-2 bg-neoWhite border-4 border-neoBlack shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col w-32 z-30">
               <button 
                 onClick={() => { setShowEditModal(true); setShowMenu(false); }}
                 className="p-2 font-bold uppercase text-left hover:bg-[#22d3ee] border-b-2 border-neoBlack"
               >
                 Edit
               </button>
               <button 
                 onClick={() => { setShowDeleteModal(true); setShowMenu(false); }}
                 className="p-2 font-bold uppercase text-left hover:bg-[#ff4343] hover:text-white"
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
             <h2 className="text-3xl font-black uppercase text-neoRed mb-4 border-b-4 border-neoBlack pb-2">Delete Tweet?</h2>
             <p className="font-bold text-xl mb-8">This action is permanent and cannot be reversed.</p>
             <div className="flex gap-4">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 p-4 font-black uppercase border-4 border-neoBlack hover:bg-gray-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleTweetDelete}
                  disabled={isDeleting}
                  className="flex-1 p-4 font-black uppercase border-4 border-neoBlack bg-[#ff4343] text-white hover:bg-red-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all"
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
               <h2 className="text-3xl font-black uppercase">Edit Tweet</h2>
               <button onClick={() => setShowEditModal(false)} className="hover:rotate-90 transition-transform">
                  <X size={32} className="stroke-[3]" />
               </button>
             </div>
             
             <textarea 
               value={editContent} 
               onChange={e => setEditContent(e.target.value)}
               className="neo-input border-4 border-neoBlack p-3 mb-8 font-bold h-32 resize-none"
             />
             
             <button 
               onClick={handleTweetUpdate}
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
};

export const Tweets = ({ userId }) => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const isGlobalFeed = location.pathname === '/tweets';
  
  const targetUserId = userId || currentUser?._id;
  
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTweet, setNewTweet] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, color) => {
    setToast({ message, color });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchTweets = async () => {
    try {
      let endpoint = `/tweets/user/${targetUserId}`;
      if (isGlobalFeed) {
         endpoint = `/tweets/all`;
      }
      const { data } = await api.get(endpoint);
      console.log('Fetched Tweets:', data.data);
      setTweets(data.data || []);
    } catch (error) {
      console.error("Failed to fetch tweets", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTweets();
  }, [targetUserId, isGlobalFeed]);

  const handlePostTweet = async (e) => {
    e?.preventDefault();
    if (!newTweet.trim() || isPosting) return;
    setIsPosting(true);
    try {
      const payload = { content: newTweet };
      const response = await api.post("/tweets", payload);
      
      if (response && (response.status === 201 || response.status === 200)) {
          setNewTweet("");
          fetchTweets();
          showToast("TWEET DISPATCHED! 🚀", "bg-[#00ffff]");
      }
    } catch (error) {
      console.error("Failed to post tweet", error);
    } finally {
      setIsPosting(false);
    }
  };

  if (loading) return <div className="text-center font-black text-2xl uppercase animate-pulse mt-8">Loading Tweets...</div>;

  const isOwner = currentUser?._id === targetUserId && !isGlobalFeed;

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto w-full pt-4">
      {(isOwner || isGlobalFeed) && (
        <div className="neo-card bg-neoYellow border-4 border-neoBlack shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
          <h2 className="font-black uppercase text-2xl mb-4 flex items-center gap-2">
            <MessageSquare className="stroke-[3]" /> Drop a Tweet
          </h2>
          <textarea 
            value={newTweet}
            onChange={(e) => setNewTweet(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full h-32 neo-input border-4 border-neoBlack bg-neoWhite p-4 font-bold resize-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] outline-none"
          />
          <div className="flex justify-end mt-4">
            <button 
              onClick={handlePostTweet}
              disabled={isPosting}
              className={`neo-btn flex items-center gap-2 bg-neoBlue text-white uppercase tracking-widest px-8 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${isPosting ? 'opacity-50 cursor-not-allowed' : 'active:translate-y-1 active:translate-x-1 active:shadow-none hover:bg-blue-600'}`}
            >
               {isPosting ? 'Posting...' : <><Send size={20} className="stroke-[3]" /> Post</>}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6 mb-12">
        {tweets.length === 0 ? (
           <div className="text-center p-12 neo-card border-dashed border-4 border-neoBlack bg-neoWhite">
             <p className="font-black uppercase text-2xl">No tweets here.</p>
           </div>
        ) : (
          tweets.map((tweet) => (
            <TweetCard 
              key={tweet._id} 
              tweet={tweet} 
              currentUser={currentUser} 
              onToast={showToast}
              onDelete={(id) => setTweets(prev => prev.filter(t => t._id !== id))}
              onUpdate={(updatedTweet) => setTweets(prev => prev.map(t => t._id === updatedTweet._id ? { ...t, content: updatedTweet.content } : t))}
            />
          ))
        )}
      </div>

      {/* Custom Neobrutalist Toast */}
      {toast && (
        <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-50 px-8 py-4 border-4 border-neoBlack shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${toast.color} font-black uppercase text-2xl animate-in slide-in-from-top-10 fade-in`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};
