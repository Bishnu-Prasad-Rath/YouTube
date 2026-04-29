import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/axios";
import { VideoCard } from "../components/VideoCard";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../hooks/useSubscription";
import { Tweets } from "./Tweets";
import { Playlists } from "./Playlists";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { X, Upload } from "lucide-react";

const ProfileSkeleton = () => (
  <div className="max-w-[1600px] mx-auto px-6 pb-12 animate-pulse mt-4">
    <div className="w-full h-48 md:h-64 lg:h-80 bg-gray-200 border-4 border-neoBlack shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-16 relative">
       <div className="absolute -bottom-16 left-8 md:left-12 w-32 h-32 md:w-48 md:h-48 rounded-full border-8 border-neoBlack bg-gray-300 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"></div>
    </div>
    <div className="mt-8 flex flex-col md:flex-row md:items-end justify-between items-start gap-6 border-b-4 border-neoBlack pb-8 mb-8 border-dashed">
       <div className="ml-2 md:ml-64 lg:ml-72 flex flex-col gap-4 w-full max-w-md">
          <div className="h-12 w-full bg-gray-300 border-4 border-neoBlack"></div>
          <div className="h-6 w-3/4 bg-gray-200 border-4 border-neoBlack"></div>
       </div>
       <div className="h-14 w-48 bg-gray-300 border-4 border-neoBlack shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"></div>
    </div>
    <div className="flex gap-4 mb-8">
       <div className="h-14 w-32 bg-gray-300 border-4 border-neoBlack"></div>
       <div className="h-14 w-32 bg-gray-200 border-4 border-neoBlack"></div>
       <div className="h-14 w-32 bg-gray-200 border-4 border-neoBlack"></div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
       {[...Array(4)].map((_, i) => (
         <div key={i} className="aspect-video bg-gray-200 border-4 border-neoBlack shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"></div>
       ))}
    </div>
  </div>
);

