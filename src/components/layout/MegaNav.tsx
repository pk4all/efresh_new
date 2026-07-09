"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Menu,
  Zap,
  Carrot,
  Coffee,
  Croissant,
  Leaf,
  Apple,
  Box,
  Sparkles,
  Cookie,
  Refrigerator,
  ChefHat,
  ShoppingBag,
  Home,
  Flower2,
  Snowflake,
  Gift,
  Activity,
  PartyPopper,
  Tv,
  Dog,
  Trees,
  Pill,
  Baby,
  Beef,
  Fish,
} from "lucide-react";
import { fetchCategories, fetchSubCategories } from "@/utils/api";

interface CategoryApiItem {
  id: number;
  name: string;
}

interface SubCategoryApiItem {
  id: number;
  cat_id: number;
  subcat_name: string;
  category_name: string;
}

const getCategoryIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("dried fruit") || lower.includes("nuts")) return Cookie;
  if (lower.includes("fruit")) return Apple;
  if (lower.includes("vegetable")) return Carrot;
  if (lower.includes("fridge")) return Refrigerator;
  if (lower.includes("deli")) return ChefHat;
  if (lower.includes("bakery")) return Croissant;
  if (lower.includes("groceries")) return ShoppingBag;
  if (lower.includes("household")) return Home;
  if (lower.includes("flowers")) return Flower2;
  if (lower.includes("frozen")) return Snowflake;
  if (lower.includes("christmas")) return Gift;
  if (lower.includes("health food") || lower.includes("health & beauty")) return Activity;
  if (lower.includes("party")) return PartyPopper;
  if (lower.includes("appliance")) return Tv;
  if (lower.includes("pet")) return Dog;
  if (lower.includes("outdoor")) return Trees;
  if (lower.includes("medical")) return Pill;
  if (lower.includes("baby")) return Baby;
  if (lower.includes("butcher")) return Beef;
  if (lower.includes("seafood") || lower.includes("fish")) return Fish;
  if (lower.includes("caf")) return Coffee;
  if (lower.includes("herb")) return Leaf;
  if (lower.includes("special")) return Sparkles;
  if (lower.includes("add")) return Coffee;
  return Leaf;
};

const topLinks = [
  { label: "Home", href: "/" },
  { label: "Product", href: "/products" },
];

export default function MegaNav() {
  const [megaOpen, setMegaOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryApiItem[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategoryApiItem[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const megaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) {
        setMegaOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [catsRes, subcatsRes] = await Promise.all([
          fetchCategories({ limit: 200, offset: 0, vendor_id: "vendor_test3" }),
          fetchSubCategories({ limit: 50, offset: 0, vendor_id: "vendor_test3" }),
        ]);

        const cats = catsRes?.data || [];
        const subcats = subcatsRes?.data || [];

        setCategories(cats);
        setSubCategories(subcats);

        if (cats.length > 0) {
          setActiveCategoryId(cats[0].id);
        }
      } catch (err) {
        console.error("Failed to load categories/subcategories:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const activeCategorySubcats = subCategories.filter(
    (sub) => sub.cat_id === activeCategoryId
  );

  return (
    <nav
      className="hidden md:block bg-white border-b"
      style={{ borderColor: "#eceff1" }}
    >
      <div className="max-w-7xl mx-auto px-4 flex items-center w-full">
        {/* All categories */}
        <div className="relative py-3.5" ref={megaRef}>
          <button
            className="flex items-center gap-2 py-2.5 px-5 font-semibold text-sm text-white rounded-sm transition-colors hover:bg-[#0c9379] cursor-pointer text-white"
            style={{ backgroundColor: "#0da487", color: "white" }}
            onClick={() => setMegaOpen(!megaOpen)}
            onMouseEnter={() => setMegaOpen(true)}
          >
            <Menu size={16} />
            All Categories
          </button>

          {megaOpen && (
            <div
              className="absolute top-full left-0 z-50 bg-white border shadow-xl flex rounded-b-xl overflow-hidden"
              style={{
                borderColor: "#eceff1",
                width: "640px",
                minHeight: "380px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
              }}
              onMouseLeave={() => setMegaOpen(false)}
            >
              {loading ? (
                <div className="flex-1 flex items-center justify-center p-8 text-sm text-gray-500 font-medium">
                  Loading categories...
                </div>
              ) : categories.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-8 text-sm text-gray-500 font-medium">
                  No categories found.
                </div>
              ) : (
                <>
                  {/* Left category list */}
                  <div className="w-[260px] border-r border-gray-100 py-3 bg-white flex-shrink-0 max-h-[420px] overflow-y-auto">
                    {categories.map((cat) => {
                      const Icon = getCategoryIcon(cat.name);
                      const isActive = activeCategoryId === cat.id;
                      return (
                        <div
                          key={cat.id}
                          onMouseEnter={() => setActiveCategoryId(cat.id)}
                          className="flex items-center justify-between px-5 py-2.5 cursor-pointer select-none transition-colors hover:bg-gray-50/50"
                        >
                          <Link
                            href={`/products?category=${encodeURIComponent(cat.name)}`}
                            className={`flex items-center gap-3 text-sm font-medium transition-colors ${isActive
                              ? "text-[#0da487] underline decoration-2 underline-offset-4"
                              : "text-gray-700 hover:text-[#0da487]"
                              }`}
                            onClick={() => setMegaOpen(false)}
                          >
                            <Icon size={16} className={isActive ? "text-[#0da487]" : "text-gray-400"} />
                            <span>{cat.name}</span>
                          </Link>
                          <ChevronRight size={13} className={isActive ? "text-[#0da487]" : "text-gray-300"} />
                        </div>
                      );
                    })}
                  </div>

                  {/* Right subcategories panel */}
                  <div className="flex-1 p-6 bg-white max-h-[420px] overflow-y-auto">
                    <div className="flex flex-col gap-1.5">
                      <h4 className="font-bold text-sm text-gray-800 mb-2">
                        Sub Categories
                      </h4>
                      {activeCategorySubcats.length === 0 ? (
                        <span className="text-xs text-gray-400 italic">No subcategories</span>
                      ) : (
                        activeCategorySubcats.map((subItem) => (
                          <Link
                            key={subItem.id}
                            href={`/products?category=${encodeURIComponent(subItem.category_name)}&sub=${encodeURIComponent(subItem.subcat_name)}`}
                            className="flex items-center gap-2 text-xs text-gray-600 hover:text-[#0da487] transition-colors py-1 pl-1"
                            onClick={() => setMegaOpen(false)}
                          >
                            <span className="text-gray-300 text-[10px] leading-none">•</span>
                            <span>{subItem.subcat_name}</span>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Top links */}
        <div className="flex-1 flex justify-center items-center gap-1.5">
          {topLinks.map((link) => (
            <div key={link.label} className="relative py-4 px-3 flex items-center">
              <Link
                href={link.href}
                className="flex items-center gap-1 text-sm font-semibold hover:text-[#0da487] transition-colors text-gray-800"
              >
                {link.label}
              </Link>
            </div>
          ))}
        </div>

        {/* Deal Today Button */}
        <div>
          <Link
            href="/products?filter=deals"
            className="flex items-center gap-1.5 px-4 py-2 rounded-sm text-sm font-bold transition-all hover:opacity-90"
            style={{ backgroundColor: "#e6f7f4", color: "#0da487" }}
          >
            <Zap size={14} className="fill-current" />
            Deal Today
          </Link>
        </div>
      </div>
    </nav>
  );
}
