import { Routes, Route, Navigate } from "react-router-dom";
import Signup from "./components/signup";
import Login from "./components/login";
// import Login from "./pages/Login";
// import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      
      {/* App Container */}
      <div className="flex min-h-screen flex-col">

        {/* Page Content */}
        <main className="flex-1">
          <Routes>

            {/* Default route */}
            <Route path="/" element={<Navigate to="/signup" replace />} />

            {/* Auth routes */}
            <Route path="/signup" element={<Signup />} />
            {/* <Route path="/login" element={<Login />} /> */}

            <Route path="/login" element={<Login />} />

            {/* Protected routes (future) */}
            {/* <Route path="/dashboard" element={<Dashboard />} /> */}

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