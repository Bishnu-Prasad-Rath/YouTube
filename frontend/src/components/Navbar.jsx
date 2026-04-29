import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Search, Plus, Video, Menu } from "lucide-react";
import { api } from "../api/axios";

export const Navbar = ({ toggleSidebar }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-4 bg-neoWhite border-b-4 border-neoBlack shadow-neo">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="p-2 hover:bg-neoYellow border-4 border-transparent hover:border-neoBlack transition-all active:translate-y-1 active:shadow-none bg-neoWhite group">
           <Menu className="w-6 h-6 stroke-[3] group-active:scale-95" />
        </button>
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-neoYellow p-2 border-4 border-neoBlack shadow-neo group-active:translate-y-1 group-active:translate-x-1 group-active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all">
            <Video className="w-6 h-6 stroke-[3]" />
          </div>
          <span className="text-2xl font-black tracking-tight uppercase hidden sm:block">YT-Neo</span>
        </Link>
      </div>

      <div className="flex-1 max-w-xl mx-8">
        <form onSubmit={handleSearch} className="flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search neo-videos..."
            className="w-full neo-input border-r-0"
          />
          <button type="submit" className="bg-neoBlue border-4 border-neoBlack px-4 py-2 font-bold shadow-neo border-l-0 hover:bg-neoGreen transition-colors active:translate-y-1 active:shadow-none translate-y-[-1px]">
            <Search className="w-5 h-5 mx-auto stroke-[3]" />
          </button>
        </form>
      </div>

      <div className="flex items-center gap-4">
        {currentUser ? (
          <>
            <Link to="/upload" className="neo-btn bg-neoGreen flex items-center gap-1">
              <Plus className="w-5 h-5 stroke-[3]" /> Upload
            </Link>
            <Link 
              to={`/u/${currentUser.username}`}
              onMouseEnter={() => api.get(`/users/c/${currentUser.username}`).catch(() => {})}
            >
              <img
                src={currentUser.avatar || "https://ui-avatars.com/api/?name=" + currentUser.username}
                alt="avatar"
                className="w-12 h-12 rounded-full border-4 border-neoBlack shadow-neo object-cover hover:scale-105 transition-transform"
              />
            </Link>
            <button onClick={logout} className="neo-btn bg-red-400">
              Logout
            </button>
          </>
        ) : (
          <Link to="/auth" className="neo-btn bg-neoYellow">
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
};
