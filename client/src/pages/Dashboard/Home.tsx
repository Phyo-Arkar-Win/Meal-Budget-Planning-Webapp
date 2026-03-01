// client/src/pages/Dashboard/Home.tsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { fetchUserProfile } from "../../api/userApi";
import foodBg from "../../assets/food-bg.jpg";

const Home = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
          <p className="text-stone-400 text-sm tracking-wide">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const macros = user?.macro_targets;
  const initial = user?.username?.charAt(0).toUpperCase() || "U";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        .home-root * { box-sizing: border-box; }
        .home-root { font-family: 'DM Sans', sans-serif; }
        .serif { font-family: 'DM Serif Display', serif; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fu  { animation: fadeUp 0.45s ease both; }
        .d1  { animation-delay: 0.07s; }
        .d2  { animation-delay: 0.14s; }
        .d3  { animation-delay: 0.21s; }
        .d4  { animation-delay: 0.28s; }
        .d5  { animation-delay: 0.35s; }
      `}</style>

      <div className="home-root min-h-screen bg-stone-50 flex">

        {/* ── SIDEBAR (md+) ───────────────────────────────────── */}
        <aside className="hidden md:flex flex-col w-72 flex-shrink-0 bg-stone-900 text-white sticky top-0 h-screen px-8 py-10">

          {/* Brand */}
          <div className="mb-10 fu">
            <div className="flex items-center gap-2 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v7a4 4 0 004 4h0a4 4 0 004-4V3M7 14v7M17 3a4 4 0 010 8v9" />
              </svg>
              <span className="serif text-lg text-amber-400 tracking-wide">MealBudget</span>
            </div>
            <p className="text-stone-500 text-[10px] tracking-widest uppercase">Planning App</p>
          </div>

          {/* Avatar + name + edit + logout */}
          <div className="flex flex-col items-center text-center mb-8 fu d1">
            <div className="w-20 h-20 rounded-full bg-amber-400 flex items-center justify-center text-stone-900 text-3xl font-bold shadow-lg mb-3 select-none overflow-hidden">
              {user?.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt={`${user.username}'s avatar`}
                  className="w-full h-full object-cover"
                />
              ) : (initial)}
            </div>
            <p className="serif text-xl text-white leading-tight">{user?.username || "User"}</p>
            <p className="text-stone-500 text-xs mt-0.5 truncate w-full text-center">{user?.email || ""}</p>

            <Link to="/profile" className="mt-2 text-xs text-stone-400 hover:text-amber-400 transition flex items-center gap-1">
              Edit Profile
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-9 9A2 2 0 0115 6l-1.414-1.414z" />
                <path d="M4 13.5V16h2.5l7.372-7.372-2.5-2.5L4 13.5z" />
              </svg>
            </Link>

            <button onClick={handleLogout} className="mt-3 flex items-center gap-1.5 text-xs text-stone-500 hover:text-red-400 transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
              </svg>
              Logout
            </button>
          </div>

          <div className="border-t border-stone-800 mb-6" />

          {/* Quick stats */}
          <div className="flex flex-col mb-8 fu d2">
            {[
              { label: "Sex",      value: user?.gender   || "—" },
              { label: "Weight",   value: user?.weight   ? `${user.weight} kg`   : "—" },
              { label: "Height",   value: user?.height   ? `${user.height} cm`   : "—" },
              { label: "Goal",     value: user?.fitness_goal    || "Not set" },
              { label: "Activity", value: user?.activity_level  || "Not set" },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-2.5 border-b border-stone-800 last:border-0">
                <span className="text-[10px] text-stone-500 uppercase tracking-widest">{item.label}</span>
                <span className="text-sm text-stone-200 font-medium capitalize text-right" style={{ maxWidth: 130 }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-1 mt-auto fu d3">
            <Link to="/food" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v7a4 4 0 004 4h0a4 4 0 004-4V3M7 14v7M17 3a4 4 0 010 8v9" />
              </svg>
              Food Database
            </Link>
            <Link to="/create-plan" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create Plan
            </Link>
            <Link to="/progress" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Progress
            </Link>
          </nav>
        </aside>

        {/* ── MAIN ────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col min-w-0">

          {/* Mobile top bar */}
          <div className="md:hidden bg-stone-900 px-5 pt-10 pb-5">
            <div className="flex items-center justify-between fu">
              <Link to="/food" className="flex flex-col items-center gap-1 text-stone-400 hover:text-amber-400 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v7a4 4 0 004 4h0a4 4 0 004-4V3M7 14v7M17 3a4 4 0 010 8v9" />
                </svg>
                <span className="text-[8px] uppercase tracking-wide text-center leading-tight" style={{ maxWidth: 52 }}>
                  See available<br />meals
                </span>
              </Link>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="serif text-white text-lg leading-tight">{user?.username || "User"}</p>
                  <Link to="/profile" className="text-[11px] text-stone-400 hover:text-amber-400 transition">Edit Profile ✎</Link>
                </div>
                <div className="w-11 h-11 rounded-full bg-amber-400 flex items-center justify-center text-stone-900 text-lg font-bold shadow flex-shrink-0 select-none">
                  {initial}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-2 fu d1">
              <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-red-400 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>

          {/* ── Scrollable content — centred with max-width ── */}
          <div className="flex-1 flex justify-center py-8 px-5 md:py-10 md:px-10">
            <div className="w-full max-w-xl flex flex-col gap-7">

              {/* PC greeting */}
              <div className="hidden md:block fu">
                <p className="text-stone-400 text-sm tracking-wide">Welcome back,</p>
                <h1 className="serif text-4xl text-stone-900 mt-0.5">{user?.username || "User"}</h1>
              </div>

              {/* ── Macronutrient Card ──────────────────────── */}
              <div className="relative rounded-2xl overflow-hidden shadow-xl fu d2" style={{ minHeight: 230 }}>
                <img src={foodBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,rgba(10,10,10,.78) 0%,rgba(10,10,10,.48) 100%)" }} />

                <div className="relative p-6 md:p-8 text-white">
                  <h2 className="serif text-xl md:text-2xl mb-5 tracking-wide">Macronutrient</h2>

                  <div className="grid grid-cols-3 gap-x-4 gap-y-4">
                    <div className="flex flex-col gap-4">
                      <div>
                        <p className="text-[9px] text-white/55 uppercase tracking-widest font-medium mb-0.5">Fitness Goal</p>
                        <p className="text-sm font-semibold capitalize leading-tight">{user?.fitness_goal || "Not set"}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-white/55 uppercase tracking-widest font-medium mb-0.5">Activity Level</p>
                        <p className="text-sm font-semibold capitalize leading-tight">{user?.activity_level || "Not set"}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 text-center">
                      <div>
                        <p className="text-[9px] text-white/55 uppercase tracking-widest font-medium mb-0.5">Protein</p>
                        <p className="text-sm font-semibold">{macros?.protein ?? "—"} <span className="text-xs text-white/55">g</span></p>
                      </div>
                      <div>
                        <p className="text-[9px] text-white/55 uppercase tracking-widest font-medium mb-0.5">Carbohydrate</p>
                        <p className="text-sm font-semibold">{macros?.carbohydrate ?? "—"} <span className="text-xs text-white/55">g</span></p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 text-center">
                      <div>
                        <p className="text-[9px] text-white/55 uppercase tracking-widest font-medium mb-0.5">Sugar</p>
                        <p className="text-sm font-semibold">{macros?.sugar ?? "—"} <span className="text-xs text-white/55">g</span></p>
                      </div>
                      <div>
                        <p className="text-[9px] text-white/55 uppercase tracking-widest font-medium mb-0.5">Fat</p>
                        <p className="text-sm font-semibold">{macros?.fat ?? "—"} <span className="text-xs text-white/55">g</span></p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/20 text-center">
                    <p className="text-[9px] text-white/55 uppercase tracking-widest font-medium mb-1">Daily Calories</p>
                    <p className="serif text-3xl text-amber-400">
                      {macros?.daily_cal ? Math.round(macros.daily_cal).toLocaleString() : "—"}
                      <span className="text-sm font-sans font-normal text-white/55 ml-2">kcal</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats row (mobile only) */}
              <div className="grid grid-cols-2 gap-3 md:hidden fu d3">
                {[
                  { label: "Weight", value: user?.weight ? `${user.weight} kg` : "—" },
                  { label: "Height", value: user?.height ? `${user.height} cm` : "—" },
                ].map((s) => (
                  <div key={s.label} className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm text-center">
                    <p className="text-[9px] text-stone-400 uppercase tracking-widest font-medium mb-1">{s.label}</p>
                    <p className="serif text-2xl text-stone-800">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* ── Your Plan ─────────────────────────────── */}
              <div className="fu d4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="serif text-2xl md:text-3xl text-stone-900">Your Plan</h2>
                  <Link
                    to="/create-plan"
                    title="Create new plan"
                    className="w-9 h-9 rounded-full bg-stone-900 text-white flex items-center justify-center text-2xl font-light hover:bg-amber-400 hover:text-stone-900 transition shadow"
                  >
                    +
                  </Link>
                </div>

                {/* Placeholder card — replace with .map() once plans API is ready */}
                <div className="bg-white border border-stone-100 rounded-2xl shadow-sm p-5 flex items-center justify-between hover:shadow-md transition">
                  <div>
                    <p className="font-semibold text-stone-800">Plan test01</p>
                    <p className="text-xs text-stone-400 mt-0.5">19 days remaining</p>
                  </div>
                  <Link
                    to="/progress"
                    className="bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-800 text-xs font-semibold px-4 py-2 rounded-full transition"
                  >
                    Progression
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Home;