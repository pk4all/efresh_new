"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, ArrowRight, ChevronRight, ChevronDown, ChevronLeft, Loader2 } from "lucide-react";
import { fetchCategories, fetchSubCategories, getPublicAssetUrl } from "@/utils/api";

interface CategoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CategoryApiItem {
  id: number | string;
  name?: string;
  category_name?: string;
  product_image?: string;
  image?: string;
  category_image?: string;
}

interface SubCategoryItem {
  id: number | string;
  name: string;
}

const fallbackCategoryImages: Record<string, string> = {
  "Fruit & Vegetables": "/images/hero_fresh_fruits.png",
  Fruit: "/images/hero_fresh_fruits.png",
  Vegetables: "/images/hero_crate_vegetables.png",
  Butcher: "/images/banner_chicken.png",
  Seafood: "/images/hero_crate_vegetables.png",
  Organic: "/images/hero_healthy_food.png",
  "Deli & Cheese": "/images/banner_mushrooms.png",
  "Dairy, Eggs & Fridge": "/images/hero_fresh_fruits.png",
  Bakery: "/images/hero_crate_vegetables.png",
  Groceries: "/images/hero_healthy_food.png",
  Household: "/images/hero_crate_vegetables.png",
  "Nuts & Dried Fruit": "/images/banner_mushrooms.png",
};

// Module-level caches for Categories and Subcategories
let categoriesCache: CategoryApiItem[] | null = null;
const subCategoriesCache: Record<string, SubCategoryItem[]> = {};
let categoriesFetchPromise: Promise<CategoryApiItem[]> | null = null;

async function getCachedCategories(): Promise<CategoryApiItem[]> {
  if (categoriesCache) {
    return categoriesCache;
  }
  if (!categoriesFetchPromise) {
    categoriesFetchPromise = (async () => {
      try {
        const res = await fetchCategories({ limit: 100 });
        const items = res?.data || res?.categories || (Array.isArray(res) ? res : []);
        categoriesCache = items;
        return items;
      } catch (err) {
        console.error("Failed to load categories for drawer:", err);
        return [];
      } finally {
        categoriesFetchPromise = null;
      }
    })();
  }
  return categoriesFetchPromise;
}

async function getCachedSubCategories(catId: string | number, catName: string): Promise<SubCategoryItem[]> {
  const cacheKey = String(catId);
  if (subCategoriesCache[cacheKey]) {
    return subCategoriesCache[cacheKey];
  }

  try {
    const res = await fetchSubCategories({ category_id: String(catId), limit: 100 });
    const rawSubs = res?.data || res?.subcategories || (Array.isArray(res) ? res : []);

    const filteredRaw = rawSubs.filter((item: any) => {
      if (item.cat_id) return String(item.cat_id) === String(catId);
      if (item.category_id) return String(item.category_id) === String(catId);
      if (item.subcat_name && catName) {
        return item.category_name?.toLowerCase() === catName.toLowerCase();
      }
      return true;
    });

    const mappedSubs: SubCategoryItem[] = filteredRaw.map((item: any) => ({
      id: item.id || item.subcategory_id || item.sco_name,
      name: item.name || item.subcat_name || "Sub category",
    }));

    subCategoriesCache[cacheKey] = mappedSubs;
    return mappedSubs;
  } catch (err) {
    console.error("Failed to load subcategories:", err);
    return [];
  }
}

