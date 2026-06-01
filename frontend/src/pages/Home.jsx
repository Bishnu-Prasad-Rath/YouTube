import { useEffect, useState } from "react";
import { api } from "../api/axios";
import { VideoCardSkeleton } from "../components/Skeletons";

export const Home = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const { data } = await api.get("/videos");
        setVideos(data.data?.videos || data.data || []);
      } catch (error) {
        console.error("Failed to fetch videos", error);

        setVideos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

    if (loading) {
    return (
      <div className="px-6 pb-12">
        <h1 className="inline-block px-4 py-2 pb-4 mt-4 mb-8 text-4xl font-black tracking-tight uppercase border-b-4 border-neoBlack bg-neoYellow shadow-neo">
          Explore
        </h1>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
          {[...Array(6)].map((_, idx) => (
            <VideoCardSkeleton key={idx} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pb-12">
      <h1 className="inline-block px-4 py-2 pb-4 mt-4 mb-8 text-4xl font-black tracking-tight uppercase border-b-4 border-neoBlack bg-neoYellow shadow-neo">
        Explore
      </h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
        {videos.map((video) => (
          <VideoCard key={video._id} video={video} />
        ))}
      </div>
    </div>
  );
};
