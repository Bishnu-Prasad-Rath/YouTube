import { useEffect, useState } from "react";
import { api } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { VideoCard } from "../components/VideoCard";

export const Dashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data: statsData } = await api.get("/dashboard/stats");
        setStats(statsData.data);
        const { data: vidsData } = await api.get("/dashboard/videos");
        setVideos(vidsData.data || []);
      } catch (error) {
        console.error(error);
      }
    };
    if (currentUser) fetchDashboard();
  }, [currentUser]);

  if (!currentUser) return <div className="text-center mt-12 font-black text-2xl uppercase">Please Sign In</div>;

  return (
    <div className="px-6 pb-12">
      <div className="flex flex-wrap gap-8 items-center bg-neoYellow neo-card p-8 mb-8 mt-4">
        <img src={currentUser.avatar || "https://ui-avatars.com/api/?name="+currentUser.username} alt="avatar" className="w-32 h-32 rounded-full border-[6px] border-neoBlack shadow-neo object-cover" />
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tight">{currentUser.fullName}</h1>
          <p className="text-xl font-bold bg-neoWhite border-4 border-neoBlack max-w-max px-3 py-1 mt-4 shadow-neo">@{currentUser.username}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="neo-card bg-neoGreen text-center py-8">
          <p className="font-bold text-xl uppercase mb-2">Total Views</p>
          <p className="text-5xl font-black tracking-tighter">{stats?.totalViews || 0}</p>
        </div>
        <div className="neo-card bg-neoBlue text-center py-8">
          <p className="font-bold text-xl uppercase mb-2">Subscribers</p>
          <p className="text-5xl font-black tracking-tighter">{stats?.totalSubscribers || 0}</p>
        </div>
        <div className="neo-card bg-neoWhite text-center py-8">
          <p className="font-bold text-xl uppercase mb-2">Total Likes</p>
          <p className="text-5xl font-black tracking-tighter">{stats?.totalLikes || 0}</p>
        </div>
      </div>

      <h2 className="text-3xl font-black uppercase mb-6 border-b-4 border-neoBlack pb-2">My Channel Videos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {videos.map(v => <VideoCard key={v._id} video={v} />)}
      </div>
    </div>
  );
};