export default function CategoryDrawer({ isOpen, onClose }: CategoryDrawerProps) {
  const [categories, setCategories] = useState<CategoryApiItem[]>(categoriesCache || []);
  const [selectedCategory, setSelectedCategory] = useState<CategoryApiItem | null>(null);
  const [subCategories, setSubCategories] = useState<SubCategoryItem[]>([]);
  const [loading, setLoading] = useState(!categoriesCache);
  const [subLoading, setSubLoading] = useState(false);

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setSelectedCategory(null);
      setSubCategories([]);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Load Main Categories ONCE (cached across drawer opens)
  useEffect(() => {
    async function loadData() {
      if (categoriesCache) {
        setCategories(categoriesCache);
        setLoading(false);
        return;
      }
      setLoading(true);
      const items = await getCachedCategories();
      setCategories(items);
      setLoading(false);
    }

    const handleVendorChange = () => {
      categoriesCache = null;
      categoriesFetchPromise = null;
      setLoading(true);
      getCachedCategories().then((items) => {
        setCategories(items);
        setLoading(false);
      });
    };
    window.addEventListener("pincode-updated", handleVendorChange);
    window.addEventListener("vendor-changed", handleVendorChange);
    
    if (isOpen) {
      loadData();
    }

    return () => {
      window.removeEventListener("pincode-updated", handleVendorChange);
      window.removeEventListener("vendor-changed", handleVendorChange);
    };
  }, [isOpen]);

  // Handle Category Click to expand drawer & fetch/retrieve cached subcategories
  const handleCategoryClick = async (cat: CategoryApiItem) => {
    if (selectedCategory?.id === cat.id) {
      setSelectedCategory(null);
      setSubCategories([]);
      return;
    }

    setSelectedCategory(cat);
    const catName = cat.name || cat.category_name || "";
    const catId = cat.id;
    const cacheKey = String(catId);

    if (subCategoriesCache[cacheKey]) {
      setSubCategories(subCategoriesCache[cacheKey]);
      setSubLoading(false);
      return;
    }

    setSubLoading(true);
    const subs = await getCachedSubCategories(catId, catName);
    setSubCategories(subs);
    setSubLoading(false);
  };

  if (!isOpen) return null;

  const defaultPlaceholder = getPublicAssetUrl("/images/placeholder.png");
  const selectedCatName = selectedCategory?.name || selectedCategory?.category_name || "";

  return (
    <div className="fixed inset-0 z-[100005] flex overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer Panel (380px single column, extends smoothly to 760px on category click) */}
      <div
        className={`relative z-10 bg-white h-full shadow-2xl flex flex-col transition-all duration-300 ease-in-out ${selectedCategory ? "w-[650px] max-w-[95vw]" : "w-[350px] max-w-[90vw]"
          }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between w-full px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-20">
          <div className="flex items-center gap-2">
            {selectedCategory && (
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                aria-label="Back to categories"
                className="w-7 h-7 bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors cursor-pointer mr-1"
                title="Collapse Subcategories"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <h6 className="text-lg font-black uppercase tracking-tight text-gray-900 flex items-center gap-2 m-0">
              BROWSE PRODUCTS
            </h6>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close categories menu"
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2-Column Split Container */}
        <div className="flex flex-1 overflow-hidden divide-x divide-gray-100">

          {/* Left Column: Categories List */}
          <div className={`${selectedCategory ? "w-1/2 md:w-[350px] flex-shrink-0" : "w-full"} flex flex-col h-full overflow-y-auto custom-scrollbar bg-white transition-all duration-300`}>
            {/* Section Subtitle */}
            <div className="px-6 py-3 border-b border-gray-100 bg-white sticky top-0 z-10">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block">
                SHOP CATEGORIES
              </span>
            </div>

            {/* Categories Items */}
            <div className="divide-y divide-gray-100/70">
              {loading ? (
                <div className="space-y-3 p-6">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-12 bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : categories.length > 0 ? (
                categories.map((cat) => {
                  const catName = cat.name || cat.category_name || "Category";
                  const isSelected = selectedCategory?.id === cat.id;
                  const rawImg =
                    cat.product_image ||
                    cat.image ||
                    cat.category_image ||
                    fallbackCategoryImages[catName] ||
                    "/images/placeholder.png";
                  const imgSrc = getPublicAssetUrl(rawImg);

                  return (
                    <div
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat)}
                      className={`py-3 px-6 flex items-center justify-between transition-all duration-150 cursor-pointer group border-l-4 ${isSelected
                        ? "bg-gray-100/90 border-[var(--theme-color1)] text-gray-900 font-bold"
                        : "border-transparent hover:bg-gray-50 text-gray-800"
                        }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {/* Square Thumbnail */}
                        <div className="w-10 h-10 overflow-hidden relative flex-shrink-0 bg-[#f9f9f9] border border-gray-200 p-0.5 shadow-2xs">
                          <img
                            src={imgSrc}
                            alt={catName}
                            className="w-full h-full object-cover object-center"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = defaultPlaceholder;
                            }}
                          />
                        </div>
                        <span className="text-sm font-bold truncate leading-tight">
                          {catName}
                        </span>
                      </div>
                      <ArrowRight
                        size={16}
                        className={`transition-all flex-shrink-0 ${isSelected
                          ? "text-[var(--theme-color1)] translate-x-0.5"
                          : "text-gray-400 group-hover:text-[var(--theme-color1)] group-hover:translate-x-0.5"
                          }`}
                      />
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-sm text-gray-400 font-medium">
                  No categories found
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Subcategories Panel (Appears smoothly when a category is selected) */}
          {selectedCategory && (
            <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar bg-white animate-in fade-in slide-in-from-left-2 duration-200">
              {/* Selected Category Subtitle & Header */}
              <div className="px-6 py-3 border-b border-gray-100 bg-white sticky top-0 z-10 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900 uppercase tracking-tight">
                  {selectedCatName}
                </span>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/products/${selectedCatName.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`}
                    onClick={onClose}
                    className="text-xs font-semibold text-[var(--theme-color1)] hover:underline flex items-center gap-1"
                  >
                    <span>View All</span>
                    <ChevronRight size={14} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    aria-label="Collapse subcategories panel"
                    className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                    title="Close Subcategories"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Subcategories List */}
              <div className="divide-y divide-gray-100/70">
                {subLoading ? (
                  <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
                    <Loader2 size={20} className="animate-spin text-[var(--theme-color1)]" />
                    <span className="text-xs font-medium">Loading subcategories...</span>
                  </div>
                ) : subCategories.length > 0 ? (
                  subCategories.map((sub, idx) => {
                    const isAllLink = sub.name.toLowerCase().startsWith("all ");
                    const subName = sub.name;
                    const catSlug = selectedCatName.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
                    const subSlug = subName.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

                    return (
                      <Link
                        key={sub.id || idx}
                        href={
                          isAllLink
                            ? `/products/${catSlug}`
                            : `/products/${catSlug}/${subSlug}`
                        }
                        onClick={onClose}
                        className={`flex items-center justify-between py-3.5 px-6 hover:bg-gray-50 transition-all duration-150 group cursor-pointer "font-bold !text-gray-900 bg-gray-50/50"`}
                      >
                        <span className="text-sm font-medium group-hover:text-[var(--theme-color1)] transition-colors">
                          {subName}
                        </span>
                        <ChevronRight
                          size={16}
                          className="text-gray-400 group-hover:text-[var(--theme-color1)] group-hover:translate-x-0.5 transition-all"
                        />
                      </Link>
                    );
                  })
                ) : (
                  <div className="text-center py-12 px-6 text-sm text-gray-400 font-medium">
                    <p className="m-0">No subcategories listed for {selectedCatName}</p>
                    <Link
                      href={`/products/${selectedCatName.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`}
                      onClick={onClose}
                      className="inline-block mt-3 px-4 py-2 text-white text-xs font-bold transition-all hover:opacity-90"
                      style={{ background: "var(--theme-color2)", color: "#ffffff" }}
                    >
                      Browse {selectedCatName} Products
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
