// client/src/pages/Dashboard/Home.tsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { fetchUserProfile } from "../../api/userApi";

const Home = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    // If no token, kick them back to login
    if (!token) {
      navigate("/login");
      return;
    }

    const loadProfile = async () => {
      try {
        const userData = await fetchUserProfile(token);
        setUser(userData);
      } catch (error) {
        console.error("Session expired or error:", error);
        localStorage.removeItem("token");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  // Handle Logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-600 font-medium">Loading your dashboard...</div>;
  }

  return (
    // Outer container adds padding on PC (md:p-8) but stays flush on mobile (p-0)
    <div className="min-h-screen bg-slate-100 flex justify-center md:p-8">
      
      {/* Responsive Container: 
        Mobile: max-w-md (phone width), full screen height.
        PC (md:): max-w-5xl (wide), rounded corners, adapts to content height.
      */}
      <div className="w-full max-w-md md:max-w-5xl bg-white md:rounded-3xl shadow-xl min-h-screen md:min-h-fit flex flex-col overflow-hidden">
        
        {/* Header / Profile Section */}
        <div className="bg-emerald-600 text-white p-6 md:p-10 rounded-b-3xl md:rounded-none">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-3xl font-bold shadow-inner">
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{user?.username || "User"}</h1>
                <p className="text-emerald-100 text-sm md:text-base mt-1">Ready to plan your meals?</p>
              </div>
            </div>

            {/* Logout Button */}
            <button 
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-md"
            >
              Logout
            </button>
          </div>

          <Link 
            to="/profile" 
            className="block text-center w-full bg-white/20 hover:bg-white/30 transition py-2.5 rounded-xl font-medium text-sm md:text-base border border-white/10"
          >
            Edit Profile
          </Link>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6 md:p-10 flex flex-col gap-8">
          
          {/* Quick Stats Grid - 2 cols on mobile, 4 cols on PC */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl text-center shadow-sm">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Weight</p>
              <p className="text-2xl font-bold text-slate-800">{user?.weight || "-"} <span className="text-sm font-medium text-slate-500">kg</span></p>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl text-center shadow-sm">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Height</p>
              <p className="text-2xl font-bold text-slate-800">{user?.height || "-"} <span className="text-sm font-medium text-slate-500">cm</span></p>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl text-center shadow-sm">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Goal</p>
              <p className="text-lg font-bold text-slate-800 capitalize truncate mt-1">{user?.fitness_goal || "Not set"}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl text-center shadow-sm">
              <p className="text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">Daily Cal</p>
              <p className="text-2xl font-bold text-emerald-700">
                {user?.macro_targets?.daily_cal ? Math.round(user.macro_targets.daily_cal) : "-"}
              </p>
            </div>
          </div>

          {/* Big Action Buttons - Stacked on mobile, side-by-side on PC */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 mt-2">
            
            {/* Create Plan gets half the screen on PC */}
            <Link 
              to="/create-plan"
              className="flex-1 bg-emerald-50 border-2 border-dashed border-emerald-300 text-emerald-700 py-12 rounded-3xl flex flex-col items-center justify-center hover:bg-emerald-100 hover:border-emerald-400 transition group"
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-4xl shadow-sm group-hover:scale-110 transition-transform mb-4 text-emerald-500">
                +
              </div>
              <span className="font-bold text-xl">Create New Plan</span>
              <p className="text-sm text-emerald-600 mt-2">Set your meals and budget constraints</p>
            </Link>

            {/* Other actions stack next to Create Plan on PC */}
            <div className="flex-1 flex flex-col gap-4">
              <Link 
                to="/menu"
                className="w-full flex-1 bg-slate-800 text-white py-6 md:py-0 rounded-2xl flex items-center justify-center text-lg font-semibold hover:bg-slate-700 transition shadow-md"
              >
                View Food Database
              </Link>
              <Link 
                to="/progress"
                className="w-full flex-1 bg-white border border-slate-200 text-slate-700 py-6 md:py-0 rounded-2xl flex items-center justify-center text-lg font-semibold hover:border-slate-300 hover:bg-slate-50 transition shadow-sm"
              >
                View Daily Progress
              </Link>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Home;