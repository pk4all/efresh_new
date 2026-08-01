"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Truck,
  ShieldCheck,
  Leaf,
  Headphones,
  Send,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

const features = [
  {
    icon: Truck,
    title: "Free Fast Delivery",
    desc: "Free shipping on orders over $50",
  },
  {
    icon: Leaf,
    title: "100% Fresh & Organic",
    desc: "Handpicked directly from farms",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    desc: "Encrypted & safe transaction",
  },
  {
    icon: Headphones,
    title: "24/7 Dedicated Support",
    desc: "Instant assistance anytime",
  },
];

const footerLinks = {
  "Quick Links": [
    { label: "Home", href: "/" },
    { label: "Shop All Products", href: "/products" },
    { label: "Value Boxes", href: "/products/value-boxes" },
    { label: "Fruit & Veg", href: "/products/fruit-and-veg" },
    { label: "Meat & Poultry", href: "/products/meat-and-poultry" },
  ],
  "Customer Care": [
    { label: "Help Center & FAQ", href: "#" },
    { label: "Track Your Order", href: "#" },
    { label: "Shipping Policy", href: "#" },
    { label: "Returns & Refund Policy", href: "#" },
    { label: "Terms & Conditions", href: "#" },
  ],
};

const socialLinks = [
  {
    name: "Facebook",
    href: "#",
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
      </svg>
    ),
  },
  {
    name: "Twitter",
    href: "#",
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "#",
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    name: "Youtube",
    href: "#",
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.002 3.002 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setSubscribed(true);
    toast.success("Thank you for subscribing to eFresh!");
    setEmail("");
  };

  return (
    <footer className="bg-slate-950 text-slate-300 mt-20 relative overflow-hidden select-none border-t border-slate-800/80">
      {/* Top Feature Highlights Bar */}
      <div className="border-b border-slate-800/60 bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/40 border border-slate-800/50 hover:border-emerald-500/30 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shrink-0 shadow-xs">
                    <Icon size={22} className="stroke-[2]" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-100 text-sm tracking-tight group-hover:text-emerald-400 transition-colors">
                      {f.title}
                    </h5>
                    <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                      {f.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Footer Links & Info */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Info */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:scale-105 transition-transform" style={{ background: "var(--theme-color2)" }}>
                e
              </div>
              <span className="font-extrabold text-2xl text-white tracking-tight">
                e<span style={{ color: "var(--theme-color1)" }}>Fresh</span>
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              Your trusted destination for farm-fresh groceries, organic produce, and everyday essentials — delivered fast & fresh to your doorstep.
            </p>
            {/* Social Icons */}
            <div className="pt-2 flex items-center gap-3">
              {socialLinks.map((item, i) => (
                <a
                  key={i}
                  href={item.href}
                  className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800/80 hover:border-[var(--theme-color1)] hover:bg-[var(--theme-color1)] flex items-center justify-center transition-all duration-300 !text-[var(--theme-color1)] hover:!text-white hover:scale-110 shadow-xs"
                  title={item.name}
                  style={{ color: "var(--theme-color1)" }}
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Dynamic Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="space-y-4">
              <h4 className="font-bold text-white text-base tracking-tight flex items-center gap-2">
                <span className="w-1.5 h-4 bg-[var(--theme-color1)] rounded-full inline-block" />
                {title}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs sm:text-sm !text-slate-300 hover:!text-emerald-400 transition-all duration-200 inline-flex items-center gap-1.5 group"
                    >
                      <ArrowRight size={12} className="opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 text-emerald-400 transition-all duration-200" />
                      <span className="!text-slate-300 group-hover:!text-emerald-400">{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact & Newsletter */}
          <div className="space-y-4">
            <h4 className="font-bold text-white text-base tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-4 bg-[var(--theme-color1)] rounded-full inline-block" />
              Contact & Deals
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-xs sm:text-sm text-slate-400">
                <MapPin size={16} className="mt-0.5 shrink-0 text-[var(--theme-color1)]" />
                <span>123 Fresh Street, Market City, CA 90210</span>
              </li>
              <li className="flex items-center gap-3 text-xs sm:text-sm text-slate-400">
                <Mail size={16} className="shrink-0 text-[var(--theme-color1)]" />
                <span>support@efresh.com</span>
              </li>
            </ul>

            {/* Newsletter Input Card */}
            <div className="pt-2">
              <p className="text-xs font-semibold text-slate-300 mb-2">
                Subscribe for exclusive discounts
              </p>
              {subscribed ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                  <CheckCircle2 size={16} /> Subscribed successfully!
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs outline-none focus:border-[var(--theme-color1)] transition-all placeholder:text-slate-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl text-white text-xs font-bold transition-all duration-200 hover:opacity-90 active:scale-95 flex items-center justify-center shrink-0 shadow-sm"
                    style={{ background: "var(--theme-color2)", color: "#ffffff" }}
                  >
                    <Send size={14} className="mr-1" /> Join
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar & Payment Icons */}
      <div className="border-t border-slate-900 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 font-medium text-center sm:text-left">
            © {new Date().getFullYear()} eFresh Inc. All rights reserved. Built for quality & fresh delivery.
          </p>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              We Accept:
            </span>
            <div className="flex items-center gap-2">
              {["Visa", "Mastercard", "UPI", "Apple Pay", "PayPal"].map((brand) => (
                <span
                  key={brand}
                  className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-900 border border-slate-800 text-slate-300 shadow-2xs"
                >
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
