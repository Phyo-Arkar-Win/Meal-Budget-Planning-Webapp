// client/src/pages/Auth/Signup.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signupUser } from "../../api/authApi";
import type { SignupCredentials } from "../../types/auth";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SignupCredentials>({
    username: "", email: "", password: "",
    gender: "", age: "", weight: "", height: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);

    if (Number(formData.age) <= 0 || Number(formData.weight) <= 0 || Number(formData.height) <= 0) {
      alert("Age, weight, and height must be greater than 0");
      setLoading(false);
      return;
    }

    try {
      const data = await signupUser(formData);
      setSuccess("Account created successfully 🎉");
      setFormData({ username: "", email: "", password: "", gender: "", age: "", weight: "", height: "" });
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
        .d1  { animation-delay: 0.06s; }
        .d2  { animation-delay: 0.12s; }
        .d3  { animation-delay: 0.18s; }
        .d4  { animation-delay: 0.24s; }
        .d5  { animation-delay: 0.30s; }
        .d6  { animation-delay: 0.36s; }
        .d7  { animation-delay: 0.42s; }

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
        .auth-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a8a29e' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px; }
      `}</style>

      <div className="auth-root min-h-screen bg-stone-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2 fu">

          {/* Left — dark branding panel */}
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

              {/* Feature list */}
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
            </div>

            <div className="flex gap-2 mt-12">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full" style={{ background: i === 1 ? "#f59e0b" : "#3d3836" }} />
              ))}
            </div>
          </div>

          {/* Right — form */}
          <div className="p-8 md:p-10 flex flex-col justify-center overflow-y-auto">
            {/* Mobile brand */}
            <div className="flex items-center gap-2 mb-6 md:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v7a4 4 0 004 4h0a4 4 0 004-4V3M7 14v7M17 3a4 4 0 010 8v9" />
              </svg>
              <span className="serif text-lg text-stone-800 tracking-wide">MealBudget</span>
            </div>

            <h1 className="serif text-3xl text-stone-900 mb-1 fu">Create account</h1>
            <p className="text-stone-400 text-sm mb-6 fu d1">Fill in your details to get started.</p>

            {error && (
              <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl p-3">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">

              <div className="fu d1">
                <label className="block text-xs text-stone-500 uppercase tracking-widest font-medium mb-1.5">Username</label>
                <input className="auth-input" type="text" name="username" placeholder="johndoe"
                  required value={formData.username} onChange={handleChange} />
              </div>

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

              <div className="fu d4">
                <label className="block text-xs text-stone-500 uppercase tracking-widest font-medium mb-1.5">Gender</label>
                <select className="auth-select" name="gender" required value={formData.gender} onChange={handleChange}>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              {/* Age / Weight / Height row */}
              <div className="grid grid-cols-3 gap-3 fu d5">
                <div>
                  <label className="block text-xs text-stone-500 uppercase tracking-widest font-medium mb-1.5">Age</label>
                  <input className="auth-input" type="number" name="age" placeholder="25"
                    min={1} step={1} required value={formData.age} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 uppercase tracking-widest font-medium mb-1.5">Weight <span className="normal-case text-stone-400">(kg)</span></label>
                  <input className="auth-input" type="number" name="weight" placeholder="70"
                    min={1} step={0.1} required value={formData.weight} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 uppercase tracking-widest font-medium mb-1.5">Height <span className="normal-case text-stone-400">(cm)</span></label>
                  <input className="auth-input" type="number" name="height" placeholder="170"
                    min={1} step={0.1} required value={formData.height} onChange={handleChange} />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="fu d6 mt-1 w-full bg-stone-900 hover:bg-amber-400 hover:text-stone-900 text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 text-sm tracking-wide"
              >
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </form>

            <p className="text-sm text-stone-400 mt-5 text-center fu d7">
              Already have an account?{" "}
              <Link to="/login" className="text-amber-500 font-semibold hover:text-amber-600 transition">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;