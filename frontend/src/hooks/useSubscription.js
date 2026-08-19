import { useState, useEffect } from "react";
import { api } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export const useSubscription = (
  channelId,
  initialSubscribedStatus = false,
  initialSubscribersCount = 0,
) => {
  const {
    currentUser,
    subscribedChannels,
    toggleLocalSub,
    notifySubscriptionChange,
  } = useAuth();

  const navigate = useNavigate();

  const [subscribersCount, setSubscribersCount] = useState(
    initialSubscribersCount,
  );

  const [loading, setLoading] = useState(false);

  const [activeChannelId, setActiveChannelId] = useState(channelId);

  // Watch channel ID changes
  useEffect(() => {
    if (channelId) {
      setActiveChannelId(channelId);
    }
  }, [channelId]);

  // Sync subscriber count
  useEffect(() => {
    setSubscribersCount(initialSubscribersCount);
  }, [initialSubscribersCount]);

  // Global subscription state
  const isSubscribed = subscribedChannels.includes(activeChannelId);

const toggleSubscription = async (eventOrId) => {
  let targetId = activeChannelId;

  if (eventOrId && typeof eventOrId.preventDefault === "function") {
    eventOrId.preventDefault();
    eventOrId.stopPropagation();
  } else if (typeof eventOrId === "string" && eventOrId) {
    targetId = eventOrId;
  }

  if (!targetId || loading) return;

  if (!currentUser) {
    navigate("/auth");
    return;
  }

  const previousSubState = subscribedChannels.includes(targetId);
  const previousCount = subscribersCount;

  setLoading(true);

  // Optimistic update
  toggleLocalSub(targetId, !previousSubState);

  setSubscribersCount((prev) =>
    previousSubState ? Math.max(0, prev - 1) : prev + 1
  );

  try {
    const response = await api.post(`/subscription/c/${targetId}`);

    const result = response.data.data;

    // Backend is final source of truth
    toggleLocalSub(targetId, result.isSubscribed);

    setSubscribersCount(result.totalSubscribers);

    // Refresh sidebar
    notifySubscriptionChange();

  } catch (error) {
    console.error(
      "Error toggling subscription, rolling back...",
      error
    );

    // Rollback
    toggleLocalSub(targetId, previousSubState);

    setSubscribersCount(previousCount);

    if (error.response?.status === 429) {
      alert(
        "You're clicking too fast! Please wait a moment before trying again."
      );
    }
  } finally {
    setLoading(false);
  }
};

  return {
    isSubscribed,
    subscribersCount,
    toggleSubscription,
    loading,
  };
};
