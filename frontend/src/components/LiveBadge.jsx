import { Radio } from "lucide-react";

export const LiveBadge = ({ viewers = 0 }) => {
  return (
    <div className="inline-flex items-center gap-2 bg-red-500 text-noneBlack border-4 border-neoBlack shadow-neo px-3 py-1 font-black animate-pulse">
      <Radio className="w-5 h-5 stroke-[4] text-white" />
      <span className="text-white uppercase tracking-wider">Live</span>
      {viewers > 0 && (
        <span className="bg-neoBlack text-neoWhite px-2 border-2 border-neoWhite ml-2">
          {viewers}
        </span>
      )}
    </div>
  );
};
