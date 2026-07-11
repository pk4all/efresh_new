"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { fetchProducts, mapApiProductToProduct } from "@/utils/api";
import ProductCard from "@/components/product/ProductCard";
import { Product } from "@/types";

export default function NewArrivalsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        // Fetch 12 products (offsetting by 12 to show different ones than featured)
        const res = await fetchProducts({ limit: 12, offset: 12, vendor_id: "vendor_test3" });
        const items = res?.data || [];
        setProducts(items.map(mapApiProductToProduct));
      } catch (err) {
        console.error("Failed to load new arrivals:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  return (
    <section className="my-8">
      <div className="flex items-end justify-between mb-5">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-extrabold text-[#222]">New Arrivals</h2>
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="h-[1.5px] w-6 bg-[#0da487]/40" />
              <span className="text-[#0da487] text-sm">✨</span>
              <span className="h-[1.5px] w-6 bg-[#0da487]/40" />
            </div>
          </div>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Freshly stocked items added to our store recently.
          </p>
        </div>
        <Link
          href="/products?filter=new"
          className="flex items-center gap-1 text-sm font-semibold transition-colors hover:underline"
          style={{ color: "var(--color-primary)" }}
        >
          View All <ArrowRight size={14} />
        </Link>
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
