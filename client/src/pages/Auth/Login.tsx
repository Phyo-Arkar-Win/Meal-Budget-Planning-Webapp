// client/src/pages/Auth/Login.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../../api/authApi";
import type { LoginCredentials } from "../../types/auth";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginCredentials>({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await loginUser(formData);
      localStorage.setItem("token", data.token);
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        .auth-root { font-family: 'DM Sans', sans-serif; }
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

        .auth-input {
          width: 100%;
          background: #fafaf9;
          border: 1.5px solid #e7e5e4;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #1c1917;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .auth-input:focus {
          border-color: #f59e0b;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.12);
          background: #fff;
        }
        .auth-input::placeholder { color: #a8a29e; }
      `}</style>

      <div className="auth-root min-h-screen bg-stone-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2 fu">

          {/* Left — dark branding panel */}
          <div className="hidden md:flex flex-col justify-between bg-stone-900 text-white p-10">
            <div>
              {/* Brand mark */}
              <div className="flex items-center gap-2 mb-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v7a4 4 0 004 4h0a4 4 0 004-4V3M7 14v7M17 3a4 4 0 010 8v9" />
                </svg>
                <span className="serif text-lg text-amber-400 tracking-wide">MealBudget</span>
              </div>

              <h2 className="serif text-4xl leading-tight mb-4">
                Welcome<br /><span className="text-amber-400">back.</span>
              </h2>
              <p className="text-stone-400 text-sm leading-relaxed">
                Log in to continue managing your meals, budget, and nutrition goals — all in one place.
              </p>
            </div>

            {/* Decorative dots */}
            <div className="flex gap-2 mt-12">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full" style={{ background: i === 0 ? "#f59e0b" : "#3d3836" }} />
              ))}
            </div>
          </div>

          {/* Right — form */}
          <div className="p-8 md:p-12 flex flex-col justify-center">
            {/* Mobile brand */}
            <div className="flex items-center gap-2 mb-8 md:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v7a4 4 0 004 4h0a4 4 0 004-4V3M7 14v7M17 3a4 4 0 010 8v9" />
              </svg>
              <span className="serif text-lg text-stone-800 tracking-wide">MealBudget</span>
            </div>

            <h1 className="serif text-3xl text-stone-900 mb-1 fu">Login</h1>
            <p className="text-stone-400 text-sm mb-8 fu d1">Enter your credentials to access your dashboard.</p>

            {error && (
              <div className="mb-5 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl p-3 fu">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="fu d1">
                <label className="block text-xs text-stone-500 uppercase tracking-widest font-medium mb-1.5">Email</label>
                <input
                  className="auth-input"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  required
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="fu d2">
                <label className="block text-xs text-stone-500 uppercase tracking-widest font-medium mb-1.5">Password</label>
                <input
                  className="auth-input"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="fu d3 mt-2 w-full bg-stone-900 hover:bg-amber-400 hover:text-stone-900 text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 text-sm tracking-wide"
              >
                {loading ? "Logging in…" : "Login"}
              </button>
            </form>

            <p className="text-sm text-stone-400 mt-6 text-center fu d4">
              Don't have an account?{" "}
              <Link to="/signup" className="text-amber-500 font-semibold hover:text-amber-600 transition">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;