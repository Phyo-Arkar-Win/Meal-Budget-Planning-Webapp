// client/src/pages/Auth/Login.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../../api/authApi";
import type { LoginCredentials } from "../../types/auth";


const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginCredentials>({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
    const data = await loginUser(formData);
    console.log("Login success:", data);
    // Save token to localStorage
    localStorage.setItem("token", data.token); 
    // Redirect to Home
    navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-emerald-50 to-slate-100 px-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg grid grid-cols-1 md:grid-cols-2 overflow-hidden">

        {/* Left Branding */}
        <div className="hidden md:flex flex-col justify-center bg-emerald-600 text-white p-10">
          <h2 className="text-3xl font-bold mb-4">
            Welcome Back 👋
          </h2>
          <p className="text-emerald-100 text-lg">
            Log in to continue managing your meals, budget, and nutrition goals.
          </p>
        </div>

        {/* Right Form */}
        <div className="p-8 md:p-10">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">
            Login
          </h2>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-sm text-slate-600 mt-6 text-center">
            Don’t have an account?{" "}
            <Link
                to="/signup"
                className="text-emerald-600 font-medium hover:underline"
            >
                Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
