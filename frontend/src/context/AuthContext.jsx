import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api/axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribedChannels, setSubscribedChannels] = useState([]);

  const toggleLocalSub = (channelId, forceState) => {
    setSubscribedChannels((prev) => {
      if (forceState === true && !prev.includes(channelId)) {
        return [...prev, channelId];
      }

      if (forceState === false) {
        return prev.filter((id) => id !== channelId);
      }

      if (forceState === undefined) {
        if (prev.includes(channelId)) {
          return prev.filter((id) => id !== channelId);
        }

        return [...prev, channelId];
      }

      return prev;
    });
  };

  const fetchSubscribedChannels = async (userId) => {
    try {
      const { data } = await api.get(`/subscription/u/${userId}`);

      const channels = data.data || [];

      const channelIds = channels
        .map((subscription) => subscription.channel?._id)
        .filter(Boolean);

      setSubscribedChannels(channelIds);
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
