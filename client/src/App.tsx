// client/src/App.tsx
import { Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Signup          from "./pages/Auth/Signup";
import Login           from "./pages/Auth/Login";
import CompleteProfile from "./pages/Auth/CompleteProfile";
import Home            from "./pages/Dashboard/Home";
import EditProfile     from "./pages/Profile/EditProfile";
import FoodDatabase    from "./pages/Food/FoodDatabase";
import FoodDetail      from "./pages/Food/FoodDetail";
import AddFood         from "./pages/Food/AddFood";
import CreatePlan      from "./pages/Plan/CreatePlan";
import PlanDetail      from "./pages/Plan/PlanDetail";
import DailyTrack      from "./pages/Plan/DailyTrack";
import Recommendation  from "./pages/Plan/Recommendation";
import PlanStats       from "./pages/Plan/PlanStats";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="flex min-h-screen flex-col">
          <main className="flex-1">
            <Routes>
              {/* Auth */}
              <Route path="/signup"           element={<Signup />} />
              <Route path="/login"            element={<Login />} />
              <Route path="/complete-profile" element={<CompleteProfile />} />

              {/* Dashboard */}
              <Route path="/" element={<Home />} />

              {/* Profile */}
              <Route path="/profile" element={<EditProfile />} />

              {/* Food — /food/add before /food/:id to avoid param clash */}
              <Route path="/food"     element={<FoodDatabase />} />
              <Route path="/food/add" element={<AddFood />} />
              <Route path="/food/:id" element={<FoodDetail />} />

              {/* Plans */}
              <Route path="/plans/create"                                   element={<CreatePlan />} />
              <Route path="/plans/:planId/track"                            element={<PlanDetail />} />
              <Route path="/plans/:planId/today"                            element={<DailyTrack />} />
              <Route path="/plans/:planId/recommendation/:progressId"       element={<Recommendation />} />
              <Route path="/plans/:planId/stats"                            element={<PlanStats />} />

              {/* 404 */}
              <Route path="*" element={
                <div className="flex min-h-screen items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold mb-2">404</h1>
                    <p className="text-slate-500">Page not found</p>
                  </div>
                </div>
              } />
            </Routes>
          </main>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;