"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  MapPin,
  ChevronDown,
  Search,
  Phone,
  Heart,
  ShoppingCart,
  User,
  X,
  Menu,
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import CartDrawer from "@/components/cart/CartDrawer";
import AuthModal from "@/components/auth/AuthModal";
import PincodeModal from "@/components/layout/PincodeModal";
import SearchTypeahead from "@/components/layout/SearchTypeahead";

const categories = [

];

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [pincode, setPincode] = useState("");
  const [showPincodeModal, setShowPincodeModal] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("Guest");

  const cartCount = useCartStore((s) => s.getTotalItems());
  const openCart = useCartStore((s) => s.openCart);
  const wishlistCount = useWishlistStore((s) => s.getCount());

  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const name = localStorage.getItem("name");
      setIsLoggedIn(!!token);
      setUserName(name || "Guest");
      if (token) {
        useCartStore.getState().syncCartWithDb();
      }
      const storedPincode = localStorage.getItem("pincode");
      if (storedPincode) {
        setPincode(storedPincode);
      }
    };

    checkAuth();

    const handler = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node))
        setShowUserMenu(false);
    };

    document.addEventListener("mousedown", handler);
    const handleOpenLogin = () => {
      setAuthMode("login");
      setAuthModalOpen(true);
    };

    window.addEventListener("storage", checkAuth);
    window.addEventListener("open-login-modal", handleOpenLogin);

    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("open-login-modal", handleOpenLogin);
    };
  }, []);

  return (
    <>
      <header
        className="relative z-[60] bg-white border-b"
        style={{ borderColor: "#eceff1" }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4 select-none">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center">
            <span className="font-bold text-xl text-black">e<span style={{ color: "var(--color-primary)" }}>Fresh</span></span>
          </Link>

          {/* Location picker */}
          <div className="relative hidden lg:block">
            <button
              className="flex items-center border rounded-sm px-3 py-1.5 cursor-pointer bg-gray-50/50 hover:bg-gray-100/80 transition-colors"
              style={{ borderColor: "#eceff1" }}
              onClick={() => setShowPincodeModal(true)}
            >
              <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center mr-2">
                <MapPin size={14} className="text-[#4967a9]" />
              </div>
              <span className="text-sm font-semibold mr-1.5" style={{ color: "#4967a9" }}>
                {pincode ? `Pincode: ${pincode}` : "Set Pincode"}
              </span>
              <ChevronDown size={12} className="text-gray-400 stroke-[2.5]" />
            </button>
            {showPincodeModal && (
              <PincodeModal forceOpen={true} onClose={() => setShowPincodeModal(false)} />
            )}
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-2xl mx-2 hidden md:block">
            <SearchTypeahead />
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-6 ml-auto">
            {/* Phone (24/7 Delivery) */}
            <a
              href="tel:+918881042340"
              className="flex items-center gap-2 text-gray-700 hover:text-[#4967a9] transition-colors p-1 hidden lg:flex"
            >
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                <Phone size={18} className="stroke-[2] text-[#4967a9]" />
              </div>
              <div className="flex flex-col items-start leading-none text-left">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">24/7 Delivery</span>
                <span className="text-xs font-bold text-[#222] mt-1">+91 888 104 2340</span>
              </div>
            </a>

            <span className="h-5 w-px bg-gray-200 hidden lg:block" />

            {/* User Account */}
            <div className="relative hidden sm:block" ref={userRef}>
              <button
                className="flex items-center gap-2 text-gray-700 hover:text-[#0da487] transition-colors p-1 cursor-pointer"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                  <User size={18} className="stroke-[2] text-[#0da487]" />
                </div>
                <div className="flex flex-col items-start leading-none text-left">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Hello,</span>
                  <span className="text-xs font-bold text-[#222] mt-1">{userName}</span>
                </div>
              </button>
              {showUserMenu && (
                <div className="absolute top-full right-0 mt-2 bg-white rounded-sm shadow-lg border border-gray-100 py-1 w-44 z-50">
                  {isLoggedIn && [
                    { label: "My Account", href: "/account" },
                    { label: "Orders", href: "/account?tab=orders" },
                    { label: "Wishlist", href: "/wishlist" },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors text-gray-700 hover:text-[#0da487]"
                      onClick={() => setShowUserMenu(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                  {!isLoggedIn ? (
                    <>
                      <button
                        onClick={() => {
                          setAuthMode("login");
                          setAuthModalOpen(true);
                          setShowUserMenu(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors text-gray-700 hover:text-[#0da487] cursor-pointer"
                      >
                        Login
                      </button>
                      <button
                        onClick={() => {
                          setAuthMode("register");
                          setAuthModalOpen(true);
                          setShowUserMenu(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors text-gray-700 hover:text-[#0da487] cursor-pointer"
                      >
                        Register
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        localStorage.removeItem("token");
                        localStorage.removeItem("customer_id");
                        localStorage.removeItem("name");
                        setIsLoggedIn(false);
                        setUserName("My Account");
                        setShowUserMenu(false);
                        window.dispatchEvent(new Event("storage"));
                      }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors text-red-600 hover:text-red-700 cursor-pointer border-t"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      Logout
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden flex items-center justify-center w-10 h-10 text-gray-700 cursor-pointer"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white px-4 py-4" style={{ borderColor: "var(--color-border)" }}>
            <div className="mb-3">
              <SearchTypeahead onSearchSubmit={() => setMobileMenuOpen(false)} />
            </div>
            <div className="flex flex-col gap-1">
              {[
                { label: "Home", href: "/" },
                { label: "Products", href: "/products" },
                { label: "Wishlist", href: "/wishlist" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="py-2 text-sm font-medium border-b"
                  style={{ color: "var(--color-dark)", borderColor: "var(--color-border)" }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {!isLoggedIn ? (
                <>
                  <button
                    onClick={() => {
                      setAuthMode("login");
                      setAuthModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="py-2 text-sm font-medium border-b text-left w-full cursor-pointer"
                    style={{ color: "var(--color-dark)", borderColor: "var(--color-border)" }}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode("register");
                      setAuthModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="py-2 text-sm font-medium border-b text-left w-full cursor-pointer"
                    style={{ color: "var(--color-dark)", borderColor: "var(--color-border)" }}
                  >
                    Register
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("customer_id");
                    localStorage.removeItem("name");
                    setIsLoggedIn(false);
                    setUserName("My Account");
                    setMobileMenuOpen(false);
                    window.dispatchEvent(new Event("storage"));
                  }}
                  className="py-2 text-sm font-medium border-b text-left w-full cursor-pointer text-red-600"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <CartDrawer />

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
}
