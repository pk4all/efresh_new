"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, CheckCircle, X, Carrot, Apple, Leaf } from "lucide-react";
import { toast } from "sonner";
import { loginUser, registerUser, fetchUserProfile } from "@/utils/api";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
}

export default function AuthModal({ open, onClose, initialMode = "login" }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [showPw, setShowPw] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  // Register form state
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "", agree: false });

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setDone(false);
    }
  }, [open, initialMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        handleClose();
      }
    };
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setDone(false);
      setLoginForm({ email: "", password: "" });
      setRegisterForm({ name: "", email: "", password: "", agree: false });
      setShowPw(false);
    }, 300);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await loginUser({
        email: loginForm.email,
        password: loginForm.password,
      });

      const token = data.data?.access_token || data.access_token;
      const customerId = data.data?.customer_id || data.customer_id;

      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("customer_id", String(customerId));

        try {
          const profileData = await fetchUserProfile();
          const p = profileData.data || profileData;
          if (p.name) {
            localStorage.setItem("name", p.name);
          }
        } catch (_) {}
      }

      toast.success("Successfully logged in!");
      window.dispatchEvent(new Event("storage"));
      handleClose();
    } catch (err: any) {
      toast.error(err.message || "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await registerUser({
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password,
      });

      const token = data.data?.access_token || data.access_token;
      const customerId = data.data?.customer_id || data.customer_id;

      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("customer_id", String(customerId));

        try {
          const profileData = await fetchUserProfile();
          const p = profileData.data || profileData;
          if (p.name) {
            localStorage.setItem("name", p.name);
          } else {
            localStorage.setItem("name", registerForm.name);
          }
        } catch (_) {
          localStorage.setItem("name", registerForm.name);
        }
      }

      setDone(true);
      toast.success("Account created successfully!");
      window.dispatchEvent(new Event("storage"));
    } catch (err: any) {
      toast.error(err.message || "An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className={`fixed inset-0 z-[100005] bg-black/40 backdrop-blur-xs transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />

      {/* Right Side Drawer Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 h-full z-[100006] bg-white shadow-2xl flex flex-col font-sans overflow-hidden transition-transform duration-300 ease-in-out w-full max-w-[420px] sm:w-[420px] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Top Hero Banner */}
        <div
          className="relative p-6 text-white select-none overflow-hidden bg-cover bg-center shrink-0 min-h-[170px] flex flex-col justify-between"
          style={{
            backgroundImage:
              'linear-gradient(to bottom, rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0.75)), url("https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=800&auto=format&fit=crop")',
          }}
        >
          {/* Header Controls: Brand badge & Close Button */}
          <div className="flex items-center justify-between relative z-10">
            <div className="backdrop-blur-md bg-white/15 border border-white/25 rounded-full px-3 py-1 text-[10px] uppercase tracking-wider font-extrabold flex items-center gap-1.5 shadow-sm text-white">
              <span className="text-emerald-400">●</span>
              <span>100% Organic &amp; Fresh</span>
            </div>

            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md flex items-center justify-center transition-all cursor-pointer border border-white/30"
              aria-label="Close drawer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Title Banner */}
          <div className="relative z-10 mt-4">
            <h2 className="text-xl font-black leading-tight tracking-tight drop-shadow-md text-white">
              {done
                ? "Account Ready!"
                : mode === "login"
                ? "Welcome Back to eFresh"
                : "Join the eFresh Family"}
            </h2>
            <p className="text-xs text-white/90 leading-relaxed font-medium mt-1">
              {done
                ? "Your fresh journey starts here."
                : mode === "login"
                ? "Sign in to access your organic goodness & member perks."
                : "Get access to exclusive organic deals & fast delivery."}
            </p>
          </div>
        </div>

        {/* Mode Navigation Tabs (if not done) */}
        {!done && (
          <div className="flex border-b border-gray-200/80 bg-gray-100/80 p-1.5 shrink-0 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setShowPw(false);
              }}
              className={`flex-1 py-2.5 text-xs font-extrabold transition-all text-center rounded-sm cursor-pointer ${
                mode === "login"
                  ? "bg-[#0da487] text-white shadow-sm"
                  : "bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 font-semibold"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setShowPw(false);
              }}
              className={`flex-1 py-2.5 text-xs font-extrabold transition-all text-center rounded-sm cursor-pointer ${
                mode === "register"
                  ? "bg-[#0da487] text-white shadow-sm"
                  : "bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 font-semibold"
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Form Body Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#fdfdfd] relative flex flex-col justify-between">
          {/* Background Decorative Icons */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.05] select-none text-emerald-800">
            <Carrot size={120} className="absolute -top-6 -right-6 rotate-12" />
            <Apple size={100} className="absolute bottom-6 -left-6 -rotate-45" />
            <Leaf size={70} className="absolute top-1/3 -right-4 rotate-45" />
          </div>

          {done ? (
            <div className="text-center py-8 my-auto relative z-10">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-emerald-50 border border-emerald-100 shadow-inner">
                <CheckCircle size={36} className="text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">
                Account Created! 🎉
              </h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Welcome to eFresh, {registerForm.name}! You can now start ordering fresh groceries.
              </p>
              <button
                onClick={handleClose}
                className="btn-primary w-full py-3 justify-center text-sm font-bold shadow-md shadow-[#0da487]/10 hover:shadow-lg transition-all"
              >
                Start Shopping
              </button>
            </div>
          ) : mode === "login" ? (
            <div className="relative z-10 flex flex-col justify-between h-full">
              <form className="space-y-4" onSubmit={handleLoginSubmit}>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-gray-700 uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl pl-10 pr-3.5 py-3 text-sm outline-none transition-all focus:border-[#0da487] focus:ring-2 focus:ring-[#0da487]/10 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Password
                    </label>
                    <a href="#" className="text-xs font-medium text-[#0da487] hover:underline">
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPw ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-3 text-sm outline-none transition-all focus:border-[#0da487] focus:ring-2 focus:ring-[#0da487]/10 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3.5 mt-2 justify-center font-bold text-sm shadow-md shadow-[#0da487]/10 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Signing In..." : "Sign In"} {!loading && <ArrowRight size={16} />}
                </button>
              </form>

              <div className="mt-8 pt-4 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-500">
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("register");
                      setShowPw(false);
                    }}
                    className="font-bold text-[#0da487] hover:underline cursor-pointer"
                  >
                    Sign up free
                  </button>
                </p>
              </div>
            </div>
          ) : (
            <div className="relative z-10 flex flex-col justify-between h-full">
              <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-gray-700 uppercase tracking-wider">
                    Full Name
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl pl-10 pr-3.5 py-3 text-sm outline-none transition-all focus:border-[#0da487] focus:ring-2 focus:ring-[#0da487]/10 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-gray-700 uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl pl-10 pr-3.5 py-3 text-sm outline-none transition-all focus:border-[#0da487] focus:ring-2 focus:ring-[#0da487]/10 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-gray-700 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPw ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-3 text-sm outline-none transition-all focus:border-[#0da487] focus:ring-2 focus:ring-[#0da487]/10 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="agree-drawer"
                    required
                    checked={registerForm.agree}
                    onChange={(e) => setRegisterForm({ ...registerForm, agree: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#0da487] focus:ring-[#0da487] cursor-pointer"
                  />
                  <label htmlFor="agree-drawer" className="text-xs text-gray-500 leading-normal cursor-pointer select-none">
                    I agree to the{" "}
                    <a href="#" className="font-semibold text-[#0da487] hover:underline">
                      Terms &amp; Conditions
                    </a>{" "}
                    and{" "}
                    <a href="#" className="font-semibold text-[#0da487] hover:underline">
                      Privacy Policy
                    </a>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3.5 mt-2 justify-center font-bold text-sm shadow-md shadow-[#0da487]/10 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating Account..." : "Sign Up"} {!loading && <ArrowRight size={16} />}
                </button>
              </form>

              <div className="mt-8 pt-4 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-500">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setShowPw(false);
                    }}
                    className="font-bold text-[#0da487] hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
