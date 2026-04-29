import { useState } from "react";
import { api } from "../api/axios";
import { useNavigate } from "react-router-dom";

export const Upload = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    try {
      await api.post("/videos", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate("/dashboard");
    } catch (error) {
      alert("Error uploading video.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-black uppercase mb-8 border-b-4 border-neoBlack pb-4 inline-block bg-neoGreen shadow-neo px-4 py-2 mt-4 rotate-[-1deg]">
        Upload Video
      </h1>

      <form onSubmit={handleSubmit} className="neo-card bg-neoWhite flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="font-bold text-lg">Title</label>
          <input name="title" type="text" required className="neo-input" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-bold text-lg">Description</label>
          <textarea name="description" required className="neo-input min-h-[120px]" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-bold text-lg">Video File</label>
          <input name="videoFile" type="file" accept="video/*" required className="neo-input bg-neoBlue file:border-4 file:border-neoBlack file:py-1 file:px-3 file:shadow-neo file:font-black file:mr-4 file:bg-neoWhite" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-bold text-lg">Thumbnail File</label>
          <input name="thumbnail" type="file" accept="image/*" required className="neo-input bg-neoYellow file:border-4 file:border-neoBlack file:py-1 file:px-3 file:shadow-neo file:font-black file:mr-4 file:bg-neoWhite" />
        </div>

        <button type="submit" disabled={loading} className="neo-btn bg-neoBlack text-neoWhite text-xl py-4 mt-4 hover:bg-gray-800 disabled:opacity-50">
          {loading ? "UPLOADING..." : "PUBLISH"}
        </button>
      </form>
    </div>
  );
};
