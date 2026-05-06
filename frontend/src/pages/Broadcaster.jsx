import { useEffect, useState, useMemo, useRef } from "react";
import {
  LiveKitRoom,
  useLocalParticipant,
  VideoTrack,
  useConnectionState,
  useParticipants,
  useTrackVolume,
} from "@livekit/components-react";
import {
  Track,
  ConnectionState,
  VideoPresets,
  VideoQuality,
  Room,
} from "livekit-client";
import { api } from "../api/axios";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import "@livekit/components-styles";

const SOCKET_URL = import.meta.env.VITE_API_URL.replace("/api/v1", "");

const ConnectionMonitor = () => {
  const state = useConnectionState();
  useEffect(() => {
    if (state === ConnectionState.Connecting) {
      const timer = setTimeout(() => {
        console.warn("Check your VITE_LIVEKIT_URL in .env!");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state]);
  return null;
};

const CustomControls = ({ containerRef, onEndStream }) => {
  const { localParticipant } = useLocalParticipant();
  const [isSharing, setIsSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isMicEnabled = localParticipant?.isMicrophoneEnabled;
  const isCamEnabled = localParticipant?.isCameraEnabled;

  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedMicId, setSelectedMicId] = useState(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const devices = await Room.getLocalDevices("audioinput");
        console.log("--- AVAILABLE AUDIO DEVICES ---", devices);
        setAudioDevices(devices);
        // Prefer external or USB mics
        const externalMic = devices.find(
          (d) =>
            d.label.toLowerCase().includes("external") ||
            d.label.toLowerCase().includes("usb"),
        );
        if (externalMic) {
          console.log("Found External Mic:", externalMic.label);
          setSelectedMicId(externalMic.deviceId);
        } else if (devices.length > 0) {
          setSelectedMicId(devices[0].deviceId);
        }
      } catch (err) {
        console.error("Could not fetch audio devices", err);
      }
    };
    fetchDevices();
  }, []);

  const micPub = localParticipant?.getTrackPublication(Track.Source.Microphone);
  const volume = useTrackVolume(micPub?.track);

  const toggleMic = async () => {
    if (!localParticipant) return;
    try {
      if (!isMicEnabled) {
        console.log("Enabling mic with deviceId:", selectedMicId || "default");
        await localParticipant.setMicrophoneEnabled(true, {
          deviceId: selectedMicId || "default",
        });
      } else {
        await localParticipant.setMicrophoneEnabled(false);
      }
    } catch (error) {
      console.error("Mic Error:", error);
      if (
        error.name === "NotAllowedError" ||
        error.message?.includes("Permission denied")
      ) {
        alert(
          "🚨 MIC BLOCKED: Please click the 'Lock' icon next to the URL bar at the top of your browser, allow Microphone access, and refresh the page.",
        );
      } else {
        alert(
          "❌ MIC ERROR: Could not access your microphone. Make sure it is plugged in.",
        );
      }
    }
  };

  const toggleCam = async () => {
    if (!localParticipant) return;
    try {
      await localParticipant.setCameraEnabled(!isCamEnabled);
    } catch (error) {
      console.error("Camera Error:", error);
      if (
        error.name === "NotAllowedError" ||
        error.message?.includes("Permission denied")
      ) {
        alert(
          "🚨 CAMERA BLOCKED: Please click the 'Lock' icon next to the URL bar at the top of your browser, allow Camera access, and refresh the page.",
        );
      } else if (
        error.name === "NotReadableError" ||
        error.message?.includes("Device in use")
      ) {
        alert(
          "⚠️ CAMERA IN USE: Another app (like Zoom, Teams, or OBS) is currently using your camera. Please close that app and try again.",
        );
      } else {
        alert(
          "❌ HARDWARE ERROR: Could not start the camera. Please make sure it is plugged in and turned on.",
        );
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!localParticipant) return;
    try {
      await localParticipant.setScreenShareEnabled(!isSharing, { audio: true });
      setIsSharing(!isSharing);
    } catch (error) {
      console.error("Screen Share Error:", error);
      if (error.name === "NotAllowedError") {
        // The user clicked "Cancel" on the screen share popup.
        // We just log it quietly instead of showing an alert to avoid annoying them.
        console.log("User canceled screen share selection.");
      } else {
        alert(
          "❌ SCREEN SHARE ERROR: Your browser or operating system is blocking screen recording. Check your Mac/Windows system settings.",
        );
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        console.error(
          `Error attempting to enable full-screen mode: ${err.message}`,
        );
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  return (
    <div className="absolute z-30 flex flex-wrap items-center justify-center gap-4 p-4 transition-transform -translate-x-1/2 rounded-md bottom-6 left-1/2 hover:-translate-y-1 neo-player-controls w-max">
      <div className="flex items-center gap-2">
        <button
          onClick={toggleMic}
          className={`neo-player-btn px-4 py-2 ${isMicEnabled ? "bg-neoGreen text-black hover:text-black hover:bg-white" : "bg-neoRed text-white hover:text-black"}`}
        >
          {isMicEnabled ? "MIC ON" : "MIC OFF"}
        </button>
        {isMicEnabled && (
          <div className="flex items-end h-8 gap-1 px-2 bg-black border-2 border-white">
            <div
              className="w-2 transition-all duration-75 bg-neoGreen"
              style={{ height: Math.max(4, volume * 100) + "%" }}
            />
            <div
              className="w-2 transition-all duration-75 delay-75 bg-neoGreen"
              style={{ height: Math.max(4, volume * 80) + "%" }}
            />
            <div
              className="w-2 transition-all duration-75 delay-150 bg-neoGreen"
              style={{
                height:
                  Math.max(4, volume * 120 > 100 ? 100 : volume * 120) + "%",
              }}
            />
          </div>
        )}
      </div>

      <button
        onClick={toggleCam}
        className={`neo-player-btn px-4 py-2 ${isCamEnabled ? "bg-neoGreen text-black hover:text-black hover:bg-white" : "bg-neoRed text-white hover:text-black"}`}
      >
        {isCamEnabled ? "CAM ON" : "CAM OFF"}
      </button>

      <button
        onClick={toggleScreenShare}
        className={`neo-player-btn px-4 py-2 ${isSharing ? "bg-neoPink text-white hover:text-black" : "bg-black text-white hover:text-black"}`}
      >
        {isSharing ? "STOP SHARE" : "SCREEN + AUDIO"}
      </button>

      <button
        onClick={toggleFullscreen}
        className="px-4 py-2 text-white bg-black neo-player-btn hover:text-black"
      >
        {isFullscreen ? "EXIT FULL" : "FULLSCREEN"}
      </button>

      <button
        onClick={onEndStream}
        className="px-4 py-2 text-white neo-player-btn bg-neoRed border-neoRed hover:text-black"
      >
        END STREAM
      </button>
    </div>
  );
};

const MainVideoArea = ({ containerRef, onEndStream }) => {
  const { localParticipant } = useLocalParticipant();

  const screenPub = localParticipant?.getTrackPublication(
    Track.Source.ScreenShare,
  );
  const cameraPub = localParticipant?.getTrackPublication(Track.Source.Camera);

  // Fullscreen API Listener for High-Definition
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement;
      if (screenPub && isFullscreen) {
        // Ensure broadcast sends high quality when in fullscreen
        screenPub.setVideoQuality(VideoQuality.HIGH);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [screenPub]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black border-4 border-neoBlack overflow-hidden shadow-[inset_0px_0px_20px_rgba(0,0,0,0.8)] group"
    >
      {/* Screen Share (Background) */}
      {screenPub?.track ? (
        <VideoTrack
          trackRef={{
            participant: localParticipant,
            source: Track.Source.ScreenShare,
            publication: screenPub,
          }}
          className="absolute inset-0 z-0 object-contain w-full h-full"
        />
      ) : (
        <div className="absolute inset-0 z-0 flex items-center justify-center p-6 text-3xl font-black tracking-widest text-white uppercase animate-pulse">
          Awaiting Screen Share...
        </div>
      )}

      {/* Camera Overlay (Face-Cam) */}
      {cameraPub?.track && (
        <div className="absolute top-6 right-6 z-20 w-48 lg:w-64 aspect-video border-4 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-black overflow-hidden pointer-events-none">
          <VideoTrack
            trackRef={{
              participant: localParticipant,
              source: Track.Source.Camera,
              publication: cameraPub,
            }}
            className="object-cover w-full h-full"
          />
        </div>
      )}

      <CustomControls containerRef={containerRef} onEndStream={onEndStream} />
    </div>
  );
};

const MetricsPanel = () => {
  const participants = useParticipants();
  const state = useConnectionState();

  const metricsContent = useMemo(() => {
    return (
      <div className="relative z-10 flex items-center justify-between p-4 border-b-8 bg-neoWhite border-neoBlack">
        <div className="flex flex-col">
          <span className="text-sm font-black text-gray-800 uppercase">
            Viewers
          </span>
          <span className="text-3xl font-black">
            {Math.max(0, participants.length - 1)}
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="mb-1 text-sm font-black text-gray-800 uppercase">
            Status
          </span>
          <span
            className={`font-black text-xs uppercase px-3 py-1 border-2 border-black ${state === ConnectionState.Connected ? "bg-neoGreen shadow-[2px_2px_0_0_rgba(0,0,0,1)]" : "bg-neoYellow"}`}
          >
            {state}
          </span>
        </div>
      </div>
    );
  }, [participants.length, state]);

  return metricsContent;
};

const CustomChat = ({ liveId, isBroadcaster }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!liveId) return;

    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
    });

    socketRef.current.emit("join-live", liveId);

    if (isBroadcaster) {
      socketRef.current.emit("broadcaster-connected", liveId);
    }

    socketRef.current.on("new-message", (msg) => {
      setMessages((prev) => [...prev, msg].slice(-50));
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [liveId, isBroadcaster]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && socketRef.current) {
      socketRef.current.emit("chat-message", { liveId, message: input });
      setInput("");
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col h-full pt-16 bg-zinc-900">
      <div className="flex flex-col flex-1 gap-4 p-4 overflow-y-auto">
        {messages.length === 0 && (
          <p className="mt-4 text-sm font-bold text-center text-gray-500 uppercase">
            Chat is quiet...
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className="font-bold flex flex-col gap-1 p-3 border-4 border-neoBlack bg-black shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] text-sm relative self-start max-w-[90%] mt-2"
          >
            <span className="text-yellow-400 uppercase break-words text-xs tracking-wider absolute top-[-10px] bg-neoBlack border-2 border-neoBlack px-2 py-0.5 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] -rotate-2">
              @{m.user?.username || "Broadcaster"}
            </span>
            <span className="mt-2 text-base text-white break-words">
              {m.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex gap-0 mt-auto border-t-4 border-neoBlack shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type message..."
          className="flex-1 min-w-0 px-4 py-4 font-bold placeholder-gray-500 outline-none bg-neoWhite"
        />
        <button
          type="submit"
          className="px-6 font-black uppercase transition-colors bg-neoBlack text-neoWhite hover:bg-gray-800"
        >
          SEND
        </button>
      </form>
    </div>
  );
};

const LiveChatArea = ({ liveId, isBroadcaster }) => {
  return (
    <div className="relative flex flex-col flex-1 min-h-0 bg-zinc-900">
      <div className="absolute top-0 w-full p-4 bg-neoYellow border-b-4 border-neoBlack font-black text-xl uppercase tracking-widest text-center shadow-[0_4px_0_0_rgba(0,0,0,1)] z-10">
        Live Chat
      </div>
      <div className="relative flex-1 w-full overflow-hidden">
        {/* Pass it down here 👇 */}
        <CustomChat liveId={liveId} isBroadcaster={isBroadcaster} />
      </div>
    </div>
  );
};

export const Broadcaster = () => {
  const [token, setToken] = useState("");
  const [liveId, setLiveId] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [title, setTitle] = useState("");
  const navigate = useNavigate();
  const videoContainerRef = useRef(null);

  const isLiveRef = useRef(isLive);
  const liveIdRef = useRef(liveId);

  //  2. KEEP REFS IN SYNC
  useEffect(() => {
    isLiveRef.current = isLive;
    liveIdRef.current = liveId;
  }, [isLive, liveId]);

  // 👇 3. THE TAB-CLOSE GHOST BUSTER 👇
  useEffect(() => {
    const killStreamOnExit = () => {
      // If the user is live and we have an ID, kill it!
      if (isLiveRef.current && liveIdRef.current) {
        const baseUrl = import.meta.env.VITE_API_URL;

        // fetch with 'keepalive' forces the request to finish even if the tab closes!
        fetch(`${baseUrl}/live/end/${liveIdRef.current}`, {
          method: "PATCH",
          keepalive: true,
          credentials: "include", // Keeps your auth working
        }).catch(console.error);
      }
    };

    // Fires when closing the tab or hitting refresh
    window.addEventListener("beforeunload", killStreamOnExit);

    // Fires when clicking a link to navigate away (like hitting the 'Back' button)
    return () => {
      window.removeEventListener("beforeunload", killStreamOnExit);
      killStreamOnExit();
    };
  }, []);

  useEffect(() => {
    const cleanOldStreams = async () => {
      try {
        await api.get("/live/util/cleanup");
        console.log("System check: Zombie streams wiped out!");
      } catch (error) {
        console.error("Failed to clean up stuck streams:", error);
      }
    };

    cleanOldStreams();
  }, []);

  const handleStartStream = async () => {
    if (!title) return alert("Enter a stream title!");
    try {
      const res = await api.post("/live/start", { title });
      const streamId = res.data.data._id;
      setLiveId(streamId);

      const tokenRes = await api.get(`/live/get-token/${streamId}`);
      const jwtToken = tokenRes.data.data.token;

      if (typeof jwtToken !== "string") {
        console.error("Token is not a string!", jwtToken);
        return;
      }

      setToken(jwtToken);
      setIsLive(true);
    } catch (error) {
      console.error(error);
      alert("Failed to start stream");
    }
  };

  const handleEndStream = async () => {
    try {
      // Tell the Ghost Buster we are handling it manually, so it doesn't double-fire!
      isLiveRef.current = false;

      await api.patch(`/live/end/${liveId}`);
      setIsLive(false);
      navigate("/live");
    } catch (err) {
      // If it fails, turn the Ghost Buster back on
      isLiveRef.current = true;
      console.error(err);
    }
  };

  const roomOptions = useMemo(
    () => ({
      adaptiveStream: { pixelDensity: "screen" }, // Move here
      dynacast: true, // Move here
      publishDefaults: {
        simulcast: true,
        videoEncoding: VideoPresets.h1080.encoding,
        videoSimulcastLayers: [VideoPresets.h1080, VideoPresets.h720],
      },
      audioCaptureDefaults: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    }),
    [],
  );

  return (
    <div className="max-w-[1800px] mx-auto px-6 pb-12 pt-8 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-black uppercase inline-block bg-neoYellow border-4 border-black px-4 py-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          Pro Studio
        </h1>
        {isLive && (
          <button
            onClick={handleEndStream}
            className="bg-[#ff0055] text-white border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-[#ffaa00] hover:text-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 active:shadow-none active:translate-y-[6px] active:translate-x-[6px] transition-all font-black text-lg uppercase tracking-widest py-3 px-8"
          >
            End Stream
          </button>
        )}
      </div>

      {!isLive ? (
        <div className="neo-card bg-neoWhite max-w-xl mx-auto border-4 border-neoBlack shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] p-8 mt-12 w-full">
          <h2 className="mb-6 text-3xl font-black text-center uppercase">
            Setup Transmission
          </h2>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ENTER STREAM TITLE..."
            className="neo-input bg-neoWhite font-bold border-4 border-neoBlack shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full mb-8 text-xl p-4 outline-none focus:-translate-y-1 transition-transform"
          />
          <button
            onClick={handleStartStream}
            className="neo-btn bg-neoGreen text-black font-black text-2xl uppercase w-full border-4 border-neoBlack shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-[#8fff00] transition-colors py-4 active:translate-y-2 active:translate-x-2 active:shadow-none"
          >
            Go Live
          </button>
        </div>
      ) : (
        <div className="flex-1 border-8 border-neoBlack shadow-[15px_15px_0px_0px_#00E1FF] bg-zinc-900 overflow-hidden relative rounded-xl">
          {token && typeof token === "string" && (
            <LiveKitRoom
              video={true}
              audio={true}
              token={token}
              serverUrl={
                import.meta.env.VITE_LIVEKIT_URL ||
                "wss://yt-project-nmm37dpf.livekit.cloud"
              }
              connect={true}
              options={roomOptions} // These are now handled inside roomOptions
              className="flex flex-col w-full h-full lg:flex-row"
              onDisconnected={() => alert("LiveKit disconnected natively.")}
              onError={(err) => alert("LiveKit Fatal Error: " + err.message)}
            >
              <ConnectionMonitor />

              {/* Left Column: 75% Main Video */}
              <div className="w-full lg:w-[75%] h-[50vh] lg:h-full p-4 lg:p-6 flex flex-col relative z-0">
                <MainVideoArea
                  containerRef={videoContainerRef}
                  onEndStream={handleEndStream}
                />
              </div>

              {/* Right Column: 25% Chat & Metrics */}
              <div className="w-full lg:w-[25%] h-[50vh] lg:h-full border-t-8 lg:border-t-0 lg:border-l-8 border-neoBlack bg-zinc-900 flex flex-col relative z-10">
                <MetricsPanel />
                <LiveChatArea liveId={liveId} isBroadcaster={true} />
              </div>
            </LiveKitRoom>
          )}
        </div>
      )}
    </div>
  );
};
