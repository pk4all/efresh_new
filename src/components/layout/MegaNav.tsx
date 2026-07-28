"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import CategoryDrawer from "@/components/layout/CategoryDrawer";

/* Line art icons with larger default sizes (w-9 h-9) matching reference screenshots */
const FruitVegIcon = ({ className = "w-9 h-9" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 18c0 6 4.5 9 10 9s10-3 10-9H6z" />
    <path d="M12 11c-1-3 1-6 4-6s5 3 4 6" />
    <path d="M8 14c-1-2 0-4 2-5s4 1 3 3" />
    <path d="M24 14c1-2 0-4-2-5s-4 1-3 3" />
    <line x1="6" y1="18" x2="26" y2="18" />
  </svg>
);

const MeatSeafoodIcon = ({ className = "w-9 h-9" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 6c6-2 15 2 15 10 0 7-7 11-13 11S5 22 5 15c0-4 2-7 6-9z" />
    <ellipse cx="16" cy="16" rx="4" ry="2.5" transform="rotate(-30 16 16)" />
  </svg>
);

const GroceryBagIcon = ({ className = "w-9 h-9" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 10h14l-1.5 16h-11L9 10z" />
    <path d="M12 10V7c0-2 1.5-3 4-3s4 1 4 3v3" />
    <path d="M12 13v-1M20 13v-1" />
    <path d="M13 14c1-2 3-2 3 0" />
  </svg>
);

const ValueBoxIcon = ({ className = "w-9 h-9" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4l12 6v12l-12 6L4 22V10l12-6z" />
    <line x1="16" y1="16" x2="28" y2="10" />
    <line x1="16" y1="16" x2="4" y2="10" />
    <line x1="16" y1="16" x2="16" y2="28" />
  </svg>
);

const SpecialOffersIcon = ({ className = "w-9 h-9" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4l3 3 4-1 1 4 4 1-1 4 3 3-3 3 1 4-4 1-1 4-4-1-3 3-3-3-4 1-1-4-4-1 1-4-3-3 3-3-1-4 4-1 1-4 4 1 3-3z" />
    <text x="16" y="20" textAnchor="middle" fontSize="11" fontWeight="bold" fill="currentColor" stroke="none">$</text>
  </svg>
);

const PetStoreIcon = ({ className = "w-9 h-9" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="16" cy="21" rx="5" ry="4" />
    <circle cx="10" cy="12" r="2" />
    <circle cx="15" cy="9" r="2" />
    <circle cx="21" cy="12" r="2" />
    <circle cx="22" cy="17" r="1.5" />
  </svg>
);

const PlusCircleIcon = ({ className = "w-9 h-9" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="16" cy="16" r="10" />
    <line x1="16" y1="11" x2="16" y2="21" />
    <line x1="11" y1="16" x2="21" y2="16" />
  </svg>
);

const MenuCircleIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="11" x2="24" y2="11" />
    <line x1="8" y1="16" x2="24" y2="16" />
    <line x1="8" y1="20" x2="24" y2="20" />
  </svg>
);

const DairyIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 8h6v18h-6z" />
    <path d="M11 5h4v3h-4z" />
    <circle cx="22" cy="20" r="4" />
  </svg>
);

const BakeryIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 14c0-4 4-6 10-6s10 2 10 6v8H6v-8z" />
    <line x1="10" y1="12" x2="13" y2="18" />
    <line x1="16" y1="12" x2="19" y2="18" />
  </svg>
);

export default function MegaNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const cartCount = useCartStore((s) => s.getTotalItems());
  const openCart = useCartStore((s) => s.openCart);

  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const primaryCategories = [
    { label: "Fruit & Veg", icon: FruitVegIcon, href: "/products?category=Vegetables+%26+Fruit" },
    { label: "Meat & Seafood", icon: MeatSeafoodIcon, href: "/products?category=Meats+%26+Seafood" },
    { label: "Grocery", icon: GroceryBagIcon, href: "/products?category=Groceries" },
    { label: "Value Boxes", icon: ValueBoxIcon, href: "/products?filter=value-boxes" },
    { label: "Special Offers", icon: SpecialOffersIcon, href: "/products?filter=special-offers" },
    { label: "Pet Store", icon: PetStoreIcon, href: "/products?category=Pet" },
  ];

  const moreCategories = [
    { label: "Dairy", icon: DairyIcon, href: "/products?category=Dairy+%26+Breakfast" },
    { label: "Bakery", icon: BakeryIcon, href: "/products?category=Bakery" },
    { label: "Beverages", icon: GroceryBagIcon, href: "/products?category=Beverages" },
    { label: "Frozen Foods", icon: ValueBoxIcon, href: "/products?category=Frozen+Foods" },
  ];

  return (
    <>
      <nav className="relative bg-white border-b border-gray-200 select-none hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex items-stretch justify-between min-h-[72px]">
          
          {/* Left Side: "All Categories" Button */}
          <div className="flex items-center py-2 pr-4">
            <button
              onClick={() => setCategoryDrawerOpen(true)}
              className="flex items-center gap-2.5 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-lg transition-all shadow-md cursor-pointer hover:opacity-95 active:scale-95"
              style={{ backgroundColor: "#4967a9", color: "#ffffff" }}
            >
              <MenuCircleIcon className="w-5 h-5 text-white" />
              <span>All Categories</span>
            </button>
          </div>

          {/* Right Aligned Categories & Cart Pill */}
          <div className="flex items-stretch">
            {primaryCategories.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Link
                  key={idx}
                  href={item.href}
                  className="category-nav-item flex flex-col items-center justify-center px-4 py-3 sm:px-6 text-gray-800 border-l border-dotted border-gray-200 transition-all duration-200 group cursor-pointer min-w-[100px] sm:min-w-[125px] self-stretch"
                >
                  <Icon className="w-9 h-9 text-gray-700 group-hover:text-white transition-colors mb-1.5" />
                  <span className="text-xs sm:text-sm font-semibold text-gray-800 group-hover:text-white whitespace-nowrap">
                    {item.label}
                  </span>
                </Link>
              );
            })}

            {/* MORE Dropdown Item (Right Side) */}
            <div className="relative border-l border-dotted border-gray-200 flex items-stretch" ref={moreRef}>
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                className={`category-nav-item flex flex-col items-center justify-center px-5 py-3 transition-all duration-200 cursor-pointer min-w-[95px] sm:min-w-[115px] self-stretch group ${
                  moreOpen
                    ? "bg-[#6BBE59] text-white"
                    : "text-gray-800"
                }`}
              >
                <PlusCircleIcon className={`w-9 h-9 mb-1.5 transition-colors ${moreOpen ? "text-white" : "text-gray-700 group-hover:text-white"}`} />
                <span className={`text-xs sm:text-sm font-semibold whitespace-nowrap ${moreOpen ? "text-white" : "text-gray-800 group-hover:text-white"}`}>
                  More
                </span>
              </button>

              {/* More Dropdown Panel */}
              {moreOpen && (
                <div className="absolute top-full right-0 z-50 bg-white border border-gray-200 shadow-xl rounded-b-xl w-60 py-2 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                  {moreCategories.map((cat, i) => {
                    const CIcon = cat.icon;
                    return (
                      <Link
                        key={i}
                        href={cat.href}
                        className="dropdown-menu-item flex items-center gap-3.5 px-5 py-3 text-sm font-semibold border-b border-gray-100 last:border-0 transition-colors"
                        onClick={() => setMoreOpen(false)}
                      >
                        <CIcon className="w-7 h-7 flex-shrink-0" />
                        <span className="font-semibold text-sm">{cat.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cart Pill Button */}
            <div className="flex items-center py-2 pl-4 border-l border-dotted border-gray-200">
              <button
                onClick={openCart}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200/80 px-3.5 py-2 rounded-full cursor-pointer transition-all shadow-sm"
              >
                <ShoppingCart size={18} className="text-gray-800" />
                <span className="bg-[#6BBE59] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center leading-none">
                  {mounted ? cartCount : 0}
                </span>
              </button>
            </div>
          </div>

        </div>
      </nav>

      <CategoryDrawer
        isOpen={categoryDrawerOpen}
        onClose={() => setCategoryDrawerOpen(false)}
      />
    </>
  );
}
