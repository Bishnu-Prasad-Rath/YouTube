import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";

// Pages
import { Home } from "./pages/Home";
import { VideoDetail } from "./pages/VideoDetail";
import { Auth } from "./pages/Auth";
import { Upload } from "./pages/Upload";
import { Dashboard } from "./pages/Dashboard";
import { Broadcaster } from "./pages/Broadcaster";
import { LiveStream } from "./pages/LiveStream";
import { LiveHub } from "./pages/LiveHub";
import { Profile } from "./pages/Profile";
import { Trending } from "./pages/Trending";
import { Subscriptions } from "./pages/Subscriptions";
import { Tweets } from "./pages/Tweets";
import { Playlists } from "./pages/Playlists";
import { Search } from "./pages/Search";

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!currentUser) return <Navigate to="/auth" />;
  return children;
};

const AppRoutes = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const { currentUser } = useAuth();

  return (
    <div key={currentUser?._id || 'guest'} className="bg-white min-h-screen font-sans text-black selection:bg-neoBlue selection:text-white pb-12 pt-[84px]">
      <Navbar toggleSidebar={() => setSidebarExpanded(!sidebarExpanded)} />
      <div className="flex">
        <Sidebar expanded={sidebarExpanded} />
        <main className={`flex-1 w-full overflow-x-hidden transition-all duration-300 ${sidebarExpanded ? 'ml-64' : 'ml-0'}`}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/video/:videoId" element={<VideoDetail />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/u/:username" element={<Profile />} />
            <Route path="/trending" element={<Trending />} />
            <Route path="/search" element={<Search />} />
            
            {/* Protected Routes */}
            <Route 
              path="/upload" 
              element={
                <ProtectedRoute>
                  <Upload />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/subscriptions" 
              element={
                <ProtectedRoute>
                  <Subscriptions />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tweets" 
              element={
                <ProtectedRoute>
                  <Tweets />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/playlists" 
              element={
                <ProtectedRoute>
                  <Playlists />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/live/start" 
              element={
                <ProtectedRoute>
                  <Broadcaster />
                </ProtectedRoute>
              } 
            />
            <Route path="/live" element={<LiveHub />} />
            <Route 
              path="/live/:liveId" 
              element={<LiveStream />} 
            />
            
            <Route path="*" element={<div className="text-center mt-20 font-black text-4xl uppercase p-12 neo-card bg-neoYellow max-w-xl mx-auto rotate-[2deg]">404 - Not Found</div>} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
