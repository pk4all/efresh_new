"use client";
import { useState, useEffect } from "react";
import ProductCard from "@/components/product/ProductCard";
import { fetchProducts, mapApiProductToProduct } from "@/utils/api";
import { Product } from "@/types";

export default function TodayDealsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        // Category 2 is Vegetables
        const res = await fetchProducts({ category_id: "2", limit: 12, vendor_id: "vendor_test3" });
        const items = res?.data || [];
        setProducts(items.map(mapApiProductToProduct));
      } catch (err) {
        console.error("Failed to load today deals:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

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
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-[280px]" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-10 text-gray-500">No products found</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product, index) => (
            <ProductCard key={`${product.id}-${index}`} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
