// client/src/pages/Auth/Signup.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { signupUser, googleLoginUser } from "../../api/authApi";
import type { SignupCredentials } from "../../types/auth";

// Step 1 fields only
type Step1Data = { username: string; email: string; password: string };

const Signup = () => {
  const navigate = useNavigate();

  // ── State ────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2>(1);
  const [step1, setStep1] = useState<Step1Data>({ username: "", email: "", password: "" });
  const [step2, setStep2] = useState({ gender: "", age: "", weight: "", height: "" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleStep1Change = (e: React.ChangeEvent<HTMLInputElement>) =>
    setStep1({ ...step1, [e.target.name]: e.target.value });

  const handleStep2Change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setStep2({ ...step2, [e.target.name]: e.target.value });

  // Validate step 1 and proceed
  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!step1.username || !step1.email || !step1.password) {
      setError("Please fill in all fields.");
      return;
    }
    if (step1.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setStep(2);
  };

  // Final submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (Number(step2.age) <= 0 || Number(step2.weight) <= 0 || Number(step2.height) <= 0) {
      setError("Age, weight, and height must be greater than 0.");
      return;
    }

    setLoading(true);
    try {
      const payload: SignupCredentials = {
        ...step1,
        gender: step2.gender,
        age: Number(step2.age),
        weight: Number(step2.weight),
        height: Number(step2.height),
      };
      const data = await signupUser(payload);
      localStorage.setItem("token", data.token);
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Google signup ─────────────────────────────────────────────────────────
  const handleGoogleSignup = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setError("");
      try {
        const data = await googleLoginUser(tokenResponse.access_token);
        localStorage.setItem("token", data.token);
        if (data.isNewUser) {
          navigate("/complete-profile");
        } else {
          navigate("/");
        }
      } catch (err: any) {
        setError(err.message || "Google sign-up failed");
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => setError("Google sign-in was cancelled or failed."),
  });

  // ── Progress dots ─────────────────────────────────────────────────────────
  const StepDots = () => (
    <div className="flex items-center gap-2 mb-7">
      {[1, 2].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
            style={{
              background: step >= s ? "#1c1917" : "#e7e5e4",
              color: step >= s ? "#f59e0b" : "#a8a29e",
            }}
          >
            {step > s ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : s}
          </div>
          {s < 2 && <div className="w-8 h-px" style={{ background: step > s ? "#1c1917" : "#e7e5e4" }} />}
        </div>
      ))}
      <span className="ml-1 text-xs text-stone-400">
        {step === 1 ? "Account details" : "Personal info"}
      </span>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        .auth-root { font-family: 'DM Sans', sans-serif; }
        .serif { font-family: 'DM Serif Display', serif; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fu  { animation: fadeUp 0.4s ease both; }
        .d1  { animation-delay: 0.06s; }
        .d2  { animation-delay: 0.12s; }
        .d3  { animation-delay: 0.18s; }
        .d4  { animation-delay: 0.24s; }
        .d5  { animation-delay: 0.30s; }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .slide-in { animation: slideIn 0.35s ease both; }

        .auth-input, .auth-select {
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
        .auth-input:focus, .auth-select:focus {
          border-color: #f59e0b;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.12);
          background: #fff;
        }
        .auth-input::placeholder { color: #a8a29e; }
        .auth-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a8a29e' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 36px;
        }
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
                Start your<br /><span className="text-amber-400">journey.</span>
              </h2>
              <p className="text-stone-400 text-sm leading-relaxed">
                Create an account to plan meals, control your budget, and meet your nutritional goals effortlessly.
              </p>
              <ul className="mt-8 flex flex-col gap-3">
                {["Personalised macro targets", "Meal budget planning", "Track daily progress"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-stone-300">
                    <span className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5 text-stone-900" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* Step indicator on left panel */}
              <div className="mt-10 pt-8 border-t border-stone-800">
                <p className="text-xs text-stone-500 uppercase tracking-widest mb-3">Progress</p>
                <div className="flex gap-2">
                  {[1, 2].map((s) => (
                    <div
                      key={s}
                      className="h-1 flex-1 rounded-full transition-all duration-500"
                      style={{ background: step >= s ? "#f59e0b" : "#3d3836" }}
                    />
                  ))}
                </div>
                <p className="text-xs text-stone-500 mt-2">
                  Step {step} of 2 — {step === 1 ? "Account details" : "Personal info"}
                </p>
              </div>
            </div>
          </div>

          {/* ── Right form ── */}
          <div className="p-8 md:p-10 flex flex-col justify-center overflow-y-auto">
            {/* Mobile brand */}
            <div className="flex items-center gap-2 mb-6 md:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v7a4 4 0 004 4h0a4 4 0 004-4V3M7 14v7M17 3a4 4 0 010 8v9" />
              </svg>
              <span className="serif text-lg text-stone-800 tracking-wide">MealBudget</span>
            </div>

            {error && (
              <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl p-3">
                {error}
              </div>
            )}

            {/* ════ STEP 1 ════ */}
            {step === 1 && (
              <div key="step1" className="slide-in">
                <StepDots />
                <h1 className="serif text-3xl text-stone-900 mb-1">Create account</h1>
                <p className="text-stone-400 text-sm mb-6">Fill in your account details to get started.</p>

                {/* Google signup */}
                <button
                  className="google-btn mb-5"
                  onClick={() => handleGoogleSignup()}
                  disabled={googleLoading}
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
                  {googleLoading ? "Connecting…" : "Continue with Google"}
                </button>

                <div className="divider mb-5">
                  <span className="text-stone-400 text-xs">or sign up with email</span>
                </div>

                <form onSubmit={handleStep1Next} className="flex flex-col gap-4">
                  <div className="fu d1">
                    <label className="block text-xs text-stone-500 uppercase tracking-widest font-medium mb-1.5">Username</label>
                    <input className="auth-input" type="text" name="username" placeholder="johndoe"
                      required value={step1.username} onChange={handleStep1Change} />
                  </div>
                  <div className="fu d2">
                    <label className="block text-xs text-stone-500 uppercase tracking-widest font-medium mb-1.5">Email</label>
                    <input className="auth-input" type="email" name="email" placeholder="you@example.com"
                      required value={step1.email} onChange={handleStep1Change} />
                  </div>
                  <div className="fu d3">
                    <label className="block text-xs text-stone-500 uppercase tracking-widest font-medium mb-1.5">Password</label>
                    <input className="auth-input" type="password" name="password" placeholder="min. 6 characters"
                      required minLength={6} value={step1.password} onChange={handleStep1Change} />
                  </div>

                  <button
                    type="submit"
                    disabled={googleLoading}
                    className="fu d4 mt-1 w-full bg-stone-900 hover:bg-amber-400 hover:text-stone-900 text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 text-sm tracking-wide flex items-center justify-center gap-2"
                  >
                    Continue
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </form>

                <p className="text-sm text-stone-400 mt-5 text-center fu d5">
                  Already have an account?{" "}
                  <Link to="/login" className="text-amber-500 font-semibold hover:text-amber-600 transition">Login</Link>
                </p>
              </div>
            )}

            {/* ════ STEP 2 ════ */}
            {step === 2 && (
              <div key="step2" className="slide-in">
                <StepDots />
                <h1 className="serif text-3xl text-stone-900 mb-1">Personal info</h1>
                <p className="text-stone-400 text-sm mb-6">Help us personalise your macro targets.</p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="fu d1">
                    <label className="block text-xs text-stone-500 uppercase tracking-widest font-medium mb-1.5">Gender</label>
                    <select className="auth-select" name="gender" required value={step2.gender} onChange={handleStep2Change}>
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-3 fu d2">
                    <div>
                      <label className="block text-xs text-stone-500 uppercase tracking-widest font-medium mb-1.5">Age</label>
                      <input className="auth-input" type="number" name="age" placeholder="25"
                        min={1} step={1} required value={step2.age} onChange={handleStep2Change} />
                    </div>
                    <div>
                      <label className="block text-xs text-stone-500 uppercase tracking-widest font-medium mb-1.5">
                        Weight <span className="normal-case text-stone-400">(kg)</span>
                      </label>
                      <input className="auth-input" type="number" name="weight" placeholder="70"
                        min={1} step={0.1} required value={step2.weight} onChange={handleStep2Change} />
                    </div>
                    <div>
                      <label className="block text-xs text-stone-500 uppercase tracking-widest font-medium mb-1.5">
                        Height <span className="normal-case text-stone-400">(cm)</span>
                      </label>
                      <input className="auth-input" type="number" name="height" placeholder="170"
                        min={1} step={0.1} required value={step2.height} onChange={handleStep2Change} />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-1 fu d3">
                    <button
                      type="button"
                      onClick={() => { setStep(1); setError(""); }}
                      className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold py-3 rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-[2] bg-stone-900 hover:bg-amber-400 hover:text-stone-900 text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 text-sm tracking-wide"
                    >
                      {loading ? "Creating account…" : "Create Account"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;