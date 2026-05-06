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
    <div className="flex flex-col items-start justify-between gap-6 pb-8 mt-8 mb-8 border-b-4 border-dashed md:flex-row md:items-end border-neoBlack">
       <div className="flex flex-col w-full max-w-md gap-4 ml-2 md:ml-64 lg:ml-72">
          <div className="w-full h-12 bg-gray-300 border-4 border-neoBlack"></div>
          <div className="w-3/4 h-6 bg-gray-200 border-4 border-neoBlack"></div>
       </div>
       <div className="h-14 w-48 bg-gray-300 border-4 border-neoBlack shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"></div>
    </div>
    <div className="flex gap-4 mb-8">
       <div className="w-32 bg-gray-300 border-4 h-14 border-neoBlack"></div>
       <div className="w-32 bg-gray-200 border-4 h-14 border-neoBlack"></div>
       <div className="w-32 bg-gray-200 border-4 h-14 border-neoBlack"></div>
    </div>
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
  if (!profile) return <h2 className="max-w-xl p-8 mx-auto mt-12 text-4xl font-black text-center text-white uppercase border-4 bg-neoRed shadow-neo border-neoBlack">Profile Not Found</h2>;

  return (
    <div className="max-w-[1600px] mx-auto px-6 pb-12">
      {/* Cover Image */}
      <div className="relative w-full h-48 mt-4 mb-16 overflow-visible border-4 md:h-64 lg:h-80 bg-neoWhite border-neoBlack shadow-neo">
        {profile.coverImage ? (
          <img src={profile.coverImage} alt="Cover" className="object-cover w-full h-full" />
        ) : (
          <div className="flex items-center justify-center w-full h-full border-b-4 border-black bg-neoBlue">
            <span className="text-4xl font-black tracking-widest text-white uppercase opacity-50">{profile.username}'S BASE</span>
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
      <div className="flex flex-col items-start justify-between gap-6 pb-8 mt-8 mb-8 border-b-4 border-dashed md:flex-row md:items-end border-neoBlack">
        <div className="flex flex-col ml-2 md:ml-64 lg:ml-72">
          <h1 className="text-4xl font-black tracking-tighter uppercase md:text-5xl">{profile.fullName}</h1>
          <div className="flex gap-4 mt-2 text-lg font-bold text-gray-700">
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
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {videos.map(v => (
                <VideoCard key={v._id} video={v} />
              ))}
            </div>
          ) : (
            <div className="p-12 text-2xl font-bold text-center uppercase border-4 border-dashed neo-card bg-neoWhite border-neoBlack">
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
        <div className="flex flex-col max-w-5xl gap-8 mx-auto">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="neo-card bg-neoYellow p-6 border-4 border-neoBlack shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
               <h3 className="text-xl font-black text-gray-700 uppercase">Total Views</h3>
               <p className="mt-2 text-5xl font-black">{dashboardStats.totalViews}</p>
            </div>
            <div className="neo-card bg-[#00ffff] p-6 border-4 border-neoBlack shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
               <h3 className="text-xl font-black text-gray-700 uppercase">Subscribers</h3>
               <p className="mt-2 text-5xl font-black">{dashboardStats.totalSubscribers}</p>
            </div>
            <div className="neo-card bg-pink-400 p-6 border-4 border-neoBlack shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-white">
               <h3 className="text-xl font-black uppercase">Total Likes</h3>
               <p className="mt-2 text-5xl font-black">{dashboardStats.totalLikes}</p>
            </div>
          </div>
          
          <div className="neo-card bg-neoWhite border-4 border-neoBlack shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
            <h2 className="pb-4 mb-6 text-3xl font-black uppercase border-b-4 border-neoBlack">Performance Analytics</h2>
            <div className="w-full mt-8 h-80">
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
            <h2 className="pb-4 mb-6 text-3xl font-black uppercase border-b-4 border-neoBlack">Top Performing Tweets</h2>
            <div className="flex flex-col gap-4">
               {dashboardStats.topTweets?.length > 0 ? (
                 dashboardStats.topTweets.map((tweet, i) => (
                   <div key={tweet._id} className="flex items-center gap-4 border-2 border-neoBlack p-4 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                      <div className="flex items-center justify-center w-12 h-12 text-2xl font-black text-white bg-neoBlack shrink-0">
                         #{i + 1}
                      </div>
                      <p className="flex-1 text-lg font-bold line-clamp-2">{tweet.content}</p>
                      <div className="flex items-center gap-2 font-black text-neoRed">
                         <span>❤️</span> {tweet.likes}
                      </div>
                   </div>
                 ))
               ) : (
                 <p className="text-lg font-bold text-gray-500">No tweets posted yet.</p>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-neoWhite border-4 border-neoBlack shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] max-w-xl w-full p-8 animate-in zoom-in-95 flex flex-col max-h-[90vh] overflow-y-auto">
             <div className="flex items-center justify-between pb-4 mb-8 border-b-4 border-neoBlack">
               <h2 className="text-3xl font-black uppercase text-[#a855f7]">Edit Profile</h2>
               <button onClick={() => setShowEditProfile(false)} className="transition-transform hover:rotate-90">
                  <X size={32} className="stroke-[3]" />
               </button>
             </div>
             
             <label className="mb-2 font-black tracking-wide text-gray-800 uppercase">Full Name</label>
             <input 
               type="text" 
               value={editFullName} 
               onChange={e => setEditFullName(e.target.value)}
               className="neo-input border-4 border-neoBlack px-4 py-3 mb-6 text-lg font-bold focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none transition-shadow bg-white"
             />

             <label className="mb-2 font-black tracking-wide text-gray-800 uppercase">Email</label>
             <input 
               type="email" 
               value={editEmail} 
               onChange={e => setEditEmail(e.target.value)}
               className="neo-input border-4 border-neoBlack px-4 py-3 mb-8 text-lg font-bold focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none transition-shadow bg-white"
             />
             
             <label className="mb-2 font-black tracking-wide text-gray-800 uppercase">Avatar (1x1)</label>
             <div className="border-4 border-dashed border-neoBlack py-10 px-6 mb-8 min-h-[140px] flex items-center justify-center bg-gray-50 relative overflow-hidden group hover:bg-gray-100 transition-colors">
               <input 
                 type="file" 
                 accept="image/*"
                 onChange={e => setAvatarFile(e.target.files[0])}
                 className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
               />
               {/* Added gap-3 here to fix the overlapping! */}
               <div className="flex flex-col items-center gap-3 text-center">
                 <Upload size={36} className="stroke-[3] text-gray-700 group-hover:-translate-y-1 transition-transform" />
                 <p className="text-lg font-bold text-gray-800">{avatarFile ? avatarFile.name : "Choose new avatar"}</p>
               </div>
             </div>

             <label className="mb-2 font-black tracking-wide text-gray-800 uppercase">Cover Image (16x9)</label>
             <div className="border-4 border-dashed border-neoBlack py-10 px-6 mb-10 min-h-[140px] flex items-center justify-center bg-gray-50 relative overflow-hidden group hover:bg-gray-100 transition-colors">
               <input 
                 type="file" 
                 accept="image/*"
                 onChange={e => setCoverFile(e.target.files[0])}
                 className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
               />
               <div className="flex flex-col items-center gap-3 text-center">
                 <Upload size={36} className="stroke-[3] text-gray-700 group-hover:-translate-y-1 transition-transform" />
                 <p className="text-lg font-bold text-gray-800">{coverFile ? coverFile.name : "Choose new cover"}</p>
               </div>
             </div>
             
             <button 
               onClick={handleUpdateProfile}
               disabled={isUpdating}
               className="p-4 font-black uppercase tracking-widest border-4 border-neoBlack bg-[#a855f7] text-white text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all hover:bg-purple-600 disabled:opacity-70 disabled:cursor-not-allowed"
             >
               {isUpdating ? 'Saving Mastery...' : 'Save Mastery'}
             </button>
          </div>
        </div>
      )}
    </div>
  );
};
