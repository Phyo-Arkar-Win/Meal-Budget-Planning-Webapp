// client/src/App.tsx
import { Routes, Route } from "react-router-dom"; // Removed Navigate
import Signup from "./pages/Auth/Signup";
import Login from "./pages/Auth/Login";
import Home from "./pages/Dashboard/Home";

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          <Routes>
            {/* Auth routes */}
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            
            {/* The Home page is now the default "/" route */}
            <Route path="/" element={<Home />} />

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
  );
}

export default App;