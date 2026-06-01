import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/axios";
import { VideoCard } from "../components/VideoCard";
import { VideoCardSkeleton} from "../components/Skeletons";

export const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/videos?query=${encodeURIComponent(query)}`);
        setResults(data.data || []);
      } catch (error) {
        setResults([]);
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      fetchResults();
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [query]);

  if (loading) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <h1 className="pb-4 mb-8 text-4xl font-black tracking-tighter uppercase border-b-4 border-dashed border-neoBlack">
          Results for: <span className="px-2 border-2 bg-neoYellow border-neoBlack">{query}</span>
        </h1>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(4)].map((_, idx) => (
            <VideoCardSkeleton key={idx} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8">
      <h1 className="pb-4 mb-8 text-4xl font-black tracking-tighter uppercase border-b-4 border-dashed border-neoBlack">
        Results for: <span className="px-2 border-2 bg-neoYellow border-neoBlack">{query}</span>
      </h1>

      {results.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="neo-card bg-neoWhite border-4 border-neoBlack shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] p-12 text-center max-w-2xl transform -rotate-1 hover:rotate-1 transition-all">
             <div className="mb-6 text-8xl">🤷‍♂️</div>
             <h2 className="mb-4 text-5xl font-black tracking-widest uppercase text-neoRed">Void!</h2>
             <p className="text-2xl font-bold text-gray-600 uppercase">No signals found for your query. Try different keywords.</p>
          </div>
        </div>
      )}
    </div>
  );
};
