import React from "react";

// VideoCardSkeleton to match VideoCard's design
export const VideoCardSkeleton = () => {
  return (
    <div className="relative w-full flex flex-col h-full p-0 overflow-visible bg-white border-[4px] border-neoBlack shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-pulse">
      {/* Video Thumbnail area */}
      <div className="relative block overflow-hidden border-b-[4px] border-neoBlack aspect-video bg-gray-200">
        <div className="absolute bottom-3 right-3 bg-gray-300 w-14 h-6 border-[3px] border-neoBlack" />
      </div>
      
      {/* Info Area */}
      <div className="flex flex-1 gap-4 p-5">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full border-[3px] border-neoBlack bg-gray-200 shrink-0" />
        
        {/* Text rows */}
        <div className="flex flex-col flex-1 gap-2">
          <div className="h-6 bg-gray-300 w-11/12 border-[2px] border-neoBlack" />
          <div className="h-4 bg-gray-200 w-1/2 border-[2px] border-neoBlack" />
          <div className="h-4 bg-gray-200 w-3/4 border-[2px] border-neoBlack" />
        </div>
      </div>
    </div>
  );
};

// TrendingRowSkeleton to match Trending page's rows
export const TrendingRowSkeleton = () => {
  return (
    <div className="flex flex-col md:flex-row gap-6 bg-neoWhite border-4 border-neoBlack shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 animate-pulse">
      {/* Thumbnail Container */}
      <div className="relative w-full bg-gray-200 border-4 md:w-80 shrink-0 aspect-video border-neoBlack"></div>

      {/* Metadata & Ranking Badge Container */}
      <div className="relative flex flex-col justify-between flex-1 gap-4 py-2">
        <div className="flex flex-col gap-3">
          <div className="w-3/4 h-8 bg-gray-300 border-2 border-neoBlack"></div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-8 h-8 bg-gray-200 border-2 rounded-full border-neoBlack"></div>
            <div className="w-24 h-4 bg-gray-200 border-2 border-neoBlack"></div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm font-bold uppercase">
          <div className="w-20 h-6 bg-gray-200 border-2 border-neoBlack"></div>
          <div className="h-6 bg-gray-200 border-2 w-28 border-neoBlack"></div>
        </div>
      </div>
    </div>
  );
};

// VideoDetailSkeleton to match VideoDetail's complex layout
export const VideoDetailSkeleton = () => {
  return (
    <div className="max-w-[1600px] mx-auto px-6 pb-12 flex flex-col lg:flex-row gap-8 pt-4 animate-pulse">
      {/* 70% Primary Video Area */}
      <div className="flex-none lg:w-[65%] xl:w-[70%]">
        {/* Custom Video Player Placeholder */}
        <div className="relative mb-6 bg-gray-200 border-4 aspect-video border-neoBlack shadow-neo"></div>
        
        {/* Title and Views */}
        <div className="flex flex-col items-start justify-between gap-4 mb-4 lg:items-center lg:flex-row">
          <div className="w-1/2 h-8 bg-gray-300 border-2 border-neoBlack"></div>
          <div className="h-10 bg-gray-200 w-28 border-4 border-neoBlack shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"></div>
        </div>
        
        {/* Channel & Subscription Status */}
        <div className="relative flex items-center justify-between p-4 mb-6 border-4 bg-neoWhite border-neoBlack shadow-neo">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full border-4 border-neoBlack bg-gray-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"></div>
            <div className="flex flex-col gap-2">
              <div className="w-32 h-5 bg-gray-300 border-2 border-neoBlack"></div>
              <div className="w-24 h-4 bg-gray-200 border-2 border-neoBlack"></div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-32 h-12 bg-gray-200 border-4 border-neoBlack shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"></div>
            <div className="w-24 h-12 bg-gray-200 border-4 border-neoBlack shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"></div>
          </div>
        </div>

        {/* Description Box */}
        <div className="h-24 mb-8 bg-gray-200 border-4 border-neoBlack shadow-neo"></div>

        {/* Comment block placeholder */}
        <div className="h-10 mb-6 bg-gray-300 border-4 w-44 border-neoBlack"></div>
      </div>
      
      {/* 30% Recommended Sidebar */}
      <div className="flex flex-col flex-1 gap-6">
        <div className="w-48 h-10 mb-2 bg-gray-300 border-4 border-neoBlack shadow-neo"></div>
        {[1, 2, 3].map((_, idx) => (
          <VideoCardSkeleton key={idx} />
        ))}
      </div>
    </div>
  );
};

// GlobalLoader component for Suspense fallback
export const GlobalLoader = () => {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-100px)] w-full bg-white">
      <div className="flex flex-col items-center">
        <div className="text-4xl font-black uppercase tracking-widest bg-neoYellow border-8 border-neoBlack p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-pulse -rotate-2">
          LOADING SECTOR...
        </div>
        <div className="mt-6 text-sm font-black tracking-widest text-gray-500 uppercase animate-bounce">
          YT-NEO STREAM PROTOCOLS
        </div>
      </div>
    </div>
  );
};