export const Profile = () => {
  const { username } = useParams();
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [videos, setVideos] = useState([]);
  const [activeTab, setActiveTab] = useState("Uploads");
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState(null);

  // Edit Profile State
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data: profileData } = await api.get(`/users/c/${username}`);
        const userProfile = profileData.data;
        setProfile(userProfile);
        setEditFullName(userProfile.fullName || "");
        setEditEmail(userProfile.email || "");

        if (userProfile?._id) {
          const { data: videoData } = await api.get('/videos', { params: { userId: userProfile._id } });
          setVideos(videoData.data?.videos || videoData.data || []);
          
          if (currentUser?._id === userProfile._id) {
             const { data: statsData } = await api.get('/dashboard/stats');
             setDashboardStats(statsData.data);
          }
        }
      } catch (error) {
        console.error("Error fetching profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);
  const { isSubscribed, subscribersCount, toggleSubscription, loading: subLoading } = useSubscription(
    profile?._id,
    profile?.isSubscribed || false,
    profile?.subscribersCount || 0
  );

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    try {
      if (editFullName !== profile.fullName || editEmail !== profile.email) {
        await api.patch('/users/update-account', { fullName: editFullName, email: editEmail });
      }
      
      if (avatarFile) {
        const avatarData = new FormData();
        avatarData.append("avatar", avatarFile);
        await api.patch('/users/avatar', avatarData);
      }
      
      if (coverFile) {
        const coverData = new FormData();
        coverData.append("coverImage", coverFile);
        await api.patch('/users/coverImage', coverData);
      }
      
      window.location.reload(); // Quick refresh to sync all state and tokens
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <ProfileSkeleton />;
  if (!profile) return <h2 className="font-black text-4xl p-8 uppercase text-center mt-12 bg-neoRed shadow-neo border-4 border-neoBlack mx-auto max-w-xl text-white">Profile Not Found</h2>;

  return (
    <div className="max-w-[1600px] mx-auto px-6 pb-12">
      {/* Cover Image */}
      <div className="w-full h-48 md:h-64 lg:h-80 bg-neoWhite border-4 border-neoBlack shadow-neo mb-16 relative overflow-visible mt-4">
        {profile.coverImage ? (
          <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-neoBlue flex items-center justify-center border-b-4 border-black">
            <span className="font-black text-4xl text-white opacity-50 uppercase tracking-widest">{profile.username}'S BASE</span>
          </div>
        )}
        
        {/* Massive Avatar inside Cover */}
        <div className="absolute -bottom-16 left-8 md:left-12">
          <img 
            src={profile.avatar || "https://ui-avatars.com/api/?name=" + profile.username} 
            alt="Profile Avatar" 
            className="w-32 h-32 md:w-48 md:h-48 rounded-full border-8 border-neoBlack bg-neoYellow object-cover shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-transform"
          />
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-8 flex flex-col md:flex-row md:items-end justify-between items-start gap-6 border-b-4 border-neoBlack pb-8 mb-8 border-dashed">
        <div className="ml-2 md:ml-64 lg:ml-72 flex flex-col">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">{profile.fullName}</h1>
          <div className="flex gap-4 font-bold text-gray-700 mt-2 text-lg">
            <span>@{profile.username}</span>
            <span>•</span>
            <span>{subscribersCount} subscribers</span>
            <span>•</span>
            <span>{videos.length} videos</span>
          </div>
        </div>
        
        {currentUser?.username !== profile.username ? (
          <button 
             onClick={toggleSubscription}
             disabled={subLoading}
             className={`neo-btn uppercase tracking-widest text-xl px-10 py-4 ${isSubscribed ? 'bg-pink-400' : 'bg-neoYellow'} ${subLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
          </button>
        ) : (
          <button 
             onClick={() => setShowEditProfile(true)}
             className="neo-btn uppercase tracking-widest text-xl px-10 py-4 bg-[#a855f7] text-white hover:bg-purple-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b-4 border-neoBlack mb-8 overflow-x-auto pb-[-4px]">
         {['Uploads', 'Tweets', 'Playlists'].concat(currentUser?._id === profile?._id ? ['Dashboard'] : []).map(tab => (
           <button 
             key={tab}
             onClick={() => setActiveTab(tab)}
             className={`px-8 py-3 font-black text-xl uppercase tracking-widest border-4 border-b-0 border-neoBlack transition-colors translate-y-[4px] z-10 ${
               activeTab === tab 
                 ? 'bg-neoWhite text-black shadow-none' 
                 : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
             }`}
           >
             {tab}
           </button>
         ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Uploads' && (
        <div>
          {videos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map(v => (
                <VideoCard key={v._id} video={v} />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center neo-card bg-neoWhite border-dashed border-4 border-neoBlack font-bold uppercase text-2xl">
              This user hasn't dropped any videos.
            </div>
          )}
        </div>
      )}

      {activeTab === 'Tweets' && (
        <Tweets userId={profile._id} />
      )}

      {activeTab === 'Playlists' && (
        <Playlists userId={profile._id} />
      )}

      {activeTab === 'Dashboard' && dashboardStats && (
        <div className="flex flex-col gap-8 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="neo-card bg-neoYellow p-6 border-4 border-neoBlack shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
               <h3 className="text-xl font-black uppercase text-gray-700">Total Views</h3>
               <p className="text-5xl font-black mt-2">{dashboardStats.totalViews}</p>
            </div>
            <div className="neo-card bg-[#00ffff] p-6 border-4 border-neoBlack shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
               <h3 className="text-xl font-black uppercase text-gray-700">Subscribers</h3>
               <p className="text-5xl font-black mt-2">{dashboardStats.totalSubscribers}</p>
            </div>
            <div className="neo-card bg-pink-400 p-6 border-4 border-neoBlack shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-white">
               <h3 className="text-xl font-black uppercase">Total Likes</h3>
               <p className="text-5xl font-black mt-2">{dashboardStats.totalLikes}</p>
            </div>
          </div>
          
          <div className="neo-card bg-neoWhite border-4 border-neoBlack shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
            <h2 className="text-3xl font-black uppercase mb-6 border-b-4 border-neoBlack pb-4">Performance Analytics</h2>
            <div className="h-80 w-full mt-8">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardStats.performanceGraph}>
                  <XAxis dataKey="name" stroke="#000" strokeWidth={3} tick={{ fill: '#000', fontWeight: 900 }} />
                  <YAxis stroke="#000" strokeWidth={3} tick={{ fill: '#000', fontWeight: 900 }} />
                  <Tooltip 
                     contentStyle={{ backgroundColor: '#facc15', border: '4px solid #000', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)', fontWeight: 900, textTransform: 'uppercase' }} 
                     itemStyle={{ color: '#000' }}
                  />
                  <Line 
                     type="monotone" 
                     dataKey="views" 
                     stroke="#000" 
                     strokeWidth={4} 
                     activeDot={{ r: 8, fill: '#facc15', stroke: '#000', strokeWidth: 4 }}
                     dot={{ r: 4, fill: '#000' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="neo-card bg-neoWhite border-4 border-neoBlack shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
            <h2 className="text-3xl font-black uppercase mb-6 border-b-4 border-neoBlack pb-4">Top Performing Tweets</h2>
            <div className="flex flex-col gap-4">
               {dashboardStats.topTweets?.length > 0 ? (
                 dashboardStats.topTweets.map((tweet, i) => (
                   <div key={tweet._id} className="flex items-center gap-4 border-2 border-neoBlack p-4 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                      <div className="w-12 h-12 flex items-center justify-center bg-neoBlack text-white font-black text-2xl shrink-0">
                         #{i + 1}
                      </div>
                      <p className="flex-1 font-bold text-lg line-clamp-2">{tweet.content}</p>
                      <div className="flex items-center gap-2 font-black text-neoRed">
                         <span>❤️</span> {tweet.likes}
                      </div>
                   </div>
                 ))
               ) : (
                 <p className="font-bold text-lg text-gray-500">No tweets posted yet.</p>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-neoWhite border-4 border-neoBlack shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] max-w-xl w-full p-8 animate-in zoom-in-95 flex flex-col max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-6 border-b-4 border-neoBlack pb-4">
               <h2 className="text-3xl font-black uppercase text-[#a855f7]">Edit Profile</h2>
               <button onClick={() => setShowEditProfile(false)} className="hover:rotate-90 transition-transform">
                  <X size={32} className="stroke-[3]" />
               </button>
             </div>
             
             <label className="font-black uppercase mb-2">Full Name</label>
             <input 
               type="text" 
               value={editFullName} 
               onChange={e => setEditFullName(e.target.value)}
               className="neo-input border-4 border-neoBlack p-3 mb-6 font-bold focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none transition-shadow"
             />

             <label className="font-black uppercase mb-2">Email</label>
             <input 
               type="email" 
               value={editEmail} 
               onChange={e => setEditEmail(e.target.value)}
               className="neo-input border-4 border-neoBlack p-3 mb-6 font-bold focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none transition-shadow"
             />
             
             <label className="font-black uppercase mb-2 mt-4">Avatar (1x1)</label>
             <div className="border-4 border-dashed border-neoBlack p-6 mb-6 flex items-center justify-center bg-gray-50 relative overflow-hidden group">
               <input 
                 type="file" 
                 accept="image/*"
                 onChange={e => setAvatarFile(e.target.files[0])}
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
               />
               <div className="text-center flex flex-col items-center">
                 <Upload size={32} className="mb-2 stroke-[3]" />
                 <p className="font-bold">{avatarFile ? avatarFile.name : "Choose new avatar"}</p>
               </div>
             </div>

             <label className="font-black uppercase mb-2 mt-2">Cover Image (16x9)</label>
             <div className="border-4 border-dashed border-neoBlack p-6 mb-8 flex items-center justify-center bg-gray-50 relative overflow-hidden group">
               <input 
                 type="file" 
                 accept="image/*"
                 onChange={e => setCoverFile(e.target.files[0])}
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
               />
               <div className="text-center flex flex-col items-center">
                 <Upload size={32} className="mb-2 stroke-[3]" />
                 <p className="font-bold">{coverFile ? coverFile.name : "Choose new cover"}</p>
               </div>
             </div>
             
             <button 
               onClick={handleUpdateProfile}
               disabled={isUpdating}
               className="p-4 font-black uppercase border-4 border-neoBlack bg-[#a855f7] text-white text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all hover:bg-purple-600"
             >
               {isUpdating ? 'Saving Mastery...' : 'Save Mastery'}
             </button>
          </div>
        </div>
      )}
    </div>
  );
};
