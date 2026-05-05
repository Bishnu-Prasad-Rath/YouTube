import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { api } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { LiveKitRoom, useParticipants, useConnectionState, useTracks, VideoTrack, AudioTrack } from "@livekit/components-react";
import { ConnectionState, Track, VideoQuality } from "livekit-client";
import "@livekit/components-styles";
import { LiveBadge } from "../components/LiveBadge";
import { Settings, Heart } from "lucide-react";

const SOCKET_URL = import.meta.env.VITE_API_URL.replace("/api/v1", ""); // Ideally from env

const ConnectionMonitor = () => {
    const state = useConnectionState();
    useEffect(() => {
        if (state === ConnectionState.Connecting) {
            const timer = setTimeout(() => {
                console.warn('Check your VITE_LIVEKIT_URL in .env!');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [state]);
    return null;
};

const LiveStreamHeader = () => {
    const participants = useParticipants();
    return (
        <div className="absolute z-20 flex gap-4 top-6 left-6">
            <LiveBadge viewers={Math.max(0, participants.length - 1)} />
        </div>
    );
};

const ViewerControls = ({ isPlaying, setIsPlaying, volume, setVolume, containerRef, setForcedQuality, forcedQuality }) => {
    const [showSettings, setShowSettings] = useState(false);

    const controls = useMemo(() => {
        const toggleFullscreen = () => {
            if (!document.fullscreenElement) {
                containerRef.current?.requestFullscreen().catch(err => {
                    console.error(`Error attempting to enable full-screen mode: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        };

        const handleQualitySelect = (q) => {
            setForcedQuality(q);
            setShowSettings(false);
        };

        return (
            <>
            <div className="absolute z-30 flex flex-wrap items-center justify-center gap-4 p-4 transition-transform -translate-x-1/2 rounded-md bottom-6 left-1/2 hover:-translate-y-1 neo-player-controls w-max">
                <button 
                   onClick={() => setIsPlaying(!isPlaying)}
                   className="px-6 py-2 text-white bg-black neo-player-btn"
                >
                   {isPlaying ? "PAUSE" : "PLAY"}
                </button>
                <div className="flex items-center h-10 gap-3 px-4 border-white border-x-2">
                    <span className="text-sm font-black text-white uppercase">VOL</span>
                    <input 
                       type="range" 
                       min="0" max="1" step="0.05" 
                       value={volume} 
                       onChange={(e) => setVolume(parseFloat(e.target.value))} 
                       className="w-24 h-2 bg-white rounded-lg appearance-none cursor-pointer accent-neoYellow"
                    />
                </div>
                
                <div className="relative flex items-center h-10 px-4 border-r-2 border-white">
                    <div 
                        role="button"
                        onClick={() => setShowSettings(!showSettings)}
                        className="flex items-center justify-center text-white transition-colors cursor-pointer hover:text-neoYellow"
                    >
                        <Settings size={24} />
                    </div>
                </div>

                <button 
                   onClick={toggleFullscreen}
                   className="px-6 py-2 text-white bg-black neo-player-btn"
                >
                   FULLSCREEN
                </button>
            </div>
            
            {showSettings && (
                <div className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-neoWhite border-4 border-neoBlack shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col p-2 min-w-[150px] z-[9999]">
                    <div role="button" onClick={(e) => { e.preventDefault(); e.nativeEvent.stopImmediatePropagation(); e.stopPropagation(); handleQualitySelect(VideoQuality.HIGH); }} className="flex items-center justify-between px-4 py-2 font-black text-left text-black uppercase border-b-2 border-transparent cursor-pointer hover:bg-neoYellow hover:border-black">
                        1080p {forcedQuality === VideoQuality.HIGH && <span className="font-black text-black">✓</span>}
                    </div>
                    <div role="button" onClick={(e) => { e.preventDefault(); e.nativeEvent.stopImmediatePropagation(); e.stopPropagation(); handleQualitySelect(VideoQuality.MEDIUM); }} className="flex items-center justify-between px-4 py-2 font-black text-left text-black uppercase border-b-2 border-transparent cursor-pointer hover:bg-neoYellow hover:border-black">
                        720p {forcedQuality === VideoQuality.MEDIUM && <span className="font-black text-black">✓</span>}
                    </div>
                    <div role="button" onClick={(e) => { e.preventDefault(); e.nativeEvent.stopImmediatePropagation(); e.stopPropagation(); handleQualitySelect(VideoQuality.LOW); }} className="flex items-center justify-between px-4 py-2 font-black text-left text-black uppercase border-b-2 border-transparent cursor-pointer hover:bg-neoYellow hover:border-black">
                        360p {forcedQuality === VideoQuality.LOW && <span className="font-black text-black">✓</span>}
                    </div>
                    <div role="button" onClick={(e) => { e.preventDefault(); e.nativeEvent.stopImmediatePropagation(); e.stopPropagation(); handleQualitySelect("AUTO"); }} className="flex items-center justify-between px-4 py-2 font-black text-left text-black uppercase border-b-2 border-transparent cursor-pointer hover:bg-neoYellow hover:border-black">
                        Auto {forcedQuality === "AUTO" && <span className="font-black text-black">✓</span>}
                    </div>
                </div>
            )}
            </>
        );
    }, [isPlaying, setIsPlaying, volume, setVolume, containerRef, showSettings, setForcedQuality, forcedQuality]);

    return controls;
};

const ViewerVideoArea = () => {
    const videoTracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], { onlySubscribed: true });
    const audioTracks = useTracks([Track.Source.Microphone, Track.Source.ScreenShareAudio], { onlySubscribed: true });

    const screenTrack = videoTracks.find(t => t.source === Track.Source.ScreenShare);
    const camTrack = videoTracks.find(t => t.source === Track.Source.Camera);

    const [isPlaying, setIsPlaying] = useState(true);
    const [volume, setVolume] = useState(1);
    const [forcedQuality, setForcedQuality] = useState("AUTO");
    const containerRef = useRef(null);

    useEffect(() => {
        if (screenTrack?.publication) {
            if (forcedQuality === "AUTO") {
                // Remove override by setting to highest or letting adaptive take over.
                // LiveKit's adaptiveStream will naturally control it, but if we forced it earlier,
                // we might need to reset. Typically setting to HIGH re-enables standard scale if adaptive is on.
                screenTrack.publication.setVideoQuality(VideoQuality.HIGH);
            } else {
                screenTrack.publication.setVideoQuality(forcedQuality);
            }
        }
        if (camTrack?.publication && forcedQuality !== "AUTO") {
             // Scale camera track down if user explicitly wants low quality
             camTrack.publication.setVideoQuality(forcedQuality);
        }
    }, [forcedQuality, screenTrack, camTrack]);

    // Fullscreen API Listener for High-Definition
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFullscreen = !!document.fullscreenElement;
            if (screenTrack?.publication && forcedQuality === "AUTO") {
                if (isFullscreen) {
                    screenTrack.publication.setVideoQuality(VideoQuality.HIGH);
                }
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [screenTrack, forcedQuality]);

    const videoContent = useMemo(() => {
        return (
            <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center shadow-[inset_0px_0px_20px_rgba(0,0,0,0.8)] group">
                {isPlaying ? (
                    <>
                        {/* Screen Share Background */}
                        {screenTrack ? (
                            <VideoTrack 
                                trackRef={screenTrack} 
                                className="absolute inset-0 z-0 object-contain w-full h-full"
                            />
                        ) : (
                            <div className="absolute inset-0 z-0 flex items-center justify-center p-6 text-3xl font-black tracking-widest text-white uppercase animate-pulse">
                                Awaiting Screen Share...
                            </div>
                        )}

                        {/* Camera Overlay */}
                        {camTrack && (
                            <div className="absolute top-6 right-6 z-20 w-48 lg:w-64 aspect-video border-4 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-black overflow-hidden pointer-events-none">
                                <VideoTrack 
                                    trackRef={camTrack} 
                                    className="object-cover w-full h-full" 
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex w-full h-full items-center justify-center text-white font-black text-3xl uppercase tracking-widest border-4 border-white p-6 shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
                        PAUSED
                    </div>
                )}

                {isPlaying && audioTracks.length > 0 && (
                    <AudioTrack 
                        trackRef={audioTracks[0]}
                        volume={volume}
                    />
                )}

                <LiveStreamHeader />
                <ViewerControls 
                    isPlaying={isPlaying} 
                    setIsPlaying={setIsPlaying} 
                    volume={volume} 
                    setVolume={setVolume} 
                    containerRef={containerRef} 
                    setForcedQuality={setForcedQuality}
                    forcedQuality={forcedQuality}
                />
            </div>
        );
    }, [isPlaying, volume, screenTrack, camTrack, audioTracks, forcedQuality]);

    return videoContent;
};

export const LiveStream = () => {
  const { liveId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [token, setToken] = useState("");
  const [liveDetails, setLiveDetails] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [totalLikes, setTotalLikes] = useState(0);
  const [toastMsg, setToastMsg] = useState("");

  const socketRef = useRef();
  const chatBottomRef = useRef(null);

  const showToast = (msg) => {
      setToastMsg(msg);
      setTimeout(() => setToastMsg(""), 3000);
  };

  useEffect(() => {
  // ✅ Validate Mongo ObjectId (24 hex chars)
  const isValidId = /^[0-9a-fA-F]{24}$/.test(liveId);

  if (!liveId || !isValidId) {
    console.log("❌ Invalid liveId, skipping API calls:", liveId);
    return;
  }

    if (liveId) {
      // Fetch full live metadata
      api.get(`/live/${liveId}`)
        .then(res => {
            setLiveDetails(res.data.data);
            if (currentUser && res.data.data?.streamer?._id) {
                 api.get(`/subscription/u/${currentUser._id}`)
                    .then(subRes => {
                        const subs = subRes.data.data;
                        setIsSubscribed(subs.some(s => s.channel._id === res.data.data.streamer._id));
                    }).catch(console.error);
            }
        })
        .catch(console.error);
      api.get(`/live/get-token/${liveId}`)
         .then(res => {
             const jwtToken = res.data.data.token;
             if (typeof jwtToken !== 'string') {
                 console.error('Token is not a string!', jwtToken);
                 return;
             }
             setToken(jwtToken);
         })
         .catch(err => console.error("Token err:", err));

      socketRef.current = io(SOCKET_URL, {
        withCredentials: true
      });
      
      socketRef.current.emit("join-live", liveId);
      
      socketRef.current.on("new-message", (msg) => {
        setMessages(prev => [...prev, msg].slice(-50)); 
      });

      socketRef.current.on("live:like", (data) => {
        setTotalLikes(data.totalLikes);
        // Optional: show local heart animation on received likes
      });

      return () => {
        socketRef.current.disconnect();
      };
    }
  }, [liveId, currentUser, navigate]);

  const handleSubscribe = async () => {
      if (!currentUser) return showToast("You must be logged in to engage!");
      if (!liveDetails?.streamer?._id) return;
      try {
          await api.post(`/subscription/c/${liveDetails.streamer._id}`);
          setIsSubscribed(!isSubscribed);
      } catch (err) {
          console.error(err);
      }
  };

  const handleLike = async () => {
      if (!currentUser) return showToast("You must be logged in to engage!");
      try {
          const res = await api.post(`/like/toggle/l/${liveId}`);
          setTotalLikes(res.data.data.totalLikes);
      } catch (err) {
          console.error(err);
      }
  };

  useEffect(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socketRef.current.emit("chat-message", { liveId, message: chatInput });
    setChatInput("");
  };

  if (!liveId) return <div className="max-w-sm mx-auto mt-12 text-2xl font-black text-center uppercase border-4 neo-card shadow-neo bg-neoYellow">Starting stream room...</div>;

  return (
    <div className="max-w-[1600px] mx-auto px-6 pb-12 pt-4 flex flex-col xl:flex-row gap-8 h-[calc(100vh-100px)]">
      {/* Primary Live Video Area */}
      <div className="flex-1 flex flex-col h-full min-h-[500px]">
        <div className="border-8 border-neoBlack shadow-[15px_15px_0px_0px_#00E1FF] bg-zinc-900 overflow-hidden h-full min-h-[500px] relative">
          {token && typeof token === 'string' ? (
            <LiveKitRoom
              video={false}
              audio={false}
              token={token}
              serverUrl={import.meta.env.VITE_LIVEKIT_URL || 'wss://yt-project-nmm37dpf.livekit.cloud'}
              connect={true}
              adaptiveStream={{ pixelDensity: 'screen' }}
              dynacast={true}
              className="relative w-full h-full"
              onDisconnected={() => console.log("LiveKit disconnected natively")}
              onError={(err) => console.error("LiveKit Fatal Error: " + err.message)}
            >
              <ConnectionMonitor />
              <ViewerVideoArea />
            </LiveKitRoom>
          ) : (
            <div className="flex items-center justify-center w-full h-full p-12 border-b-4 border-white text-neoWhite bg-zinc-900">
              <h2 className="text-4xl lg:text-6xl font-black bg-neoRed inline-block px-8 py-4 border-4 border-neoWhite -rotate-2 shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] tracking-widest uppercase">
                TUNING IN...
              </h2>
            </div>
          )}
        </div>
        
        {/* Engagement Bar */}
        <div className="neo-card bg-neoWhite p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-4 border-neoBlack mt-6 relative">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border-4 border-neoBlack overflow-hidden bg-zinc-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                   {liveDetails?.streamer?.avatar ? (
                      <img src={liveDetails.streamer.avatar} alt="avatar" className="object-cover w-full h-full" />
                   ) : (
                      <div className="flex items-center justify-center w-full h-full font-black text-white">?</div>
                   )}
                </div>
                <div>
                   <h1 className="text-2xl font-black text-black uppercase">{liveDetails?.title || "Live Transmission"}</h1>
                   <p className="mt-1 font-bold text-gray-800 uppercase">@{liveDetails?.streamer?.username || "Broadcaster"}</p>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                <button 
                   onClick={handleLike}
                   className="flex items-center gap-2 neo-btn bg-neoYellow px-6 py-3 border-4 border-neoBlack shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-300 transition-colors font-black uppercase active:translate-y-1 active:translate-x-1 active:shadow-none"
                >
                   <Heart size={24} className="fill-black" />
                   <span className="text-xl">{totalLikes}</span>
                </button>
                <button 
                   onClick={handleSubscribe}
                   className={`neo-btn px-6 py-3 border-4 border-neoBlack font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-colors ${isSubscribed ? 'bg-gray-400 text-gray-800' : 'bg-neoCyan text-black hover:bg-cyan-300'}`}
                >
                   {isSubscribed ? "SUBSCRIBED" : "SUBSCRIBE"}
                </button>
            </div>
            
            {toastMsg && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-neoRed text-white font-black border-4 border-neoBlack px-6 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase whitespace-nowrap z-50 animate-bounce">
                    {toastMsg}
                </div>
            )}
        </div>
      </div>

      {/* Sticky Right Sidebar for Chat */}
      <div className="w-full xl:w-[450px] shrink-0 sticky top-4 border-t-8 lg:border-t-0 lg:border-l-8 border-neoBlack bg-zinc-900 flex flex-col h-[500px] xl:h-full p-0">
        <h3 className="p-4 text-xl font-black leading-none tracking-wide text-center text-black uppercase border-b-4 border-neoBlack bg-neoYellow">Live Chat</h3>
        
        <div className="flex flex-col flex-1 gap-4 p-4 overflow-y-auto">
          {messages.length === 0 && (
             <p className="mt-4 text-sm font-bold text-center text-gray-500 uppercase">Chat is quiet...</p>
          )}
          {messages.map((m, i) => (
             <div key={i} className="font-bold flex flex-col gap-1 p-3 border-4 border-neoBlack bg-black shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] text-sm relative self-start max-w-[90%] mt-2">
                <span className="text-yellow-400 uppercase break-words text-xs tracking-wider absolute top-[-10px] bg-neoBlack border-2 border-neoBlack px-2 py-0.5 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] -rotate-2">
                  @{m.user?.username || 'Guest'}
                </span>
                <span className="mt-2 text-base text-white break-words">{m.message}</span>
             </div>
          ))}
          <div ref={chatBottomRef} />
        </div>
        
        <form onSubmit={sendChat} className="flex gap-0 mt-auto border-t-4 border-neoBlack shrink-0">
          <input 
            type="text" 
            value={chatInput} 
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type message..." 
            className="flex-1 min-w-0 px-4 py-4 font-bold placeholder-gray-500 outline-none bg-neoWhite" 
          />
          <button type="submit" className="px-6 font-black uppercase transition-colors bg-neoBlack text-neoWhite hover:bg-gray-800">
            SEND
          </button>
        </form>
      </div>
    </div>
  );
};
