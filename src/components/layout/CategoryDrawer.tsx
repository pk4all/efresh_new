"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Drawer } from "rsuite";
import { X, ArrowRight } from "lucide-react";
import { fetchCategories, getPublicAssetUrl } from "@/utils/api";
import "rsuite/dist/rsuite-no-reset.min.css";

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

export default function CategoryDrawer({ isOpen, onClose }: CategoryDrawerProps) {
  const [categories, setCategories] = useState<CategoryApiItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetchCategories({ limit: 100, vendor_id: "vendor_test6" });
        const items = res?.data || res?.categories || (Array.isArray(res) ? res : []);
        setCategories(items);
      } catch (err) {
        console.error("Failed to load categories for drawer:", err);
      } finally {
        setLoading(false);
      }
    }
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const defaultPlaceholder = getPublicAssetUrl("/images/placeholder.png");

  return (
    <Drawer
      placement="left"
      open={isOpen}
      onClose={onClose}
      size="xs"
      className="category-drawer"
    >
      <Drawer.Body className="p-0 bg-white custom-scrollbar flex flex-col h-full">
        {/* Drawer Header */}
        <div className="flex items-center justify-between w-full px-5 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
          <h6 className="text-lg font-black uppercase tracking-tight text-gray-900 flex items-center gap-2 m-0">
            BROWSE PRODUCTS
          </h6>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close categories menu"
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Subheader */}
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
            Shop Categories
          </span>

          {/* Categories List from API using product_image */}
          <div className="space-y-1 pt-1">
            {loading ? (
              <div className="space-y-2 py-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : categories.length > 0 ? (
              categories.map((cat, idx) => {
                const catName = cat.name || cat.category_name || "Category";
                const rawImg = cat.product_image || cat.image || cat.category_image || fallbackCategoryImages[catName] || "/images/placeholder.png";
                const imgSrc = getPublicAssetUrl(rawImg);

                return (
                  <Link
                    key={cat.id || idx}
                    href={`/products?category=${encodeURIComponent(catName)}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-all duration-200 group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden relative flex-shrink-0 bg-gray-100 border border-gray-100">
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
                      <span className="text-sm font-semibold text-gray-800 group-hover:text-[#4967a9] transition-colors">
                        {catName}
                      </span>
                    </div>
                    <ArrowRight size={16} className="text-gray-400 group-hover:text-[#4967a9] group-hover:translate-x-1 transition-all" />
                  </Link>
                );
              })
            ) : (
              <div className="text-center py-6 text-sm text-gray-400 font-medium">
                No categories found
              </div>
            )}
          </div>

        </div>
      </Drawer.Body>
    </Drawer>
  );
}
