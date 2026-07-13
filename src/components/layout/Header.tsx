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

const categories = [
  "All Categories",
  "Vegetables & Fruit",
  "Beverages",
  "Dairy & Breakfast",
  "Biscuits & Snacks",
  "Frozen Foods",
  "Grocery & Staples",
];

const cities = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"];

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedCity, setSelectedCity] = useState("Your Location");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
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

  const cityRef = useRef<HTMLDivElement>(null);
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
    };

    checkAuth();

    const handler = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node))
        setShowCityDropdown(false);
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
        className="sticky top-0 z-50 bg-white border-b"
        style={{ borderColor: "#eceff1", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4 select-none">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center">
            <span className="font-bold text-xl text-black">e<span style={{ color: "var(--color-primary)" }}>Fresh</span></span>
          </Link>

          {/* Location picker */}
          <div className="relative hidden lg:block" ref={cityRef}>
            <button
              className="flex items-center border rounded-sm px-3 py-1.5 cursor-pointer bg-gray-50/50 hover:bg-gray-100/80 transition-colors"
              style={{ borderColor: "#eceff1" }}
              onClick={() => setShowCityDropdown(!showCityDropdown)}
            >
              <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center mr-2">
                <MapPin size={14} className="text-gray-500" />
              </div>
              <span className="text-sm font-semibold mr-1.5" style={{ color: "#0da487" }}>
                {selectedCity || "Your Location"}
              </span>
              <ChevronDown size={12} className="text-gray-400 stroke-[2.5]" />
            </button>
            {showCityDropdown && (
              <div className="absolute top-full left-0 mt-2 bg-white rounded-sm shadow-lg border border-gray-100 py-1 w-44 z-50">
                {cities.map((city) => (
                  <button
                    key={city}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                    onClick={() => { setSelectedCity(city); setShowCityDropdown(false); }}
                    style={{ color: selectedCity === city ? "#0da487" : "var(--color-dark)" }}
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-2xl mx-2 hidden md:block">
            <div className="relative flex border rounded-sm overflow-hidden bg-white" style={{ borderColor: "#eceff1" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="I'm searching for..."
                className="flex-1 px-4 py-2.5 text-sm outline-none bg-white text-gray-800"
              />
              <Link
                href={`/products?q=${searchQuery}`}
                className="px-5 flex items-center justify-center transition-colors text-white hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: "#ffa53b" }}
              >
                <Search size={18} className="stroke-[2.5]" />
              </Link>
            </div>
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-6 ml-auto">
            {/* Phone (24/7 Delivery) */}
            <a
              href="tel:+918881042340"
              className="flex items-center gap-2 text-gray-700 hover:text-[#0da487] transition-colors p-1 hidden lg:flex"
            >
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                <Phone size={18} className="stroke-[2] text-[#0da487]" />
              </div>
              <div className="flex flex-col items-start leading-none text-left">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">24/7 Delivery</span>
                <span className="text-xs font-bold text-[#222] mt-1">+91 888 104 2340</span>
              </div>
            </a>

            <span className="h-5 w-px bg-gray-200 hidden lg:block" />

            {/* Wishlist */}
            <Link href="/wishlist" className="relative text-gray-700 hover:text-[#0da487] transition-colors p-1 flex items-center justify-center">
              <Heart size={22} className="stroke-[1.5]" />
              {mounted && wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full text-white text-[10px] flex items-center justify-center font-bold bg-red-500">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <span className="h-5 w-px bg-gray-200" />

            {/* Cart */}
            {/* <button
              onClick={openCart}
              className="relative text-gray-700 hover:text-[#0da487] transition-colors p-1 flex items-center justify-center cursor-pointer"
            >
              <ShoppingCart size={22} className="stroke-[1.5]" />
              {mounted && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full text-white text-[10px] flex items-center justify-center font-bold bg-red-500">
                  {cartCount}
                </span>
              )}
            </button> */}

            {/* <span className="h-5 w-px bg-gray-200 hidden sm:block" /> */}

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
            <div className="flex border rounded-sm overflow-hidden mb-3" style={{ borderColor: "var(--color-border)" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="flex-1 px-3 py-2.5 text-sm outline-none"
              />
              <Link
                href={`/products?q=${searchQuery}`}
                className="px-4 flex items-center"
                style={{ backgroundColor: "var(--color-primary)" }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Search size={16} className="text-white" />
              </Link>
            </div>
            <div className="flex flex-col gap-1">
              {[
                { label: "Home", href: "/" },
                { label: "Shop", href: "/products" },
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
