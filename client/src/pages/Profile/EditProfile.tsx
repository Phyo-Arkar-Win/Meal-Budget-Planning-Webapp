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

  // Password change state
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
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
          <p className="text-stone-400 text-sm tracking-wide">Loading profile…</p>
        </div>
      </div>
    );
  }

  const initial = formData.username?.charAt(0).toUpperCase() || "U";
  const inputCls = "w-full px-4 py-3.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 focus:bg-white transition text-stone-800 text-sm";
  const labelCls = "block text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-2";

  return (
    <div className="min-h-screen bg-stone-50 flex font-sans">

      {/* ── LEFT PANEL (PC only) ── */}
      <div className="hidden md:flex flex-col w-1/3 max-w-sm bg-stone-900 text-white p-10 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <Link to="/" className="text-stone-400 hover:text-white flex items-center gap-2 transition w-fit group">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-sm tracking-wide">Back to Dashboard</span>
        </Link>
        <div className="mt-32">
          <h1 className="font-serif text-5xl text-amber-400 mb-6 leading-tight">Refine<br />Your Data</h1>
          <p className="text-stone-400 leading-relaxed text-sm">
            Updating your body metrics and fitness goals ensures your daily calorie budget and macronutrient targets stay perfectly accurate.
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col items-center p-5 md:py-12 md:px-10 overflow-y-auto">
        <div className="w-full max-w-xl flex flex-col gap-6">

          {/* Mobile back */}
          <div className="md:hidden">
            <Link to="/" className="text-stone-500 hover:text-stone-900 flex items-center gap-2 transition w-fit">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm font-medium">Back</span>
            </Link>
          </div>

          {/* ── PROFILE FORM ── */}
          <div className="bg-white rounded-3xl shadow-xl border border-stone-100 p-6 md:p-10">
            <h2 className="md:hidden font-serif text-3xl text-stone-900 mb-8 text-center">Edit Profile</h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {error && <div className="bg-red-50 text-red-500 text-sm p-4 rounded-xl border border-red-100 text-center">{error}</div>}

              {/* Avatar */}
              <div className="flex flex-col items-center mb-2">
                <div
                  className="relative w-28 h-28 rounded-full bg-stone-100 flex items-center justify-center text-4xl text-stone-900 font-bold shadow-md cursor-pointer group overflow-hidden border-4 border-white ring-2 ring-stone-100 hover:ring-amber-400 transition-all"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarPreview
                    ? <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    : <span className="text-stone-400 group-hover:text-amber-500 transition-colors">{initial}</span>}
                  <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-[10px] text-stone-400 mt-3 uppercase tracking-widest font-bold">Change Avatar</p>
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageChange} />
              </div>

              {/* Username */}
              <div>
                <label className={labelCls}>Username</label>
                <div className="relative">
                  <input type="text" name="username" value={formData.username} onChange={handleChange} required className={inputCls + " pr-12"} />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl font-bold select-none">
                    {formData.gender?.toLowerCase() === "female"
                      ? <span className="text-pink-400">♀</span>
                      : <span className="text-blue-400">♂</span>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Age</label>
                  <input type="number" name="age" value={formData.age} onChange={handleChange} required className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Weight (kg)</label>
                  <input type="number" name="weight" value={formData.weight} onChange={handleChange} required step="0.1" className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Height (cm)</label>
                <input type="number" name="height" value={formData.height} onChange={handleChange} required className={inputCls} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Fitness Goal</label>
                  <select name="fitness_goal" value={formData.fitness_goal} onChange={handleChange} className={inputCls + " appearance-none"}>
                    <option value="Lose Weight">Lose Weight</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Build Muscle">Build Muscle</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Activity Level</label>
                  <select name="activity_level" value={formData.activity_level} onChange={handleChange} className={inputCls + " appearance-none"}>
                    <option value="Sedentary">Sedentary</option>
                    <option value="Lightly Active">Lightly Active</option>
                    <option value="Moderately Active">Moderately Active</option>
                    <option value="Very Active">Very Active</option>
                    <option value="Extra Active">Extra Active</option>
                  </select>
                </div>
              </div>

              <button type="submit" disabled={saving}
                className="mt-2 w-full bg-stone-900 text-white py-4 rounded-xl font-semibold text-base hover:bg-amber-400 hover:text-stone-900 transition disabled:opacity-70 disabled:cursor-not-allowed shadow-md">
                {saving ? "Saving & Recalculating..." : "Save Changes"}
              </button>
            </form>
          </div>

          {/* ── CHANGE PASSWORD SECTION ── */}
          <div className="bg-white rounded-3xl shadow-xl border border-stone-100 p-6 md:p-10">
            <h3 className="font-serif text-2xl text-stone-900 mb-1">Change Password</h3>
            <p className="text-stone-400 text-sm mb-6">Update your current login password.</p>

            {pwError   && <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl p-3">{pwError}</div>}
            {pwSuccess && <div className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl p-3">{pwSuccess}</div>}

            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>Current Password</label>
                <input type="password" placeholder="••••••••" required value={pwData.currentPassword}
                  onChange={(e) => setPwData({ ...pwData, currentPassword: e.target.value })}
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>New Password</label>
                <input type="password" placeholder="min. 6 characters" required value={pwData.newPassword}
                  onChange={(e) => setPwData({ ...pwData, newPassword: e.target.value })}
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Confirm New Password</label>
                <input type="password" placeholder="••••••••" required value={pwData.confirmPassword}
                  onChange={(e) => setPwData({ ...pwData, confirmPassword: e.target.value })}
                  className={inputCls} />
              </div>
              <button type="submit" disabled={pwLoading}
                className="w-full bg-stone-900 hover:bg-amber-400 hover:text-stone-900 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 disabled:opacity-50 text-sm">
                {pwLoading ? "Saving…" : "Change Password"}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EditProfile;