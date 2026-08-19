import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api/axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribedChannels, setSubscribedChannels] = useState([]);
  const [subscriptionsVersion, setSubscriptionsVersion] = useState(0);

const toggleLocalSub = (channelId, forceState) => {
  setSubscribedChannels((prev) => {
    const exists = prev.includes(channelId);

    if (forceState === true) {
      return exists ? prev : [...prev, channelId];
    }

    if (forceState === false) {
      return exists ? prev.filter((id) => id !== channelId) : prev;
    }

    return exists
      ? prev.filter((id) => id !== channelId)
      : [...prev, channelId];
  });
};

const fetchSubscribedChannels = async (userId) => {
  try {
    const { data } = await api.get(
      `/subscription/u/${userId}`,
      {
        headers: {
          "Cache-Control": "no-cache",
        },
      }
    );

    const channels = data.data || [];

    const channelIds = channels
      .map((subscription) => subscription.channel?._id)
      .filter(Boolean);

    setSubscribedChannels(channelIds);

    // Tell components that subscription data has been refreshed
    setSubscriptionsVersion((prev) => prev + 1);

  } catch (error) {
    console.error("Failed to fetch subscribed channels:", error);
    setSubscribedChannels([]);
  }
};

  const fetchCurrentUser = async () => {
    try {
      const { data } = await api.get("/users/current-user", {
        timeout: 5000,
      });

      const user = data.data;

      setCurrentUser(user);

      await fetchSubscribedChannels(user._id);
    } catch (error) {
      setCurrentUser(null);
      setSubscribedChannels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email, username, password) => {
    setLoading(true);

    try {
      await api.post("/users/login", {
        email,
        username,
        password,
      });

      await new Promise((resolve) => setTimeout(resolve, 300));

      await fetchCurrentUser();
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData) => {
    const { data } = await api.post("/users/register", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return data;
  };

  const logout = async () => {
    await api.post("/users/logout");

    setCurrentUser(null);
    setSubscribedChannels([]);
  };

  const notifySubscriptionChange = () => {
  setSubscriptionsVersion((prev) => prev + 1);
};

const value = {
  currentUser,
  login,
  register,
  logout,
  loading,
  fetchCurrentUser,
  subscribedChannels,
  toggleLocalSub,
  fetchSubscribedChannels,
  subscriptionsVersion,
  notifySubscriptionChange,
};

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
