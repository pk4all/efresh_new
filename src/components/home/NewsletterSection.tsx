"use client";
import { useState } from "react";
import { Mail, CheckCircle } from "lucide-react";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setEmail("");
  };

  return (
    <section
      className="my-10 rounded-2xl px-6 py-12 text-center overflow-hidden relative"
      style={{
        background: "linear-gradient(135deg, #0da487 0%, #0a7a65 100%)",
      }}
    >
      {/* Background circles */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10 bg-white" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-10 bg-white" />

      <div className="relative z-10 max-w-xl mx-auto">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Mail size={22} className="text-white" />
          </div>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Get Fresh Deals in Your Inbox
        </h2>
        <p className="text-white/80 mb-6 text-sm md:text-base">
          Subscribe for exclusive offers, new arrivals, and seasonal recipes. No spam, ever.
        </p>

        {submitted ? (
          <div className="flex items-center justify-center gap-2 text-white font-semibold">
            <CheckCircle size={22} />
            Thanks for subscribing! 🎉
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              className="flex-1 px-4 py-3 rounded-xl text-sm outline-none text-gray-800 placeholder-gray-400"
              style={{ backgroundColor: "white" }}
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-xl font-semibold text-sm text-white bg-white/20 hover:bg-white/30 transition-colors whitespace-nowrap border border-white/30"
            >
              Subscribe
            </button>
          </form>
        )}

        <p className="text-white/60 text-xs mt-3">
          Join 50,000+ happy subscribers. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}
