// client/src/pages/Auth/Signup.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { signupUser } from "../../api/authApi";
import type { SignupCredentials } from "../../types/auth";

const Signup = () => {
  const [formData, setFormData] = useState<SignupCredentials>({
    username: "",
    email: "",
    password: "",
    gender: "",
    age: "",
    weight: "",
    height: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const age = Number(formData.age);
    const weight = Number(formData.weight);
    const height = Number(formData.height);

    if (age <= 0 || weight <= 0 || height <= 0) {
      alert("Age, weight, and height must be greater than 0");
      setLoading(false);
      return;
    }

    try {
      await signupUser(formData);
      setSuccess("Account created successfully 🎉");
      setFormData({ username: "", email: "", password: "", gender: "", age: "", weight: "", height: "" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-emerald-50 to-slate-100 px-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg grid grid-cols-1 md:grid-cols-2 overflow-hidden">

        {/* Left side (Branding) */}
        <div className="hidden md:flex flex-col justify-center bg-emerald-600 text-white p-10">
          <h2 className="text-3xl font-bold mb-4">
            Meal Budget Planner 🍱
          </h2>
          <p className="text-emerald-100 text-lg">
            Create an account to plan meals, control your budget, and meet your
            nutritional goals effortlessly.
          </p>
        </div>

        {/* Right side (Form) */}
        <div className="p-8 sm:p-10">
          <h1 className="text-2xl font-bold text-slate-800 mb-6">
            Create Account
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Username */}
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {/* Email */}
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {/* Password */}
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {/* Gender */}
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>

            {/* Age / Weight / Height */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
                type="number"
                name="age"
                placeholder="Age"
                value={formData.age}
                onChange={handleChange}
                min={1}
                step={1}
                required
                className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <input
                type="number"
                name="weight"
                placeholder="Weight (kg)"
                value={formData.weight}
                onChange={handleChange}
                min={1}
                step={0.1}
                required
                className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <input
                type="number"
                name="height"
                placeholder="Height (cm)"
                value={formData.height}
                onChange={handleChange}
                min={1}
                step={0.1}
                required
                className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            </div>

            {/* Error / Success */}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-green-600 bg-green-50 p-2 rounded">
                {success}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 transition disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <p className="text-sm text-slate-500 mt-4 text-center">
            Already have an account?{" "}
            <Link
                to="/login"
                className="text-emerald-600 font-medium hover:underline"
            >
                Log in
            </Link>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
