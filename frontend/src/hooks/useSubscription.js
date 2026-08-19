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
  fetchSubscribedChannels,
} = useAuth();
  const navigate = useNavigate();

  const [subscribersCount, setSubscribersCount] = useState(
    initialSubscribersCount,
  );
  const [loading, setLoading] = useState(false);
  const [activeChannelId, setActiveChannelId] = useState(channelId);

  // Reactive Hook: watch channelId prop
  useEffect(() => {
    if (channelId) {
      setActiveChannelId(channelId);
    }
  }, [channelId]);

  // Sync internal global context state if initial props arrive from backend payload

  useEffect(() => {
    if (!activeChannelId) return;

    toggleLocalSub(activeChannelId, initialSubscribedStatus);
  }, [activeChannelId, initialSubscribedStatus]);

  // Sync local counter state
  useEffect(() => {
    setSubscribersCount(initialSubscribersCount);
  }, [initialSubscribersCount]);

  const isSubscribed = subscribedChannels.includes(activeChannelId);

  const toggleSubscription = async (eventOrId) => {
    let targetId = activeChannelId;

    if (eventOrId && typeof eventOrId.preventDefault === "function") {
      eventOrId.preventDefault();
      eventOrId.stopPropagation();
    } else if (typeof eventOrId === "string" && eventOrId) {
      targetId = eventOrId;
    }

    // Loading Guard check as requested
    if (!targetId) return;

    if (!currentUser) {
      navigate("/auth");
      return;
    }

    const previousSubState = isSubscribed;
    const previousCount = subscribersCount;

    // Execute instant Optimistic UI Update directly into Global App Context
    toggleLocalSub(targetId, !previousSubState);
    setSubscribersCount((prev) => (previousSubState ? prev - 1 : prev + 1));
    setLoading(true);

    try {
      // Make backend API request. Note: Route is singular `/subscription/` per backend app.js mapping
      await api.post(`/subscription/c/${targetId}`);
    } catch (error) {
      console.error("Error toggling subscription, rolling back...", error);

      // Execute Rollback in Global Context
      toggleLocalSub(targetId, previousSubState);
      setSubscribersCount(previousCount);

      if (error.response?.status === 429) {
        alert(
          "You're clicking too fast! Please wait a moment before trying again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return { isSubscribed, subscribersCount, toggleSubscription, loading };
};
