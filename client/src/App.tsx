// client/src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/Auth/Signup";
import Login from "./pages/Auth/Login";

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          <Routes>
            {/* Default route */}
            <Route path="/" element={<Navigate to="/signup" replace />} />

            {/* Auth routes */}
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />

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