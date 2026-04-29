import { Live } from "../models/live.model.js";
import { User } from "../models/user.model.js";
import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { createLiveToken } from "../utils/livekit.js";

const getLiveToken = asyncHandler(async (req, res)=>{
   const {liveId} = req.params;

   if(!liveId){
    throw new ApiError(400, "Live ID is required");
   }

   if(!isValidObjectId(liveId)){
    throw new ApiError(400, "Invalid Live ID");
   }

   const live = await Live.findById(liveId);

   if(!live || !live.isLive){
    throw new ApiError(404, "Live stream not found");
   }
   
const isStreamer = live.streamer.toString() === req.user._id.toString();

let token;

   try {
   token = await createLiveToken(liveId, req.user,isStreamer);
   } catch (error) {
    throw new ApiError(500, "Error generating live token");
   }

   return res
   .status(200)
   .json(new ApiResponse(200, {token}, "LIve token generated successfully"))
})

const startLive = asyncHandler(async (req, res) => {
  const { title } = req.body;

  if(!title){
     throw new ApiError(400, "Title is required to start a live stream");
  }

  let existingLive = null;
  try {
    existingLive = await Live.findOne({
      streamer: req.user._id,
      isActive: true,
    });
  } catch (error) {
    console.error("Collection might not be initialized or query failed:", error.message);
  }

  // Self-healing: if an old stream is stuck active, shut it down natively instead of erroring
  if(existingLive){
    existingLive.isLive = false;
    existingLive.isActive = false;
    existingLive.duration = Math.floor((Date.now() - new Date(existingLive.createdAt).getTime()) / 1000);
    await existingLive.save();
  }

  const newLive = new Live({
    streamer: req.user._id,
    title,
    isLive: true,
    isActive: true
  });

  const savedLive = await newLive.save();
  const confirmedDoc = await Live.findById(savedLive._id);
  console.log('Document confirmed in DB:', confirmedDoc);

  await User.findByIdAndUpdate(req.user._id, { isLive: true });

  return res
    .status(201)
    .json(new ApiResponse(201, savedLive, "Live stream started successfully"));
});

const endLive = asyncHandler(async (req, res) => {
  const { liveId } = req.params;

  if(!liveId){
    throw new ApiError(400, "Live ID is required");
  }

  if(!isValidObjectId(liveId)){
    throw new ApiError(400, "Invalid Live ID");
  }

const live = await Live.findById(liveId);

if (!live) {
  throw new ApiError(404, "Live stream not found");
}

if (live.streamer.toString() !== req.user._id.toString()) {
  throw new ApiError(403, "You are not authorized to end this live stream");
}

const updatedLive = await Live.findByIdAndUpdate(
  liveId,
  { isLive: false, isActive: false, viewers: 0 },
  { returnDocument: 'after' }
);

await User.findByIdAndUpdate(req.user._id, { isLive: false });

if (updatedLive) {
  updatedLive.duration = Math.floor((Date.now() - new Date(updatedLive.createdAt).getTime()) / 1000);
  await updatedLive.save();
}

  return res
    .status(200)
    .json(new ApiResponse(200, live, "Live stream ended successfully"));
});

const getLiveStreams = asyncHandler(async (req, res) => {
  const lives = await Live.find({
    isActive: true,
  }).populate("streamer", "username avatar");

  return res
    .status(200)
    .json(
      new ApiResponse(200, lives, "Active live streams fetched successfully")
    );
});

const getLiveById = asyncHandler(async (req, res) => {
  const { liveId } = req.params;

  if(!liveId){
    throw new ApiError(400, "Live ID is required");
  }

  if(!isValidObjectId(liveId)){
    throw new ApiError(400, "Invalid Live ID");
  }

  const live = await Live.findById(liveId).populate(
    "streamer",
    "username avatar"
  );

  if(!live){
    throw new ApiError(404, "Live stream not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, live, "Live stream fetched successfully"));
});


const cleanupZombieStreams = asyncHandler(async (req, res) => {
  const result = await Live.updateMany(
    { streamer: req.user._id, isLive: true },
    { $set: { isLive: false, isActive: false } }
  );

  await User.findByIdAndUpdate(req.user._id, { isLive: false });

  return res.status(200).json(
    new ApiResponse(200, result, `Zombie streams cleaned successfully. Modified: ${result.modifiedCount}`)
  );
});

export {
    getLiveToken,
    startLive,
    endLive,
    getLiveStreams,
    getLiveById,
    cleanupZombieStreams
}