import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/axios";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../hooks/useSubscription";
import { Comment } from "../components/Comment";
import { VideoCard } from "../components/VideoCard";
import { motion } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from "lucide-react";

const SOCKET_URL = "http://localhost:8000";

export const VideoDetail = () => {
  const { videoId } = useParams();
  const { currentUser } = useAuth();
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [recLoading, setRecLoading] = useState(true);
  const [showMore, setShowMore] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);
  const socketRef = useRef(null);
  
  const [initialSubState, setInitialSubState] = useState(false);
  const [initialSubCount, setInitialSubCount] = useState(0);

  const { isSubscribed, subscribersCount, toggleSubscription, loading } = useSubscription(
    video?.owner?._id,
    initialSubState,
    initialSubCount
  );
  
  // Custom Video Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);
  const dataFetchedRef = useRef(null);

  useEffect(() => {
    if (dataFetchedRef.current === videoId) return;
    dataFetchedRef.current = videoId;
    
    // Reset state explicitly on navigate
    setComments([]);
    setVideo(null);

    const fetchVideoData = async () => {
      setRecLoading(true);
      
      const hasViewedKey = `viewed_${videoId}`;
      const hasViewed = sessionStorage.getItem(hasViewedKey);
      const incQuery = !hasViewed ? '?inc=true' : '';

      try {
        const [videoRes, commentRes, recRes] = await Promise.all([
          api.get(`/videos/${videoId}${incQuery}`),
          api.get(`/comment/${videoId}`),
          api.get(`/videos?limit=5`)
        ]);

        if (!hasViewed) sessionStorage.setItem(hasViewedKey, 'true');

        const fetchedVideo = videoRes.data.data;
        setVideo(fetchedVideo);
        setComments(commentRes.data.data?.docs || commentRes.data.data || []);
        
        const filteredRecs = (recRes.data.data?.videos || recRes.data.data || []).filter(v => v._id !== videoId);
        setRecommended(filteredRecs);
        setRecLoading(false);

        // Fetch channel state for subs after parallel resolution
        if (fetchedVideo?.owner?.username) {
          const channelRes = await api.get(`/users/c/${fetchedVideo.owner.username}`);
          setInitialSubState(channelRes.data.data?.isSubscribed || false);
          setInitialSubCount(channelRes.data.data?.subscribersCount || 0);
        }
      } catch (error) {
        console.error(error);
        setRecLoading(false);
      }
    };
    fetchVideoData();

    socketRef.current = io(SOCKET_URL, {
      withCredentials: true
    });
    socketRef.current.emit("join-room", videoId);
    console.log('Socket listening for comments on room:', videoId);
    
    socketRef.current.on("comment:new", (newComment) => {
      console.log('New comment received!', newComment);
      setComments(prev => prev.some(c => c._id === newComment._id) ? prev : [newComment, ...prev]);
    });

    return () => {
      socketRef.current.off("comment:new");
      socketRef.current.emit("leave-room", videoId);
      socketRef.current.disconnect();
    };
  }, [videoId]);

  // Player Handlers
  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerContainerRef.current?.requestFullscreen().catch(err => {
        console.log("Error attempting to enable fullscreen:", err.message);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        togglePlay();
      } else if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setProgress((current / total) * 100);
    }
  };

  const handleProgressClick = (e) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pos * videoRef.current.duration;
    }
  };

  const handlePostComment = async () => {
    if (!commentInput.trim()) return;
    setIsPostingComment(true);
    try {
      const response = await api.post(`/comment/${videoId}`, { content: commentInput });
      const addedComment = response.data.data;
      
      setComments(prev => prev.some(c => c._id === addedComment._id) ? prev : [addedComment, ...prev]);
      setCommentInput("");
    } catch (error) {
       console.error("Error posting comment", error);
    } finally {
      setIsPostingComment(false);
    }
  }

  // toggleSubscription is imported from custom hook

  if (!video) return <h2 className="font-black text-4xl p-8 uppercase text-center mt-12 bg-neoBlue shadow-neo border-4 border-neoBlack mx-auto max-w-xl">Loading Video...</h2>;

  console.log("Current Comments in State:", comments.length);

  return (
    <div className="max-w-[1600px] mx-auto px-6 pb-12 flex flex-col lg:flex-row gap-8 pt-4">
      {/* 70% Primary Video Area */}
      <div className="flex-none lg:w-[65%] xl:w-[70%]">
        
        {/* Custom Video Player */}
        <div ref={playerContainerRef} className="relative neo-card p-0 mb-6 border-4 border-neoBlack shadow-neo group bg-neoBlack">
          <video 
            ref={videoRef}
            src={video.videoFile} 
            poster={video.thumbnail} 
            className="w-full aspect-video object-cover outline-none cursor-pointer"
            onClick={togglePlay}
            onTimeUpdate={handleTimeUpdate}
            // Make sure video ends on unpause state if it reaches end
            onEnded={() => setIsPlaying(false)}
          />
          
          {/* Controls Overlay */}
          <div className={`absolute bottom-0 left-0 right-0 p-4 transition-opacity duration-300 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
            
            {/* Progress Bar */}
            <div 
              className="w-full h-3 border-2 border-neoBlack bg-white relative cursor-pointer group/progress mb-4 mt-2"
              onClick={handleProgressClick}
            >
              <div 
                className="absolute top-0 left-0 h-full bg-neoYellow border-r-2 border-neoBlack"
                style={{ width: `${progress}%` }}
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-4 h-6 bg-neoBlack border-2 border-white opacity-0 group-hover/progress:opacity-100 transition-opacity"
                style={{ left: `calc(${progress}% - 8px)` }}
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-between items-center text-white">
               <div className="flex gap-4">
                  <button onClick={togglePlay} className="p-2 border-2 border-black bg-neoGreen text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none hover:bg-[#9eff00] transition-colors">
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                  </button>

                  <button onClick={toggleMute} className="p-2 border-2 border-black bg-neoGreen text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none hover:bg-[#9eff00] transition-colors">
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
               </div>
               
               <div>
                  <button onClick={toggleFullscreen} className="p-2 border-2 border-black bg-neoGreen text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none hover:bg-[#9eff00] transition-colors">
                    {isFullscreen ? <Minimize className="w-5 h-5 stroke-[3]" /> : <Maximize className="w-5 h-5 stroke-[3]" />}
                  </button>
               </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-start lg:items-center gap-4 mb-4 flex-col lg:flex-row">
          <h1 className="text-3xl font-black uppercase tracking-tight">{video.title}</h1>
          <div className="font-black text-xl px-4 py-2 bg-neoYellow border-4 border-neoBlack shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase whitespace-nowrap">
            {video.views || 0} Views
          </div>
        </div>
        
        <div className="flex justify-between items-center bg-neoWhite border-4 border-neoBlack shadow-neo p-4 mb-6 relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <Link to={`/u/${video.owner?.username}`}>
              <img src={video.owner?.avatar || "https://ui-avatars.com/api/?name=U"} alt="channel" className="w-14 h-14 rounded-full border-4 border-neoBlack bg-neoYellow object-cover shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-transform" />
            </Link>
            <div>
              <Link to={`/u/${video.owner?.username}`} className="hover:underline decoration-2">
                <h3 className="font-black text-xl leading-tight">{video.owner?.username}</h3>
              </Link>
              <p className="font-bold text-sm text-gray-700">{subscribersCount} subscribers</p>
            </div>
          </div>
          {currentUser?.username !== video.owner?.username ? (
            <button 
               onClick={() => toggleSubscription(video?.owner?._id)}
               disabled={loading}
               className={`neo-btn uppercase tracking-widest text-lg px-6 py-3 relative z-10 ${isSubscribed ? 'bg-pink-400' : 'bg-neoYellow'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
            </button>
          ) : (
            <button className="neo-btn uppercase tracking-widest text-lg px-6 py-3 relative z-10 bg-neoBlue text-white hover:bg-blue-600">
              Edit Video
            </button>
          )}
          
          {/* Decorative shapes behind channel info */}
          <div className="absolute top-0 right-1/4 w-32 h-32 bg-neoBlue/30 rounded-full blur-2xl"></div>
        </div>

        {/* Description Box with Show More */}
        <div className="border-4 border-neoBlack shadow-neo bg-neoGreen mb-8 p-4 cursor-pointer hover:bg-[#b0ff30] transition-colors overflow-hidden" onClick={() => setShowMore(!showMore)}>
           <motion.div 
              initial={false}
              animate={{ height: showMore ? "auto" : "3rem" }}
              transition={{ duration: 0.3, ease: "anticipate" }}
              className="overflow-hidden"
           >
             <p className="font-bold whitespace-pre-wrap">
               {video.description}
             </p>
           </motion.div>
           <div className="font-black uppercase text-sm mt-3 border-t-4 border-neoBlack pt-2 text-right">
             {showMore ? "Show less" : "Show more"}
           </div>
        </div>

        <div>
          <h2 className="font-black text-2xl uppercase mb-6 inline-block bg-neoBlue px-4 py-2 border-4 border-neoBlack shadow-neo text-neoWhite">Comments ({comments.length})</h2>
          
          {currentUser ? (
            <div className="flex gap-4 mb-8">
              <input 
                type="text" 
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Add a bold comment..." 
                className="neo-input flex-1 bg-neoYellow outline-none border-4 border-neoBlack shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#fff700] transition-colors" 
              />
              <button 
                onClick={handlePostComment} 
                disabled={isPostingComment}
                className={`neo-btn bg-neoWhite uppercase border-4 border-neoBlack shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${isPostingComment ? 'opacity-50 cursor-not-allowed' : 'active:translate-y-1 active:translate-x-1 active:shadow-none'}`}
              >
                {isPostingComment ? 'Posting...' : 'Post'}
              </button>
            </div>
          ) : (
            <div className="font-bold text-lg mb-8 uppercase p-4 border-4 border-neoBlack bg-neoYellow shadow-neo text-center">Please sign in to comment.</div>
          )}
          
          <div className="flex flex-col gap-4">
            {comments.map((c) => <Comment key={c._id} comment={c} />)}
          </div>
        </div>
      </div>
      
      {/* 30% Recommended Sidebar */}
      <div className="flex-1 flex flex-col gap-6">
        <h2 className="font-black text-2xl uppercase inline-block bg-neoYellow px-4 py-2 border-4 border-neoBlack shadow-neo mb-2 w-max">Recommended</h2>
        {recLoading ? (
          <>
            {[1, 2, 3].map((_, idx) => (
              <div key={idx} className="neo-card p-0 overflow-hidden flex flex-col h-[280px] bg-neoWhite border-4 border-neoBlack animate-pulse">
                <div className="border-b-4 border-neoBlack h-40 bg-gray-300"></div>
                <div className="p-4 flex gap-3 flex-1">
                   <div className="w-10 h-10 rounded-full border-[3px] border-neoBlack bg-gray-300 shrink-0"></div>
                   <div className="flex flex-col gap-2 w-full">
                     <div className="h-4 bg-gray-300 w-full mb-1"></div>
                     <div className="h-3 bg-gray-300 w-2/3"></div>
                   </div>
                </div>
              </div>
            ))}
          </>
        ) : recommended.length > 0 ? (
          recommended.map(rec => (
            <div key={rec._id}>
               <VideoCard video={rec} />
            </div>
          ))
        ) : (
          <div className="neo-card bg-neoWhite text-center p-8 uppercase font-bold border-dashed border-4 border-neoBlack">
            No recommendations
          </div>
        )}
      </div>
    </div>
  );
};
