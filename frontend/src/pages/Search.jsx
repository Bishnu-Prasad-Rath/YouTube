import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/axios";
import { VideoCard } from "../components/VideoCard";

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
      <div className="max-w-[1600px] mx-auto px-6 py-12">
        <h2 className="font-black text-4xl p-8 uppercase text-center bg-neoYellow shadow-neo border-4 border-neoBlack mx-auto max-w-xl">
          Searching...
        </h2>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8">
      <h1 className="text-4xl font-black uppercase tracking-tighter mb-8 border-b-4 border-neoBlack pb-4 border-dashed">
        Results for: <span className="bg-neoYellow px-2 border-2 border-neoBlack">{query}</span>
      </h1>

      {results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {results.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="neo-card bg-neoWhite border-4 border-neoBlack shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] p-12 text-center max-w-2xl transform -rotate-1 hover:rotate-1 transition-all">
             <div className="text-8xl mb-6">🤷‍♂️</div>
             <h2 className="text-5xl font-black uppercase tracking-widest text-neoRed mb-4">Void!</h2>
             <p className="text-2xl font-bold uppercase text-gray-600">No signals found for your query. Try different keywords.</p>
          </div>
        </div>
      )}
    </div>
  );
};
