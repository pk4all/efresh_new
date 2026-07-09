"use client";
import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
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
          email: form.email,
          password: form.password,
          vendor_id: "vendor_test3",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.detail?.[0]?.msg || errorData.detail || "Login failed";
        throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
      }

      const data = await response.json();
      const token = data.data?.access_token || data.access_token;
      const customerId = data.data?.customer_id || data.customer_id;

      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("customer_id", String(customerId));

        // Fetch profile API for user details
        const profileResponse = await fetch(`${cleanBase}/profile`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.data.name) {
            localStorage.setItem("name", profileData.data.name);
          }
        }
      }

      toast.success("Successfully logged in!");
      window.dispatchEvent(new Event("storage"));
      router.push("/");
    } catch (err: any) {
      toast.error(err.message || "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-green-50 to-teal-50">
      <div className="w-full max-w-md">
        {/* Logo */}
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
            Welcome back!
          </h1>
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            Sign in to your eFresh account
          </p>
        </div>

        <div className="card p-7">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-dark)" }}>
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" required placeholder="you@example.com"
                  value={form.email} onChange={update("email")}
                  className="w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                  style={{ borderColor: "var(--color-border)" }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold" style={{ color: "var(--color-dark)" }}>Password</label>
                <a href="#" className="text-xs font-medium hover:underline" style={{ color: "var(--color-primary)" }}>
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPw ? "text" : "password"} required placeholder="••••••••"
                  value={form.password} onChange={update("password")}
                  className="w-full border rounded-xl pl-9 pr-9 py-2.5 text-sm outline-none"
                  style={{ borderColor: "var(--color-border)" }} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2 justify-center disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "Signing In..." : "Sign In"} {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <p className="text-center text-sm mt-5" style={{ color: "var(--color-muted)" }}>
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold hover:underline" style={{ color: "var(--color-primary)" }}>
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
