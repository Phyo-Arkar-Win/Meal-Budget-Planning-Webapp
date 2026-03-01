// client/src/pages/Auth/CompleteProfile.tsx
// This page is shown ONLY to new Google sign-up users who need to fill in
// gender, age, weight, and height before accessing the dashboard.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { completeUserProfile } from "../../api/authApi";

const CompleteProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ gender: "", age: "", weight: "", height: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (Number(formData.age) <= 0 || Number(formData.weight) <= 0 || Number(formData.height) <= 0) {
      setError("Age, weight, and height must be greater than 0.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    setLoading(true);
    try {
      await completeUserProfile(token, formData);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        .cp-root { font-family: 'DM Sans', sans-serif; }
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

          {/* ── Left panel ── */}
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
                We just need a few more details to calculate your personalised macro targets and daily calorie goal.
              </p>

              <ul className="mt-8 flex flex-col gap-3">
                {[
                  "Personalised calorie targets",
                  "Macro breakdown by goal",
                  "Tailored meal planning",
                ].map((f) => (
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

            {/* Step indicator */}
            <div className="mt-10">
              <p className="text-xs text-stone-500 uppercase tracking-widest mb-3">Google sign-up — final step</p>
              <div className="h-1 w-full rounded-full bg-amber-400" />
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

            {/* Google avatar hint */}
            <div className="flex items-center gap-3 mb-6 p-3 bg-stone-50 rounded-xl border border-stone-100 fu">
              <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-4 h-4">
                  <path fill="#1c1917" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                </svg>
              </div>
              <p className="text-xs text-stone-500 leading-snug">
                You signed in with Google. Complete your profile to get started.
              </p>
            </div>

            <h1 className="serif text-3xl text-stone-900 mb-1 fu d1">Complete your profile</h1>
            <p className="text-stone-400 text-sm mb-7 fu d1">This helps us calculate your personal nutrition targets.</p>

            {error && (
              <div className="mb-5 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl p-3">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="fu d2">
                <label className="block text-xs text-stone-500 uppercase tracking-widest font-medium mb-1.5">Gender</label>
                <select className="cp-select" name="gender" required value={formData.gender} onChange={handleChange}>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3 fu d3">
                <div>
                  <label className="block text-xs text-stone-500 uppercase tracking-widest font-medium mb-1.5">Age</label>
                  <input className="cp-input" type="number" name="age" placeholder="25"
                    min={1} step={1} required value={formData.age} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 uppercase tracking-widest font-medium mb-1.5">
                    Weight <span className="normal-case text-stone-400">(kg)</span>
                  </label>
                  <input className="cp-input" type="number" name="weight" placeholder="70"
                    min={1} step={0.1} required value={formData.weight} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 uppercase tracking-widest font-medium mb-1.5">
                    Height <span className="normal-case text-stone-400">(cm)</span>
                  </label>
                  <input className="cp-input" type="number" name="height" placeholder="170"
                    min={1} step={0.1} required value={formData.height} onChange={handleChange} />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="fu d4 mt-2 w-full bg-stone-900 hover:bg-amber-400 hover:text-stone-900 text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 text-sm tracking-wide"
              >
                {loading ? "Saving…" : "Go to Dashboard →"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CompleteProfile;