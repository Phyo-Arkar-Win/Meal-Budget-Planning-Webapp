// client/src/pages/Profile/EditProfile.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { fetchUserProfile, updateUserProfile, calculateMacros, changePassword } from "../../api/userApi";

const EditProfile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile]   = useState<File | null>(null);

  const [formData, setFormData] = useState({
    username: "", gender: "", age: "", weight: "", height: "",
    fitness_goal: "Maintenance", activity_level: "Sedentary",
  });

  const [pwData, setPwData]       = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError]     = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  // ── Load profile ────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    const loadData = async () => {
      try {
        const user = await fetchUserProfile(token);
        setFormData({
          username:       user.username || "",
          gender:         user.gender || "",
          age:            user.age?.toString() || "",
          weight:         user.weight?.toString() || "",
          height:         user.height?.toString() || "",
          fitness_goal:   user.fitness_goal || "Maintenance",
          activity_level: user.activity_level || "Sedentary",
        });
        if (user.profile_picture) setAvatarPreview(user.profile_picture);
      } catch (err) {
        console.error("Failed to load profile", err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setSelectedFile(file); setAvatarPreview(URL.createObjectURL(file)); }
  };

  // ── Save profile ────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSaving(true);
    const token = localStorage.getItem("token");
    try {
      if (!token) throw new Error("No token found");
      const submitData = new FormData();
      submitData.append("username",       formData.username);
      submitData.append("age",            formData.age);
      submitData.append("weight",         formData.weight);
      submitData.append("height",         formData.height);
      submitData.append("fitness_goal",   formData.fitness_goal);
      submitData.append("activity_level", formData.activity_level);
      if (selectedFile) submitData.append("profile_picture", selectedFile);
      await updateUserProfile(token, submitData);
      await calculateMacros(token, {
        activity_level: formData.activity_level,
        fitness_goal:   formData.fitness_goal,
      });
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Something went wrong saving your profile.");
      setSaving(false);
    }
  };

  // ── Change password ─────────────────────────────────────────────────────
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(""); setPwSuccess("");

    if (pwData.newPassword.length < 6) {
      setPwError("Password must be at least 6 characters."); return;
    }
    if (pwData.newPassword !== pwData.confirmPassword) {
      setPwError("Passwords do not match."); return;
    }

    const token = localStorage.getItem("token") || "";
    setPwLoading(true);
    try {
      await changePassword(token, pwData.currentPassword, pwData.newPassword);
      setPwSuccess("Password changed successfully.");
      setPwData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setPwError(err.message);
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FDF8F0" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          <p className="text-stone-400 text-sm tracking-wide font-sans">Loading profile…</p>
        </div>
      </div>
    );
  }

  const initial = formData.username?.charAt(0).toUpperCase() || "U";

  // Shared class strings
  const inputCls =
    "w-full px-4 py-3 bg-[#FAF6EF] border border-stone-200 rounded-xl " +
    "focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 focus:bg-white " +
    "transition text-stone-800 text-sm font-sans";
  const labelCls = "block text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-1.5 font-sans";
  const cardCls  = "bg-white rounded-2xl border border-stone-100 shadow-sm p-6 md:p-8";

  return (
    <div className="min-h-screen flex font-sans" style={{ backgroundColor: "#FDF8F0" }}>

      {/* ── LEFT SIDEBAR ── */}
      <div className="hidden md:flex flex-col w-64 flex-shrink-0 bg-[#1E1A14] text-white px-8 py-10">
        <Link
          to="/"
          className="flex items-center gap-2 text-stone-500 hover:text-white transition text-sm font-sans w-fit group mb-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>

        <div className="mt-12 mb-auto">
          <h1
            className="text-amber-400 leading-tight mb-4"
            style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontSize: "2.4rem", lineHeight: 1.15 }}
          >
            Refine<br />Your Data
          </h1>
          <p className="text-stone-500 text-sm leading-relaxed font-sans font-light">
            Updating your body metrics and fitness goals ensures your daily calorie budget and macronutrient targets stay perfectly accurate.
          </p>
        </div>

        <div className="mt-auto pt-8 border-t border-stone-800 flex flex-col gap-1">
          <span className="text-amber-500 text-sm font-medium font-sans py-1.5">Profile & Metrics</span>
          <span className="text-stone-600 text-sm font-sans py-1.5 hover:text-stone-300 cursor-pointer transition">Security</span>
          <span className="text-stone-600 text-sm font-sans py-1.5 hover:text-stone-300 cursor-pointer transition">Notifications</span>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 overflow-y-auto px-5 py-8 md:px-12 md:py-12">
        <div className="max-w-lg mx-auto flex flex-col gap-5">

          {/* Mobile back */}
          <div className="md:hidden">
            <Link to="/" className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition text-sm font-medium w-fit">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </Link>
          </div>

          {/* ── PROFILE FORM ── */}
          <div className={cardCls}>
            <div className="mb-6">
              <h2 className="text-base font-semibold text-stone-800 font-sans">Profile & Body Metrics</h2>
              <p className="text-xs text-stone-400 mt-0.5 font-sans">Your personal details and physical stats</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {error && (
                <div className="bg-red-50 text-red-500 text-sm p-3.5 rounded-xl border border-red-100 font-sans">
                  {error}
                </div>
              )}

              {/* Avatar row */}
              <div
                className="flex items-center gap-4 pb-5 border-b border-stone-100 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="relative w-14 h-14 rounded-full bg-emerald-900 flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-stone-100 hover:ring-amber-300 transition-all group">
                  {avatarPreview
                    ? <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    : <span style={{ fontFamily: "'Georgia', serif", fontSize: "1.4rem", color: "#fff" }}>{initial}</span>
                  }
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-800 font-sans">{formData.username || "Your Name"}</p>
                  <p className="text-xs text-amber-600 font-medium font-sans mt-0.5">Change avatar</p>
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageChange} />
              </div>

              {/* Username */}
              <div>
                <label className={labelCls}>Username</label>
                <div className="relative">
                  <input type="text" name="username" value={formData.username} onChange={handleChange} required className={inputCls + " pr-10"} />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-base select-none">
                    {formData.gender?.toLowerCase() === "female"
                      ? <span className="text-pink-500">♀</span>
                      : <span className="text-blue-500">♂</span>}
                  </span>
                </div>
              </div>

              {/* Age + Weight */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Age</label>
                  <input type="number" name="age" value={formData.age} onChange={handleChange} required className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Weight (kg)</label>
                  <input type="number" name="weight" value={formData.weight} onChange={handleChange} required step="0.1" className={inputCls} />
                </div>
              </div>

              {/* Height */}
              <div>
                <label className={labelCls}>Height (cm)</label>
                <input type="number" name="height" value={formData.height} onChange={handleChange} required className={inputCls} />
              </div>

              {/* Goal + Activity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Fitness Goal</label>
                  <select name="fitness_goal" value={formData.fitness_goal} onChange={handleChange} className={inputCls + " appearance-none"}>
                    <option value="Weight Loss">Weight Loss</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Muscle Gain">Muscle Gain</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Activity Level</label>
                  <select name="activity_level" value={formData.activity_level} onChange={handleChange} className={inputCls + " appearance-none"}>
                    <option value="Sedentary">Sedentary</option>
                    <option value="Lightly Active">Lightly Active</option>
                    <option value="Moderately Active">Moderately Active</option>
                    <option value="Very Active">Very Active</option>
                    <option value="Extremely Active">Extremely Active</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-stone-900 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-stone-800 transition disabled:opacity-60 disabled:cursor-not-allowed font-sans mt-1"
              >
                {saving ? "Saving & Recalculating…" : "Save Changes"}
              </button>
            </form>
          </div>

          {/* ── CHANGE PASSWORD ── */}
          <div className={cardCls}>
            <div className="mb-5">
              <h3 className="text-base font-semibold text-stone-800 font-sans">Change Password</h3>
              <p className="text-xs text-stone-400 mt-0.5 font-sans">Update your current login password</p>
            </div>

            {pwError   && <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl p-3 font-sans">{pwError}</div>}
            {pwSuccess && <div className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl p-3 font-sans">{pwSuccess}</div>}

            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>Current Password</label>
                <input
                  type="password" placeholder="••••••••" required
                  value={pwData.currentPassword}
                  onChange={(e) => setPwData({ ...pwData, currentPassword: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>New Password</label>
                <input
                  type="password" placeholder="min. 6 characters" required
                  value={pwData.newPassword}
                  onChange={(e) => setPwData({ ...pwData, newPassword: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Confirm New Password</label>
                <input
                  type="password" placeholder="repeat new password" required
                  value={pwData.confirmPassword}
                  onChange={(e) => setPwData({ ...pwData, confirmPassword: e.target.value })}
                  className={inputCls}
                />
              </div>
              <button
                type="submit"
                disabled={pwLoading}
                className="w-full bg-stone-900 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-stone-800 transition disabled:opacity-60 font-sans"
              >
                {pwLoading ? "Saving…" : "Update Password"}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EditProfile;
