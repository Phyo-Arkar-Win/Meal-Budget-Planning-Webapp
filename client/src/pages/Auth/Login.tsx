// client/src/pages/Auth/Login.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { loginUser, googleLoginUser } from "../../api/authApi";
import type { LoginCredentials } from "../../types/auth";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginCredentials>({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ── Manual login ──────────────────────────────────────────────────────────
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

  // ── Google login ──────────────────────────────────────────────────────────
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setError(null);
      try {
        // useGoogleLogin returns an access_token, not an id_token.
        // We fetch the user info from Google then send the access_token to
        // our backend. NOTE: update your backend to accept access_token OR
        // switch to CredentialResponse flow — see README note below.
        const data = await googleLoginUser(tokenResponse.access_token);
        localStorage.setItem("token", data.token);
        // isNewUser = true means they signed up via Google and still need personal info
        if (data.isNewUser) {
          navigate("/complete-profile");
        } else {
          navigate("/");
        }
      } catch (err: any) {
        setError(err.message || "Google login failed");
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => setError("Google sign-in was cancelled or failed."),
  });

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
        .fu { animation: fadeUp 0.45s ease both; }
        .d1 { animation-delay: 0.07s; }
        .d2 { animation-delay: 0.14s; }
        .d3 { animation-delay: 0.21s; }
        .d4 { animation-delay: 0.28s; }

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

        .google-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: #fff;
          border: 1.5px solid #e7e5e4;
          border-radius: 12px;
          padding: 11px 16px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          color: #1c1917;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .google-btn:hover {
          border-color: #d6d3d1;
          background: #fafaf9;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .google-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #d6d3d1;
          font-size: 12px;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e7e5e4;
        }
      `}</style>

      <div className="auth-root min-h-screen bg-stone-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2 fu">

          {/* ── Left branding panel ── */}
          <div className="hidden md:flex flex-col justify-between bg-stone-900 text-white p-10">
            <div>
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
            <div className="flex gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full" style={{ background: i === 0 ? "#f59e0b" : "#3d3836" }} />
              ))}
            </div>
          </div>

          {/* ── Right form ── */}
          <div className="p-8 md:p-12 flex flex-col justify-center">
            {/* Mobile brand */}
            <div className="flex items-center gap-2 mb-8 md:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v7a4 4 0 004 4h0a4 4 0 004-4V3M7 14v7M17 3a4 4 0 010 8v9" />
              </svg>
              <span className="serif text-lg text-stone-800 tracking-wide">MealBudget</span>
            </div>

            <h1 className="serif text-3xl text-stone-900 mb-1 fu">Login</h1>
            <p className="text-stone-400 text-sm mb-7 fu d1">Enter your credentials to access your dashboard.</p>

            {error && (
              <div className="mb-5 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl p-3">
                {error}
              </div>
            )}

            {/* Google button */}
            <div className="fu d1 mb-5">
              <button
                className="google-btn"
                onClick={() => handleGoogleLogin()}
                disabled={googleLoading || loading}
                type="button"
              >
                {googleLoading ? (
                  <div className="w-4 h-4 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin" />
                ) : (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                {googleLoading ? "Signing in…" : "Continue with Google"}
              </button>
            </div>

            <div className="divider fu d2 mb-5">
              <span className="text-stone-400 text-xs">or login with email</span>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="fu d2">
                <label className="block text-xs text-stone-500 uppercase tracking-widest font-medium mb-1.5">Email</label>
                <input className="auth-input" type="email" name="email" placeholder="you@example.com"
                  required value={formData.email} onChange={handleChange} />
              </div>

              <div className="fu d3">
                <label className="block text-xs text-stone-500 uppercase tracking-widest font-medium mb-1.5">Password</label>
                <input className="auth-input" type="password" name="password" placeholder="••••••••"
                  required value={formData.password} onChange={handleChange} />
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="fu d4 mt-1 w-full bg-stone-900 hover:bg-amber-400 hover:text-stone-900 text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 text-sm tracking-wide"
              >
                {loading ? "Signing in…" : "Sign In"}
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