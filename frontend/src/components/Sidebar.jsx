import { Link, useLocation } from "react-router-dom";
import { Home, Compass, Radio, PlaySquare, MessageSquare, ListVideo } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/axios";

const SidebarSubscriptions = ({ expanded }) => {
  const { currentUser, subscribedChannels } = useAuth();
  const [channels, setChannels] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const fetchSubs = async () => {
      try {
        const { data } = await api.get(`/subscription/u/${currentUser._id}`);
        setChannels(data.data || []);
      } catch (err) {
        console.error("Failed to fetch sidebar subs", err);
      }
    };
    fetchSubs();
  }, [currentUser, subscribedChannels]);

  if (!currentUser || channels.length === 0) return null;

  const displayedChannels = isExpanded ? channels : channels.slice(0, 5);

  return (
    <div className="mt-8 mb-4 flex flex-col gap-4 border-t-4 border-neoBlack pt-4">
      {expanded && <h3 className="font-black uppercase text-sm px-2 text-gray-500 tracking-widest">Following</h3>}
      {displayedChannels.map((sub) => {
        const channel = sub.channel;
        if (!channel) return null;
        const isLive = channel.isLive;

        return (
          <Link
            key={channel._id}
            to={`/u/${channel.username}`}
            className="flex items-center gap-4 group p-2 neo-card border-4 border-transparent hover:border-neoBlack hover:bg-neoWhite transition-colors"
          >
            <div className={`w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0 border-2 ${isLive ? 'border-[#ff0000] border-4 animate-pulse shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'border-neoBlack'}`}>
              <img src={channel.avatar} alt={channel.username} className="w-full h-full object-cover" />
            </div>
            {expanded && (
              <span className={`font-bold text-sm truncate ${isLive ? 'text-[#ff0000]' : 'text-black'}`}>
                {channel.username}
              </span>
            )}
          </Link>
        );
      })}
      
      {channels.length > 5 && expanded && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm font-bold mt-2 hover:bg-[#bef264] border-2 border-transparent hover:border-neoBlack hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none cursor-pointer text-center px-4 py-2 transition-all mx-2"
        >
          {isExpanded ? 'Show Less' : 'Show More'}
        </button>
      )}
    </div>
  );
};

export const Sidebar = ({ expanded }) => {
  const location = useLocation();

  const links = [
    { name: "Home", path: "/", icon: Home },
    { name: "Trending", path: "/trending", icon: Compass },
    { name: "Live", path: "/live", icon: Radio },
    { name: "Subscriptions", path: "/subscriptions", icon: PlaySquare },
    { name: "Tweets", path: "/tweets", icon: MessageSquare },
    { name: "Playlists", path: "/playlists", icon: ListVideo },
  ];

  return (
    <aside className={`fixed left-0 top-[84px] h-[calc(100vh-84px)] w-64 border-r-4 border-black bg-white z-40 transition-transform duration-300 flex flex-col gap-4 px-4 pb-10 overflow-y-auto ${!expanded ? 'translate-x-[-100%]' : 'translate-x-0'}`}>
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = location.pathname === link.path;
        return (
          <Link
            key={link.name}
            to={link.path}
            className={`flex items-center gap-4 p-3 neo-card border-4 border-neoBlack shadow-neo group transition-colors flex-shrink-0 ${
              isActive ? 'bg-neoBlue' : 'bg-neoWhite hover:bg-neoYellow'
            }`}
          >
            <Icon className="w-6 h-6 stroke-[3] group-hover:scale-110 transition-transform" />
            <span className="font-bold text-lg whitespace-nowrap overflow-hidden transition-all duration-300 opacity-100 max-w-[150px]">
              {link.name}
            </span>
          </Link>
        );
      })}
      
      <SidebarSubscriptions expanded={expanded} />
    </aside>
  );
};
