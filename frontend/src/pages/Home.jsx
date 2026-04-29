import { useEffect, useState } from "react";
import { api } from "../api/axios";
import { VideoCard } from "../components/VideoCard";

export const Home = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const { data } = await api.get("/videos");
        setVideos(data.data.videos || data.data || []);
      } catch (error) {
        console.error("Failed to fetch videos");
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  if (loading) return <div className="text-center font-black text-4xl mt-12 uppercase animate-pulse">Loading Video Grid...</div>;

  return (
    <div className="px-6 pb-12">
      <h1 className="text-4xl font-black mb-8 uppercase border-b-4 border-neoBlack pb-4 inline-block tracking-tight bg-neoYellow shadow-neo px-4 py-2 mt-4">
        Explore
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {videos.map((video) => (
          <VideoCard key={video._id} video={video} />
        ))}
      </div>
    </div>
  );
};
