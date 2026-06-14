import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api/axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribedChannels, setSubscribedChannels] = useState([]);

  const toggleLocalSub = (channelId, forceState) => {
    setSubscribedChannels(prev => {
      // If forceState is true, add if missing
      if (forceState === true && !prev.includes(channelId)) return [...prev, channelId];
      // If forceState is false, remove if present
      if (forceState === false) return prev.filter(id => id !== channelId);
      // If undefined, just toggle
      if (forceState === undefined) {
         if (prev.includes(channelId)) return prev.filter(id => id !== channelId);
         else return [...prev, channelId];
      }
      return prev;
    });
  };

const fetchCurrentUser = async () => {
  try {
    const { data } = await api.get(
      "/users/current-user",
      {
        timeout: 5000,
      }
    );

    setCurrentUser(data.data);

  } catch (error) {

    setCurrentUser(null);

  } finally {

    setLoading(false);
  }
};

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email, username, password) => {
    const { data } = await api.post("/users/login", { email, username, password });
    setCurrentUser(data.data.user);
    return data;
  };

  const register = async (formData) => {
    // form data to handle avatar and coverImage
    const { data } = await api.post("/users/register", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  };

  const logout = async () => {
    await api.post("/users/logout");
    setCurrentUser(null);
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
