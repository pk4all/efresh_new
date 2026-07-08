"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, CreditCard, Smartphone } from "lucide-react";

const footerLinks = {
  "Quick Links": [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/products" },
    { label: "About Us", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Contact", href: "#" },
  ],
  Help: [
    { label: "FAQ", href: "#" },
    { label: "Shipping Policy", href: "#" },
    { label: "Return Policy", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};

const socialLinks = [
  {
    name: "Facebook",
    href: "#",
    icon: (
      <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
      </svg>
    ),
  },
  {
    name: "Twitter",
    href: "#",
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "#",
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
  },
  {
    name: "Youtube",
    href: "#",
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.002 3.002 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div
                className="w-9 h-9 rounded-sm flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                e
              </div>
              <span className="font-bold text-xl text-white">
                e<span style={{ color: "var(--color-primary)" }}>Fresh</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              Your one-stop destination for fresh groceries, organic produce, and everyday essentials — delivered fast to your door.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((item, i) => (
                <a
                  key={i}
                  href={item.href}
                  className="w-9 h-9 rounded-full bg-gray-700 hover:bg-primary flex items-center justify-center transition-colors text-gray-300 hover:text-white"
                  title={item.name}
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick links + Help */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-semibold text-white text-sm mb-4">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-primary transition-colors"
                      style={{ "--hover-color": "var(--color-primary)" } as React.CSSProperties}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white text-sm mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-gray-400">
                <MapPin size={16} className="mt-0.5 flex-shrink-0 text-primary" style={{ color: "var(--color-primary)" }} />
                123 Fresh Street, Market City, CA 90210
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <Phone size={16} style={{ color: "var(--color-primary)" }} />
                1800-000-000 (24/7)
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <Mail size={16} style={{ color: "var(--color-primary)" }} />
                support@efresh.com
              </li>
            </ul>

            {/* Newsletter */}
            <div className="mt-5">
              <p className="text-xs text-gray-400 mb-2">Subscribe for deals & updates</p>
              <div className="flex rounded-sm overflow-hidden border border-gray-600">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-3 py-2 text-xs bg-gray-800 text-white outline-none placeholder-gray-500"
                />
                <button
                  className="px-3 text-white text-xs font-semibold"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  Go
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} eFresh. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">We accept:</span>
            <div className="flex items-center gap-2">
              {[
                { icon: CreditCard, label: "Visa" },
                { icon: CreditCard, label: "MC" },
                { icon: Smartphone, label: "UPI" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1 bg-gray-700 rounded px-2 py-1"
                >
                  <Icon size={12} className="text-gray-300" />
                  <span className="text-xs text-gray-300">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
