// client/src/App.tsx
import { Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Signup from "./pages/Auth/Signup";
import Login from "./pages/Auth/Login";
import CompleteProfile from "./pages/Auth/CompleteProfile"; // ← NEW
import Home from "./pages/Dashboard/Home";
import EditProfile from "./pages/Profile/EditProfile";
import FoodDatabase from "./pages/Food/FoodDatabase";
import FoodDetail from "./pages/Food/FoodDetail";
import AddFood from "./pages/Food/AddFood";
import CreatePlan from "./pages/Plan/CreatePlan";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="flex min-h-screen flex-col">
          <main className="flex-1">
            <Routes>
              {/* Auth routes */}
              <Route path="/signup"           element={<Signup />} />
              <Route path="/login"            element={<Login />} />
              <Route path="/complete-profile" element={<CompleteProfile />} /> {/* ← NEW */}

              {/* Dashboard */}
              <Route path="/" element={<Home />} />

              {/* Profile */}
              <Route path="/profile" element={<EditProfile />} />

              {/* Food */}
              <Route path="/food"     element={<FoodDatabase />} />
              <Route path="/food/:id" element={<FoodDetail />} />
              <Route path="/food/add" element={<AddFood />} />

              {/* Plans */}
              <Route path="/plans/create" element={<CreatePlan />} />

              {/* 404 fallback */}
              <Route
                path="*"
                element={
                  <div className="flex min-h-screen items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold mb-2">404</h1>
                      <p className="text-slate-500">Page not found</p>
                    </div>
                  </div>
                }
              />
            </Routes>
          </main>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;