// client/src/pages/Auth/CompleteProfile.tsx
// Shown to new Google sign-up users only.
// Step 1: Set a real password (replaces the temp one stored during Google signup)
// Step 2: Gender, age, weight, height — same fields as manual signup step 2
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { completeUserProfile } from "../../api/authApi";
import { changePassword } from "../../api/userApi";

const CompleteProfile = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);

  const [passwords, setPasswords]     = useState({ newPassword: "", confirmPassword: "" });
  const [personalInfo, setPersonalInfo] = useState({ gender: "", age: "", weight: "", height: "" });

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const token = localStorage.getItem("token") || "";

  // ── Step 1: set real password ─────────────────────────────────────────────
  // We call changePassword with the googleId-based temp password… but we don't
  // know the temp password on the frontend. Instead, add a dedicated
  // POST /api/auth/set-google-password endpoint that doesn't require currentPassword.
  // For now we use a separate authApi call — see completeUserProfile below which
  // accepts an optional password field.
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (passwords.newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    // We'll save the password together with personal info in step 2
    // so we don't need an extra API call here — just move to step 2
    setStep(2);
  };

  // ── Step 2: save everything in one call ───────────────────────────────────
  const handlePersonalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (Number(personalInfo.age) <= 0 || Number(personalInfo.weight) <= 0 || Number(personalInfo.height) <= 0) {
      setError("Age, weight, and height must be greater than 0.");
      return;
    }

    setLoading(true);
    try {
      // Send personal info + new password together in one PUT /api/user/profile call
      await completeUserProfile(token, {
        ...personalInfo,
        password: passwords.newPassword,
      });
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step dots ─────────────────────────────────────────────────────────────
  const StepDots = () => (
    <div className="flex items-center gap-2 mb-7">
      {[1, 2].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
            style={{ background: step >= s ? "#1c1917" : "#e7e5e4", color: step >= s ? "#f59e0b" : "#a8a29e" }}
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
        {step === 1 ? "Set a password" : "Personal info"}
      </span>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        .cp-root { font-family: 'DM Sans', sans-serif; }
        .serif { font-family: 'DM Serif Display', serif; }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .slide-in { animation: slideIn 0.35s ease both; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fu { animation: fadeUp 0.4s ease both; }
        .d1 { animation-delay: 0.07s; }
        .d2 { animation-delay: 0.14s; }
        .d3 { animation-delay: 0.21s; }

        .cp-input, .cp-select {
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
        .cp-input:focus, .cp-select:focus {
          border-color: #f59e0b;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.12);
          background: #fff;
        }
        .cp-input::placeholder { color: #a8a29e; }
        .cp-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a8a29e' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 36px;
        }
      `}</style>

      <div className="cp-root min-h-screen bg-stone-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2 fu">

          {/* Left panel */}
          <div className="hidden md:flex flex-col justify-between bg-stone-900 text-white p-10">
            <div>
              <div className="flex items-center gap-2 mb-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v7a4 4 0 004 4h0a4 4 0 004-4V3M7 14v7M17 3a4 4 0 010 8v9" />
                </svg>
                <span className="serif text-lg text-amber-400 tracking-wide">MealBudget</span>
              </div>
              <h2 className="serif text-4xl leading-tight mb-4">
                Almost<br /><span className="text-amber-400">there.</span>
              </h2>
              <p className="text-stone-400 text-sm leading-relaxed">
                {step === 1
                  ? "Set a password so you can also log in with email in the future."
                  : "Tell us about yourself so we can personalise your macro targets."}
              </p>
              <ul className="mt-8 flex flex-col gap-3">
                {["Personalised calorie targets", "Macro breakdown by goal", "Tailored meal planning"].map((f) => (
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
            </div>
            <div className="mt-10">
              <p className="text-xs text-stone-500 uppercase tracking-widest mb-3">Google sign-up</p>
              <div className="flex gap-2">
                {[1, 2].map((s) => (
                  <div key={s} className="h-1 flex-1 rounded-full transition-all duration-500"
                    style={{ background: step >= s ? "#f59e0b" : "#3d3836" }} />
                ))}
              </div>
              <p className="text-xs text-stone-500 mt-2">Step {step} of 2</p>
            </div>
          </div>

          {/* Right form */}
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-8 md:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v7a4 4 0 004 4h0a4 4 0 004-4V3M7 14v7M17 3a4 4 0 010 8v9" />
              </svg>
              <span className="serif text-lg text-stone-800 tracking-wide">MealBudget</span>
            </div>

            {/* Google badge */}
            <div className="flex items-center gap-3 mb-6 p-3 bg-stone-50 rounded-xl border border-stone-100 fu">
              <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-4 h-4">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <p className="text-xs text-stone-500">You signed in with Google — complete your profile to continue.</p>
            </div>

            {error && (
              <div className="mb-5 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl p-3">{error}</div>
            )}

            {/* STEP 1 — password */}
            {step === 1 && (
              <div key="step1" className="slide-in">
                <StepDots />
                <h1 className="serif text-3xl text-stone-900 mb-1">Set a password</h1>
                <p className="text-stone-400 text-sm mb-6">So you can also log in with email in the future.</p>

                <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                  <div className="fu d1">
                    <label className="block text-xs text-stone-500 uppercase tracking-widest font-medium mb-1.5">Password</label>
                    <input className="cp-input" type="password" placeholder="min. 6 characters" required
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
                  </div>
                  <div className="fu d2">
                    <label className="block text-xs text-stone-500 uppercase tracking-widest font-medium mb-1.5">Confirm Password</label>
                    <input className="cp-input" type="password" placeholder="••••••••" required
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} />
                  </div>
                  <button type="submit"
                    className="fu d3 mt-1 w-full bg-stone-900 hover:bg-amber-400 hover:text-stone-900 text-white font-semibold py-3 rounded-xl transition-all duration-200 text-sm tracking-wide flex items-center justify-center gap-2">
                    Continue
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </form>
              </div>
            )}

            {/* STEP 2 — personal info */}
            {step === 2 && (
              <div key="step2" className="slide-in">
                <StepDots />
                <h1 className="serif text-3xl text-stone-900 mb-1">Personal info</h1>
                <p className="text-stone-400 text-sm mb-6">Help us personalise your macro targets.</p>

                <form onSubmit={handlePersonalSubmit} className="flex flex-col gap-4">
                  <div className="fu d1">
                    <label className="block text-xs text-stone-500 uppercase tracking-widest font-medium mb-1.5">Gender</label>
                    <select className="cp-select" required value={personalInfo.gender}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, gender: e.target.value })}>
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-3 fu d2">
                    {[
                      { label: "Age", key: "age", placeholder: "25", step: "1" },
                      { label: "Weight (kg)", key: "weight", placeholder: "70", step: "0.1" },
                      { label: "Height (cm)", key: "height", placeholder: "170", step: "0.1" },
                    ].map((f) => (
                      <div key={f.key}>
                        <label className="block text-xs text-stone-500 uppercase tracking-widest font-medium mb-1.5">{f.label}</label>
                        <input className="cp-input" type="number" placeholder={f.placeholder} min={1} step={f.step} required
                          value={personalInfo[f.key as keyof typeof personalInfo]}
                          onChange={(e) => setPersonalInfo({ ...personalInfo, [f.key]: e.target.value })} />
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 mt-1 fu d3">
                    <button type="button" onClick={() => { setStep(1); setError(""); }}
                      className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold py-3 rounded-xl transition text-sm flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                      Back
                    </button>
                    <button type="submit" disabled={loading}
                      className="flex-[2] bg-stone-900 hover:bg-amber-400 hover:text-stone-900 text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 text-sm tracking-wide">
                      {loading ? "Saving…" : "Go to Dashboard →"}
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

export default CompleteProfile;