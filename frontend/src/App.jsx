import { Suspense, lazy, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";

// 👇 LAZY LOADED PAGES (with a trick to handle your named exports!) 👇
const Home = lazy(() =>
  import("./pages/Home").then((m) => ({ default: m.Home })),
);
const VideoDetail = lazy(() =>
  import("./pages/VideoDetail").then((m) => ({ default: m.VideoDetail })),
);
const Auth = lazy(() =>
  import("./pages/Auth").then((m) => ({ default: m.Auth })),
);
const Upload = lazy(() =>
  import("./pages/Upload").then((m) => ({ default: m.Upload })),
);
const Dashboard = lazy(() =>
  import("./pages/Dashboard").then((m) => ({ default: m.Dashboard })),
);
const Broadcaster = lazy(() =>
  import("./pages/Broadcaster").then((m) => ({ default: m.Broadcaster })),
);
const LiveStream = lazy(() =>
  import("./pages/LiveStream").then((m) => ({ default: m.LiveStream })),
);
const LiveHub = lazy(() =>
  import("./pages/LiveHub").then((m) => ({ default: m.LiveHub })),
);
const Profile = lazy(() =>
  import("./pages/Profile").then((m) => ({ default: m.Profile })),
);
const Trending = lazy(() =>
  import("./pages/Trending").then((m) => ({ default: m.Trending })),
);
const Subscriptions = lazy(() =>
  import("./pages/Subscriptions").then((m) => ({ default: m.Subscriptions })),
);
const Tweets = lazy(() =>
  import("./pages/Tweets").then((m) => ({ default: m.Tweets })),
);
const PlaylistStudio = lazy(() =>
  import("./pages/PlaylistStudio").then((m) => ({ default: m.PlaylistStudio })),
);
const PlaylistPlayerPage = lazy(() =>
  import("./pages/PlaylistPlayerPage").then((m) => ({
    default: m.PlaylistPlayerPage,
  })),
);
const Search = lazy(() =>
  import("./pages/Search").then((m) => ({ default: m.Search })),
);
import { GlobalLoader } from "./components/Skeletons";

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return <GlobalLoader />;
  if (!currentUser) return <Navigate to="/auth" />;
  return children;
};

const AppRoutes = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const { currentUser } = useAuth();

  return (
    <div
      key={currentUser?._id || "guest"}
      className="bg-white min-h-screen font-sans text-black selection:bg-neoBlue selection:text-white pb-12 pt-[84px]"
    >
      <Navbar toggleSidebar={() => setSidebarExpanded(!sidebarExpanded)} />
      <div className="flex">
        <Sidebar expanded={sidebarExpanded} />
        <main
          className={`flex-1 w-full overflow-x-hidden transition-all duration-300 ${sidebarExpanded ? "ml-64" : "ml-0"}`}
        >
          {/* 👇 NEO-BRUTALIST SUSPENSE BOUNDARY 👇 */}
          <Suspense fallback={<GlobalLoader />}>
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
                    <PlaylistStudio />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/playlist/:playlistId/play"
                element={
                  <ProtectedRoute>
                    <PlaylistPlayerPage />
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
              <Route path="/live/:liveId" element={<LiveStream />} />

              <Route
                path="*"
                element={
                  <div className="text-center mt-20 font-black text-4xl uppercase p-12 neo-card bg-neoYellow max-w-xl mx-auto rotate-[2deg]">
                    404 - Not Found
                  </div>
                }
              />
            </Routes>
          </Suspense>
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
