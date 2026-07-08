"use client";
import { useState } from "react";
import { Modal } from "rsuite";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, CheckCircle, X, Carrot, Apple, Leaf } from "lucide-react";
import { toast } from "sonner";

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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api-efresh-698528526600.australia-southeast2.run.app/api/v1/storefront";
      const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
      
      const response = await fetch(`${cleanBase}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password,
          vendor_id: "vendor_test2",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.detail?.[0]?.msg || errorData.detail || "Login failed";
        throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
      }

      const data = await response.json();
      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("customer_id", String(data.customer_id));
        
        // Fetch profile API for user details
        const profileResponse = await fetch(`${cleanBase}/profile`, {
          headers: {
            "Authorization": `Bearer ${data.access_token}`,
          },
        });
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.name) {
            localStorage.setItem("name", profileData.name);
          }
        }
      }

      toast.success("Successfully logged in!");
      window.dispatchEvent(new Event("storage"));
      onClose();
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
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api-efresh-698528526600.australia-southeast2.run.app/api/v1/storefront";
      const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

      const response = await fetch(`${cleanBase}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: registerForm.name,
          email: registerForm.email,
          password: registerForm.password,
          vendor_id: "vendor_test2",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.detail?.[0]?.msg || errorData.detail || "Registration failed";
        throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
      }

      const data = await response.json();
      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("customer_id", String(data.customer_id));

        // Fetch profile API for user details
        const profileResponse = await fetch(`${cleanBase}/profile`, {
          headers: {
            "Authorization": `Bearer ${data.access_token}`,
          },
        });
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.name) {
            localStorage.setItem("name", profileData.name);
          }
        } else {
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

  const handleClose = () => {
    onClose();
    // Reset states after animation finishes
    setTimeout(() => {
      setDone(false);
      setLoginForm({ email: "", password: "" });
      setRegisterForm({ name: "", email: "", password: "", agree: false });
      setShowPw(false);
    }, 300);
  };

  return (
    <Modal open={open} onClose={handleClose} size="md" backdrop="static" keyboard={true} closeButton={false} className="auth-modal-v2">
      <Modal.Body className="p-0 overflow-hidden relative" style={{ padding: 0 }}>
        {/* Custom Close Button on Top Right */}
        <button
          onClick={handleClose}
          className="absolute top-0 right-0 z-50 p-2 rounded-full transition-all duration-200 cursor-pointer shadow-sm border bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-700 border-gray-100"
          aria-label="Close modal"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col md:flex-row min-h-[520px] bg-white overflow-hidden">
          {/* Left Section - Banner of Fresh Fruits */}
          <div
            className="md:w-5/12 bg-cover bg-center relative hidden md:flex flex-col justify-between p-8 text-white select-none overflow-hidden"
            style={{
              backgroundImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.65)), url("https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=800&auto=format&fit=crop")'
            }}
          >
            {/* Top glassmorphism badge */}
            <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-full px-4 py-1.5 self-start text-[10px] uppercase tracking-wider font-extrabold flex items-center gap-1.5 shadow-sm">
              <span className="text-emerald-400">●</span>
              <span>100% Organic &amp; Fresh</span>
            </div>

            {/* Bottom glassmorphic hero block */}
            <div className="backdrop-blur-md bg-white/10 border border-white/25 rounded-2xl p-5 shadow-lg flex flex-col gap-2 mt-auto">
              <h2 className="text-2xl font-black leading-tight tracking-tight drop-shadow-md">
                Freshness <br />
                Delivered Daily
              </h2>
              <p className="text-xs text-white/90 leading-relaxed font-medium">
                Join our grocery family and get access to organic produce, exclusive member-only savings, and ultra-fast deliveries.
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="h-1.5 w-6 rounded-full bg-[#0da487]" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
              </div>
            </div>
          </div>

          {/* Right Section - Login/Registration Form */}
          <div className="w-full md:w-7/12 p-8 sm:p-10 flex flex-col justify-center bg-[#fdfdfd] relative overflow-hidden">
            {/* Decorative Vector Icons Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.07] select-none text-emerald-800">
              <Carrot size={140} className="absolute -top-10 -right-10 rotate-12" />
              <Apple size={120} className="absolute bottom-10 -left-6 -rotate-45" />
              <Leaf size={80} className="absolute top-1/3 -right-6 rotate-45" />
              <Carrot size={90} className="absolute bottom-1/3 left-1/3 rotate-90" />
              <Apple size={70} className="absolute top-10 left-12 -rotate-12" />
            </div>

            {done ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-emerald-50 border border-emerald-100 shadow-inner">
                  <CheckCircle size={36} className="text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">
                  Account Created! 🎉
                </h3>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                  Welcome to eFresh, {registerForm.name}! Start shopping fresh.
                </p>
                <button onClick={handleClose} className="btn-primary w-full py-2.5 justify-center">
                  Start Shopping
                </button>
              </div>
            ) : mode === "login" ? (
              <div>
                {/* Header */}
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-lg bg-[#0da487]">
                      e
                    </div>
                    <span className="font-bold text-xl text-gray-800">
                      e<span className="text-[#0da487]">Fresh</span>
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-gray-800 tracking-tight">Welcome back!</h3>
                  <p className="text-xs text-gray-400 mt-1">Sign in to your eFresh account</p>
                </div>

                {/* Form */}
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
                        className="w-full border border-gray-200 rounded-xl pl-10 pr-3.5 py-3 text-sm outline-none transition-all focus:border-[#0da487] focus:ring-2 focus:ring-[#0da487]/10"
                      />
                    </div>
                  </div>

                  <div>

                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPw ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-3 text-sm outline-none transition-all focus:border-[#0da487] focus:ring-2 focus:ring-[#0da487]/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Password</label>
                      <a href="#" className="text-xs font-medium text-[#0da487] hover:underline">
                        Forgot password?
                      </a>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary w-full py-3 mt-2 justify-center font-bold text-sm shadow-md shadow-[#0da487]/10 hover:shadow-lg transition-all">
                    Sign In <ArrowRight size={16} />
                  </button>
                </form>

                <p className="text-center text-xs mt-6 text-gray-500">
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => { setMode("register"); setShowPw(false); }}
                    className="font-semibold text-[#0da487] hover:underline"
                  >
                    Sign up free
                  </button>
                </p>
              </div>
            ) : (
              <div>
                {/* Header */}
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-lg bg-[#0da487]">
                      e
                    </div>
                    <span className="font-bold text-xl text-gray-800">
                      e<span className="text-[#0da487]">Fresh</span>
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-gray-800 tracking-tight">Create your account</h3>
                  <p className="text-xs text-gray-400 mt-1">Join 50,000+ happy customers</p>
                </div>

                {/* Form */}
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
                        className="w-full border border-gray-200 rounded-xl pl-10 pr-3.5 py-3 text-sm outline-none transition-all focus:border-[#0da487] focus:ring-2 focus:ring-[#0da487]/10"
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
                        className="w-full border border-gray-200 rounded-xl pl-10 pr-3.5 py-3 text-sm outline-none transition-all focus:border-[#0da487] focus:ring-2 focus:ring-[#0da487]/10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-gray-700 uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPw ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-3 text-sm outline-none transition-all focus:border-[#0da487] focus:ring-2 focus:ring-[#0da487]/10"
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
                      id="agree-modal"
                      required
                      checked={registerForm.agree}
                      onChange={(e) => setRegisterForm({ ...registerForm, agree: e.target.checked })}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-[#0da487] focus:ring-[#0da487] cursor-pointer"
                    />
                    <label htmlFor="agree-modal" className="text-xs text-gray-500 leading-normal cursor-pointer select-none">
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

                  <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2 justify-center font-bold text-sm shadow-md shadow-[#0da487]/10 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? "Creating Account..." : "Sign Up"} {!loading && <ArrowRight size={16} />}
                  </button>
                </form>

                <p className="text-center text-xs mt-6 text-gray-500">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => { setMode("login"); setShowPw(false); }}
                    className="font-semibold text-[#0da487] hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}
