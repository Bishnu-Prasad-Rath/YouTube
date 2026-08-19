import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Compass,
  Radio,
  PlaySquare,
  MessageSquare,
  ListVideo,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/axios";

const SidebarSubscriptions = ({ expanded }) => {
  const {
  currentUser,
  subscriptionsVersion,
} = useAuth();
  const [channels, setChannels] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const fetchSubs = async () => {
      try {
        const { data } = await api.get(
  `/subscription/u/${currentUser._id}`,
  {
    headers: {
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
    },
  }
);
        setChannels(data.data || []);
      } catch (err) {
        console.error("Failed to fetch sidebar subs", err);
      }
    };
    fetchSubs();
  }, [currentUser, subscriptionsVersion]);

  if (!currentUser || channels.length === 0) return null;

  const displayedChannels = isExpanded ? channels : channels.slice(0, 5);

  return (
    <div className="flex flex-col gap-4 pt-6 mt-6 mb-4 border-t-4 border-black">
      {expanded && (
        <div className="inline-block px-3 py-1 bg-[#ccff00] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-max mb-2 -rotate-2">
          <h3 className="text-sm font-black tracking-widest text-black uppercase">
            Following
          </h3>
        </div>
      )}

      {displayedChannels.map((sub) => {
        const channel = sub.channel;
        if (!channel) return null;
        const isLive = channel.isLive;

        return (
          <Link
            key={channel._id}
            to={`/u/${channel.username}`}
            className="flex items-center gap-3 p-2 bg-white border-4 border-black transition-all duration-75 group
              shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
              hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-[#ffcc00] 
              active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
          >
            <div
              className={`w-10 h-10 bg-white shrink-0 border-[3px] border-black ${isLive ? "shadow-[4px_4px_0px_0px_#ff0055]" : "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"} group-hover:shadow-none transition-all duration-75 overflow-hidden`}
            >
              <img
                src={channel.avatar}
                alt={channel.username}
                className="object-cover w-full h-full"
              />
            </div>

            {expanded && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-black text-black uppercase truncate">
                  {channel.username}
                </span>
                {isLive && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-white bg-[#ff0055] px-1.5 border-2 border-black w-max mt-0.5 animate-pulse">
                    Live
                  </span>
                )}
              </div>
            )}
          </Link>
        );
      })}

      {channels.length > 5 && expanded && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 py-2 px-4 bg-white font-black uppercase tracking-widest border-4 border-black transition-all duration-75 text-sm
            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
            hover:bg-[#00e5ff] hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] 
            active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
        >
          {isExpanded ? "Show Less" : "Show More"}
        </button>
      )}
    </div>
  );
};

export const Sidebar = ({ expanded }) => {
  const location = useLocation();

  // Links define their unique colors here!
  const links = [
    {
      name: "Home",
      path: "/",
      icon: Home,
      activeClasses: "bg-[#6150C1] text-black",
      hoverClasses: "hover:bg-[#6150C1] hover:text-black",
    },
    {
      name: "Trending",
      path: "/trending",
      icon: Compass,
      activeClasses: "bg-[#ff0055] text-white",
      hoverClasses: "hover:bg-[#ff0055] hover:text-white",
    },
    {
      name: "Live",
      path: "/live",
      icon: Radio,
      activeClasses: "bg-[#D62196] text-black",
      hoverClasses: "hover:bg-[#D62196] hover:text-black",
    },
    {
      name: "Subscriptions",
      path: "/subscriptions",
      icon: PlaySquare,
      activeClasses: "bg-[#00e5ff] text-black",
      hoverClasses: "hover:bg-[#00e5ff] hover:text-black",
    },
    {
      name: "Tweets",
      path: "/tweets",
      icon: MessageSquare,
      activeClasses: "bg-[#b000ff] text-white",
      hoverClasses: "hover:bg-[#b000ff] hover:text-white",
    },
    {
      name: "Playlists",
      path: "/playlists",
      icon: ListVideo,
      activeClasses: "bg-gradient-to-r from-red-500 via-red-500 to-red-500 text-black",
      hoverClasses: "hover:bg-gradient-to-r from-red-500 via-red-500 to-red-500 hover:text-black",
    },
  ];

  return (
    <aside
      // CHANGED: w-72 -> w-64, border-r-[6px] -> border-r-4, px-5 -> px-4
      className={`fixed left-0 top-[84px] h-[calc(100vh-84px)] w-64 border-r-4 border-black bg-[#f4f4f0] z-40 transition-transform duration-300 flex flex-col gap-4 px-4 pt-6 pb-10 overflow-y-auto ${!expanded ? "translate-x-[-100%]" : "translate-x-0"}`}
    >
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = location.pathname === link.path;

        return (
          <Link
            key={link.name}
            to={link.path}
            // ⌨️ THE KEYBOARD EFFECT LOGIC ⌨️
            className={`flex items-center gap-3 p-3 border-4 border-black group transition-all duration-75 flex-shrink-0 font-black uppercase tracking-wide
              shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
              hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] 
              active:translate-x-[4px] active:translate-y-[4px] active:shadow-none
              ${
                isActive
                  ? `${link.activeClasses}` // Colors it if it's the current page
                  : `bg-white text-black ${link.hoverClasses}` // Keeps it white if not, colors on hover
              }
            `}
          >
            <Icon
              className={`w-6 h-6 stroke-[3] transition-transform duration-75 ${!isActive && "group-hover:scale-110 group-hover:-rotate-3"}`}
            />
            <span className="overflow-hidden text-base whitespace-nowrap">
              {link.name}
            </span>
          </Link>
        );
      })}

      <SidebarSubscriptions expanded={expanded} />
    </aside>
  );
};