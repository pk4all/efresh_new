"use client";
import { useState, useEffect } from "react";
import ProductCard from "@/components/product/ProductCard";
import { fetchProducts, mapApiProductToProduct } from "@/utils/api";
import { Product } from "@/types";

const TABS = ["All", "Vegetables", "Fruits", "Protein", "Snacks"] as const;
type Tab = (typeof TABS)[number];

const tabCategoryMap: Record<Tab, string | undefined> = {
  All: undefined,
  Vegetables: "2",
  Fruits: "1",
  Protein: "20", // Butcher
  Snacks: "3", // Nuts & Dried Fruit
};

export default function BestSellersSection() {
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const catId = tabCategoryMap[activeTab];
        const res = await fetchProducts({
          category_id: catId,
          limit: 12,
          offset: activeTab === "All" ? 24 : 0,
          vendor_id: "vendor_test3",
        });
        const items = res?.data || [];
        setProducts(items.map(mapApiProductToProduct));
      } catch (err) {
        console.error("Failed to load best sellers:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [activeTab]);

  return (
    <section className="my-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-extrabold text-[#222]">Best Sellers</h2>
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="h-[1.5px] w-6 bg-[#0da487]/40" />
              <span className="text-[#0da487] text-sm">🔥</span>
              <span className="h-[1.5px] w-6 bg-[#0da487]/40" />
            </div>
          </div>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Our most popular items chosen by customers this week.
          </p>
        </div>

        <div className="flex gap-1 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer"
              style={{
                backgroundColor: activeTab === tab ? "var(--color-primary)" : "var(--color-light-bg)",
                color: activeTab === tab ? "white" : "var(--color-muted)",
                border: `1.5px solid ${activeTab === tab ? "var(--color-primary)" : "var(--color-border)"}`,
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

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
