"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import CategoryDrawer from "@/components/layout/CategoryDrawer";

import {
  FruitVegIcon,
  MeatSeafoodIcon,
  GroceryBagIcon,
  ValueBoxIcon,
  SpecialOffersIcon,
  PetStoreIcon,
  PlusCircleIcon,
  MenuCircleIcon,
  DairyIcon,
  BakeryIcon,
  FrozenFoodsIcon,
} from "@/components/icons";

export default function MegaNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

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
    { label: "Fruit & Veg", icon: FruitVegIcon, href: "/products/fruit-and-veg" },
    { label: "Meat & Poultry", icon: MeatSeafoodIcon, href: "/products/meat-and-poultry" },
    { label: "Dairy", icon: DairyIcon, href: "/products/dairy" },
    { label: "Bakery", icon: BakeryIcon, href: "/products/bakery" },
    { label: "Value Boxes", icon: ValueBoxIcon, href: "/products/value-boxes" },
    { label: "Beverages", icon: GroceryBagIcon, href: "/products/beverages" },
    { label: "Frozen Foods", icon: FrozenFoodsIcon, href: "/products/frozen-foods" },
  ];

  // const moreCategories = [
  //   { label: "Beverages", icon: GroceryBagIcon, href: "/products/beverages" },
  //   { label: "Frozen Foods", icon: ValueBoxIcon, href: "/products/frozen-foods" },
  // ];

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm select-none hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex items-stretch justify-between min-h-[72px]">

          {/* Left Side: "All Categories" Button (Hidden per user request) */}
          <div className="hidden items-center py-2 pr-3 sm:pr-4 shrink-0" style={{ display: "none" }}>
            <button
              onClick={() => setCategoryDrawerOpen(true)}
              className="flex items-center gap-2.5 text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-3 rounded-lg transition-all shadow-md cursor-pointer hover:opacity-95 active:scale-95 whitespace-nowrap shrink-0"
              style={{ background: "var(--theme-color2)", color: "#ffffff" }}
            >
              <MenuCircleIcon className="w-5 h-5 text-white shrink-0" />
              <span className="whitespace-nowrap">All Categories</span>
            </button>
          </div>

          {/* Right Aligned Categories & Cart Pill */}
          <div className="flex items-stretch flex-1 justify-end min-w-0">
            {primaryCategories.map((item, idx) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/products" && pathname.startsWith(item.href));
              return (
                <Link
                  key={idx}
                  href={item.href}
                  className={`category-nav-item flex flex-col items-center justify-center px-2 sm:px-3 lg:px-4 py-3 border-l border-dotted border-gray-200 transition-all duration-200 group cursor-pointer min-w-[80px] lg:min-w-[95px] xl:min-w-[115px] self-stretch shrink ${isActive ? "active" : "text-gray-800"}`}
                >
                  <Icon className="w-8 h-8 sm:w-9 sm:h-9 text-gray-700 group-hover:text-white transition-colors mb-1.5" />
                  <span className="text-[11px] sm:text-xs font-semibold text-gray-800 group-hover:text-white whitespace-nowrap">
                    {item.label}
                  </span>
                </Link>
              );
            })}

            {/* MORE Dropdown Item (Right Side) */}
            <div className="relative border-l border-dotted border-gray-200 flex items-stretch shrink-0" ref={moreRef}>
              {/* <button
                onClick={() => setMoreOpen(!moreOpen)}
                className={`category-nav-item flex flex-col items-center justify-center px-3 sm:px-4 py-3 transition-all duration-200 cursor-pointer min-w-[75px] sm:min-w-[95px] self-stretch group ${moreOpen
                  ? "text-white"
                  : "text-gray-800"
                  }`}
              >
                <PlusCircleIcon className={`w-8 h-8 sm:w-9 sm:h-9 mb-1.5 transition-colors ${moreOpen ? "text-white" : "text-gray-700 group-hover:text-white"}`} />
                <span className={`text-[11px] sm:text-xs font-semibold whitespace-nowrap ${moreOpen ? "text-white" : "text-gray-800 group-hover:text-white"}`}>
                  More
                </span>
              </button> */}

              {/* More Dropdown Panel */}
              {/* {moreOpen && (
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
              ) */}
            </div>

            {/* Cart Pill Button */}
            <div className="flex items-center py-2 pl-4 border-l border-dotted border-gray-200">
              <button
                onClick={openCart}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200/80 px-3.5 py-2 rounded-full cursor-pointer transition-all shadow-sm"
              >
                <ShoppingCart size={18} className="text-gray-800" />
                <span className="text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center leading-none" style={{ background: "var(--theme-color2)", color: "#ffffff" }}>
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
