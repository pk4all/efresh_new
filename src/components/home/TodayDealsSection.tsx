"use client";
import { useState, useEffect } from "react";
import ProductCard from "@/components/product/ProductCard";
import { products } from "@/data/products";

export default function TodayDealsSection() {
  const activeCategory = "Vegetables & Fruit";
  const [timeLeft, setTimeLeft] = useState(1293530); // in seconds (~14 days, 23 hours, etc.)

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 1293530));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const formatCountdown = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${d} : ${String(h).padStart(2, "0")} : ${String(m).padStart(2, "0")} : ${String(s).padStart(2, "0")}`;
  };

  const activeProducts = products.filter((p) => p.category === activeCategory);
  const displayProducts = activeProducts.slice(0, 8);

  return (
    <section className="my-8">
      {/* Header Block with custom title decoration and timer */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 mb-6 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-extrabold text-[#222]">Top Save Today</h2>
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="h-[1.5px] w-6 bg-[#0da487]/40" />
              <span className="text-[#0da487] text-sm">🌱</span>
              <span className="h-[1.5px] w-6 bg-[#0da487]/40" />
            </div>
          </div>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Don&apos;t miss this opportunity at a special discount just for this week.
          </p>
        </div>

        {/* Expires Countdown badge matching theme */}
        <div className="bg-[#ff5c5c] text-white px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm font-bold text-xs md:text-sm self-start md:self-center">
          <span>Expires in :</span>
          <span className="font-mono tracking-wider">{formatCountdown(timeLeft)}</span>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {displayProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
