"use client";
import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, CheckCircle } from "lucide-react";

import { toast } from "sonner";

export default function RegisterPage() {
  const [showPw, setShowPw] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", agree: false });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: k === "agree" ? (e.target as HTMLInputElement).checked : e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
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
          name: form.name,
          email: form.email,
          password: form.password,
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
          localStorage.setItem("name", form.name);
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

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-green-50 to-teal-50">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: "var(--color-primary-light)" }}>
            <CheckCircle size={40} style={{ color: "var(--color-primary)" }} />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--color-dark)" }}>
            Account Created! 🎉
          </h1>
          <p className="text-sm mb-5" style={{ color: "var(--color-muted)" }}>
            Welcome to eFresh, {form.name}! Start shopping fresh.
          </p>
          <Link href="/" className="btn-primary inline-flex">Go to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-green-50 to-teal-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: "var(--color-primary)" }}>
              e
            </div>
            <span className="font-bold text-2xl" style={{ color: "var(--color-dark)" }}>
              e<span style={{ color: "var(--color-primary)" }}>Fresh</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold mt-4 mb-1" style={{ color: "var(--color-dark)" }}>
            Create your account
          </h1>
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            Join 50,000+ happy customers
          </p>
        </div>

        <div className="card p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-dark)" }}>Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input required placeholder="John Doe" value={form.name} onChange={update("name")}
                  className="w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: "var(--color-border)" }} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-dark)" }}>Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" required placeholder="you@example.com" value={form.email} onChange={update("email")}
                  className="w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: "var(--color-border)" }} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-dark)" }}>Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPw ? "text" : "password"} required placeholder="Min. 8 characters"
                  value={form.password} onChange={update("password")}
                  className="w-full border rounded-xl pl-9 pr-9 py-2.5 text-sm outline-none"
                  style={{ borderColor: "var(--color-border)" }} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" required checked={form.agree as boolean}
                onChange={update("agree")}
                className="mt-0.5" style={{ accentColor: "var(--color-primary)" }} />
              <span className="text-xs" style={{ color: "var(--color-muted)" }}>
                I agree to the{" "}
                <a href="#" className="font-semibold hover:underline" style={{ color: "var(--color-primary)" }}>
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="font-semibold hover:underline" style={{ color: "var(--color-primary)" }}>
                  Privacy Policy
                </a>
              </span>
            </label>

             <button type="submit" disabled={loading} className="btn-primary w-full py-3 justify-center disabled:opacity-50 disabled:cursor-not-allowed">
               {loading ? "Creating Account..." : "Create Account"} {!loading && <ArrowRight size={16} />}
             </button>
          </form>

          <p className="text-center text-sm mt-5" style={{ color: "var(--color-muted)" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--color-primary)" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
