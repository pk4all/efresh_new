"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, Check, ChevronDown, ChevronUp, Lock, FileText, ExternalLink } from "lucide-react";

const STORAGE_KEY = "efresh_cookie_consent_accepted";

export default function CookieConsentDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const isAccepted = localStorage.getItem(STORAGE_KEY);
      if (isAccepted !== "true") {
        setIsOpen(true);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleAccept = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "true");
      localStorage.setItem("efresh_cookie_consent_date", new Date().toISOString());
    }
    setIsOpen(false);
  };

  if (!isMounted || !isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100050] flex flex-col justify-end bg-black/65 backdrop-blur-md transition-opacity duration-300 ease-in-out pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title"
    >
      <div className="w-full bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.25)] border-t border-gray-100 max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Accent Bar at top */}
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: "var(--color-primary, #4967a9)" }}
        />

        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar max-w-5xl mx-auto w-full">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
            <div className="flex items-center gap-3.5">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md flex-shrink-0"
                style={{ backgroundColor: "var(--color-primary, #4967a9)" }}
              >
                <Cookie size={26} className="animate-bounce" style={{ animationDuration: "3s" }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3
                    id="cookie-consent-title"
                    className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight m-0"
                  >
                    Cookies & Terms of Service Consent
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Lock size={12} /> Required
                  </span>
                </div>
                <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                  Please accept our terms & cookie settings to proceed and access eFresh
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs font-semibold text-gray-600 hover:text-primary flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200/80 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
            >
              <FileText size={14} />
              {showDetails ? "Hide Cookie Details" : "View Cookie Details"}
              {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {/* Description Body */}
          <div className="py-4 space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed m-0">
              Welcome to <strong className="text-gray-900">eFresh</strong>! To provide you with a smooth, secure, and personalized grocery shopping experience, we use essential cookies and tracking technologies. By accepting, you confirm that you agree to our{" "}
              <Link href="#" className="font-semibold underline underline-offset-2 hover:opacity-80" style={{ color: "var(--color-primary, #4967a9)" }}>
                Terms & Conditions
              </Link>{" "}
              and{" "}
              <Link href="#" className="font-semibold underline underline-offset-2 hover:opacity-80" style={{ color: "var(--color-primary, #4967a9)" }}>
                Privacy Policy
              </Link>.
            </p>

            {/* Expandable Details Section */}
            {showDetails && (
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/70">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
                      <ShieldCheck size={18} className="text-emerald-600" />
                      Essential Cookies & Security
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Always Active
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-normal m-0">
                    Required for basic site navigation, account authentication, cart management, pincode delivery validation, and checkout processing.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/70">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
                      <Cookie size={18} style={{ color: "var(--color-primary, #4967a9)" }} />
                      Analytics & Experience
                    </div>
                    <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                      Included
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-normal m-0">
                    Allows us to analyze site traffic, optimize performance, and present fresh produce deals tailored to your area.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <Link
                href="#"
                className="hover:underline flex items-center gap-1 text-gray-600 hover:text-gray-900"
              >
                <span>Terms of Service</span>
                <ExternalLink size={12} />
              </Link>
              <span>•</span>
              <Link
                href="#"
                className="hover:underline flex items-center gap-1 text-gray-600 hover:text-gray-900"
              >
                <span>Privacy Policy</span>
                <ExternalLink size={12} />
              </Link>
            </div>

            <div className="w-full sm:w-auto flex items-center gap-3">
              <button
                type="button"
                onClick={handleAccept}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2.5 shadow-lg hover:shadow-xl hover:opacity-95 transition-all cursor-pointer transform active:scale-95"
                style={{
                  backgroundColor: "var(--color-primary, #4967a9)",
                  boxShadow: "0 4px 14px rgba(73, 103, 169, 0.35)",
                }}
              >
                <Check size={18} strokeWidth={2.5} />
                <span>Accept & Continue</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
