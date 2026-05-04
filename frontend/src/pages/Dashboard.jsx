import { useEffect, useState } from "react";
import { api } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { VideoCard } from "../components/VideoCard";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export const Dashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data: statsData } = await api.get("/dashboard/stats");
        setStats(statsData.data);

        const { data: vidsData } = await api.get("/dashboard/videos");
        setVideos(vidsData.data || []);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) fetchDashboard();
  }, [currentUser]);

  if (!currentUser)
    return (
      <div className="p-12 mt-12 text-2xl font-black text-center uppercase">
        Please Sign In
      </div>
    );
  if (loading)
    return (
      <div className="p-12 mt-12 text-2xl font-black text-center uppercase animate-pulse">
        Loading Data...
      </div>
    );

  return (
    <div className="max-w-[1200px] mx-auto px-6 pb-12 pt-8">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
        <div className="p-6 bg-white border-4 border-neoBlack shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <p className="mb-2 text-xl font-black uppercase">Total Views</p>
          <p className="text-5xl font-black tracking-tighter">
            {stats?.totalViews || 0}
          </p>
        </div>
        <div className="p-6 bg-white border-4 border-neoBlack shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <p className="mb-2 text-xl font-black uppercase">Subscribers</p>
          <p className="text-5xl font-black tracking-tighter">
            {stats?.totalSubscribers || 0}
          </p>
        </div>
        <div className="p-6 bg-white border-4 border-neoBlack shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <p className="mb-2 text-xl font-black uppercase">Total Likes</p>
          <p className="text-5xl font-black tracking-tighter">
            {stats?.totalLikes || 0}
          </p>
        </div>
      </div>

      {/* Analytics Graph */}
      <div className="p-6 mb-8 bg-white border-4 border-neoBlack shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="pb-2 mb-6 text-2xl font-black uppercase border-b-4 border-neoBlack">
          Performance Analytics
        </h2>
        <div className="w-full h-[300px]">
          {stats?.performanceGraph && stats.performanceGraph.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={stats.performanceGraph}
                margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#000"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#000"
                  tick={{ fontFamily: "inherit", fontWeight: 900 }}
                />
                <YAxis
                  stroke="#000"
                  tick={{ fontFamily: "inherit", fontWeight: 900 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "4px solid #000",
                    borderRadius: "0",
                    boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
                  }}
                  itemStyle={{ fontWeight: 900, color: "#000" }}
                />
                <Line 
  // Make the line type dynamic based on how many videos you have!
  type={stats.performanceGraph.length > 2 ? "monotone" : "linear"} 
  
  dataKey="views" 
  stroke="#FF0055" 
  strokeWidth={6} 
  dot={{ r: 6, fill: '#8fff00', stroke: '#000', strokeWidth: 3 }} 
  activeDot={{ r: 8 }} 
/>
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center w-full h-full font-bold text-gray-400 uppercase">
              Not enough data to graph
            </div>
          )}
        </div>
      </div>

      {/* Top Tweets */}
      <div className="p-6 mb-12 bg-white border-4 border-neoBlack shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="pb-2 mb-6 text-2xl font-black uppercase border-b-4 border-neoBlack">
          Top Performing Tweets
        </h2>
        <div className="flex flex-col gap-4">
          {stats?.topTweets && stats.topTweets.length > 0 ? (
            stats.topTweets.map((tweet) => (
              <div
                key={tweet._id}
                className="p-4 border-4 bg-neoYellow border-neoBlack shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center"
              >
                <p className="font-bold">{tweet.content}</p>
                <div className="px-3 py-1 font-black bg-white border-2 border-neoBlack">
                  ❤️ {tweet.likes}
                </div>
              </div>
            ))
          ) : (
            <p className="font-bold text-gray-500 uppercase">
              No tweets posted yet.
            </p>
          )}
        </div>
      </div>

      {/* Video Grid */}
      <h2 className="pb-2 mb-6 text-3xl font-black uppercase border-b-4 border-neoBlack">
        My Uploads
      </h2>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {videos.map((v) => (
          <VideoCard key={v._id} video={v} />
        ))}
      </div>
    </div>
  );
};
