// client/src/pages/Auth/Signup.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { signupUser, googleLoginUser } from "../../api/authApi";
import type { SignupCredentials } from "../../types/auth";

// ─── Icons ────────────────────────────────────────────────────────────────────

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const MaleIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "#A89880"} strokeWidth={1.8} style={{ width: 16, height: 16 }}>
    <circle cx="10" cy="14" r="5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 5l-5.5 5.5M19 5h-5M19 5v5" />
  </svg>
);

const FemaleIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "#A89880"} strokeWidth={1.8} style={{ width: 16, height: 16 }}>
    <circle cx="12" cy="8" r="5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 13v8M9 18h6" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="#1A1612">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes fadeUp  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideIn { from { opacity:0; transform:translateX(16px); } to { opacity:1; transform:translateX(0); } }
  @keyframes spin    { to { transform: rotate(360deg); } }

  .fu       { animation: fadeUp  0.4s ease both; }
  .slide-in { animation: slideIn 0.3s ease both; }
  .d1{animation-delay:.05s}.d2{animation-delay:.10s}.d3{animation-delay:.15s}.d4{animation-delay:.20s}.d5{animation-delay:.25s}

  .auth-inp {
    width: 100%; padding: 11px 14px;
    background: #fff; border: 1.5px solid #E8E0D4;
    border-radius: 10px; font-size: 14px;
    font-family: 'DM Sans', sans-serif; color: #1A1612;
    transition: border-color .2s, box-shadow .2s; outline: none;
  }
  .auth-inp:focus { border-color: #E8A020; box-shadow: 0 0 0 3px rgba(232,160,32,.10); }
  .auth-inp::placeholder { color: #C0B4A4; }
  .auth-inp::-webkit-inner-spin-button,
  .auth-inp::-webkit-outer-spin-button { -webkit-appearance: none; }

  .auth-label {
    display: block; font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .10em;
    color: #A89880; margin-bottom: 7px;
  }

  .google-btn {
    width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
    background: #fff; border: 1.5px solid #E0D8CC; border-radius: 10px;
    padding: 11px 16px; font-size: 14px; font-family: 'DM Sans', sans-serif;
    font-weight: 600; color: #1A1612; cursor: pointer;
    transition: border-color .2s, box-shadow .2s, background .15s;
  }
  .google-btn:hover { border-color: #C8B89A; background: #FAFAF8; box-shadow: 0 2px 8px rgba(0,0,0,.06); }
  .google-btn:disabled { opacity: .6; cursor: not-allowed; }

  .divider { display: flex; align-items: center; gap: 12px; color: #C0B4A4; font-size: 12px; }
  .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: #EDE5D8; }

  .primary-btn {
    width: 100%; background: #1A1612; color: #fff;
    border: none; border-radius: 10px; padding: 13px 20px;
    font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700;
    letter-spacing: .03em; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: background .2s, transform .1s;
    box-shadow: 0 4px 14px rgba(0,0,0,.18);
  }
  .primary-btn:hover:not(:disabled) { background: #2C2418; transform: translateY(-1px); }
  .primary-btn:active { transform: translateY(0); }
  .primary-btn:disabled { opacity: .55; cursor: not-allowed; }

  .secondary-btn {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 13px 18px; background: #F5F0E8; border: 1.5px solid #E8E0D4;
    border-radius: 10px; font-size: 14px; font-family: 'DM Sans', sans-serif;
    font-weight: 600; color: #6B5E52; cursor: pointer;
    transition: background .2s; flex: 1;
  }
  .secondary-btn:hover { background: #EDE5D8; }

  .gender-btn {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 11px 14px; border-radius: 10px; border: 1.5px solid #E8E0D4;
    background: #fff; font-size: 13px; font-family: 'DM Sans', sans-serif;
    font-weight: 600; color: #8A7B6E; cursor: pointer; transition: all .2s;
  }
  .gender-btn:hover { border-color: #C8B89A; background: #FAF7F2; }
  .gender-btn.active { border-color: #1A1612; background: #1A1612; color: #fff; }

  .check-circle {
    width: 22px; height: 22px; border-radius: 50%;
    background: #E8A020; display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  .macro-tag {
    display: inline-flex; align-items: center;
    padding: 3px 8px; border-radius: 6px;
    font-size: 11px; font-weight: 700; font-family: 'DM Sans', sans-serif;
  }

  .progress-bar-bg {
    height: 4px; background: #2E2820; border-radius: 100px; overflow: hidden; margin-bottom: 8px;
  }

  .stat-card {
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.09);
    border-radius: 10px; padding: 14px 12px; text-align: center; flex: 1;
  }
`;

// ─── Types ────────────────────────────────────────────────────────────────────

type Step1Data = { username: string; email: string; password: string };
type Step2Data = { gender: string; age: string; weight: string; height: string };

// ─── Component ────────────────────────────────────────────────────────────────

const Signup = () => {
  const navigate = useNavigate();

  const [step, setStep]                   = useState<1 | 2>(1);
  const [step1, setStep1]                 = useState<Step1Data>({ username: "", email: "", password: "" });
  const [step2, setStep2]                 = useState<Step2Data>({ gender: "", age: "", weight: "", height: "" });
  const [loading, setLoading]             = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]                 = useState("");

  const handleStep1Change = (e: React.ChangeEvent<HTMLInputElement>) =>
    setStep1({ ...step1, [e.target.name]: e.target.value });

  const handleStep2Change = (e: React.ChangeEvent<HTMLInputElement>) =>
    setStep2({ ...step2, [e.target.name]: e.target.value });

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!step1.username || !step1.email || !step1.password) { setError("Please fill in all fields."); return; }
    if (step1.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!step2.gender) { setError("Please select a gender."); return; }
    if (Number(step2.age) <= 0 || Number(step2.weight) <= 0 || Number(step2.height) <= 0) {
      setError("Age, weight, and height must be greater than 0."); return;
    }
    setLoading(true);
    try {
      const payload: SignupCredentials = {
        ...step1,
        gender: step2.gender,
        age:    Number(step2.age),
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

  const handleGoogleSignup = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true); setError("");
      try {
        const data = await googleLoginUser(tokenResponse.access_token);
        localStorage.setItem("token", data.token);
        navigate(data.isNewUser ? "/complete-profile" : "/");
      } catch (err: any) {
        setError(err.message || "Google sign-up failed");
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => setError("Google sign-in was cancelled or failed."),
  });

  const progressPct = step === 1 ? 50 : 100;

  return (
    <>
      <style>{styles}</style>
      <div style={{ minHeight: "100vh", background: "#F0EBE1", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px" }}>
        <div className="fu" style={{ width: "100%", maxWidth: 920, background: "#fff", borderRadius: 24, boxShadow: "0 16px 48px rgba(0,0,0,0.10)", overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 1.1fr" }}>

          {/* ── LEFT PANEL ── */}
          <div style={{ background: "#1A1612", padding: "44px 36px", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
            {/* Glow effects */}
            <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, background: "rgba(232,160,32,0.07)", borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -40, left: -40, width: 180, height: 180, background: "rgba(232,160,32,0.04)", borderRadius: "50%", filter: "blur(50px)", pointerEvents: "none" }} />

            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 44, position: "relative", zIndex: 1 }}>
              <svg width="18" height="18" fill="none" stroke="#E8A020" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v7a4 4 0 004 4h0a4 4 0 004-4V3M7 14v7M17 3a4 4 0 010 8v9" />
              </svg>
              <span style={{ fontFamily: "'Lora', serif", fontSize: 20, color: "#E8A020", fontWeight: 700 }}>MealBudget</span>
            </div>

            {/* Hero */}
            <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
              <h2 style={{ fontFamily: "'Lora', serif", fontSize: 42, color: "#fff", lineHeight: 1.12, fontWeight: 700, marginBottom: 16 }}>
                Start your<br /><span style={{ color: "#E8A020" }}>journey.</span>
              </h2>
              <p style={{ fontSize: 13, color: "#7A6A5E", lineHeight: 1.7, marginBottom: 32 }}>
                Create an account to plan meals, control your budget, and meet your nutritional goals effortlessly.
              </p>

              {/* Feature list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 32 }}>
                {["Personalised macro targets", "Meal budget planning", "Track daily progress"].map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#5A4D42", fontWeight: 500 }}>
                    <div className="check-circle"><CheckIcon /></div>
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              {/* Stat cards */}
              <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                {[{ n: "24", l: "Total Meals" }, { n: "4", l: "Canteens" }].map(s => (
                  <div key={s.l} className="stat-card">
                    <p style={{ fontFamily: "'Lora', serif", fontSize: 24, color: "#E8A020", fontWeight: 700, lineHeight: 1 }}>{s.n}</p>
                    <p style={{ fontSize: 9, color: "#5A4A40", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 5 }}>{s.l}</p>
                  </div>
                ))}
              </div>

              {/* Macro tags */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 32 }}>
                {[
                  { label: "P: Protein", bg: "rgba(91,143,232,0.15)",  color: "#5B8FE8" },
                  { label: "C: Carbs",   bg: "rgba(232,160,32,0.15)",  color: "#E8A020" },
                  { label: "F: Fat",     bg: "rgba(232,123,91,0.15)",  color: "#E87B5B" },
                  { label: "S: Sugar",   bg: "rgba(160,200,100,0.15)", color: "#8BC34A" },
                ].map(t => (
                  <span key={t.label} className="macro-tag" style={{ background: t.bg, color: t.color }}>{t.label}</span>
                ))}
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ position: "relative", zIndex: 1 }}>
              <p style={{ fontSize: 9, color: "#4A3D32", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 700, marginBottom: 10 }}>Progress</p>
              <div className="progress-bar-bg">
                <div style={{ height: "100%", width: `${progressPct}%`, background: "#E8A020", borderRadius: 100, transition: "width .5s ease" }} />
              </div>
              <p style={{ fontSize: 11, color: "#5A4A40", fontWeight: 500 }}>
                Step {step} of 2 — {step === 1 ? "Account details" : "Personal information"}
              </p>
            </div>
          </div>

          {/* ── RIGHT FORM ── */}
          <div style={{ padding: "44px 40px", display: "flex", flexDirection: "column", justifyContent: "center", background: "#FAFAF8", overflowY: "auto" }}>

            {/* Step indicators */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
              {[1, 2].map(s => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, transition: "all .3s",
                    background: step >= s ? "#1A1612" : "#EDE5D8",
                    color:      step >= s ? "#E8A020" : "#A89880",
                  }}>
                    {step > s
                      ? <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      : s}
                  </div>
                  {s < 2 && <div style={{ width: 32, height: 2, borderRadius: 100, background: step > s ? "#1A1612" : "#EDE5D8", transition: "background .3s" }} />}
                </div>
              ))}
              <span style={{ fontSize: 13, color: "#8A7B6E", fontWeight: 600, marginLeft: 4 }}>
                {step === 1 ? "Account details" : "Personal information"}
              </span>
            </div>

            {error && (
              <div style={{ marginBottom: 18, fontSize: 13, color: "#DC2626", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "11px 14px", fontWeight: 500 }}>
                {error}
              </div>
            )}

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <div className="slide-in">
                <h1 style={{ fontFamily: "'Lora', serif", fontSize: 36, color: "#1A1612", fontWeight: 700, marginBottom: 6 }}>Create account</h1>
                <p style={{ fontSize: 13, color: "#8A7B6E", lineHeight: 1.6, marginBottom: 24 }}>Fill in your account details to get started.</p>

                <button className="google-btn" onClick={() => handleGoogleSignup()} disabled={googleLoading} type="button" style={{ marginBottom: 16 }}>
                  {googleLoading
                    ? <div style={{ width: 16, height: 16, border: "2px solid #D0C8BC", borderTopColor: "#6B5E52", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
                    : <GoogleIcon />}
                  {googleLoading ? "Connecting…" : "Continue with Google"}
                </button>

                <div className="divider" style={{ marginBottom: 16 }}>or sign up with email</div>

                <form onSubmit={handleStep1Next} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label className="auth-label">Username</label>
                    <input className="auth-inp" type="text" name="username" placeholder="johndoe"
                      required value={step1.username} onChange={handleStep1Change} />
                  </div>
                  <div>
                    <label className="auth-label">Email</label>
                    <input className="auth-inp" type="email" name="email" placeholder="you@example.com"
                      required value={step1.email} onChange={handleStep1Change} />
                  </div>
                  <div>
                    <label className="auth-label">Password</label>
                    <input className="auth-inp" type="password" name="password" placeholder="min. 6 characters"
                      required minLength={6} value={step1.password} onChange={handleStep1Change} />
                  </div>
                  <button type="submit" disabled={googleLoading} className="primary-btn" style={{ marginTop: 4 }}>
                    Continue
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </form>

                <p style={{ fontSize: 13, color: "#8A7B6E", textAlign: "center", marginTop: 18 }}>
                  Already have an account?{" "}
                  <Link to="/login" style={{ color: "#E8A020", fontWeight: 700, textDecoration: "none" }}>Login</Link>
                </p>
              </div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <div className="slide-in">
                <h1 style={{ fontFamily: "'Lora', serif", fontSize: 36, color: "#1A1612", fontWeight: 700, marginBottom: 6 }}>Personal info</h1>
                <p style={{ fontSize: 13, color: "#8A7B6E", lineHeight: 1.6, marginBottom: 24 }}>Help us personalise your daily calorie and macro targets.</p>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Gender */}
                  <div>
                    <label className="auth-label">Gender</label>
                    <div style={{ display: "flex", gap: 10 }}>
                      {[
                        { val: "male",   label: "Male",   Icon: MaleIcon   },
                        { val: "female", label: "Female", Icon: FemaleIcon },
                      ].map(({ val, label, Icon }) => (
                        <button key={val} type="button"
                          className={`gender-btn${step2.gender === val ? " active" : ""}`}
                          onClick={() => setStep2({ ...step2, gender: val })}>
                          <Icon active={step2.gender === val} />
                          {label}
                        </button>
                      ))}
                    </div>
                    {/* Hidden input so form validation can detect gender */}
                    <input type="text" required value={step2.gender} readOnly
                      style={{ position: "absolute", opacity: 0, pointerEvents: "none", height: 0, width: 0 }} />
                  </div>

                  {/* Age / Weight / Height */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    {[
                      { label: "Age",         name: "age",    placeholder: "25",  step: "1"   },
                      { label: "Weight (kg)", name: "weight", placeholder: "70",  step: "0.1" },
                      { label: "Height (cm)", name: "height", placeholder: "170", step: "0.1" },
                    ].map(f => (
                      <div key={f.name}>
                        <label className="auth-label">{f.label}</label>
                        <input className="auth-inp" type="number" name={f.name}
                          placeholder={f.placeholder} min={1} step={f.step} required
                          value={step2[f.name as keyof Step2Data]} onChange={handleStep2Change} />
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                    <button type="button" className="secondary-btn" onClick={() => { setStep(1); setError(""); }}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                      Back
                    </button>
                    <button type="submit" disabled={loading} className="primary-btn" style={{ flex: 2 }}>
                      {loading
                        ? <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
                        : "Create Account"}
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
