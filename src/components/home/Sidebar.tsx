"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import {
  Carrot,
  Coffee,
  Croissant,
  Leaf,
  Apple,
  Box,
  Sparkles,
} from "lucide-react";
import { products } from "@/data/products";
import { fetchCategories } from "@/utils/api";

interface CategoryApiItem {
  id: number;
  name: string;
}

const getCategoryIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("fruit")) return Apple;
  if (lower.includes("vegetable")) return Carrot;
  if (lower.includes("herb")) return Leaf;
  if (lower.includes("bread")) return Croissant;
  if (lower.includes("box")) return Box;
  if (lower.includes("special")) return Sparkles;
  if (lower.includes("add")) return Coffee;
  return Leaf;
};

export default function Sidebar() {
  const [categories, setCategories] = useState<CategoryApiItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        setLoading(true);
        const res = await fetchCategories({ limit: 200, offset: 0, vendor_id: "vendor_test2" });
        setCategories(res?.items || []);
      } catch (err) {
        console.error("Failed to load categories in Sidebar:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);

  // Get trending products (sorted by review count, showing 4 items)
  const trendingProducts = [...products]
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 4);

  return (
    <aside className="w-full flex flex-col gap-8">
      {/* Category Menu */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#222] mb-5 pb-3 border-b border-gray-100 relative">
          Category
          <span className="absolute bottom-[-1px] left-0 w-12 h-[2px] bg-[#0da487]" />
        </h3>

        {loading ? (
          <div className="py-4 text-xs text-gray-400 text-center font-medium">
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="py-4 text-xs text-gray-400 text-center font-medium">
            No categories found
          </div>
        ) : (
          <ul className="flex flex-col gap-1">
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.name);
              return (
                <li key={cat.id}>
                  <Link
                    href={`/products?category=${encodeURIComponent(cat.name)}`}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:text-[#0da487] hover:bg-[#0da487]/5 transition-all duration-200"
                  >
                    <Icon size={18} className="text-[#0da487]" />
                    <span>{cat.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {/* Value Links List */}
        <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-3">
          <Link
            href="/products?filter=value"
            className="text-sm font-bold text-gray-700 hover:text-[#0da487] transition-all hover:pl-1"
          >
            Value of the Day
          </Link>
          <Link
            href="/products?filter=offers"
            className="text-sm font-bold text-gray-700 hover:text-[#0da487] transition-all hover:pl-1"
          >
            Top 50 Offers
          </Link>
          <Link
            href="/products?filter=new"
            className="text-sm font-bold text-gray-700 hover:text-[#0da487] transition-all hover:pl-1"
          >
            New Arrivals
          </Link>
        </div>
      </div>

      {/* Seafood Banner */}
      <div className="group relative bg-[#0a1628] rounded-2xl overflow-hidden min-h-[350px] shadow-sm border border-gray-100">
        <div className="absolute inset-0 w-full h-full z-0">
          <Image
            src="/images/vegetable/banner/8.jpg"
            alt="Seafood Banner"
            fill
            className="object-cover object-center opacity-80 group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        </div>

        <div className="absolute inset-0 flex flex-col justify-end p-6 z-10 text-white">
          <span className="text-yellow-400 font-bold text-sm mb-1 uppercase tracking-wider">
            Seafood
          </span>
          <h3 className="text-xl font-extrabold mb-1 leading-tight text-white">
            Fresh Seafood
          </h3>
          <p className="text-xs text-white/80 mb-4 font-light">
            Products delivered fresh every hour
          </p>
          <Link
            href="/products?category=Meats+%26+Seafood"
            className="bg-[#0da487] hover:bg-[#0c9076] text-white text-xs font-bold py-2.5 px-5 rounded-xl w-fit transition-all hover:gap-2 flex items-center gap-1 shadow-md"
          >
            Shop Now →
          </Link>
        </div>
      </div>

      {/* Organic Vegetables Banner */}
      <div className="group relative bg-[#1c2e1f] rounded-2xl overflow-hidden min-h-[350px] shadow-sm border border-gray-100">
        <div className="absolute inset-0 w-full h-full z-0">
          <Image
            src="/images/vegetable/banner/11.jpg"
            alt="Organic Vegetables"
            fill
            className="object-cover object-center opacity-85 group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        </div>

        <div className="absolute inset-0 flex flex-col justify-end p-6 z-10 text-white">
          <span className="text-yellow-400 font-bold text-sm mb-1 uppercase tracking-wider">
            Organic
          </span>
          <h3 className="text-xl font-extrabold mb-1 leading-tight text-white">
            Fresh Vegetables
          </h3>
          <p className="text-xs text-white/80 mb-4 font-light">
            Super Offer up to 50% Off
          </p>
          <Link
            href="/products?category=Vegetables+%26+Fruit"
            className="bg-[#0da487] hover:bg-[#0c9076] text-white text-xs font-bold py-2.5 px-5 rounded-xl w-fit transition-all hover:gap-2 flex items-center gap-1 shadow-md"
          >
            Shop Now →
          </Link>
        </div>
      </div>

      {/* Trending Products */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#222] mb-5 pb-3 border-b border-gray-100 relative">
          Trending Products
          <span className="absolute bottom-[-1px] left-0 w-12 h-[2px] bg-[#0da487]" />
        </h3>

        <div className="flex flex-col gap-4">
          {trendingProducts.map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.slug}`}
              className="flex items-center gap-3 group border-b border-gray-100/50 pb-4 last:border-0 last:pb-0"
            >
              <div className="w-16 h-16 relative bg-[#f8f8f8] rounded-xl overflow-hidden flex-shrink-0">
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  className="object-contain p-1 transform group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-gray-800 group-hover:text-[#0da487] transition-colors truncate">
                  {p.name}
                </h4>
                <span className="text-[10px] text-gray-400 block mt-0.5">500g</span>
                <span className="text-xs font-bold text-[#0da487] block mt-1">
                  ${p.price.toFixed(2)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Customer Comments */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#222] mb-5 pb-3 border-b border-gray-100 relative">
          Customer Comment
          <span className="absolute bottom-[-1px] left-0 w-12 h-[2px] bg-[#0da487]" />
        </h3>

        <div className="bg-[#f8f8f8]/60 border border-gray-50 rounded-xl p-4 flex flex-col gap-4">
          <div>
            <h4 className="text-sm font-bold text-gray-800 leading-snug">
              We Care About Our Customer Experience
            </h4>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              &quot;In publishing and graphic design, Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document.&quot;
            </p>
          </div>

          <div className="flex items-center gap-3 border-t border-gray-200/40 pt-3">
            <div className="w-10 h-10 relative rounded-full overflow-hidden bg-gray-200">
              <Image
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100&auto=format&fit=crop"
                alt="Tina Mcdonnale"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h5 className="text-xs font-bold text-gray-800">Tina Mcdonnale</h5>
              <span className="text-[10px] text-gray-400">Sale Manager</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
