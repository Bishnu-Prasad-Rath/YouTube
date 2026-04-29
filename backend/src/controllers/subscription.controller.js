import { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { addSubscription, removeSubscription, isSubscribed, getSubscribersCount } from "../redis/cache/subscription.cache.js";
import {getIO} from "../socket/socketInstance.js";
import {incrementSubscribers,decrementSubscribers} from "../redis/cache/dashboard.cache.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Channel ID is invalid");
  }

  if (channelId === userId.toString()) {
    throw new ApiError(400, "You can not subscribe to yourself.");
  }

  const existingSubscription = await Subscription.findOne({
    subscriber: userId,
    channel: channelId,
  });

  let action;
  let subscription = null;

  if (existingSubscription) {
    await Subscription.findByIdAndDelete(existingSubscription._id);

    await removeSubscription(userId, channelId);

    action = "unsubscribe";

    await decrementSubscribers(channelId);
  } else {
    subscription = await Subscription.create({
      subscriber: userId,
      channel: channelId,
    });

    await addSubscription(userId, channelId);

    action = "subscribe";

    await incrementSubscribers(channelId);
  }

  // 🔥 Redis count
  let totalSubscribers = await getSubscribersCount(channelId);

  // ✅ correct fallback check
  if (totalSubscribers === null || totalSubscribers === undefined) {
    const dbCount = await Subscription.countDocuments({
      channel: channelId,
    });
    totalSubscribers = dbCount;
  }

  const io = getIO();

  io.to(channelId).emit("channel:subscription",{
    channelId,
    userId,
    action,
    totalSubscribers,
  })

const isUserSubscribed = await isSubscribed(userId, channelId);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        action,
        subscription,
        isSubscribed: isUserSubscribed,
        totalSubscribers,
      },
      action === "subscribe"
        ? "Channel subscribed"
        : "Channel unsubscribed"
    )
  );
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "channel ID is not valid");
  }

  const subscribers = await Subscription.find({
    channel: channelId,
  })
    .populate({
      path: "subscriber",
      select: "username fullName avatar",
    })
    .select("subscriber");

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "Subscribers fetched successfully")
    );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid Subscriber ID");
  }

  const channels = await Subscription.find({
    subscriber: subscriberId,
  }).populate({
    path: "channel",
    select: "username fullName avatar",
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, channels, "Subscribed channels fetched successfully")
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
